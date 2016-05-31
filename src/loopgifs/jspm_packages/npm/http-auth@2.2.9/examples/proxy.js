/* */ 
var http = require('http');
var httpProxy = require('http-proxy');
var auth = require('../gensrc/http-auth');
var basic = auth.basic({
  realm: "Simon Area.",
  file: __dirname + "/../data/users.htpasswd"
});
httpProxy.createServer(basic, {target: 'http://localhost:1338'}).listen(1337);
http.createServer(function(req, res) {
  res.end("Request successfully proxied!");
}).listen(1338);
console.log("Server running at http://127.0.0.1:1337/");
