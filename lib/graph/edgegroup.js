var debug = require('debug')('transitive:edgegroup');
var each = require('each');
var PriorityQueue = require('priorityqueuejs');

var Util = require('../util');

/**
 * Expose `EdgeGroup`
 */

module.exports = EdgeGroup;

/**
 *  A group of edges that share the same endpoint vertices
 */

function EdgeGroup(fromVertex, toVertex, type) {
  this.fromVertex = fromVertex;
  this.toVertex = toVertex;
  this.type = type;
  this.edges = [];
  this.commonPoints = null;
  this.worldLength = 0;
}

EdgeGroup.prototype.addEdge = function(edge) {
  this.edges.push(edge);
  edge.edgeGroup = this;

  // update the groups worldLength
  this.worldLength = Math.max(this.worldLength, edge.getWorldLength());

  if (this.commonPoints === null) { // if this is first edge added, initialize group's commonPoint array to include all of edge's points
    this.commonPoints = [];
    each(edge.pointArray, function(point) {
      this.commonPoints.push(point);
    }, this);
  } else { // otherwise, update commonPoints array to only include those in added edge
    var newCommonPoints = [];
    each(edge.pointArray, function(point) {
      if (this.commonPoints.indexOf(point) !== -1) newCommonPoints.push(point);
    }, this);
    this.commonPoints = newCommonPoints;
  }
};

EdgeGroup.prototype.getWorldLength = function() {
  return this.worldLength;
};

EdgeGroup.prototype.getInternalVertexPQ = function() {

  // create an array of all points on the edge (endpoints and internal)
  var allPoints = ([this.fromVertex.point]).concat(this.commonPoints, [this.toVertex
    .point
  ]);

  var pq = new PriorityQueue(function(a, b) {
    return a.weight - b.weight;
  });

  for (var i = 1; i < allPoints.length - 1; i++) {
    var weight = this.getInternalVertexWeight(allPoints, i);
    pq.enq({
      weight: weight,
      point: allPoints[i]
    });
  }

  return pq;
};

EdgeGroup.prototype.getInternalVertexWeight = function(pointArray, index) {
  var x1 = pointArray[index - 1].worldX;
  var y1 = pointArray[index - 1].worldY;
  var x2 = pointArray[index].worldX;
  var y2 = pointArray[index].worldY;
  var x3 = pointArray[index + 1].worldX;
  var y3 = pointArray[index + 1].worldY;

  // the weighting function is a combination of:
  // - the distances from this internal point to the two adjacent points, normalized for edge length (longer distances are prioritized)
  // - the angle formed by this point and the two adjacent ones ('sharper' angles are prioritized)
  var inDist = Util.distance(x1, y1, x2, y2);
  var outDist = Util.distance(x2, y2, x3, y3);
  var theta = Util.angleFromThreePoints(x1, y1, x2, y2, x3, y3);
  var edgeLen = this.getWorldLength();
  var weight = inDist / edgeLen + outDist / edgeLen + Math.abs(Math.PI - theta) /
    Math.PI;
};

EdgeGroup.prototype.hasTransit = function() {
  for (var i = 0; i < this.edges.length; i++) {
    if (this.edges[i].hasTransit()) return true;
  }
  return false;
};

EdgeGroup.prototype.isNonTransitPath = function() {
  return (this.edges.length === 1 && this.edges[0].isNonTransitPath());
};

EdgeGroup.prototype.getTurnPoints = function(maxAngle) {
  var points = [];
  maxAngle = maxAngle || .75 * Math.PI;
  each(this.commonPoints, function(point) {
    if(point.getType() !== 'TURN') return;
    if(Math.abs(point.turnAngle) < maxAngle) {
      points.push(point);
    }
  });
  return points;
}
