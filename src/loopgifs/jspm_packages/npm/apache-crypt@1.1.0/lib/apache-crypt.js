/* */ 
var lcrypt = require('./interface');
function getSalt() {
  var saltChars = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  return saltChars[parseInt(Math.random() * 64)] + saltChars[parseInt(Math.random() * 64)];
}
module.exports = function(password, salt) {
  return salt ? lcrypt.crypt(password, salt) : lcrypt.crypt(password, getSalt());
};
