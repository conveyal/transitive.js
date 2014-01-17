
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

var Styles = {
  labels: {},
  patterns: {},
  stops: {}
};

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
    Styles[type][attribute] = [];

    var id = type + '-' + attribute;
    var $div = $('<div id="' + id + '"><h3>' + attribute + '</h3></div>');
    var rules = styler[type][attribute];
    var $ul = $('<ul class="properties"></ul>');

    selectAttribute.add(attribute, id);
    $tab.append($div);
    $div.append($ul);

    if (rules && rules.length > 1) {
      console.log(rules);
      each(rules, function(rule) {
        var prop = new Property(type, rule);

        Styles[type][attribute].push(prop);
        console.log(prop, prop.el);
        $ul.append(prop.el);
      });

      console.log($ul[0]);
      var sortable = new Sortable($ul[0]);
      sortable.bind();
    } else {
      $div.css('display', 'none');
    }
  });
});

/**
 * Apply Styles
 */

$('.save-styles').on('click', function(e) {
  //
  console.log('loading new styles');

  // clear old styles
  transitive.style.clear();

  // collect new
  var n = {};

  each([ 'patterns', 'stops', 'labels' ], function(type) {
    n[type] = {};
    each(Styles[type], function(attribute) {
      if (Styles[type][attribute].length > 0) {
        n[type][attribute] = [];
        each(Styles[type][attribute], function(property) {
          n[type][attribute].push(property.value());
        });
      }
    });
  });

  transitive.style.load(n);
  transitive.render();
});
