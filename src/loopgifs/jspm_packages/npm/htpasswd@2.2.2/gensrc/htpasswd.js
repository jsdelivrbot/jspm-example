/* */ 
(function(process) {
  (function() {
    var processor,
        program;
    if ((typeof htpasswd_is_program) !== "undefined") {
      program = require('./program');
      processor = require('./processor');
      program.parse(process.argv);
      processor.process(program);
    } else {
      module.exports.verify = require('./utils').verify;
    }
  }).call(this);
})(require('process'));
