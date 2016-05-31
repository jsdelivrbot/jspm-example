/* */ 
var prompt = require('../lib/prompt');
prompt.start();
var properties = {properties: {
    animal: {
      description: 'Enter an animal',
      default: 'dog',
      pattern: /dog|cat/
    },
    sound: {
      description: 'What sound does this animal make?',
      conform: function(value) {
        var animal = prompt.history(0).value;
        return animal === 'dog' && value === 'woof' || animal === 'cat' && value === 'meow';
      }
    }
  }};
prompt.get(properties, function(err, result) {
  console.log('Command-line input received:');
  console.log('  animal: ' + result.animal);
  console.log('  sound: ' + result.sound);
});
