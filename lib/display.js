var d3 = require('d3');
var each = require('each');

/**
 * Expose `Display`
 */

module.exports = Display;

/**
 *  The D3-based SVG display.
 */

function Display(el) {
  // set up the pan/zoom behavior
  this.zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([ 0, 19 ]);

  // set up the svg display
  this.svg = d3.select(el)
    .append('svg');

  this.grid = this.svg.append('g')
    .attr('class', 'doNotEmpty');

  // call the zoom behavior
  this.svg.call(this.zoom);
}

/**
 * Empty the display
 */

Display.prototype.empty = function() {
  this.svg.selectAll(':not(.doNotEmpty)').remove();
};

/**
 * Set the scale
 */

Display.prototype.setScale = function(height, width, graph) {
  setScales(this, height, width, graph);

  this.xScale.range([ 0, width ]);
  this.yScale.range([ height, 0 ]);

  this.zoom
    .x(this.xScale)
    .y(this.yScale);

  this.svg
    .attr('width', width)
    .attr('height', height);
};

/**
 * Draw the underlying grid used for snapping
 */

Display.prototype.drawGrid = function(cellSize) {
  d3.selectAll('.gridline').remove();

  var xRange = this.xScale.range();
  var yRange = this.yScale.range();
  var xDomain = this.xScale.domain();
  var yDomain = this.yScale.domain();

  var xMin = Math.round(xDomain[0] / cellSize) * cellSize;
  var xMax = Math.round(xDomain[1] / cellSize) * cellSize;

  for(var x = xMin; x <= xMax; x += cellSize) {
    this.grid.append('line')
      .attr({
        'class': 'gridline',
        'x1' : this.xScale(x),
        'x2' : this.xScale(x),
        'y1' : yRange[0],
        'y2' : yRange[1],
        'fill' : 'none',
        'stroke' : '#ccc',
        'stroke-width' : '1px'
      });
  }

  var yMin = Math.round(yDomain[0] / cellSize) * cellSize;
  var yMax = Math.round(yDomain[1] / cellSize) * cellSize;
  for(var y = yMin; y <= yMax; y += cellSize) {
    this.grid.append('line')
      .attr({
        'class': 'gridline',
        'x1' : xRange[0],
        'x2' : xRange[1],
        'y1' : this.yScale(y),
        'y2' : this.yScale(y),
        'fill' : 'none',
        'stroke' : '#ccc',
        'stroke-width' : '1px'
      });
  }

};



Display.prototype.lineInterpolator = function(points) {
  var dx, dy;

  if(points.length === 2) { // a simple straight line

    if(this.getType() === 'WALK') { // resample walk segments for marker placement

      var newPoints = [ points[0] ];
      dx  = points[1][0] - points[0][0];
      dy  = points[1][1] - points[0][1];
      var len = Math.sqrt(dx * dx + dy * dy);
      var spacing = 10;

      for(var l = spacing; l < len; l += spacing) {
        var t = l / len;
        newPoints.push([points[0][0] + t * dx, points[0][1] + t * dy]);
      }

      newPoints.push(points[1]);
      return newPoints.join(' ');
    }

    return points.join(' ');
  }

  var str = points[0];
  for(var i = 1; i < points.length; i++) {
    if(this.renderData[i].arc) {
      var r = this.renderData[i].radius;
      var sweep = (this.renderData[i].arc > 0) ? 0 : 1;
      str += 'A ' + r + ',' + r + ' 0 0 ' + sweep + ' ' + points[i];
    }
    else {
      str += 'L' + points[i];
    }
  }
  return str;
};



/**
 * Initialize the x/y coordinate space domain to fit the graph.
 */

function setScales(display, height, width, graph) {
  var minX = Infinity;
  var minY = Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;

  each(graph.vertices, function(vertex) {
    minX = Math.min(minX, vertex.x);
    maxX = Math.max(maxX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxY = Math.max(maxY, vertex.y);
  });

  var xRange = maxX - minX, yRange = maxY - minY;
  var displayAspect = width / height;
  var graphAspect = xRange / (yRange === 0 ? -Infinity : yRange);

  var paddingFactor = 0.5, padding;
  var dispX1, dispX2, dispY1, dispY2;

  if (displayAspect > graphAspect) { // y-axis is dominant
    padding = paddingFactor * yRange;
    dispY1 = minY - padding;
    dispY2 = maxY + padding;
    var dispXRange = (yRange + 2 * padding) * displayAspect;
    var xMidpoint = (maxX + minX) / 2;
    dispX1 = xMidpoint - dispXRange / 2;
    dispX2 = xMidpoint + dispXRange / 2;
  } else { // x-axis dominant
    padding = paddingFactor * xRange;
    dispX1 = minX - padding;
    dispX2 = maxX + padding;
    var dispYRange = (xRange + 2 * padding) / displayAspect;
    var yMidpoint = (maxY + minY) / 2;
    dispY1 = yMidpoint - dispYRange / 2;
    dispY2 = yMidpoint + dispYRange / 2;
  }

  // set up the scales
  display.xScale = d3.scale.linear()
    .domain([ dispX1, dispX2 ]);

  display.yScale = d3.scale.linear()
    .domain([ dispY1, dispY2 ]);
}
