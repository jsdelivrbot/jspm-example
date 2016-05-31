/* */ 
var events = require('events'),
    util = require('util');
var Transport = exports.Transport = function(options) {
  events.EventEmitter.call(this);
  options = options || {};
  this.level = options.level || 'info';
  this.silent = options.silent || false;
  this.raw = options.raw || false;
  this.handleExceptions = options.handleExceptions || false;
};
util.inherits(Transport, events.EventEmitter);
Transport.prototype.formatQuery = function(query) {
  return query;
};
Transport.prototype.normalizeQuery = function(options) {
  options = options || {};
  options.rows = options.rows || options.limit || 10;
  options.start = options.start || 0;
  options.from = options.from || new Date - (24 * 60 * 60 * 1000);
  if (typeof options.from !== 'object') {
    options.from = new Date(options.from);
  }
  options.until = options.until || new Date;
  if (typeof options.until !== 'object') {
    options.until = new Date(options.until);
  }
  options.order = options.order || 'desc';
  options.fields = options.fields;
  return options;
};
Transport.prototype.formatResults = function(results, options) {
  return results;
};
Transport.prototype.logException = function(msg, meta, callback) {
  var self = this;
  function onLogged() {
    self.removeListener('error', onError);
    callback();
  }
  function onError() {
    self.removeListener('logged', onLogged);
    callback();
  }
  this.once('logged', onLogged);
  this.once('error', onError);
  this.log('error', msg, meta, function() {});
};
