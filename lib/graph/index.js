
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
