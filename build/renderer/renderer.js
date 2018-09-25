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
 * A superclass for a Transitive network rendering engine.
 */

var Renderer = function () {
  /**
   * Renderer constructor
   * @param {Object} transitive the main Transitive object
   */

  function Renderer(transitive) {
    (0, _classCallCheck3.default)(this, Renderer);

    this.transitive = transitive;
  }

  (0, _createClass3.default)(Renderer, [{
    key: 'render',
    value: function render() {
      var display = this.transitive.display;
      var graph = this.transitive.network.graph;

      display.styler = this.transitive.styler;

      graph.vertices.forEach(function (vertex) {
        vertex.point.clearRenderData();
      });
      graph.edges.forEach(function (edge) {
        edge.clearRenderData();
      });

      // Clear the display
      display.clear();
    }

    /**
     * sortElements
     */

  }, {
    key: 'sortElements',
    value: function sortElements() {}

    /**
     * focusPath
     */

  }, {
    key: 'focusPath',
    value: function focusPath(path) {}
  }, {
    key: 'isDraggable',
    value: function isDraggable(point) {
      var draggableTypes = this.transitive.options.draggableTypes;
      if (!draggableTypes) return false;

      var retval = false;
      (0, _lodash.forEach)(draggableTypes, function (type) {
        if (type === point.getType()) {
          // Return true in ether of the following cases:
          // 1. No ID array is provided for this point type (i.e. entire type is draggable)
          // 2. An ID array is provided and it includes this Point's ID
          retval = !draggableTypes[type] || draggableTypes[type].indexOf(point.getId()) !== -1;
        }
      });
      return retval;
    }
  }]);
  return Renderer;
}();

exports.default = Renderer;
module.exports = exports['default'];

//# sourceMappingURL=renderer.js