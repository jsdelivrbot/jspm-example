/* */ 
var winston = exports;
require('pkginfo')(module, 'version');
winston.transports = require('./winston/transports');
var common = require('./winston/common');
winston.hash = common.hash;
winston.clone = common.clone;
winston.longestElement = common.longestElement;
winston.exception = require('./winston/exception');
winston.config = require('./winston/config');
winston.addColors = winston.config.addColors;
winston.Container = require('./winston/container').Container;
winston.Logger = require('./winston/logger').Logger;
winston.Transport = require('./winston/transports/transport').Transport;
winston.loggers = new winston.Container();
var defaultLogger = new winston.Logger({transports: [new winston.transports.Console()]});
var methods = ['log', 'query', 'stream', 'add', 'remove', 'profile', 'startTimer', 'extend', 'cli', 'handleExceptions', 'unhandleExceptions'];
common.setLevels(winston, null, defaultLogger.levels);
methods.forEach(function(method) {
  winston[method] = function() {
    return defaultLogger[method].apply(defaultLogger, arguments);
  };
});
winston.cli = function() {
  winston.padLevels = true;
  common.setLevels(winston, defaultLogger.levels, winston.config.cli.levels);
  defaultLogger.setLevels(winston.config.cli.levels);
  winston.config.addColors(winston.config.cli.colors);
  if (defaultLogger.transports.console) {
    defaultLogger.transports.console.colorize = true;
    defaultLogger.transports.console.timestamp = false;
  }
  return winston;
};
winston.setLevels = function(target) {
  common.setLevels(winston, defaultLogger.levels, target);
  defaultLogger.setLevels(target);
};
['emitErrs', 'exitOnError', 'padLevels', 'level', 'levelLength', 'stripColors'].forEach(function(prop) {
  Object.defineProperty(winston, prop, {
    get: function() {
      return defaultLogger[prop];
    },
    set: function(val) {
      defaultLogger[prop] = val;
    }
  });
});
Object.defineProperty(winston, 'default', {get: function() {
    return {
      transports: defaultLogger.transports,
      exceptionHandlers: defaultLogger.exceptionHandlers
    };
  }});
