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
 * A Renderer subclass for drawing a simplified representation of the graph
 * itself, i.e. just the edges and vertices.
 *
 * @param {Object} the main Transitive object
 */

var WireframeRenderer = function (_Renderer) {
  (0, _inherits3.default)(WireframeRenderer, _Renderer);

  function WireframeRenderer() {
    (0, _classCallCheck3.default)(this, WireframeRenderer);
    return (0, _possibleConstructorReturn3.default)(this, (WireframeRenderer.__proto__ || (0, _getPrototypeOf2.default)(WireframeRenderer)).apply(this, arguments));
  }

  (0, _createClass3.default)(WireframeRenderer, [{
    key: 'render',
    value: function render() {
      (0, _get3.default)(WireframeRenderer.prototype.__proto__ || (0, _getPrototypeOf2.default)(WireframeRenderer.prototype), 'render', this).call(this);

      var display = this.transitive.display;
      var graph = this.transitive.network.graph;

      // Draw the edges

      (0, _lodash.forEach)(graph.edges, function (edge) {
        // Get a basic, non-offset edge renderData array
        var renderData = edge.getRenderCoords(0, 0, display, true);

        display.drawPath(renderData, {
          fill: 'none',
          'stroke-width': 2,
          stroke: '#000',
          'stroke-dasharray': '4,2'
        });
      });

      // Draw the vertices
      (0, _lodash.forEach)(graph.vertices, function (vertex) {
        display.drawCircle({
          x: display.xScale.compute(vertex.x),
          y: display.yScale.compute(vertex.y)
        }, {
          r: 4,
          fill: '#000'
        });
      });
    }
  }]);
  return WireframeRenderer;
}(_renderer2.default);

exports.default = WireframeRenderer;
module.exports = exports['default'];

//# sourceMappingURL=wireframe-renderer.js