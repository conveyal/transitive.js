
/**
 * Dependencies
 */

var augment = require('augment');

var Point = require('./index');

/**
 *  Place: a Point subclass representing a 'place' that can be rendered on the
 *  map. A place is a point *other* than a transit stop/station, e.g. a home/work
 *  location, a point of interest, etc.
 */

var Stop = augment(Point, function(base) {

  this.constructor =  function(data) {
    base.constructor.call(this, data);

    this.patterns = [];

    this.labelAnchor = null;
    this.labelAngle = -45;
    this.labelOffsetX = function() { return  0; };
    this.labelOffsetY = function() { return  0; };

    // flag indicating whether this stop is the endpoint of a pattern
    this.isEndPoint = false;

    // flag indicating whether this stop is a point of convergence/divergence between 2+ patterns
    this.isBranchPoint = false;
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


  /**
   * Add render data
   *
   * @param {Object} stopInfo
   */

  this.addRenderData = function(stopInfo) {
    this.renderData.push(stopInfo);
    

    // check if this is the 'topmost' stopInfo item received (based on offsets) for labeling purposes
    if (!this.topAnchor) {
      this.topAnchor = stopInfo;
    } else if (stopInfo.offsetY > this.topAnchor.offsetY) {
      this.topAnchor = stopInfo;
    }

    // check if this is the 'bottommost' stopInfo iterm received
    if (!this.bottomAnchor) {
      this.bottomAnchor = stopInfo;
    } else if (stopInfo.offsetY < this.bottomAnchor.offsetY) {
      this.bottomAnchor = stopInfo;
    }
  };

  /**
   * Draw a stop
   *
   * @param {Display} display
   */

  this.draw = function(display) {

    if (this.renderData.length === 0) return;

    var textAnchor = 'start';
    if (this.labelPosition > 0) { // the 'above' position
      this.labelAnchor = this.topAnchor;
    } else { // the 'below' position
      textAnchor = 'end';
      this.labelAnchor = this.bottomAnchor;
    }

    // set up the main svg group for this stop
    this.svgGroup = display.svg.append('g')
      .attr('id', 'transitive-stop-' + this.stop_id);

    // set up the pattern-level markers
    this.patternMarkers = this.svgGroup.selectAll('circle')
      .data(this.renderData)
      .enter()
      .append('circle')
      .attr('class', 'transitive-stop-circle');

    // set up a group for the stop-level labels
    this.labels = this.svgGroup
      .append('g');

    // create the main stop label
    this.mainLabel = this.labels.append('text')
      .data(this.renderData)
      .attr('id', 'transitive-stop-label-' + this.stop_id)
      .text(this.stop_name.replace('METRO STATION', ''))
      .attr('class', 'transitive-stop-label')
      .attr('text-anchor', textAnchor)
      .attr('transform', (function (d, i) {
        return 'rotate(' + this.labelAngle + ', 0, 0)';
      }).bind(this));

    this.paths.forEach(function(path) {
      this.mainLabel.classed('transitive-stops-'+path.parent.getElementId(), true);
      if(path.isTransferPoint(this)) {
        this.mainLabel.classed('transitive-transfer-stops-'+path.parent.getElementId(), true);
      }
    }, this);
  };

  /**
   * Refresh the stop
   *
   * @param {Display} display
   */

  this.refresh = function(display) {
    if (this.renderData.length === 0) return;

    var cx, cy;
    // refresh the pattern-level markers
    this.patternMarkers.data(this.renderData);
    this.patternMarkers.attr('transform', function (d, i) {
      cx = d.x;
      cy = d.y;
      var x = display.xScale(d.x) + d.offsetX;
      var y = display.yScale(d.y) - d.offsetY;
      return 'translate(' + x +', ' + y +')';
    });


    //console.log(this.labelAnchor);
    /* refresh the stop-level labels */
    this.labels.attr('transform', (function (d, i) {
      var la = this.labelAnchor;
      var x = display.xScale(cx) + la.offsetX;
      var y = display.yScale(cy) - la.offsetY;
      this.lastX = la.x;
      this.lastY = la.y;
      return 'translate(' + x +',' + y +')';
    }).bind(this));
  };

});

/**
 * Expose `Stop`
 */

module.exports = Stop;
