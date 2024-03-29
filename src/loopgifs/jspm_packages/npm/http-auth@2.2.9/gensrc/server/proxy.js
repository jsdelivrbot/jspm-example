/* */ 
(function() {
  var Base,
      httpProxy,
      oldCreateServer;
  httpProxy = require('http-proxy');
  Base = require('../auth/base');
  oldCreateServer = httpProxy.createServer;
  httpProxy.createServer = httpProxy.createProxyServer = httpProxy.createProxy = function(authentication, options) {
    var oldProxyRequest,
        server;
    if (authentication instanceof Base) {
      authentication.proxy = true;
    } else {
      options = authentication;
      authentication = null;
    }
    server = oldCreateServer.apply(httpProxy, [options]);
    if (authentication) {
      oldProxyRequest = server.web;
      server.web = function(req, res) {
        var externalArguments;
        externalArguments = arguments;
        return authentication.check(req, res, function() {
          return oldProxyRequest.apply(server, externalArguments);
        });
      };
    }
    return server;
  };
}).call(this);
