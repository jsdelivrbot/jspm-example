/* */ 
(function() {
  var crypt,
      crypto,
      md5;
  crypto = require('crypto');
  md5 = require('apache-md5');
  crypt = require('apache-crypt');
  module.exports = {
    crypt3: function(password, hash) {
      return crypt(password, hash);
    },
    sha1: function(password) {
      var hash;
      hash = crypto.createHash('sha1');
      hash.update(password);
      return hash.digest('base64');
    },
    verify: function(hash, password) {
      if ((hash.substr(0, 5)) === '{SHA}') {
        hash = hash.substr(5);
        return hash === module.exports.sha1(password);
      } else if ((hash.substr(0, 6)) === '$apr1$') {
        return hash === md5(password, hash);
      } else {
        return (hash === password) || ((module.exports.crypt3(password, hash)) === hash);
      }
    },
    encode: function(program) {
      var password;
      if (!program["delete"]) {
        password = program.args[program.args.length - 1];
        if (!program.plaintext) {
          if (program.crypt) {
            password = module.exports.crypt3(password);
          } else if (program.sha) {
            password = '{SHA}' + module.exports.sha1(password);
          } else {
            password = md5(password);
          }
        }
        return password;
      }
    }
  };
}).call(this);
