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

var _lodash = require('lodash');

var _renderer = require('./renderer');

var _renderer2 = _interopRequireDefault(_renderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A Renderer subclass for the default network rendering engine.
 *
 * @param {Object} the main Transitive object
 */

var CanvasRenderer = function (_Renderer) {
  (0, _inherits3.default)(CanvasRenderer, _Renderer);

  function CanvasRenderer() {
    (0, _classCallCheck3.default)(this, CanvasRenderer);
    return (0, _possibleConstructorReturn3.default)(this, (CanvasRenderer.__proto__ || (0, _getPrototypeOf2.default)(CanvasRenderer)).apply(this, arguments));
  }

  (0, _createClass3.default)(CanvasRenderer, [{
    key: 'render',
    value: function render() {
      var _this2 = this;

      (0, _get3.default)(CanvasRenderer.prototype.__proto__ || (0, _getPrototypeOf2.default)(CanvasRenderer.prototype), 'render', this).call(this);

      var display = this.transitive.display;
      var network = this.transitive.network;
      display.styler = this.transitive.styler;

      var legendSegments = {};

      (0, _lodash.forEach)(network.renderedEdges, function (rEdge) {
        rEdge.refreshRenderData(display);
      });

      (0, _lodash.forEach)(network.paths, function (path) {
        (0, _lodash.forEach)(path.segments, function (pathSegment) {
          (0, _lodash.forEach)(pathSegment.renderedSegments, function (renderedSegment) {
            renderedSegment.render(display);
            var legendType = renderedSegment.getLegendType();
            if (!(legendType in legendSegments)) {
              legendSegments[legendType] = renderedSegment;
            }
          });
        });
      });

      // draw the vertex-based points

      (0, _lodash.forEach)(network.graph.vertices, function (vertex) {
        vertex.point.render(display);
        if (_this2.isDraggable(vertex.point)) {
          vertex.point.makeDraggable(_this2.transitive);
        }
      });

      // draw the edge-based points
      (0, _lodash.forEach)(network.graph.edges, function (edge) {
        (0, _lodash.forEach)(edge.pointArray, function (point) {
          point.render(display);
        });
      });

      if (display.legend) display.legend.render(legendSegments);

      this.transitive.refresh();
    }

    /**
     * Refresh
     */

  }, {
    key: 'refresh',
    value: function refresh(panning) {
      var _this3 = this;

      (0, _get3.default)(CanvasRenderer.prototype.__proto__ || (0, _getPrototypeOf2.default)(CanvasRenderer.prototype), 'refresh', this).call(this, panning);

      var display = this.transitive.display;
      var network = this.transitive.network;
      var styler = this.transitive.styler;

      (0, _lodash.forEach)(network.graph.vertices, function (vertex) {
        vertex.point.clearRenderData();
      });
      (0, _lodash.forEach)(network.graph.edges, function (edge) {
        edge.clearRenderData();
      });

      // refresh the segment and point marker data
      this.refreshSegmentRenderData();
      (0, _lodash.forEach)(network.graph.vertices, function (vertex) {
        vertex.point.initMarkerData(display);
      });

      this.renderedSegments = [];
      (0, _lodash.forEach)(network.paths, function (path) {
        (0, _lodash.forEach)(path.segments, function (pathSegment) {
          (0, _lodash.forEach)(pathSegment.renderedSegments, function (rSegment) {
            rSegment.refresh(display);
            _this3.renderedSegments.push(rSegment);
          });
        });
      });

      (0, _lodash.forEach)(network.graph.vertices, function (vertex) {
        var point = vertex.point;
        if (!point.svgGroup) return; // check if this point is not currently rendered
        styler.stylePoint(display, point);
        point.refresh(display);
      });

      // re-draw the edge-based points
      (0, _lodash.forEach)(network.graph.edges, function (edge) {
        (0, _lodash.forEach)(edge.pointArray, function (point) {
          if (!point.svgGroup) return; // check if this point is not currently rendered
          styler.styleStop(display, point);
          point.refresh(display);
        });
      });

      // refresh the label layout
      var labeledElements = this.transitive.labeler.doLayout();
      (0, _lodash.forEach)(labeledElements.points, function (point) {
        point.refreshLabel(display);
        styler.stylePointLabel(display, point);
      });
      (0, _lodash.forEach)(this.transitive.labeler.segmentLabels, function (label) {
        label.refresh(display);
        styler.styleSegmentLabel(display, label);
      });

      this.sortElements();
    }
  }, {
    key: 'refreshSegmentRenderData',
    value: function refreshSegmentRenderData() {
      var _this4 = this;

      (0, _lodash.forEach)(this.transitive.network.renderedEdges, function (rEdge) {
        rEdge.refreshRenderData(_this4.transitive.display);
      });

      // try intersecting adjacent rendered edges to create a smooth transition

      var isectKeys = []; // keep track of edge-edge intersections we've already computed
      (0, _lodash.forEach)(this.transitive.network.paths, function (path) {
        (0, _lodash.forEach)(path.segments, function (pathSegment) {
          (0, _lodash.forEach)(pathSegment.renderedSegments, function (rSegment) {
            for (var s = 0; s < rSegment.renderedEdges.length - 1; s++) {
              var rEdge1 = rSegment.renderedEdges[s];
              var rEdge2 = rSegment.renderedEdges[s + 1];
              var key = rEdge1.getId() + '_' + rEdge2.getId();
              if (isectKeys.indexOf(key) !== -1) continue;
              if (rEdge1.graphEdge.isInternal && rEdge2.graphEdge.isInternal) {
                rEdge1.intersect(rEdge2);
              }
              isectKeys.push(key);
            }
          });
        });
      });
    }

    /**
     * sortElements
     */

  }, {
    key: 'sortElements',
    value: function sortElements() {
      this.renderedSegments.sort(function (a, b) {
        return a.compareTo(b);
      });

      var focusBaseZIndex = 100000;

      (0, _lodash.forEach)(this.renderedSegments, function (rSegment, index) {
        rSegment.zIndex = index * 10 + (rSegment.isFocused() ? focusBaseZIndex : 0);
      });

      (0, _lodash.forEach)(this.transitive.network.graph.vertices, function (vertex) {
        var point = vertex.point;
        point.zIndex = point.zIndex + (point.isFocused() ? focusBaseZIndex : 0);
      });

      this.transitive.display.svg.selectAll('.transitive-sortable').sort(function (a, b) {
        var aIndex = typeof a.getZIndex === 'function' ? a.getZIndex() : a.owner.getZIndex();
        var bIndex = typeof b.getZIndex === 'function' ? b.getZIndex() : b.owner.getZIndex();
        return aIndex - bIndex;
      });
    }

    /**
     * focusPath
     */

  }, {
    key: 'focusPath',
    value: function focusPath(path) {
      var pathRenderedSegments = [];
      var graph = this.transitive.network.graph;

      if (path) {
        // if we're focusing a specific path
        pathRenderedSegments = path.getRenderedSegments();

        // un-focus all internal points
        (0, _lodash.forEach)(graph.edges, function (edge) {
          edge.pointArray.forEach(function (point, i) {
            point.setAllPatternsFocused(false);
          });
        });
      } else {
        // if we're returing to 'all-focused' mode
        // re-focus all internal points
        (0, _lodash.forEach)(graph.edges, function (edge) {
          (0, _lodash.forEach)(edge.pointArray, function (point, i) {
            point.setAllPatternsFocused(true);
          });
        });
      }

      var focusChangeSegments = [];
      var focusedVertexPoints = [];
      (0, _lodash.forEach)(this.renderedSegments, function (rSegment) {
        if (path && pathRenderedSegments.indexOf(rSegment) === -1) {
          if (rSegment.isFocused()) focusChangeSegments.push(rSegment);
          rSegment.setFocused(false);
        } else {
          if (!rSegment.isFocused()) focusChangeSegments.push(rSegment);
          rSegment.setFocused(true);
          focusedVertexPoints.push(rSegment.pathSegment.startVertex().point);
          focusedVertexPoints.push(rSegment.pathSegment.endVertex().point);
        }
      });

      var focusChangePoints = [];
      (0, _lodash.forEach)(graph.vertices, function (vertex) {
        var point = vertex.point;
        if (focusedVertexPoints.indexOf(point) !== -1) {
          if (!point.isFocused()) focusChangePoints.push(point);
          point.setFocused(true);
        } else {
          if (point.isFocused()) focusChangePoints.push(point);
          point.setFocused(false);
        }
      });

      // bring the focused elements to the front for the transition
      // if (path) this.sortElements();

      // create a transition callback function that invokes refresh() after all transitions complete
      /* var n = 0
      var refreshOnEnd = (transition, callback) => {
        transition
          .each(() => { ++n })
          .on('end', () => { if (!--n) this.transitive.refresh() })
      }
       // run the transtions on the affected elements
      forEach(focusChangeSegments, segment => {
        segment.runFocusTransition(this.transitive.display, refreshOnEnd)
      })
       forEach(focusChangePoints, point => {
        point.runFocusTransition(this.transitive.display, refreshOnEnd)
      }) */
      this.transitive.refresh();
    }
  }]);
  return CanvasRenderer;
}(_renderer2.default);

exports.default = CanvasRenderer;
module.exports = exports['default'];

//# sourceMappingURL=canvas-renderer.js