
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

function Display(el, graph) {
  this.offsetLeft = el.offsetLeft;
  this.offsetTop = el.offsetTop;
  this.labelZoomThreshold = 0.75;

  this.initScales(el, graph);

  // set up the pan/zoom behavior
  this.zoom  = d3.behavior.zoom()
    .scaleExtent([ 0.25, 4 ]);

  // set up the svg display
  this.svgGroup = this.svg = d3.select(el)
    .append('svg')
    .append('g');
  
  this.svgGroup.call(this.zoom);

  // append an overlay to capture pan/zoom events on entire viewport
  this.svg.append('rect')
    .attr('class', 'overlay');

  this.setElement(el);
}

/**
 * Set the element
 */

Display.prototype.setElement = function(el) {
  var width = el.clientWidth;
  var height = el.clientHeight;

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
 * Initialize the x/y coordinate space domain to fit the graph.
 */

Display.prototype.initScales = function(el, graph) {
  var minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE;
  var minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;

  graph.vertices.forEach(function(vertex) {
    minX = Math.min(minX, vertex.x);
    maxX = Math.max(maxX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxY = Math.max(maxY, vertex.y);
  });

  var xRange = maxX - minX, yRange = maxY - minY;
  var displayAspect = el.clientWidth / el.clientHeight;
  var graphAspect = xRange / (yRange === 0 ? Number.MIN_VALUE : yRange);
  
  var paddingFactor = 0.2, padding;
  var dispX1, dispX2, dispY1, dispY2;

  if(displayAspect > graphAspect) { // y-axis is dominant
    padding = paddingFactor * yRange;
    dispY1 = minY - padding;
    dispY2 = maxY + padding;
    var dispXRange = (yRange + 2 * padding) * displayAspect;
    var xMidpoint = (maxX + minX) / 2;
    dispX1 = xMidpoint - dispXRange / 2;
    dispX2 = xMidpoint + dispXRange / 2;
  }
  else { // x-axis dominant
    padding = paddingFactor * xRange;
    dispX1 = minX - padding;
    dispX2 = maxX + padding;
    var dispYRange = (xRange + 2 * padding) / displayAspect;
    var yMidpoint = (maxY + minY) / 2;
    dispY1 = yMidpoint - dispYRange / 2;
    dispY2 = yMidpoint + dispYRange / 2;
  }

  // set up the scales
  this.xScale = d3.scale.linear()
    .domain([ dispX1, dispX2]);

  this.yScale = d3.scale.linear()
    .domain([ dispY1, dispY2 ]);

};