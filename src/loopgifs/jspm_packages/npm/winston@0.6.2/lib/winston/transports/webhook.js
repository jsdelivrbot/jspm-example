/* */ 
(function(Buffer) {
  var events = require('events'),
      http = require('http'),
      https = require('https'),
      util = require('util'),
      cycle = require('cycle'),
      common = require('../common'),
      Transport = require('./transport').Transport;
  var Webhook = exports.Webhook = function(options) {
    Transport.call(this, options);
    this.name = 'webhook';
    this.host = options.host || 'localhost';
    this.port = options.port || 8080;
    this.method = options.method || 'POST';
    this.path = options.path || '/winston-log';
    if (options.auth) {
      this.auth = {};
      this.auth.username = options.auth.username || '';
      this.auth.password = options.auth.password || '';
    }
    if (options.ssl) {
      this.ssl = {};
      this.ssl.key = options.ssl.key || null;
      this.ssl.cert = options.ssl.cert || null;
      this.ssl.ca = options.ssl.ca;
    }
  };
  util.inherits(Webhook, Transport);
  Webhook.prototype.name = 'webhook';
  Webhook.prototype.log = function(level, msg, meta, callback) {
    if (this.silent) {
      return callback(null, true);
    }
    var self = this,
        meta = cycle.decycle(meta),
        message = common.clone(meta),
        options,
        req;
    options = {
      host: this.host,
      port: this.port,
      path: this.path,
      method: this.method,
      headers: {'Content-Type': 'application/json'}
    };
    if (this.ssl) {
      options.ca = this.ssl.ca;
      options.key = this.ssl.key;
      options.cert = this.ssl.cert;
    }
    if (this.auth) {
      options.headers['Authorization'] = 'Basic ' + new Buffer(this.auth.username + ':' + this.auth.password, 'utf8').toString('base64');
    }
    req = (self.ssl ? https : http).request(options, function(res) {
      self.emit('logged');
      if (callback)
        callback(null, true);
      callback = null;
    });
    req.on('error', function(err) {
      self.emit('error', err);
      if (callback)
        callback(err, false);
      callback = null;
    });
    var params = common.clone(meta) || {};
    params.timestamp = new Date();
    params.message = msg;
    params.level = level;
    req.write(JSON.stringify({
      method: 'log',
      params: params
    }));
    req.end();
  };
})(require('buffer').Buffer);
