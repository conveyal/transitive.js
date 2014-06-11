var d3 = require('d3');
var each = require('each');

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
  for (var i = 0; i < data.stops.length; i++) {
    this.stops.push(transitive.stops[data.stops[i].stop_id]);
  }

  this.renderSegments = [];
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

RoutePattern.prototype.addRenderSegment = function(segment) {
  if (this.renderSegments.indexOf(segment) === -1) this.renderSegments.push(
    segment);
};

RoutePattern.prototype.offsetAlignment = function(alignmentId, offset) {
  each(this.renderSegments, function(segment) {
    segment.offsetAlignment(alignmentId, offset);
  });
};

RoutePattern.prototype.getAlignmentVector = function(alignmentId) {
  for (var i = 0; i < this.renderSegments.length; i++) {
    var segment = this.renderSegments[i];
    if (segment.graphEdge.getFromAlignmentId() === alignmentId) return segment.graphEdge
      .fromVector;
    if (segment.graphEdge.getToAlignmentId() === alignmentId) return segment.graphEdge
      .toVector;
  }
  return null;
};
