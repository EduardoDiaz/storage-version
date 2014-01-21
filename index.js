var fs = require('fs');
var http   = require('http');
var Router = require('routes-router');

var router = Router();

router.addRoute('/', function (req, res) {
   var f = fs.createWriteStream('/tmp/test.tgz');
   req.pipe(f);
});

var server = http.createServer(router);
server.listen(process.argv[2]);
