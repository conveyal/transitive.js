import { forEach } from 'lodash'

import PointLabel from '../labeler/pointlabel'

export default class Point {
  constructor(data) {
    for (const key in data) {
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

  getId() {
    throw new Error('method not defined by subclass!')
  }

  getElementId() {
    return this.getType().toLowerCase() + '-' + this.getId()
  }

  /**
   * Get Point type -- must be defined by subclass
   */

  getType() {
    throw new Error('method not defined by subclass!')
  }

  /**
   * Get Point name
   */

  getName() {
    return `${this.getType()} point (ID=${this.getId()})`
  }

  /**
   * Get latitude
   */

  getLat() {
    return 0
  }

  /**
   * Get longitude
   */

  getLon() {
    return 0
  }

  containsSegmentEndPoint() {
    return false
  }

  containsBoardPoint() {
    return false
  }

  containsAlightPoint() {
    return false
  }

  containsTransferPoint() {
    return false
  }

  getPatterns() {
    return []
  }

  /**
   * Draw the point
   *
   * @param {Display} display
   */

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  render(display) {}

  /**
   * Does not need to be implemented by subclass
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addRenderData() {}

  /**
   * Does not need to be implemented by subclass
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearRenderData() {}

  containsFromPoint() {
    return false
  }

  containsToPoint() {
    return false
  }

  //* * Shared geom utility functions **//

  constructMergedMarker(display) {
    const dataArray = this.getRenderDataArray()
    const xValues = []
    const yValues = []
    dataArray.forEach(function (data) {
      const x = data.x
      const y = data.y
      xValues.push(x)
      yValues.push(y)
    })
    const minX = Math.min.apply(Math, xValues)
    const minY = Math.min.apply(Math, yValues)
    const maxX = Math.max.apply(Math, xValues)
    const maxY = Math.max.apply(Math, yValues)

    // retrieve marker type and radius from the styler
    const markerType = display.styler.compute(
      display.styler.stops_merged['marker-type'],
      display,
      {
        owner: this
      }
    )
    const stylerRadius = display.styler.compute(
      display.styler.stops_merged.r,
      display,
      {
        owner: this
      }
    )

    let width
    let height
    let r

    // if this is a circle marker w/ a styler-defined fixed radius, use that
    if (markerType === 'circle' && stylerRadius) {
      width = height = stylerRadius * 2
      r = stylerRadius
      // otherwise, this is a dynamically-sized marker
    } else {
      const dx = maxX - minX
      const dy = maxY - minY

      const markerPadding =
        display.styler.compute(
          display.styler.stops_merged['marker-padding'],
          display,
          {
            owner: this
          }
        ) || 0

      const patternRadius = display.styler.compute(
        display.styler[this.patternStylerKey].r,
        display,
        {
          owner: this
        }
      )
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
      height: height,
      rx: r,
      ry: r,
      width: width,
      x: (minX + maxX) / 2 - width / 2,
      y: (minY + maxY) / 2 - height / 2
    }
  }

  initMarkerData(display) {
    if (this.getType() !== 'STOP' && this.getType() !== 'MULTI') return

    this.mergedMarkerData = this.constructMergedMarker(display)

    this.placeOffsets = {
      x: 0,
      y: 0
    }
    if (this.adjacentPlace) {
      const placeR = display.styler.compute(display.styler.places.r, display, {
        owner: this.adjacentPlace
      })

      const placeX = display.xScale.compute(this.adjacentPlace.worldX)
      const placeY = display.yScale.compute(this.adjacentPlace.worldY)

      const thisR = this.mergedMarkerData.width / 2
      const thisX = this.mergedMarkerData.x + thisR
      const thisY = this.mergedMarkerData.y + thisR

      const dx = thisX - placeX
      const dy = thisY - placeY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (placeR + thisR > dist) {
        const f = (placeR + thisR) / dist
        this.placeOffsets = {
          x: dx * f - dx,
          y: dy * f - dy
        }

        this.mergedMarkerData.x += this.placeOffsets.x
        this.mergedMarkerData.y += this.placeOffsets.y

        forEach(this.graphVertex.incidentEdges(), (edge) => {
          forEach(edge.renderSegments, (segment) => {
            segment.refreshRenderData(display)
          })
        })
      }
    }
  }

  getMarkerBBox() {
    return this.markerBBox
  }

  setFocused(focused) {
    this.focused = focused
  }

  isFocused() {
    return this.focused === true
  }

  /**
   * Does not need to be implemented by subclass
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  runFocusTransition(display, callback) {}

  /**
   * Does not need to be implemented by subclass
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setAllPatternsFocused() {}

  getZIndex() {
    return this.zIndex
  }

  getAverageCoord() {
    const dataArray = this.getRenderDataArray()

    let xTotal = 0
    let yTotal = 0
    forEach(dataArray, (data) => {
      xTotal += data.x
      yTotal += data.y
    })

    return {
      x: xTotal / dataArray.length,
      y: yTotal / dataArray.length
    }
  }

  hasRenderData() {
    const dataArray = this.getRenderDataArray()
    return dataArray && dataArray.length > 0
  }

  /**
   * Does not need to be implemented by subclass
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  makeDraggable(transitive) {}

  toString() {
    return `${this.getType()} point: ${this.getId()} (${this.getName()})`
  }
}
