/* */ 
var utile = require('./index');
module.exports = function(_args) {
  var args = utile.rargs(_args),
      _cb;
  Object.defineProperty(args, 'first', {value: args[0]});
  _cb = args[args.length - 1] || args[args.length];
  if (typeof _cb === "function") {
    Object.defineProperty(args, 'callback', {value: _cb});
    Object.defineProperty(args, 'cb', {value: _cb});
    args.pop();
  }
  if (args.length) {
    Object.defineProperty(args, 'last', {value: args[args.length - 1]});
  }
  return args;
};
