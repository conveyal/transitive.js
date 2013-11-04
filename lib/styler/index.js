
/**
 * Dependencies
 */

var merge = require('merge-util');
var StyleSheet = require('stylesheet');
var svgAttributes = require('svg-attributes');

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

function Styler(passive, computed) {
  if (!(this instanceof Styler)) return new Styler();

  this.computed = require('./computed');
  this.passive = require('./passive');
  this.stylesheet = new StyleSheet();

  this.load(passive, computed);
}

/**
 * Load rules
 *
 * @param {Object} a set of rules
 */

Styler.prototype.load = function(passive, computed) {
  if (passive) this.passive = merge(this.passive, passive);
  if (computed) this.computed = this.computed.concat(computed);
};

/**
 * Render elements against these rules
 *
 * @param {Object} a D3 list of elements
 * @param {Object} the transitive object
 */

Styler.prototype.render = function(transitive, pattern) {
  // apply passive rules
  for (var selector in this.passive) {
    applyAttrAndStyle(transitive, pattern, pattern.svgGroup.selectAll(selector),
      this.passive[selector]);
  }

  // apply computed rules
  this.computed.forEach(function (rule) {
    rule(transitive, pattern);
  });
};

/**
 * Reset rules
 */

Styler.prototype.reset = function reset() {
  this.passive = {};
  this.computed = [];
};

/**
 * Check if it's an attribute or a style and apply accordingly
 *
 * @param {Transitive} the transitive object
 * @param {Pattern} the Pattern object
 * @param {Object} a D3 list of elements
 * @param {Object} the rules to apply to the elements
 */

function applyAttrAndStyle(transitive, pattern, elements, rules) {
  for (var name in rules) {
    var type = svgAttributes.indexOf(name) === -1
      ? 'style'
      : 'attr';

    elements[type](name, computeRule(rules[name]));
  }

  function computeRule(rule) {
    return function (data, index) {
      return isFunction(rule)
        ? rule.call(rules, transitive, pattern, data, index)
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
