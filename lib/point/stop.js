import { forEach } from 'lodash'

import Point from './point'
import { sm } from '../util'

/**
 *  Place: a Point subclass representing a 'place' that can be rendered on the
 *  map. A place is a point *other* than a transit stop/station, e.g. a home/work
 *  location, a point of interest, etc.
 */

export default class Stop extends Point {
  constructor (data) {
    super(data)

    if (data && data.stop_lat && data.stop_lon) {
      var xy = sm.forward([data.stop_lon, data.stop_lat])
      this.worldX = xy[0]
      this.worldY = xy[1]
    }

    this.patterns = []

    this.patternRenderData = {}
    this.patternFocused = {}
    this.patternCount = 0

    this.patternStylerKey = 'stops_pattern'

    this.isSegmentEndPoint = false
  }

  /**
   * Get id
   */

  getId () {
    return this.stop_id
  }

  /**
   * Get type
   */

  getType () {
    return 'STOP'
  }

  /**
   * Get name
   */

  getName () {
    if (!this.stop_name) return `Unnamed Stop (ID=${this.getId()})`
    return this.stop_name
  }

  /**
   * Get lat
   */

  getLat () {
    return this.stop_lat
  }

  /**
   * Get lon
   */

  getLon () {
    return this.stop_lon
  }

  containsSegmentEndPoint () {
    return this.isSegmentEndPoint
  }

  containsBoardPoint () {
    return this.isBoardPoint
  }

  containsAlightPoint () {
    return this.isAlightPoint
  }

  containsTransferPoint () {
    return this.isTransferPoint
  }

  getPatterns () {
    return this.patterns
  }

  addPattern (pattern) {
    if (this.patterns.indexOf(pattern) === -1) this.patterns.push(pattern)
  }

  /**
   * Add render data
   *
   * @param {Object} stopInfo
   */

  addRenderData (stopInfo) {
    if (stopInfo.rEdge.getType() === 'TRANSIT') {
      var s = {
        sortableType: 'POINT_STOP_PATTERN',
        owner: this,
        getZIndex: function () {
          if (this.owner.graphVertex) {
            return this.owner.getZIndex()
          }
          return this.rEdge.getZIndex() + 1
        }
      }

      for (var key in stopInfo) s[key] = stopInfo[key]

      var patternId = stopInfo.rEdge.patternIds
      this.patternRenderData[patternId] = s // .push(s);

      forEach(stopInfo.rEdge.patterns, pattern => {
        this.addPattern(pattern)
      })
    }
    this.patternCount = Object.keys(this.patternRenderData).length
  }

  isPatternFocused (patternId) {
    if (!(patternId in this.patternFocused)) return true
    return (this.patternFocused[patternId])
  }

  setPatternFocused (patternId, focused) {
    this.patternFocused[patternId] = focused
  }

  setAllPatternsFocused (focused) {
    for (var key in this.patternRenderData) {
      this.patternFocused[key] = focused
    }
  }

  /**
   * Draw a stop
   *
   * @param {Display} display
   */

  render (display) {
    super.render(display)
    if (Object.keys(this.patternRenderData).length === 0) return

    var renderDataArray = this.getRenderDataArray()

    this.initSvg(display)

    // set up the merged marker
    this.mergedMarker = this.markerSvg.append('g').append('rect')
      .attr('class', 'transitive-sortable transitive-stop-marker-merged')
      .datum(this.getMergedRenderData())

    // set up the pattern-specific markers
    this.patternMarkers = this.markerSvg.append('g').selectAll('circle')
      .data(renderDataArray)
      .enter()
      .append('circle')
      .attr('class', 'transitive-sortable transitive-stop-marker-pattern')
  }

  /**
   * Refresh the stop
   *
   * @param {Display} display
   */

  refresh (display) {
    if (this.patternCount === 0) return

    if (!this.mergedMarkerData) this.initMarkerData(display)

    // refresh the pattern-level markers
    this.patternMarkers.data(this.getRenderDataArray())

    this.patternMarkers.attr('transform', (d, i) => {
      if (!isNaN(d.x) && !isNaN(d.y)) {
        var x = d.x + this.placeOffsets.x
        var y = d.y + this.placeOffsets.y
        return `translate(${x}, ${y})`
      }
    })

    // refresh the merged marker
    if (this.mergedMarker) {
      this.mergedMarker.datum(this.getMergedRenderData())
      if (!isNaN(this.mergedMarkerData.x) && !isNaN(this.mergedMarkerData.y)) {
        for (const key in this.mergedMarkerData) this.mergedMarker.attr(key, this.mergedMarkerData[key])
      }
    }
  }

  getMergedRenderData () {
    return {
      owner: this,
      sortableType: 'POINT_STOP_MERGED'
    }
  }

  getRenderDataArray () {
    var dataArray = []
    for (var patternId in this.patternRenderData) {
      dataArray.push(this.patternRenderData[patternId])
    }
    return dataArray
  }

  getMarkerBBox () {
    if (this.mergedMarker) return this.mergedMarkerData
  }

  isFocused () {
    if (this.mergedMarker || !this.patternRenderData) {
      return (this.focused === true)
    }

    var focused = true
    for (var patternId in this.patternRenderData) {
      focused = this && this.isPatternFocused(patternId)
    }
    return focused
  }

  runFocusTransition (display, callback) {
    if (this.mergedMarker) {
      var newStrokeColor = display.styler.compute(display.styler.stops_merged
        .stroke, display, {
          owner: this
        })
      this.mergedMarker.transition().style('stroke', newStrokeColor).call(
        callback)
    }
    if (this.label) this.label.runFocusTransition(display, callback)
  }

  clearRenderData () {
    this.patternRenderData = {}
    this.mergedMarkerData = null
    this.placeOffsets = {
      x: 0,
      y: 0
    }
  }
}
