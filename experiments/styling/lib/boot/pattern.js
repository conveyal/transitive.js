
/**
 * Dependencies
 */

var d3 = require('d3');
var style = require('style');
var _ = require('underscore');

/**
 * Expose `Pattern`
 */

module.exports = Pattern;

/**
 * Defaults
 */

var CAP_EXTENSION = 10;

/**
 *  A Route Pattern -- a unique sequence of stops
 */

function Pattern(data) {
  for (var name in data) {
    if (name === 'stops') {
      continue;
    }

    this[name] = data[name];
  }

  this.stops = [];

  // the pattern represented as an ordered sequence of edges in the NetworkGraph
  this.graphEdges = [];
}

Pattern.prototype.draw = function(display) {
  // create the pattern as an empty svg group
  this.svgGroup = display.svg.append('g');

  // add the line to the pattern

  this.line = d3.svg.line() // the line translation function
    .x(_.bind(function(stopInfo, i) {

      var vx = stopInfo.x;

      // if first/last element, extend the line slightly

      var edgeIndex = (i === 0) ? 0 : i - 1;

      var x;
      if (i === 0) {
        x = display.xScale(vx) + CAP_EXTENSION * stopInfo.outEdge.heading().x;
      } else if (i === this.stops.length-1) {
        x = display.xScale(vx) - CAP_EXTENSION * stopInfo.inEdge.heading().x;
      } else {
        x = display.xScale(vx);
      }

      return x;

    }, this))
    .y(_.bind(function(stopInfo, i) {

      var vy = stopInfo.y;

      var edgeIndex = (i === 0) ? 0 : i - 1;

      var y;
      if (i === 0) {
        y = display.yScale(vy) - CAP_EXTENSION * stopInfo.outEdge.heading().y;
      } else if (i === this.stops.length-1) {
        y = display.yScale(vy) + CAP_EXTENSION * stopInfo.inEdge.heading().y;
      } else {
        y = display.yScale(vy);
      }

      if (stopInfo.offsetY) {
        y += stopInfo.offsetY;
      }

      return y;
    }, this))
    .interpolate('linear');

  this.lineGraph = this.svgGroup.append('path')
    .attr('class', 'line');

  // add the stop groups to the pattern
  this.stopSvgGroups = this.svgGroup.selectAll('.stop').data(this.getStopData()).enter().append('g');

  var drag = d3.behavior.drag()
    .on('dragstart', _.bind(function(d) {
      d3.event.sourceEvent.stopPropagation(); // silence other listeners
    }, this))
    .on('drag', _.bind(function(d,i) {
      if (!d.stop.graphVertex) {
        return;
      }

      d.stop.graphVertex.x = display.xScale.invert(d3.event.sourceEvent.pageX - display.offsetLeft);
      d.stop.graphVertex.y = display.yScale.invert(d3.event.sourceEvent.pageY - display.offsetTop);
      display.refreshAll();
    }, this));

  this.stopSvgGroups.append('circle')
    .attr('class', 'stop-circle')
    // set up the mouse hover interactivity:
    .on('mouseenter', function(d) {
      d3.select('#stop-label-' + d.stop.getId()).style('visibility', 'visible');
    })
    .on('mouseleave', function(d) {
      if(display.zoom.scale() < display.labelZoomThreshold) {
        d3.select('#stop-label-' + d.stop.getId()).style('visibility', 'hidden');
      }
    })
    .call(drag);

  this.stopSvgGroups.append('text')
    .attr('id', function(d) { return 'stop-label-' + d.stop.getId(); })
    .text(function(d) { return d.stop.stop_name; })
    .attr('class', 'stop-label');

  display.addElement(this);
};

Pattern.prototype.refresh = function(display) {

  // update the line and stop groups
  var stopData = this.getStopData();
  this.lineGraph.attr('d', this.line(stopData));

  this.stopSvgGroups.data(stopData);
  this.stopSvgGroups.attr('transform', _.bind(function(d, i) {
    var x = display.xScale(d.x);
    //console.log(d.y, d.offsetY, display.yScale);
    var y = display.yScale(d.y) + d.offsetY;
    return 'translate(' + x +', ' + y +')';
  }, this));

  // style this pattern
  style(this, display);
};

/**
 *  Returns an array of 'stop info' objects, each consisting of the stop x/y coordinates in
 *  the Display coordinate space, and a reference to the original Stop instance
 */

Pattern.prototype.getStopData = function() {

  var stopData = [], stopInfo;
  console.log(this.offset, this.lineWidth);
  _.each(this.graphEdges, function (edge, i) {

    // the 'from' vertex stop for this edge (first edge only)
    if (i === 0) {
      stopInfo = {
        x: edge.fromVertex.x,
        y: edge.fromVertex.y,
        stop: edge.fromVertex.stop,
        inEdge: null,
        outEdge: edge
      };
      stopInfo.offsetY = this.offset ? this.offset * this.lineWidth : 0;
      stopData.push(stopInfo);
    }

    // the internal stops for this edge
    _.each(edge.stopArray, function (stop, i) {
      var stopInfo = edge.pointAlongEdge((i + 1) / (edge.stopArray.length + 1));
      _.extend(stopInfo, {
        stop: stop,
        offsetY: this.offset ? this.offset * this.lineWidth : 0,
        inEdge: edge,
        outEdge: edge
      });
      stopData.push(stopInfo);
    }, this);

    // the 'to' vertex stop for this edge
    stopInfo = {
      x: edge.toVertex.x,
      y: edge.toVertex.y,
      stop: edge.toVertex.stop,
      inEdge: edge,
      outEdge: null
    };

    stopInfo.offsetY = this.offset ? this.offset * this.lineWidth : 0;
    stopData.push(stopInfo);
  }, this);

  console.log(stopData);

  return stopData;
};

/**
 *
 */

Pattern.prototype.getGraphVertices = function() {
  var vertices = [];
  _.each(this.graphEdges, function(edge, i) {
    if(i === 0) {
      vertices.push(edge.fromVertex);
    }
    vertices.push(edge.toVertex);
  }, this);
  return vertices;
};
