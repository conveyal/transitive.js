
/**
 * Expose `Route`
 */

module.exports = Route;

/**
 * A transit Route, as defined in the input data.
 * Routes contain one or more Patterns.
 *
 * @param {Object}
 */

function Route(data) {
  for (var key in data) {
    if (key === 'patterns') continue;
    this[key] = data[key];
  }

  this.patterns = [];
}

/**
 * Add Pattern
 *
 * @param {Pattern}
 */

Route.prototype.addPattern = function(pattern) {
  this.patterns.push(pattern);
  pattern.route = this;
};
