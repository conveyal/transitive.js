
/**
 * Dependencies
 */

var Edge = require('./edge');
var Vertex = require('./vertex');

var PriorityQueue = require('priorityqueuejs');

/**
 * Expose `Graph`
 */

module.exports = NetworkGraph;

/**
 *  An graph representing the underlying 'wireframe' network
 */

function NetworkGraph() {
  this.vertices = [];
  this.edges = [];
}

/**
 * Add Vertex
 */

NetworkGraph.prototype.addVertex = function(point, x, y) {
  if(x === undefined || y === undefined) {
    var xy = latLonToSphericalMercator(point.getLat(), point.getLon());
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

NetworkGraph.prototype.addEdge = function(stopArray, fromVertex, toVertex) {
  if (this.vertices.indexOf(fromVertex) === -1) {
    console.log('Error: NetworkGraph does not contain Edge fromVertex');
    return;
  }

  if (this.vertices.indexOf(toVertex) === -1) {
    console.log('Error: NetworkGraph does not contain Edge toVertex');
    return;
  }

  var edge = new Edge(stopArray, fromVertex, toVertex);
  this.edges.push(edge);
  fromVertex.edges.push(edge);
  toVertex.edges.push(edge);

  return edge;
};

/**
 * Get the equivalent edge
 */

NetworkGraph.prototype.getEquivalentEdge = function(pointArray, from, to) {
  for (var e = 0; e < this.edges.length; e++) {
    var edge = this.edges[e];
    if (edge.fromVertex === from
      && edge.toVertex === to
      && pointArray.length === edge.pointArray.length
      && equal(pointArray, edge.pointArray)) {
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
    if(edge.patterns.length > maxPatterns) {
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
  if(llDir === 0) llDir = trunkEdge.toVertex.y - trunkEdge.fromVertex.y;

  if(llDir > 0) {
    // make the trunk edge from (0,0) to (x,0)
    trunkEdge.fromVertex.moveTo(0, 0);
    trunkEdge.toVertex.moveTo(trunkEdge.stopArray.length + 1, 0);

    // explore the graph in both directions
    this.extend1D(trunkEdge, trunkEdge.fromVertex, -1, 0);
    this.extend1D(trunkEdge, trunkEdge.toVertex, 1, 0);
  }
  else {
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

  var edges = vertex.incidentEdges(edge);
  if(edges.length === 0) { // no additional edges to explore; we're done
    return;
  }
  else if(edges.length === 1) { // exactly one other edge to explore
    var extEdge = edges[0];
    var oppVertex = extEdge.oppositeVertex(vertex);
    extEdge.setStopLabelPosition((y > 0) ? 1 : -1, vertex);

    if(this.exploredVertices.indexOf(oppVertex) !== -1) {
      console.log('Warning: found cycle in 1d graph');
      return;
    }
    this.exploredVertices.push(oppVertex);

    oppVertex.moveTo(vertex.x + (extEdge.stopArray.length + 1) * direction, y);
    this.extend1D(extEdge, oppVertex, direction, y);
  }
  else { // branch case
    //console.log('branch:');

    // iterate through the branches
    edges.forEach(function(extEdge, i) {
      var oppVertex = extEdge.oppositeVertex(vertex);

      if(this.exploredVertices.indexOf(oppVertex) !== -1) {
        console.log('Warning: found cycle in 1d graph (branch)');
        return;
      }
      this.exploredVertices.push(oppVertex);

      // the first branch encountered is rendered as the straight line
      // TODO: apply logic to this based on trip count, etc.
      if(i === 0) {
        oppVertex.moveTo(vertex.x + (extEdge.stopArray.length + 1) * direction, y);
        extEdge.setStopLabelPosition((y > 0) ? 1 : -1, vertex);
        this.extend1D(extEdge, oppVertex, direction, y);
      }
      else { // subsequent branches

        //console.log('branch y+'+i);
        var branchY = y+i;

        if(extEdge.stopArray.length === 0) {
          oppVertex.moveTo(vertex.x + 1 * direction, branchY);
          return;
        }

        var newVertexStop;
        if(extEdge.fromVertex === vertex) {
          newVertexStop = extEdge.stopArray[0];
          extEdge.stopArray.splice(0, 1);
        }
        else if(extEdge.toVertex === vertex) {
          newVertexStop = extEdge.stopArray[extEdge.stopArray.length-1];
          extEdge.stopArray.splice(extEdge.stopArray.length-1, 1);
        }

        var newVertex = this.addVertex(newVertexStop, vertex.x+direction, branchY);

        this.splitEdge(extEdge, newVertex, vertex);
        extEdge.setStopLabelPosition((branchY > 0) ? 1 : -1, vertex);

        oppVertex.moveTo(newVertex.x + (extEdge.stopArray.length + 1) * direction, branchY);
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
  if(edge.fromVertex === adjacentVertex) {
    newEdge = this.addEdge([], adjacentVertex, newVertex);
    edge.fromVertex = newVertex;
  }
  else if(edge.toVertex === adjacentVertex) {
    newEdge = this.addEdge([], newVertex, adjacentVertex);
    edge.toVertex = newVertex;
  }
  else { // invalid params
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


/**
 *  Compute offsets for a 1.5D line map rendering
 */

NetworkGraph.prototype.apply1DOffsets = function() {

  // initialize the bundle comparisons
  this.bundleComparisons = {};

  // loop through all vertices with order of 3+ (i.e. where pattern convergence/divergence is possible)
  this.vertices.forEach(function(vertex) {
    if(vertex.edges.length <= 2) return;

    // loop through the incident edges with 2+ patterns
    vertex.edges.forEach(function(edge) {
      if(edge.patterns.length < 2) return;

      // compare each pattern pair sharing this edge
      for(var i = 0; i < edge.patterns.length; i++) {
        for(var j = i+1; j < edge.patterns.length; j++) {
          var p1 = edge.patterns[i], p2 = edge.patterns[j];
          var adjEdge1 = p1.getAdjacentEdge(edge, vertex);
          var adjEdge2 = p2.getAdjacentEdge(edge, vertex);
          if(adjEdge1 !== null && adjEdge2 !== null || adjEdge1 !== adjEdge2) {
            var oppVertex1 = adjEdge1.oppositeVertex(vertex);
            var oppVertex2 = adjEdge2.oppositeVertex(vertex);

            var dx = edge.toVertex.x - edge.fromVertex.x;
            if(dx > 0 && oppVertex1.y < oppVertex2.y) {
              this.bundleComparison(p2, p1);
            }
            else if(dx > 0 && oppVertex1.y > oppVertex2.y) {
              this.bundleComparison(p1, p2);
            }
            else if(dx < 0 && oppVertex1.y < oppVertex2.y) {
              this.bundleComparison(p1, p2);
            }
            else if(dx < 0 && oppVertex1.y > oppVertex2.y) {
              this.bundleComparison(p2, p1);
            }
          }
        }
      }
    }, this);
  }, this);

  // create a copy of the array, sorted by bundle size (decreasing)
  var sortedEdges = this.edges.concat().sort(function compare(a,b) {
    if(a.patterns.length > b.patterns.length) return -1;
    if(a.patterns.length < b.patterns.length) return 1;
    return 0;
  });

  sortedEdges.forEach(function(edge) {
    if(edge.toVertex.y !== edge.fromVertex.y) return;
    //console.log('edge w/ ' + edge.patterns.length + ' to offset');
    if(edge.patterns.length === 1) {
      edge.patterns[0].setEdgeOffset(edge, 0);
    }
    else { // 2+ patterns
      var this_ = this;

      // compute the offsets for this buncle
      var sortedPatterns = edge.patterns.concat().sort(function compare(a, b) {
        var key = a.pattern_id + ',' + b.pattern_id;
        var compValue = this_.bundleComparisons[key];
        if(compValue < 0) return -1;
        if(compValue > 0) return 1;
        return 0;
      });
      sortedPatterns.forEach(function(pattern, i) {
        pattern.setEdgeOffset(edge, (-i + (edge.patterns.length-1)/2) * -1.2, i, true);
      });
    }
  }, this);
};


NetworkGraph.prototype.apply2DOffsets = function() {

  // initialize the bundle comparisons
  this.bundleComparisons = {};

  // loop through all vertices with order of 3+ (i.e. where pattern convergence/divergence is possible)
  this.vertices.forEach(function(vertex) {
    if(vertex.edges.length <= 2) return;

    // loop through the incident edges with 2+ patterns
    vertex.edges.forEach(function(edge) {
      if(edge.paths.length < 2) return;

      // compare each pattern pair sharing this edge
      for(var i = 0; i < edge.paths.length; i++) {
        for(var j = i+1; j < edge.paths.length; j++) {
          var p1 = edge.paths[i], p2 = edge.paths[j];
          var adjEdge1 = p1.getAdjacentEdge(edge, vertex);
          var adjEdge2 = p2.getAdjacentEdge(edge, vertex);

          if(adjEdge1 !== null && adjEdge2 !== null && adjEdge1 !== adjEdge2) {
            var oppVertex1 = adjEdge1.oppositeVertex(vertex);
            var oppVertex2 = adjEdge2.oppositeVertex(vertex);

            var dx = edge.toVertex.x - edge.fromVertex.x;
            if(dx > 0 && oppVertex1.y < oppVertex2.y) {
              this.bundleComparison(p2, p1);
            }
            else if(dx > 0 && oppVertex1.y > oppVertex2.y) {
              this.bundleComparison(p1, p2);
            }
            else if(dx < 0 && oppVertex1.y < oppVertex2.y) {
              this.bundleComparison(p1, p2);
            }
            else if(dx < 0 && oppVertex1.y > oppVertex2.y) {
              this.bundleComparison(p2, p1);
            }
          }
        }
      }
    }, this);
  }, this);

  // create a copy of the array, sorted by bundle size (decreasing)
  var sortedEdges = this.edges.concat().sort(function compare(a,b) {
    if(a.paths.length > b.paths.length) return -1;
    if(a.paths.length < b.paths.length) return 1;
    return 0;
  });

  sortedEdges.forEach(function(edge) {
    //if(edge.toVertex.y !== edge.fromVertex.y) return;
    if(edge.paths.length === 1) {
      edge.paths[0].setEdgeOffset(edge, 0);
    }
    else { // 2+ paths
      var this_ = this;

      // compute the offsets for this buncle
      var sortedPaths = edge.paths.concat().sort(function compare(a, b) {
        var key = a.pattern_id + ',' + b.pattern_id;
        var compValue = this_.bundleComparisons[key];
        if(compValue < 0) return -1;
        if(compValue > 0) return 1;
        return 0;
      });
      sortedPaths.forEach(function(pattern, i) {
        pattern.setEdgeOffset(edge, (-i + (edge.paths.length-1)/2) * -1.2, i, true);
      });
    }
  }, this);
};

/**
 *  Helper method for creating comparisons between patterns for bundle offsetting
 */

NetworkGraph.prototype.bundleComparison = function(p1, p2) {

  var key = p1.pattern_id + ',' + p2.pattern_id;
  if(!(key in this.bundleComparisons)) this.bundleComparisons[key] = 0;
  this.bundleComparisons[key] += 1;

  key = p2.pattern_id + ',' + p1.pattern_id;
  if(!(key in this.bundleComparisons)) this.bundleComparisons[key] = 0;
  this.bundleComparisons[key] -= 1;
};



NetworkGraph.prototype.snapToGrid = function(cellSize) {

  this.recenter();

  var coords = {}; // maps "X_Y"-format ID to the vertex object

  var xCoords = [], yCoords = [];
  this.vertices.forEach(function(vertex) {
    xCoords.push(vertex.x);
    yCoords.push(vertex.y);
  });

  var medianX = median(xCoords), medianY = median(yCoords);

  // set up priority-queue of all vertices, sorted by distance from median point
  var vertexQueue = new PriorityQueue(function(a, b) {
    return a.dist - b.dist;
  });
  this.vertices.forEach(function(vertex) {
    var dx = vertex.x - medianX, dy = vertex.y - medianY;
    vertexQueue.enq({
      dist: Math.sqrt(dx*dx + dy*dy),
      dx: dx,
      dy: dy,
      vertex: vertex
    });
  });

  var distFunction = function(a, b) {
    return b.dist - a.dist;
  };

  while(vertexQueue.size() > 0) {
    var vertexInfo = vertexQueue.deq();

    var vertex = vertexInfo.vertex;

    var newx = Math.round(vertex.x / cellSize) * cellSize;
    var newy = Math.round(vertex.y / cellSize) * cellSize;

    var coordId = newx + '_' + newy;
    if(coordId in coords) { // grid coordinate already in use

      // set up priority-queue of potential alternates
      var queue = new PriorityQueue(distFunction);

      var r = 3;
      for(var xr = -r; xr <= r; xr++) {
        for(var yr = -r; yr <= r; yr++) {
          if(xr === 0 && yr === 0) continue;
          var x = newx + xr * cellSize;
          var y = newy + yr * cellSize;
          var dist = Math.sqrt((newx-x)*(newx-x) + (newy-y)*(newy-y));
          queue.enq({
            dist: dist,
            x: x,
            y: y
          });
        }
      }

      while(queue.size() > 0) {
        var next = queue.deq();
        coordId = next.x + '_' + next.y;
        if(!(coordId in coords)) {
          newx = next.x;
          newy = next.y;
          break;
        }
      }
      coords[newx + '_' + newy] = vertex;
    }
    else {
      coords[coordId] = vertex;
    }

    vertex.x = newx;
    vertex.y = newy;

  }

};


NetworkGraph.prototype.initCurvature = function() {
  this.edges.forEach(function(edge) {
    edge.initCurvature();
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

  var xCoords = [], yCoords = [];
  this.vertices.forEach(function(v) {
    xCoords.push(v.x);
    yCoords.push(v.y);
  });

  var mx = median(xCoords), my = median(yCoords);

  this.vertices.forEach(function(v) {
    v.x = v.x - mx;
    v.y = v.y - my;
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


/**
 * Compute the median of an array of values
 */

function median(values) {

  values.sort(function(a, b) {
    return a - b;
  });

  var half = Math.floor(values.length / 2);

  if(values.length % 2) {
    return values[half];
  }
  else {
    return (values[half - 1] + values[half]) / 2.0;
  }
}


/**
 * Convert lat/lon coords to spherical mercator meter x/y coords
 */

function latLonToSphericalMercator(lat, lon) {
  var r = 6378137;
  var x = r * lon * Math.PI/180;
  var y = r * Math.log(Math.tan(Math.PI/4 + lat * Math.PI/360));
  return [x,y];
}