/* */ 
(function(Buffer, process) {
  var events = require('events'),
      fs = require('fs'),
      path = require('path'),
      util = require('util'),
      colors = require('colors'),
      common = require('../common'),
      Transport = require('./transport').Transport,
      Stream = require('stream').Stream;
  var File = exports.File = function(options) {
    Transport.call(this, options);
    function throwIf(target) {
      Array.prototype.slice.call(arguments, 1).forEach(function(name) {
        if (options[name]) {
          throw new Error('Cannot set ' + name + ' and ' + target + 'together');
        }
      });
    }
    if (options.filename || options.dirname) {
      throwIf('filename or dirname', 'stream');
      this._basename = this.filename = path.basename(options.filename) || 'winston.log';
      this.dirname = options.dirname || path.dirname(options.filename);
      this.options = options.options || {flags: 'a'};
    } else if (options.stream) {
      throwIf('stream', 'filename', 'maxsize');
      this._stream = options.stream;
      this._stream.setMaxListeners(Infinity);
    } else {
      throw new Error('Cannot log to file without filename or stream.');
    }
    this.json = options.json !== false;
    this.colorize = options.colorize || false;
    this.maxsize = options.maxsize || null;
    this.maxFiles = options.maxFiles || null;
    this.prettyPrint = options.prettyPrint || false;
    this.timestamp = options.timestamp != null ? options.timestamp : true;
    if (this.json) {
      this.stringify = options.stringify;
    }
    this._size = 0;
    this._created = 0;
    this._buffer = [];
    this._draining = false;
  };
  util.inherits(File, Transport);
  File.prototype.name = 'file';
  File.prototype.log = function(level, msg, meta, callback) {
    if (this.silent) {
      return callback(null, true);
    }
    var self = this;
    var output = common.log({
      level: level,
      message: msg,
      meta: meta,
      json: this.json,
      colorize: this.colorize,
      prettyPrint: this.prettyPrint,
      timestamp: this.timestamp,
      stringify: this.stringify
    }) + '\n';
    this._size += output.length;
    if (!this.filename) {
      this._write(output, callback);
      this._lazyDrain();
    } else {
      this.open(function(err) {
        if (err) {
          return self._buffer.push([output, callback]);
        }
        self._write(output, callback);
        self._lazyDrain();
      });
    }
  };
  File.prototype._write = function(data, callback) {
    var ret = this._stream.write(data);
    if (!callback)
      return;
    if (ret === false) {
      return this._stream.once('drain', function() {
        callback(null, true);
      });
    }
    callback(null, true);
  };
  File.prototype.query = function(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    var file = path.join(this.dirname, this.filename),
        options = this.normalizeQuery(options),
        buff = '',
        results = [],
        row = 0;
    var stream = fs.createReadStream(file, {encoding: 'utf8'});
    stream.on('error', function(err) {
      if (stream.readable) {
        stream.destroy();
      }
      if (!callback)
        return;
      return err.code !== 'ENOENT' ? callback(err) : callback(null, results);
    });
    stream.on('data', function(data) {
      var data = (buff + data).split(/\n+/),
          l = data.length - 1,
          i = 0;
      for (; i < l; i++) {
        if (!options.start || row >= options.start) {
          add(data[i]);
        }
        row++;
      }
      buff = data[l];
    });
    stream.on('close', function() {
      if (buff)
        add(buff, true);
      if (options.order === 'desc') {
        results = results.reverse();
      }
      if (callback)
        callback(null, results);
    });
    function add(buff, attempt) {
      try {
        var log = JSON.parse(buff);
        if (check(log))
          push(log);
      } catch (e) {
        if (!attempt) {
          stream.emit('error', e);
        }
      }
    }
    function push(log) {
      if (options.rows && results.length >= options.rows) {
        if (stream.readable) {
          stream.destroy();
        }
        return;
      }
      if (options.fields) {
        var obj = {};
        options.fields.forEach(function(key) {
          obj[key] = log[key];
        });
        log = obj;
      }
      results.push(log);
    }
    function check(log) {
      if (!log)
        return;
      if (typeof log !== 'object')
        return;
      var time = new Date(log.timestamp);
      if ((options.from && time < options.from) || (options.until && time > options.until)) {
        return;
      }
      return true;
    }
  };
  File.prototype._tail = function tail(options, callback) {
    var stream = fs.createReadStream(options.file, {encoding: 'utf8'}),
        buff = '',
        destroy,
        row = 0;
    destroy = stream.destroy.bind(stream);
    stream.destroy = function() {};
    if (options.start === -1) {
      delete options.start;
    }
    if (options.start == null) {
      stream.once('end', bind);
    } else {
      bind();
    }
    function bind() {
      stream.on('data', function(data) {
        var data = (buff + data).split(/\n+/),
            l = data.length - 1,
            i = 0;
        for (; i < l; i++) {
          if (options.start == null || row > options.start) {
            stream.emit('line', data[i]);
          }
          row++;
        }
        buff = data[l];
      });
      stream.on('line', function(data) {
        if (callback)
          callback(data);
      });
      stream.on('error', function(err) {
        destroy();
      });
      stream.on('end', function() {
        if (buff) {
          stream.emit('line', buff);
          buff = '';
        }
        resume();
      });
      resume();
    }
    function resume() {
      setTimeout(function() {
        stream.resume();
      }, 1000);
    }
    return destroy;
  };
  File.prototype.stream = function(options) {
    var file = path.join(this.dirname, this.filename),
        options = options || {},
        stream = new Stream;
    var tail = {
      file: file,
      start: options.start
    };
    stream.destroy = this._tail(tail, function(line) {
      try {
        stream.emit('data', line);
        line = JSON.parse(line);
        stream.emit('log', line);
      } catch (e) {
        stream.emit('error', e);
      }
    });
    return stream;
  };
  File.prototype.open = function(callback) {
    if (this.opening) {
      return callback(true);
    } else if (!this._stream || (this.maxsize && this._size >= this.maxsize)) {
      callback(true);
      return this._createStream();
    }
    callback();
  };
  File.prototype.close = function() {
    var self = this;
    if (this._stream) {
      this._stream.end();
      this._stream.destroySoon();
      this._stream.once('drain', function() {
        self.emit('flush');
        self.emit('closed');
      });
    }
  };
  File.prototype.flush = function() {
    var self = this;
    this._buffer.forEach(function(item) {
      var str = item[0],
          callback = item[1];
      process.nextTick(function() {
        self._write(str, callback);
        self._size += str.length;
      });
    });
    self._buffer.length = 0;
    self._stream.once('drain', function() {
      self.emit('flush');
      self.emit('logged');
    });
  };
  File.prototype._createStream = function() {
    var self = this;
    this.opening = true;
    (function checkFile(target) {
      var fullname = path.join(self.dirname, target);
      function createAndFlush(size) {
        if (self._stream) {
          self._stream.end();
          self._stream.destroySoon();
        }
        self._size = size;
        self.filename = target;
        self._stream = fs.createWriteStream(fullname, self.options);
        self._stream.setMaxListeners(Infinity);
        self.once('flush', function() {
          self.opening = false;
          self.emit('open', fullname);
        });
        self.flush();
      }
      fs.stat(fullname, function(err, stats) {
        if (err) {
          if (err.code !== 'ENOENT') {
            return self.emit('error', err);
          }
          return createAndFlush(0);
        }
        if (!stats || (self.maxsize && stats.size >= self.maxsize)) {
          return checkFile(self._getFile(true));
        }
        createAndFlush(stats.size);
      });
    })(this._getFile());
  };
  File.prototype._getFile = function(inc) {
    var self = this,
        ext = path.extname(this._basename),
        basename = path.basename(this._basename, ext),
        remaining;
    if (inc) {
      if (this.maxFiles && (this._created >= (this.maxFiles - 1))) {
        remaining = this._created - (this.maxFiles - 1);
        if (remaining === 0) {
          fs.unlinkSync(path.join(this.dirname, basename + ext));
        } else {
          fs.unlinkSync(path.join(this.dirname, basename + remaining + ext));
        }
      }
      this._created += 1;
    }
    return this._created ? basename + this._created + ext : basename + ext;
  };
  File.prototype._lazyDrain = function() {
    var self = this;
    if (!this._draining && this._stream) {
      this._draining = true;
      this._stream.once('drain', function() {
        this._draining = false;
        self.emit('logged');
      });
    }
  };
})(require('buffer').Buffer, require('process'));
