/* */ 
(function(process) {
  var events = require('events'),
      readline = require('readline'),
      utile = require('utile'),
      async = utile.async,
      read = require('read'),
      validate = require('revalidator').validate,
      winston = require('winston');
  readline.Interface.prototype.setPrompt = function(prompt, length) {
    this._prompt = prompt;
    if (length) {
      this._promptLength = length;
    } else {
      var lines = prompt.split(/[\r\n]/);
      var lastLine = lines[lines.length - 1];
      this._promptLength = lastLine.replace(/\u001b\[(\d+(;\d+)*)?m/g, '').length;
    }
  };
  require('pkginfo')(module, 'version');
  var stdin,
      stdout,
      history = [];
  var prompt = module.exports = Object.create(events.EventEmitter.prototype);
  var logger = prompt.logger = new winston.Logger({transports: [new (winston.transports.Console)()]});
  prompt.started = false;
  prompt.paused = false;
  prompt.allowEmpty = false;
  prompt.message = 'prompt';
  prompt.delimiter = ': ';
  prompt.colors = true;
  prompt.properties = {};
  logger.cli();
  prompt.start = function(options) {
    if (prompt.started) {
      return;
    }
    options = options || {};
    stdin = options.stdin || process.stdin;
    stdout = options.stdout || process.stdout;
    prompt.memory = options.memory || 10;
    prompt.allowEmpty = options.allowEmpty || false;
    prompt.message = options.message || prompt.message;
    prompt.delimiter = options.delimiter || prompt.delimiter;
    prompt.colors = options.colors || prompt.colors;
    if (process.platform !== 'win32') {
      process.on('SIGINT', function() {
        stdout.write('\n');
        process.exit(1);
      });
    }
    prompt.emit('start');
    prompt.started = true;
    return prompt;
  };
  prompt.pause = function() {
    if (!prompt.started || prompt.paused) {
      return;
    }
    stdin.pause();
    prompt.emit('pause');
    prompt.paused = true;
    return prompt;
  };
  prompt.resume = function() {
    if (!prompt.started || !prompt.paused) {
      return;
    }
    stdin.resume();
    prompt.emit('resume');
    prompt.paused = false;
    return prompt;
  };
  prompt.history = function(search) {
    if (typeof search === 'number') {
      return history[search] || {};
    }
    var names = history.map(function(pair) {
      return typeof pair.property === 'string' ? pair.property : pair.property.name;
    });
    if (~names.indexOf(search)) {
      return null;
    }
    return history.filter(function(pair) {
      return typeof pair.property === 'string' ? pair.property === search : pair.property.name === search;
    })[0];
  };
  prompt.get = function(schema, callback) {
    function untangle(schema, path) {
      var results = [];
      path = path || [];
      if (schema.properties) {
        Object.keys(schema.properties).forEach(function(key) {
          var obj = {};
          obj[key] = schema.properties[key];
          results = results.concat(untangle(obj[key], path.concat(key)));
        });
        return results;
      }
      return {
        path: path,
        schema: schema
      };
    }
    function iterate(schema, get, done) {
      var iterator = [],
          result = {};
      if (typeof schema === 'string') {
        iterator.push({
          path: [schema],
          schema: prompt.properties[schema.toLowerCase()] || {}
        });
      } else if (Array.isArray(schema)) {
        iterator = schema.map(function(element) {
          if (typeof element === 'string') {
            return {
              path: [element],
              schema: prompt.properties[element.toLowerCase()] || {}
            };
          } else if (element.properties) {
            return {
              path: [Object.keys(element.properties)[0]],
              schema: element.properties[Object.keys(element.properties)[0]]
            };
          } else if (element.path && element.schema) {
            return element;
          } else {
            return {
              path: [element.name || 'question'],
              schema: element
            };
          }
        });
      } else if (schema.properties) {
        iterator = untangle(schema);
      } else {
        iterator = [{
          schema: schema.schema ? schema.schema : schema,
          path: schema.path || [schema.name || 'question']
        }];
      }
      async.forEachSeries(iterator, function(branch, next) {
        get(branch, function assembler(err, line) {
          if (err) {
            return next(err);
          }
          function build(path, line) {
            var obj = {};
            if (path.length) {
              obj[path[0]] = build(path.slice(1), line);
              return obj;
            }
            return line;
          }
          function attach(obj, attr) {
            var keys;
            if (typeof attr !== 'object' || attr instanceof Array) {
              return attr;
            }
            keys = Object.keys(attr);
            if (keys.length) {
              if (!obj[keys[0]]) {
                obj[keys[0]] = {};
              }
              obj[keys[0]] = attach(obj[keys[0]], attr[keys[0]]);
            }
            return obj;
          }
          result = attach(result, build(branch.path, line));
          next();
        });
      }, function(err) {
        return err ? done(err) : done(null, result);
      });
    }
    iterate(schema, function get(target, next) {
      prompt.getInput(target, function(err, line) {
        return err ? next(err) : next(null, line);
      });
    }, callback);
    return prompt;
  };
  prompt.confirm = function() {
    var args = Array.prototype.slice.call(arguments),
        msg = args.shift(),
        callback = args.pop(),
        opts = args.shift(),
        vars = !Array.isArray(msg) ? [msg] : msg,
        RX_Y = /^[yt]{1}/i,
        RX_YN = /^[yntf]{1}/i;
    function confirm(target, next) {
      var yes = target.yes || RX_Y,
          options = utile.mixin({
            description: typeof target === 'string' ? target : target.description || 'yes/no',
            pattern: target.pattern || RX_YN,
            name: 'confirm',
            message: target.message || 'yes/no'
          }, opts || {});
      prompt.get([options], function(err, result) {
        next(err ? false : yes.test(result[options.name]));
      });
    }
    async.rejectSeries(vars, confirm, function(result) {
      callback(null, result.length === 0);
    });
  };
  var tmp = [];
  prompt.getInput = function(prop, callback) {
    var schema = prop.schema || prop,
        propName = prop.path && prop.path.join(':') || prop,
        storedSchema = prompt.properties[propName.toLowerCase()],
        delim = prompt.delimiter,
        defaultLine,
        against,
        hidden,
        length,
        valid,
        name,
        raw,
        msg;
    if (schema instanceof Object && !Object.keys(schema).length && typeof storedSchema !== 'undefined') {
      schema = storedSchema;
    }
    if (typeof prop === 'string' && !storedSchema) {
      schema = {};
    }
    schema = convert(schema);
    defaultLine = schema.default;
    name = prop.description || schema.description || propName;
    raw = prompt.colors ? [prompt.message, delim + name.grey, delim.grey] : [prompt.message, delim + name, delim];
    prop = {
      schema: schema,
      path: propName.split(':')
    };
    if (!schema.properties) {
      schema = (function() {
        var obj = {properties: {}};
        obj.properties[propName] = schema;
        return obj;
      })();
    }
    if (prompt.override && prompt.override[propName]) {
      if (prompt._performValidation(name, prop, prompt.override, schema, -1, callback)) {
        return callback(null, prompt.override[propName]);
      }
      delete prompt.override[propName];
    }
    var type = (schema.properties && schema.properties[name] && schema.properties[name].type || '').toLowerCase().trim(),
        wait = type === 'array';
    if (type === 'array') {
      length = prop.schema.maxItems;
      if (length) {
        msg = (tmp.length + 1).toString() + '/' + length.toString();
      } else {
        msg = (tmp.length + 1).toString();
      }
      msg += delim;
      raw.push(prompt.colors ? msg.grey : msg);
    }
    length = raw.join('').length;
    raw[0] = raw[0];
    msg = raw.join('');
    if (schema.help) {
      schema.help.forEach(function(line) {
        logger.help(line);
      });
    }
    prompt.emit('prompt', prop);
    if (typeof defaultLine === 'undefined') {
      defaultLine = '';
    }
    defaultLine = defaultLine.toString();
    read({
      prompt: msg,
      silent: prop.schema && prop.schema.hidden,
      default: defaultLine,
      input: stdin,
      output: stdout
    }, function(err, line) {
      if (err && wait === false) {
        return callback(err);
      }
      var against = {},
          numericInput,
          isValid;
      if (line !== '') {
        if (schema.properties[name]) {
          var type = (schema.properties[name].type || '').toLowerCase().trim() || undefined;
          if (type == 'number') {
            numericInput = parseFloat(line, 10);
            if (!isNaN(numericInput)) {
              line = numericInput;
            }
          }
          if (type == 'boolean') {
            if (line === "true") {
              line = true;
            }
            if (line === "false") {
              line = false;
            }
          }
          if (type == 'array') {
            var length = prop.schema.maxItems;
            if (err) {
              if (err.message == 'canceled') {
                wait = false;
                stdout.write('\n');
              }
            } else {
              if (length) {
                if (tmp.length + 1 < length) {
                  isValid = false;
                  wait = true;
                } else {
                  isValid = true;
                  wait = false;
                }
              } else {
                isValid = false;
                wait = true;
              }
              tmp.push(line);
            }
            line = tmp;
          }
        }
        against[propName] = line;
      }
      if (prop && prop.schema.before) {
        line = prop.schema.before(line);
      }
      if (isValid === undefined)
        isValid = prompt._performValidation(name, prop, against, schema, line, callback);
      if (!isValid) {
        return prompt.getInput(prop, callback);
      }
      logger.input(line.yellow);
      prompt._remember(propName, line);
      callback(null, line);
      tmp = [];
    });
  };
  prompt._performValidation = function(name, prop, against, schema, line, callback) {
    var numericInput,
        valid,
        msg;
    try {
      valid = validate(against, schema);
    } catch (err) {
      return (line !== -1) ? callback(err) : false;
    }
    if (!valid.valid) {
      msg = line !== -1 ? 'Invalid input for ' : 'Invalid command-line input for ';
      if (prompt.colors) {
        logger.error(msg + name.grey);
      } else {
        logger.error(msg + name);
      }
      if (prop.schema.message) {
        logger.error(prop.schema.message);
      }
      prompt.emit('invalid', prop, line);
    }
    return valid.valid;
  };
  prompt.addProperties = function(obj, properties, callback) {
    properties = properties.filter(function(prop) {
      return typeof obj[prop] === 'undefined';
    });
    if (properties.length === 0) {
      return callback(obj);
    }
    prompt.get(properties, function(err, results) {
      if (err) {
        return callback(err);
      } else if (!results) {
        return callback(null, obj);
      }
      function putNested(obj, path, value) {
        var last = obj,
            key;
        while (path.length > 1) {
          key = path.shift();
          if (!last[key]) {
            last[key] = {};
          }
          last = last[key];
        }
        last[path.shift()] = value;
      }
      Object.keys(results).forEach(function(key) {
        putNested(obj, key.split('.'), results[key]);
      });
      callback(null, obj);
    });
    return prompt;
  };
  prompt._remember = function(property, value) {
    history.unshift({
      property: property,
      value: value
    });
    if (history.length > prompt.memory) {
      history.splice(prompt.memory, history.length - prompt.memory);
    }
  };
  function convert(schema) {
    var newProps = Object.keys(validate.messages),
        newSchema = false,
        key;
    newProps = newProps.concat(['description', 'dependencies']);
    for (key in schema) {
      if (newProps.indexOf(key) > 0) {
        newSchema = true;
        break;
      }
    }
    if (!newSchema || schema.validator || schema.warning || typeof schema.empty !== 'undefined') {
      schema.description = schema.message;
      schema.message = schema.warning;
      if (typeof schema.validator === 'function') {
        schema.conform = schema.validator;
      } else {
        schema.pattern = schema.validator;
      }
      if (typeof schema.empty !== 'undefined') {
        schema.required = !(schema.empty);
      }
      delete schema.warning;
      delete schema.validator;
      delete schema.empty;
    }
    return schema;
  }
})(require('process'));
