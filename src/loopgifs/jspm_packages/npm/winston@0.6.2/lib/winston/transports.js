/* */ 
var fs = require('fs'),
    path = require('path'),
    common = require('./common');
var transports = exports;
fs.readdirSync(path.join(__dirname, 'transports')).forEach(function(file) {
  var transport = file.replace('.js', ''),
      name = common.capitalize(transport);
  if (transport === 'transport') {
    return;
  }
  transports.__defineGetter__(name, function() {
    return require('./transports/' + transport)[name];
  });
});
