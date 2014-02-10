
/**
 * Dependencies
 */

var d3 = require('d3');

/**
 * Expose `NetworkPath`
 */

module.exports = NetworkPath;

/**
 * A Route NetworkPath -- a unique sequence of network points (Stops or Places)
 *
 * @param {Object} the parent onject (a RoutePattern or Journey)
 */

function NetworkPath(parent) { //id, data) {
  /*this.id = id;
  for (var key in data) {
    if (key === 'stops') continue;
    this[key] = data[key];
  }

  this.stops = [];*/
  this.parent = parent;

  // The NetworkPath as an ordered sequence of edges in the graph w/ associated metadata.
  // Array of objects containing the following fields:
  //  - edge : the Edge object
  //  - offset : the offset for rendering, expressed as a factor of the line width and relative to the 'forward' direction of the NetworkPath
  this.graphEdges = [];

  this.segments = [];
  this.transferPoints = [];

  // temporarily hardcoding the line width; need to get this from the styler
  this.lineWidth = 10;
}

/**
 * addSegment: add a new segment to the end of this NetworkPath
 */

NetworkPath.prototype.addSegment = function(segment) {
  this.segments.push(segment);
  console.log('adding segment');
  console.log(segment);
  segment.points.forEach(function(point) {
    console.log(point);
    point.paths.push(this);
  }, this);
  this.addTransferPoint(segment.points[0]);
  this.addTransferPoint(segment.points[segment.points.length-1]);
};


NetworkPath.prototype.addTransferPoint = function(point) {
  if(this.transferPoints.indexOf(point) !== -1) return;
  this.transferPoints.push(point);
};


NetworkPath.prototype.isTransferPoint = function(point) {
  return this.transferPoints.indexOf(point) !== -1;
};

/**
 * addEdge: add a new edge to the end of this NetworkPath's edge list
 */

NetworkPath.prototype.addEdge = function(edge) {
  this.graphEdges.push({
    edge: edge,
    offset: null
  });
};

/**
 * insertEdge: insert an edge into this NetworkPaths edge list at a specified index
 */

NetworkPath.prototype.insertEdge = function(index, edge) {
  this.graphEdges.splice(index, 0, {
    edge: edge,
    offset: null
  });
};

/**
 * clearOffsets
 */

NetworkPath.prototype.clearOffsets = function() {
  this.graphEdges.forEach(function(edgeInfo, i) {
    edgeInfo.offset = null;
    edgeInfo.bundleIndex = null;
  }, this);
};


/**
 * setEdgeOffset: applies a specified offset to a specified edge in the NetworkPath
 */

NetworkPath.prototype.setEdgeOffset = function(edge, offset, bundleIndex, extend) {
  this.graphEdges.forEach(function(edgeInfo, i) {
    if(edgeInfo.edge === edge && edgeInfo.offset === null) {
      edgeInfo.offset = offset;
      edgeInfo.bundleIndex = bundleIndex;
      if(extend) this.extend1DEdgeOffset(i);
    }
  }, this);
};

/**
 * extend1DEdgeOffset
 */

NetworkPath.prototype.extend1DEdgeOffset = function(edgeIndex) {
  var offset = this.graphEdges[edgeIndex].offset;
  var bundleIndex = this.graphEdges[edgeIndex].bundleIndex;
  var edgeInfo;
  for(var i = edgeIndex; i < this.graphEdges.length; i++) {
    edgeInfo = this.graphEdges[i];
    if(edgeInfo.edge.fromVertex.y !== edgeInfo.edge.toVertex.y) break;
    if(edgeInfo.offset === null) {
      edgeInfo.offset = offset;
      edgeInfo.bundleIndex = bundleIndex;
    }
  }
  for(i = edgeIndex; i >= 0; i--) {
    edgeInfo = this.graphEdges[i];
    if(edgeInfo.edge.fromVertex.y !== edgeInfo.edge.toVertex.y) break;
    if(edgeInfo.offset === null) {
      edgeInfo.offset = offset;
      edgeInfo.bundleIndex = bundleIndex;
    }
  }
};


/** highlight **/

NetworkPath.prototype.drawHighlight = function(display, capExtension) {

  this.line = d3.svg.line() // the line translation function
    .x(function (pointInfo, i) {
      return display.xScale(pointInfo.x) + (pointInfo.offsetX || 0);
    })
    .y(function (pointInfo, i) {
      return display.yScale(pointInfo.y) + (pointInfo.offsetY || 0);
    })
    .interpolate(display.lineInterpolator.bind(this));

  this.lineGraph = display.svg.append('path')
    .attr('id', 'transitive-path-highlight-' +this.parent.getElementId())
    .attr('class', 'transitive-path-highlight')
    .style('stroke-width', 24).style('stroke', '#ff4')
    .style('fill', 'none')
    .style('visibility', 'hidden')
    .data([ this ]);
};


NetworkPath.prototype.refreshHighlight = function(display, capExtension) {
  this.renderData = [];
  for(var i = 0; i < this.segments.length; i++) {
    var segment = this.segments[i];
    segment.refreshRenderData();
    this.renderData = this.renderData.concat(segment.renderData);
  }
  this.lineGraph.attr('d', this.line(this.renderData));
};

/**
 * getPointArray
 */

NetworkPath.prototype.getPointArray = function() {
  var points = [];
  for(var i = 0; i < this.segments.length; i++) {
    var segment = this.segments[i];
    if(i > 0 && segment.points[0] === this.segments[i-1].points[this.segments[i-1].points.length-1]) {
      points.concat(segment.points.slice(1));
    }
    else {
      points.concat(segment.points);
    }
  }
  return points;
};


/**
 * Returns an array of "point info" objects, each consisting of the point x/y
 * coordinates in the Display coordinate space, and a reference to the original
 * Stop/Place instance
 */

NetworkPath.prototype.refreshRenderData = function() {
  this.renderData = [];
  var pointIndex = 0, edgeIndex = 0;

  this.segments.forEach(function (segment, i) {

    if(segment.graphEdges.length > 1) {
      console.log('skipping multi-edge segment');
      return;
    }
    var edge = segment.graphEdges[0]; // edgeInfo.edge;

    var edgeRenderData = [];

    var nextEdgeInfo = i < this.graphEdges.length - 1
      ? this.graphEdges[i + 1]
      : null;

    var pointInfo;

    // the "from" vertex point for this edge (first edge only)
    //if (i === 0) {
    pointInfo = {
      path: this,
      x: edge.fromVertex.x,
      y: edge.fromVertex.y,
      point: edge.fromVertex.point,
      inEdge: null,
      outEdge: edge,
      index: pointIndex++
    };

    /*pointInfo.offsetX = edgeInfo.offset
      ? edge.rightVector.x * this.lineWidth * edgeInfo.offset
      : 0;

    pointInfo.offsetY = edgeInfo.offset
      ? edge.rightVector.y * this.lineWidth * edgeInfo.offset
      : 0;*/
    pointInfo.offsetX = pointInfo.offsetY = 0;

    edgeRenderData.push(pointInfo);
    edge.fromVertex.point.addRenderData(pointInfo);

    // construct the 
    var x1 = edge.fromVertex.x, y1 = edge.fromVertex.y;
    var x2 = edge.toVertex.x, y2 = edge.toVertex.y;
    var tol = 0.001;
    var dx = x2 - x1, dy = y2 - y1;
    var r = null;
    if(Math.abs(dx) > tol && Math.abs(dy) > tol && Math.abs(dx) - Math.abs(dy) > tol) {
      r = 0.005;
      // horiz first
      var e = {
        x: x2,
        y: y1
      };

      edgeRenderData.push({
        x : x2 - r * (dx/Math.abs(dx)),
        y : y1
      });
      edgeRenderData.push({
        x : x2,
        y : y1 + r * (dy/Math.abs(dy))
      });
    }


    // the internal points for this edge
    edge.pointArray.forEach(function (point, i) {
      var t = (i + 1) / (edge.pointArray.length + 1);
      if(r) pointInfo = edge.pointAlongEdgeCurveX(t, r);
      else pointInfo = edge.pointAlongEdge(t);
      pointInfo.path = this;
      pointInfo.point = point;
      pointInfo.inEdge = pointInfo.outEdge = edge;
      /*if (edgeInfo.offset) {
        pointInfo.offsetX = edge.rightVector.x * this.lineWidth * edgeInfo.offset;
        pointInfo.offsetY = edge.rightVector.y * this.lineWidth * edgeInfo.offset;
      } else {
        pointInfo.offsetX = pointInfo.offsetY = 0;
      }
      if (edgeInfo.bundleIndex === 0) pointInfo.showLabel = true;*/
      pointInfo.offsetX = pointInfo.offsetY = 0;
      pointInfo.index = pointIndex++;

      //edgeRenderData.push(pointInfo);
      point.addRenderData(pointInfo);
    }, this);


    // the "to" vertex point for this edge. handles the 'corner' case between adjacent edges
    //pointInfo = this.constructCornerPointInfo(edgeInfo, edge.toVertex, nextEdgeInfo);
    //pointInfo.index = pointIndex;
  
    // temp: disregard offsetting
    pointInfo = {
      path: this,
      x: edge.toVertex.x,
      y: edge.toVertex.y,
      point: edge.toVertex.point,
      index: pointIndex,
      offsetX: 0,
      offsetY: 0
    };

    edgeRenderData.push(pointInfo);

    edge.toVertex.point.addRenderData(pointInfo);

    segment.renderData = edgeRenderData;
    //console.log('set rrd:');
    //console.log(segment);
    edgeIndex++;

  }, this);
};


NetworkPath.prototype.constructCornerPointInfo = function(edgeInfo1, vertex, edgeInfo2) {
  var edge1 = edgeInfo1 ? edgeInfo1.edge : null;
  var edge2 = edgeInfo2 ? edgeInfo2.edge : null;

  var pointInfo = {
    path: this,
    x: vertex.x,
    y: vertex.y,
    point: vertex.point,
    inEdge: edge1,
    outEdge: edge2
  };

  var offset = null;
  if(edgeInfo1 && edgeInfo1.offset) offset = edgeInfo1.offset;
  if(edgeInfo2 && edgeInfo2.offset) offset = edgeInfo2.offset;

  if(offset === null) {
    pointInfo.offsetX = pointInfo.offsetY = 0;
    return pointInfo;
  }

  if (edge2
    && edge2.rightVector.x !== edge1.rightVector.x
    && edge2.rightVector.y !== edge1.rightVector.y) {

    var added = {
      x: edge2.rightVector.x + edge1.rightVector.x,
      y: edge2.rightVector.y + edge1.rightVector.y,
    };

    var len = Math.sqrt(added.x * added.x + added.y * added.y);
    var normalized = { x : added.x / len, y : added.y / len };

    var opp = Math.sqrt(
      Math.pow(edge2.rightVector.x - edge1.rightVector.x, 2)
      + Math.pow(edge2.rightVector.y - edge1.rightVector.y, 2)
      ) / 2;

    var l = 1 / Math.sqrt(1 - opp * opp); // sqrt(1-x*x) = sin(acos(x))

    pointInfo.offsetX = normalized.x * this.lineWidth * offset * l;
    pointInfo.offsetY = normalized.y * this.lineWidth * offset * l;
  } else {
    pointInfo.offsetX = edge1.rightVector.x * this.lineWidth * offset;
    pointInfo.offsetY = edge1.rightVector.y * this.lineWidth * offset;
  }

  return pointInfo;
};


/**
 * Get graph vertices
 */

NetworkPath.prototype.getGraphVertices = function() {
  var vertices = [];
  this.graphEdges.forEach(function (edge, i) {
    if (i === 0) {
      vertices.push(edge.fromVertex);
    }
    vertices.push(edge.toVertex);
  });
  return vertices;
};

NetworkPath.prototype.getEdgeIndex = function(edge) {
  for(var i = 0; i < this.graphEdges.length; i++) {
    if(this.graphEdges[i].edge === edge) return i;
  }
  return -1;
};

NetworkPath.prototype.getAdjacentEdge = function(edge, vertex) {

  // ensure that edge/vertex pair is valid
  if(edge.toVertex !== vertex && edge.fromVertex !== vertex) return null;

  var index = this.getEdgeIndex(edge);
  if(index === -1) return null;

  // check previous edge
  if(index > 0) {
    var prevEdge = this.graphEdges[index-1].edge;
    if(prevEdge.toVertex === vertex || prevEdge.fromVertex === vertex) return prevEdge;
  }

  // check next edge
  if(index < this.graphEdges.length-1) {
    var nextEdge = this.graphEdges[index+1].edge;
    if(nextEdge.toVertex === vertex || nextEdge.fromVertex === vertex) return nextEdge;
  }

  return null;
};


NetworkPath.prototype.vertexArray = function() {

  var vertex = this.startVertex();
  var array = [ vertex ];

  this.graphEdges.forEach(function(edgeInfo) {
    vertex = edgeInfo.edge.oppositeVertex(vertex);
    array.push(vertex);
  });

  return array;
};

NetworkPath.prototype.startVertex = function() {
  if(!this.graphEdges || this.graphEdges.length === 0) return null;
  if(this.graphEdges.length === 1) return this.graphEdges[0].fromVertex;
  var first = this.graphEdges[0].edge, next = this.graphEdges[1].edge;
  if(first.toVertex == next.toVertex || first.toVertex == next.fromVertex) return first.fromVertex;
  if(first.fromVertex == next.toVertex || first.fromVertex == next.fromVertex) return first.toVertex;
  return null;
};

NetworkPath.prototype.endVertex = function() {
  if(!this.graphEdges || this.graphEdges.length === 0) return null;
  if(this.graphEdges.length === 1) return this.graphEdges[0].toVertex;
  var last = this.graphEdges[this.graphEdges.length-1].edge, prev = this.graphEdges[this.graphEdges.length-2].edge;
  if(last.toVertex == prev.toVertex || last.toVertex == prev.fromVertex) return last.fromVertex;
  if(last.fromVertex == prev.toVertex || last.fromVertex == prev.fromVertex) return last.toVertex;
  return null;
};

NetworkPath.prototype.toString = function() {
  return this.startVertex().stop.stop_name + ' to ' + this.endVertex().stop.stop_name;
};