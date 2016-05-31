/* */ 
(function(process) {
  var events = require('events'),
      util = require('util'),
      async = require('async'),
      config = require('./config'),
      common = require('./common'),
      exception = require('./exception'),
      Stream = require('stream').Stream;
  var ticksPerMillisecond = 10000;
  var Logger = exports.Logger = function(options) {
    events.EventEmitter.call(this);
    options = options || {};
    var self = this,
        handleExceptions = false;
    this.padLevels = options.padLevels || false;
    this.setLevels(options.levels);
    if (options.colors) {
      config.addColors(options.colors);
    }
    this.level = options.level || 'info';
    this.emitErrs = options.emitErrs || false;
    this.stripColors = options.stripColors || false;
    this.exitOnError = typeof options.exitOnError !== 'undefined' ? options.exitOnError : true;
    this.transports = {};
    this.rewriters = [];
    this.exceptionHandlers = {};
    this.profilers = {};
    this._names = [];
    this._hnames = [];
    if (options.transports) {
      options.transports.forEach(function(transport) {
        self.add(transport, null, true);
        if (transport.handleExceptions) {
          handleExceptions = true;
        }
      });
    }
    if (options.rewriters) {
      options.rewriters.forEach(function(rewriter) {
        self.addRewriter(rewriter);
      });
    }
    if (options.exceptionHandlers) {
      handleExceptions = true;
      options.exceptionHandlers.forEach(function(handler) {
        self._hnames.push(handler.name);
        self.exceptionHandlers[handler.name] = handler;
      });
    }
    if (options.handleExceptions || handleExceptions) {
      this.handleExceptions();
    }
  };
  util.inherits(Logger, events.EventEmitter);
  Logger.prototype.extend = function(target) {
    var self = this;
    ['log', 'profile', 'startTimer'].concat(Object.keys(this.levels)).forEach(function(method) {
      target[method] = function() {
        return self[method].apply(self, arguments);
      };
    });
    return this;
  };
  Logger.prototype.log = function(level, msg) {
    var self = this,
        callback,
        meta;
    if (arguments.length === 3) {
      if (typeof arguments[2] === 'function') {
        meta = {};
        callback = arguments[2];
      } else if (typeof arguments[2] === 'object') {
        meta = arguments[2];
      }
    } else if (arguments.length === 4) {
      meta = arguments[2];
      callback = arguments[3];
    }
    if (this.padLevels) {
      msg = new Array(this.levelLength - level.length + 1).join(' ') + msg;
    }
    function onError(err) {
      if (callback) {
        callback(err);
      } else if (self.emitErrs) {
        self.emit('error', err);
      }
      ;
    }
    if (this.transports.length === 0) {
      return onError(new Error('Cannot log with no transports.'));
    } else if (typeof self.levels[level] === 'undefined') {
      return onError(new Error('Unknown log level: ' + level));
    }
    this.rewriters.forEach(function(rewriter) {
      meta = rewriter(level, msg, meta);
    });
    if (this.stripColors) {
      var code = /\u001b\[(\d+(;\d+)*)?m/g;
      msg = ('' + msg).replace(code, '');
    }
    function emit(name, next) {
      var transport = self.transports[name];
      if ((transport.level && self.levels[transport.level] <= self.levels[level]) || (!transport.level && self.levels[self.level] <= self.levels[level])) {
        transport.log(level, msg, meta, function(err) {
          if (err) {
            err.transport = transport;
            cb(err);
            return next();
          }
          self.emit('logging', transport, level, msg, meta);
          next();
        });
      } else {
        next();
      }
    }
    function cb(err) {
      if (callback) {
        if (err)
          return callback(err);
        callback(null, level, msg, meta);
      }
      callback = null;
    }
    async.forEach(this._names, emit, cb);
    return this;
  };
  Logger.prototype.query = function(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    var self = this,
        options = options || {},
        results = {},
        query = common.clone(options.query) || {},
        transports;
    function queryTransport(transport, next) {
      if (options.query) {
        options.query = transport.formatQuery(query);
      }
      transport.query(options, function(err, results) {
        if (err) {
          return next(err);
        }
        next(null, transport.formatResults(results, options.format));
      });
    }
    function addResults(transport, next) {
      queryTransport(transport, function(err, result) {
        result = err || result;
        if (result) {
          results[transport.name] = result;
        }
        next();
      });
    }
    if (options.transport) {
      options.transport = options.transport.toLowerCase();
      return queryTransport(this.transports[options.transport], callback);
    }
    transports = this._names.map(function(name) {
      return self.transports[name];
    }).filter(function(transport) {
      return !!transport.query;
    });
    async.forEach(transports, addResults, function() {
      callback(null, results);
    });
  };
  Logger.prototype.stream = function(options) {
    var self = this,
        options = options || {},
        out = new Stream,
        streams = [],
        transports;
    if (options.transport) {
      var transport = this.transports[options.transport];
      delete options.transport;
      if (transport && transport.stream) {
        return transport.stream(options);
      }
    }
    out._streams = streams;
    out.destroy = function() {
      var i = streams.length;
      while (i--)
        streams[i].destroy();
    };
    transports = this._names.map(function(name) {
      return self.transports[name];
    }).filter(function(transport) {
      return !!transport.stream;
    });
    transports.forEach(function(transport) {
      var stream = transport.stream(options);
      if (!stream)
        return;
      streams.push(stream);
      stream.on('log', function(log) {
        log.transport = log.transport || [];
        log.transport.push(transport.name);
        out.emit('log', log);
      });
      stream.on('error', function(err) {
        err.transport = err.transport || [];
        err.transport.push(transport.name);
        out.emit('error', err);
      });
    });
    return out;
  };
  Logger.prototype.close = function() {
    var self = this;
    this._names.forEach(function(name) {
      var transport = self.transports[name];
      if (transport && transport.close) {
        transport.close();
      }
    });
  };
  Logger.prototype.handleExceptions = function() {
    var args = Array.prototype.slice.call(arguments),
        handlers = [],
        self = this;
    args.forEach(function(a) {
      if (Array.isArray(a)) {
        handlers = handlers.concat(a);
      } else {
        handlers.push(a);
      }
    });
    handlers.forEach(function(handler) {
      self.exceptionHandlers[handler.name] = handler;
    });
    this._hnames = Object.keys(self.exceptionHandlers);
    if (!this.catchExceptions) {
      this.catchExceptions = this._uncaughtException.bind(this);
      process.on('uncaughtException', this.catchExceptions);
    }
  };
  Logger.prototype.unhandleExceptions = function() {
    var self = this;
    if (this.catchExceptions) {
      Object.keys(this.exceptionHandlers).forEach(function(name) {
        if (handler.close) {
          handler.close();
        }
      });
      this.exceptionHandlers = {};
      Object.keys(this.transports).forEach(function(name) {
        var transport = self.transports[name];
        if (transport.handleExceptions) {
          transport.handleExceptions = false;
        }
      });
      process.removeListener('uncaughtException', this.catchExceptions);
      this.catchExceptions = false;
    }
  };
  Logger.prototype.add = function(transport, options, created) {
    var instance = created ? transport : (new (transport)(options));
    if (!instance.name && !instance.log) {
      throw new Error('Unknown transport with no log() method');
    } else if (this.transports[instance.name]) {
      throw new Error('Transport already attached: ' + instance.name);
    }
    this.transports[instance.name] = instance;
    this._names = Object.keys(this.transports);
    instance._onError = this._onError.bind(this, instance);
    instance.on('error', instance._onError);
    if (instance.handleExceptions && !this.catchExceptions) {
      this.handleExceptions();
    }
    return this;
  };
  Logger.prototype.addRewriter = function(rewriter) {
    this.rewriters.push(rewriter);
  };
  Logger.prototype.clear = function() {
    for (var name in this.transports) {
      this.remove({name: name});
    }
  };
  Logger.prototype.remove = function(transport) {
    var name = transport.name || transport.prototype.name;
    if (!this.transports[name]) {
      throw new Error('Transport ' + name + ' not attached to this instance');
    }
    var instance = this.transports[name];
    delete this.transports[name];
    this._names = Object.keys(this.transports);
    if (instance.close) {
      instance.close();
    }
    instance.removeListener('error', instance._onError);
    return this;
  };
  var ProfileHandler = function(logger) {
    this.logger = logger;
    this.start = Date.now();
    this.done = function(msg) {
      var args,
          callback,
          meta;
      args = Array.prototype.slice.call(arguments);
      callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
      meta = typeof args[args.length - 1] === 'object' ? args.pop() : {};
      meta.duration = (Date.now()) - this.start + 'ms';
      return this.logger.info(msg, meta, callback);
    };
  };
  Logger.prototype.startTimer = function() {
    return new ProfileHandler(this);
  };
  Logger.prototype.profile = function(id) {
    var now = Date.now(),
        then,
        args,
        msg,
        meta,
        callback;
    if (this.profilers[id]) {
      then = this.profilers[id];
      delete this.profilers[id];
      args = Array.prototype.slice.call(arguments);
      callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
      meta = typeof args[args.length - 1] === 'object' ? args.pop() : {};
      msg = args.length === 2 ? args[1] : id;
      meta.duration = now - then + 'ms';
      return this.info(msg, meta, callback);
    } else {
      this.profilers[id] = now;
    }
    return this;
  };
  Logger.prototype.setLevels = function(target) {
    return common.setLevels(this, this.levels, target);
  };
  Logger.prototype.cli = function() {
    this.padLevels = true;
    this.setLevels(config.cli.levels);
    config.addColors(config.cli.colors);
    if (this.transports.console) {
      this.transports.console.colorize = true;
      this.transports.console.timestamp = false;
    }
    return this;
  };
  Logger.prototype._uncaughtException = function(err) {
    var self = this,
        responded = false,
        info = exception.getAllInfo(err),
        handlers = this._getExceptionHandlers(),
        timeout,
        doExit;
    doExit = typeof this.exitOnError === 'function' ? this.exitOnError(err) : this.exitOnError;
    function logAndWait(transport, next) {
      transport.logException('uncaughtException', info, next, err);
    }
    function gracefulExit() {
      if (doExit && !responded) {
        clearTimeout(timeout);
        responded = true;
        process.exit(1);
      }
    }
    if (!handlers || handlers.length === 0) {
      return gracefulExit();
    }
    async.forEach(handlers, logAndWait, gracefulExit);
    if (doExit) {
      timeout = setTimeout(gracefulExit, 3000);
    }
  };
  Logger.prototype._getExceptionHandlers = function() {
    var self = this;
    return this._hnames.map(function(name) {
      return self.exceptionHandlers[name];
    }).concat(this._names.map(function(name) {
      return self.transports[name].handleExceptions && self.transports[name];
    })).filter(Boolean);
  };
  Logger.prototype._onError = function(transport, err) {
    if (this.emitErrs) {
      this.emit('error', err, transport);
    }
  };
})(require('process'));
