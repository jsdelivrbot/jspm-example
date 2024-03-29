/* */ 
(function() {
  var Base,
      https,
      oldCreateServer;
  https = require('https');
  Base = require('../auth/base');
  oldCreateServer = https.createServer;
  https.createServer = function() {
    var authentication,
        listener,
        newListener,
        server;
    if (arguments[0] instanceof Base) {
      authentication = arguments[0];
      if (arguments[2]) {
        listener = arguments[2];
        newListener = function(req, res) {
          return authentication.check(req, res, listener);
        };
        server = oldCreateServer.apply(https, [arguments[1], newListener]);
      } else {
        server = oldCreateServer.apply(https, [arguments[1]]);
        server.on('request', function(req, res) {
          return authentication.check(req, res);
        });
      }
    } else {
      server = oldCreateServer.apply(https, arguments);
    }
    return server;
  };
}).call(this);
