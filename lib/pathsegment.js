/**
 * Dependencies
 */

var each = require('each');

var PatternGroup = require('./patterngroup');
var RenderSegmentSequence = require('./rendersegmentsequence');


var segmentId = 0;

/**
 * Expose `PathSegment`
 */

module.exports = PathSegment;

/**
 *
 */

function PathSegment(type, path) {
  this.id = segmentId++;
  this.type = type;
  this.path = path;
  this.points = [];
  this.graphEdges = [];
  this.patternGroup = new PatternGroup();
}

PathSegment.prototype.clearGraphData = function() {
  this.graphEdges = [];
  this.points.forEach(function(point) {
    point.graphVertex = null;
  });
  this.renderLength = null;
};

PathSegment.prototype.getId = function() {
  return this.id;
};

PathSegment.prototype.getType = function() {
  return this.type;
};

PathSegment.prototype.addEdge = function(edge) {
  this.graphEdges.push(edge);
};

PathSegment.prototype.removeEdge = function(edge) {
  while (this.graphEdges.indexOf(edge) !== -1) {
    this.graphEdges.splice(this.graphEdges.indexOf(edge), 1);
  }
};

PathSegment.prototype.replaceEdge = function(edge, newEdges) {

  var i = this.graphEdges.indexOf(edge);
  if (i === -1) return;

  // remove the old edge
  this.graphEdges.splice(i, 1);

  // insert the new edges
  this.graphEdges.splice.apply(this.graphEdges, [i, 0].concat(newEdges));

};

PathSegment.prototype.getEdgeIndex = function(edge) {
  for (var i = 0; i < this.graphEdges.length; i++) {
    if (this.graphEdges[i].edge === edge) return i;
  }
  return -1;
};

PathSegment.prototype.getAdjacentEdge = function(edge, vertex) {

  // ensure that edge/vertex pair is valid
  if (edge.toVertex !== vertex && edge.fromVertex !== vertex) return null;

  var index = this.getEdgeIndex(edge);
  if (index === -1) return null;

  // check previous edge
  if (index > 0) {
    var prevEdge = this.graphEdges[index - 1].edge;
    if (prevEdge.toVertex === vertex || prevEdge.fromVertex === vertex)
      return prevEdge;
  }

  // check next edge
  if (index < this.graphEdges.length - 1) {
    var nextEdge = this.graphEdges[index + 1].edge;
    if (nextEdge.toVertex === vertex || nextEdge.fromVertex === vertex)
      return nextEdge;
  }

  return null;
};

/**
 * Get graph vertices
 */

PathSegment.prototype.getGraphVertices = function() {
  var vertices = [];
  this.graphEdges.forEach(function(edge, i) {
    if (i === 0) {
      vertices.push(edge.fromVertex);
    }
    vertices.push(edge.toVertex);
  });
  return vertices;
};

PathSegment.prototype.getEdgeIndex = function(edge) {
  for (var i = 0; i < this.graphEdges.length; i++) {
    if (this.graphEdges[i].edge === edge) return i;
  }
  return -1;
};

PathSegment.prototype.vertexArray = function() {

  var vertex = this.startVertex();
  var array = [vertex];

  this.graphEdges.forEach(function(edgeInfo) {
    vertex = edgeInfo.edge.oppositeVertex(vertex);
    array.push(vertex);
  });

  return array;
};

PathSegment.prototype.startVertex = function() {
  if (!this.graphEdges || this.graphEdges.length === 0) return null;
  if (this.graphEdges.length === 1) return this.graphEdges[0].fromVertex;
  var first = this.graphEdges[0].edge,
    next = this.graphEdges[1].edge;
  if (first.toVertex == next.toVertex || first.toVertex == next.fromVertex)
    return first.fromVertex;
  if (first.fromVertex == next.toVertex || first.fromVertex == next.fromVertex)
    return first.toVertex;
  return null;
};

PathSegment.prototype.endVertex = function() {
  if (!this.graphEdges || this.graphEdges.length === 0) return null;
  if (this.graphEdges.length === 1) return this.graphEdges[0].toVertex;
  var last = this.graphEdges[this.graphEdges.length - 1].edge,
    prev = this.graphEdges[this.graphEdges.length - 2].edge;
  if (last.toVertex == prev.toVertex || last.toVertex == prev.fromVertex)
    return last.fromVertex;
  if (last.fromVertex == prev.toVertex || last.fromVertex == prev.fromVertex)
    return last.toVertex;
  return null;
};

PathSegment.prototype.addPattern = function(pattern, fromIndex, toIndex) {
  if((toIndex - fromIndex + 1) > this.points.length) {
    this.points = [];
    var lastStop = null;
    for (var i = fromIndex; i <= toIndex; i++) {
      var stop = pattern.stops[i];
      if(lastStop !== stop) this.points.push(stop);
      lastStop = stop;
    }
  }
  this.patternGroup.addPattern(pattern);
  //this.pattern = pattern;
};

PathSegment.prototype.getPattern = function() {
  return this.patternGroup.patterns[0];
};

PathSegment.prototype.getPatterns = function() {
  return this.patternGroup.patterns;
};

PathSegment.prototype.getMode = function() {
  return this.patternGroup.patterns[0].route.route_type;
};

PathSegment.prototype.toString = function() {
  return this.startVertex().stop.stop_name + ' to ' + this.endVertex().stop.stop_name;
};

/**
 *  Returns a collection of RenderSegmentSequences for this PathSegment, broken by
 *  transit board/alight/transfer vertices.
 *
 *  Only works if there is a 1:1 corresponsdence between Edges and RenderSegments
 *  (i.e. does not work for rail PathSegments where there may be multiple RenderSegments
 *  per Edge)
 */

PathSegment.prototype.getRenderSegmentSequences = function() {
  var sequences = [];
  var currentSeq = new RenderSegmentSequence();
  each(this.renderSegments, function(segment) {
    currentSeq.addSegment(segment);
    if(segment.graphEdge.toVertex.point.containsSegmentEndPoint()) {
      sequences.push(currentSeq);
      currentSeq = new RenderSegmentSequence();
    }
  });

  return sequences;
};
