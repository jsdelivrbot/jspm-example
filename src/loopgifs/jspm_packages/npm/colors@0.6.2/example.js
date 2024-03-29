/* */ 
var colors = require('./colors');
var test = colors.red("hopefully colorless output");
console.log('Rainbows are fun!'.rainbow);
console.log('So '.italic + 'are'.underline + ' styles! '.bold + 'inverse'.inverse);
console.log('Chains are also cool.'.bold.italic.underline.red);
console.log(test.stripColors);
console.log("a".grey + " b".black);
console.log("Zebras are so fun!".zebra);
console.log('background color attack!'.black.whiteBG);
console.log("This is " + "not".strikethrough + " fun.");
console.log(colors.rainbow('Rainbows are fun!'));
console.log(colors.italic('So ') + colors.underline('are') + colors.bold(' styles! ') + colors.inverse('inverse'));
console.log(colors.bold(colors.italic(colors.underline(colors.red('Chains are also cool.')))));
console.log(colors.stripColors(test));
console.log(colors.grey("a") + colors.black(" b"));
colors.addSequencer("america", function(letter, i, exploded) {
  if (letter === " ")
    return letter;
  switch (i % 3) {
    case 0:
      return letter.red;
    case 1:
      return letter.white;
    case 2:
      return letter.blue;
  }
});
colors.addSequencer("random", (function() {
  var available = ['bold', 'underline', 'italic', 'inverse', 'grey', 'yellow', 'red', 'green', 'blue', 'white', 'cyan', 'magenta'];
  return function(letter, i, exploded) {
    return letter === " " ? letter : letter[available[Math.round(Math.random() * (available.length - 1))]];
  };
})());
console.log("AMERICA! F--K YEAH!".america);
console.log("So apparently I've been to Mars, with all the little green men. But you know, I don't recall.".random);
colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});
console.log("this is an error".error);
console.log("this is a warning".warn);
console.log("this is an input".input);
colors.setTheme('./themes/winston-dark.js');
console.log("this is an input".input);
