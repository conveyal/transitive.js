
/**
 * Expose `Edge`
 */

module.exports = Edge;

/**
 * Initialize a new edge
 *
 * @param {Array}
 * @param {Vertex}
 * @param {Vertex}
 */

function Edge(stopArray, fromVertex, toVertex) {
  this.stopArray = stopArray;
  this.fromVertex = fromVertex;
  this.toVertex = toVertex;
  this.patterns = [];

  this.calculateVectors();
}

/**
 *
 */

Edge.prototype.pointAlongEdge = function(t) {
  var x = this.fromVertex.x + t * (this.toVertex.x - this.fromVertex.x);
  var y = this.fromVertex.y + t * (this.toVertex.y - this.fromVertex.y);
  return {
    x: x,
    y: y
  };
};

/**
 *
 */

Edge.prototype.calculateVectors = function() {
  var dx = this.fromVertex.x - this.toVertex.x;
  var dy = this.fromVertex.y - this.toVertex.y;
  var l = Math.sqrt(dx * dx + dy * dy);

  this.vector = {
    x: dx / l,
    y : dy / l
  };

  this.leftVector = {
    x : -this.vector.y,
    y : this.vector.x
  };

  this.rightVector = {
    x : this.vector.y,
    y : -this.vector.x
  };
};

/**
 *  Add a pattern to the edge
 */

Edge.prototype.addPattern = function(pattern) {
  if(this.patterns.indexOf(pattern) === -1) this.patterns.push(pattern);
};

/**
 *  Gets the vertex opposite another vertex on an edge
 */

Edge.prototype.oppositeVertex = function(vertex) {
  if(vertex === this.toVertex) return this.fromVertex;
  if(vertex === this.fromVertex) return this.toVertex;
  return null;
};

/**
 *
 */

Edge.prototype.setStopLabelPosition = function(pos, skip) {
  if(this.fromVertex.stop !== skip) this.fromVertex.stop.labelPosition = pos;
  if(this.toVertex.stop !== skip) this.toVertex.stop.labelPosition = pos;

  this.stopArray.forEach(function(stop) {
    if(stop !== skip) stop.labelPosition = pos;
  });
};

/**
 *
 */

Edge.prototype.toString = function() {
  return this.fromVertex.stop.getId() + '_' + this.toVertex.stop.getId();
};
