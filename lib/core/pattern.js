var d3 = require('d3');
var each = require('each');

var NetworkPath = require('./path');
var PathSegment = require('./pathsegment');

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
  if (transitive) {
    each(data.stops, function(stop) {
      this.stops.push(transitive.stops[stop.stop_id]);
    }, this);
  }

  this.renderedEdges = [];
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

RoutePattern.prototype.addRenderedEdge = function(rEdge) {
  if (this.renderedEdges.indexOf(rEdge) === -1) this.renderedEdges.push(
    rEdge);
};

RoutePattern.prototype.offsetAlignment = function(alignmentId, offset) {
  each(this.renderedEdges, function(rEdge) {
    rEdge.offsetAlignment(alignmentId, offset);
  });
};

RoutePattern.prototype.createPath = function() {
  var path = new NetworkPath(this);
  var pathSegment = new PathSegment('TRANSIT', path);
  pathSegment.addPattern(this, 0, this.stops.length - 1);
  path.addSegment(pathSegment);
  return path;
};
