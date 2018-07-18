"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A path through the network graph. Composed of PathSegments (which
 * are in turn composed of a sequence of graph edges)
 */
var NetworkPath = function () {
  /**
   * NetworkPath constructor
   * @param {Object} parent the parent object (a RoutePattern or Journey)
   */

  function NetworkPath(parent) {
    (0, _classCallCheck3.default)(this, NetworkPath);

    this.parent = parent;
    this.segments = [];
  }

  (0, _createClass3.default)(NetworkPath, [{
    key: "clearGraphData",
    value: function clearGraphData(segment) {
      this.segments.forEach(function (segment) {
        segment.clearGraphData();
      });
    }

    /**
     * addSegment: add a new segment to the end of this NetworkPath
     */

  }, {
    key: "addSegment",
    value: function addSegment(segment) {
      this.segments.push(segment);
      segment.points.forEach(function (point) {
        point.paths.push(this);
      }, this);
    }
  }, {
    key: "getRenderedSegments",
    value: function getRenderedSegments() {
      var renderedSegments = [];
      this.segments.forEach(function (pathSegment) {
        renderedSegments = renderedSegments.concat(pathSegment.renderedSegments);
      });
      return renderedSegments;
    }

    /**
     * getPointArray
     */

  }, {
    key: "getPointArray",
    value: function getPointArray() {
      var points = [];
      for (var i = 0; i < this.segments.length; i++) {
        var segment = this.segments[i];
        if (i > 0 && segment.points[0] === this.segments[i - 1].points[this.segments[i - 1].points.length - 1]) {
          points.concat(segment.points.slice(1));
        } else {
          points.concat(segment.points);
        }
      }
      return points;
    }
  }]);
  return NetworkPath;
}();

exports.default = NetworkPath;
module.exports = exports["default"];

//# sourceMappingURL=path.js