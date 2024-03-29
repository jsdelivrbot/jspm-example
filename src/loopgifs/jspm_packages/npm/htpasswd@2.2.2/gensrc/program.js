/* */ 
(function() {
  var program,
      settings,
      utils;
  settings = require('../package.json!systemjs-json');
  program = require('commander');
  utils = require('./utils');
  program.version(settings.version).usage("[options] [passwordfile] username [password]").option('-b, --batch', "Use the password from the command line rather than prompting for it. This option should be used with extreme care, since the password is clearly visible on the command line. For script use see the -i option.").option('-i, --stdin', "Read the password from stdin without verification (for script usage).").option('-c, --create', "Create a new file.").option('-n, --nofile', "Don't update file; display results on stdout.").option('-m, --md5', "Use MD5 encryption for passwords. This is the default.").option('-d, --crypt', "Use crypt() encryption for passwords. This algorithm limits the password length to 8 characters. This algorithm is insecure by today's standards.");
  program.option('-s, --sha', "Use SHA encryption for passwords. This algorithm is insecure by today's standards.").option('-p, --plaintext', "Do not encrypt the password (plaintext).").option('-D, --delete', "Delete the specified user.").option('-v, --verify', "Verify password. Verify that the given password matches the password of the user stored in the specified htpasswd file.");
  program.on('--help', function() {
    return console.log("  Examples: \n    \n    htpasswd [-cimpsDv] passwordfile username\n    htpasswd -b[cmpsDv] passwordfile username password\n\n    htpasswd -n[imps] username\n    htpasswd -nb[mps] username password\n      ");
  });
  module.exports = program;
}).call(this);
