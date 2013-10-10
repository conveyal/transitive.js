
/**
 * Dependencies
 */

var rules = require('./rules');

/**
 * Expose `setStyle`
 *
 * @param {Object} a D3 list of elements
 * @param {Object} the D3 display object
 */

module.exports = function setStyle(el, display) {
  applyAttrAndStyle(el.svgGroup.selectAll('.stop-circle'), display, rules.circle);
  applyAttrAndStyle(el.svgGroup.selectAll('.stop-label'), display, rules.label);
  applyAttrAndStyle(el.svgGroup.selectAll('.line'), display, rules.line);
};

/**
 * Check if it's an attribute or a style and apply accordingly
 *
 * @param {Object} a D3 list of elements
 * @param {Object} the D3 display object
 * @param {Object} the rules to apply to the elements
 */

function applyAttrAndStyle(el, display, rules) {
  for (var name in rules) {
    var rule = rules[name];

    if (isStyle(name)) {
      el.style(name, function (data, index) {
        if (isFunction(rule)) {
          return rule.call(rules, data, display, index);
        } else {
          return rule;
        }
      });
    } else {
      el.attr(name, function (data, index) {
        if (isFunction(rule)) {
          return rule.call(rules, data, display, index);
        } else {
          return rule;
        }
      });
    }
  }
}

/**
 * Is function?
 */

function isFunction(val) {
  return Object.prototype.toString.call(val) === '[object Function]';
}

/**
 * Is style?
 */

function isStyle(val) {
  var styles = [
    'color',
    'fill',
    'font',
    'font-family',
    'font-size',
    'stroke',
    'stroke-width'
  ];

  return styles.indexOf(val) !== -1;
}