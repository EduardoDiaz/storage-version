#!/usr/bin/env node
var http     = require('http');
var Storage  = require('..');
var minimist = require('minimist');
var argv     = minimist(process.argv.slice(2), {
    default: {
        port    : 9090,
        storage : '/tmp/storage'
    }
});

var storage = Storage({ storage: argv.storage });
http.createServer(storage.handle).listen(argv.port, function () {
    console.log('web storage server listening on port =>', argv.port);
});
