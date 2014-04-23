var d3 = require('d3');

/**
 * Expose `RoutePattern`
 */

module.exports = RoutePattern;

/**
 * A RoutePattern
 *
 * @param {Object} RoutePattern data object from the transitive.js input
 */

function RoutePattern(data, transitive) {
  for (var key in data) {
    if (key === 'stops') continue;
    this[key] = data[key];
  }

  this.stops = [];
  for(var i = 0; i < data.stops.length; i++) {
    this.stops.push(transitive.stops[data.stops[i].stop_id]);
  }

  // create path
}

RoutePattern.prototype.getId = function() {
  return this.pattern_id;
};

RoutePattern.prototype.getElementId = function() {
  return 'pattern-' + this.pattern_id;
};

RoutePattern.prototype.getName = function() {
  return this.pattern_name;
};
