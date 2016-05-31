/* */ 
var util = require('./util');
var inflect = module.exports;
inflect.inflections = require('./inflections');
inflect.inflect = function(inflections_function) {
  inflections_function(inflect.inflections);
};
inflect.camelize = function(lower_case_and_underscored_word, first_letter_in_uppercase) {
  var result;
  if (first_letter_in_uppercase == null)
    first_letter_in_uppercase = true;
  result = util.string.gsub(lower_case_and_underscored_word, /\/(.?)/, function($) {
    return "." + (util.string.upcase($[1]));
  });
  result = util.string.gsub(result, /(?:_)(.)/, function($) {
    return util.string.upcase($[1]);
  });
  if (first_letter_in_uppercase) {
    return util.string.upcase(result);
  } else {
    return util.string.downcase(result);
  }
};
inflect.underscore = function(camel_cased_word) {
  var self;
  self = util.string.gsub(camel_cased_word, /\./, '/');
  self = util.string.gsub(self, /([A-Z]+)([A-Z][a-z])/, "$1_$2");
  self = util.string.gsub(self, /([a-z\d])([A-Z])/, "$1_$2");
  self = util.string.gsub(self, /-/, '_');
  return self.toLowerCase();
};
inflect.dasherize = function(underscored_word) {
  return util.string.gsub(underscored_word, /_/, '-');
};
inflect.demodulize = function(class_name_in_module) {
  return util.string.gsub(class_name_in_module, /^.*\./, '');
};
inflect.foreign_key = function(class_name, separate_class_name_and_id_with_underscore) {
  if (separate_class_name_and_id_with_underscore == null) {
    separate_class_name_and_id_with_underscore = true;
  }
  return inflect.underscore(inflect.demodulize(class_name)) + (separate_class_name_and_id_with_underscore ? "_id" : "id");
};
inflect.ordinalize = function(number) {
  var _ref;
  number = parseInt(number);
  if ((_ref = Math.abs(number) % 100) === 11 || _ref === 12 || _ref === 13) {
    return "" + number + "th";
  } else {
    switch (Math.abs(number) % 10) {
      case 1:
        return "" + number + "st";
      case 2:
        return "" + number + "nd";
      case 3:
        return "" + number + "rd";
      default:
        return "" + number + "th";
    }
  }
};
inflect.uncountability = function(word) {
  return inflect.inflections.uncountables.some(function(ele, ind, arr) {
    return word.match(new RegExp("(\\b|_)" + ele + "$", 'i')) != null;
  });
};
inflect.pluralize = function(word) {
  var plural,
      result;
  result = word;
  if (word === '' || inflect.uncountability(word)) {
    return result;
  } else {
    for (var i = 0; i < inflect.inflections.plurals.length; i++) {
      plural = inflect.inflections.plurals[i];
      result = util.string.gsub(result, plural[0], plural[1]);
      if (word.match(plural[0]) != null)
        break;
    }
    return result;
  }
};
inflect.singularize = function(word) {
  var result,
      singular;
  result = word;
  if (word === '' || inflect.uncountability(word)) {
    return result;
  } else {
    for (var i = 0; i < inflect.inflections.singulars.length; i++) {
      singular = inflect.inflections.singulars[i];
      result = util.string.gsub(result, singular[0], singular[1]);
      if (word.match(singular[0]))
        break;
    }
    return result;
  }
};
inflect.humanize = function(lower_case_and_underscored_word) {
  var human,
      result;
  result = lower_case_and_underscored_word;
  for (var i = 0; i < inflect.inflections.humans.length; i++) {
    human = inflect.inflections.humans[i];
    result = util.string.gsub(result, human[0], human[1]);
  }
  result = util.string.gsub(result, /_id$/, "");
  result = util.string.gsub(result, /_/, " ");
  return util.string.capitalize(result, true);
};
inflect.titleize = function(word) {
  var self;
  self = inflect.humanize(inflect.underscore(word));
  return util.string.capitalize(self);
};
inflect.tableize = function(class_name) {
  return inflect.pluralize(inflect.underscore(class_name));
};
inflect.classify = function(table_name) {
  return inflect.camelize(inflect.singularize(util.string.gsub(table_name, /.*\./, '')));
};
