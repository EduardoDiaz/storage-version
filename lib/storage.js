var v      = require('./version');
var fs     = require('fs');
var url    = require('url');
var mkdirp = require('mkdirp');
var destroy = require('destroy');
var join   = require('path').join;
var qs     = require('querystring');
var Router = require('routes-router');
var onFinished = require('on-finished')
var sendJson = require('send-data/json')


module.exports = Storage;

function Storage(opts) {
  if (!(this instanceof Storage)) return new Storage(opts);
  var self = this;

  this.handle  = Router();
  this.storage = opts.storage;

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

  this.handle.addRoute('/:parent[(a-z|1-9)]/:name[a-z]/latest', {
    'GET': function (req, res) {
      const uri = url.parse(req.url);

      self.get(req, res, uri.pathname, function (err) {
        if (err) {
          if (isNotExists(err.code)) {
            sendError(req, res, 404, 'Not Found');
          }
          sendError(req, res, 500, 'Internal Server Error');
        }
      })
    }
  })

  this.handle.addRoute('/:parent[(a-z|1-9)]/:name[a-z]', {
    'GET': function (req, res) {
      const uri     = url.parse(req.url);
      const name  = qs.parse(uri.query).name
      const version = qs.parse(uri.query).version;

      self.get(res, uri.pathname, version, name, function (err) {
        if (err) {
          if (isNotExists(err.code)) {
            sendError(req, res, 404, 'Not Found');
          }
          sendError(req, res, 500, 'Internal Server Error');
        }
      });
    },
    'PUT': function (req, res)  {
      var pathname = url.parse(req.url).pathname;
      self.put(req, pathname, function (version) {
        res.end(version);
      });
    }
  });
}

Storage.prototype.lastVersion = function (req, res, pathname, cb) {
  const name = qs.parse(uri.query).name
  const pathName = pathname.replace('/latest', '')
  const directory = join.bind(null, this.storage, pathName);

  if (!name) return cb('required querystring => name')

  v.last(directory, function (err, version) {
    if (err) return cb(err)

    sendJson(req, res, {
      body: {
        version: version,
        url: `${pathname}?version=${version}&name=${name}`
      }
    })
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
