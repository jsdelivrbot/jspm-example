/* */ 
var prompt = require('../lib/prompt'),
    optimist;
try {
  optimist = require('optimist');
} catch (err) {
  throw new Error(['You need to install optimist before this example will work!', 'Try: `npm install optimist`.'].join('\n'));
}
prompt.override = optimist.argv;
prompt.start();
prompt.get(['username', 'email'], function(err, result) {
  console.log('Command-line input received:');
  console.log('  username: ' + result.username);
  console.log('  email: ' + result.email);
  prompt.pause();
});
