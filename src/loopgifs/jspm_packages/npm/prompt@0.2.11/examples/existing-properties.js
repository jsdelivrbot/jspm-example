/* */ 
var prompt = require('../lib/prompt');
prompt.properties = {
  email: {
    format: 'email',
    message: 'Must be a valid email address'
  },
  password: {hidden: true}
};
prompt.start();
prompt.get(['email', 'password'], function(err, result) {
  console.log('Command-line input received:');
  console.log('  email: ' + result.email);
  console.log('  password: ' + result.password);
});
