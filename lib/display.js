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
  var tiles = this.tiles = geoTile();

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
    projection
      .scale(zoom.scale() / 2 / Math.PI)
      .translate(zoom.translate());
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

Display.prototype.setScale = function(height, width, graph) {
  setScales(this, height, width, graph);

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

  var xRange = maxX - minX,
    yRange = maxY - minY;
  var displayAspect = width / height;
  var graphAspect = xRange / (yRange === 0 ? -Infinity : yRange);

  var paddingFactor = 0.5,
    padding;
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
    .domain([dispX1, dispX2]);

  display.yScale = d3.scale.linear()
    .domain([dispY1, dispY2]);
}
