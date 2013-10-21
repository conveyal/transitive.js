
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
