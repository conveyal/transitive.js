
/**
 * Expose `Route`
 */

module.exports = Route;

/**
 *  A transit Route, as defined in the input data. Routes contain one or more Patterns
 */

function Route(data) {
  for (var name in data) {
    if (name === 'patterns') {
      continue;
    }

    this[name] = data[name];
  }

  this.patterns = [];
}

Route.prototype.addPattern = function(pattern) {
  this.patterns.push(pattern);
  pattern.route = this;
};