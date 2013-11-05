
/**
 * Dependencies
 */

var d3 = require('d3');

/**
 * Expose `Pattern`
 */

module.exports = Pattern;

/**
 *  A Route Pattern -- a unique sequence of stops
 */

function Pattern(data) {
  for (var key in data) {
    if (key === 'stops') continue;
    this[key] = data[key];
  }

  this.stops = [];

  // The pattern as an ordered sequence of edges in the graph w/ associated metadata.
  // Array of objects containing the following fields:
  //  - edge : the Edge object
  //  - offset : the offset for rendering, expressed as a factor of the line width and relative to the 'forward' direction of the pattern
  this.graphEdges = [];

  // temporarily hardcoding the line width; need to get this from the styler
  this.lineWidth = 15;
}

/**
 * addEdge: add a new edge to the end of this pattern's edge list
 */

Pattern.prototype.addEdge = function(edge) {
  this.graphEdges.push({
    edge: edge,
    offset: null
  });
};


/**
 * insertEdge: insert an edge into this patterns edge list at a specified index
 */

Pattern.prototype.insertEdge = function(index, edge) {
  this.graphEdges.splice(index, 0, {
    edge: edge,
    offset: null
  });
};


/**
 * setEdgeOffset: applies a specified offset to a specified edge in the pattern
 */

Pattern.prototype.setEdgeOffset = function(edge, offset, bundleIndex, extend) {
  this.graphEdges.forEach(function(edgeInfo, i) {
    if(edgeInfo.edge === edge && edgeInfo.offset === null) {
      edgeInfo.offset = offset;
      edgeInfo.bundleIndex = bundleIndex;
      //console.log('- set offset: '+offset);
      if(extend) this.extend1DEdgeOffset(i);
    }
  }, this);
};


/**
 * extend1DEdgeOffset
 */

Pattern.prototype.extend1DEdgeOffset = function(edgeIndex) {
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

/**
 * Draw
 */

Pattern.prototype.draw = function(display, capExtension) {
  var stops = this.stops;

  // create the pattern as an empty svg group
  this.svgGroup = display.svg.append('g');

  // add the line to the pattern
  this.line = d3.svg.line() // the line translation function
    .x(function (stopInfo, i) {
      var vx = stopInfo.x, x;

      // if first/last element, extend the line slightly
      var edgeIndex = i === 0
        ? 0
        : i - 1;

      if (i === 0) {
        x = display.xScale(vx)
          + capExtension * stopInfo.outEdge.vector.x;
      } else if (i === stops.length-1) {
        x = display.xScale(vx)
          - capExtension * stopInfo.inEdge.vector.x;
      } else {
        x = display.xScale(vx);
      }

      if (stopInfo.offsetX) {
        x -= stopInfo.offsetX;
      }

      return x;
    })
    .y(function (stopInfo, i) {
      var vy = stopInfo.y, y;

      var edgeIndex = (i === 0) ? 0 : i - 1;

      if (i === 0) {
        y = display.yScale(vy)
          - capExtension * stopInfo.outEdge.vector.y;
      } else if (i === stops.length-1) {
        y = display.yScale(vy)
          + capExtension * stopInfo.inEdge.vector.y;
      } else {
        y = display.yScale(vy);
      }

      if (stopInfo.offsetY) {
        y += stopInfo.offsetY;
      }

      return y;
    })
    .interpolate('linear');

  this.lineGraph = this.svgGroup.append('path')
    .attr('class', 'transitive-line');
};

/**
 * Refresh
 */

Pattern.prototype.refresh = function(display) {
  var widthStr = this.lineGraph.style('stroke-width');
  this.lineWidth = parseInt(widthStr.substring(0, widthStr.length - 2), 10);

  // update the line and stop groups
  this.lineGraph.attr('d', this.line(this.renderData));

};

/**
 * Returns an array of "stop info" objects, each consisting of the stop x/y
 * coordinates in the Display coordinate space, and a reference to the original
 * Stop instance
 */

Pattern.prototype.refreshRenderData = function() {
  this.renderData = [];
  this.graphEdges.forEach(function (edgeInfo, i) {

    var edge = edgeInfo.edge;

    var nextEdgeInfo = i < this.graphEdges.length - 1
      ? this.graphEdges[i + 1]
      : null;

    var stopInfo;

    // the "from" vertex stop for this edge (first edge only)
    if (i === 0) {
      stopInfo = {
        x: edge.fromVertex.x,
        y: edge.fromVertex.y,
        stop: edge.fromVertex.stop,
        inEdge: null,
        outEdge: edge
      };

      stopInfo.offsetX = edgeInfo.offset
        ? edge.rightVector.x * this.lineWidth * edgeInfo.offset
        : 0;

      stopInfo.offsetY = edgeInfo.offset
        ? edge.rightVector.y * this.lineWidth * edgeInfo.offset
        : 0;

      this.renderData.push(stopInfo);
      edge.fromVertex.stop.renderData.push(stopInfo);
    }

    // the internal stops for this edge
    edge.stopArray.forEach(function (stop, i) {
      stopInfo = edge.pointAlongEdge((i + 1) / (edge.stopArray.length + 1));
      stopInfo.stop = stop;
      stopInfo.inEdge = stopInfo.outEdge = edge;
      if(edgeInfo.offset) {
        stopInfo.offsetX = edge.rightVector.x * this.lineWidth * edgeInfo.offset;
        stopInfo.offsetY = edge.rightVector.y * this.lineWidth * edgeInfo.offset;
      }
      else {
        stopInfo.offsetX = stopInfo.offsetY = 0;
      }
      if(edgeInfo.bundleIndex === 0) stopInfo.showLabel = true;
      this.renderData.push(stopInfo);
      stop.renderData.push(stopInfo);
    }, this);

    // the "to" vertex stop for this edge. handles the 'corner' case between adjacent edges
    stopInfo = this.constructCornerStopInfo(edgeInfo, edge.toVertex, nextEdgeInfo);
    this.renderData.push(stopInfo);
    edge.toVertex.stop.renderData.push(stopInfo);

  }, this);
};


Pattern.prototype.constructCornerStopInfo = function(edgeInfo1, vertex, edgeInfo2) {
  
  var edge1 = edgeInfo1 ? edgeInfo1.edge : null;
  var edge2 = edgeInfo2 ? edgeInfo2.edge : null;

  var stopInfo = {
    x: vertex.x,
    y: vertex.y,
    stop: vertex.stop,
    inEdge: edge1,
    outEdge: edge2
  };

  var offset = null;
  if(edgeInfo1 && edgeInfo1.offset) offset = edgeInfo1.offset;
  if(edgeInfo2 && edgeInfo2.offset) offset = edgeInfo2.offset;

  if(offset === null) {
    stopInfo.offsetX = stopInfo.offsetY = 0;
    return stopInfo;
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

    stopInfo.offsetX = normalized.x * this.lineWidth * offset * l;
    stopInfo.offsetY = normalized.y * this.lineWidth * offset * l;
  } else {
    stopInfo.offsetX = edge1.rightVector.x * this.lineWidth * offset;
    stopInfo.offsetY = edge1.rightVector.y * this.lineWidth * offset;
  }

  //stopInfo.showLabel = true;

  return stopInfo;
};


/**
 * Get graph vertices
 */

Pattern.prototype.getGraphVertices = function() {
  var vertices = [];
  this.graphEdges.forEach(function (edge, i) {
    if (i === 0) {
      vertices.push(edge.fromVertex);
    }
    vertices.push(edge.toVertex);
  });
  return vertices;
};

Pattern.prototype.getEdgeIndex = function(edge) {
  for(var i = 0; i < this.graphEdges.length; i++) {
    if(this.graphEdges[i].edge === edge) return i;
  }
  return -1;
};

Pattern.prototype.getAdjacentEdge = function(edge, vertex) {

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

Pattern.prototype.startVertex = function() {
  if(!this.graphEdges || this.graphEdges.length === 0) return null;
  if(this.graphEdges.length === 1) return this.graphEdges[0].fromVertex;
  var first = this.graphEdges[0].edge, next = this.graphEdges[1].edge;
  if(first.toVertex == next.toVertex || first.toVertex == next.fromVertex) return first.fromVertex;
  if(first.fromVertex == next.toVertex || first.fromVertex == next.fromVertex) return first.toVertex;
  return null;
};

Pattern.prototype.endVertex = function() {
  if(!this.graphEdges || this.graphEdges.length === 0) return null;
  if(this.graphEdges.length === 1) return this.graphEdges[0].toVertex;
  var last = this.graphEdges[this.graphEdges.length-1].edge, prev = this.graphEdges[this.graphEdges.length-2].edge;
  if(last.toVertex == prev.toVertex || last.toVertex == prev.fromVertex) return last.fromVertex;
  if(last.fromVertex == prev.toVertex || last.fromVertex == prev.fromVertex) return last.toVertex;
  return null;
};

Pattern.prototype.toString = function() {
  return this.startVertex().stop.stop_name + ' to ' + this.endVertex().stop.stop_name;
};