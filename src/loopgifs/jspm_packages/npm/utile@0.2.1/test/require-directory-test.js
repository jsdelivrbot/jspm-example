/* */ 
var assert = require('assert'),
    path = require('path'),
    vows = require('vows'),
    macros = require('./helpers/macros'),
    utile = require('../lib/index');
var requireFixtures = path.join(__dirname, 'fixtures', 'require-directory');
vows.describe('utile/require-directory').addBatch({'When using utile': {
    'the `requireDir()` function': {
      topic: utile.requireDir(requireFixtures),
      'should contain all wanted modules': macros.assertDirectoryRequired
    },
    'the `requireDirLazy()` function': {
      topic: utile.requireDirLazy(requireFixtures),
      'all properties should be getters': function(obj) {
        assert.isObject(obj);
        assert.isTrue(!!Object.getOwnPropertyDescriptor(obj, 'directory').get);
        assert.isTrue(!!Object.getOwnPropertyDescriptor(obj, 'helloWorld').get);
      },
      'should contain all wanted modules': macros.assertDirectoryRequired
    }
  }}).export(module);
