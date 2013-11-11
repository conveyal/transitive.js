
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

  // reset styles
  this.reset();

  // load styles
  if (styles) this.load(styles);
}

/**
 * Reset to the predefined styles
 */

Styler.prototype.reset = function () {
  types.forEach(function (type) {
    this[type] = merge({}, styles[type]);
  }, this);
};

/**
 * Load rules
 *
 * @param {Object} a set of style rules
 */

Styler.prototype.load = function(styles) {
  types.forEach(function (type) {
    if (styles[type]) this[type] = merge(this[type], styles[type]);
  }, this);
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
    pattern,
    this.patterns
  );
};

/**
 * Render elements against these rules
 *
 * @param {Display} a D3 list of elements
 * @param {Stop} Transitive Stop object
 */

Styler.prototype.renderStop = function(display, stop) {
  applyAttrAndStyle(
    display,
    stop.svgGroup.selectAll('.transitive-stop-circle'),
    this.stops
  );

  applyAttrAndStyle(
    display,
    stop.svgGroup.selectAll('.transitive-stop-label'),
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
    var value = computeRule(rules[name]);
    if (!!value) elements[type](name, value);
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
