var d3 = require('d3');
var debug = require('debug')('transitive:graph');
var each = require('each');
var PriorityQueue = require('priorityqueuejs');

var Edge = require('./edge');
var Vertex = require('./vertex');
var MultiPoint = require('../point/multipoint');
var Util = require('../util');

/**
 * Expose `Graph`
 */

module.exports = NetworkGraph;

/**
 *  An graph representing the underlying 'wireframe' network
 */

function NetworkGraph(vertices) {
  this.edges = [];
  this.vertices = [];

  /**
   *  Object mapping groups of edges that share the same two vertices.
   *  - Key is string of format A_B, where A and B are vertex IDs and A < B
   *  - Value is array of edges
   */
  this.edgeGroups = {};

  // Add all base vertices
  for (var i in vertices) this.addVertex(vertices[i]);
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

  //console.log('aE segType=' + segmentType);
  var groupKey = this.getEdgeGroupKey(edge, segmentType);

  if(!(groupKey in this.edgeGroups)) {
    this.edgeGroups[groupKey] = new EdgeGroup(edge.fromVertex, edge.toVertex, segmentType);
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

  var multiPoint = new MultiPoint();
  var mergedVertex = new Vertex(multiPoint, 0, 0);

  var origPoints = [];
  vertexArray.forEach(function(vertex) {
    origPoints.push(vertex.point);
    xTotal += vertex.x;
    yTotal += vertex.y;
    vertex.edges.forEach(function(edge) {
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
  origPoints.forEach(function(point) {
    multiPoint.addPoint(point);
  });

  this.vertices.push(mergedVertex);
};

NetworkGraph.prototype.sortVertices = function() {
  this.vertices.sort(function(a, b) {
    if(a.point && a.point.getType() === 'PLACE') return -1;
    if(b.point && b.point.getType() === 'PLACE') return 1;

    if(a.point && a.point.getType() === 'MULTI') return -1;
    if(b.point && b.point.getType() === 'MULTI') return 1;

    if(a.point && a.point.getType() === 'STOP') return -1;
    if(b.point && b.point.getType() === 'STOP') return 1;
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

};

NetworkGraph.prototype.splitEdgeAtInternalPoints = function(edge, points) {
  var subEdgePoints = [],
    newEdge, newEdges = [];
  var fromVertex = edge.fromVertex;
  each(edge.pointArray, function(point) {
    if (points.indexOf(point) !== -1) {
      var x = point.worldX;
      var y = point.worldY;
      var newVertex = this.addVertex(point, x, y);
      newVertex.isInternal = true;
      newEdge = this.addEdge(subEdgePoints, fromVertex, newVertex, edge.edgeGroup.type);
      newEdge.isInternal = true;
      newEdges.push(newEdge);
      subEdgePoints = [];
      fromVertex = newVertex;
    } else {
      subEdgePoints.push(point);
    }
  }, this);

  // create the last sub-edge
  newEdge = this.addEdge(subEdgePoints, fromVertex, edge.toVertex, edge.edgeGroup.type);
  newEdge.isInternal = true;
  newEdges.push(newEdge);

  // remove the original edge from the graph
  each(edge.pathSegments, function(pathSegment) {
    pathSegment.replaceEdge(edge, newEdges);
  });

  this.removeEdge(edge);

};

NetworkGraph.prototype.apply2DOffsets = function(transitive) {

  this.doPatternComparison();
  //console.log(this.patternComparisons);

  var alignmentBundles = {}; // maps alignment discriptor to array of segments bundled on that alignment

  each(this.edges, function(edge) {

    var fromAlignmentId = edge.getFromAlignmentId();
    var toAlignmentId = edge.getToAlignmentId();

    each(edge.renderSegments, function(segment) {
      //if (segment.getType() !== 'TRANSIT') return;

      // create the from/to alignment bundles, if necessary
      if (!(fromAlignmentId in alignmentBundles)) {
        alignmentBundles[fromAlignmentId] = [];
      }
      if (!(toAlignmentId in alignmentBundles)) {
        alignmentBundles[toAlignmentId] = [];
      }

      var fromBundle = alignmentBundles[fromAlignmentId];
      var toBundle = alignmentBundles[toAlignmentId];

      if(segment.getType() === 'TRANSIT') {
        if (fromBundle.indexOf(segment.pattern) === -1) {
          fromBundle.push(segment.pattern);
        }
        if (toBundle.indexOf(segment.pattern) === -1) {
          toBundle.push(segment.pattern);
        }
      }
      else { // non-transit segment
        fromBundle.push(segment);
        toBundle.push(segment);
      }

    });
  });

  var bundleSorter = (function(a, b) {

    //if(!a.route || !b.route) return -1;

    var abCompId = a.getId() + '_' + b.getId();
    if (abCompId in this.patternComparisons) {
      return this.patternComparisons[abCompId];
    }

    var baCompId = b.getId() + '_' + a.getId();
    if (baCompId in this.patternComparisons) {
      return this.patternComparisons[baCompId];
    }

    if (a.route && b.route && a.route.route_type !== b.route.route_type) {
      return a.route.route_type > b.route.route_type;
    }
    var aVector = a.getAlignmentVector(this.currentAlignmentId);
    var bVector = b.getAlignmentVector(this.currentAlignmentId);

    if (Util.isOutwardVector(aVector) && Util.isOutwardVector(bVector))
      return a.getId() > b.getId();
    return a.getId() < b.getId();
  }).bind(this);

  for (var alignmentId in alignmentBundles) {
    var bundlePatterns = alignmentBundles[alignmentId];

    var lw = 1.2;
    var bundleWidth = lw * (bundlePatterns.length - 1);

    // sort step goes here
    this.currentAlignmentId = alignmentId;
    bundlePatterns.sort(bundleSorter);

    //console.log('offsetting bundle:');
    for (var i = 0; i < bundlePatterns.length; i++) {
      var offset = (-bundleWidth / 2) + i * lw;
      //console.log(' - ' + bundlePatterns[i].getId() + ' | ' + bundlePatterns[i].getName() + ' at ' + offset);
      bundlePatterns[i].offsetAlignment(alignmentId, offset);
    }
  }
};

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

NetworkGraph.prototype.doPatternComparison = function() {

  this.patternComparisons = {};

  each(this.vertices, function(vertex) {
    var edges = vertex.incidentEdges();
    if (edges.length < 2) return;
    for (var i = 0; i < edges.length - 1; i++) {
      for (var j = i + 1; j < edges.length; j++) {
        var e1 = edges[i],
          e2 = edges[j];
        if (!e1.hasTransit() || !e2.hasTransit()) continue;

        var outVector1 = getOutVector(e1, vertex);
        var outVector2 = getOutVector(e2, vertex);

        if (outVector1.x === outVector2.x && outVector1.y === outVector2.y) {
          this.bundleMatch(vertex, e1, e2, outVector1, outVector2);
        }
      }
    }
  }, this);
};

NetworkGraph.prototype.bundleMatch = function(vertex, e1, e2, outVector1,
  outVector2) {
  var isOutward = Util.isOutwardVector(outVector1);

  var opp1 = e1.oppositeVertex(vertex);
  var opp2 = e2.oppositeVertex(vertex);
  var ccw = Util.ccw(opp1.x, opp1.y, vertex.x, vertex.y, opp2.x, opp2.y);

  if ((ccw > 0 && isOutward) || (ccw < 0 && !isOutward)) {
    // e1 patterns are 'less' than e2 patterns
    this.edgePatternComparison(e1, e2);
  }

  if ((ccw > 0 && !isOutward) || (ccw < 0 && isOutward)) {
    // e2 patterns are 'less' than e2 patterns
    this.edgePatternComparison(e2, e1);
  }
};

NetworkGraph.prototype.edgePatternComparison = function(e1, e2) {
  each(e1.renderSegments, function(rseg1) {
    each(e2.renderSegments, function(rseg2) {
      var ptn1 = rseg1.pattern;
      var ptn2 = rseg2.pattern;

      this.patternComparisons[ptn1.getId() + '_' + ptn2.getId()] = -1;
      this.patternComparisons[ptn2.getId() + '_' + ptn1.getId()] = 1;
    }, this);
  }, this);
};

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

NetworkGraph.prototype.collapseTransfers = function(threshold) {
  threshold = threshold || 200;
  this.edges.forEach(function(edge) {
    if (edge.getLength() > threshold ||
      edge.fromVertex.point.containsFromPoint() ||
      edge.fromVertex.point.containsToPoint() ||
      edge.toVertex.point.containsFromPoint() ||
      edge.toVertex.point.containsToPoint()) return;
    //if(edge.fromVertex.point.getType() === 'PLACE' || edge.toVertex.point.getType() === 'PLACE') return;
    var walk = true;
    edge.pathSegments.forEach(function(segment) {
      walk = walk && segment.type === 'WALK';
    });
    if (walk) {
      this.mergeVertices([edge.fromVertex, edge.toVertex]);
    }
  }, this);
};

NetworkGraph.prototype.snapToGrid = function(cellSize) {
  //this.recenter();
  this.vertices.forEach(function(vertex) {
    var nx = Math.round(vertex.x / cellSize) * cellSize;
    var ny = Math.round(vertex.y / cellSize) * cellSize;
    vertex.x = nx;
    vertex.y = ny;
  });
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


/** EdgeGroup class **/

function EdgeGroup(fromVertex, toVertex, type) {
  this.fromVertex = fromVertex;
  this.toVertex = toVertex;
  this.type = type;
  this.edges = [];
  this.commonPoints = null;
  this.worldLength = 0;
}

EdgeGroup.prototype.addEdge = function(edge) {
  this.edges.push(edge);
  edge.edgeGroup = this;

  // update the groups worldLength
  this.worldLength = Math.max(this.worldLength, edge.getWorldLength());

  if(this.commonPoints === null) { // if this is first edge added, initialize group's commonPoint array to include all of edge's points
    this.commonPoints = [];
    each(edge.pointArray, function(point) {
      this.commonPoints.push(point);
    }, this);
  }
  else { // otherwise, update commonPoints array to only include those in added edge
    var newCommonPoints = [];
    each(edge.pointArray, function(point) {
      if(this.commonPoints.indexOf(point) !== -1) newCommonPoints.push(point);
    }, this);
    this.commonPoints = newCommonPoints;
  }
};

EdgeGroup.prototype.getWorldLength = function() {
  return this.worldLength;
};

EdgeGroup.prototype.getInternalVertexPQ = function() {

  // create an array of all points on the edge (endpoints and internal)
  var allPoints = ([ this.fromVertex.point ]).concat(this.commonPoints, [ this.toVertex.point ]);

  var pq = new PriorityQueue(function(a, b) {
    return a.weight - b.weight;
  });

  for(var i = 1; i < allPoints.length - 1; i++) {
    var weight = this.getInternalVertexWeight(allPoints, i);
    pq.enq({ weight: weight, point: allPoints[i] });
  }

  return pq;

};

EdgeGroup.prototype.getInternalVertexWeight = function(pointArray, index) {
  var x1 = pointArray[index - 1].worldX;
  var y1 = pointArray[index - 1].worldY;
  var x2 = pointArray[index].worldX;
  var y2 = pointArray[index].worldY;
  var x3 = pointArray[index + 1].worldX;
  var y3 = pointArray[index + 1].worldY;

  // the weighting function is a combination of:
  // - the distances from this internal point to the two adjacent points, normalized for edge length (longer distances are prioritized)
  // - the angle formed by this point and the two adjacent ones ('sharper' angles are prioritized)
  var inDist = Util.distance(x1, y1, x2, y2);
  var outDist = Util.distance(x2, y2, x3, y3);
  var theta = Util.angleFromThreePoints(x1, y1, x2, y2, x3, y3);
  var edgeLen = this.getWorldLength();
  var weight = inDist/edgeLen + outDist/edgeLen + Math.abs(Math.PI - theta) / Math.PI;
};
