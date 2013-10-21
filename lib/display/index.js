
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
  this.width = el.clientWidth;
  this.height = el.clientHeight;
  this.offsetLeft = el.offsetLeft;
  this.offsetTop = el.offsetTop;

  this.xScale = d3.scale.linear()
    .domain([ -2, 2 ]) // [0, this.width])
    .range([0, this.width]);

  this.yScale = d3.scale.linear()
    .domain([ -2, 2 ]) //[0, this.height])
    .range([this.height, 0]);

  // set up the pan/zoom behavior
  this.zoom  = d3.behavior.zoom()
    .x(this.xScale)
    .y(this.yScale)
    .scaleExtent([ 0.25, 4 ]);

  this.labelZoomThreshold = 0.75;

  // set up the svg display
  this.svg = d3.select('#canvas')
    .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
    .append('g')
      .call(this.zoom);

  // append an overlay to capture pan/zoom events on entire viewport
  this.svg.append('rect')
    .attr('class', 'overlay')
    .attr('width', this.width)
    .attr('height', this.height);
}
