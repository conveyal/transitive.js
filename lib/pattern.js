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

/*RoutePattern.prototype.addRenderSegment = function(segment) {
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
    var segmentVector = this.renderSegments[i].getAlignmentVector(alignmentId);
    if(segmentVector) return segmentVector;
  }
  return null;
};*/
