
/**
 * Dependencies
 */

var Edge = require('./edge');
var Vertex = require('./vertex');

/**
 * Expose `Graph`
 */

module.exports = NetworkGraph;

/**
 *  An graph representing the underlying 'wireframe' network
 */

function NetworkGraph() {
  this.vertices = [];
  this.edges = [];
}

/**
 * Add Vertex
 */

NetworkGraph.prototype.addVertex = function(stop, x, y) {
  if(!x) x = stop.stop_lon;
  if(!y) y = stop.stop_lat;
  var vertex = new Vertex(stop, x, y);
  this.vertices.push(vertex);
  return vertex;
};

/**
 * Add Edge
 */

NetworkGraph.prototype.addEdge = function(stopArray, fromVertex, toVertex) {
  if (this.vertices.indexOf(fromVertex) === -1) {
    console.log('Error: NetworkGraph does not contain Edge fromVertex');
    return;
  }

  if (this.vertices.indexOf(toVertex) === -1) {
    console.log('Error: NetworkGraph does not contain Edge toVertex');
    return;
  }

  var edge = new Edge(stopArray, fromVertex, toVertex);
  this.edges.push(edge);
  fromVertex.edges.push(edge);
  toVertex.edges.push(edge);

  return edge;
};

/**
 * Get the equivalent edge
 */

NetworkGraph.prototype.getEquivalentEdge = function(stopArray, from, to) {
  for (var e = 0; e < this.edges.length; e++) {
    var edge = this.edges[e];
    if (edge.fromVertex === from
      && edge.toVertex === to
      && stopArray.length === edge.stopArray.length
      && equal(stopArray, edge.stopArray)) {
      return edge;
    }
  }
};


/**
 * Convert the graph coordinates to a linear 1-d display. Assumes a branch-based, acyclic graph
 */

NetworkGraph.prototype.convertTo1D = function(stopArray, from, to) {

  // find the "trunk" edge; i.e. the one with the most patterns
  var trunkEdge = null;
  var maxPatterns = 0;

  for (var e = 0; e < this.edges.length; e++) {
    var edge = this.edges[e];
    if(edge.patterns.length > maxPatterns) {
      trunkEdge = edge;
      maxPatterns = edge.patterns.length;
    }
  }

  //console.log('trunk edge: ');
  //console.log(trunkEdge);

  // make the trunk edge from (0,0) to (x,0)
  trunkEdge.fromVertex.moveTo(0, 0);
  trunkEdge.toVertex.moveTo(trunkEdge.stopArray.length + 1, 0);

  // determine the direction in 1D space relative to the trunk edge
  var fromToDelta = trunkEdge.toVertex.x - trunkEdge.fromVertex.x;
  if(fromToDelta === 0) fromToDelta = trunkEdge.toVertex.y - trunkEdge.fromVertex.y;
  var fromToDirection = fromToDelta / Math.abs(fromToDelta);

  this.exploredVertices = [trunkEdge.fromVertex, trunkEdge.toVertex];

  // explore the graph in both directions
  this.extend1D(trunkEdge, trunkEdge.fromVertex, -fromToDirection, 0);
  this.extend1D(trunkEdge, trunkEdge.toVertex, fromToDirection, 0);
};

NetworkGraph.prototype.extend1D = function(edge, vertex, direction, y) {

  var edges = vertex.incidentEdges(edge);
  if(edges.length === 0) { // no additional edges to explore; we're done
    return;
  }
  else if(edges.length === 1) { // exactly one other edge to explore
    var extEdge = edges[0];
    var oppVertex = extEdge.oppositeVertex(vertex);

    if(this.exploredVertices.indexOf(oppVertex) !== -1) {
      console.log('Warning: found cycle in 1d graph');
      return;
    }
    oppVertex.moveTo(vertex.x + (extEdge.stopArray.length + 1) * direction, y);
    this.extend1D(extEdge, oppVertex, direction, y);
  }
  else { // branch case

  }
};

/**
 * Check if arrays are equal
 */

function equal(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  for (var i in a) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}
