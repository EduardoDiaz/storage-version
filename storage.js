var fs     = require('fs');
var http   = require('http');
var join   = require('path').join;
var mkdirp = require('mkdirp');
var Router = require('routes-router');

var storage = '/tmp/storage';


var app = Router();

app.addRoute('/:parent/:name', {
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
    console.log("web service server listening on port 9090");
});
