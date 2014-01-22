var fs     = require('fs');
var url    = require('url');
var http   = require('http');
var join   = require('path').join;
var mkdirp = require('mkdirp');
var Router = require('routes-router');

var storage = '/tmp/storage';


var app = Router();

app.addRoute('/:parent/:name', {
    'GET': function (req, res) {
        var filepath = join(storage, url.parse(req.url).pathname);
        fs.createReadStream(filepath).pipe(res);
    },
    'POST': function (req, res, opts) {
        var directory = join(storage, opts.parent);
        mkdirp.sync(directory);

        var file = fs.createWriteStream(join(directory, opts.name));
        req.pipe(file);

        req.on('end', function () {
            res.end('finish');
        });
    }
});

var server = http.createServer(app);
server.listen(9090, function () {
    console.log("web storage server listening on port 9090");
});
