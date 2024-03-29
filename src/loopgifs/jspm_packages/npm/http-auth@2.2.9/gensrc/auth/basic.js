/* */ 
(function() {
  var Base,
      Basic,
      htpasswd,
      utils,
      __hasProp = {}.hasOwnProperty,
      __extends = function(child, parent) {
        for (var key in parent) {
          if (__hasProp.call(parent, key))
            child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      };
  Base = require('./base');
  utils = require('./utils');
  htpasswd = require('htpasswd');
  Basic = (function(_super) {
    __extends(Basic, _super);
    function Basic(options, checker) {
      this.options = options;
      this.checker = checker;
      Basic.__super__.constructor.call(this, this.options, this.checker);
    }
    Basic.prototype.processLine = function(line) {
      var hash,
          lineSplit,
          username;
      lineSplit = line.split(":");
      username = lineSplit.shift();
      hash = lineSplit.join(":");
      return this.options.users.push({
        username: username,
        hash: hash
      });
    };
    Basic.prototype.findUser = function(req, hash, callback) {
      var found,
          password,
          splitHash,
          user,
          username,
          _i,
          _len,
          _ref;
      splitHash = (utils.decodeBase64(hash)).split(":");
      username = splitHash.shift();
      password = splitHash.join(":");
      if (this.checker) {
        return this.checker.apply(this, [username, password, (function(_this) {
          return function(success) {
            return callback.apply(_this, [{user: success ? username : void 0}]);
          };
        })(this)]);
      } else {
        _ref = this.options.users;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          user = _ref[_i];
          if (user.username === username && htpasswd.verify(user.hash, password)) {
            found = true;
            break;
          }
        }
        return callback.apply(this, [{user: found ? username : void 0}]);
      }
    };
    Basic.prototype.parseAuthorization = function(header) {
      var hash,
          type,
          _ref;
      _ref = header.split(" "), type = _ref[0], hash = _ref[1];
      if (type === "Basic") {
        return hash;
      }
    };
    Basic.prototype.generateHeader = function() {
      return "Basic realm=\"" + this.options.realm + "\"";
    };
    return Basic;
  })(Base);
  module.exports = function(options, checker) {
    return new Basic(options, checker);
  };
}).call(this);
