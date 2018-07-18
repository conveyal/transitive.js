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
 * LabelEdgeGroup
 */

var LabelEdgeGroup = function () {
  function LabelEdgeGroup(renderedSegment) {
    (0, _classCallCheck3.default)(this, LabelEdgeGroup);

    this.renderedSegment = renderedSegment;
    this.renderedEdges = [];
  }

  (0, _createClass3.default)(LabelEdgeGroup, [{
    key: 'addEdge',
    value: function addEdge(rEdge) {
      this.renderedEdges.push(rEdge);
      this.edgeIds = !this.edgeIds ? rEdge.getId() : this.edgeIds + ',' + rEdge.getId();
    }
  }, {
    key: 'getLabelTextArray',
    value: function getLabelTextArray() {
      var textArray = [];
      (0, _lodash.forEach)(this.renderedSegment.pathSegment.getPatterns(), function (pattern) {
        var shortName = pattern.route.route_short_name;
        if (textArray.indexOf(shortName) === -1) textArray.push(shortName);
      });
      return textArray;
    }
  }, {
    key: 'getLabelAnchors',
    value: function getLabelAnchors(display, spacing) {
      var labelAnchors = [];
      var renderLen = this.getRenderLength(display);
      var anchorCount = Math.floor(renderLen / spacing);
      var pctSpacing = spacing / renderLen;

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
      var renderLen = this.getRenderLength(display);
      var loc = t * renderLen;

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
    key: 'getRenderLength',
    value: function getRenderLength(display) {
      var _this = this;

      if (!this.renderLength) {
        this.renderLength = 0;
        (0, _lodash.forEach)(this.renderedEdges, function (rEdge) {
          _this.renderLength += rEdge.graphEdge.getRenderLength(display);
        });
      }
      return this.renderLength;
    }
  }]);
  return LabelEdgeGroup;
}();

exports.default = LabelEdgeGroup;
module.exports = exports['default'];

//# sourceMappingURL=labeledgegroup.js