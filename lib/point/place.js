
/**
 * Dependencies
 */

var augment = require('augment');
var d3 = require('d3');

var Point = require('./index');
var Util = require('../util');


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

    if(data && data.place_lat && data.place_lon) {
      var xy = Util.latLonToSphericalMercator(data.place_lat, data.place_lon);
      this.worldX = xy[0];
      this.worldY = xy[1];
    }

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

  
  this.getRenderDataArray = function() {
    return this.renderData;
  };


  this.clearRenderData = function() {
    this.renderData = [];
  };


  /**
   * Draw a place
   *
   * @param {Display} display
   */

  this.render = function(display) {
    base.render.call(this, display);
    if (!this.renderData) return;

    this.initSvg(display);
    this.svgGroup
      .attr('class', 'transitive-sortable')
      .datum({
        owner: this,
        sortableType: 'POINT_PLACE'
      });

    // set up the markers
    this.marker = this.markerSvg.append('circle')
      .datum({ owner: this })
      .attr('class', 'transitive-place-circle');

    var iconUrl = display.styler.compute(display.styler.places_icon['xlink:href'], display, { owner : this });
    if(iconUrl) {
      this.icon = this.markerSvg.append('image')
        .datum({ owner: this })
        .attr('class', 'transitive-place-icon')
        .attr('xlink:href', iconUrl);
    }
  };


  /**
   * Refresh the place
   *
   * @param {Display} display
   */

  this.refresh = function(display) {
    if (!this.renderData) return;

    // refresh the marker/icon
    var data = this.renderData[0];
    var x = data.x; //display.xScale(data.x) + data.offsetX;
    var y = data.y; //display.yScale(data.y) - data.offsetY;
    var translate = 'translate(' + x +', ' + y +')';
    this.marker.attr('transform', translate);
    if(this.icon) this.icon.attr('transform', translate);

  };
});


/**
 * Expose `Place`
 */

module.exports = Place;

