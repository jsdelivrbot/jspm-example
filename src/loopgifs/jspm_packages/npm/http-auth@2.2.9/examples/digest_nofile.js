/* */ 
require('coffee-script');
var utils = require('../gensrc/auth/utils');
var http = require('http');
var auth = require('../gensrc/http-auth');
var digest = auth.digest({realm: "Simon Area."}, function(username, callback) {
  if (username === "simon") {
    callback(utils.md5("simon:Simon Area.:smart"));
  } else if (username === "tigran") {
    callback(utils.md5("tigran:Simon Area.:great"));
  } else {
    callback();
  }
});
http.createServer(digest, function(req, res) {
  res.end("Welcome to private area - " + req.user + "!");
}).listen(1337);
console.log("Server running at http://127.0.0.1:1337/");
