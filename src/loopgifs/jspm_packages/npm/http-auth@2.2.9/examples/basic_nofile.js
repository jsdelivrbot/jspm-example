/* */ 
var http = require('http');
var auth = require('../gensrc/http-auth');
var basic = auth.basic({realm: "Simon Area."}, function(username, password, callback) {
  callback(username === "Tina" && password === "Bullock");
});
http.createServer(basic, function(req, res) {
  res.end("Welcome to private area - " + req.user + "!");
}).listen(1337);
console.log("Server running at http://127.0.0.1:1337/");
