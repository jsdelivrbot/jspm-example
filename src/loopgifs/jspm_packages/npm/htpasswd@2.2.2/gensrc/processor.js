/* */ 
(function(process) {
  (function() {
    var fs,
        prompt,
        utils;
    utils = require('./utils');
    fs = require('fs');
    prompt = require('prompt');
    module.exports = {
      validate: function(program) {
        var expectedArgs;
        expectedArgs = 1;
        if (program.batch) {
          ++expectedArgs;
        }
        if (!program.nofile) {
          ++expectedArgs;
        }
        return expectedArgs === program.args.length;
      },
      readPassword: function(program) {
        var options;
        prompt.message = "";
        prompt.delimiter = "";
        options = [{
          name: 'password',
          description: 'New password:',
          hidden: true
        }, {
          name: 'rePassword',
          description: 'Re-type new password:',
          hidden: true
        }];
        return prompt.get(options, function(err, result) {
          if (!err && result.password === result.rePassword) {
            program.args.push(result.password);
            return module.exports.finalize(program);
          } else {
            return console.error("\nPassword verification error.");
          }
        });
      },
      readPasswordStdIn: function(program) {
        var password;
        password = "";
        process.stdin.on('data', function(chunk) {
          return password += chunk;
        });
        return process.stdin.on('end', function() {
          program.args.push(password);
          return module.exports.finalize(program);
        });
      },
      process: function(program) {
        if (module.exports.validate(program)) {
          if (program.stdin) {
            return module.exports.readPasswordStdIn(program);
          } else if (!program.batch && !program["delete"]) {
            return module.exports.readPassword(program);
          } else {
            return module.exports.finalize(program);
          }
        } else {
          return program.help();
        }
      },
      finalize: function(program) {
        var error,
            hash,
            username;
        if (program.nofile) {
          username = program.args[0];
          hash = utils.encode(program);
          return console.log("" + username + ":" + hash);
        } else {
          try {
            return module.exports.syncFile(program);
          } catch (_error) {
            error = _error;
            return console.error(error.message);
          }
        }
      },
      syncFile: function(program) {
        var found,
            hash,
            i,
            line,
            lines,
            newLines,
            password,
            passwordFile,
            username,
            _i,
            _len,
            _ref;
        passwordFile = program.args[0];
        username = program.args[1];
        password = program.args[2];
        hash = utils.encode(program);
        found = false;
        newLines = [];
        if (!program.create) {
          if (!fs.existsSync(passwordFile)) {
            console.error("Cannot modify file " + passwordFile + "; use '-c' to create it.");
            return;
          }
          lines = (fs.readFileSync(passwordFile, 'UTF-8')).split("\n");
          for (i = _i = 0, _len = lines.length; _i < _len; i = ++_i) {
            line = lines[i];
            if ((line.indexOf("" + username + ":")) === 0) {
              found = true;
              if (program.verify) {
                _ref = line.split(":"), username = _ref[0], hash = _ref[1];
                if (utils.verify(hash, password)) {
                  console.log("Password for user " + username + " correct.");
                } else {
                  console.log("Password verification failed.");
                }
              } else if (program["delete"]) {
                console.log("Deleting password for user " + username + ".");
              } else {
                newLines.push("" + username + ":" + hash);
                console.log("Updating password for user " + username + ".");
              }
            } else if (line) {
              newLines.push(line);
            }
          }
        }
        if (!program.verify) {
          if (!found) {
            if (program["delete"]) {
              console.error("User " + username + " not found.");
            } else {
              newLines.push("" + username + ":" + hash);
              console.log("Adding password for user " + username + ".");
            }
          }
          return fs.writeFileSync(passwordFile, (newLines.join("\n")) + "\n", 'UTF-8');
        }
      }
    };
  }).call(this);
})(require('process'));
