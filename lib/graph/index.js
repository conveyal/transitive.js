var d3 = require('d3');
var debug = require('debug')('transitive:graph');
var each = require('each');
var clone = require('clone');
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

function NetworkGraph(transitive, vertices) {
  this.transitive = transitive;
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
 * Get the bounds of the graph
 *
 * @return {Object}
 *   - {Object} x
 *     - {Number} max
 *     - {Number} min
 *   - {Object} y
 *     - {Number} max
 *     - {Number} min
 *   - {Object} lon
 *     - {Number} max
 *     - {Number} min
 *   - {Object} lat
 *     - {Number} max
 *     - {Number} min
 */

NetworkGraph.prototype.bounds = function() {
  var x = {
    max: -Infinity,
    min: Infinity
  };
  var y = {
    max: -Infinity,
    min: Infinity
  };

  for (var i in this.vertices) {
    var vertex = this.vertices[i];
    x.min = Math.min(x.min, vertex.x);
    x.max = Math.max(x.max, vertex.x);
    y.min = Math.min(y.min, vertex.y);
    y.max = Math.max(y.max, vertex.y);
  }

  return {
    x: x,
    y: y
  };
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

  var groupKey = this.getEdgeGroupKey(edge, segmentType);

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
  }
};

/**
 * Convert the graph coordinates to a linear 1-d display. Assumes a branch-based, acyclic graph
 */

NetworkGraph.prototype.convertTo1D = function(stopArray, from, to) {
  if (this.edges.length === 0) return;

  // find the "trunk" edge; i.e. the one with the most patterns
  var trunkEdge = null;
  var maxPatterns = 0;

  for (var e = 0; e < this.edges.length; e++) {
    var edge = this.edges[e];
    if (edge.patterns.length > maxPatterns) {
      trunkEdge = edge;
      maxPatterns = edge.patterns.length;
    }
  }
  this.exploredVertices = [trunkEdge.fromVertex, trunkEdge.toVertex];

  //console.log('trunk edge: ');
  //console.log(trunkEdge);
  trunkEdge.setStopLabelPosition(-1);

  // determine the direction relative to the trunk edge
  var llDir = trunkEdge.toVertex.x - trunkEdge.fromVertex.x;
  if (llDir === 0) llDir = trunkEdge.toVertex.y - trunkEdge.fromVertex.y;

  if (llDir > 0) {
    // make the trunk edge from (0,0) to (x,0)
    trunkEdge.fromVertex.moveTo(0, 0);
    trunkEdge.toVertex.moveTo(trunkEdge.stopArray.length + 1, 0);

    // explore the graph in both directions
    this.extend1D(trunkEdge, trunkEdge.fromVertex, -1, 0);
    this.extend1D(trunkEdge, trunkEdge.toVertex, 1, 0);
  } else {
    // make the trunk edge from (x,0) to (0,0)
    trunkEdge.toVertex.moveTo(0, 0);
    trunkEdge.fromVertex.moveTo(trunkEdge.stopArray.length + 1, 0);

    // explore the graph in both directions
    this.extend1D(trunkEdge, trunkEdge.fromVertex, 1, 0);
    this.extend1D(trunkEdge, trunkEdge.toVertex, -1, 0);
  }

  this.apply1DOffsets();
};

NetworkGraph.prototype.extend1D = function(edge, vertex, direction, y) {
  debug('extend1D');

  var edges = vertex.incidentEdges(edge);
  if (edges.length === 0) { // no additional edges to explore; we're done
    return;
  } else if (edges.length === 1) { // exactly one other edge to explore
    var extEdge = edges[0];
    var oppVertex = extEdge.oppositeVertex(vertex);
    extEdge.setStopLabelPosition((y > 0) ? 1 : -1, vertex);

    if (this.exploredVertices.indexOf(oppVertex) !== -1) {
      debug('extend1D: Warning: found cycle in 1d graph');
      return;
    }
    this.exploredVertices.push(oppVertex);

    oppVertex.moveTo(vertex.x + (extEdge.stopArray.length + 1) * direction, y);
    this.extend1D(extEdge, oppVertex, direction, y);
  } else { // branch case
    //console.log('branch:');

    // iterate through the branches
    edges.forEach(function(extEdge, i) {
      var oppVertex = extEdge.oppositeVertex(vertex);

      if (this.exploredVertices.indexOf(oppVertex) !== -1) {
        debug('extend1D: Warning: found cycle in 1d graph (branch)');
        return;
      }
      this.exploredVertices.push(oppVertex);

      // the first branch encountered is rendered as the straight line
      // TODO: apply logic to this based on trip count, etc.
      if (i === 0) {
        oppVertex.moveTo(vertex.x + (extEdge.stopArray.length + 1) *
          direction, y);
        extEdge.setStopLabelPosition((y > 0) ? 1 : -1, vertex);
        this.extend1D(extEdge, oppVertex, direction, y);
      } else { // subsequent branches

        //console.log('branch y+'+i);
        var branchY = y + i;

        if (extEdge.stopArray.length === 0) {
          oppVertex.moveTo(vertex.x + 1 * direction, branchY);
          return;
        }

        var newVertexStop;
        if (extEdge.fromVertex === vertex) {
          newVertexStop = extEdge.stopArray[0];
          extEdge.stopArray.splice(0, 1);
        } else if (extEdge.toVertex === vertex) {
          newVertexStop = extEdge.stopArray[extEdge.stopArray.length - 1];
          extEdge.stopArray.splice(extEdge.stopArray.length - 1, 1);
        }

        var newVertex = this.addVertex(newVertexStop, vertex.x + direction,
          branchY);

        this.splitEdge(extEdge, newVertex, vertex);
        extEdge.setStopLabelPosition((branchY > 0) ? 1 : -1, vertex);

        oppVertex.moveTo(newVertex.x + (extEdge.stopArray.length + 1) *
          direction, branchY);
        this.extend1D(extEdge, oppVertex, direction, branchY);
      }
      //console.log(extEdge);
    }, this);
  }
};

/**
 *
 */

NetworkGraph.prototype.splitEdge = function(edge, newVertex, adjacentVertex) {

  var newEdge;
  // attach the existing edge to the inserted vertex
  if (edge.fromVertex === adjacentVertex) {
    newEdge = this.addEdge([], adjacentVertex, newVertex, edge.edgeGroup.type);
    edge.fromVertex = newVertex;
  } else if (edge.toVertex === adjacentVertex) {
    newEdge = this.addEdge([], newVertex, adjacentVertex, edge.edgeGroup.type);
    edge.toVertex = newVertex;
  } else { // invalid params
    console.log('Warning: invalid params to graph.splitEdge');
    return;
  }

  // de-associate the existing edge from the adjacentVertex
  adjacentVertex.removeEdge(edge);

  // create new edge and copy the patterns
  //var newEdge = this.addEdge([], adjacentVertex, newVertex);
  edge.patterns.forEach(function(pattern) {
    newEdge.addPattern(pattern);
  });

  // associate both edges with the new vertex
  newVertex.edges = [newEdge, edge];

  // update the affected patterns' edge lists
  edge.patterns.forEach(function(pattern) {
    var i = pattern.graphEdges.indexOf(edge);
    pattern.insertEdge(i, newEdge);
  });

  // copy the pathSegment list
  newEdge.copyPathSegments(edge);

};

NetworkGraph.prototype.splitEdgeAtInternalPoints = function(edge, points) {
  var subEdgePoints = [],
    newEdge, newEdges = [];
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
      newEdges.push(newEdge);
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
  newEdges.push(newEdge);

  // remove the original edge from the graph
  each(edge.pathSegments, function(pathSegment) {
    pathSegment.replaceEdge(edge, newEdges);
  });

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
    var i = segment.graphEdges.indexOf(edge1);
    segment.graphEdges.splice(i, 0, newEdge);
  });
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
    //console.log(vertex);
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

  var addToBundle = function(segment, alignmentId) {
    var bundle;

    // compute the alignment range of the segment being bundled
    var range = segment.graphEdge.getAlignmentRange(alignmentId);

    // check if bundles already exist for this alignment
    if (!(alignmentId in alignmentBundles)) { // if not, create new and add to collection
      bundle = new AlignmentBundle();
      bundle.addSegment(segment, range.min, range.max);
      alignmentBundles[alignmentId] = [bundle]; // new AlignmentBundle();
    } else { // 1 or more bundles currently exist for this alignmentId
      var bundleArr = alignmentBundles[alignmentId];

      // see if the segment range overlaps with that of an existing bundle
      for (var i = 0; i < bundleArr.length; i++) {
        if (bundleArr[i].rangeOverlaps(range.min, range.max)) {
          bundleArr[i].addSegment(segment, range.min, range.max);
          return;
        }
      }

      // ..if not, create a new bundle
      bundle = new AlignmentBundle();
      bundle.addSegment(segment, range.min, range.max);
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

    return isOutward * (aId < bId ? -1 : 1);
  }).bind(this);

  each(alignmentBundles, function(alignmentId) {
    var bundleArr = alignmentBundles[alignmentId];
    each(bundleArr, function(bundle) {
      if (bundle.items.length <= 1) return;
      var lw = 1.2;
      var bundleWidth = lw * (bundle.items.length - 1);

      this.currentAlignmentId = alignmentId;
      bundle.items.sort(bundleSorter);
      each(bundle.items, function(segment, i) {
        var offset = (-bundleWidth / 2) + i * lw;
        if (segment.getType() === 'TRANSIT') {
          each(segment.patterns, function(pattern) {
            pattern.offsetAlignment(alignmentId, offset);
          });
        } else segment.offsetAlignment(alignmentId, offset);
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
    var edges = vertex.incidentEdges();

    var angleSegments = {};
    each(edges, function(edge) {
      var angle = (edge.fromVertex === vertex) ? edge.fromAngle : edge.toAngle;
      var angleDeg = 180 * angle / Math.PI;
      if (!(angleDeg in angleSegments)) angleSegments[angleDeg] = [];
      angleSegments[angleDeg] = angleSegments[angleDeg].concat(edge.renderedEdges);
    });

    each(angleSegments, function(angle) {
      var segments = angleSegments[angle];
      if (segments.length < 2) return;
      for (var i = 0; i < segments.length - 1; i++) {
        for (var j = i + 1; j < segments.length; j++) {
          var s1 = segments[i],
            s2 = segments[j];

          var opp1 = s1.graphEdge.oppositeVertex(vertex);
          var opp2 = s2.graphEdge.oppositeVertex(vertex);

          var ccw = Util.ccw(opp1.x, opp1.y, vertex.x, vertex.y, opp2.x,
            opp2.y);

          if (ccw === 0) {
            var s1Ext = s1.findExtension(opp1);
            var s2Ext = s2.findExtension(opp2);
            if (s1Ext) opp1 = s1Ext.graphEdge.oppositeVertex(opp1);
            if (s2Ext) opp2 = s2Ext.graphEdge.oppositeVertex(opp2);
            ccw = Util.ccw(opp1.x, opp1.y, vertex.x, vertex.y, opp2.x, opp2
              .y);
          }

          ccw = getInverse(s1, s2, vertex) * ccw;

          if (ccw > 0) {
            // e1 patterns are 'less' than e2 patterns
            this.storeComparison(s1, s2);
          }

          if (ccw < 0) {
            // e2 patterns are 'less' than e2 patterns
            this.storeComparison(s2, s1);
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
  this.items = []; // RenderSegments
  this.min = Number.MAX_VALUE;
  this.max = -Number.MAX_VALUE;
}

AlignmentBundle.prototype.addSegment = function(segment, min, max) {

  if (this.items.indexOf(segment) === -1) {
    this.items.push(segment);
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

  console.log('Warning: getOutVector() called on invalid edge / vertex pair');
  console.log(' - Edge: ' + edge.toString());
  console.log(' - Vertex: ' + vertex.toString());
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
