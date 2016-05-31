/* */ 
var winston = require('../lib/winston');
var logger = new (winston.Logger)({transports: [new (winston.transports.Console)(), new (winston.transports.Couchdb)({
    'host': 'localhost',
    'db': 'logs'
  })]});
logger.log('info', 'Hello webhook log files!', {'foo': 'bar'});
