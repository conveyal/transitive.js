
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
    this.points = [];
    this.containsFromPlace = this.containsToPlace = false;
    if(pointArray) {
      pointArray.forEach(function(point) {
        this.addPoint(point);
      }, this);
    }
    this.renderData = [];
    this.id = 'multi';
  };

  /**
   * Get id
   */

  this.getId = function() {
    return this.id;
  };

  /**
   * Get type
   */

  this.getType = function() {
    return 'MULTI';
  };

  this.addPoint = function(point) {
    if(this.points.indexOf(point) !== -1) return;
    this.points.push(point);
    this.id += '-' + point.getId();
    if(point.getType() === 'PLACE' && point.getId() === 'from') this.containsFromPlace = true;
    if(point.getType() === 'PLACE' && point.getId() === 'to') this.containsToPlace = true;
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