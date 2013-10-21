
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

  // the pattern represented as an ordered sequence of edges in the NetworkGraph
  this.graphEdges = [];
}

/**
 * Draw
 */

Pattern.prototype.draw = function(display, capExtension) {
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
      } else if(i === this.stops.length-1) {
        x = display.xScale(vx)
          - capExtension * stopInfo.inEdge.vector.x;
      } else {
        x = display.xScale(vx);
      }

      if (stopInfo.offsetX) x -= stopInfo.offsetX;

      return x;
    }.bind(this))
    .y(function (stopInfo, i) {

      var vy = stopInfo.y, y;

      var edgeIndex = (i === 0) ? 0 : i - 1;

      if (i === 0) {
        y = display.yScale(vy)
          - capExtension * stopInfo.outEdge.vector.y;
      } else if (i === this.stops.length-1) {
        y = display.yScale(vy)
          + capExtension * stopInfo.inEdge.vector.y;
      } else {
        y = display.yScale(vy);
      }

      if (stopInfo.offsetY) y += stopInfo.offsetY;

      return y;
    }.bind(this))
    .interpolate('linear');

  this.lineGraph = this.svgGroup.append('path')
    .attr('class', 'line');

  // add the stop groups to the pattern
  this.stopSvgGroups = this.svgGroup.selectAll('.stop')
    .data(this.getStopData())
    .enter()
    .append('g');

  var drag = d3.behavior.drag()
    .on('dragstart', function (d) {
      d3.event.sourceEvent.stopPropagation(); // silence other listeners
    })
    .on('drag', function (d,i) {
      if (!d.stop.graphVertex) return;
      d.stop.graphVertex.moveTo(
        display.xScale.invert(d3.event.sourceEvent.pageX - display.offsetLeft),
        display.yScale.invert(d3.event.sourceEvent.pageY - display.offsetTop)
      );

      display.refreshAll();
    });

  this.stopSvgGroups.append('circle')
    .attr('class', 'stop-circle')
    // set up the mouse hover interactivity:
    .on('mouseenter', function (d) {
      d3.select('#stop-label-' + d.stop.getId())
        .style('visibility', 'visible');
    })
    .on('mouseleave', function (d) {
      if (display.zoom.scale() < display.labelZoomThreshold) {
        d3.select('#stop-label-' + d.stop.getId())
          .style('visibility', 'hidden');
      }
    })
    .call(drag);

  this.stopSvgGroups.append('text')
    .attr('id', function (d) {
      return 'stop-label-' + d.stop.getId();
    })
    .text(function (d) {
      return d.stop.stop_name;
    })
    .attr('class', 'stop-label');

  display.addElement(this);
};

/**
 * Refresh
 */

Pattern.prototype.refresh = function(display) {

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
 * Apply Style
 */

Pattern.prototype.applyStyle = function() {
  // store the line stroke width as an int field
  var widthStr = this.lineGraph.style('stroke-width');
  this.lineWidth = parseInt(widthStr.substring(0, widthStr.length-2), 10);
};

/**
 * Returns an array of "stop info" objects, each consisting of the stop x/y
 * coordinates in the Display coordinate space, and a reference to the original
 * Stop instance
 */

Pattern.prototype.getStopData = function() {

  var stopData = [];

  this.graphEdges.forEach(function (edge, i) {

    var prevEdge = i > 0
      ? this.graphEdges[i - 1]
      : null;
    var nextEdge = i < this.graphEdges.length - 1
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

      stopInfo.offsetX = this.offset
        ? edge.rightVector.x * this.lineWidth * this.offset
        : 0;

      stopInfo.offsetY = this.offset
        ? edge.rightVector.y * this.lineWidth * this.offset
        : 0;

      stopData.push(stopInfo);
    }

    // the internal stops for this edge
    edge.stopArray.forEach(function(stop, i) {
      stopInfo = edge.pointAlongEdge((i + 1) / (edge.stopArray.length + 1));
      stopInfo.stop = stop;
      stopInfo.inEdge = stopInfo.outEdge = edge;
      if(this.offset) {
        stopInfo.offsetX = edge.rightVector.x * this.lineWidth * this.offset;
        stopInfo.offsetY = edge.rightVector.y * this.lineWidth * this.offset;
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

    if (this.offset) {
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

        stopInfo.offsetX = normalized.x * this.lineWidth * this.offset * l;
        stopInfo.offsetY = normalized.y * this.lineWidth * this.offset * l;
      } else {
        stopInfo.offsetX = edge.rightVector.x * this.lineWidth * this.offset;
        stopInfo.offsetY = edge.rightVector.y * this.lineWidth * this.offset;
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
    if (i === 0) vertices.push(edge.fromVertex);
    vertices.push(edge.toVertex);
  }, this);
  return vertices;
};
