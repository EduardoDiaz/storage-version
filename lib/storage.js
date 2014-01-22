var v      = require('./version');
var fs     = require('fs');
var qs     = require('querystring');
var url    = require('url');
var join   = require('path').join;
var mkdirp = require('mkdirp');
var Router = require('routes-router');


module.exports = Storage;

function Storage(opts) {
    if (!(this instanceof Storage)) return new Storage(opts);
    var self = this;

    this.handle  = Router();
    this.storage = opts.storage;

    function sendError(res, status, msg) {
        res.statusCode = status;
        res.end(msg);
    }

    function isNotExists(code) {
        if (code === 'ENOENT') {
            return true;
        }
        return false;
    }

    this.handle.addRoute('/:parent[a-z]/:name[a-z]', {
        'GET': function (req, res) {
            var uri     = url.parse(req.url);
            var version = qs.parse(uri.query).version;

            self.get(res, uri.pathname, version, function (err) {
                if (err) {
                    if (isNotExists(err.code)) {
                        sendError(res, 404, 'Not Found');
                    }
                    sendError(res, 500, 'Internal Server Error');
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

Storage.prototype.get = function (ws, pathname, version, cb) {
    var directory = join.bind(null, this.storage, pathname);
    
    function read(version) {
        var filepath = directory(version);
        fs.stat(filepath, function (err) {
            if (err) return cb(err);

            fs.createReadStream(filepath).pipe(ws);
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
    var directory = join.bind(null, this.storage, pathname);
    mkdirp.sync(directory());

    v.next(directory(), function (err, version) {
        var file = fs.createWriteStream(directory(version));
        rs.pipe(file);

        rs.on('end', function () {
            cb(version);
        });
    });
};
