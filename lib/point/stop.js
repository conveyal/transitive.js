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

    if (this.patternCount === 0) return

    this.initMarkerData(display)

    const styler = display.styler

    // For segment endpoints, draw the "merged" marker
    if (this.isSegmentEndPoint && this.mergedMarkerData) {
      display.drawRect({
        x: this.mergedMarkerData.x,
        y: this.mergedMarkerData.y
      }, {
        width: this.mergedMarkerData.width,
        height: this.mergedMarkerData.height,
        rx: this.mergedMarkerData.rx,
        ry: this.mergedMarkerData.ry,
        fill: styler.compute2('stops_merged', 'fill', this),
        stroke: styler.compute2('stops_merged', 'stroke', this),
        'stroke-width': styler.compute2('stops_merged', 'stroke-width', this)
      })

      // store marker bounding box
      this.markerBBox = {
        x: this.mergedMarkerData.x,
        y: this.mergedMarkerData.y,
        width: this.mergedMarkerData.width,
        height: this.mergedMarkerData.height
      }
    }

    // TODO: Restore inline stop
    if (!this.isSegmentEndPoint) {
      /* const renderDataArray = this.getRenderDataArray()
      for (let renderData of renderDataArray) {
        display.drawCircle({
          x: renderData.x,
          y: renderData.y
        }, {
          fill: '#fff',
          r: renderData.rEdge.lineWidth * 0.4
        })
      } */
    }
  }

  getRenderDataArray () {
    var dataArray = []
    for (var patternId in this.patternRenderData) {
      dataArray.push(this.patternRenderData[patternId])
    }
    return dataArray
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
