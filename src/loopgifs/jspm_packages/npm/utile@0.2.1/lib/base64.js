/* */ 
(function(Buffer) {
  var base64 = exports;
  base64.encode = function(unencoded) {
    var encoded;
    try {
      encoded = new Buffer(unencoded || '').toString('base64');
    } catch (ex) {
      return null;
    }
    return encoded;
  };
  base64.decode = function(encoded) {
    var decoded;
    try {
      decoded = new Buffer(encoded || '', 'base64').toString('utf8');
    } catch (ex) {
      return null;
    }
    return decoded;
  };
})(require('buffer').Buffer);
