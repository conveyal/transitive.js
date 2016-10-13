/**
 * Dependencies
 */

var augment = require('augment')
var each = require('component-each')

var Point = require('./index')

/**
 *  MultiPoint: a Point subclass representing a collection of multiple points
 *  that have been merged into one for display purposes.
 */

var MultiPoint = augment(Point, function (base) {
  this.constructor = function (pointArray) {
    base.constructor.call(this)
    this.points = []
    if (pointArray) {
      pointArray.forEach(function (point) {
        this.addPoint(point)
      }, this)
    }
    this.renderData = []
    this.id = 'multi'
    this.toPoint = this.fromPoint = null

    this.patternStylerKey = 'multipoints_pattern'
  }

  /**
   * Get id
   */

  this.getId = function () {
    return this.id
  }

  /**
   * Get type
   */

  this.getType = function () {
    return 'MULTI'
  }

  this.getName = function () {
    if (this.fromPoint) return this.fromPoint.getName()
    if (this.toPoint) return this.toPoint.getName()
    var shortest = null
    this.points.forEach(function (point) {
      if (point.getType() === 'TURN') return
      if (!shortest || point.getName().length < shortest.length) shortest = point.getName()
    })

    return shortest
  }

  this.containsSegmentEndPoint = function () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsSegmentEndPoint()) return true
    }
    return false
  }

  this.containsBoardPoint = function () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsBoardPoint()) return true
    }
    return false
  }

  this.containsAlightPoint = function () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsAlightPoint()) return true
    }
    return false
  }

  this.containsTransferPoint = function () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsTransferPoint()) return true
    }
    return false
  }

  this.containsFromPoint = function () {
    return (this.fromPoint !== null)
  }

  this.containsToPoint = function () {
    return (this.toPoint !== null)
  }

  this.getPatterns = function () {
    var patterns = []

    this.points.forEach(function (point) {
      if (!point.patterns) return
      point.patterns.forEach(function (pattern) {
        if (patterns.indexOf(pattern) === -1) patterns.push(pattern)
      })
    })

    return patterns
  }

  this.addPoint = function (point) {
    if (this.points.indexOf(point) !== -1) return
    this.points.push(point)
    this.id += '-' + point.getId()
    if (point.containsFromPoint()) { // getType() === 'PLACE' && point.getId() === 'from') {
      this.fromPoint = point
    }
    if (point.containsToPoint()) { // getType() === 'PLACE' && point.getId() === 'to') {
      this.toPoint = point
    }
    this.calcWorldCoords()
  }

  this.calcWorldCoords = function () {
    var tx = 0
    var ty = 0
    each(this.points, function (point) {
      tx += point.worldX
      ty += point.worldY
    })

    this.worldX = tx / this.points.length
    this.worldY = ty / this.points.length
  }

  /**
   * Add render data
   *
   * @param {Object} stopInfo
   */

  this.addRenderData = function (pointInfo) {
    if (pointInfo.offsetX !== 0 || pointInfo.offsetY !== 0) this.hasOffsetPoints = true
    this.renderData.push(pointInfo)
  }

  this.clearRenderData = function () {
    this.hasOffsetPoints = false
    this.renderData = []
  }

  /**
   * Draw a multipoint
   *
   * @param {Display} display
   */

  this.render = function (display) {
    base.render.call(this, display)

    if (!this.renderData) return

    // set up the main svg group for this stop
    this.initSvg(display)
    this.svgGroup
      .attr('class', 'transitive-sortable')
      .datum({
        owner: this,
        sortableType: 'POINT_MULTI'
      })

    if (this.containsSegmentEndPoint()) this.initMergedMarker(display)

    // set up the pattern markers
    /* this.marker = this.markerSvg.selectAll('circle')
      .data(this.renderData)
      .enter()
      .append('circle')
      .attr('class', 'transitive-multipoint-marker-pattern'); */
  }

  this.initMergedMarker = function (display) {
    // set up the merged marker
    if (this.fromPoint || this.toPoint) {
      this.mergedMarker = this.markerSvg.append('g').append('circle')
        .datum({
          owner: this
        })
        .attr('class', 'transitive-multipoint-marker-merged')
    } else if (this.hasOffsetPoints || this.renderData.length > 1) {
      this.mergedMarker = this.markerSvg.append('g').append('rect')
        .datum({
          owner: this
        })
        .attr('class', 'transitive-multipoint-marker-merged')
    }
  }

  /**
   * Refresh the point
   *
   * @param {Display} display
   */

  this.refresh = function (display) {
    if (!this.renderData) return

    // refresh the merged marker
    if (this.mergedMarker) {
      if (!this.mergedMarkerData) this.initMarkerData(display)

      this.mergedMarker.datum({
        owner: this
      })
      this.mergedMarker.attr(this.mergedMarkerData)
    }

    /* var cx, cy;
    // refresh the pattern-level markers
    this.marker.data(this.renderData);
    this.marker.attr('transform', function (d, i) {
      cx = d.x;
      cy = d.y;
      var x = display.xScale(d.x) + d.offsetX;
      var y = display.yScale(d.y) - d.offsetY;
      return 'translate(' + x +', ' + y +')';
    }); */
  }

  this.getRenderDataArray = function () {
    return this.renderData
  }

  this.setFocused = function (focused) {
    this.focused = focused
    each(this.points, function (point) {
      point.setFocused(focused)
    })
  }

  this.runFocusTransition = function (display, callback) {
    if (this.mergedMarker) {
      var newStrokeColor = display.styler.compute(display.styler.multipoints_merged
        .stroke, display, {
          owner: this
        })
      this.mergedMarker.transition().style('stroke', newStrokeColor).call(
        callback)
    }
    if (this.label) this.label.runFocusTransition(display, callback)
  }
})

/**
 * Expose `MultiPoint`
 */

module.exports = MultiPoint
