/* */ 
var prompt = require('../lib/prompt');
prompt.start();
prompt.get([{
  name: 'username',
  validator: /^[a-z]+$/,
  warning: 'Username should consist only lowercase alphabets',
  empty: false
}, {
  name: 'email',
  message: 'Email Address'
}], function(err, result) {
  console.log('Command-line input received:');
  console.log('  username: ' + result.username);
  console.log('  email: ' + result.email);
});
