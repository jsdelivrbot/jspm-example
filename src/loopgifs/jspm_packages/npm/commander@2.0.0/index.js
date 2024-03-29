/* */ 
(function(process) {
  var EventEmitter = require('events').EventEmitter;
  var spawn = require('child_process').spawn;
  var fs = require('fs');
  var exists = fs.existsSync;
  var path = require('path');
  var dirname = path.dirname;
  var basename = path.basename;
  exports = module.exports = new Command;
  exports.Command = Command;
  exports.Option = Option;
  function Option(flags, description) {
    this.flags = flags;
    this.required = ~flags.indexOf('<');
    this.optional = ~flags.indexOf('[');
    this.bool = !~flags.indexOf('-no-');
    flags = flags.split(/[ ,|]+/);
    if (flags.length > 1 && !/^[[<]/.test(flags[1]))
      this.short = flags.shift();
    this.long = flags.shift();
    this.description = description || '';
  }
  Option.prototype.name = function() {
    return this.long.replace('--', '').replace('no-', '');
  };
  Option.prototype.is = function(arg) {
    return arg == this.short || arg == this.long;
  };
  function Command(name) {
    this.commands = [];
    this.options = [];
    this._execs = [];
    this._args = [];
    this._name = name;
  }
  Command.prototype.__proto__ = EventEmitter.prototype;
  Command.prototype.command = function(name, desc) {
    var args = name.split(/ +/);
    var cmd = new Command(args.shift());
    if (desc)
      cmd.description(desc);
    if (desc)
      this.executables = true;
    if (desc)
      this._execs[cmd._name] = true;
    this.commands.push(cmd);
    cmd.parseExpectedArgs(args);
    cmd.parent = this;
    if (desc)
      return this;
    return cmd;
  };
  Command.prototype.addImplicitHelpCommand = function() {
    this.command('help [cmd]', 'display help for [cmd]');
  };
  Command.prototype.parseExpectedArgs = function(args) {
    if (!args.length)
      return;
    var self = this;
    args.forEach(function(arg) {
      switch (arg[0]) {
        case '<':
          self._args.push({
            required: true,
            name: arg.slice(1, -1)
          });
          break;
        case '[':
          self._args.push({
            required: false,
            name: arg.slice(1, -1)
          });
          break;
      }
    });
    return this;
  };
  Command.prototype.action = function(fn) {
    var self = this;
    this.parent.on(this._name, function(args, unknown) {
      unknown = unknown || [];
      var parsed = self.parseOptions(unknown);
      outputHelpIfNecessary(self, parsed.unknown);
      if (parsed.unknown.length > 0) {
        self.unknownOption(parsed.unknown[0]);
      }
      if (parsed.args.length)
        args = parsed.args.concat(args);
      self._args.forEach(function(arg, i) {
        if (arg.required && null == args[i]) {
          self.missingArgument(arg.name);
        }
      });
      if (self._args.length) {
        args[self._args.length] = self;
      } else {
        args.push(self);
      }
      fn.apply(this, args);
    });
    return this;
  };
  Command.prototype.option = function(flags, description, fn, defaultValue) {
    var self = this,
        option = new Option(flags, description),
        oname = option.name(),
        name = camelcase(oname);
    if ('function' != typeof fn)
      defaultValue = fn, fn = null;
    if (false == option.bool || option.optional || option.required) {
      if (false == option.bool)
        defaultValue = true;
      if (undefined !== defaultValue)
        self[name] = defaultValue;
    }
    this.options.push(option);
    this.on(oname, function(val) {
      if (null != val && fn)
        val = fn(val);
      if ('boolean' == typeof self[name] || 'undefined' == typeof self[name]) {
        if (null == val) {
          self[name] = option.bool ? defaultValue || true : false;
        } else {
          self[name] = val;
        }
      } else if (null !== val) {
        self[name] = val;
      }
    });
    return this;
  };
  Command.prototype.parse = function(argv) {
    if (this.executables)
      this.addImplicitHelpCommand();
    this.rawArgs = argv;
    this._name = this._name || basename(argv[1]);
    var parsed = this.parseOptions(this.normalize(argv.slice(2)));
    var args = this.args = parsed.args;
    var result = this.parseArgs(this.args, parsed.unknown);
    var name = result.args[0];
    if (this._execs[name])
      return this.executeSubCommand(argv, args, parsed.unknown);
    return result;
  };
  Command.prototype.executeSubCommand = function(argv, args, unknown) {
    args = args.concat(unknown);
    if (!args.length)
      this.help();
    if ('help' == args[0] && 1 == args.length)
      this.help();
    if ('help' == args[0]) {
      args[0] = args[1];
      args[1] = '--help';
    }
    var dir = dirname(argv[1]);
    var bin = basename(argv[1]) + '-' + args[0];
    var local = path.join(dir, bin);
    args = args.slice(1);
    var proc = spawn(local, args, {
      stdio: 'inherit',
      customFds: [0, 1, 2]
    });
    proc.on('error', function(err) {
      if (err.code == "ENOENT") {
        console.error('\n  %s(1) does not exist, try --help\n', bin);
      } else if (err.code == "EACCES") {
        console.error('\n  %s(1) not executable. try chmod or run with root\n', bin);
      }
    });
    this.runningCommand = proc;
  };
  Command.prototype.normalize = function(args) {
    var ret = [],
        arg,
        index;
    for (var i = 0,
        len = args.length; i < len; ++i) {
      arg = args[i];
      if (arg.length > 1 && '-' == arg[0] && '-' != arg[1]) {
        arg.slice(1).split('').forEach(function(c) {
          ret.push('-' + c);
        });
      } else if (/^--/.test(arg) && ~(index = arg.indexOf('='))) {
        ret.push(arg.slice(0, index), arg.slice(index + 1));
      } else {
        ret.push(arg);
      }
    }
    return ret;
  };
  Command.prototype.parseArgs = function(args, unknown) {
    var cmds = this.commands,
        len = cmds.length,
        name;
    if (args.length) {
      name = args[0];
      if (this.listeners(name).length) {
        this.emit(args.shift(), args, unknown);
      } else {
        this.emit('*', args);
      }
    } else {
      outputHelpIfNecessary(this, unknown);
      if (unknown.length > 0) {
        this.unknownOption(unknown[0]);
      }
    }
    return this;
  };
  Command.prototype.optionFor = function(arg) {
    for (var i = 0,
        len = this.options.length; i < len; ++i) {
      if (this.options[i].is(arg)) {
        return this.options[i];
      }
    }
  };
  Command.prototype.parseOptions = function(argv) {
    var args = [],
        len = argv.length,
        literal,
        option,
        arg;
    var unknownOptions = [];
    for (var i = 0; i < len; ++i) {
      arg = argv[i];
      if ('--' == arg) {
        literal = true;
        continue;
      }
      if (literal) {
        args.push(arg);
        continue;
      }
      option = this.optionFor(arg);
      if (option) {
        if (option.required) {
          arg = argv[++i];
          if (null == arg)
            return this.optionMissingArgument(option);
          if ('-' == arg[0] && '-' != arg)
            return this.optionMissingArgument(option, arg);
          this.emit(option.name(), arg);
        } else if (option.optional) {
          arg = argv[i + 1];
          if (null == arg || ('-' == arg[0] && '-' != arg)) {
            arg = null;
          } else {
            ++i;
          }
          this.emit(option.name(), arg);
        } else {
          this.emit(option.name());
        }
        continue;
      }
      if (arg.length > 1 && '-' == arg[0]) {
        unknownOptions.push(arg);
        if (argv[i + 1] && '-' != argv[i + 1][0]) {
          unknownOptions.push(argv[++i]);
        }
        continue;
      }
      args.push(arg);
    }
    return {
      args: args,
      unknown: unknownOptions
    };
  };
  Command.prototype.missingArgument = function(name) {
    console.error();
    console.error("  error: missing required argument `%s'", name);
    console.error();
    process.exit(1);
  };
  Command.prototype.optionMissingArgument = function(option, flag) {
    console.error();
    if (flag) {
      console.error("  error: option `%s' argument missing, got `%s'", option.flags, flag);
    } else {
      console.error("  error: option `%s' argument missing", option.flags);
    }
    console.error();
    process.exit(1);
  };
  Command.prototype.unknownOption = function(flag) {
    console.error();
    console.error("  error: unknown option `%s'", flag);
    console.error();
    process.exit(1);
  };
  Command.prototype.version = function(str, flags) {
    if (0 == arguments.length)
      return this._version;
    this._version = str;
    flags = flags || '-V, --version';
    this.option(flags, 'output the version number');
    this.on('version', function() {
      console.log(str);
      process.exit(0);
    });
    return this;
  };
  Command.prototype.description = function(str) {
    if (0 == arguments.length)
      return this._description;
    this._description = str;
    return this;
  };
  Command.prototype.usage = function(str) {
    var args = this._args.map(function(arg) {
      return arg.required ? '<' + arg.name + '>' : '[' + arg.name + ']';
    });
    var usage = '[options' + (this.commands.length ? '] [command' : '') + ']' + (this._args.length ? ' ' + args : '');
    if (0 == arguments.length)
      return this._usage || usage;
    this._usage = str;
    return this;
  };
  Command.prototype.largestOptionLength = function() {
    return this.options.reduce(function(max, option) {
      return Math.max(max, option.flags.length);
    }, 0);
  };
  Command.prototype.optionHelp = function() {
    var width = this.largestOptionLength();
    return [pad('-h, --help', width) + '  ' + 'output usage information'].concat(this.options.map(function(option) {
      return pad(option.flags, width) + '  ' + option.description;
    })).join('\n');
  };
  Command.prototype.commandHelp = function() {
    if (!this.commands.length)
      return '';
    return ['', '  Commands:', '', this.commands.map(function(cmd) {
      var args = cmd._args.map(function(arg) {
        return arg.required ? '<' + arg.name + '>' : '[' + arg.name + ']';
      }).join(' ');
      return pad(cmd._name + (cmd.options.length ? ' [options]' : '') + ' ' + args, 22) + (cmd.description() ? ' ' + cmd.description() : '');
    }).join('\n').replace(/^/gm, '    '), ''].join('\n');
  };
  Command.prototype.helpInformation = function() {
    return ['', '  Usage: ' + this._name + ' ' + this.usage(), '' + this.commandHelp(), '  Options:', '', '' + this.optionHelp().replace(/^/gm, '    '), '', ''].join('\n');
  };
  Command.prototype.outputHelp = function() {
    process.stdout.write(this.helpInformation());
    this.emit('--help');
  };
  Command.prototype.help = function() {
    this.outputHelp();
    process.exit();
  };
  function camelcase(flag) {
    return flag.split('-').reduce(function(str, word) {
      return str + word[0].toUpperCase() + word.slice(1);
    });
  }
  function pad(str, width) {
    var len = Math.max(0, width - str.length);
    return str + Array(len + 1).join(' ');
  }
  function outputHelpIfNecessary(cmd, options) {
    options = options || [];
    for (var i = 0; i < options.length; i++) {
      if (options[i] == '--help' || options[i] == '-h') {
        cmd.outputHelp();
        process.exit(0);
      }
    }
  }
})(require('process'));
