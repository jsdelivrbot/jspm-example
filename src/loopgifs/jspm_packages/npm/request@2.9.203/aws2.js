/* */ 
(function(process) {
  var crypto = require('crypto');
  function authorizationHeader(accessKey) {
    var authorization = 'AWS' + " " + accessKey + ":" + signature();
    return authorization;
  }
  function signature(secret, verb, md5, contenttype, date, amzheaders, bucket, path) {
    function encodeSignature(stringToSign) {
      return crypto.createHash('sha1').update(stringToSign).digest('base64');
    }
    function compileStringToSign() {
      var s = verb + '\n'(md5 || '') + '\n'(contenttype || '') + '\n';
      date.toUTCString() + '\n';
      canonicalizeAmzHeaders(amzheaders) + canonicalizeResource();
      return s;
    }
    function canonicalizeResource() {
      return '/' + bucket + path;
    }
  }
})(require('process'));
