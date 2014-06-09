var d3 = require('d3');
var debug = require('debug')('transitive:display');

/**
 * Expose `Display`
 */

module.exports = Display;

/**
 * The D3-based SVG display.
 *
 * @param {Object} options
 */

function Display(opts) {
  var el = opts.el;
  var width = el.clientWidth;
  var height = el.clientHeight;

  // Set up the pan/zoom behavior
  var zoom = this.zoom = d3.behavior.zoom()
    .scaleExtent([ 0.25, 4 ]);

  // set up the svg display
  var div = d3.select(el)
    .attr('class', 'Transitive')
    .call(zoom);

  this.svg = div
    .append('svg')
    .attr('class', 'schematic-map');
}

/**
 * Empty the display
 */

Display.prototype.empty = function() {
  debug('emptying svg');
  this.svg.selectAll('*').remove();
};

/**
 * Set the scale
 */

Display.prototype.setScale = function(height, width, bounds) {
  setScales(this, height, width, bounds);

  this.xScale.range([0, width]);
  this.yScale.range([height, 0]);

  debug('x scale %j -> %j', this.xScale.domain(), this.xScale.range());
  debug('y scale %j -> %j', this.yScale.domain(), this.yScale.range());

  this.zoom
    .x(this.xScale)
    .y(this.yScale);
};

/**
 * Initialize the x/y coordinate space domain to fit the graph.
 */

function setScales(display, height, width, bounds) {
  var xRange = bounds.x.max - bounds.x.min;
  var yRange = bounds.y.max - bounds.y.min;

  var displayAspect = width / height;
  var graphAspect = xRange / (yRange === 0 ? -Infinity : yRange);

  var paddingFactor = 0.5,
    padding;
  var dispX1, dispX2, dispY1, dispY2;

  if (displayAspect > graphAspect) { // y-axis is dominant
    padding = paddingFactor * yRange;
    dispY1 = bounds.y.min - padding;
    dispY2 = bounds.y.max + padding;
    var dispXRange = (yRange + 2 * padding) * displayAspect;
    var xMidpoint = (bounds.x.max + bounds.x.min) / 2;
    dispX1 = xMidpoint - dispXRange / 2;
    dispX2 = xMidpoint + dispXRange / 2;
  } else { // x-axis dominant
    padding = paddingFactor * xRange;
    dispX1 = bounds.x.min - padding;
    dispX2 = bounds.x.max + padding;
    var dispYRange = (xRange + 2 * padding) / displayAspect;
    var yMidpoint = (bounds.y.max + bounds.y.min) / 2;
    dispY1 = yMidpoint - dispYRange / 2;
    dispY2 = yMidpoint + dispYRange / 2;
  }

  // set up the scales
  display.xScale = d3.scale.linear()
    .domain([dispX1, dispX2]);

  display.yScale = d3.scale.linear()
    .domain([dispY1, dispY2]);
}
