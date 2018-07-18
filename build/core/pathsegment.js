'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

var _patterngroup = require('./patterngroup');

var _patterngroup2 = _interopRequireDefault(_patterngroup);

var _labeledgegroup = require('../labeler/labeledgegroup.js');

var _labeledgegroup2 = _interopRequireDefault(_labeledgegroup);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * PathSegment
 */
var segmentId = 0;

var PathSegment = function () {
  function PathSegment(type, path) {
    (0, _classCallCheck3.default)(this, PathSegment);

    this.id = segmentId++;
    this.type = type;
    this.path = path;
    this.points = [];
    this.edges = [];
    this.renderedSegments = [];
    this.patternGroup = new _patterngroup2.default();
  }

  (0, _createClass3.default)(PathSegment, [{
    key: 'clearGraphData',
    value: function clearGraphData() {
      this.edges = [];
      this.points.forEach(function (point) {
        point.graphVertex = null;
      });
      this.renderLength = null;
    }
  }, {
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
    key: 'addRenderedSegment',
    value: function addRenderedSegment(rSegment) {
      this.renderedSegments.push(rSegment);
    }
  }, {
    key: 'addEdge',
    value: function addEdge(graphEdge, originVertex) {
      this.edges.push({
        graphEdge: graphEdge,
        forward: originVertex === graphEdge.fromVertex
      });
    }
  }, {
    key: 'insertEdgeAt',
    value: function insertEdgeAt(index, graphEdge, originVertex) {
      var edgeInfo = {
        graphEdge: graphEdge,
        forward: originVertex === graphEdge.fromVertex
      };
      this.edges.splice(index, 0, edgeInfo);
    }
  }, {
    key: 'removeEdge',
    value: function removeEdge(graphEdge) {
      var index = null;
      for (var i = 0; i < this.edges.length; i++) {
        if (this.edges[i].graphEdge === graphEdge) {
          index = i;
          break;
        }
      }
      if (index !== null) this.edges.splice(index, 1);
    }
  }, {
    key: 'getEdgeIndex',
    value: function getEdgeIndex(graphEdge) {
      for (var i = 0; i < this.edges.length; i++) {
        if (this.edges[i].graphEdge === graphEdge) return i;
      }
      return -1;
    }

    /**
     * Get graph vertices
     */

  }, {
    key: 'getGraphVertices',
    value: function getGraphVertices() {
      var vertices = [];
      this.edges.forEach(function (edge, i) {
        if (i === 0) {
          vertices.push(edge.graphEdge.fromVertex);
        }
        vertices.push(edge.graphEdge.toVertex);
      });
      return vertices;
    }
  }, {
    key: 'vertexArray',
    value: function vertexArray() {
      var vertex = this.startVertex();
      var array = [vertex];

      this.edges.forEach(function (edgeInfo) {
        vertex = edgeInfo.graphEdge.oppositeVertex(vertex);
        array.push(vertex);
      });

      return array;
    }
  }, {
    key: 'startVertex',
    value: function startVertex() {
      if (this.points[0].multipoint) return this.points[0].multipoint.graphVertex;
      if (!this.edges || this.edges.length === 0) return null;

      var firstGraphEdge = this.edges[0].graphEdge;
      return this.edges[0].forward ? firstGraphEdge.fromVertex : firstGraphEdge.toVertex;

      /* if (this.graphEdges.length === 1) return this.graphEdges[0].fromVertex;
      var first = this.graphEdges[0],
        next = this.graphEdges[1];
      if (first.toVertex == next.toVertex || first.toVertex == next.fromVertex)
        return first.fromVertex;
      if (first.fromVertex == next.toVertex || first.fromVertex == next.fromVertex)
        return first.toVertex;
      return null; */
    }
  }, {
    key: 'endVertex',
    value: function endVertex() {
      if (this.points[this.points.length - 1].multipoint) return this.points[this.points.length - 1].multipoint.graphVertex;
      if (!this.edges || this.edges.length === 0) return null;

      var lastGraphEdge = this.edges[this.edges.length - 1].graphEdge;
      return this.edges[this.edges.length - 1].forward ? lastGraphEdge.toVertex : lastGraphEdge.fromVertex;

      /* if (this.graphEdges.length === 1) return this.graphEdges[0].toVertex;
      var last = this.graphEdges[this.graphEdges.length - 1],
        prev = this.graphEdges[this.graphEdges.length - 2];
      if (last.toVertex == prev.toVertex || last.toVertex == prev.fromVertex)
        return last.fromVertex;
      if (last.fromVertex == prev.toVertex || last.fromVertex == prev.fromVertex)
        return last.toVertex;
      return null; */
    }
  }, {
    key: 'addPattern',
    value: function addPattern(pattern, fromIndex, toIndex) {
      // Initialize this segment's 'points' array to include the stops in the
      // provided pattern between the specified from and to indices, inclusive.
      // Only do this if the points array is empty or if the the length of the
      // segment being added exceeds that of the one currently stored.
      if (toIndex - fromIndex + 1 > this.points.length) {
        this.points = [];
        var lastStop = null;
        for (var i = fromIndex; i <= toIndex; i++) {
          var stop = pattern.stops[i];
          if (lastStop !== stop) {
            this.points.push(stop);
          }
          lastStop = stop;
        }
      }

      // Add the pattern to this segment's PatternGroup
      this.patternGroup.addPattern(pattern, fromIndex, toIndex);
    }
  }, {
    key: 'getPattern',
    value: function getPattern() {
      return this.patternGroup.patterns[0];
    }
  }, {
    key: 'getPatterns',
    value: function getPatterns() {
      return this.patternGroup.patterns;
    }
  }, {
    key: 'getMode',
    value: function getMode() {
      return this.patternGroup.patterns[0].route.route_type;
    }
  }, {
    key: 'toString',
    value: function toString() {
      var startVertex = this.startVertex();
      var endVertex = this.endVertex();
      return 'PathSegment id=' + this.id + ' type=' + this.type + ' from ' + (startVertex ? startVertex.toString() : '(unknown)') + ' to ' + (endVertex ? endVertex.toString() : '(unknown)');
    }
  }, {
    key: 'getLabelEdgeGroups',
    value: function getLabelEdgeGroups() {
      var edgeGroups = [];
      (0, _lodash.forEach)(this.renderedSegments, function (rSegment) {
        if (!rSegment.isFocused()) return;
        var currentGroup = new _labeledgegroup2.default(rSegment);
        (0, _lodash.forEach)(rSegment.renderedEdges, function (rEdge) {
          currentGroup.addEdge(rEdge);
          if (rEdge.graphEdge.toVertex.point.containsSegmentEndPoint()) {
            edgeGroups.push(currentGroup);
            currentGroup = new _labeledgegroup2.default(rSegment);
          }
        });
      });

      return edgeGroups;
    }
  }]);
  return PathSegment;
}();

exports.default = PathSegment;
module.exports = exports['default'];

//# sourceMappingURL=pathsegment.js