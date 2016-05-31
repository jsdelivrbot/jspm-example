/* */ 
var util = require('./util');
var Inflections = function() {
  this.plurals = [];
  this.singulars = [];
  this.uncountables = [];
  this.humans = [];
  require('./defaults')(this);
  return this;
};
Inflections.prototype.plural = function(rule, replacement) {
  if (typeof rule == 'string') {
    this.uncountables = util.array.del(this.uncountables, rule);
  }
  this.uncountables = util.array.del(this.uncountables, replacement);
  this.plurals.unshift([rule, replacement]);
};
Inflections.prototype.singular = function(rule, replacement) {
  if (typeof rule == 'string') {
    this.uncountables = util.array.del(this.uncountables, rule);
  }
  this.uncountables = util.array.del(this.uncountables, replacement);
  this.singulars.unshift([rule, replacement]);
};
Inflections.prototype.irregular = function(singular, plural, fullMatchRequired) {
  this.uncountables = util.array.del(this.uncountables, singular);
  this.uncountables = util.array.del(this.uncountables, plural);
  var prefix = "";
  if (fullMatchRequired) {
    prefix = "^";
  }
  if (singular[0].toUpperCase() == plural[0].toUpperCase()) {
    this.plural(new RegExp("(" + prefix + singular[0] + ")" + singular.slice(1) + "$", "i"), '$1' + plural.slice(1));
    this.plural(new RegExp("(" + prefix + plural[0] + ")" + plural.slice(1) + "$", "i"), '$1' + plural.slice(1));
    this.singular(new RegExp("(" + prefix + plural[0] + ")" + plural.slice(1) + "$", "i"), '$1' + singular.slice(1));
  } else {
    this.plural(new RegExp(prefix + (singular[0].toUpperCase()) + singular.slice(1) + "$"), plural[0].toUpperCase() + plural.slice(1));
    this.plural(new RegExp(prefix + (singular[0].toLowerCase()) + singular.slice(1) + "$"), plural[0].toLowerCase() + plural.slice(1));
    this.plural(new RegExp(prefix + (plural[0].toUpperCase()) + plural.slice(1) + "$"), plural[0].toUpperCase() + plural.slice(1));
    this.plural(new RegExp(prefix + (plural[0].toLowerCase()) + plural.slice(1) + "$"), plural[0].toLowerCase() + plural.slice(1));
    this.singular(new RegExp(prefix + (plural[0].toUpperCase()) + plural.slice(1) + "$"), singular[0].toUpperCase() + singular.slice(1));
    this.singular(new RegExp(prefix + (plural[0].toLowerCase()) + plural.slice(1) + "$"), singular[0].toLowerCase() + singular.slice(1));
  }
};
Inflections.prototype.human = function(rule, replacement) {
  this.humans.unshift([rule, replacement]);
};
Inflections.prototype.uncountable = function(words) {
  this.uncountables = this.uncountables.concat(words);
};
Inflections.prototype.clear = function(scope) {
  if (scope == null)
    scope = 'all';
  switch (scope) {
    case 'all':
      this.plurals = [];
      this.singulars = [];
      this.uncountables = [];
      this.humans = [];
    default:
      this[scope] = [];
  }
};
Inflections.prototype.default = function() {
  this.plurals = [];
  this.singulars = [];
  this.uncountables = [];
  this.humans = [];
  require('./defaults')(this);
  return this;
};
module.exports = new Inflections();
