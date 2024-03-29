/* */ 
(function() {
  require('./server/http');
  require('./server/https');
  if (require('./auth/utils').isAvailable('http-proxy')) {
    require('./server/proxy');
  }
  module.exports = {
    basic: function(options, checker) {
      return require('./auth/basic')(options, checker);
    },
    digest: function(options, checker) {
      return require('./auth/digest')(options, checker);
    },
    connect: function(authentication) {
      return require('./server/connect')(authentication);
    }
  };
}).call(this);
