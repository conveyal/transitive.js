
/**
 * The list of rules
 */

var rules = {};

/**
 * Expose `load`
 *
 * @param {Object} a set of rules
 */

module.exports.load = function load(r) {
  rules = r;
};

/**
 * Expose `set`
 *
 * @param {Object} a D3 list of elements
 * @param {Object} the D3 display object
 */

module.exports.set = function set(el, display) {
  applyAttrAndStyle(el.svgGroup.selectAll('.stop-circle'), display, rules.stop);
  applyAttrAndStyle(el.svgGroup.selectAll('.stop-label'), display, rules.stopLabel);
  applyAttrAndStyle(el.svgGroup.selectAll('.line'), display, rules.route);
};

/**
 * Check if it's an attribute or a style and apply accordingly
 *
 * @param {Object} a D3 list of elements
 * @param {Object} the D3 display object
 * @param {Object} the rules to apply to the elements
 */

function applyAttrAndStyle(el, display, rules) {
  var name, type;

  for (name in rules) {
    type = isStyle(name)
      ? 'style'
      : 'attr';

    el[type](name, computeRule(rules[name]));
  }

  function computeRule(rule) {
    return function (data, index) {
      return isFunction(rule)
        ? rule.call(rules, data, display, index)
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

/**
 * Is style?
 */

function isStyle(val) {
  return [
    'color',
    'fill',
    'font',
    'font-family',
    'font-size',
    'stroke',
    'stroke-width'
  ].indexOf(val) !== -1;
}
