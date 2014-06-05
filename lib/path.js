var d3 = require('d3');

var interpolateLine = require('./interpolate-line');

/**
 * Expose `NetworkPath`
 */

module.exports = NetworkPath;

/**
 * NetworkPath -- a path through the network graph. Composed of PathSegments (which
 * are in turn composed of a sequence of graph edges)
 *
 * @param {Object} the parent onject (a RoutePattern or Journey)
 */

function NetworkPath(parent) {
  this.parent = parent;
  this.segments = [];
}


NetworkPath.prototype.clearGraphData = function(segment) {
  this.graphEdges = [];
  this.segments.forEach(function(segment) {
    segment.clearGraphData();
  });
};


/**
 * addSegment: add a new segment to the end of this NetworkPath
 */

NetworkPath.prototype.addSegment = function(segment) {
  this.segments.push(segment);
  segment.points.forEach(function(point) {
    point.paths.push(this);
  }, this);
};


/** highlight **/

NetworkPath.prototype.drawHighlight = function(display, capExtension) {

  this.line = d3.svg.line() // the line translation function
    .x(function (pointInfo, i) {
      return display.xScale(pointInfo.x) + (pointInfo.offsetX || 0);
    })
    .y(function (pointInfo, i) {
      return display.yScale(pointInfo.y) - (pointInfo.offsetY || 0);
    })
    .interpolate(interpolateLine.bind(this));

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
  var renderSegments = this.getRenderSegments();
  for(var i = 0; i < renderSegments.length; i++) {
    var segment = renderSegments[i];
    segment.refreshRenderData(display);
    this.renderData = this.renderData.concat(segment.renderData);
  }
  this.lineGraph.attr('d', this.line(this.renderData));
};


NetworkPath.prototype.getRenderSegments = function() {
  var renderSegments = [];
  this.segments.forEach(function(pathSegment) {
    renderSegments = renderSegments.concat(pathSegment.renderSegments);
  });
  return renderSegments;
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
