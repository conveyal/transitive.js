var d3 = require('d3');
var each = require('each');
var geoTile = require('./d3.geo.tile');

/**
 * Expose `Display`
 */

module.exports = Display;

/**
 *  The D3-based SVG display.
 */

function Display(el) {
  // Set up the projection
  var projection = this.projection = d3.geo.mercator();

  // Set up the map tiles
  var tile = this.tile = geoTile();

  // Set up the pan/zoom behavior
  var zoom = this.zoom = d3.behavior.zoom();

  // set up the svg display
  var svg = this.svg = d3.select(el)
    .append('svg')
    .attr('class', 'transitive');

  // call the zoom behavior
  this.svg.call(zoom);

  // On zoom
  zoom.on('zoom', zoomed);

  // Zoomed
  function zoomed() {
    tile
      .scale(zoom.scale())
      .translate(zoom.translate());

    projection
      .scale(zoom.scale() / 2 / Math.PI)
      .translate(zoom.translate());

    var tiles = tile();
  }
}

/**
 * Empty the display
 */

Display.prototype.empty = function() {
  this.svg.selectAll('*').remove();
};

/**
 * Set the scale
 */

Display.prototype.setScale = function(height, width, bounds) {
  setScales(this, height, width, bounds);

  this.xScale.range([0, width]);
  this.yScale.range([height, 0]);

  this.zoom
    .x(this.xScale)
    .y(this.yScale);

  this.svg
    .attr('width', width)
    .attr('height', height);
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
