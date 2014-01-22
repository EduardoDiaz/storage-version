var fs        = require('fs');
var semver    = require('semver');
var increment = require('version-incrementer').increment;

function lastVersion(directory, cb) {
    fs.readdir(directory, function (err, files) {
        files = files.filter(function (v) {
            return semver.valid(v);
        });

        if (files.length === 0) return cb(err, '0.0.0');
        var version = semver.maxSatisfying(files, 'x.x.x');
        cb(err, version);
    });
}

function nextVersion(directory, cb) {
    lastVersion(directory, function (err, version) {
        cb(err, increment(version));
    });
}

exports.last = lastVersion;
exports.next = nextVersion;
