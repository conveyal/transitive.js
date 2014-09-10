/**
 * Dependencies
 */

var d3 = require('d3');
var each = require('each');

var PointCluster = require('./pointcluster');
var MultiPoint = require('./multipoint');
var Util = require('../util');


/**
 * Expose `PointClusterMap`
 */

module.exports = PointClusterMap;

/**
 *
 */

function PointClusterMap(transitive) {
  this.transitive = transitive;

  this.clusters = [];
  this.clusterLookup = {}; // maps Point object to its containing cluster

  var pointArr = [];
  each(transitive.stops, function(key) {
    var point = transitive.stops[key];
    if(point.used) pointArr.push(point);
  }, this);
  each(transitive.turnPoints, function(key) {
    pointArr.push(transitive.turnPoints[key]);
  }, this);

  var links = d3.geom.voronoi()
    .x(function(d) { return d.worldX; })
    .y(function(d) { return d.worldY; })
    .links(pointArr);

  each(links, function(link) {
    var dist = Util.distance(link.source.worldX, link.source.worldY, link.target.worldX, link.target.worldY);
    if(dist < 100 && (link.source.getType() !== 'TURN' || link.target.getType() !== 'TURN')) {
      var sourceInCluster = (link.source in this.clusterLookup);
      var targetInCluster = (link.target in this.clusterLookup);
      if(sourceInCluster && !targetInCluster) {
        this.addPointToCluster(link.target, this.clusterLookup[link.source]);
      }
      else if(!sourceInCluster && targetInCluster) {
        this.addPointToCluster(link.source, this.clusterLookup[link.target]);
      }
      else if(!sourceInCluster && !targetInCluster) {
        var cluster = new PointCluster();
        this.clusters.push(cluster);
        this.addPointToCluster(link.source, cluster);
        this.addPointToCluster(link.target, cluster);
      }
    }
  }, this);

  this.vertexPoints = [];
  each(this.clusters, function(cluster) {
    var multipoint = new MultiPoint(cluster.points);
    this.vertexPoints.push(multipoint);
    each(cluster.points, function(point) {
      point.multipoint = multipoint;
    }, this);
  }, this);
}

PointClusterMap.prototype.addPointToCluster = function(point, cluster) {
  cluster.addPoint(point);
  this.clusterLookup[point] = cluster;
};

PointClusterMap.prototype.clearMultiPoints = function() {
  each(this.clusters, function(cluster) {
    each(cluster.points, function(point) {
      point.multipoint = null;
    }, this);
  }, this);
};

PointClusterMap.prototype.getVertexPoints = function(baseVertexPoints) {
  if(!baseVertexPoints) return this.vertexPoints;
  var vertexPoints = this.vertexPoints.concat();
  each(baseVertexPoints, function(point) {
    if(!point.multipoint) vertexPoints.push(point);
  });
  return vertexPoints;
};
