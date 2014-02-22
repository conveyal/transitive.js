
/**
 * Expose `Vertex`
 */

module.exports = Vertex;

/**
 * Initialize new Vertex
 *
 * @param {Stop/Place}
 * @param {Number}
 * @param {Number}
 */

function Vertex(point, x, y) {
  this.point = point;
  this.x = this.origX = x;
  this.y = this.origY = y;
  this.edges = [];
}


/**
 * Move to new coordinate
 *
 * @param {Number}
 * @param {Number}
 */

Vertex.prototype.moveTo = function(x, y) {
  this.x = x;
  this.y = y;
  this.edges.forEach(function (edge) {
    edge.calculateVectors();
  });
};


/**
 * Get array of edges incident to vertex. Allows specification of "incoming" edge that will not be included in results
 *
 * @param {Edge}
 */

Vertex.prototype.incidentEdges = function(inEdge) {
	var results = [];
	this.edges.forEach(function(edge) {
		if(edge !== inEdge) results.push(edge);
	});
	return results;
};


/**
 * Add an edge to the vertex's edge list
 *
 * @param {Edge}
 */

Vertex.prototype.addEdge = function(edge) {
  var index = this.edges.indexOf(edge);
  if(index === -1) this.edges.push(edge);
};

/**
 * Remove an edge from the vertex's edge list
 *
 * @param {Edge}
 */

Vertex.prototype.removeEdge = function(edge) {
  var index = this.edges.indexOf(edge);
  if(index !== -1) this.edges.splice(index, 1);
};