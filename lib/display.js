var d3 = require('d3');
var debug = require('debug')('transitive:display');

var SphericalMercator = require('./spherical-mercator');

var sm = new SphericalMercator();

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
    .scaleExtent([0.25, 4]);

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

  this.haloLayer = this.svg.insert('g', ':first-child');
};

/**
 * Set the scale
 */

Display.prototype.setScale = function(height, width, bounds, options) {
  setScales(this, height, width, bounds, options);

  this.xScale.range([0, width]);
  this.yScale.range([height, 0]);

  debug('x scale %j -> %j', this.xScale.domain(), this.xScale.range());
  debug('y scale %j -> %j', this.yScale.domain(), this.yScale.range());

  this.zoom
    .x(this.xScale)
    .y(this.yScale);
};

/**
 * Lat/lon bounds
 */

Display.prototype.llBounds = function() {
  var x = this.xScale.domain();
  var y = this.yScale.domain();
  return [
    sm.inverse([x[0], y[1]]),
    sm.inverse([x[1], y[0]])
  ];
};

Display.prototype.isInRange = function(x, y) {
  var xRange = this.xScale.range();
  var yRange = this.yScale.range();

  return x >= xRange[0] && x <= xRange[1] && y >= yRange[1] && y <= yRange[0];
};

/**
 * Initialize the x/y coordinate space domain to fit the graph.
 */

function setScales(display, height, width, bounds, options) {
  var xRange = bounds.x.max - bounds.x.min;
  var yRange = bounds.y.max - bounds.y.min;

  var paddingFactor = (options && options.paddingFactor) ?
    options.paddingFactor : 0.1;

  var margins = getMargins(options);
  margins.right = 400;

  var usableHeight = height - margins.top - margins.bottom;
  var usableWidth = width - margins.left - margins.right;
  var displayAspect = width / height;
  var usableDisplayAspect = usableWidth / usableHeight;
  var graphAspect = xRange / (yRange === 0 ? -Infinity : yRange);

  var padding;
  var dispX1, dispX2, dispY1, dispY2;
  var dispXRange, dispYRange;

  if (usableDisplayAspect > graphAspect) { // y-axis is limiting
    padding = paddingFactor * yRange;
    dispY1 = bounds.y.min - padding;
    dispY2 = bounds.y.max + padding;
    dispYRange = yRange + 2 * padding;
    var addedYRange = (height / usableHeight * dispYRange) - dispYRange;
    if (margins.top > 0 || margins.bottom > 0) {
      dispY1 -= margins.bottom / (margins.bottom + margins.top) * addedYRange;
      dispY2 += margins.top / (margins.bottom + margins.top) * addedYRange;
    }
    dispXRange = (dispY2 - dispY1) * displayAspect;
    var xOffset = (margins.left - margins.right) / width;
    var xMidpoint = (bounds.x.max + bounds.x.min - dispXRange * xOffset) / 2;
    dispX1 = xMidpoint - dispXRange / 2;
    dispX2 = xMidpoint + dispXRange / 2;
  } else { // x-axis limiting
    padding = paddingFactor * xRange;
    dispX1 = bounds.x.min - padding;
    dispX2 = bounds.x.max + padding;
    dispXRange = xRange + 2 * padding;
    var addedXRange = (width / usableWidth * dispXRange) - dispXRange;
    if (margins.left > 0 || margins.right > 0) {
      dispX1 -= margins.left / (margins.left + margins.right) * addedXRange;
      dispX2 += margins.right / (margins.left + margins.right) * addedXRange;
    }

    dispYRange = (dispX2 - dispX1) / displayAspect;
    var yOffset = (margins.bottom - margins.top) / height;
    var yMidpoint = (bounds.y.max + bounds.y.min - dispYRange * yOffset) / 2;
    dispY1 = yMidpoint - dispYRange / 2;
    dispY2 = yMidpoint + dispYRange / 2;
  }

  // set up the scales
  display.xScale = d3.scale.linear()
    .domain([dispX1, dispX2]);

  display.yScale = d3.scale.linear()
    .domain([dispY1, dispY2]);
}

function getMargins(options) {
  var margins = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  };

  if (options && options.displayMargins) {
    if (options.displayMargins.top) margins.top = options.displayMargins.top;
    if (options.displayMargins.bottom) margins.bottom = options.displayMargins.bottom;
    if (options.displayMargins.left) margins.left = options.displayMargins.left;
    if (options.displayMargins.right) margins.right = options.displayMargins.right;
  }

  return margins;
}
