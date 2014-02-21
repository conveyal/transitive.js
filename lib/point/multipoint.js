
/**
 * Dependencies
 */

var augment = require('augment');

var Point = require('./index');

/**
 *  MultiPoint: a Point subclass representing a collection of multiple points
 *  that have been merged into one for display purposes.
 */

var MultiPoint = augment(Point, function(base) {

  this.constructor = function(pointArray) {
    base.constructor.call(this);
    this.points = pointArray;

    this.renderData = [];
  };

  /**
   * Get id
   */

  this.getId = function() {
    return 'multi';
  };

  /**
   * Get type
   */

  this.getType = function() {
    return 'MULTI';
  };

  /**
   * Add render data
   *
   * @param {Object} stopInfo
   */

  this.addRenderData = function(pointInfo) {
    this.renderData = [ pointInfo ];
  };

  /**
   * Draw a multipoint
   *
   * @param {Display} display
   */

  this.draw = function(display) {

    if (!this.renderData) return;

    // set up the main svg group for this stop
    this.svgGroup = display.svg.append('g');
      //.attr('id', 'transitive-multipoint-' + this.place_id);

    // set up the markers
    this.marker = this.svgGroup.selectAll('circle')
      .data(this.renderData)
      .enter()
      .append('circle')
      .attr('class', 'transitive-multipoint-circle');

  };

  /**
   * Refresh the point
   *
   * @param {Display} display
   */

  this.refresh = function(display) {
    if (!this.renderData) return;

    var cx, cy;
    // refresh the pattern-level markers
    this.marker.data(this.renderData);
    this.marker.attr('transform', function (d, i) {
      cx = d.x;
      cy = d.y;
      var x = display.xScale(d.x) + d.offsetX;
      var y = display.yScale(d.y) - d.offsetY;
      return 'translate(' + x +', ' + y +')';
    });
  };

});

/**
 * Expose `MultiPoint`
 */

module.exports = MultiPoint;