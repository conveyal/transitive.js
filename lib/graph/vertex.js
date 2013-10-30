
/**
 * Expose `Vertex`
 */

module.exports = Vertex;

/**
 * Initialize new Vertex
 *
 * @param {}
 * @param {Number}
 * @param {Number}
 */

function Vertex(stop, x, y) {
  this.stop = stop;
  this.x = x;
  this.y = y;
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
