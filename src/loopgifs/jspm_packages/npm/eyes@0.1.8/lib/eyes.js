/* */ 
(function(process) {
  var eyes = exports,
      stack = [];
  eyes.defaults = {
    styles: {
      all: 'cyan',
      label: 'underline',
      other: 'inverted',
      key: 'bold',
      special: 'grey',
      string: 'green',
      number: 'magenta',
      bool: 'blue',
      regexp: 'green'
    },
    pretty: true,
    hideFunctions: false,
    showHidden: false,
    stream: process.stdout,
    maxLength: 2048
  };
  eyes.inspector = function(options) {
    var that = this;
    return function(obj, label, opts) {
      return that.inspect.call(that, obj, label, merge(options || {}, opts || {}));
    };
  };
  eyes.inspect = function(obj, label, options) {
    options = merge(this.defaults, options || {});
    if (options.stream) {
      return this.print(stringify(obj, options), label, options);
    } else {
      return stringify(obj, options) + (options.styles ? '\033[39m' : '');
    }
  };
  eyes.print = function(str, label, options) {
    for (var c = 0,
        i = 0; i < str.length; i++) {
      if (str.charAt(i) === '\033') {
        i += 4;
      } else if (c === options.maxLength) {
        str = str.slice(0, i - 1) + '…';
        break;
      } else {
        c++;
      }
    }
    return options.stream.write.call(options.stream, (label ? this.stylize(label, options.styles.label, options.styles) + ': ' : '') + this.stylize(str, options.styles.all, options.styles) + '\033[0m' + "\n");
  };
  eyes.stylize = function(str, style, styles) {
    var codes = {
      'bold': [1, 22],
      'underline': [4, 24],
      'inverse': [7, 27],
      'cyan': [36, 39],
      'magenta': [35, 39],
      'blue': [34, 39],
      'yellow': [33, 39],
      'green': [32, 39],
      'red': [31, 39],
      'grey': [90, 39]
    },
        endCode;
    if (style && codes[style]) {
      endCode = (codes[style][1] === 39 && styles.all) ? codes[styles.all][0] : codes[style][1];
      return '\033[' + codes[style][0] + 'm' + str + '\033[' + endCode + 'm';
    } else {
      return str;
    }
  };
  function stringify(obj, options) {
    var that = this,
        stylize = function(str, style) {
          return eyes.stylize(str, options.styles[style], options.styles);
        },
        index,
        result;
    if ((index = stack.indexOf(obj)) !== -1) {
      return stylize(new (Array)(stack.length - index + 1).join('.'), 'special');
    }
    stack.push(obj);
    result = (function(obj) {
      switch (typeOf(obj)) {
        case "string":
          obj = stringifyString(obj.indexOf("'") === -1 ? "'" + obj + "'" : '"' + obj + '"');
          return stylize(obj, 'string');
        case "regexp":
          return stylize('/' + obj.source + '/', 'regexp');
        case "number":
          return stylize(obj + '', 'number');
        case "function":
          return options.stream ? stylize("Function", 'other') : '[Function]';
        case "null":
          return stylize("null", 'special');
        case "undefined":
          return stylize("undefined", 'special');
        case "boolean":
          return stylize(obj + '', 'bool');
        case "date":
          return stylize(obj.toUTCString());
        case "array":
          return stringifyArray(obj, options, stack.length);
        case "object":
          return stringifyObject(obj, options, stack.length);
      }
    })(obj);
    stack.pop();
    return result;
  }
  ;
  function stringifyString(str, options) {
    return str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[\u0001-\u001F]/g, function(match) {
      return '\\0' + match[0].charCodeAt(0).toString(8);
    });
  }
  function stringifyArray(ary, options, level) {
    var out = [];
    var pretty = options.pretty && (ary.length > 4 || ary.some(function(o) {
      return (o !== null && typeof(o) === 'object' && Object.keys(o).length > 0) || (Array.isArray(o) && o.length > 0);
    }));
    var ws = pretty ? '\n' + new (Array)(level * 4 + 1).join(' ') : ' ';
    for (var i = 0; i < ary.length; i++) {
      out.push(stringify(ary[i], options));
    }
    if (out.length === 0) {
      return '[]';
    } else {
      return '[' + ws + out.join(',' + (pretty ? ws : ' ')) + (pretty ? ws.slice(0, -4) : ws) + ']';
    }
  }
  ;
  function stringifyObject(obj, options, level) {
    var out = [];
    var pretty = options.pretty && (Object.keys(obj).length > 2 || Object.keys(obj).some(function(k) {
      return typeof(obj[k]) === 'object';
    }));
    var ws = pretty ? '\n' + new (Array)(level * 4 + 1).join(' ') : ' ';
    var keys = options.showHidden ? Object.keys(obj) : Object.getOwnPropertyNames(obj);
    keys.forEach(function(k) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && !(obj[k] instanceof Function && options.hideFunctions)) {
        out.push(eyes.stylize(k, options.styles.key, options.styles) + ': ' + stringify(obj[k], options));
      }
    });
    if (out.length === 0) {
      return '{}';
    } else {
      return "{" + ws + out.join(',' + (pretty ? ws : ' ')) + (pretty ? ws.slice(0, -4) : ws) + "}";
    }
  }
  ;
  function typeOf(value) {
    var s = typeof(value),
        types = [Object, Array, String, RegExp, Number, Function, Boolean, Date];
    if (s === 'object' || s === 'function') {
      if (value) {
        types.forEach(function(t) {
          if (value instanceof t) {
            s = t.name.toLowerCase();
          }
        });
      } else {
        s = 'null';
      }
    }
    return s;
  }
  function merge() {
    var objs = Array.prototype.slice.call(arguments);
    var target = {};
    objs.forEach(function(o) {
      Object.keys(o).forEach(function(k) {
        if (k === 'styles') {
          if (!o.styles) {
            target.styles = false;
          } else {
            target.styles = {};
            for (var s in o.styles) {
              target.styles[s] = o.styles[s];
            }
          }
        } else {
          target[k] = o[k];
        }
      });
    });
    return target;
  }
})(require('process'));
