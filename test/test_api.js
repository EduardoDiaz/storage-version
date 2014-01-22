var request = require('request');
var format  = require('util').format;
var assert  = require('assert');
var temp    = require('temp');
var fs      = require('fs');

describe('#Storage API', function () {
    var uri = 'http://127.0.0.1:9090/eduardiaz/test';

    before(function () {
       this.file_tmp = temp.openSync();
    });

    describe('PUT /:parent/:name', function () {
        it('should return status 200', function (done) {
            var tmp = fs.createReadStream(this.file_tmp.path);
            tmp.pipe(request.put(uri, function (err, res) {
                    assert.equal(err, null);
                    assert.equal(200, res.statusCode);
                    done();
            }));
        });
    });

    describe('GET /:parent/:name', function () {
        it('should return status 200, version 0.0.1', function (done) {
            var uriqs = format('%s/?version=%s', uri, '0.0.1'); 
            request.get(uriqs, function (err, res) {
                assert.equal(err, null);
                assert.equal(200, res.statusCode);
                done();
            });
        });

        it('should return status 400, version 0.9.9', function (done) {
            var uriqs = format('%s/?version=%s', uri, '0.9.9'); 
            request.get(uriqs, function (err, res) {
                assert.equal(err, null);
                assert.equal(404, res.statusCode);
                done();
            });
        });
    });

    after(function () {
        temp.cleanup();
    });
});
