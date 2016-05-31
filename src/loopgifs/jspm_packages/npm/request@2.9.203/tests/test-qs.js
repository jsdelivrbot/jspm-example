/* */ 
var request = request = require('../main'),
    assert = require('assert');
;
var req1 = request.get({
  uri: 'http://www.google.com',
  qs: {q: 'search'}
});
setTimeout(function() {
  assert.equal('/?q=search', req1.path);
}, 1);
var req2 = request.get({
  uri: 'http://www.google.com?q=abc',
  qs: {q: 'search'}
});
setTimeout(function() {
  assert.equal('/?q=search', req2.path);
}, 1);
var req3 = request.get({
  uri: 'http://www.google.com?x=y',
  qs: {q: 'search'}
});
setTimeout(function() {
  assert.equal('/?x=y&q=search', req3.path);
}, 1);
var req4 = request.get({uri: 'http://www.google.com?x=y'});
setTimeout(function() {
  assert.equal('/?x=y', req4.path);
}, 1);
