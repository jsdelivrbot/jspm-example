/* */ 
var path = require('path'),
    winston = require('../../../lib/winston');
winston.handleExceptions([new (winston.transports.File)({
  filename: path.join(__dirname, '..', 'logs', 'default-exception.log'),
  handleExceptions: true
})]);
setTimeout(function() {
  throw new Error('OH NOES! It failed!');
}, 1000);
