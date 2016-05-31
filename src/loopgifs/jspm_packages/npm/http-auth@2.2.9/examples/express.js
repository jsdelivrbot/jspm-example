/* */ 
var express = require('express');
var auth = require('../gensrc/http-auth');
var basic = auth.basic({
  realm: "Simon Area.",
  file: __dirname + "/../data/users.htpasswd"
});
var app = express();
app.use(auth.connect(basic));
app.get('/', function(req, res) {
  res.send("Hello from express - " + req.user + "!");
});
app.listen(1337);
console.log("Server running at http://127.0.0.1:1337/");
