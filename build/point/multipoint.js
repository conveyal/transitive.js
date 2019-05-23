'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *  MultiPoint: a Point subclass representing a collection of multiple points
 *  that have been merged into one for display purposes.
 */

var MultiPoint = function (_Point) {
  (0, _inherits3.default)(MultiPoint, _Point);

  function MultiPoint(pointArray) {
    (0, _classCallCheck3.default)(this, MultiPoint);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MultiPoint.__proto__ || (0, _getPrototypeOf2.default)(MultiPoint)).call(this));

    _this.points = [];
    if (pointArray) {
      (0, _lodash.forEach)(pointArray, function (point) {
        _this.addPoint(point);
      });
    }
    _this.renderData = [];
    _this.id = 'multi';
    _this.toPoint = _this.fromPoint = null;

    _this.patternStylerKey = 'multipoints_pattern';
    return _this;
  }

  /**
   * Get id
   */

  (0, _createClass3.default)(MultiPoint, [{
    key: 'getId',
    value: function getId() {
      return this.id;
    }

    /**
     * Get type
     */

  }, {
    key: 'getType',
    value: function getType() {
      return 'MULTI';
    }
  }, {
    key: 'getName',
    value: function getName() {
      if (this.fromPoint) return this.fromPoint.getName();
      if (this.toPoint) return this.toPoint.getName();
      var shortest = null;
      (0, _lodash.forEach)(this.points, function (point) {
        if (point.getType() === 'TURN') return;
        if (!shortest || point.getName().length < shortest.length) shortest = point.getName();
      });

      return shortest;
    }
  }, {
    key: 'containsSegmentEndPoint',
    value: function containsSegmentEndPoint() {
      for (var i = 0; i < this.points.length; i++) {
        if (this.points[i].containsSegmentEndPoint()) return true;
      }
      return false;
    }
  }, {
    key: 'containsBoardPoint',
    value: function containsBoardPoint() {
      for (var i = 0; i < this.points.length; i++) {
        if (this.points[i].containsBoardPoint()) return true;
      }
      return false;
    }
  }, {
    key: 'containsAlightPoint',
    value: function containsAlightPoint() {
      for (var i = 0; i < this.points.length; i++) {
        if (this.points[i].containsAlightPoint()) return true;
      }
      return false;
    }
  }, {
    key: 'containsTransferPoint',
    value: function containsTransferPoint() {
      for (var i = 0; i < this.points.length; i++) {
        if (this.points[i].containsTransferPoint()) return true;
      }
      return false;
    }
  }, {
    key: 'containsFromPoint',
    value: function containsFromPoint() {
      return this.fromPoint !== null;
    }
  }, {
    key: 'containsToPoint',
    value: function containsToPoint() {
      return this.toPoint !== null;
    }
  }, {
    key: 'getPatterns',
    value: function getPatterns() {
      var patterns = [];

      (0, _lodash.forEach)(this.points, function (point) {
        if (!point.patterns) return;
        (0, _lodash.forEach)(point.patterns, function (pattern) {
          if (patterns.indexOf(pattern) === -1) patterns.push(pattern);
        });
      });

      return patterns;
    }
  }, {
    key: 'addPoint',
    value: function addPoint(point) {
      if (this.points.indexOf(point) !== -1) return;
      this.points.push(point);
      this.id += '-' + point.getId();
      if (point.containsFromPoint()) {
        // getType() === 'PLACE' && point.getId() === 'from') {
        this.fromPoint = point;
      }
      if (point.containsToPoint()) {
        // getType() === 'PLACE' && point.getId() === 'to') {
        this.toPoint = point;
      }
      this.calcWorldCoords();
    }
  }, {
    key: 'calcWorldCoords',
    value: function calcWorldCoords() {
      var tx = 0;
      var ty = 0;
      (0, _lodash.forEach)(this.points, function (point) {
        tx += point.worldX;
        ty += point.worldY;
      });

      this.worldX = tx / this.points.length;
      this.worldY = ty / this.points.length;
    }

    /**
     * Add render data
     *
     * @param {Object} stopInfo
     */

  }, {
    key: 'addRenderData',
    value: function addRenderData(pointInfo) {
      if (pointInfo.offsetX !== 0 || pointInfo.offsetY !== 0) this.hasOffsetPoints = true;
      this.renderData.push(pointInfo);
    }
  }, {
    key: 'clearRenderData',
    value: function clearRenderData() {
      this.hasOffsetPoints = false;
      this.renderData = [];
    }

    /**
     * Draw a multipoint
     *
     * @param {Display} display
     */

  }, {
    key: 'render',
    value: function render(display) {
      (0, _get3.default)(MultiPoint.prototype.__proto__ || (0, _getPrototypeOf2.default)(MultiPoint.prototype), 'render', this).call(this, display);

      if (!this.renderData) return;

      // Compute the bounds of the merged marker
      var xArr = this.renderData.map(function (d) {
        return d.x;
      });
      var yArr = this.renderData.map(function (d) {
        return d.y;
      });
      var xMin = Math.min.apply(Math, (0, _toConsumableArray3.default)(xArr));
      var xMax = Math.max.apply(Math, (0, _toConsumableArray3.default)(xArr));
      var yMin = Math.min.apply(Math, (0, _toConsumableArray3.default)(yArr));
      var yMax = Math.max.apply(Math, (0, _toConsumableArray3.default)(yArr));

      var r = 6;
      var x = xMin - r;
      var y = yMin - r;
      var width = xMax - xMin + r * 2;
      var height = yMax - yMin + r * 2;

      // Draw the merged marker
      display.drawRect({ x: x, y: y }, {
        width: width,
        height: height,
        rx: r,
        ry: r,
        fill: '#fff',
        stroke: '#000',
        'stroke-width': 2
      });

      // Store marker bounding box
      this.markerBBox = { x: x, y: y, width: width, height: height };

      // TODO: support pattern-specific markers
    }
  }, {
    key: 'initMergedMarker',
    value: function initMergedMarker(display) {
      // set up the merged marker
      if (this.fromPoint || this.toPoint) {
        this.mergedMarker = this.markerSvg.append('g').append('circle').datum({
          owner: this
        }).attr('class', 'transitive-multipoint-marker-merged');
      } else if (this.hasOffsetPoints || this.renderData.length > 1) {
        this.mergedMarker = this.markerSvg.append('g').append('rect').datum({
          owner: this
        }).attr('class', 'transitive-multipoint-marker-merged');
      }
    }
  }, {
    key: 'getRenderDataArray',
    value: function getRenderDataArray() {
      return this.renderData;
    }
  }, {
    key: 'setFocused',
    value: function setFocused(focused) {
      this.focused = focused;
      (0, _lodash.forEach)(this.points, function (point) {
        point.setFocused(focused);
      });
    }
  }, {
    key: 'runFocusTransition',
    value: function runFocusTransition(display, callback) {
      if (this.mergedMarker) {
        var newStrokeColor = display.styler.compute(display.styler.multipoints_merged.stroke, display, {
          owner: this
        });
        this.mergedMarker.transition().style('stroke', newStrokeColor).call(callback);
      }
      if (this.label) this.label.runFocusTransition(display, callback);
    }
  }]);
  return MultiPoint;
}(_point2.default);

exports.default = MultiPoint;
module.exports = exports['default'];

//# sourceMappingURL=multipoint.js