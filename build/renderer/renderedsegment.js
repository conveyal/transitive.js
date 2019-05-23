'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * RenderedSegment
 */

var rSegmentId = 0;

var RenderedSegment = function () {
  function RenderedSegment(pathSegment) {
    (0, _classCallCheck3.default)(this, RenderedSegment);

    this.id = rSegmentId++;
    this.renderedEdges = [];
    this.pathSegment = pathSegment;
    if (pathSegment) this.type = pathSegment.type;
    this.focused = true;
  }

  (0, _createClass3.default)(RenderedSegment, [{
    key: 'getId',
    value: function getId() {
      return this.id;
    }
  }, {
    key: 'getType',
    value: function getType() {
      return this.type;
    }
  }, {
    key: 'addRenderedEdge',
    value: function addRenderedEdge(rEdge) {
      this.renderedEdges.push(rEdge);
    }
  }, {
    key: 'render',
    value: function render(display) {
      var _this = this;

      var styler = display.styler;

      this.renderData = [];
      (0, _lodash.forEach)(this.renderedEdges, function (rEdge) {
        _this.renderData = _this.renderData.concat(rEdge.renderData);
      });

      // Check if this segment is to be drawn as an arc; if so replace render data
      if (this.pathSegment.journeySegment && this.pathSegment.journeySegment.arc) {
        var first = this.renderData[0];
        var last = this.renderData[this.renderData.length - 1];
        var v = {
          x: last.x - first.x,
          y: last.y - first.y
        };
        var vp = (0, _util.rotateVector)((0, _util.normalizeVector)(v), -Math.PI / 2);
        var dist = (0, _util.distance)(first.x, first.y, last.x, last.y);
        var arc = {
          x: last.x,
          y: last.y,
          arc: -45,
          radius: dist * 0.75,
          ex: (last.x + first.x) / 2 + vp.x * (dist / 4),
          ey: (last.y + first.y) / 2 + vp.y * (dist / 4)
        };
        this.renderData = [first, arc, last];
      }

      display.drawPath(this.renderData, {
        fill: 'none',
        stroke: styler.compute2('segments', 'stroke', this),
        'stroke-width': styler.compute2('segments', 'stroke-width', this),
        'stroke-dasharray': styler.compute2('segments', 'stroke-dasharray', this),
        'stroke-linecap': styler.compute2('segments', 'stroke-linecap', this)
      });
    }
  }, {
    key: 'setFocused',
    value: function setFocused(focused) {
      this.focused = focused;
    }
  }, {
    key: 'isFocused',
    value: function isFocused() {
      return this.focused;
    }
  }, {
    key: 'runFocusTransition',
    value: function runFocusTransition(display, callback) {
      var newColor = display.styler.compute(display.styler.segments.stroke, display, this);
      this.lineGraph.transition().style('stroke', newColor).call(callback);
    }
  }, {
    key: 'getZIndex',
    value: function getZIndex() {
      return this.zIndex;
    }
  }, {
    key: 'computeLineWidth',
    value: function computeLineWidth(display, includeEnvelope) {
      var styler = display.styler;
      if (styler && display) {
        // compute the line width
        var env = styler.compute(styler.segments.envelope, display, this);
        if (env && includeEnvelope) {
          return parseFloat(env.substring(0, env.length - 2), 10) - 2;
        } else {
          var lw = styler.compute(styler.segments['stroke-width'], display, this);
          return parseFloat(lw.substring(0, lw.length - 2), 10) - 2;
        }
      }
    }
  }, {
    key: 'compareTo',
    value: function compareTo(other) {
      // show transit segments in front of other types
      if (this.type === 'TRANSIT' && other.type !== 'TRANSIT') return -1;
      if (other.type === 'TRANSIT' && this.type !== 'TRANSIT') return 1;

      if (this.type === 'TRANSIT' && other.type === 'TRANSIT') {
        // for two transit segments, try sorting transit mode first
        if (this.mode && other.mode && this.mode !== other.mode) {
          return this.mode > other.mode;
        }

        // for two transit segments of the same mode, sort by id (for display consistency)
        return this.getId() < other.getId();
      }
    }
  }, {
    key: 'getLabelTextArray',
    value: function getLabelTextArray() {
      var textArray = [];
      (0, _lodash.forEach)(this.patterns, function (pattern) {
        var shortName = pattern.route.route_short_name;
        if (textArray.indexOf(shortName) === -1) textArray.push(shortName);
      });
      return textArray;
    }
  }, {
    key: 'getLabelAnchors',
    value: function getLabelAnchors(display, spacing) {
      var labelAnchors = [];
      this.computeRenderLength(display);
      var anchorCount = Math.floor(this.renderLength / spacing);
      var pctSpacing = spacing / this.renderLength;

      for (var i = 0; i < anchorCount; i++) {
        var t = i % 2 === 0 ? 0.5 + i / 2 * pctSpacing : 0.5 - (i + 1) / 2 * pctSpacing;
        var coord = this.coordAlongRenderedPath(t, display);
        if (coord) labelAnchors.push(coord);
      }

      return labelAnchors;
    }
  }, {
    key: 'coordAlongRenderedPath',
    value: function coordAlongRenderedPath(t, display) {
      var loc = t * this.renderLength;

      var cur = 0;
      for (var i = 0; i < this.renderedEdges.length; i++) {
        var rEdge = this.renderedEdges[i];
        var edgeRenderLen = rEdge.graphEdge.getRenderLength(display);
        if (loc <= cur + edgeRenderLen) {
          var t2 = (loc - cur) / edgeRenderLen;
          return rEdge.graphEdge.coordAlongEdge(t2, rEdge.renderData, display);
        }
        cur += edgeRenderLen;
      }
    }
  }, {
    key: 'computeRenderLength',
    value: function computeRenderLength(display) {
      var _this2 = this;

      this.renderLength = 0;
      (0, _lodash.forEach)(this.renderedEdges, function (rEdge) {
        _this2.renderLength += rEdge.graphEdge.getRenderLength(display);
      });
    }
  }, {
    key: 'toString',
    value: function toString() {
      return 'RenderedSegment ' + this.id + ' on ' + (this.pathSegment ? this.pathSegment.toString() : ' (null segment)');
    }
  }]);
  return RenderedSegment;
}();

exports.default = RenderedSegment;
module.exports = exports['default'];

//# sourceMappingURL=renderedsegment.js