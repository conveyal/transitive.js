'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _d = require('d3');

var _d2 = _interopRequireDefault(_d);

var _lodash = require('lodash');

var _edge = require('./edge');

var _edge2 = _interopRequireDefault(_edge);

var _edgegroup = require('./edgegroup');

var _edgegroup2 = _interopRequireDefault(_edgegroup);

var _vertex = require('./vertex');

var _vertex2 = _interopRequireDefault(_vertex);

var _multipoint = require('../point/multipoint');

var _multipoint2 = _interopRequireDefault(_multipoint);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('transitive:graph');

/**
 *  A graph representing the underlying 'wireframe' network
 */

var NetworkGraph = function () {
  function NetworkGraph(network, vertices) {
    (0, _classCallCheck3.default)(this, NetworkGraph);

    this.network = network;
    this.edges = [];
    this.vertices = [];

    /**
     *  Object mapping groups of edges that share the same two vertices.
     *  - Key is string of format A_B, where A and B are vertex IDs and A < B
     *  - Value is array of edges
     */
    this.edgeGroups = {};

    // Add all base vertices
    for (var i in vertices) {
      this.addVertex(vertices[i], vertices[i].worldX, vertices[i].worldY);
    }
  }

  /**
   * Get the bounds of the graph in the graph's internal x/y coordinate space
   *
   * @return [[left, top], [right, bottom]]
   */

  (0, _createClass3.default)(NetworkGraph, [{
    key: 'bounds',
    value: function bounds() {
      var xmax = null;
      var xmin = null;
      var ymax = null;
      var ymin = null;

      for (var i in this.vertices) {
        var vertex = this.vertices[i];
        xmin = xmin ? Math.min(xmin, vertex.x) : vertex.x;
        xmax = xmax ? Math.max(xmax, vertex.x) : vertex.x;
        ymin = ymin ? Math.min(ymin, vertex.y) : vertex.y;
        ymax = ymax ? Math.max(ymax, vertex.y) : vertex.y;
      }

      var maxExtent = 20037508.34;
      return [[xmin || -maxExtent, ymin || -maxExtent], [xmax || maxExtent, ymax || maxExtent]];
    }

    /**
     * Add Vertex
     */

  }, {
    key: 'addVertex',
    value: function addVertex(point, x, y) {
      if (x === undefined || y === undefined) {
        var xy = _util.sm.forward([point.getLon(), point.getLat()]);
        x = xy[0];
        y = xy[1];
      }
      var vertex = new _vertex2.default(point, x, y);
      this.vertices.push(vertex);
      return vertex;
    }

    /**
     * Add Edge
     */

  }, {
    key: 'addEdge',
    value: function addEdge(stops, from, to, segmentType) {
      if (this.vertices.indexOf(from) === -1 || this.vertices.indexOf(to) === -1) {
        debug('Error: Cannot add edge. Graph does not contain vertices.');
        return;
      }

      var edge = new _edge2.default(stops, from, to);
      this.edges.push(edge);
      from.edges.push(edge);
      to.edges.push(edge);

      var groupKey = this.network.transitive.options.groupEdges ? this.getEdgeGroupKey(edge, segmentType) : edge.getId();

      if (!(groupKey in this.edgeGroups)) {
        this.edgeGroups[groupKey] = new _edgegroup2.default(edge.fromVertex, edge.toVertex, segmentType);
      }
      this.edgeGroups[groupKey].addEdge(edge);

      return edge;
    }
  }, {
    key: 'removeEdge',
    value: function removeEdge(edge) {
      // remove from the graph's edge collection
      var edgeIndex = this.edges.indexOf(edge);
      if (edgeIndex !== -1) this.edges.splice(edgeIndex, 1);

      // remove from any associated path segment edge lists
      (0, _lodash.forEach)(edge.pathSegments, function (segment) {
        segment.removeEdge(edge);
      });

      // remove from the endpoint vertex incidentEdge collections
      edge.fromVertex.removeEdge(edge);
      edge.toVertex.removeEdge(edge);
    }
  }, {
    key: 'getEdgeGroup',
    value: function getEdgeGroup(edge) {
      return this.edgeGroups[this.getEdgeGroupKey(edge)];
    }
  }, {
    key: 'getEdgeGroupKey',
    value: function getEdgeGroupKey(edge, segmentType) {
      return edge.fromVertex.getId() < edge.toVertex.getId() ? segmentType + '_' + edge.fromVertex.getId() + '_' + edge.toVertex.getId() : segmentType + '_' + edge.toVertex.getId() + '_' + edge.fromVertex.getId();
    }
  }, {
    key: 'mergeVertices',
    value: function mergeVertices(vertexArray) {
      var _this = this;

      var xTotal = 0;
      var yTotal = 0;

      var vertexGroups = {
        'STOP': [],
        'PLACE': [],
        'TURN': [],
        'MULTI': []
      };
      (0, _lodash.forEach)(vertexArray, function (vertex) {
        if (vertex.point.getType() in vertexGroups) {
          vertexGroups[vertex.point.getType()].push(vertex);
        }
      });

      // don't merge stops and places, or multiple places:
      if (vertexGroups.STOP.length > 0 && vertexGroups.PLACE.length > 0 || vertexGroups.PLACE.length > 1 || vertexGroups.MULTI.length > 0) return;

      var mergePoint = void 0;

      // if merging turns with a place, create a new merged vertex around the place
      if (vertexGroups.PLACE.length === 1 && vertexGroups.TURN.length > 0) {
        mergePoint = vertexGroups.PLACE[0].point;
        // if merging turns with a single place, create a new merged vertex around the stop
      } else if (vertexGroups.STOP.length === 1 && vertexGroups.TURN.length > 0) {
        mergePoint = vertexGroups.STOP[0].point;
        // if merging multiple stops, create a new MultiPoint vertex
      } else if (vertexGroups.STOP.length > 1) {
        mergePoint = new _multipoint2.default();
        (0, _lodash.forEach)(vertexGroups.STOP, function (stopVertex) {
          mergePoint.addPoint(stopVertex.point);
        });
        // if merging multiple turns
      } else if (vertexGroups.TURN.length > 1) {
        mergePoint = vertexGroups.TURN[0].point;
      }

      if (!mergePoint) return;
      var mergedVertex = new _vertex2.default(mergePoint, 0, 0);

      (0, _lodash.forEach)(vertexArray, function (vertex) {
        xTotal += vertex.x;
        yTotal += vertex.y;

        (0, _lodash.forEach)(vertex.edges.slice(), function (edge) {
          if (vertexArray.indexOf(edge.fromVertex) !== -1 && vertexArray.indexOf(edge.toVertex) !== -1) {
            _this.removeEdge(edge);
            return;
          }
          edge.replaceVertex(vertex, mergedVertex);
          mergedVertex.addEdge(edge);
        });
        var index = _this.vertices.indexOf(vertex);
        if (index !== -1) _this.vertices.splice(index, 1);
      });

      mergedVertex.x = xTotal / vertexArray.length;
      mergedVertex.y = yTotal / vertexArray.length;
      mergedVertex.oldVertices = vertexArray;

      this.vertices.push(mergedVertex);
    }
  }, {
    key: 'sortVertices',
    value: function sortVertices() {
      this.vertices.sort(function (a, b) {
        if (a.point && a.point.getType() === 'PLACE') return -1;
        if (b.point && b.point.getType() === 'PLACE') return 1;

        if (a.point && a.point.getType() === 'MULTI') return -1;
        if (b.point && b.point.getType() === 'MULTI') return 1;

        if (a.point && a.point.getType() === 'STOP') return -1;
        if (b.point && b.point.getType() === 'STOP') return 1;
      });
    }

    /**
     * Get the equivalent edge
     */

  }, {
    key: 'getEquivalentEdge',
    value: function getEquivalentEdge(pointArray, from, to) {
      for (var e = 0; e < this.edges.length; e++) {
        var edge = this.edges[e];
        if (edge.fromVertex === from && edge.toVertex === to && pointArray.length === edge.pointArray.length && equal(pointArray, edge.pointArray)) {
          return edge;
        }
        if (edge.fromVertex === to && edge.toVertex === from && pointArray.length === edge.pointArray.length && equal(pointArray.slice(0).reverse(), edge.pointArray)) {
          return edge;
        }
      }
    }

    /**
     *  Split a specified graph edge around a set of specified split points, where
     *  all split points are internal points of the edge to be split. A set of N
     *  valid split points will result in N+1 new edges. The original edge is
     *  removed from the graph.
     */

  }, {
    key: 'splitEdgeAtInternalPoints',
    value: function splitEdgeAtInternalPoints(edge, points) {
      var _this2 = this;

      var subEdgePoints = [];
      var newEdge;
      var newEdgeInfoArr = [];
      var fromVertex = edge.fromVertex;
      var geomCoords = [];

      // iterate through the parent edge points, creating new sub-edges as needed
      (0, _lodash.forEach)(edge.pointArray, function (point, i) {
        if (edge.pointGeom && i < edge.pointGeom.length) {
          geomCoords = geomCoords.concat(edge.pointGeom[i]);
        }
        if (points.indexOf(point) !== -1) {
          // we've reached a split point
          var x = point.worldX;
          var y = point.worldY;
          var newVertex = point.graphVertex || _this2.addVertex(point, x, y);
          newVertex.isInternal = true;
          newEdge = _this2.addEdge(subEdgePoints, fromVertex, newVertex, edge.edgeGroup.type);
          newEdge.isInternal = true;
          newEdge.copyPathSegments(edge);
          newEdgeInfoArr.push({
            graphEdge: newEdge,
            fromVertex: fromVertex
          });
          if (geomCoords.length > 0) newEdge.geomCoords = geomCoords;

          subEdgePoints = [];
          fromVertex = newVertex;
          geomCoords = [];
        } else {
          // otherwise, this point becomes an internal point of the new edge currently being created
          subEdgePoints.push(point);
        }
      });

      // create the last sub-edge
      newEdge = this.addEdge(subEdgePoints, fromVertex, edge.toVertex, edge.edgeGroup.type);
      newEdge.isInternal = true;
      newEdge.copyPathSegments(edge);
      if (edge.pointGeom && edge.pointArray.length < edge.pointGeom.length) {
        geomCoords = geomCoords.concat(edge.pointGeom[edge.pointArray.length]);
      }
      if (geomCoords.length > 0) newEdge.geomCoords = geomCoords;

      newEdgeInfoArr.push({
        graphEdge: newEdge,
        fromVertex: fromVertex
      });

      // insert the new edge sequence into the affected segments
      (0, _lodash.forEach)(edge.pathSegments, function (pathSegment) {
        var indexInSegment = pathSegment.getEdgeIndex(edge);
        var forward = pathSegment.edges[indexInSegment].forward;
        var index = pathSegment.getEdgeIndex(edge);
        (0, _lodash.forEach)(forward ? newEdgeInfoArr : newEdgeInfoArr.reverse(), function (edgeInfo) {
          pathSegment.insertEdgeAt(index, edgeInfo.graphEdge, forward ? edgeInfo.fromVertex : edgeInfo.toVertex);
          index++;
        });
      });

      // remove the original edge from the graph
      this.removeEdge(edge);
    }

    /* collapseTransfers = function(threshold) {
      if(!threshold) return;
      this.edges.forEach(function(edge) {
        if (edge.getLength() > threshold ||
          edge.fromVertex.point.containsFromPoint() ||
          edge.fromVertex.point.containsToPoint() ||
          edge.toVertex.point.containsFromPoint() ||
          edge.toVertex.point.containsToPoint()) return;
        //if(edge.fromVertex.point.getType() === 'PLACE' || edge.toVertex.point.getType() === 'PLACE') return;
        var notTransit = true;
        edge.pathSegments.forEach(function(segment) {
          notTransit = notTransit && segment.type !== 'TRANSIT';
        });
        if (notTransit) {
          this.mergeVertices([edge.fromVertex, edge.toVertex]);
        }
      }, this);
    }; */

  }, {
    key: 'pruneVertices',
    value: function pruneVertices() {
      var _this3 = this;

      (0, _lodash.forEach)(this.vertices, function (vertex) {
        if (vertex.point.containsSegmentEndPoint()) return;

        var opposites = [];
        var pathSegmentBundles = {}; // maps pathSegment id list (string) to collection of edges (array)

        (0, _lodash.forEach)(vertex.edges, function (edge) {
          var pathSegmentIds = edge.getPathSegmentIds();
          if (!(pathSegmentIds in pathSegmentBundles)) pathSegmentBundles[pathSegmentIds] = [];
          pathSegmentBundles[pathSegmentIds].push(edge);
          var opp = edge.oppositeVertex(vertex);
          if (opposites.indexOf(opp) === -1) opposites.push(opp);
        });

        if (opposites.length !== 2) return;

        for (var key in pathSegmentBundles) {
          var edgeArr = pathSegmentBundles[key];
          if (edgeArr.length === 2) _this3.mergeEdges(edgeArr[0], edgeArr[1]);
        }
      });
    }
  }, {
    key: 'mergeEdges',
    value: function mergeEdges(edge1, edge2) {
      // check for infinite recursion loop case
      if (edge1.fromVertex === edge2.toVertex && edge2.fromVertex === edge1.toVertex) {
        return;
      }

      // reverse edges if necessary
      if (edge1.fromVertex === edge2.toVertex) {
        this.mergeEdges(edge2, edge1);
        return;
      }

      if (edge1.toVertex !== edge2.fromVertex) return; // edges cannot be merged

      var internalPoints = edge1.pointArray.concat(edge2.pointArray);

      var newEdge = this.addEdge(internalPoints, edge1.fromVertex, edge2.toVertex, edge1.edgeGroup.type);
      newEdge.pathSegments = edge1.pathSegments;
      (0, _lodash.forEach)(newEdge.pathSegments, function (segment) {
        var i = segment.getEdgeIndex(edge1);
        segment.insertEdgeAt(i, newEdge, newEdge.fromVertex);
      });

      // if both input edges are have coordinate geometry, merge the coords arrays in the new edge
      if (edge1.geomCoords && edge2.geomCoords) {
        newEdge.geomCoords = edge1.geomCoords.concat(edge2.geomCoords.length > 0 ? edge2.geomCoords.slice(1) : []);
      }

      debug('merging:');
      debug(edge1);
      debug(edge2);
      this.removeEdge(edge1);
      this.removeEdge(edge2);
    }
  }, {
    key: 'snapToGrid',
    value: function snapToGrid(cellSize) {
      var _this4 = this;

      var coincidenceMap = {};
      (0, _lodash.forEach)(this.vertices, function (vertex) {
        var nx = Math.round(vertex.x / cellSize) * cellSize;
        var ny = Math.round(vertex.y / cellSize) * cellSize;
        vertex.x = nx;
        vertex.y = ny;

        var key = nx + '_' + ny;
        if (!(key in coincidenceMap)) coincidenceMap[key] = [vertex];else coincidenceMap[key].push(vertex);
      });

      (0, _lodash.forEach)(coincidenceMap, function (vertexArr) {
        if (vertexArr.length > 1) {
          _this4.mergeVertices(vertexArr);
        }
      });
    }
  }, {
    key: 'calculateGeometry',
    value: function calculateGeometry(cellSize, angleConstraint) {
      (0, _lodash.forEach)(this.edges, function (edge) {
        edge.calculateGeometry(cellSize, angleConstraint);
      });
    }
  }, {
    key: 'resetCoordinates',
    value: function resetCoordinates() {
      (0, _lodash.forEach)(this.vertices, function (vertex) {
        vertex.x = vertex.origX;
        vertex.y = vertex.origY;
      });
    }
  }, {
    key: 'recenter',
    value: function recenter() {
      var xCoords = [];
      var yCoords = [];
      (0, _lodash.forEach)(this.vertices, function (v) {
        xCoords.push(v.x);
        yCoords.push(v.y);
      });

      var mx = _d2.default.median(xCoords);
      var my = _d2.default.median(yCoords);

      (0, _lodash.forEach)(this.vertices, function (v) {
        v.x = v.x - mx;
        v.y = v.y - my;
      });
    }

    /** 2D line bundling & offsetting **/

  }, {
    key: 'apply2DOffsets',
    value: function apply2DOffsets() {
      var _this5 = this;

      this.initComparisons();

      var alignmentBundles = {}; // maps alignment ID to array of range-bounded bundles on that alignment

      var addToBundle = function addToBundle(rEdge, alignmentId) {
        var bundle;

        // compute the alignment range of the edge being bundled
        var range = rEdge.graphEdge.getAlignmentRange(alignmentId);

        // check if bundles already exist for this alignment
        if (!(alignmentId in alignmentBundles)) {
          // if not, create new and add to collection
          bundle = new AlignmentBundle();
          bundle.addEdge(rEdge, range.min, range.max);
          alignmentBundles[alignmentId] = [bundle]; // new AlignmentBundle();
        } else {
          // 1 or more bundles currently exist for this alignmentId
          var bundleArr = alignmentBundles[alignmentId];

          // see if the segment range overlaps with that of an existing bundle
          for (var i = 0; i < bundleArr.length; i++) {
            if (bundleArr[i].rangeOverlaps(range.min, range.max)) {
              bundleArr[i].addEdge(rEdge, range.min, range.max);
              return;
            }
          }

          // ..if not, create a new bundle
          bundle = new AlignmentBundle();
          bundle.addEdge(rEdge, range.min, range.max);
          bundleArr.push(bundle);
        }
      };

      (0, _lodash.forEach)(this.edges, function (edge) {
        var fromAlignmentId = edge.getFromAlignmentId();
        var toAlignmentId = edge.getToAlignmentId();

        (0, _lodash.forEach)(edge.renderedEdges, function (rEdge) {
          addToBundle(rEdge, fromAlignmentId);
          addToBundle(rEdge, toAlignmentId);
        });
      });

      var bundleSorter = function bundleSorter(a, b) {
        var aId = a.patternIds || a.pathSegmentIds;
        var bId = b.patternIds || b.pathSegmentIds;

        var aVector = a.getAlignmentVector(_this5.currentAlignmentId);
        var bVector = b.getAlignmentVector(_this5.currentAlignmentId);
        var isOutward = (0, _util.isOutwardVector)(aVector) && (0, _util.isOutwardVector)(bVector) ? 1 : -1;

        var abCompId = aId + '_' + bId;
        if (abCompId in _this5.bundleComparisons) {
          return isOutward * _this5.bundleComparisons[abCompId];
        }

        var baCompId = bId + '_' + aId;
        if (baCompId in _this5.bundleComparisons) {
          return isOutward * _this5.bundleComparisons[baCompId];
        }

        if (a.route && b.route && a.route.route_type !== b.route.route_type) {
          return a.route.route_type > b.route.route_type ? 1 : -1;
        }

        var isForward = a.forward && b.forward ? 1 : -1;
        return isForward * isOutward * (aId < bId ? -1 : 1);
      };

      (0, _lodash.forEach)((0, _keys2.default)(alignmentBundles), function (alignmentId) {
        var bundleArr = alignmentBundles[alignmentId];
        (0, _lodash.forEach)(bundleArr, function (bundle) {
          if (bundle.items.length <= 1) return;
          var lw = 1.2;
          var bundleWidth = lw * (bundle.items.length - 1);

          _this5.currentAlignmentId = alignmentId;
          bundle.items.sort(bundleSorter);
          (0, _lodash.forEach)(bundle.items, function (rEdge, i) {
            var offset = -bundleWidth / 2 + i * lw;
            if (rEdge.getType() === 'TRANSIT') {
              (0, _lodash.forEach)(rEdge.patterns, function (pattern) {
                pattern.offsetAlignment(alignmentId, offset);
              });
            } else rEdge.offsetAlignment(alignmentId, offset);
          });
        });
      });
    }

    /**
     * Traverses the graph vertex-by-vertex, creating comparisons between all pairs of
     * edges for which a topological relationship can be established.
     */

  }, {
    key: 'initComparisons',
    value: function initComparisons() {
      var _this6 = this;

      this.bundleComparisons = {};

      (0, _lodash.forEach)(this.vertices, function (vertex) {
        var incidentGraphEdges = vertex.incidentEdges();

        var angleREdges = {};
        (0, _lodash.forEach)(incidentGraphEdges, function (incidentGraphEdge) {
          var angle = incidentGraphEdge.fromVertex === vertex ? incidentGraphEdge.fromAngle : incidentGraphEdge.toAngle;
          var angleDeg = 180 * angle / Math.PI;
          if (!(angleDeg in angleREdges)) angleREdges[angleDeg] = [];
          angleREdges[angleDeg] = angleREdges[angleDeg].concat(incidentGraphEdge.renderedEdges);
        });

        (0, _lodash.forEach)(angleREdges, function (rEdges) {
          if (rEdges.length < 2) return;
          for (var i = 0; i < rEdges.length - 1; i++) {
            for (var j = i + 1; j < rEdges.length; j++) {
              var re1 = rEdges[i];
              var re2 = rEdges[j];

              var opp1 = re1.graphEdge.oppositeVertex(vertex);
              var opp2 = re2.graphEdge.oppositeVertex(vertex);

              var isCcw = (0, _util.ccw)(opp1.x, opp1.y, vertex.x, vertex.y, opp2.x, opp2.y);

              if (isCcw === 0) {
                var s1Ext = re1.findExtension(opp1);
                var s2Ext = re2.findExtension(opp2);
                if (s1Ext) opp1 = s1Ext.graphEdge.oppositeVertex(opp1);
                if (s2Ext) opp2 = s2Ext.graphEdge.oppositeVertex(opp2);
                isCcw = (0, _util.ccw)(opp1.x, opp1.y, vertex.x, vertex.y, opp2.x, opp2.y);
              }

              isCcw = getInverse(re1, re2, vertex) * isCcw;

              if (isCcw > 0) {
                // e1 patterns are 'less' than e2 patterns
                _this6.storeComparison(re1, re2);
              }

              if (isCcw < 0) {
                // e2 patterns are 'less' than e2 patterns
                _this6.storeComparison(re2, re1);
              }
            }
          }
        });
      });
    }
  }, {
    key: 'storeComparison',
    value: function storeComparison(s1, s2) {
      var s1Id = s1.patternIds || s1.pathSegmentIds;
      var s2Id = s2.patternIds || s2.pathSegmentIds;
      debug('storing comparison: ' + s1Id + '  < ' + s2Id);
      this.bundleComparisons[s1Id + '_' + s2Id] = -1;
      this.bundleComparisons[s2Id + '_' + s1Id] = 1;
    }
  }]);
  return NetworkGraph;
}();

/**
 *  AlignmentBundle class
 */

exports.default = NetworkGraph;

var AlignmentBundle = function () {
  function AlignmentBundle() {
    (0, _classCallCheck3.default)(this, AlignmentBundle);

    this.items = []; // RenderedEdges
    this.min = Number.MAX_VALUE;
    this.max = -Number.MAX_VALUE;
  }

  (0, _createClass3.default)(AlignmentBundle, [{
    key: 'addEdge',
    value: function addEdge(rEdge, min, max) {
      if (this.items.indexOf(rEdge) === -1) {
        this.items.push(rEdge);
      }

      this.min = Math.min(this.min, min);
      this.max = Math.max(this.max, max);
    }
  }, {
    key: 'rangeOverlaps',
    value: function rangeOverlaps(min, max) {
      return this.min < max && min < this.max;
    }
  }]);
  return AlignmentBundle;
}();

/** Helper functions **/

function getInverse(s1, s2, vertex) {
  return s1.graphEdge.toVertex === vertex && s2.graphEdge.toVertex === vertex || s1.graphEdge.toVertex === vertex && s2.graphEdge.fromVertex === vertex ? -1 : 1;
}

/**
 * Check if arrays are equal
 */

function equal(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  for (var i in a) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}
module.exports = exports['default'];

//# sourceMappingURL=graph.js