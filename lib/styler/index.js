
/**
 * Dependencies
 */

var d3 = require('d3');
var each = require('each');
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
 * Clear all current styles
 */

Styler.prototype.clear = function () {
  types.forEach(function (type) {
    this[type] = {};
  }, this);
};

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
  var self = this;
  each(types, function(type) {
    if (styles[type]) {
      each(styles[type], function (key, val) {
        self[type][key] = (self[type][key] || []).concat(val);
      });
    }
  });
};

/**
 * Render pattern
 *
 * @param {Display} display
 * @param {Pattern} pattern
 */

Styler.prototype.renderPattern = function(display, pattern) {
  this.applyAttrAndStyle(
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
  this.applyAttrAndStyle(
    display,
    stop.svgGroup.selectAll('.transitive-stop-circle'),
    this.stops
  );

  this.applyAttrAndStyle(
    display,
    stop.svgGroup.selectAll('.transitive-stop-label'),
    this.labels
  );
};

/**
 * Check if it's an attribute or a style and apply accordingly
 *
 * @param {Display} the Display object
 * @param {Object} a D3 list of elements
 * @param {Object} the rules to apply to the elements
 */

Styler.prototype.applyAttrAndStyle = function(display, elements, rules) {
  var self = this;
  each(rules, function(name, set) {
    var fn = svgAttributes.indexOf(name) === -1
      ? 'style'
      : 'attr';

    elements[fn](name, function(data, index) {
      return self.compute(set, display, data);
    });
  });
};

/**
 * Compute a style rule based on the current display and data
 *
 * @param {Array} array of rules
 * @param {Object} the Display object
 * @param {Object} data associated with this object
 * @param {Number} index of this object
 */

Styler.prototype.compute = function(ruleset, display, data, index) {
  var computed, self = this;
  each(ruleset, function (rule) {
    var val = isFunction(rule)
      ? rule.call(self, display, data, index)
      : rule;
    if (val !== undefined && val !== null) computed = val;
  });
  return computed;
};

/**
 * Scales for utility functions to use
 */

var zoomScale = d3.scale.linear().domain([ 0.25, 1, 4 ]);
var strokeScale = zoomScale.range([ 5, 12, 19 ]);
var fontScale = zoomScale.range([ 10, 14, 18 ]);

/**
 * Utilities for the style functions to use, add to, or edit at your own risk
 */

Styler.prototype.utils = {
  pixels: function(zoom, min, normal, max) {
    return zoomScale.range([ min, normal, max ])(zoom);
  },
  strokeWidth: function(display) {
    return strokeScale(display.zoom.scale());
  },
  fontSize: function(display, data) {
    return fontScale(display.zoom.scale());
  }
};

/**
 * Is function?
 */

function isFunction(val) {
  return Object.prototype.toString.call(val) === '[object Function]';
}
