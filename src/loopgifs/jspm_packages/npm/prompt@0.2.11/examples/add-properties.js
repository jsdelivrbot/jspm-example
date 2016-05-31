/* */ 
var prompt = require('../lib/prompt');
prompt.start();
var obj = {
  password: 'lamepassword',
  mindset: 'NY'
};
console.log('Initial object to be extended:');
console.dir(obj);
prompt.addProperties(obj, ['username', 'email'], function(err) {
  console.log('Updated object received:');
  console.dir(obj);
});
