
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
    this.mergedType = 'POLYGON';
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


  this.getName = function() {
    if(this.containsFromPlace) return this.fromPlace.getName();
    if(this.containsToPlace) return this.toPlace.getName();
    var shortest = null;
    this.points.forEach(function(point) {
      if(!shortest || point.getName().length < shortest.length) shortest = point.getName();
    });
    return shortest + ' AREA';
  };


  this.addPoint = function(point) {
    if(this.points.indexOf(point) !== -1) return;
    this.points.push(point);
    this.id += '-' + point.getId();
    if(point.getType() === 'PLACE' && point.getId() === 'from') {
      this.containsFromPlace = true;
      this.fromPlace = point;
    }
    if(point.getType() === 'PLACE' && point.getId() === 'to') {
      this.containsToPlace = true;
      this.toPlace = point;
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

    // set up the merged marker
    if(this.containsFromPlace || this.containsToPlace) {
      this.mergedMarker = this.svgGroup.append('g').append('circle')
        .datum({ point : this })
        .attr('class', 'transitive-multipoint-marker-merged');
    }
    else if(this.hasOffsetPoints) {
      if(this.mergedType === 'CIRCLE') {
        this.mergedMarker = this.svgGroup.append('g').append('circle')
          .datum({ point : this })
          .attr('class', 'transitive-multipoint-marker-merged');
      }
      else if(this.mergedType === 'POLYGON') {
        this.mergedMarker = this.svgGroup.append('g').append('path')
          .datum({ point : this })
          .attr('class', 'transitive-multipoint-marker-merged');
      }
    }


    // set up the pattern markers
    this.marker = this.svgGroup.selectAll('circle')
      .data(this.renderData)
      .enter()
      .append('circle')
      .attr('class', 'transitive-multipoint-marker-pattern');

    this.initLabels();
  };

  /**
   * Refresh the point
   *
   * @param {Display} display
   */

  this.refresh = function(display) {
    if (!this.renderData) return;

    // refresh the merged marker
    if(this.mergedMarker) {
      if(this.containsFromPlace || this.containsToPlace) {
        var data = this.renderData[0];
        this.mergedMarker
          .attr({
          'cx' : display.xScale(data.x),
          'cy' : display.yScale(data.y)
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

    this.refreshLabels(display, this.renderData[0].x, this.renderData[0].y);
  };

  this.getRenderDataArray = function() {
    return this.renderData;
  };
});

/**
 * Expose `MultiPoint`
 */

module.exports = MultiPoint;