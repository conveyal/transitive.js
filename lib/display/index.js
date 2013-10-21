
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

function Display(el) {
  this.labelZoomThreshold = 0.75;

  // set up the scales
  this.xScale = d3.scale.linear()
    .domain([ -2, 2 ]); // [0, this.width])

  this.yScale = d3.scale.linear()
    .domain([ -2, 2 ]); //[0, this.height])

  // set up the pan/zoom behavior
  this.zoom  = d3.behavior.zoom()
    .scaleExtent([ 0.25, 4 ]);

  // set up the svg display
  this.svg = d3.select(el)
    .append('svg')
    .append('g')
      .call(this.zoom);

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
