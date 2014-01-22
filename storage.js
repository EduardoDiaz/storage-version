#!/usr/bin/env node
var fs     = require('fs');
var qs     = require('querystring');
var url    = require('url');
var http   = require('http');
var join   = require('path').join;
var mkdirp = require('mkdirp');
var semver = require('semver');
var Router = require('routes-router');

var increment = require('version-incrementer').increment;

var storage = '/tmp/storage';

function sendError(res, status, msg) {
    res.statusCode = status;
    res.end(msg);
}

function lastVersion(directory, cb) {
    fs.readdir(directory, function (err, files) {
        files = files.filter(function (v) {
            return semver.valid(v);
        });

        if (files.length === 0) cb(err, '0.0.1');
        var version = semver.maxSatisfying(files, 'x.x.x');
        cb(err, version);
    });
}

function nextVersion(directory, cb) {
    lastVersion(directory, function (err, version) {
        console.log(version);
        cb(err, increment(version));
    });
}

var app = Router();

app.addRoute('/:parent[a-z]/:name[a-z]', {
    'GET': function (req, res) {
        var uriObj    = url.parse(req.url);
        var directory = join(storage, uriObj.pathname);
        var version   = qs.parse(uriObj.query).version;

        function statError(res, err) {
            if (err.code === 'ENOENT') {
                sendError(res, 404, 'Not Found');
            }
            sendError(res, 500, 'Internal Server Error');
        }

        function read(version) {
            var filepath = join(directory, version);
            fs.stat(filepath, function (err, file) {
                if (err) return statError(res, err);
                fs.createReadStream(filepath).pipe(res);
            });
        }

        if (version) {
            read(version); 
        } else {
            lastVersion(directory, function (err, version) {
               read(version); 
            });
        }
    },
    'PUT': function (req, res) {
        var directory = join(storage, url.parse(req.url).pathname);
        mkdirp.sync(directory);

        nextVersion(directory, function (err, version) {
            var file = fs.createWriteStream(join(directory, version));
            req.pipe(file);

            req.on('end', function () {
                res.end(version);
            });
        });
    }
});

var server = http.createServer(app);
server.listen(9090, function () {
    console.log("web storage server listening on port 9090");
});
