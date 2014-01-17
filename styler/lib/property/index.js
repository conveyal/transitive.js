
/**
 * Dependencies
 */

var template = require('./template.html');
var type = require('type');

/**
 * Expose `Property`
 */

module.exports = Property;

/**
 * Property
 */

function Property(type, rule) {
  if (!(this instanceof Property)) return new Property(type, rule);

  this.el = $(template);
  this.type = isFunction(rule)
    ? 'function'
    : 'string';

  if (this.type === 'function') {
    var fn = rule.toString();
    fn = fn.substring(fn.indexOf('{') + 1, fn.lastIndexOf('}')).trim();
    this.el.find('.input-group-addon').after('<textarea class="form-control code">' + fn + '</textarea>');
  } else {
    this.el.find('.input-group-addon').after('<input type="text" class="form-control" value="' + rule + '">');
  }

  var self = this;
  this.el.find('.btn-danger').on('click', function() {
    self.destroy();
  });
}

/**
 * Destroy
 */

Property.prototype.destroy = function() {
  this.el.remove();
};

/**
 * Value
 */

Property.prototype.value = function() {
  switch (this.type) {
    case 'color':
      return this.el.find('input').val();
    case 'function':
      return new Function('display', 'data', 'index', 'utils', this.el.find('textarea').val());
    case 'number':
      return parseFloat(this.el.find('input').val());
    case 'string':
      return this.el.find('input').val();
  }
};

/**
 * Is f a function?
 */

function isFunction(f) {
  return type(f) === 'function';
}
