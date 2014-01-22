var version = require('../lib/version');
var assert  = require('assert');
var join    = require('path').join;
var temp    = require('temp');
var cnst    = require('constants');
var fs      = require('fs');

/* Helpers */
var RDWR_EXCL = cnst.O_CREAT | cnst.O_TRUNC | cnst.O_RDWR | cnst.O_EXCL;

function tmpVersion( filepath ) {
    fs.openSync(filepath, RDWR_EXCL, 0600);
}

describe('#Version', function () {
    beforeEach(function (done) {
        var self = this;

        temp.mkdir('tmp_directory', function (err, tmpDir) {
            self.tmpDir = tmpDir;
            done(err);
        });
    });

    describe('@version.last', function () {
        it('should return version 0.0.0, if not exists', function (done) {
            version.last(this.tmpDir, function (err, version) {
                assert.equal(version, '0.0.0');
                done(err);
            }); 
        });

        it('should return version 0.0.4 if version 0.0.2, 0.0.3', function (done) {
            tmpVersion(join(this.tmpDir, '0.0.1'));
            tmpVersion(join(this.tmpDir, '0.0.2'));
            tmpVersion(join(this.tmpDir, '0.0.3'));

            version.last(this.tmpDir, function (err, version) {
                assert.equal(version, '0.0.3');
                done(err);
            }); 
        });
    });

    describe('@version.next', function () {
        it('should return version 0.0.2, if version 0.0.1 exists', function (done) {
            tmpVersion(join(this.tmpDir, '0.0.1'));

            version.next(this.tmpDir, function(err, version) {
                assert.equal(version, '0.0.2');
                done(err);
            });
        });
    });

    afterEach(function () {
        temp.cleanup();
    });
});
