'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

var _point = require('./point');

var _point2 = _interopRequireDefault(_point);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *  Place: a Point subclass representing a 'place' that can be rendered on the
 *  map. A place is a point *other* than a transit stop/station, e.g. a home/work
 *  location, a point of interest, etc.
 */

var Place = function (_Point) {
  (0, _inherits3.default)(Place, _Point);

  /**
   *  the constructor
   */

  function Place(data) {
    (0, _classCallCheck3.default)(this, Place);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Place.__proto__ || (0, _getPrototypeOf2.default)(Place)).call(this, data));

    if (data && data.place_lat && data.place_lon) {
      var xy = _util.sm.forward([data.place_lon, data.place_lat]);
      _this.worldX = xy[0];
      _this.worldY = xy[1];
    }

    _this.zIndex = 100000;
    return _this;
  }

  /**
   * Get Type
   */

  (0, _createClass3.default)(Place, [{
    key: 'getType',
    value: function getType() {
      return 'PLACE';
    }

    /**
     * Get ID
     */

  }, {
    key: 'getId',
    value: function getId() {
      return this.place_id;
    }

    /**
     * Get Name
     */

  }, {
    key: 'getName',
    value: function getName() {
      return this.place_name;
    }

    /**
     * Get lat
     */

  }, {
    key: 'getLat',
    value: function getLat() {
      return this.place_lat;
    }

    /**
     * Get lon
     */

  }, {
    key: 'getLon',
    value: function getLon() {
      return this.place_lon;
    }
  }, {
    key: 'containsSegmentEndPoint',
    value: function containsSegmentEndPoint() {
      return true;
    }
  }, {
    key: 'containsFromPoint',
    value: function containsFromPoint() {
      return this.getId() === 'from';
    }
  }, {
    key: 'containsToPoint',
    value: function containsToPoint() {
      return this.getId() === 'to';
    }
  }, {
    key: 'addRenderData',
    value: function addRenderData(pointInfo) {
      this.renderData.push(pointInfo);
    }
  }, {
    key: 'getRenderDataArray',
    value: function getRenderDataArray() {
      return this.renderData;
    }
  }, {
    key: 'clearRenderData',
    value: function clearRenderData() {
      this.renderData = [];
    }

    /**
     * Draw a place
     *
     * @param {Display} display
     */

  }, {
    key: 'render',
    value: function render(display) {
      (0, _get3.default)(Place.prototype.__proto__ || (0, _getPrototypeOf2.default)(Place.prototype), 'render', this).call(this, display);
      var styler = display.styler;
      if (!this.renderData) return;

      var displayStyle = styler.compute2('places', 'display', this);
      if (displayStyle === 'none') return;

      this.renderXY = {
        x: display.xScale.compute(display.activeZoomFactors.useGeographicRendering ? this.worldX : this.graphVertex.x),
        y: display.yScale.compute(display.activeZoomFactors.useGeographicRendering ? this.worldY : this.graphVertex.y)
      };

      var radius = styler.compute2('places', 'r', this) || 10;
      display.drawCircle(this.renderXY, {
        r: radius,
        fill: styler.compute2('places', 'fill', this) || '#fff',
        stroke: styler.compute2('places', 'stroke', this) || '#000',
        'stroke-width': styler.compute2('places', 'stroke-width', this) || 2
      });

      this.markerBBox = {
        x: this.renderXY.x - radius,
        y: this.renderXY.y - radius,
        width: radius * 2,
        height: radius * 2
      };
    }

    /**
     * Refresh the place
     *
     * @param {Display} display
     */

  }, {
    key: 'refresh',
    value: function refresh(display) {}
  }]);
  return Place;
}(_point2.default);

exports.default = Place;
module.exports = exports['default'];

//# sourceMappingURL=place.js