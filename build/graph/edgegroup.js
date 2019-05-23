'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _priorityqueuejs = require('priorityqueuejs');

var _priorityqueuejs2 = _interopRequireDefault(_priorityqueuejs);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *  A group of edges that share the same endpoint vertices
 */

var EdgeGroup = function () {
  function EdgeGroup(fromVertex, toVertex, type) {
    (0, _classCallCheck3.default)(this, EdgeGroup);

    this.fromVertex = fromVertex;
    this.toVertex = toVertex;
    this.type = type;
    this.edges = [];
    this.commonPoints = null;
    this.worldLength = 0;
  }

  (0, _createClass3.default)(EdgeGroup, [{
    key: 'addEdge',
    value: function addEdge(edge) {
      var _this = this;

      this.edges.push(edge);
      edge.edgeGroup = this;

      // update the groups worldLength
      this.worldLength = Math.max(this.worldLength, edge.getWorldLength());

      if (this.commonPoints === null) {
        // if this is first edge added, initialize group's commonPoint array to include all of edge's points
        this.commonPoints = edge.pointArray.slice();
      } else {
        // otherwise, update commonPoints array to only include those in added edge
        this.commonPoints = this.commonPoints.concat(edge.pointArray.filter(function (pt) {
          return _this.commonPoints.indexOf(pt) !== -1;
        }));
      }
    }
  }, {
    key: 'getWorldLength',
    value: function getWorldLength() {
      return this.worldLength;
    }
  }, {
    key: 'getInternalVertexPQ',
    value: function getInternalVertexPQ() {
      // create an array of all points on the edge (endpoints and internal)
      var allPoints = [this.fromVertex.point].concat(this.commonPoints, [this.toVertex.point]);

      var pq = new _priorityqueuejs2.default(function (a, b) {
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
    }
  }, {
    key: 'getInternalVertexWeight',
    value: function getInternalVertexWeight(pointArray, index) {
      var x1 = pointArray[index - 1].worldX;
      var y1 = pointArray[index - 1].worldY;
      var x2 = pointArray[index].worldX;
      var y2 = pointArray[index].worldY;
      var x3 = pointArray[index + 1].worldX;
      var y3 = pointArray[index + 1].worldY;

      // the weighting function is a combination of:
      // - the distances from this internal point to the two adjacent points, normalized for edge length (longer distances are prioritized)
      // - the angle formed by this point and the two adjacent ones ('sharper' angles are prioritized)
      var inDist = (0, _util.distance)(x1, y1, x2, y2);
      var outDist = (0, _util.distance)(x2, y2, x3, y3);
      var theta = (0, _util.angleFromThreePoints)(x1, y1, x2, y2, x3, y3);
      var edgeLen = this.getWorldLength();
      var weight = inDist / edgeLen + outDist / edgeLen + Math.abs(Math.PI - theta) / Math.PI;

      return weight;
    }
  }, {
    key: 'hasTransit',
    value: function hasTransit() {
      for (var i = 0; i < this.edges.length; i++) {
        if (this.edges[i].hasTransit()) return true;
      }
      return false;
    }
  }, {
    key: 'isNonTransitPath',
    value: function isNonTransitPath() {
      return this.edges.length === 1 && this.edges[0].isNonTransitPath();
    }
  }, {
    key: 'getTurnPoints',
    value: function getTurnPoints(maxAngle) {
      maxAngle = maxAngle || 0.75 * Math.PI;
      return this.commonPoints.filter(function (pt) {
        return pt.getType() === 'TURN' && Math.abs(pt.turnAngle) < maxAngle;
      });
    }
  }]);
  return EdgeGroup;
}();

exports.default = EdgeGroup;
module.exports = exports['default'];

//# sourceMappingURL=edgegroup.js