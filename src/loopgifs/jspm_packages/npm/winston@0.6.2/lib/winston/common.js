/* */ 
(function(Buffer) {
  var util = require('util'),
      crypto = require('crypto'),
      cycle = require('cycle'),
      config = require('./config');
  exports.setLevels = function(target, past, current, isDefault) {
    if (past) {
      Object.keys(past).forEach(function(level) {
        delete target[level];
      });
    }
    target.levels = current || config.npm.levels;
    if (target.padLevels) {
      target.levelLength = exports.longestElement(Object.keys(target.levels));
    }
    Object.keys(target.levels).forEach(function(level) {
      target[level] = function(msg) {
        var args = Array.prototype.slice.call(arguments),
            callback = typeof args[args.length - 1] === 'function' || !args[args.length - 1] ? args.pop() : null,
            meta = args.length === 2 ? args.pop() : null;
        return target.log(level, msg, meta, callback);
      };
    });
    return target;
  };
  exports.longestElement = function(xs) {
    return Math.max.apply(null, xs.map(function(x) {
      return x.length;
    }));
  };
  exports.clone = function(obj) {
    if (!(obj instanceof Object)) {
      return obj;
    } else if (obj instanceof Date) {
      return obj;
    }
    var copy = {};
    for (var i in obj) {
      if (Array.isArray(obj[i])) {
        copy[i] = obj[i].slice(0);
      } else if (obj[i] instanceof Buffer) {
        copy[i] = obj[i].slice(0);
      } else if (typeof obj[i] != 'function') {
        copy[i] = obj[i] instanceof Object ? exports.clone(obj[i]) : obj[i];
      }
    }
    return copy;
  };
  exports.log = function(options) {
    var timestampFn = typeof options.timestamp === 'function' ? options.timestamp : exports.timestamp,
        timestamp = options.timestamp ? timestampFn() : null,
        meta = options.meta ? exports.clone(cycle.decycle(options.meta)) : null,
        output;
    if (options.raw) {
      if (typeof meta !== 'object' && meta != null) {
        meta = {meta: meta};
      }
      output = exports.clone(meta) || {};
      output.level = options.level;
      output.message = options.message.stripColors;
      return JSON.stringify(output);
    }
    if (options.json) {
      if (typeof meta !== 'object' && meta != null) {
        meta = {meta: meta};
      }
      output = exports.clone(meta) || {};
      output.level = options.level;
      output.message = options.message;
      if (timestamp) {
        output.timestamp = timestamp;
      }
      if (typeof options.stringify === 'function') {
        return options.stringify(output);
      }
      return JSON.stringify(output, function(key, value) {
        return value instanceof Buffer ? value.toString('base64') : value;
      });
    }
    output = timestamp ? timestamp + ' - ' : '';
    output += options.colorize ? config.colorize(options.level) : options.level;
    output += (': ' + options.message);
    if (meta) {
      if (typeof meta !== 'object') {
        output += ' ' + meta;
      } else if (Object.keys(meta).length > 0) {
        output += ' ' + (options.prettyPrint ? ('\n' + util.inspect(meta, false, null, options.colorize)) : exports.serialize(meta));
      }
    }
    return output;
  };
  exports.capitalize = function(str) {
    return str && str[0].toUpperCase() + str.slice(1);
  };
  exports.hash = function(str) {
    return crypto.createHash('sha1').update(str).digest('hex');
  };
  exports.pad = function(n) {
    return n < 10 ? '0' + n.toString(10) : n.toString(10);
  };
  exports.timestamp = function() {
    return new Date().toISOString();
  };
  exports.serialize = function(obj, key) {
    if (obj === null) {
      obj = 'null';
    } else if (obj === undefined) {
      obj = 'undefined';
    } else if (obj === false) {
      obj = 'false';
    }
    if (typeof obj !== 'object') {
      return key ? key + '=' + obj : obj;
    }
    if (obj instanceof Buffer) {
      return key ? key + '=' + obj.toString('base64') : obj.toString('base64');
    }
    var msg = '',
        keys = Object.keys(obj),
        length = keys.length;
    for (var i = 0; i < length; i++) {
      if (Array.isArray(obj[keys[i]])) {
        msg += keys[i] + '=[';
        for (var j = 0,
            l = obj[keys[i]].length; j < l; j++) {
          msg += exports.serialize(obj[keys[i]][j]);
          if (j < l - 1) {
            msg += ', ';
          }
        }
        msg += ']';
      } else if (obj[keys[i]] instanceof Date) {
        msg += keys[i] + '=' + obj[keys[i]];
      } else {
        msg += exports.serialize(obj[keys[i]], keys[i]);
      }
      if (i < length - 1) {
        msg += ', ';
      }
    }
    return msg;
  };
})(require('buffer').Buffer);
