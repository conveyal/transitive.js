'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _linearScale = require('../util/linear-scale.js');

var _linearScale2 = _interopRequireDefault(_linearScale);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Display = function () {
  function Display(transitive) {
    (0, _classCallCheck3.default)(this, Display);

    this.transitive = transitive;

    this.zoomFactors = transitive.options.zoomFactors || this.getDefaultZoomFactors();

    this.updateActiveZoomFactors(1);
  }

  (0, _createClass3.default)(Display, [{
    key: 'setDimensions',
    value: function setDimensions(width, height) {
      this.width = width;
      this.height = height;
    }
  }, {
    key: 'setXDomain',
    value: function setXDomain(domain) {
      // [minX , maxX]
      this.xDomain = domain;
      this.xScale = new _linearScale2.default(domain, [0, this.width]);
      if (!this.initialXDomain) {
        this.initialXDomain = domain;
        this.initialXRes = (domain[1] - domain[0]) / this.width;
      }
    }
  }, {
    key: 'setYDomain',
    value: function setYDomain(domain) {
      // [minY , maxY]
      this.yDomain = domain;
      this.yScale = new _linearScale2.default(domain, [this.height, 0]);
      if (!this.initialYDomain) this.initialYDomain = domain;
    }
  }, {
    key: 'fitToWorldBounds',
    value: function fitToWorldBounds(bounds) {
      var domains = this.computeDomainsFromBounds(bounds);
      this.setXDomain(domains[0]);
      this.setYDomain(domains[1]);
      this.computeScale();
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.initialXDomain = null;
      this.initialYDomain = null;
      this.scaleSet = false;
      this.lastScale = undefined;
    }

    /**
     * Apply a transformation {x, y, k} to the *initial* state of the map, where
     * (x, y) is the pixel offset and k is a scale factor relative to an initial
     * zoom level of 1.0. Intended primarily to support D3-style panning/zooming.
     */

  }, {
    key: 'applyTransform',
    value: function applyTransform(transform) {
      var x = transform.x,
          y = transform.y,
          k = transform.k;


      var xMin = this.initialXDomain[0];
      var xMax = this.initialXDomain[1];
      var yMin = this.initialYDomain[0];
      var yMax = this.initialYDomain[1];

      // Apply the scale factor
      xMax = xMin + (xMax - xMin) / k;
      yMin = yMax - (yMax - yMin) / k;

      // Apply the translation
      var xOffset = -x * (xMax - xMin) / this.width;
      xMin += xOffset;
      xMax += xOffset;
      var yOffset = y * (yMax - yMin) / this.height;
      yMin += yOffset;
      yMax += yOffset;

      // Update the scale functions and recompute the internal scale factor
      this.setXDomain([xMin, xMax]);
      this.setYDomain([yMin, yMax]);
      this.computeScale();
    }
  }, {
    key: 'getDefaultZoomFactors',
    value: function getDefaultZoomFactors(data) {
      return [{
        minScale: 0,
        gridCellSize: 25,
        internalVertexFactor: 1000000,
        angleConstraint: 45,
        mergeVertexThreshold: 200
      }, {
        minScale: 1.5,
        gridCellSize: 0,
        internalVertexFactor: 0,
        angleConstraint: 5,
        mergeVertexThreshold: 0
      }];
    }
  }, {
    key: 'updateActiveZoomFactors',
    value: function updateActiveZoomFactors(scale) {
      var updated = false;
      for (var i = 0; i < this.zoomFactors.length; i++) {
        var min = this.zoomFactors[i].minScale;
        var max = i < this.zoomFactors.length - 1 ? this.zoomFactors[i + 1].minScale : Number.MAX_VALUE;

        // check if we've crossed into a new zoomFactor partition
        if ((!this.lastScale || this.lastScale < min || this.lastScale >= max) && scale >= min && scale < max) {
          this.activeZoomFactors = this.zoomFactors[i];
          updated = true;
        }
      }
      return updated;
    }
  }, {
    key: 'computeScale',
    value: function computeScale() {
      this.lastScale = this.scale;
      this.scaleSet = true;
      var newXRes = (this.xDomain[1] - this.xDomain[0]) / this.width;
      this.scale = this.initialXRes / newXRes;
      if (this.lastScale !== this.scale) this.scaleChanged();
    }
  }, {
    key: 'scaleChanged',
    value: function scaleChanged() {
      var zoomFactorsChanged = this.updateActiveZoomFactors(this.scale);
      if (zoomFactorsChanged) {
        this.transitive.network = null;
        this.transitive.render();
      }
    }

    /**
     * Compute the x/y coordinate space domains to fit the graph.
     */

  }, {
    key: 'computeDomainsFromBounds',
    value: function computeDomainsFromBounds(bounds) {
      var xmin = bounds[0][0];
      var xmax = bounds[1][0];
      var ymin = bounds[0][1];
      var ymax = bounds[1][1];
      var xRange = xmax - xmin;
      var yRange = ymax - ymin;

      var options = this.transitive.options;


      var paddingFactor = options && options.paddingFactor ? options.paddingFactor : 0.1;

      var margins = this.getMargins();

      var usableHeight = this.height - margins.top - margins.bottom;
      var usableWidth = this.width - margins.left - margins.right;
      var displayAspect = this.width / this.height;
      var usableDisplayAspect = usableWidth / usableHeight;
      var graphAspect = xRange / (yRange === 0 ? -Infinity : yRange);

      var padding;
      var dispX1, dispX2, dispY1, dispY2;
      var dispXRange, dispYRange;

      if (usableDisplayAspect > graphAspect) {
        // y-axis is limiting
        padding = paddingFactor * yRange;
        dispY1 = ymin - padding;
        dispY2 = ymax + padding;
        dispYRange = yRange + 2 * padding;
        var addedYRange = this.height / usableHeight * dispYRange - dispYRange;
        if (margins.top > 0 || margins.bottom > 0) {
          dispY1 -= margins.bottom / (margins.bottom + margins.top) * addedYRange;
          dispY2 += margins.top / (margins.bottom + margins.top) * addedYRange;
        }
        dispXRange = (dispY2 - dispY1) * displayAspect;
        var xOffset = (margins.left - margins.right) / this.width;
        var xMidpoint = (xmax + xmin - dispXRange * xOffset) / 2;
        dispX1 = xMidpoint - dispXRange / 2;
        dispX2 = xMidpoint + dispXRange / 2;
      } else {
        // x-axis limiting
        padding = paddingFactor * xRange;
        dispX1 = xmin - padding;
        dispX2 = xmax + padding;
        dispXRange = xRange + 2 * padding;
        var addedXRange = this.width / usableWidth * dispXRange - dispXRange;
        if (margins.left > 0 || margins.right > 0) {
          dispX1 -= margins.left / (margins.left + margins.right) * addedXRange;
          dispX2 += margins.right / (margins.left + margins.right) * addedXRange;
        }

        dispYRange = (dispX2 - dispX1) / displayAspect;
        var yOffset = (margins.bottom - margins.top) / this.height;
        var yMidpoint = (ymax + ymin - dispYRange * yOffset) / 2;
        dispY1 = yMidpoint - dispYRange / 2;
        dispY2 = yMidpoint + dispYRange / 2;
      }

      return [[dispX1, dispX2], [dispY1, dispY2]];
    }
  }, {
    key: 'getMargins',
    value: function getMargins() {
      return (0, _assign2.default)({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      }, this.transitive.options.displayMargins);
    }
  }, {
    key: 'isInRange',
    value: function isInRange(x, y) {
      return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
    }

    /** Methods to be defined by subclasses **/

  }, {
    key: 'clear',
    value: function clear() {}
  }, {
    key: 'drawCircle',
    value: function drawCircle(coord, attrs) {}
  }, {
    key: 'drawEllipse',
    value: function drawEllipse(coord, attrs) {}
  }, {
    key: 'drawRect',
    value: function drawRect(upperLeft, attrs) {}
  }, {
    key: 'drawText',
    value: function drawText(text, anchor, attrs) {}
  }, {
    key: 'drawPath',
    value: function drawPath(renderData, attrs) {}
  }]);
  return Display;
}(); //import { scaleLinear } from 'd3-scale'


exports.default = Display;
module.exports = exports['default'];

//# sourceMappingURL=display.js