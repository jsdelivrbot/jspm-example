/* */ 
var common = require('./common'),
    winston = require('../winston');
var Container = exports.Container = function(options) {
  this.loggers = {};
  this.options = options || {};
  this.default = {transports: [new winston.transports.Console({
      level: 'silly',
      colorize: false
    })]};
};
Container.prototype.get = Container.prototype.add = function(id, options) {
  if (!this.loggers[id]) {
    options = common.clone(options || this.options || this.default);
    options.transports = options.transports || [];
    if (options.transports.length === 0 && (!options || !options['console'])) {
      options.transports.push(this.default.transports[0]);
    }
    Object.keys(options).forEach(function(key) {
      if (key === 'transports') {
        return;
      }
      var name = common.capitalize(key);
      if (!winston.transports[name]) {
        throw new Error('Cannot add unknown transport: ' + name);
      }
      var namedOptions = options[key];
      namedOptions.id = id;
      options.transports.push(new (winston.transports[name])(namedOptions));
    });
    this.loggers[id] = new winston.Logger(options);
  }
  return this.loggers[id];
};
Container.prototype.has = function(id) {
  return !!this.loggers[id];
};
Container.prototype.close = function(id) {
  var self = this;
  function _close(id) {
    if (!self.loggers[id]) {
      return;
    }
    self.loggers[id].close();
    delete self.loggers[id];
  }
  return id ? _close(id) : Object.keys(this.loggers).forEach(function(id) {
    _close(id);
  });
};
