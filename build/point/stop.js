'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _lodash = require('lodash');

var _point = require('./point');

var _point2 = _interopRequireDefault(_point);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *  Place: a Point subclass representing a 'place' that can be rendered on the
 *  map. A place is a point *other* than a transit stop/station, e.g. a home/work
 *  location, a point of interest, etc.
 */

var Stop = function (_Point) {
  (0, _inherits3.default)(Stop, _Point);

  function Stop(data) {
    (0, _classCallCheck3.default)(this, Stop);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Stop.__proto__ || (0, _getPrototypeOf2.default)(Stop)).call(this, data));

    if (data && data.stop_lat && data.stop_lon) {
      var xy = _util.sm.forward([data.stop_lon, data.stop_lat]);
      _this.worldX = xy[0];
      _this.worldY = xy[1];
    }

    _this.patterns = [];

    _this.patternRenderData = {};
    _this.patternFocused = {};
    _this.patternCount = 0;

    _this.patternStylerKey = 'stops_pattern';

    _this.isSegmentEndPoint = false;
    return _this;
  }

  /**
   * Get id
   */

  (0, _createClass3.default)(Stop, [{
    key: 'getId',
    value: function getId() {
      return this.stop_id;
    }

    /**
     * Get type
     */

  }, {
    key: 'getType',
    value: function getType() {
      return 'STOP';
    }

    /**
     * Get name
     */

  }, {
    key: 'getName',
    value: function getName() {
      if (!this.stop_name) return 'Unnamed Stop (ID=' + this.getId() + ')';
      return this.stop_name;
    }

    /**
     * Get lat
     */

  }, {
    key: 'getLat',
    value: function getLat() {
      return this.stop_lat;
    }

    /**
     * Get lon
     */

  }, {
    key: 'getLon',
    value: function getLon() {
      return this.stop_lon;
    }
  }, {
    key: 'containsSegmentEndPoint',
    value: function containsSegmentEndPoint() {
      return this.isSegmentEndPoint;
    }
  }, {
    key: 'containsBoardPoint',
    value: function containsBoardPoint() {
      return this.isBoardPoint;
    }
  }, {
    key: 'containsAlightPoint',
    value: function containsAlightPoint() {
      return this.isAlightPoint;
    }
  }, {
    key: 'containsTransferPoint',
    value: function containsTransferPoint() {
      return this.isTransferPoint;
    }
  }, {
    key: 'getPatterns',
    value: function getPatterns() {
      return this.patterns;
    }
  }, {
    key: 'addPattern',
    value: function addPattern(pattern) {
      if (this.patterns.indexOf(pattern) === -1) this.patterns.push(pattern);
    }

    /**
     * Add render data
     *
     * @param {Object} stopInfo
     */

  }, {
    key: 'addRenderData',
    value: function addRenderData(stopInfo) {
      var _this2 = this;

      if (stopInfo.rEdge.getType() === 'TRANSIT') {
        var s = {
          sortableType: 'POINT_STOP_PATTERN',
          owner: this,
          getZIndex: function getZIndex() {
            if (this.owner.graphVertex) {
              return this.owner.getZIndex();
            }
            return this.rEdge.getZIndex() + 1;
          }
        };

        for (var key in stopInfo) {
          s[key] = stopInfo[key];
        }var patternId = stopInfo.rEdge.patternIds;
        this.patternRenderData[patternId] = s; // .push(s);

        (0, _lodash.forEach)(stopInfo.rEdge.patterns, function (pattern) {
          _this2.addPattern(pattern);
        });
      }
      this.patternCount = (0, _keys2.default)(this.patternRenderData).length;
    }
  }, {
    key: 'isPatternFocused',
    value: function isPatternFocused(patternId) {
      if (!(patternId in this.patternFocused)) return true;
      return this.patternFocused[patternId];
    }
  }, {
    key: 'setPatternFocused',
    value: function setPatternFocused(patternId, focused) {
      this.patternFocused[patternId] = focused;
    }
  }, {
    key: 'setAllPatternsFocused',
    value: function setAllPatternsFocused(focused) {
      for (var key in this.patternRenderData) {
        this.patternFocused[key] = focused;
      }
    }

    /**
     * Draw a stop
     *
     * @param {Display} display
     */

  }, {
    key: 'render',
    value: function render(display) {
      (0, _get3.default)(Stop.prototype.__proto__ || (0, _getPrototypeOf2.default)(Stop.prototype), 'render', this).call(this, display);

      if (this.patternCount === 0) return;

      this.initMarkerData(display);

      var styler = display.styler;

      // For segment endpoints, draw the "merged" marker
      if (this.isSegmentEndPoint && this.mergedMarkerData) {
        display.drawRect({
          x: this.mergedMarkerData.x,
          y: this.mergedMarkerData.y
        }, {
          width: this.mergedMarkerData.width,
          height: this.mergedMarkerData.height,
          rx: this.mergedMarkerData.rx,
          ry: this.mergedMarkerData.ry,
          fill: styler.compute2('stops_merged', 'fill', this),
          stroke: styler.compute2('stops_merged', 'stroke', this),
          'stroke-width': styler.compute2('stops_merged', 'stroke-width', this)
        });

        // store marker bounding box
        this.markerBBox = {
          x: this.mergedMarkerData.x,
          y: this.mergedMarkerData.y,
          width: this.mergedMarkerData.width,
          height: this.mergedMarkerData.height
        };
      }

      // TODO: Restore inline stop
      if (!this.isSegmentEndPoint) {
        var renderDataArray = this.getRenderDataArray();
        /*for (let renderData of renderDataArray) {
          display.drawCircle({
            x: renderData.x,
            y: renderData.y
          }, {
            fill: '#fff',
            r: renderData.rEdge.lineWidth * 0.4
          })
        }*/
      }
    }
  }, {
    key: 'getRenderDataArray',
    value: function getRenderDataArray() {
      var dataArray = [];
      for (var patternId in this.patternRenderData) {
        dataArray.push(this.patternRenderData[patternId]);
      }
      return dataArray;
    }
  }, {
    key: 'clearRenderData',
    value: function clearRenderData() {
      this.patternRenderData = {};
      this.mergedMarkerData = null;
      this.placeOffsets = {
        x: 0,
        y: 0
      };
    }
  }]);
  return Stop;
}(_point2.default);

exports.default = Stop;
module.exports = exports['default'];

//# sourceMappingURL=stop.js