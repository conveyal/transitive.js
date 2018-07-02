import { forEach } from 'lodash'

import Point from './point'

/**
 *  MultiPoint: a Point subclass representing a collection of multiple points
 *  that have been merged into one for display purposes.
 */

export default class MultiPoint extends Point {
  constructor (pointArray) {
    super()
    this.points = []
    if (pointArray) {
      forEach(pointArray, point => {
        this.addPoint(point)
      })
    }
    this.renderData = []
    this.id = 'multi'
    this.toPoint = this.fromPoint = null

    this.patternStylerKey = 'multipoints_pattern'
  }

  /**
   * Get id
   */

  getId () {
    return this.id
  }

  /**
   * Get type
   */

  getType () {
    return 'MULTI'
  }

  getName () {
    if (this.fromPoint) return this.fromPoint.getName()
    if (this.toPoint) return this.toPoint.getName()
    var shortest = null
    forEach(this.points, point => {
      if (point.getType() === 'TURN') return
      if (!shortest || point.getName().length < shortest.length) shortest = point.getName()
    })

    return shortest
  }

  containsSegmentEndPoint () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsSegmentEndPoint()) return true
    }
    return false
  }

  containsBoardPoint () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsBoardPoint()) return true
    }
    return false
  }

  containsAlightPoint () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsAlightPoint()) return true
    }
    return false
  }

  containsTransferPoint () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsTransferPoint()) return true
    }
    return false
  }

  containsFromPoint () {
    return (this.fromPoint !== null)
  }

  containsToPoint () {
    return (this.toPoint !== null)
  }

  getPatterns () {
    var patterns = []

    forEach(this.points, point => {
      if (!point.patterns) return
      forEach(point.patterns, pattern => {
        if (patterns.indexOf(pattern) === -1) patterns.push(pattern)
      })
    })

    return patterns
  }

  addPoint (point) {
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

  calcWorldCoords () {
    var tx = 0
    var ty = 0
    forEach(this.points, point => {
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

  addRenderData (pointInfo) {
    if (pointInfo.offsetX !== 0 || pointInfo.offsetY !== 0) this.hasOffsetPoints = true
    this.renderData.push(pointInfo)
  }

  clearRenderData () {
    this.hasOffsetPoints = false
    this.renderData = []
  }

  /**
   * Draw a multipoint
   *
   * @param {Display} display
   */

  render (display) {
    super.render(display)

    if (!this.renderData) return

    // set up the main svg group for this stop
    /*this.initSvg(display)
    this.svgGroup
      .attr('class', 'transitive-sortable')
      .datum({
        owner: this,
        sortableType: 'POINT_MULTI'
      })*/

    //if (this.containsSegmentEndPoint()) this.initMergedMarker(display)

    const xArr = this.renderData.map(d => d.x)
    const yArr = this.renderData.map(d => d.y)
    const xMin = Math.min(...xArr)
    const xMax = Math.max(...xArr)
    const yMin = Math.min(...yArr)
    const yMax = Math.max(...yArr)

    const r = 6
    const x = xMin - r
    const y = yMin - r
    const width = xMax - xMin + r * 2
    const height = yMax - yMin + r * 2

    display.drawRect({ x, y }, {
      width,
      height,
      rx: r,
      ry: r,
      fill: '#fff',
      stroke: '#000',
      'stroke-width': 2
    })

    // store marker bounding box
    this.markerBBox = { x, y, width, height }

    // set up the pattern markers
    /* this.marker = this.markerSvg.selectAll('circle')
      .data(this.renderData)
      .enter()
      .append('circle')
      .attr('class', 'transitive-multipoint-marker-pattern'); */
  }

  initMergedMarker (display) {
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

  refresh (display) {
    /*if (!this.renderData) return

    // refresh the merged marker
    if (this.mergedMarker) {
      if (!this.mergedMarkerData) this.initMarkerData(display)

      this.mergedMarker.datum({
        owner: this
      })
      for (const key in this.mergedMarkerData) {
        this.mergedMarker.attr(key, this.mergedMarkerData[key])
      }
    }*/

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

  getRenderDataArray () {
    return this.renderData
  }

  setFocused (focused) {
    this.focused = focused
    forEach(this.points, point => {
      point.setFocused(focused)
    })
  }

  runFocusTransition (display, callback) {
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
}
