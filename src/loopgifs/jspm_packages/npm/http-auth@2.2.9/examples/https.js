/* */ 
var https = require('https');
var fs = require('fs');
var auth = require('../gensrc/http-auth');
var basic = auth.basic({
  realm: "Simon Area.",
  file: __dirname + "/../data/users.htpasswd"
});
var options = {
  key: fs.readFileSync(__dirname + "/../data/server.key"),
  cert: fs.readFileSync(__dirname + "/../data/server.crt")
};
https.createServer(basic, options, function(req, res) {
  res.end("Welcome to private area - " + req.user + "!");
}).listen(1337);
console.log("Server running at https://127.0.0.1:1337/");
