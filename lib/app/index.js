
/**
 * Dependencies
 */

var Styler = require('styler');

/**
 * Expose `Transitive`
 */

module.exports = Transitive;

/**
 * Main object
 */

function Transitive(el, data, staticStyle, computedStyles) {
  if (!(this instanceof Transitive)) {
    return new Transitive();
  }

  this.el = el;
  this.styler = new Styler(staticStyle, computedStyles);

  this.load(data);
  this.render();
}

/**
 * Render
 */

Transitive.prototype.render = function() {
  // render ?
};

/**
 * Set element
 */

Transitive.prototype.setElement = function(el) {
  this.el = el;
  this.render();
};
