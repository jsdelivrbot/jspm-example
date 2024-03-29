/* */ 
(function() {
  var Base,
      Digest,
      utils,
      uuid,
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
  uuid = require('node-uuid');
  Digest = (function(_super) {
    __extends(Digest, _super);
    function Digest(options, checker) {
      this.options = options;
      this.checker = checker;
      Digest.__super__.constructor.call(this, this.options, this.checker);
      this.nonces = [];
      this.options.algorithm = this.options.algorithm === 'MD5-sess' ? 'MD5-sess' : 'MD5';
      this.options.qop = this.options.qop === 'none' ? '' : 'auth';
    }
    Digest.prototype.processLine = function(line) {
      var hash,
          realm,
          username,
          _ref;
      _ref = line.split(":"), username = _ref[0], realm = _ref[1], hash = _ref[2];
      if (realm === this.options.realm) {
        return this.options.users.push({
          username: username,
          hash: hash
        });
      }
    };
    Digest.prototype.parseAuthorization = function(header) {
      var i,
          len,
          opts,
          param,
          params,
          parts,
          tokens;
      opts = {};
      parts = header.split(' ');
      params = parts.slice(1).join(' ');
      tokens = params.split(/,(?=(?:[^"]|"[^"]*")*$)/);
      if ((parts[0].substr(0, 6)) === "Digest") {
        i = 0;
        len = tokens.length;
        while (i < len) {
          param = /(\w+)=["]?([^"]*)["]?$/.exec(tokens[i]);
          if (param) {
            opts[param[1]] = param[2];
          }
          i++;
        }
      }
      return opts;
    };
    Digest.prototype.validate = function(ha2, co, hash) {
      var ha1,
          response;
      ha1 = hash;
      if (co.algorithm === 'MD5-sess') {
        ha1 = utils.md5("" + ha1 + ":" + co.nonce + ":" + co.cnonce);
      }
      if (co.qop) {
        response = utils.md5("" + ha1 + ":" + co.nonce + ":" + co.nc + ":" + co.cnonce + ":" + co.qop + ":" + ha2);
      } else {
        response = utils.md5("" + ha1 + ":" + co.nonce + ":" + ha2);
      }
      return response === co.response;
    };
    Digest.prototype.findUser = function(req, co, callback) {
      var found,
          ha2,
          user,
          _i,
          _len,
          _ref;
      if (this.validateNonce(co.nonce)) {
        ha2 = utils.md5("" + req.method + ":" + co.uri);
        if (this.checker) {
          return this.checker.apply(this, [co.username, (function(_this) {
            return function(hash) {
              return callback.apply(_this, [{user: _this.validate(ha2, co, hash) ? co.username : void 0}]);
            };
          })(this)]);
        } else {
          _ref = this.options.users;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            user = _ref[_i];
            if (user.username === co.username && this.validate(ha2, co, user.hash)) {
              found = true;
              break;
            }
          }
          return callback.apply(this, [{user: found ? co.username : void 0}]);
        }
      } else {
        return callback.apply(this, [{stale: true}]);
      }
    };
    Digest.prototype.removeNonces = function(noncesToRemove) {
      var index,
          nonce,
          _i,
          _len,
          _results;
      _results = [];
      for (_i = 0, _len = noncesToRemove.length; _i < _len; _i++) {
        nonce = noncesToRemove[_i];
        index = this.nonces.indexOf(nonce);
        if (index !== -1) {
          _results.push(this.nonces.splice(index, 1));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    Digest.prototype.validateNonce = function(nonce) {
      var found,
          noncesToRemove,
          now,
          serverNonce,
          _i,
          _len,
          _ref;
      now = Date.now();
      noncesToRemove = [];
      _ref = this.nonces;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        serverNonce = _ref[_i];
        if ((serverNonce[1] + 3600000) > now) {
          if (serverNonce[0] === nonce) {
            found = true;
          }
        } else {
          noncesToRemove.push(serverNonce);
        }
      }
      this.removeNonces(noncesToRemove);
      return found;
    };
    Digest.prototype.askNonce = function() {
      var nonce;
      nonce = utils.md5(uuid.v4());
      this.nonces.push([nonce, Date.now()]);
      return nonce;
    };
    Digest.prototype.generateHeader = function(result) {
      var nonce,
          stale;
      nonce = this.askNonce();
      stale = result.stale ? true : false;
      return "Digest realm=\"" + this.options.realm + "\", qop=\"" + this.options.qop + "\", nonce=\"" + nonce + "\", algorithm=\"" + this.options.algorithm + "\", stale=\"" + stale + "\"";
    };
    return Digest;
  })(Base);
  module.exports = function(options, checker) {
    return new Digest(options, checker);
  };
}).call(this);
