import { forEach } from 'lodash'

import { distance, normalizeVector, rotateVector } from '../util'

/**
 * RenderedSegment
 */

var rSegmentId = 0

export default class RenderedSegment {
  constructor (pathSegment) {
    this.id = rSegmentId++
    this.renderedEdges = []
    this.pathSegment = pathSegment
    if (pathSegment) this.type = pathSegment.type
    this.focused = true
  }

  getId () {
    return this.id
  }

  getType () {
    return this.type
  }

  addRenderedEdge (rEdge) {
    this.renderedEdges.push(rEdge)
  }

  render (display) {
    const styler = display.styler

    this.renderData = []
    forEach(this.renderedEdges, rEdge => {
      this.renderData = this.renderData.concat(rEdge.renderData)
    })

    // Check if this segment is to be drawn as an arc; if so replace render data
    if (this.pathSegment.journeySegment && this.pathSegment.journeySegment.arc) {
      const first = this.renderData[0]
      const last = this.renderData[this.renderData.length - 1]
      const v = {
        x: last.x - first.x,
        y: last.y - first.y
      }
      const vp = rotateVector(normalizeVector(v), -Math.PI / 2)
      const dist = distance(first.x, first.y, last.x, last.y)
      const arc = {
        x: last.x,
        y: last.y,
        arc: -45,
        radius: dist * 0.75,
        ex: ((last.x + first.x) / 2) + vp.x * (dist / 4),
        ey: ((last.y + first.y) / 2) + vp.y * (dist / 4)
      }
      this.renderData = [first, arc, last]
    }

    display.drawPath(this.renderData, {
      fill: 'none',
      stroke: styler.compute2('segments', 'stroke', this),
      'stroke-width': styler.compute2('segments', 'stroke-width', this),
      'stroke-dasharray': styler.compute2('segments', 'stroke-dasharray', this),
      'stroke-linecap': styler.compute2('segments', 'stroke-linecap', this)
    })
  }

  setFocused (focused) {
    this.focused = focused
  }

  isFocused () {
    return this.focused
  }

  runFocusTransition (display, callback) {
    var newColor = display.styler.compute(display.styler.segments.stroke, display,
      this)
    this.lineGraph.transition().style('stroke', newColor).call(callback)
  }

  getZIndex () {
    return this.zIndex
  }

  computeLineWidth (display, includeEnvelope) {
    var styler = display.styler
    if (styler && display) {
      // compute the line width
      var env = styler.compute(styler.segments.envelope, display, this)
      if (env && includeEnvelope) {
        return parseFloat(env.substring(0, env.length - 2), 10) - 2
      } else {
        var lw = styler.compute(styler.segments['stroke-width'], display, this)
        return parseFloat(lw.substring(0, lw.length - 2), 10) - 2
      }
    }
  }

  compareTo (other) {
    // show transit segments in front of other types
    if (this.type === 'TRANSIT' && other.type !== 'TRANSIT') return -1
    if (other.type === 'TRANSIT' && this.type !== 'TRANSIT') return 1

    if (this.type === 'TRANSIT' && other.type === 'TRANSIT') {
      // for two transit segments, try sorting transit mode first
      if (this.mode && other.mode && this.mode !== other.mode) {
        return (this.mode > other.mode)
      }

      // for two transit segments of the same mode, sort by id (for display consistency)
      return (this.getId() < other.getId())
    }
  }

  getLabelTextArray () {
    var textArray = []
    forEach(this.patterns, pattern => {
      var shortName = pattern.route.route_short_name
      if (textArray.indexOf(shortName) === -1) textArray.push(shortName)
    })
    return textArray
  }

  getLabelAnchors (display, spacing) {
    var labelAnchors = []
    this.computeRenderLength(display)
    var anchorCount = Math.floor(this.renderLength / spacing)
    var pctSpacing = spacing / this.renderLength

    for (var i = 0; i < anchorCount; i++) {
      var t = (i % 2 === 0)
        ? 0.5 + (i / 2) * pctSpacing
        : 0.5 - ((i + 1) / 2) * pctSpacing
      var coord = this.coordAlongRenderedPath(t, display)
      if (coord) labelAnchors.push(coord)
    }

    return labelAnchors
  }

  coordAlongRenderedPath (t, display) {
    var loc = t * this.renderLength

    var cur = 0
    for (var i = 0; i < this.renderedEdges.length; i++) {
      var rEdge = this.renderedEdges[i]
      var edgeRenderLen = rEdge.graphEdge.getRenderLength(display)
      if (loc <= cur + edgeRenderLen) {
        var t2 = (loc - cur) / edgeRenderLen
        return rEdge.graphEdge.coordAlongEdge(t2, rEdge.renderData, display)
      }
      cur += edgeRenderLen
    }
  }

  computeRenderLength (display) {
    this.renderLength = 0
    forEach(this.renderedEdges, rEdge => {
      this.renderLength += rEdge.graphEdge.getRenderLength(display)
    })
  }

  toString () {
    return `RenderedSegment ${this.id} on ${this.pathSegment ? this.pathSegment.toString() : ' (null segment)'}`
  }
}
