
/**
 * Dependencies
 */

var debug = require('debug')('property');
var parseColor = require('color-parser');
var template = require('./template.html');
var type = require('type');
var radioGroup = 0;

/**
 * Expose `Property`
 */

module.exports = Property;

/**
 * Property
 */

function Property(rule, opts) {
  if (!(this instanceof Property)) return new Property(rule, opts);
  opts = opts || {};
  this.el = $(template);
  this.rule = rule;
  this.type = opts.type;

  if (!this.type) {
    this.type = type(rule);
    if (this.type !== 'function' && this.type !== 'boolean') {
      if (parseColor(rule + '')) {
        this.type = 'color';
      } else if (!isNaN(parseFloat(rule))) {
        this.type = 'number';
      }
    }
  }

  debug('create input — %s: %s', this.type, rule);
  this.createInput(opts);

  var self = this;
  this.el.find('.btn-danger').on('click', function() {
    self.destroy();
  });
}

/**
 * Create input
 */

Property.prototype.createInput = function(opts) {
  var $input = this.el.find('.input-group-addon');
  switch(this.type) {
    case 'boolean':
      this.radio = radioGroup;
      this.el.find('.input-group').addClass('input-group-radio');
      $input.after('<label class="radio-inline"><input type="radio" name="radio-' + radioGroup + '" value="true"> On</label>');
      $input.after('<label class="radio-inline"><input type="radio" name="radio-' + radioGroup++ + '" value="false"> Off</label>');
      $input.find('[value="' + this.rule + '"]').prop('checked', true);
      break;
    case 'color':
      $input.after('<input type="color" class="form-control" value="' + this.rule + '">');
      break;
    case 'function':
      var fn = this.rule.toString();
      fn = fn.substring(fn.indexOf('{') + 1, fn.lastIndexOf('}')).trim().replace(/^ {6}/gm, '');
      $input.after('<textarea class="form-control code" rows="' + fn.split('\n').length + '">' + fn + '</textarea>');
      break;
    case 'number':
    case 'pixels':
      $input.after('<input type="number" class="form-control" value="' + parseFloat(this.rule) + '">');
      break;
    case 'range':
      $input.after('<input type"range" class="form-control" value="' + this.rule + '">');
      break;
    case 'string':
      $input.after('<input type="text" class="form-control" value="' + this.rule + '" min="' + (opts.min || 0) + '" max="' + (opts.max || 1000) + '">');
      break;
  }
};

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
  var val;
  switch (this.type) {
    case 'boolean':
      val = this.el.find('[name="radio-' + this.radio + '"][value="true"]').prop('checked');
      break;
    case 'function':
      val = new Function('display', 'data', 'index', 'utils', this.el.find('textarea').val());
      break;
    case 'number':
      val = parseFloat(this.el.find('input').val());
      break;
    case 'pixels':
      val = this.el.find('input').val() + 'px';
      break;
    case 'color':
    case 'string':
      val = this.el.find('input').val();
      break;
  }

  console.log(this.type, val);

  return val;
};

/**
 * Is f a function?
 */

function isFunction(f) {
  return type(f) === 'function';
}
