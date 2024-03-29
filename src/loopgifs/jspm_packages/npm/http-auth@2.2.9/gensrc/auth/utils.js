/* */ 
(function(Buffer) {
  (function() {
    var crypto;
    crypto = require('crypto');
    module.exports = {
      md5: function(input) {
        var hash;
        hash = crypto.createHash('md5');
        hash.update(input);
        return hash.digest('hex');
      },
      sha1: function(input) {
        var hash;
        hash = crypto.createHash('sha1');
        hash.update(input);
        return hash.digest('base64');
      },
      base64: function(input) {
        return (new Buffer(input, 'utf8')).toString('base64');
      },
      decodeBase64: function(encoded) {
        return (new Buffer(encoded, 'base64')).toString('utf8');
      },
      isAvailable: function(path) {
        try {
          return !!require.resolve(path);
        } catch (_error) {
          return false;
        }
      }
    };
  }).call(this);
})(require('buffer').Buffer);
