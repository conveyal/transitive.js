'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

var _path = require('./path');

var _path2 = _interopRequireDefault(_path);

var _pathsegment = require('./pathsegment');

var _pathsegment2 = _interopRequireDefault(_pathsegment);

var _polyline = require('../util/polyline.js');

var _polyline2 = _interopRequireDefault(_polyline);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A RoutePattern
 */
var RoutePattern = function () {
  /**
   * RoutePattern constructor
   *
   * @param {Object} RoutePattern data object from the transitive.js input
   */

  function RoutePattern(data, transitive) {
    var _this = this;

    (0, _classCallCheck3.default)(this, RoutePattern);

    for (var key in data) {
      if (key === 'stops') continue;
      this[key] = data[key];
    }

    // the array of Stops that make up this pattern
    this.stops = [];

    // the inter-stop geometry, an array of point sequences (themselves arrays)
    // that represent the geometry beween stops i and i+1. This array should be
    // exactly one item shorter than the stops array.
    this.interStopGeometry = [];

    if (transitive) {
      (0, _lodash.forEach)(data.stops, function (stop) {
        // look up the Stop in the master collection and add to the stops array
        _this.stops.push(transitive.stops[stop.stop_id]);

        // if inter-stop geometry is provided: decode polyline, convert points
        // to SphericalMercator, and add to the interStopGeometry array
        if (stop.geometry) {
          var latLons = _polyline2.default.decode(stop.geometry);
          var coords = [];
          (0, _lodash.forEach)(latLons, function (latLon) {
            coords.push(_util.sm.forward([latLon[1], latLon[0]]));
          });
          _this.interStopGeometry.push(coords);
        }
      });
    }

    this.renderedEdges = [];
  }

  (0, _createClass3.default)(RoutePattern, [{
    key: 'getId',
    value: function getId() {
      return this.pattern_id;
    }
  }, {
    key: 'getElementId',
    value: function getElementId() {
      return 'pattern-' + this.pattern_id;
    }
  }, {
    key: 'getName',
    value: function getName() {
      return this.pattern_name;
    }
  }, {
    key: 'addRenderedEdge',
    value: function addRenderedEdge(rEdge) {
      if (this.renderedEdges.indexOf(rEdge) === -1) this.renderedEdges.push(rEdge);
    }
  }, {
    key: 'offsetAlignment',
    value: function offsetAlignment(alignmentId, offset) {
      (0, _lodash.forEach)(this.renderedEdges, function (rEdge) {
        rEdge.offsetAlignment(alignmentId, offset);
      });
    }
  }, {
    key: 'createPath',
    value: function createPath() {
      var path = new _path2.default(this);
      var pathSegment = new _pathsegment2.default('TRANSIT', path);
      pathSegment.addPattern(this, 0, this.stops.length - 1);
      path.addSegment(pathSegment);
      return path;
    }
  }]);
  return RoutePattern;
}();

exports.default = RoutePattern;
module.exports = exports['default'];

//# sourceMappingURL=pattern.js