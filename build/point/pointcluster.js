'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Utility class used when clustering points into MultiPoint objects
 */

var PointCluster = function () {
  function PointCluster() {
    (0, _classCallCheck3.default)(this, PointCluster);

    this.points = [];
  }

  (0, _createClass3.default)(PointCluster, [{
    key: 'addPoint',
    value: function addPoint(point) {
      if (this.points.indexOf(point) === -1) this.points.push(point);
    }
  }, {
    key: 'mergeVertices',
    value: function mergeVertices(graph) {
      var vertices = [];
      (0, _lodash.forEach)(this.points, function (point) {
        vertices.push(point.graphVertex);
      });
      graph.mergeVertices(vertices);
    }
  }]);
  return PointCluster;
}();

exports.default = PointCluster;
module.exports = exports['default'];

//# sourceMappingURL=pointcluster.js