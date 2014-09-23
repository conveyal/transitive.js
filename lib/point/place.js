/**
 * Dependencies
 */

var augment = require('augment');
var d3 = require('d3');

var Point = require('./index');
var Util = require('../util');

var SphericalMercator = require('../spherical-mercator');
var sm = new SphericalMercator();


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

    if (data && data.place_lat && data.place_lon) {
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
    this.renderData.push(pointInfo);
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
      .datum({
        owner: this
      })
      .attr('class', 'transitive-place-circle');

    var iconUrl = display.styler.compute(display.styler.places_icon[
      'xlink:href'], display, {
      owner: this
    });
    if (iconUrl) {
      this.icon = this.markerSvg.append('image')
        .datum({
          owner: this
        })
        .attr('class', 'transitive-place-icon')
        .attr('xlink:href', iconUrl);
    }

    if(this.draggable) this.makeDraggable(display);
  };

  /**
   * Refresh the place
   *
   * @param {Display} display
   */

  this.refresh = function(display) {
    if (!this.renderData) return;

    // refresh the marker/icon
    var x = display.xScale(this.worldX);
    var y = display.yScale(this.worldY);
    var translate = 'translate(' + x + ', ' + y + ')';
    this.marker.attr('transform', translate);
    if (this.icon) this.icon.attr('transform', translate);

  };

  this.makeDraggable = function(display) {
    var place = this;
    var drag = d3.behavior.drag()
      .on('dragstart', function() {
        d3.event.sourceEvent.stopPropagation(); // silence other listeners
      })
      .on('drag', function() {
        if (place.graphVertex) {
          var x = display.xScale.invert(d3.event.sourceEvent.pageX -
            display.el.offsetLeft);
          var y = display.yScale.invert(d3.event.sourceEvent.pageY -
            display.el.offsetTop);

          place.worldX = x;
          place.worldY = y;
          var ll = sm.inverse([x, y]);
          place.place_lon = ll[0];
          place.place_lat = ll[1];

          place.refresh(display);
        }
      })
      .on('dragend', function() {
        if(place.dragendCallback) place.dragendCallback.call(this, place);
      });
    this.markerSvg.call(drag);
  };

});

/**
 * Expose `Place`
 */

module.exports = Place;
