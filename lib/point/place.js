
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
   * Get Name
   */

  this.getName = function() {
    return this.place_name;
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


  this.containsSegmentEndPoint = function() {
    return true;
  };


  this.containsFromPoint = function() {
    return (this.getId() === 'from');
  };


  this.containsToPoint = function() {
    return (this.getId() === 'to');
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

    this.initSvg(display);
    this.svgGroup
      .attr('class', 'transitive-sortable')
      .datum({
        owner: this,
        sortableType: 'POINT_PLACE'
      });

    // set up the markers
    this.marker = this.markerSvg.selectAll('circle')
      .data(this.renderData)
      .enter()
      .append('circle')
      .attr('class', 'transitive-place-circle');

  };

  /**
   * Refresh the place
   *
   * @param {Display} display
   */

  this.refresh = function(display) {
    if (!this.renderData) return;

    // refresh the pattern-level markers
    this.marker.data(this.renderData);
    this.marker.attr('transform', (function (d, i) {
      var x = display.xScale(d.x) + d.offsetX;
      var y = display.yScale(d.y) - d.offsetY;
      return 'translate(' + x +', ' + y +')';
    }).bind(this));

  };
});


/**
 * Expose `Place`
 */

module.exports = Place;

