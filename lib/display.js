
/**
 * Dependencies
 */

var d3 = require('d3');

/**
 * Expose `Display`
 */

module.exports = Display;

/**
 *  The D3-based SVG display.
 */

function Display(el, zoom) {
  // set up the pan/zoom behavior
  this.zoom = zoom || d3.behavior.zoom()
    .scaleExtent([ 0.25, 4 ]);

  // set up the svg display
  this.svg = d3.select(el)
    .append('svg')
    .append('g');

  this.grid = this.svg.append('g')
    .attr('class', 'doNotEmpty');

  // call the zoom behavior
  this.svg.call(this.zoom);

  // append an overlay to capture pan/zoom events on entire viewport
  this.svg.append('rect')
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .attr('class', 'doNotEmpty');
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

  this.svg.select('rect')
    .attr('width', width)
    .attr('height', height);
};


/**
 * draw the underlying grid used for snapping
 */

Display.prototype.drawGrid = function(cellSize) {

  d3.selectAll('.gridline').remove();

  var xRange = this.xScale.range(), yRange = this.yScale.range();
  //console.log(yRange);

  var xDomain = this.xScale.domain(), yDomain = this.yScale.domain();

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
      dx  = points[i][0] - points[i-1][0];
      dy  = points[i][1] - points[i-1][1];
      var sweep = (this.renderData[i].arc > 0) ? 0 : 1;
      str += 'A ' + Math.abs(dx) + ',' + Math.abs(dy) + ' 0 0 ' + sweep + ' ' + points[i];
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
  var minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE;
  var minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;

  graph.vertices.forEach(function(vertex) {
    minX = Math.min(minX, vertex.x);
    maxX = Math.max(maxX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxY = Math.max(maxY, vertex.y);
  });

  var xRange = maxX - minX, yRange = maxY - minY;
  var displayAspect = width / height;
  var graphAspect = xRange / (yRange === 0 ? Number.MIN_VALUE : yRange);

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


