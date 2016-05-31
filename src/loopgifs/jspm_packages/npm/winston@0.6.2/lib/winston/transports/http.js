/* */ 
var util = require('util'),
    winston = require('../../winston'),
    request = require('request'),
    Stream = require('stream').Stream;
var Http = exports.Http = function(options) {
  options = options || {};
  this.name = 'http';
  this.ssl = !!options.ssl;
  this.host = options.host || 'localhost';
  this.port = options.port;
  this.auth = options.auth;
  this.path = options.path || '';
  if (!this.port) {
    this.port = this.ssl ? 443 : 80;
  }
};
util.inherits(Http, winston.Transport);
Http.prototype.name = 'http';
Http.prototype._request = function(options, callback) {
  var options = options || {},
      auth = options.auth || this.auth,
      path = options.path || this.path || '';
  delete options.auth;
  delete options.path;
  options = {json: options};
  options.method = 'POST';
  options.url = 'http' + (this.ssl ? 's' : '') + '://' + (auth ? auth.username + ':' : '') + (auth ? auth.password + '@' : '') + this.host + ':' + this.port + '/' + path;
  return request(options, callback);
};
Http.prototype.log = function(level, msg, meta, callback) {
  var self = this;
  if (typeof meta === 'function') {
    callback = meta;
    meta = {};
  }
  var options = {
    method: 'collect',
    params: {
      level: level,
      message: msg,
      meta: meta
    }
  };
  if (meta.auth) {
    options.auth = meta.auth;
    delete meta.auth;
  }
  if (meta.path) {
    options.path = meta.path;
    delete meta.path;
  }
  this._request(options, function(err, res, body) {
    if (res && res.statusCode !== 200) {
      err = new Error('HTTP Status Code: ' + res.statusCode);
    }
    if (err)
      return callback(err);
    self.emit('logged');
    if (callback)
      callback(null, true);
  });
};
Http.prototype.query = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  var self = this,
      options = this.normalizeQuery(options);
  options = {
    method: 'query',
    params: options
  };
  this._request(options, function(err, res, body) {
    if (res && res.statusCode !== 200) {
      err = new Error('HTTP Status Code: ' + res.statusCode);
    }
    if (err)
      return callback(err);
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return callback(e);
      }
    }
    callback(null, body);
  });
};
Http.prototype.stream = function(options) {
  var self = this,
      options = options || {},
      stream = new Stream,
      req,
      buff;
  stream.destroy = function() {
    req.destroy();
  };
  options = {
    method: 'stream',
    params: options
  };
  req = this._request(options);
  buff = '';
  req.on('data', function(data) {
    var data = (buff + data).split(/\n+/),
        l = data.length - 1,
        i = 0;
    for (; i < l; i++) {
      try {
        stream.emit('log', JSON.parse(data[i]));
      } catch (e) {
        stream.emit('error', e);
      }
    }
    buff = data[l];
  });
  req.on('error', function(err) {
    stream.emit('error', err);
  });
  return stream;
};
