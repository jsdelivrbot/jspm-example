/* */ 
var assert = require('assert'),
    utile = require('../../lib/index');
var macros = exports;
macros.assertReadCorrectJson = function(obj) {
  assert.isObject(obj);
  utile.deepEqual(obj, {
    hello: 'World',
    'I am': ['the utile module'],
    thisMakesMe: {
      really: 1337,
      'right?': true
    }
  });
};
macros.assertDirectoryRequired = function(obj) {
  assert.isObject(obj);
  utile.deepEqual(obj, {
    directory: {me: 'directory/index.js'},
    helloWorld: {me: 'helloWorld.js'}
  });
};
