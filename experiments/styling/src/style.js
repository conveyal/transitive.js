
/**
 * Dependencies
 */

var rules = require('./rules');

/**
 * Expose `setStyle`
 *
 * @param {Object} a D3 list of elements
 * @param {Object} the data that affects the elements
 * @param {Number} the zoom level
 */

module.exports = function setStyle(el, zoom) {
  applyAttrAndStyle(el.svgGroup.selectAll('.stop-circle'), rules.circle, zoom);
  applyAttrAndStyle(el.svgGroup.selectAll('.stop-label'), rules.label, zoom);
  applyAttrAndStyle(el.svgGroup.selectAll('.line'), rules.line, zoom);
};

/**
 * toString ref
 */

var toString = Object.prototype.toString;

/**
 * Is style?
 */

var isStyle = [
  'color',
  'fill',
  'font',
  'font-family',
  'font-size',
  'stroke',
  'stroke-width'
];

/**
 * Check if it's an attribute or a style and apply accordingly
 *
 * @param {Object} a D3 list of elements
 * @param {Object} the rules to apply to the elements
 * @param {Number} the zoom level
 */

function applyAttrAndStyle(el, rules, zoom) {
  for (var name in rules) {
    var rule = rules[name];

    if (isStyle.indexOf(name) !== -1) {
      el.style(name, function (data, index) {
        if (toString.call(rule) === '[object Function]') {
          return rule.call(rules, data, index, zoom);
        } else {
          return rule;
        }
      });
    } else {
      el.attr(name, function (data, index) {
        if (toString.call(rule) === '[object Function]') {
          return rule.call(rules, data, index, zoom);
        } else {
          return rule;
        }
      });
    }
  }
}
