/* */ 
(function() {
  var Base,
      http,
      oldCreateServer;
  http = require('http');
  Base = require('../auth/base');
  oldCreateServer = http.createServer;
  http.createServer = function() {
    var authentication,
        listener,
        newListener,
        server;
    if (arguments[0] instanceof Base) {
      authentication = arguments[0];
      if (arguments[1]) {
        listener = arguments[1];
        newListener = function(req, res) {
          return authentication.check(req, res, listener);
        };
        server = oldCreateServer.apply(http, [newListener]);
      } else {
        server = oldCreateServer.apply(http, []);
        server.on('request', function(req, res) {
          return authentication.check(req, res);
        });
      }
    } else {
      server = oldCreateServer.apply(http, arguments);
    }
    return server;
  };
}).call(this);
