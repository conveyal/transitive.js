/**
 * Dependencies
 */

var each = require('each');

/**
 * Expose `PointCluster`
 */

module.exports = PointCluster;

/**
 *
 */

function PointCluster() {
  this.points = [];
}

PointCluster.prototype.addPoint = function(point) {
  if (this.points.indexOf(point) === -1) this.points.push(point);
};

PointCluster.prototype.mergeVertices = function(graph) {
  var vertices = [];
  each(this.points, function(point) {
    vertices.push(point.graphVertex);
  });
  graph.mergeVertices(vertices);
};
