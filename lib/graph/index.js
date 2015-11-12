var d3 = require('d3');
var debug = require('debug')('transitive:graph');
var each = require('component-each');
var PriorityQueue = require('priorityqueuejs');

var Edge = require('./edge');
var EdgeGroup = require('./edgegroup');
var Vertex = require('./vertex');
var MultiPoint = require('../point/multipoint');
var Util = require('../util');

/**
 * Expose `NetworkGraph`
 */

module.exports = NetworkGraph;

/**
 *  An graph representing the underlying 'wireframe' network
 */

function NetworkGraph(network, vertices) {
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
  for (var i in vertices) this.addVertex(vertices[i], vertices[i].worldX,
    vertices[i].worldY);
}

/**
 * Get the bounds of the graph in the graph's internal x/y coordinate space
 *
 * @return [[left, top], [right, bottom]]
 */

NetworkGraph.prototype.bounds = function() {
  var xmax = null,
    xmin = null;
  var ymax = null,
    ymin = null;

  for (var i in this.vertices) {
    var vertex = this.vertices[i];
    xmin = xmin ? Math.min(xmin, vertex.x) : vertex.x;
    xmax = xmax ? Math.max(xmax, vertex.x) : vertex.x;
    ymin = ymin ? Math.min(ymin, vertex.y) : vertex.y;
    ymax = ymax ? Math.max(ymax, vertex.y) : vertex.y;
  }

  var maxExtent = 20037508.34;
  return [
    [xmin || -maxExtent, ymin || -maxExtent],
    [xmax || maxExtent, ymax || maxExtent]
  ];
};

/**
 * Add Vertex
 */

NetworkGraph.prototype.addVertex = function(point, x, y) {
  if (x === undefined || y === undefined) {
    var xy = Util.latLonToSphericalMercator(point.getLat(), point.getLon());
    x = xy[0];
    y = xy[1];
  }
  var vertex = new Vertex(point, x, y);
  this.vertices.push(vertex);
  return vertex;
};

/**
 * Add Edge
 */

NetworkGraph.prototype.addEdge = function(stops, from, to, segmentType) {
  if (this.vertices.indexOf(from) === -1 || this.vertices.indexOf(to) === -1) {
    debug('Error: Cannot add edge. Graph does not contain vertices.');
    return;
  }

  var edge = new Edge(stops, from, to);
  this.edges.push(edge);
  from.edges.push(edge);
  to.edges.push(edge);

  var groupKey = this.network.transitive.options.groupEdges ?
    this.getEdgeGroupKey(edge, segmentType) : edge.getId();

  if (!(groupKey in this.edgeGroups)) {
    this.edgeGroups[groupKey] = new EdgeGroup(edge.fromVertex, edge.toVertex,
      segmentType);
  }
  this.edgeGroups[groupKey].addEdge(edge);

  return edge;
};

NetworkGraph.prototype.removeEdge = function(edge) {

  // remove from the graph's edge collection
  var edgeIndex = this.edges.indexOf(edge);
  if (edgeIndex !== -1) this.edges.splice(edgeIndex, 1);

  // remove from any associated path segment edge lists
  edge.pathSegments.forEach(function(segment) {
    segment.removeEdge(edge);
  });

  // remove from the endpoint vertex incidentEdge collections
  edge.fromVertex.removeEdge(edge);
  edge.toVertex.removeEdge(edge);
};

NetworkGraph.prototype.getEdgeGroup = function(edge) {
  return this.edgeGroups[this.getEdgeGroupKey(edge)];
};

NetworkGraph.prototype.getEdgeGroupKey = function(edge, segmentType) {
  return edge.fromVertex.getId() < edge.toVertex.getId() ?
    segmentType + '_' + edge.fromVertex.getId() + '_' + edge.toVertex.getId() :
    segmentType + '_' + edge.toVertex.getId() + '_' + edge.fromVertex.getId();
};

NetworkGraph.prototype.mergeVertices = function(vertexArray) {
  var xTotal = 0,
    yTotal = 0;

  var vertexGroups = {
    'STOP': [],
    'PLACE': [],
    'TURN': [],
    'MULTI': []
  };
  vertexArray.forEach(function(vertex) {
    if (vertex.point.getType() in vertexGroups) vertexGroups[vertex.point.getType()]
      .push(vertex);
  });

  var mergePoint;

  // don't merge stops and places, or multiple places:
  if ((vertexGroups.STOP.length > 0 && vertexGroups.PLACE.length > 0) ||
    vertexGroups.PLACE.length > 1 ||
    vertexGroups.MULTI.length > 0) return;

  // if merging turns with a place, create a new merged vertex around the place
  if (vertexGroups.PLACE.length === 1 && vertexGroups.TURN.length > 0) {
    mergePoint = vertexGroups.PLACE[0].point;
  }

  // if merging turns with a single place, create a new merged vertex around the stop
  else if (vertexGroups.STOP.length === 1 && vertexGroups.TURN.length > 0) {
    mergePoint = vertexGroups.STOP[0].point;
  }

  // if merging multiple stops, create a new MultiPoint vertex
  else if (vertexGroups.STOP.length > 1) {
    mergePoint = new MultiPoint();
    each(vertexGroups.STOP, function(stopVertex) {
      mergePoint.addPoint(stopVertex.point);
    });
  }

  // if merging multiple turns
  else if (vertexGroups.TURN.length > 1) {
    mergePoint = vertexGroups.TURN[0].point;
  }

  if (!mergePoint) return;
  var mergedVertex = new Vertex(mergePoint, 0, 0);

  var origPoints = [];
  vertexArray.forEach(function(vertex) {
    xTotal += vertex.x;
    yTotal += vertex.y;

    var edges = [];
    each(vertex.edges, function(edge) {
      edges.push(edge);
    });

    each(edges, function(edge) {
      if (vertexArray.indexOf(edge.fromVertex) !== -1 && vertexArray.indexOf(
        edge.toVertex) !== -1) {
        this.removeEdge(edge);
        return;
      }
      edge.replaceVertex(vertex, mergedVertex);
      mergedVertex.addEdge(edge);
    }, this);
    var index = this.vertices.indexOf(vertex);
    if (index !== -1) this.vertices.splice(index, 1);
  }, this);

  mergedVertex.x = xTotal / vertexArray.length;
  mergedVertex.y = yTotal / vertexArray.length;
  mergedVertex.oldVertices = vertexArray;

  this.vertices.push(mergedVertex);
};

NetworkGraph.prototype.sortVertices = function() {
  this.vertices.sort(function(a, b) {
    if (a.point && a.point.getType() === 'PLACE') return -1;
    if (b.point && b.point.getType() === 'PLACE') return 1;

    if (a.point && a.point.getType() === 'MULTI') return -1;
    if (b.point && b.point.getType() === 'MULTI') return 1;

    if (a.point && a.point.getType() === 'STOP') return -1;
    if (b.point && b.point.getType() === 'STOP') return 1;
  });
};

/**
 * Get the equivalent edge
 */

NetworkGraph.prototype.getEquivalentEdge = function(pointArray, from, to) {
  for (var e = 0; e < this.edges.length; e++) {
    var edge = this.edges[e];
    if (edge.fromVertex === from && edge.toVertex === to && pointArray.length ===
      edge.pointArray.length && equal(pointArray, edge.pointArray)) {
      return edge;
    }
    if (edge.fromVertex === to && edge.toVertex === from && pointArray.length ===
      edge.pointArray.length && equal(pointArray.slice(0).reverse(), edge.pointArray)) {
      return edge;
    }
  }
};

NetworkGraph.prototype.splitEdgeAtInternalPoints = function(edge, points) {
  var subEdgePoints = [],
    newEdge, newEdgeInfoArr = [];
  var fromVertex = edge.fromVertex;
  each(edge.pointArray, function(point) {
    if (points.indexOf(point) !== -1) {
      var x = point.worldX;
      var y = point.worldY;
      var newVertex = point.graphVertex || this.addVertex(point, x, y);
      newVertex.isInternal = true;
      newEdge = this.addEdge(subEdgePoints, fromVertex, newVertex, edge.edgeGroup
        .type);
      newEdge.isInternal = true;
      newEdge.copyPathSegments(edge);
      newEdgeInfoArr.push({
        graphEdge: newEdge,
        fromVertex: fromVertex
      });
      subEdgePoints = [];
      fromVertex = newVertex;
    } else {
      subEdgePoints.push(point);
    }
  }, this);

  // create the last sub-edge
  newEdge = this.addEdge(subEdgePoints, fromVertex, edge.toVertex, edge.edgeGroup
    .type);
  newEdge.isInternal = true;
  newEdge.copyPathSegments(edge);
  newEdgeInfoArr.push({
    graphEdge: newEdge,
    fromVertex: fromVertex
  });

  // insert the new edge sequence into the affected segments
  each(edge.pathSegments, function(pathSegment) {
    var indexInSegment = pathSegment.getEdgeIndex(edge);
    var forward = pathSegment.edges[indexInSegment].forward;
    var index = pathSegment.getEdgeIndex(edge);
    each(forward ? newEdgeInfoArr : newEdgeInfoArr.reverse(), function(edgeInfo) {
      pathSegment.insertEdgeAt(index, edgeInfo.graphEdge, forward ? edgeInfo.fromVertex : edgeInfo.toVertex);
      index++;
    });
  });

  // remove the original edge from the graph
  this.removeEdge(edge);
};

/*NetworkGraph.prototype.collapseTransfers = function(threshold) {
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
};*/

NetworkGraph.prototype.pruneVertices = function() {
  each(this.vertices, function(vertex) {
    if (vertex.point.containsSegmentEndPoint()) return;

    var opposites = [];
    var pathSegmentBundles = {}; // maps pathSegment id list (string) to collection of edges (array)

    each(vertex.edges, function(edge) {
      var pathSegmentIds = edge.getPathSegmentIds();
      if (!(pathSegmentIds in pathSegmentBundles)) pathSegmentBundles[
        pathSegmentIds] = [];
      pathSegmentBundles[pathSegmentIds].push(edge);
      var opp = edge.oppositeVertex(vertex);
      if (opposites.indexOf(opp) === -1) opposites.push(opp);
    });

    if (opposites.length !== 2) return;

    each(pathSegmentBundles, function(ids) {
      var edgeArr = pathSegmentBundles[ids];
      if (edgeArr.length === 2) this.mergeEdges(edgeArr[0], edgeArr[1]);
    }, this);

  }, this);
};

NetworkGraph.prototype.mergeEdges = function(edge1, edge2) {

  // reverse edges if necessary
  if (edge1.fromVertex === edge2.toVertex) {
    this.mergeEdges(edge2, edge1);
    return;
  }

  if (edge1.toVertex !== edge2.fromVertex) return; // edges cannot be merged

  var internalPoints = edge1.pointArray.concat(edge2.pointArray);

  var newEdge = this.addEdge(internalPoints, edge1.fromVertex, edge2.toVertex,
    edge1.edgeGroup.type);
  newEdge.pathSegments = edge1.pathSegments;
  each(newEdge.pathSegments, function(segment) {
    //var i = segment.graphEdges.indexOf(edge1);
    //segment.graphEdges.splice(i, 0, newEdge);
    var i = segment.getEdgeIndex(edge1);
    segment.insertEdgeAt(i, newEdge, newEdge.fromVertex);
  });

  // if both input edges are have coordinate geometry, merge the coords arrays in the new edge
  if(edge1.geomCoords && edge2.geomCoords) {
    newEdge.geomCoords = edge1.geomCoords.concat(edge2.geomCoords.length > 0 ?
      edge2.geomCoords.slice(1) : []);
  }

  debug('merging:');
  debug(edge1);
  debug(edge2);
  this.removeEdge(edge1);
  this.removeEdge(edge2);
};

NetworkGraph.prototype.snapToGrid = function(cellSize) {
  var coincidenceMap = {};
  this.vertices.forEach(function(vertex) {
    var nx = Math.round(vertex.x / cellSize) * cellSize;
    var ny = Math.round(vertex.y / cellSize) * cellSize;
    vertex.x = nx;
    vertex.y = ny;

    var key = nx + '_' + ny;
    if (!(key in coincidenceMap)) coincidenceMap[key] = [vertex];
    else coincidenceMap[key].push(vertex);
  });

  each(coincidenceMap, function(key) {
    var vertexArr = coincidenceMap[key];
    if (vertexArr.length > 1) {
      this.mergeVertices(vertexArr);
    }
  }, this);
};

NetworkGraph.prototype.calculateGeometry = function(cellSize, angleConstraint) {
  this.edges.forEach(function(edge) {
    edge.calculateGeometry(cellSize, angleConstraint);
  });
};

NetworkGraph.prototype.resetCoordinates = function() {
  this.vertices.forEach(function(vertex) {
    vertex.x = vertex.origX;
    vertex.y = vertex.origY;
  });
};

NetworkGraph.prototype.recenter = function() {

  var xCoords = [],
    yCoords = [];
  this.vertices.forEach(function(v) {
    xCoords.push(v.x);
    yCoords.push(v.y);
  });

  var mx = d3.median(xCoords),
    my = d3.median(yCoords);

  this.vertices.forEach(function(v) {
    v.x = v.x - mx;
    v.y = v.y - my;
  });
};

NetworkGraph.prototype.clone = function() {
  var vertices = [];
  this.vertices.forEach(function(vertex) {
    vertices.push(vertex.clone());
  });

  var edges = [];
  this.edges.forEach(function(edge) {
    edge.push(edge.clone());
  });
};

/** 2D line bundling & offsetting **/

NetworkGraph.prototype.apply2DOffsets = function() {

  this.initComparisons();

  var alignmentBundles = {}; // maps alignment ID to array of range-bounded bundles on that alignment

  var addToBundle = function(rEdge, alignmentId) {
    var bundle;

    // compute the alignment range of the edge being bundled
    var range = rEdge.graphEdge.getAlignmentRange(alignmentId);

    // check if bundles already exist for this alignment
    if (!(alignmentId in alignmentBundles)) { // if not, create new and add to collection
      bundle = new AlignmentBundle();
      bundle.addEdge(rEdge, range.min, range.max);
      alignmentBundles[alignmentId] = [bundle]; // new AlignmentBundle();
    } else { // 1 or more bundles currently exist for this alignmentId
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

  each(this.edges, function(edge) {

    var fromAlignmentId = edge.getFromAlignmentId();
    var toAlignmentId = edge.getToAlignmentId();

    each(edge.renderedEdges, function(rEdge) {
      addToBundle(rEdge, fromAlignmentId);
      addToBundle(rEdge, toAlignmentId);
    });
  });

  var bundleSorter = (function(a, b) {

    var aId = a.patternIds || a.pathSegmentIds;
    var bId = b.patternIds || b.pathSegmentIds;

    var aVector = a.getAlignmentVector(this.currentAlignmentId);
    var bVector = b.getAlignmentVector(this.currentAlignmentId);
    var isOutward = (Util.isOutwardVector(aVector) && Util.isOutwardVector(
      bVector)) ? 1 : -1;

    var abCompId = aId + '_' + bId;
    if (abCompId in this.bundleComparisons) {
      return isOutward * this.bundleComparisons[abCompId];
    }

    var baCompId = bId + '_' + aId;
    if (baCompId in this.bundleComparisons) {
      return isOutward * this.bundleComparisons[baCompId];
    }

    if (a.route && b.route && a.route.route_type !== b.route.route_type) {
      return a.route.route_type > b.route.route_type ? 1 : -1;
    }

    var isForward = (a.forward && b.forward) ? 1 : -1;
    return isForward * isOutward * (aId < bId ? -1 : 1);
  }).bind(this);

  each(alignmentBundles, function(alignmentId) {
    var bundleArr = alignmentBundles[alignmentId];
    each(bundleArr, function(bundle) {
      if (bundle.items.length <= 1) return;
      var lw = 1.2;
      var bundleWidth = lw * (bundle.items.length - 1);

      this.currentAlignmentId = alignmentId;
      bundle.items.sort(bundleSorter);
      each(bundle.items, function(rEdge, i) {
        var offset = (-bundleWidth / 2) + i * lw;
        if (rEdge.getType() === 'TRANSIT') {
          each(rEdge.patterns, function(pattern) {
            pattern.offsetAlignment(alignmentId, offset);
          });
        } else rEdge.offsetAlignment(alignmentId, offset);
      });
    }, this);
  }, this);
};

/**
 * Traverses the graph vertex-by-vertex, creating comparisons between all pairs of
 * edges for which a topological relationship can be established.
 */

NetworkGraph.prototype.initComparisons = function() {

  this.bundleComparisons = {};

  each(this.vertices, function(vertex) {
    var incidentGraphEdges = vertex.incidentEdges();

    var angleREdges = {};
    each(incidentGraphEdges, function(incidentGraphEdge) {
      var angle = (incidentGraphEdge.fromVertex === vertex) ? incidentGraphEdge.fromAngle : incidentGraphEdge.toAngle;
      var angleDeg = 180 * angle / Math.PI;
      if (!(angleDeg in angleREdges)) angleREdges[angleDeg] = [];
      angleREdges[angleDeg] = angleREdges[angleDeg].concat(incidentGraphEdge.renderedEdges);
    });

    each(angleREdges, function(angle) {
      var rEdges = angleREdges[angle];
      if (rEdges.length < 2) return;
      for (var i = 0; i < rEdges.length - 1; i++) {
        for (var j = i + 1; j < rEdges.length; j++) {
          var re1 = rEdges[i],
            re2 = rEdges[j];

          var opp1 = re1.graphEdge.oppositeVertex(vertex);
          var opp2 = re2.graphEdge.oppositeVertex(vertex);

          var ccw = Util.ccw(opp1.x, opp1.y, vertex.x, vertex.y, opp2.x,
            opp2.y);

          if (ccw === 0) {
            var s1Ext = re1.findExtension(opp1);
            var s2Ext = re2.findExtension(opp2);
            if (s1Ext) opp1 = s1Ext.graphEdge.oppositeVertex(opp1);
            if (s2Ext) opp2 = s2Ext.graphEdge.oppositeVertex(opp2);
            ccw = Util.ccw(opp1.x, opp1.y, vertex.x, vertex.y, opp2.x, opp2
              .y);
          }

          ccw = getInverse(re1, re2, vertex) * ccw;

          if (ccw > 0) {
            // e1 patterns are 'less' than e2 patterns
            this.storeComparison(re1, re2);
          }

          if (ccw < 0) {
            // e2 patterns are 'less' than e2 patterns
            this.storeComparison(re2, re1);
          }

        }
      }
    }, this);
  }, this);
};

function getInverse(s1, s2, vertex) {
  return ((s1.graphEdge.toVertex === vertex && s2.graphEdge.toVertex === vertex) ||
      (s1.graphEdge.toVertex === vertex && s2.graphEdge.fromVertex === vertex)) ?
    -1 : 1;
}

NetworkGraph.prototype.storeComparison = function(s1, s2) {
  var s1Id = s1.patternIds || s1.pathSegmentIds;
  var s2Id = s2.patternIds || s2.pathSegmentIds;
  debug('storing comparison: ' + s1Id + ' < ' + s2Id);
  this.bundleComparisons[s1Id + '_' + s2Id] = -1;
  this.bundleComparisons[s2Id + '_' + s1Id] = 1;
};

/**
 *  AlignmentBundle class
 */

function AlignmentBundle() {
  this.items = []; // RenderedEdges
  this.min = Number.MAX_VALUE;
  this.max = -Number.MAX_VALUE;
}

AlignmentBundle.prototype.addEdge = function(rEdge, min, max) {

  if (this.items.indexOf(rEdge) === -1) {
    this.items.push(rEdge);
  }

  this.min = Math.min(this.min, min);
  this.max = Math.max(this.max, max);
};

AlignmentBundle.prototype.rangeOverlaps = function(min, max) {
  return this.min < max && min < this.max;
};

/** other helper functions **/

function getAlignmentVector(alignmentId) {
  if (alignmentId.charAt(0) === 'x') return {
    x: 0,
    y: 1
  };
  if (alignmentId.charAt(0) === 'y') return {
    x: 1,
    y: 0
  };
}

function getOutVector(edge, vertex) {

  if (edge.fromVertex === vertex) {
    return edge.fromVector;
  }
  if (edge.toVertex === vertex) {
    var v = {
      x: -edge.toVector.x,
      y: -edge.toVector.y,
    };
    return v;
  }

  debug('Warning: getOutVector() called on invalid edge / vertex pair');
  debug(' - Edge: ' + edge.toString());
  debug(' - Vertex: ' + vertex.toString());
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
