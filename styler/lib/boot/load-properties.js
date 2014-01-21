
/**
 * Dependencies
 */

var each = require('each');
var properties = require('./css-properties');
var Property = require('property');
var select = require('select');
var Sortable = require('sortable');
var svgAttributes = require('svg-attributes');
var transitive = require('./transitive');

/**
 * Expose `loadProperties`
 */

module.exports = loadProperties;

/**
 * Hold the styler
 */

var styler = transitive.style;

/**
 * All SVG attributes & CSS properties
 */

var attributes = svgAttributes.concat(properties);
attributes.sort();

/**
 * Current styles
 */

var Properties = {
  labels: {},
  patterns: {},
  stops: {}
};

/**
 * Get the current styles, generate the components
 */

function loadProperties() {
  each([ 'patterns', 'stops', 'labels' ], function(type) {
    var $tab = $('#' + type);
    var selectAttribute = select()
      .label('Edit Attribute');

    selectAttribute.on('select', function(option) {
      $('#' + option.value).css('display', 'block');
    });

    $tab.append(selectAttribute.el);

    each(attributes, function(attribute) {
      var set = new PropertySet(type, attribute, styler[type][attribute]);

      $tab.append(set.el);
      selectAttribute.add(attribute, set.id);

      Properties[type][attribute] = set;
    });
  });
}

/**
 * Apply Properties
 */

$('.save-styles').on('click', function(e) {
  // clear old styles
  transitive.style.clear();

  // collect new
  var n = {};

  each([ 'patterns', 'stops', 'labels' ], function(type) {
    n[type] = {};
    each(Properties[type], function(attribute) {
      if (Properties[type][attribute].length > 0) {
        n[type][attribute] = [];
        each(Properties[type][attribute], function(property) {
          n[type][attribute].push(property.value());
        });
      }
    });
  });

  transitive.style.load(n);
  transitive.render();
});

/**
 * Set of properties
 */

function PropertySet(type, attribute, rules) {
  if (!(this instanceof PropertySet)) return new PropertySet();
  this.id = type + '-' + attribute;
  this.el = $('<div id="' + this.id + '"><h3>' + attribute + '</h3></div>');
  this.createSelect();

  this.ul = $('<ul class="properties"></ul>');
  this.el.append(this.ul);

  this.properties = [];
  var self = this;
  if (rules && rules.length > 1) {
    each(rules, function(rule) {
      self.properties.push(new Property(rule));
    });
  }

  this.populate();
}

/**
 * Bind
 */

PropertySet.prototype.populate = function() {
  var self = this;
  if (this.properties && this.properties.length > 0) {
    if (this.sortable) this.sortable.unbind();

    this.ul.empty();
    each(this.properties, function(property) {
      self.ul.append(property.el);
    });

    if (!this.sortable) this.sortable = new Sortable(this.ul[0]);
    this.sortable.bind();
  } else {
    this.el.css('display', 'none');
  }
};

/**
 * Initialize Select
 */

PropertySet.prototype.createSelect = function() {
  var add = select()
    .label('Add Rule')
    .add('Boolean')
    .add('Color')
    .add('Function')
    .add('Number')
    .add('Range')
    .add('String');

  var self = this;
  add.on('select', function(option) {
    self.properties.push(new Property('', {
      type: option.name
    }));

    self.populate();
  });

  this.el.append(add.el);
};
