/* */ 
var util = require('util'),
    pkginfo = require('../lib/pkginfo')(module);
exports.someFunction = function() {
  console.log('some of your custom logic here');
};
console.log('Inspecting module:');
console.dir(module.exports);
console.log('\nAll exports exposed:');
console.error(Object.keys(module.exports));
