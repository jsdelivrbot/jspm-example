/* */ 
var fs = require('fs'),
    path = require('path'),
    util = require('util');
var utile = module.exports;
Object.keys(util).forEach(function(key) {
  utile[key] = util[key];
});
Object.defineProperties(utile, {
  'async': {get: function() {
      return utile.async = require('async');
    }},
  'inflect': {get: function() {
      return utile.inflect = require('i')();
    }},
  'mkdirp': {get: function() {
      return utile.mkdirp = require('mkdirp');
    }},
  'deepEqual': {get: function() {
      return utile.deepEqual = require('deep-equal');
    }},
  'rimraf': {get: function() {
      return utile.rimraf = require('rimraf');
    }},
  'cpr': {get: function() {
      return utile.cpr = require('ncp').ncp;
    }},
  'file': {get: function() {
      return utile.file = require('./file');
    }},
  'args': {get: function() {
      return utile.args = require('./args');
    }},
  'base64': {get: function() {
      return utile.base64 = require('./base64');
    }},
  'format': {get: function() {
      return utile.format = require('./format');
    }}
});
utile.rargs = function(_args, slice) {
  if (!slice) {
    slice = 0;
  }
  var len = (_args || []).length,
      args = new Array(len - slice),
      i;
  for (i = slice; i < len; i++) {
    args[i - slice] = _args[i];
  }
  return args;
};
utile.each = function(obj, iterator) {
  Object.keys(obj).forEach(function(key) {
    iterator(obj[key], key, obj);
  });
};
utile.find = function(obj, pred) {
  var value,
      key;
  for (key in obj) {
    value = obj[key];
    if (pred(value, key)) {
      return value;
    }
  }
};
utile.pad = function pad(str, len, chr) {
  var s;
  if (!chr) {
    chr = ' ';
  }
  str = str || '';
  s = str;
  if (str.length < len) {
    for (var i = 0; i < (len - str.length); i++) {
      s += chr;
    }
  }
  return s;
};
utile.path = function(obj, path) {
  var key,
      i;
  for (i in path) {
    if (typeof obj === 'undefined') {
      return undefined;
    }
    key = path[i];
    obj = obj[key];
  }
  return obj;
};
utile.createPath = function(obj, path, value) {
  var key,
      i;
  for (i in path) {
    key = path[i];
    if (!obj[key]) {
      obj[key] = ((+i + 1 === path.length) ? value : {});
    }
    obj = obj[key];
  }
};
utile.mixin = function(target) {
  utile.rargs(arguments, 1).forEach(function(o) {
    Object.getOwnPropertyNames(o).forEach(function(attr) {
      var getter = Object.getOwnPropertyDescriptor(o, attr).get,
          setter = Object.getOwnPropertyDescriptor(o, attr).set;
      if (!getter && !setter) {
        target[attr] = o[attr];
      } else {
        Object.defineProperty(target, attr, {
          get: getter,
          set: setter
        });
      }
    });
  });
  return target;
};
utile.capitalize = utile.inflect.camelize;
utile.escapeRegExp = function(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};
utile.randomString = function(length) {
  var chars,
      rand,
      i,
      ret,
      mod,
      bits;
  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  ret = '';
  mod = 4;
  bits = length * mod || 64;
  while (bits > 0) {
    rand = Math.floor(Math.random() * 0x100000000);
    for (i = 26; i > 0 && bits > 0; i -= mod, bits -= mod) {
      ret += chars[0x3F & rand >>> i];
    }
  }
  return ret;
};
utile.filter = function(obj, pred) {
  var copy;
  if (Array.isArray(obj)) {
    copy = [];
    utile.each(obj, function(val, key) {
      if (pred(val, key, obj)) {
        copy.push(val);
      }
    });
  } else {
    copy = {};
    utile.each(obj, function(val, key) {
      if (pred(val, key, obj)) {
        copy[key] = val;
      }
    });
  }
  return copy;
};
utile.requireDir = function(directory) {
  var result = {},
      files = fs.readdirSync(directory);
  files.forEach(function(file) {
    if (file.substr(-3) === '.js') {
      file = file.substr(0, file.length - 3);
    }
    result[file] = require(path.resolve(directory, file));
  });
  return result;
};
utile.requireDirLazy = function(directory) {
  var result = {},
      files = fs.readdirSync(directory);
  files.forEach(function(file) {
    if (file.substr(-3) === '.js') {
      file = file.substr(0, file.length - 3);
    }
    Object.defineProperty(result, file, {get: function() {
        return result[file] = require(path.resolve(directory, file));
      }});
  });
  return result;
};
utile.clone = function(object, filter) {
  return Object.keys(object).reduce(filter ? function(obj, k) {
    if (filter(k))
      obj[k] = object[k];
    return obj;
  } : function(obj, k) {
    obj[k] = object[k];
    return obj;
  }, {});
};
utile.camelToUnderscore = function(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    obj.forEach(utile.camelToUnderscore);
    return obj;
  }
  Object.keys(obj).forEach(function(key) {
    var k = utile.inflect.underscore(key);
    if (k !== key) {
      obj[k] = obj[key];
      delete obj[key];
      key = k;
    }
    utile.camelToUnderscore(obj[key]);
  });
  return obj;
};
utile.underscoreToCamel = function(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    obj.forEach(utile.underscoreToCamel);
    return obj;
  }
  Object.keys(obj).forEach(function(key) {
    var k = utile.inflect.camelize(key, false);
    if (k !== key) {
      obj[k] = obj[key];
      delete obj[key];
      key = k;
    }
    utile.underscoreToCamel(obj[key]);
  });
  return obj;
};
