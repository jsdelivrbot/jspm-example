/* */ 
var prompt = require('../lib/prompt');
prompt.start();
var property = {
  name: 'yesno',
  message: 'are you sure?',
  validator: /y[es]*|n[o]?/,
  warning: 'Must respond yes or no',
  default: 'no'
};
prompt.get(property, function(err, result) {
  console.log('Command-line input received:');
  console.log('  result: ' + result.yesno);
});
