
/**
 * Dependencies
 */

var merge = require('merge-util');
var styles = require('./styles');
var StyleSheet = require('stylesheet');
var svgAttributes = require('svg-attributes');

/**
 * Element Types
 */

var types = [ 'labels', 'patterns', 'stops' ];

/**
 * Add transform
 */

svgAttributes.push('transform');

/**
 * Expose `Styler`
 */

module.exports = Styler;

/**
 * Styler object
 */

function Styler(styles) {
  if (!(this instanceof Styler)) return new Styler(styles);
  if (styles) this.load(styles);
}

/**
 * Add the predefined styles
 */

types.forEach(function (type) {
  Styler.prototype[type] = styles[type];
});

/**
 * Load rules
 *
 * @param {Object} a set of style rules
 */

Styler.prototype.load = function(styles) {
  types.forEach(function (type) {
    if (styles[type]) this[type] = merge(this[type], styles[type]);
  });
};

/**
 * Render pattern
 *
 * @param {Display} display
 * @param {Pattern} pattern
 */

Styler.prototype.renderPattern = function(display, pattern) {
  applyAttrAndStyle(
    display,
    pattern.selectAll('.transitive-line'),
    this.patterns
  );
};

/**
 * Render elements against these rules
 *
 * @param {Display} a D3 list of elements
 * @param {Pattern} the transitive object
 */

Styler.prototype.renderStop = function(display, pattern) {
  applyAttrAndStyle(
    display,
    pattern.selectAll('.transitive-stop-circle'),
    this.stops
  );

  applyAttrAndStyle(
    display,
    pattern.selectAll('.transitive-stop-label'),
    this.labels
  );
};

/**
 * Check if it's an attribute or a style and apply accordingly
 *
 * @param {Transitive} the transitive object
 * @param {Pattern} the Pattern object
 * @param {Object} a D3 list of elements
 * @param {Object} the rules to apply to the elements
 */

function applyAttrAndStyle(display, elements, rules) {
  for (var name in rules) {
    var type = svgAttributes.indexOf(name) === -1
      ? 'style'
      : 'attr';

    elements[type](name, computeRule(rules[name]));
  }

  function computeRule(rule) {
    return function (data, index) {
      return isFunction(rule)
        ? rule.call(rules, display, data, index)
        : rule;
    };
  }
}

/**
 * Is function?
 */

function isFunction(val) {
  return Object.prototype.toString.call(val) === '[object Function]';
}
