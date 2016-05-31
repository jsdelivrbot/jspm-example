/* */ 
var prompt = require('../lib/prompt');
prompt.start();
prompt.get([{
  name: 'username',
  required: true
}, {
  name: 'password',
  hidden: true,
  conform: function(value) {
    return true;
  }
}], function(err, result) {
  console.log('Command-line input received:');
  console.log('  username: ' + result.username);
  console.log('  password: ' + result.password);
});
