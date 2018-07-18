'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Vertex
 */

var vertexId = 0;

var Vertex = function () {
  /**
   * Vertex constructor
   *
   * @param {Object} point the Point (a Stop, Place, etc.) attached to this vertex
   * @param {Number} x
   * @param {Number} y
   */

  function Vertex(point, x, y) {
    (0, _classCallCheck3.default)(this, Vertex);

    this.id = vertexId++;
    this.point = point;
    this.point.graphVertex = this;
    this.x = this.origX = x;
    this.y = this.origY = y;
    this.edges = [];
  }

  (0, _createClass3.default)(Vertex, [{
    key: 'getId',
    value: function getId() {
      return this.id;
    }
  }, {
    key: 'getRenderX',
    value: function getRenderX(display) {
      return display.xScale(this.x) + this.point.placeOffsets.x;
    }
  }, {
    key: 'getRenderY',
    value: function getRenderY(display) {
      return display.yScale(this.y) + this.point.placeOffsets.y;
    }

    /**
     * Move to new coordinate
     *
     * @param {Number}
     * @param {Number}
     */

  }, {
    key: 'moveTo',
    value: function moveTo(x, y) {
      this.x = x;
      this.y = y;
      /* this.edges.forEach(function (edge) {
        edge.calculateVectors();
      }); */
    }

    /**
     * Get array of edges incident to vertex. Allows specification of "incoming"
     * edge that will not be included in results.
     *
     * @param {Edge} inEdge optional incoming edge tp ignore
     */

  }, {
    key: 'incidentEdges',
    value: function incidentEdges(inEdge) {
      return this.edges.filter(function (edge) {
        return edge !== inEdge;
      });
    }

    /**
     * Add an edge to the vertex's edge list
     *
     * @param {Edge} edge
     */

  }, {
    key: 'addEdge',
    value: function addEdge(edge) {
      var index = this.edges.indexOf(edge);
      if (index === -1) this.edges.push(edge);
    }

    /**
     * Remove an edge from the vertex's edge list
     *
     * @param {Edge} edge
     */

  }, {
    key: 'removeEdge',
    value: function removeEdge(edge) {
      var index = this.edges.indexOf(edge);
      if (index !== -1) this.edges.splice(index, 1);
    }
  }, {
    key: 'toString',
    value: function toString() {
      return 'Vertex ' + this.getId() + ' (' + (this.point ? this.point.toString() : 'no point assigned') + ')';
    }
  }]);
  return Vertex;
}();

exports.default = Vertex;
module.exports = exports['default'];

//# sourceMappingURL=vertex.js