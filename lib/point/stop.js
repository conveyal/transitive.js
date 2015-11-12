/**
 * Dependencies
 */

var augment = require('augment');
var each = require('component-each');

var Point = require('./index');
var Util = require('../util');

var debug = require('debug')('transitive:stop');

/**
 *  Place: a Point subclass representing a 'place' that can be rendered on the
 *  map. A place is a point *other* than a transit stop/station, e.g. a home/work
 *  location, a point of interest, etc.
 */

var Stop = augment(Point, function(base) {

  this.constructor = function(data) {
    base.constructor.call(this, data);

    if (data && data.stop_lat && data.stop_lon) {
      var xy = Util.latLonToSphericalMercator(data.stop_lat, data.stop_lon);
      this.worldX = xy[0];
      this.worldY = xy[1];
    }

    this.patterns = [];

    this.patternRenderData = {};
    this.patternFocused = {};
    this.patternCount = 0;

    this.patternStylerKey = 'stops_pattern';

    this.isSegmentEndPoint = false;
  };

  /**
   * Get id
   */

  this.getId = function() {
    return this.stop_id;
  };

  /**
   * Get type
   */

  this.getType = function() {
    return 'STOP';
  };

  /**
   * Get name
   */

  this.getName = function() {
    if (!this.stop_name) return ('Unnamed Stop (ID=' + this.getId() + ')');
    return this.stop_name;
  };

  /**
   * Get lat
   */

  this.getLat = function() {
    return this.stop_lat;
  };

  /**
   * Get lon
   */

  this.getLon = function() {
    return this.stop_lon;
  };

  this.containsSegmentEndPoint = function() {
    return this.isSegmentEndPoint;
  };

  this.containsBoardPoint = function() {
    return this.isBoardPoint;
  };

  this.containsAlightPoint = function() {
    return this.isAlightPoint;
  };

  this.containsTransferPoint = function() {
    return this.isTransferPoint;
  };

  this.getPatterns = function() {
    return this.patterns;
  };

  this.addPattern = function(pattern) {
    if (this.patterns.indexOf(pattern) === -1) this.patterns.push(pattern);
  };

  /**
   * Add render data
   *
   * @param {Object} stopInfo
   */

  this.addRenderData = function(stopInfo) {
    if (stopInfo.rEdge.getType() === 'TRANSIT') {

      var s = {
        sortableType: 'POINT_STOP_PATTERN',
        owner: this,
        getZIndex: function() {
          if (this.owner.graphVertex) {
            return this.owner.getZIndex();
          }
          return this.rEdge.getZIndex() + 1;
        }
      };

      for (var key in stopInfo)
        s[key] = stopInfo[key];

      var patternId = stopInfo.rEdge.patternIds;
      this.patternRenderData[patternId] = s; //.push(s);

      each(stopInfo.rEdge.patterns, function(pattern) {
        this.addPattern(pattern);
      }, this);
    }
    this.patternCount = Object.keys(this.patternRenderData).length;
  };

  this.isPatternFocused = function(patternId) {
    if (!(patternId in this.patternFocused)) return true;
    return (this.patternFocused[patternId]);
  };

  this.setPatternFocused = function(patternId, focused) {
    this.patternFocused[patternId] = focused;
  };

  this.setAllPatternsFocused = function(focused) {
    for (var key in this.patternRenderData) {
      this.patternFocused[key] = focused;
    }
  };

  /**
   * Draw a stop
   *
   * @param {Display} display
   */

  this.render = function(display) {
    base.render.call(this, display);
    if (Object.keys(this.patternRenderData).length === 0) return;

    var renderDataArray = this.getRenderDataArray();

    this.initSvg(display);

    // set up the merged marker
    this.mergedMarker = this.markerSvg.append('g').append('rect')
      .attr('class', 'transitive-sortable transitive-stop-marker-merged')
      .datum(this.getMergedRenderData());

    // set up the pattern-specific markers
    this.patternMarkers = this.markerSvg.append('g').selectAll('circle')
      .data(renderDataArray)
      .enter()
      .append('circle')
      .attr('class', 'transitive-sortable transitive-stop-marker-pattern');
  };

  /**
   * Refresh the stop
   *
   * @param {Display} display
   */

  this.refresh = function(display) {

    if (this.patternCount === 0) return;

    if (!this.mergedMarkerData) this.initMarkerData(display);

    // refresh the pattern-level markers
    this.patternMarkers.data(this.getRenderDataArray());

    this.patternMarkers.attr('transform', (function(d, i) {
      if (!isNaN(d.x) && !isNaN(d.y)) {
        var x = d.x + this.placeOffsets.x;
        var y = d.y + this.placeOffsets.y;
        return 'translate(' + x + ', ' + y + ')';
      }
    }).bind(this));

    // refresh the merged marker
    if (this.mergedMarker) {
      var a = this.constructMergedMarker(display, 'stops_pattern');
      this.mergedMarker.datum(this.getMergedRenderData());
      if (!isNaN(this.mergedMarkerData.x) && !isNaN(this.mergedMarkerData.y))
        this.mergedMarker.attr(this.mergedMarkerData);
    }

  };

  this.getMergedRenderData = function() {
    return {
      owner: this,
      sortableType: 'POINT_STOP_MERGED'
    };
  };

  this.getRenderDataArray = function() {
    var dataArray = [];
    for (var patternId in this.patternRenderData) {
      dataArray.push(this.patternRenderData[patternId]);
    }
    return dataArray;
  };

  this.getMarkerBBox = function() {
    if (this.mergedMarker) return this.mergedMarkerData;
  };

  this.isFocused = function() {
    if (this.mergedMarker || !this.patternRenderData) {
      return (this.focused === true);
    }

    var focused = true;
    for (var patternId in this.patternRenderData) {
      focused = this && this.isPatternFocused(patternId);
    }
    return focused;
  };

  this.runFocusTransition = function(display, callback) {
    if (this.mergedMarker) {
      var newStrokeColor = display.styler.compute(display.styler.stops_merged
        .stroke, display, {
          owner: this
        });
      this.mergedMarker.transition().style('stroke', newStrokeColor).call(
        callback);
    }
    if (this.label) this.label.runFocusTransition(display, callback);
  };

  this.clearRenderData = function() {
    this.patternRenderData = {};
    this.mergedMarkerData = null;
    this.placeOffsets = {
      x: 0,
      y: 0
    };
  };

});

/**
 * Expose `Stop`
 */

module.exports = Stop;
