/* */ 
var path = require('path'),
    winston = require('../../../lib/winston');
winston.exitOnError = function(err) {
  return err.message !== 'Ignore this error';
};
winston.handleExceptions([new (winston.transports.File)({
  filename: path.join(__dirname, '..', 'logs', 'exit-on-error.log'),
  handleExceptions: true
})]);
setTimeout(function() {
  throw new Error('Ignore this error');
}, 1000);
