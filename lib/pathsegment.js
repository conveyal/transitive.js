/**
 * Dependencies
 */

var each = require('each');

var PatternGroup = require('./patterngroup');
var LabelEdgeGroup = require('./labeler/labeledgegroup.js');


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
  this.renderedSegments = [];
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

PathSegment.prototype.addRenderedSegment = function(rSegment) {
  this.renderedSegments.push(rSegment);
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
  if (this.points[0].multipoint) return this.points[0].multipoint.graphVertex;
  if (!this.graphEdges || this.graphEdges.length === 0) return null;
  if (this.graphEdges.length === 1) return this.graphEdges[0].fromVertex;
  var first = this.graphEdges[0],
    next = this.graphEdges[1];
  if (first.toVertex == next.toVertex || first.toVertex == next.fromVertex)
    return first.fromVertex;
  if (first.fromVertex == next.toVertex || first.fromVertex == next.fromVertex)
    return first.toVertex;
  return null;
};

PathSegment.prototype.endVertex = function() {
  if (this.points[this.points.length-1].multipoint) return this.points[this.points.length-1].multipoint.graphVertex;
  if (!this.graphEdges || this.graphEdges.length === 0) return null;
  if (this.graphEdges.length === 1) return this.graphEdges[0].toVertex;
  var last = this.graphEdges[this.graphEdges.length - 1],
    prev = this.graphEdges[this.graphEdges.length - 2];
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
  var startVertex = this.startVertex(), endVertex = this.endVertex();
  return 'PathSegment type=' + this.type + ' from ' + 
    (startVertex ? startVertex.toString() : '(unknown)') + ' to ' +
    (endVertex ? endVertex.toString() : '(unknown)');
};


PathSegment.prototype.getLabelEdgeGroups = function() {
  var edgeGroups = [];
  each(this.renderedSegments, function(rSegment) {
    if(!rSegment.isFocused()) return;
    var currentGroup = new LabelEdgeGroup(rSegment);
    each(rSegment.renderedEdges, function(rEdge) {
      currentGroup.addEdge(rEdge);
      if(rEdge.graphEdge.toVertex.point.containsSegmentEndPoint()) {
        edgeGroups.push(currentGroup);
        currentGroup = new LabelEdgeGroup(rSegment);
      }
    }, this);
  }, this);

  return edgeGroups;
};