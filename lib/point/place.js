
/**
 * Dependencies
 */

var augment = require('augment');
var d3 = require('d3');

var Point = require('./index');

/**
 *  Place: a Point subclass representing a 'place' that can be rendered on the
 *  map. A place is a point *other* than a transit stop/station, e.g. a home/work
 *  location, a point of interest, etc.
 */

var Place = augment(Point, function(base) {

  /**
   *  the constructor
   */

  this.constructor = function(data) {
    base.constructor.call(this, data);
  };


  /**
   * Get Type
   */

  this.getType = function() {
    return 'PLACE';
  };


  /**
   * Get ID
   */

  this.getId = function() {
    return this.place_id;
  };


  /**
   * Get lat
   */

  this.getLat = function() {
    return this.place_lat;
  };


  /**
   * Get lon
   */

  this.getLon = function() {
    return this.place_lon;
  };

  this.addRenderData = function(pointInfo) {
    this.renderData = [ pointInfo ];
  };


  /**
   * Draw a place
   *
   * @param {Display} display
   */

  this.draw = function(display) {
    if (!this.renderData) return;

    // set up the main svg group for this stop
    this.svgGroup = display.svg.append('g')
      .attr('id', 'transitive-place-' + this.place_id);

    // set up the markers
    this.marker = this.svgGroup.selectAll('circle')
      .data(this.renderData)
      .enter()
      .append('circle')
      .attr('class', 'transitive-place-circle');


    // create the label
    /*this.mainLabel = this.svgGroup.append('text')
      .data(this.renderData)
      .attr('id', 'transitive-place-label-' + this.place_id)
      .text(this.place_name)
      .attr('class', 'transitive-place-label')
      //.attr('text-anchor', textAnchor)
      .attr('transform', (function (d, i) {
        return 'rotate(' + this.labelAngle + ', 0, 0)';
      }).bind(this));*/
    this.initLabels();

  };

  /**
   * Refresh the place
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


    this.refreshLabels(display, cx, cy);

  };
});


/**
 * Expose `Place`
 */

module.exports = Place;

