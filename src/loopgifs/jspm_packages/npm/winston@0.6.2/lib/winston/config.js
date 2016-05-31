/* */ 
var colors = require('colors');
var config = exports,
    allColors = exports.allColors = {};
config.addColors = function(colors) {
  mixin(allColors, colors);
};
config.colorize = function(level) {
  return level[allColors[level]];
};
config.cli = require('./config/cli-config');
config.npm = require('./config/npm-config');
config.syslog = require('./config/syslog-config');
config.addColors(config.npm.colors);
config.addColors(config.syslog.colors);
function mixin(target) {
  var args = Array.prototype.slice.call(arguments, 1);
  args.forEach(function(a) {
    var keys = Object.keys(a);
    for (var i = 0; i < keys.length; i++) {
      target[keys[i]] = a[keys[i]];
    }
  });
  return target;
}
;
