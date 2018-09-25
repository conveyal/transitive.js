'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

var _pointlabel = require('../labeler/pointlabel');

var _pointlabel2 = _interopRequireDefault(_pointlabel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Point = function () {
  function Point(data) {
    (0, _classCallCheck3.default)(this, Point);

    for (var key in data) {
      this[key] = data[key];
    }

    this.paths = [];
    this.renderData = [];

    this.label = new _pointlabel2.default(this);
    this.renderLabel = true;

    this.focused = true;
    this.sortableType = 'POINT';

    this.placeOffsets = {
      x: 0,
      y: 0
    };

    this.zIndex = 10000;
  }

  /**
   * Get unique ID for point -- must be defined by subclass
   */

  (0, _createClass3.default)(Point, [{
    key: 'getId',
    value: function getId() {}
  }, {
    key: 'getElementId',
    value: function getElementId() {
      return this.getType().toLowerCase() + '-' + this.getId();
    }

    /**
     * Get Point type -- must be defined by subclass
     */

  }, {
    key: 'getType',
    value: function getType() {}

    /**
     * Get Point name
     */

  }, {
    key: 'getName',
    value: function getName() {
      return this.getType() + ' point (ID=' + this.getId() + ')';
    }

    /**
     * Get latitude
     */

  }, {
    key: 'getLat',
    value: function getLat() {
      return 0;
    }

    /**
     * Get longitude
     */

  }, {
    key: 'getLon',
    value: function getLon() {
      return 0;
    }
  }, {
    key: 'containsSegmentEndPoint',
    value: function containsSegmentEndPoint() {
      return false;
    }
  }, {
    key: 'containsBoardPoint',
    value: function containsBoardPoint() {
      return false;
    }
  }, {
    key: 'containsAlightPoint',
    value: function containsAlightPoint() {
      return false;
    }
  }, {
    key: 'containsTransferPoint',
    value: function containsTransferPoint() {
      return false;
    }
  }, {
    key: 'getPatterns',
    value: function getPatterns() {
      return [];
    }

    /**
     * Draw the point
     *
     * @param {Display} display
     */

  }, {
    key: 'render',
    value: function render(display) {}
  }, {
    key: 'addRenderData',
    value: function addRenderData() {}
  }, {
    key: 'clearRenderData',
    value: function clearRenderData() {}
  }, {
    key: 'containsFromPoint',
    value: function containsFromPoint() {
      return false;
    }
  }, {
    key: 'containsToPoint',
    value: function containsToPoint() {
      return false;
    }

    //* * Shared geom utility functions **//

  }, {
    key: 'constructMergedMarker',
    value: function constructMergedMarker(display) {
      var dataArray = this.getRenderDataArray();
      var xValues = [];
      var yValues = [];
      dataArray.forEach(function (data) {
        var x = data.x;
        var y = data.y;
        xValues.push(x);
        yValues.push(y);
      });
      var minX = Math.min.apply(Math, xValues);
      var minY = Math.min.apply(Math, yValues);
      var maxX = Math.max.apply(Math, xValues);
      var maxY = Math.max.apply(Math, yValues);

      // retrieve marker type and radius from the styler
      var markerType = display.styler.compute(display.styler.stops_merged['marker-type'], display, {
        owner: this
      });
      var stylerRadius = display.styler.compute(display.styler.stops_merged.r, display, {
        owner: this
      });

      var width;
      var height;
      var r;

      // if this is a circle marker w/ a styler-defined fixed radius, use that
      if (markerType === 'circle' && stylerRadius) {
        width = height = stylerRadius * 2;
        r = stylerRadius;
        // otherwise, this is a dynamically-sized marker
      } else {
        var dx = maxX - minX;
        var dy = maxY - minY;

        var markerPadding = display.styler.compute(display.styler.stops_merged['marker-padding'], display, {
          owner: this
        }) || 0;

        var patternRadius = display.styler.compute(display.styler[this.patternStylerKey].r, display, {
          owner: this
        });
        r = parseFloat(patternRadius) + markerPadding;

        if (markerType === 'circle') {
          width = height = Math.max(dx, dy) + 2 * r;
          r = width / 2;
        } else {
          width = dx + 2 * r;
          height = dy + 2 * r;
          if (markerType === 'rectangle') r = 0;
        }
      }

      return {
        x: (minX + maxX) / 2 - width / 2,
        y: (minY + maxY) / 2 - height / 2,
        width: width,
        height: height,
        rx: r,
        ry: r
      };
    }
  }, {
    key: 'initMarkerData',
    value: function initMarkerData(display) {
      if (this.getType() !== 'STOP' && this.getType() !== 'MULTI') return;

      this.mergedMarkerData = this.constructMergedMarker(display);

      this.placeOffsets = {
        x: 0,
        y: 0
      };
      if (this.adjacentPlace) {
        var placeR = display.styler.compute(display.styler.places.r, display, {
          owner: this.adjacentPlace
        });

        var placeX = display.xScale.compute(this.adjacentPlace.worldX);
        var placeY = display.yScale.compute(this.adjacentPlace.worldY);

        var thisR = this.mergedMarkerData.width / 2;
        var thisX = this.mergedMarkerData.x + thisR;
        var thisY = this.mergedMarkerData.y + thisR;

        var dx = thisX - placeX;
        var dy = thisY - placeY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (placeR + thisR > dist) {
          var f = (placeR + thisR) / dist;
          this.placeOffsets = {
            x: dx * f - dx,
            y: dy * f - dy
          };

          this.mergedMarkerData.x += this.placeOffsets.x;
          this.mergedMarkerData.y += this.placeOffsets.y;

          (0, _lodash.forEach)(this.graphVertex.incidentEdges(), function (edge) {
            (0, _lodash.forEach)(edge.renderSegments, function (segment) {
              segment.refreshRenderData(display);
            });
          });
        }
      }
    }
  }, {
    key: 'getMarkerBBox',
    value: function getMarkerBBox() {
      return this.markerBBox;
    }
  }, {
    key: 'setFocused',
    value: function setFocused(focused) {
      this.focused = focused;
    }
  }, {
    key: 'isFocused',
    value: function isFocused() {
      return this.focused === true;
    }
  }, {
    key: 'runFocusTransition',
    value: function runFocusTransition(display, callback) {}
  }, {
    key: 'setAllPatternsFocused',
    value: function setAllPatternsFocused() {}
  }, {
    key: 'getZIndex',
    value: function getZIndex() {
      return this.zIndex;
    }
  }, {
    key: 'getAverageCoord',
    value: function getAverageCoord() {
      var dataArray = this.getRenderDataArray();

      var xTotal = 0;
      var yTotal = 0;
      (0, _lodash.forEach)(dataArray, function (data) {
        xTotal += data.x;
        yTotal += data.y;
      });

      return {
        x: xTotal / dataArray.length,
        y: yTotal / dataArray.length
      };
    }
  }, {
    key: 'hasRenderData',
    value: function hasRenderData() {
      var dataArray = this.getRenderDataArray();
      return dataArray && dataArray.length > 0;
    }
  }, {
    key: 'makeDraggable',
    value: function makeDraggable(transitive) {}
  }, {
    key: 'toString',
    value: function toString() {
      return this.getType() + ' point: ' + this.getId() + ' (' + this.getName() + ')';
    }
  }]);
  return Point;
}();

exports.default = Point;
module.exports = exports['default'];

//# sourceMappingURL=point.js