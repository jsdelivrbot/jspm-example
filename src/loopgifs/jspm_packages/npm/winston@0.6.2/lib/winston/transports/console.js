/* */ 
(function(process) {
  var events = require('events'),
      util = require('util'),
      colors = require('colors'),
      common = require('../common'),
      Transport = require('./transport').Transport;
  var Console = exports.Console = function(options) {
    Transport.call(this, options);
    options = options || {};
    this.name = 'console';
    this.json = options.json || false;
    this.colorize = options.colorize || false;
    this.prettyPrint = options.prettyPrint || false;
    this.timestamp = typeof options.timestamp !== 'undefined' ? options.timestamp : false;
    if (this.json) {
      this.stringify = options.stringify || function(obj) {
        return JSON.stringify(obj, null, 2);
      };
    }
  };
  util.inherits(Console, Transport);
  Console.prototype.name = 'console';
  Console.prototype.log = function(level, msg, meta, callback) {
    if (this.silent) {
      return callback(null, true);
    }
    var self = this,
        output;
    output = common.log({
      colorize: this.colorize,
      json: this.json,
      level: level,
      message: msg,
      meta: meta,
      stringify: this.stringify,
      timestamp: this.timestamp,
      prettyPrint: this.prettyPrint,
      raw: this.raw
    });
    if (level === 'error' || level === 'debug') {
      console.error(output);
    } else {
      console.log(output);
    }
    self.emit('logged');
    callback(null, true);
  };
})(require('process'));
