
/**
 * Dependencies
 */

var each = require('each');

/**
 * List of CSS style rules
 */

var styles = [
  'color',
  'fill',
  'font',
  'font-family',
  'font-size',
  'stroke',
  'stroke-width'
];

/**
 * Expose `Styler`
 */

module.exports = Styler;

/**
 * Styler object
 */

function Styler(static, computed) {
  if (!(this instanceof Styler)) {
    return new Styler();
  }

  this.computed = require('./computed');
  this.static = require('./static');

  if (static) {
    this.load(static);
  }

  if (computed) {
    this.computed = this.computed.push(computed);
  }
}

/**
 * Load a set of rules
 *
 * @param {Object} a set of rules
 */

Styler.prototype.load = function(set) {
  each(set, function (rules, selector) {
    if (!this.static[selector]) {
      this.static[selector] = rules;
    } else {
      each(rules, function (rule, name) {
        this.static[selector][name] = rule;
      }.bind(this));
    }
  }.bind(this));
};

/**
 * Render elements against these rules
 *
 * @param {Object} a D3 list of elements
 * @param {Object} the D3 display object
 */

Styler.prototype.render = function render(el, display) {
  // apply static rules
  each(this.static, function (rules, selector) {
    applyAttrAndStyle(el.svgGroup.selectAll(selector), display, rules);
  });

  // apply computed rules
  each(this.computed, function (rule) {
    rule(el, display);
  });
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
    var type = isStyle(name)
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
  return styles.indexOf(val) !== -1;
}
