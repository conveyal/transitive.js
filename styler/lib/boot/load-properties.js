
/**
 * Dependencies
 */

var each = require('each');
var properties = require('./css-properties');
var propertyTemplate = require('./property.html');
var select = require('select');
var Sortable = require('sortable');
var svgAttributes = require('svg-attributes');
var transitive = require('./transitive');
var type = require('type');

/**
 * Hold the styler
 */

var styler = transitive.style;

/**
 * All SVG attributes & CSS properties
 */

var attributes =  svgAttributes.concat(properties);
attributes.sort();

/**
 * Get the current styles, generate the components
 */

each([ 'patterns', 'stops', 'labels' ], function(type) {
  var $tab = $('#' + type);
  var selectAttribute = select()
    .label('Edit Attribute');

  selectAttribute.on('select', function(option) {
    $('#' + option.value).css('display', 'block');
  });

  $tab.append(selectAttribute.el);

  each(attributes, function(attribute) {
    var id = type + '-' + attribute;
    var $div = $('<div id="' + id + '"><h3>' + attribute + '</h3></div>');
    var rules = styler[type][attribute];
    var $ul = $('<ul class="properties"></ul>');

    selectAttribute.add(attribute, id);
    $tab.append($div);
    $div.append($ul);

    if (rules && rules.length > 1) {
      each(styler[type][attribute], function(rule) {
        var prop = new Property(type, rule);
        $ul.append(prop.el);
      });

      var sortable = new Sortable($ul[0]);
      sortable.bind();
    } else {
      $div.css('display', 'none');
    }
  });
});

/**
 * Property
 */

function Property(type, rule) {
  if (!(this instanceof Property)) return new Property(type, rule);

  this.el = $(propertyTemplate);

  if (isFunction(rule)) {
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
 * Is f a function?
 */

function isFunction(f) {
  return type(f) === 'function';
}
