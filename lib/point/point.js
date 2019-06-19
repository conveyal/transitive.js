import { forEach } from 'lodash'

import PointLabel from '../labeler/pointlabel'

export default class Point {
  constructor (data) {
    for (var key in data) {
      this[key] = data[key]
    }

    this.paths = []
    this.renderData = []

    this.label = new PointLabel(this)
    this.renderLabel = true

    this.focused = true
    this.sortableType = 'POINT'

    this.placeOffsets = {
      x: 0,
      y: 0
    }

    this.zIndex = 10000
  }

  /**
   * Get unique ID for point -- must be defined by subclass
   */

  getId () {}

  getElementId () {
    return this.getType().toLowerCase() + '-' + this.getId()
  }

  /**
   * Get Point type -- must be defined by subclass
   */

  getType () {}

  /**
   * Get Point name
   */

  getName () {
    return `${this.getType()} point (ID=${this.getId()})`
  }

  /**
   * Get latitude
   */

  getLat () {
    return 0
  }

  /**
   * Get longitude
   */

  getLon () {
    return 0
  }

  containsSegmentEndPoint () {
    return false
  }

  containsBoardPoint () {
    return false
  }

  containsAlightPoint () {
    return false
  }

  containsTransferPoint () {
    return false
  }

  getPatterns () {
    return []
  }

  /**
   * Draw the point
   *
   * @param {Display} display
   */

  render (display) {}

  addRenderData () {}

  clearRenderData () {}

  containsFromPoint () {
    return false
  }

  containsToPoint () {
    return false
  }

  //* * Shared geom utility functions **//

  constructMergedMarker (display) {
    var dataArray = this.getRenderDataArray()
    var xValues = []
    var yValues = []
    dataArray.forEach(function (data) {
      var x = data.x
      var y = data.y
      xValues.push(x)
      yValues.push(y)
    })
    var minX = Math.min.apply(Math, xValues)
    var minY = Math.min.apply(Math, yValues)
    var maxX = Math.max.apply(Math, xValues)
    var maxY = Math.max.apply(Math, yValues)

    // retrieve marker type and radius from the styler
    var markerType = display.styler.compute(display.styler.stops_merged['marker-type'], display, {
      owner: this
    })
    var stylerRadius = display.styler.compute(display.styler.stops_merged.r, display, {
      owner: this
    })

    var width
    var height
    var r

    // if this is a circle marker w/ a styler-defined fixed radius, use that
    if (markerType === 'circle' && stylerRadius) {
      width = height = stylerRadius * 2
      r = stylerRadius
    // otherwise, this is a dynamically-sized marker
    } else {
      var dx = maxX - minX
      var dy = maxY - minY

      var markerPadding = display.styler.compute(display.styler.stops_merged['marker-padding'], display, {
        owner: this
      }) || 0

      var patternRadius = display.styler.compute(display.styler[this.patternStylerKey].r, display, {
        owner: this
      })
      r = parseFloat(patternRadius) + markerPadding

      if (markerType === 'circle') {
        width = height = Math.max(dx, dy) + 2 * r
        r = width / 2
      } else {
        width = dx + 2 * r
        height = dy + 2 * r
        if (markerType === 'rectangle') r = 0
      }
    }

    return {
      x: (minX + maxX) / 2 - width / 2,
      y: (minY + maxY) / 2 - height / 2,
      width: width,
      height: height,
      rx: r,
      ry: r
    }
  }

  initMarkerData (display) {
    if (this.getType() !== 'STOP' && this.getType() !== 'MULTI') return

    this.mergedMarkerData = this.constructMergedMarker(display)

    this.placeOffsets = {
      x: 0,
      y: 0
    }
    if (this.adjacentPlace) {
      var placeR = display.styler.compute(display.styler.places.r, display, {
        owner: this.adjacentPlace
      })

      var placeX = display.xScale.compute(this.adjacentPlace.worldX)
      var placeY = display.yScale.compute(this.adjacentPlace.worldY)

      var thisR = this.mergedMarkerData.width / 2
      var thisX = this.mergedMarkerData.x + thisR
      var thisY = this.mergedMarkerData.y + thisR

      var dx = thisX - placeX
      var dy = thisY - placeY
      var dist = Math.sqrt(dx * dx + dy * dy)

      if (placeR + thisR > dist) {
        var f = (placeR + thisR) / dist
        this.placeOffsets = {
          x: (dx * f) - dx,
          y: (dy * f) - dy
        }

        this.mergedMarkerData.x += this.placeOffsets.x
        this.mergedMarkerData.y += this.placeOffsets.y

        forEach(this.graphVertex.incidentEdges(), edge => {
          forEach(edge.renderSegments, segment => {
            segment.refreshRenderData(display)
          })
        })
      }
    }
  }

  getMarkerBBox () {
    return this.markerBBox
  }

  setFocused (focused) {
    this.focused = focused
  }

  isFocused () {
    return (this.focused === true)
  }

  runFocusTransition (display, callback) {}

  setAllPatternsFocused () {}

  getZIndex () {
    return this.zIndex
  }

  getAverageCoord () {
    var dataArray = this.getRenderDataArray()

    var xTotal = 0
    var yTotal = 0
    forEach(dataArray, data => {
      xTotal += data.x
      yTotal += data.y
    })

    return {
      x: xTotal / dataArray.length,
      y: yTotal / dataArray.length
    }
  }

  hasRenderData () {
    var dataArray = this.getRenderDataArray()
    return (dataArray && dataArray.length > 0)
  }

  makeDraggable (transitive) {}

  toString () {
    return `${this.getType()} point: ${this.getId()} (${this.getName()})`
  }
}
