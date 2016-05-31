/* */ 
var md5 = require('../lib/apache-md5');
module.exports = {
  testValidPassword: function(test) {
    var encrypted = md5("su/P3R%se#ret!", "$apr1$cF.rAvCe$YlzjmK4qu/ia6hC8CNfnm/");
    test.equal(encrypted, "$apr1$cF.rAvCe$YlzjmK4qu/ia6hC8CNfnm/", "Wrong password!");
    test.done();
  },
  testInValidPassword: function(test) {
    var encrypted = md5("invalidPass", "$apr1$cF.rAvCe$YlzjmK4qu/ia6hC8CNfnm/");
    test.notEqual(encrypted, "$apr1$cF.rAvCe$YlzjmK4qu/ia6hC8CNfnm/", "Wrong password!");
    test.done();
  }
};
