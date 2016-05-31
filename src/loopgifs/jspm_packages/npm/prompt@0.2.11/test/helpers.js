/* */ 
(function(process) {
  var stream = require('stream'),
      stream = require('stream'),
      util = require('util'),
      prompt = require('../lib/prompt');
  var helpers = exports;
  var MockReadWriteStream = helpers.MockReadWriteStream = function() {
    var self = this;
    this.on('pipe', function(src) {
      var _emit = src.emit;
      src.emit = function() {
        _emit.apply(src, arguments);
      };
      src.on('data', function(d) {
        self.emit('data', d + '');
      });
    });
  };
  util.inherits(MockReadWriteStream, stream.Stream);
  ['resume', 'pause', 'setEncoding', 'flush', 'end'].forEach(function(method) {
    MockReadWriteStream.prototype[method] = function() {};
  });
  MockReadWriteStream.prototype.write = function(msg) {
    this.emit('data', msg);
    return true;
  };
  MockReadWriteStream.prototype.writeNextTick = function(msg) {
    var self = this;
    process.nextTick(function() {
      self.write(msg);
    });
  };
  helpers.stdin = new MockReadWriteStream();
  helpers.stdout = new MockReadWriteStream();
  helpers.stderr = new MockReadWriteStream();
  helpers.stdin.writeSequence = function(lines) {
    if (!lines || !lines.length) {
      return;
    }
    helpers.stdin.writeNextTick(lines.shift());
    prompt.once('prompt', function() {
      process.nextTick(function() {
        helpers.stdin.writeSequence(lines);
      });
    });
  };
  console.error = function() {
    helpers.stderr.write.apply(helpers.stderr, arguments);
  };
  helpers.schema = {properties: {
      oldschema: {
        message: 'Enter your username',
        validator: /^[\w|\-]+$/,
        warning: 'username can only be letters, numbers, and dashes',
        empty: false
      },
      riffwabbles: {
        pattern: /^[\w|\-]+$/,
        message: 'riffwabbles can only be letters, numbers, and dashes',
        default: 'foobizzles'
      },
      number: {
        type: 'number',
        message: 'pick a number, any number',
        default: 10
      },
      username: {
        pattern: /^[\w|\-]+$/,
        message: 'Username can only be letters, numbers, and dashes'
      },
      notblank: {required: true},
      password: {
        hidden: true,
        required: true
      },
      badValidator: {pattern: ['cant', 'use', 'array']},
      animal: {
        description: 'Enter an animal',
        default: 'dog',
        pattern: /dog|cat/
      },
      sound: {
        description: 'What sound does this animal make?',
        conform: function(value) {
          var animal = prompt.history(0).value;
          return animal === 'dog' && value === 'woof' || animal === 'cat' && value === 'meow';
        }
      },
      fnvalidator: {
        name: 'fnvalidator',
        validator: function(line) {
          return line.slice(0, 2) == 'fn';
        },
        message: 'fnvalidator must start with "fn"'
      },
      fnconform: {
        conform: function(line) {
          return line.slice(0, 2) == 'fn';
        },
        message: 'fnconform must start with "fn"'
      }
    }};
})(require('process'));
