'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _d = require('d3');

var _d2 = _interopRequireDefault(_d);

var _lodash = require('lodash');

var _pointcluster = require('./pointcluster');

var _pointcluster2 = _interopRequireDefault(_pointcluster);

var _multipoint = require('./multipoint');

var _multipoint2 = _interopRequireDefault(_multipoint);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Utility class to cluster points into MultiPoint objects
 */

var PointClusterMap = function () {
  function PointClusterMap(transitive) {
    var _this = this;

    (0, _classCallCheck3.default)(this, PointClusterMap);

    this.transitive = transitive;

    this.clusters = [];
    this.clusterLookup = {}; // maps Point object to its containing cluster

    var pointArr = [];
    (0, _lodash.forEach)((0, _values2.default)(transitive.stops), function (point) {
      if (point.used) pointArr.push(point);
    }, this);
    (0, _lodash.forEach)((0, _values2.default)(transitive.turnPoints), function (turnPoint) {
      pointArr.push(turnPoint);
    }, this);

    var links = _d2.default.geom.voronoi().x(function (d) {
      return d.worldX;
    }).y(function (d) {
      return d.worldY;
    }).links(pointArr);

    (0, _lodash.forEach)(links, function (link) {
      var dist = (0, _util.distance)(link.source.worldX, link.source.worldY, link.target.worldX, link.target.worldY);
      if (dist < 100 && (link.source.getType() !== 'TURN' || link.target.getType() !== 'TURN')) {
        var sourceInCluster = link.source in _this.clusterLookup;
        var targetInCluster = link.target in _this.clusterLookup;
        if (sourceInCluster && !targetInCluster) {
          _this.addPointToCluster(link.target, _this.clusterLookup[link.source]);
        } else if (!sourceInCluster && targetInCluster) {
          _this.addPointToCluster(link.source, _this.clusterLookup[link.target]);
        } else if (!sourceInCluster && !targetInCluster) {
          var cluster = new _pointcluster2.default();
          _this.clusters.push(cluster);
          _this.addPointToCluster(link.source, cluster);
          _this.addPointToCluster(link.target, cluster);
        }
      }
    }, this);

    this.vertexPoints = [];
    (0, _lodash.forEach)(this.clusters, function (cluster) {
      var multipoint = new _multipoint2.default(cluster.points);
      _this.vertexPoints.push(multipoint);
      (0, _lodash.forEach)(cluster.points, function (point) {
        point.multipoint = multipoint;
      });
    });
  }

  (0, _createClass3.default)(PointClusterMap, [{
    key: 'addPointToCluster',
    value: function addPointToCluster(point, cluster) {
      cluster.addPoint(point);
      this.clusterLookup[point] = cluster;
    }
  }, {
    key: 'clearMultiPoints',
    value: function clearMultiPoints() {
      (0, _lodash.forEach)(this.clusters, function (cluster) {
        (0, _lodash.forEach)(cluster.points, function (point) {
          point.multipoint = null;
        });
      });
    }
  }, {
    key: 'getVertexPoints',
    value: function getVertexPoints(baseVertexPoints) {
      if (!baseVertexPoints) return this.vertexPoints;
      var vertexPoints = this.vertexPoints.concat();
      (0, _lodash.forEach)(baseVertexPoints, function (point) {
        if (!point.multipoint) vertexPoints.push(point);
      });
      return vertexPoints;
    }
  }]);
  return PointClusterMap;
}();

exports.default = PointClusterMap;
module.exports = exports['default'];

//# sourceMappingURL=pointclustermap.js