/* */ 
var winston = require('../lib/winston');
var logger = new (winston.Logger)({transports: [new (winston.transports.Console)(), new (winston.transports.Webhook)({
    'host': 'localhost',
    'port': 8080,
    'path': '/collectdata'
  })]});
logger.log('info', 'Hello webhook log files!', {'foo': 'bar'});
