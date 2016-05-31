/* */ 
var prompt = require('../lib/prompt'),
    optimist = require('optimist');
var schema = {properties: {
    name: {
      pattern: /^[a-zA-Z\s-]+$/,
      message: 'Name must be only letters, spaces, or dashes',
      required: true
    },
    email: {
      name: 'email',
      format: 'email',
      message: 'Must be a valid email address'
    }
  }};
prompt.override = optimist.argv;
prompt.start();
prompt.get(schema, function(err, result) {
  console.log('Command-line input received:');
  console.log('  name: ' + result.name);
  console.log('  email: ' + result.email);
});
