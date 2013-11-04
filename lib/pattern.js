
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

Pattern.prototype.setEdgeOffset = function(edge, offset, extend) {
  this.graphEdges.forEach(function(edgeInfo, i) {
    if(edgeInfo.edge === edge && edgeInfo.offset === null) {
      edgeInfo.offset = offset;
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
  var edgeInfo;
  for(var i = edgeIndex; i < this.graphEdges.length; i++) {
    edgeInfo = this.graphEdges[i];
    if(edgeInfo.edge.fromVertex.y !== edgeInfo.edge.toVertex.y) break;
    if(edgeInfo.offset === null) edgeInfo.offset = offset;
  }
  for(i = edgeIndex; i >= 0; i--) {
    edgeInfo = this.graphEdges[i];
    if(edgeInfo.edge.fromVertex.y !== edgeInfo.edge.toVertex.y) break;
    if(edgeInfo.offset === null) edgeInfo.offset = offset;
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

  // add the stop groups to the pattern
  this.stopSvgGroups = this.svgGroup.selectAll('.transitive-stop')
    .data(this.getStopData())
    .enter()
    .append('g');

  this.stopSvgGroups.append('circle')
    .attr('class', 'transitive-stop-circle');

  this.stopSvgGroups.append('text')
    .attr('id', function (d) {
      return 'transitive-stop-label-' + d.stop.getId();
    })
    .text(function (d) {
      return d.stop.stop_name;
    })
    .attr('class', 'transitive-stop-label');
};

/**
 * Refresh
 */

Pattern.prototype.refresh = function(display) {
  var widthStr = this.lineGraph.style('stroke-width');
  this.lineWidth = parseInt(widthStr.substring(0, widthStr.length - 2), 10);

  // update the line and stop groups
  var stopData = this.getStopData();
  this.lineGraph.attr('d', this.line(stopData));

  this.stopSvgGroups.data(stopData);
  this.stopSvgGroups.attr('transform', function (d, i) {
    var x = display.xScale(d.x) - d.offsetX;
    var y = display.yScale(d.y) + d.offsetY;
    return 'translate(' + x +', ' + y +')';
  });
};

/**
 * Returns an array of "stop info" objects, each consisting of the stop x/y
 * coordinates in the Display coordinate space, and a reference to the original
 * Stop instance
 */

Pattern.prototype.getStopData = function() {
  var stopData = [];
  this.graphEdges.forEach(function (edgeInfo, i) {

    var edge = edgeInfo.edge;

    var prevEdge = i > 0
      ? this.graphEdges[i - 1].edge
      : null;
    var nextEdge = i < this.graphEdges.length - 1
      ? this.graphEdges[i + 1].edge
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

      stopData.push(stopInfo);
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
      stopData.push(stopInfo);
    }, this);

    // the "to" vertex stop for this edge
    stopInfo = {
      x: edge.toVertex.x,
      y: edge.toVertex.y,
      stop: edge.toVertex.stop,
      inEdge: edge,
      outEdge: null
    };

    if (edgeInfo.offset) {
      if (nextEdge
        && nextEdge.rightVector.x !== edge.rightVector.x
        && nextEdge.rightVector.y !== edge.rightVector.y) {

        var added = {
          x: nextEdge.rightVector.x + edge.rightVector.x,
          y: nextEdge.rightVector.y + edge.rightVector.y,
        };
        var len = Math.sqrt(added.x * added.x + added.y * added.y);
        var normalized = { x : added.x / len, y : added.y / len };

        var opp = Math.sqrt(
          Math.pow(nextEdge.rightVector.x - edge.rightVector.x, 2)
          + Math.pow(nextEdge.rightVector.y - edge.rightVector.y, 2)
          ) / 2;

        var l = 1 / Math.sqrt(1 - opp * opp); // sqrt(1-x*x) = sin(acos(x))

        stopInfo.offsetX = normalized.x * this.lineWidth * edgeInfo.offset * l;
        stopInfo.offsetY = normalized.y * this.lineWidth * edgeInfo.offset * l;
      } else {
        stopInfo.offsetX = edge.rightVector.x * this.lineWidth * edgeInfo.offset;
        stopInfo.offsetY = edge.rightVector.y * this.lineWidth * edgeInfo.offset;
      }
    } else {
      stopInfo.offsetX = stopInfo.offsetY = 0;
    }

    stopData.push(stopInfo);
  }, this);

  return stopData;
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