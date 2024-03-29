/* */ 
var crypto = require('crypto'),
    qs = require('querystring');
;
function sha1(key, body) {
  return crypto.createHmac('sha1', key).update(body).digest('base64');
}
function rfc3986(str) {
  return encodeURIComponent(str).replace(/!/g, '%21').replace(/\*/g, '%2A').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27');
  ;
}
function hmacsign(httpMethod, base_uri, params, consumer_secret, token_secret, body) {
  var base = (httpMethod || 'GET') + "&" + encodeURIComponent(base_uri) + "&" + Object.keys(params).sort().map(function(i) {
    return escape(rfc3986(i)) + "%3D" + escape(rfc3986(params[i]));
  }).join("%26");
  var key = encodeURIComponent(consumer_secret) + '&';
  if (token_secret)
    key += encodeURIComponent(token_secret);
  return sha1(key, base);
}
exports.hmacsign = hmacsign;
exports.rfc3986 = rfc3986;
