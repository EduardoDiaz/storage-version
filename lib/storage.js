const v      = require('./version');
const fs     = require('fs');
const url    = require('url');
const mkdirp = require('mkdirp');
const destroy = require('destroy');
const join   = require('path').join;
const qs     = require('querystring');
const Router = require('routes-router');
const onFinished = require('on-finished')
const sendJson = require('send-data/json')



const logger = morgan('combined')

function sendError(req, res, status, msg) {
  sendJson(req, res, {
    body: {
      message: msg
    },
    statusCode: status
  })
}

function isNotExists(code) {
  if (code === 'ENOENT') {
    return true;
  }
  return false;
}

module.exports = function Storage(opts) {
  if (!(this instanceof Storage))
    return new Storage(opts);

  const self = this;

  this.handle  = Router();
  this.storage = opts.storage;

  this.handle.addRoute('/:parent[(a-z|1-9)]/:name[a-z]/latest', {
    'GET': function (req, res) {
      const done = finalhandler(req, res)

      const fn = function (err) {
        if (err) return done()

        self.lastVersion(req, res, function (err) {
          if (err) {
            if (isNotExists(err.code)) {
              sendError(req, res, 404, 'Not Found');
            } else {
              sendError(req, res, 500, err);
            }
          }
        })
      }

      logger(req, res, fn)
    }
  })

  this.handle.addRoute('/:parent[(a-z|1-9)]/:name[a-z]', {
    'GET': function (req, res) {
      const uri   = url.parse(req.url);
      const done = finalhandler(req, res)
      const name  = qs.parse(uri.query).name
      const version = qs.parse(uri.query).version;

      const fn = function (err) {
        if (err) return done()

        self.get(res, uri.pathname, version, name, function (err) {
          if (err) {
            if (isNotExists(err.code)) {
              sendError(req, res, 404, 'Not Found');
            } else {
              sendError(req, res, 500, 'Internal Server Error');
            }
          }
        })
      }

      logger(req, res, fn)
    },
    'PUT': function (req, res)  {
      const done = finalhandler(req, res)
      const pathname = url.parse(req.url).pathname;

      const fn = function (err) {
        if (err) return done()

        self.put(req, pathname, function (version) {
          sendJson(req, res, {
            version: version
          })
        });
      }

      logger(req, res, fn)
    }
  });
}

Storage.prototype.lastVersion = function (req, res, cb) {
  const uri   = url.parse(req.url);
  const name  = qs.parse(uri.query).name
  const pathName = url.parse(uri).pathname.replace('/latest', '')
  const directory = join.bind(null, this.storage, pathName);

  if (!name) return cb('Required name')

  v.last(directory(), function (err, version) {
    if (err) return cb(err)

    sendJson(req, res, {
      version: version,
      url: `${pathName}?version=${version}&name=${name}`
    })

    cb(null)
  })
}

Storage.prototype.get = function (ws, pathname, version, name, cb) {
  const directory = join.bind(null, this.storage, pathname);

  function read(version) {
    const filepath = directory(version);

    fs.stat(filepath, function (err) {
      if (err) return cb(err);

      ws.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition" : `attachment; filename=${name}`
      })

      let stream = fs.createReadStream(filepath)

      stream.pipe(ws);

      onFinished(ws, function (err) {
        destroy(stream)
      })

      cb(null);
    });
  }

  function getVersion(version, next) {
    if (version) {
      next(null, version);
    } else {
      v.last(directory(), next);
    }
  }

  getVersion(version, function (err, version) {
    if (err) return cb(err)

    read(version);
  });
};

Storage.prototype.put = function (rs, pathname, cb) {
  const directory = join.bind(null, this.storage, pathname);
  mkdirp.sync(directory());

  v.next(directory(), function (err, version) {
    const file = fs.createWriteStream(directory(version), { flags: 'w', encoding: 'binary' });

    rs.pipe(file);

    rs.on('end', function () {
      cb(version);
    });
  });
};
