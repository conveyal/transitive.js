
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
    if(pointArray) {
      pointArray.forEach(function(point) {
        this.addPoint(point);
      }, this);
    }
    this.mergedType = 'POLYGON';
    this.renderData = [];
    this.id = 'multi';
    this.toPoint = this.fromPoint = null;
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


  this.getName = function() {
    if(this.fromPoint) return this.fromPoint.getName();
    if(this.toPoint) return this.toPoint.getName();
    var shortest = null;
    this.points.forEach(function(point) {
      if(!shortest || point.getName().length < shortest.length) shortest = point.getName();
    });
    return shortest + ' AREA';
  };


  this.containsFromPoint = function() {
    return (this.fromPoint !== null);
  };


  this.containsToPoint = function() {
    return (this.toPoint !== null);
  };


  this.addPoint = function(point) {
    if(this.points.indexOf(point) !== -1) return;
    this.points.push(point);
    this.id += '-' + point.getId();
    if(point.containsFromPoint()) { // getType() === 'PLACE' && point.getId() === 'from') {
      this.fromPoint = point;
    }
    if(point.containsToPoint()) { // getType() === 'PLACE' && point.getId() === 'to') {
      this.toPoint = point;
    }
  };


  /**
   * Add render data
   *
   * @param {Object} stopInfo
   */

  this.addRenderData = function(pointInfo) {
    if(pointInfo.offsetX !== 0 || pointInfo.offsetY !==0) this.hasOffsetPoints = true;
    this.renderData.push(pointInfo);
  };


  this.clearRenderData = function() {
    this.hasOffsetPoints = false;
    this.renderData = [];
  };


  /**
   * Draw a multipoint
   *
   * @param {Display} display
   */

  this.draw = function(display) {

    if (!this.renderData) return;

    // set up the main svg group for this stop
    this.initSvg(display);

    this.initMergedMarker(display);

    // set up the pattern markers
    this.marker = this.markerSvg.selectAll('circle')
      .data(this.renderData)
      .enter()
      .append('circle')
      .attr('class', 'transitive-multipoint-marker-pattern');
  };


  this.initMergedMarker = function(display) {
    // set up the merged marker
    if(this.fromPoint || this.toPoint) {
      this.mergedMarker = this.markerSvg.append('g').append('circle')
        .datum({ point : this })
        .attr('class', 'transitive-multipoint-marker-merged');
    }
    else if(this.hasOffsetPoints || this.renderData.length > 1) {
      if(this.mergedType === 'CIRCLE') {
        this.mergedMarker = this.markerSvg.append('g').append('circle')
          .datum({ point : this })
          .attr('class', 'transitive-multipoint-marker-merged');
      }
      else if(this.mergedType === 'POLYGON') {
        this.mergedMarker = this.markerSvg.append('g').append('path')
          .datum({ point : this })
          .attr('class', 'transitive-multipoint-marker-merged');
      }
    }
  };


  /**
   * Refresh the point
   *
   * @param {Display} display
   */

  this.refresh = function(display) {
    if (!this.renderData) return;

    var data;
    // refresh the merged marker
    if(this.mergedMarker) {
      if(this.fromPoint || this.toPoint) {
        data = this.renderData[0];
        this.mergedMarker
          .attr({
          'cx' : display.xScale(data.x) + data.offsetX,
          'cy' : display.yScale(data.y) - data.offsetY
        });
      }
      else {
        if(this.mergedType === 'CIRCLE') {
          this.mergedMarker
            .datum({ point : this })
            .attr(this.constructMergedCircle(display, 'multipoints_pattern'));
        }
        else if(this.mergedType === 'POLYGON') {
          this.mergedMarker
            .datum({ point : this })
            .attr(this.constructMergedPolygon(display, 'multipoints_pattern'));
        }
      }
    }

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

  this.getRenderDataArray = function() {
    return this.renderData;
  };
});

/**
 * Expose `MultiPoint`
 */

module.exports = MultiPoint;