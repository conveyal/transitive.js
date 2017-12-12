import d3 from 'd3'
import { forEach } from 'lodash'

import interpolateLine from '../util/interpolate-line'

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
    this.line = d3.svg.line() // the line translation function
    .x(function (data, i) {
      return data.x
    })
      .y(function (data, i) {
        return data.y
      })
      .interpolate(interpolateLine.bind({
        segment: this,
        display: display
      }))

    this.svgGroup = display.svg.append('g')

    this.lineSvg = this.svgGroup.append('g')
      .attr('class', 'transitive-sortable')
      .datum({
        owner: this,
        sortableType: 'SEGMENT'
      })

    this.labelSvg = this.svgGroup.append('g')

    this.lineGraph = this.lineSvg.append('path')

    this.lineGraph
      .attr('class', 'transitive-line')
      .data([this])

    this.lineGraphFront = this.lineSvg.append('path')

    this.lineGraphFront
      .attr('class', 'transitive-line-front')
      .data([this])

    if (display.haloLayer) {
      this.lineGraphHalo = display.haloLayer.append('path')

      this.lineGraphHalo
        .attr('class', 'transitive-line-halo')
        .data([this])
    }
  }

  refresh (display, renderData) {
    if (renderData) {
      this.renderData = renderData
    } else {
      this.renderData = []
      forEach(this.renderedEdges, rEdge => {
        this.renderData = this.renderData.concat(rEdge.renderData)
      })
    }

    var lineData = this.line(this.renderData)
    this.lineGraph.attr('d', lineData)
    this.lineGraphFront.attr('d', lineData)
    if (this.lineGraphHalo) this.lineGraphHalo.attr('d', lineData)
    display.styler.styleSegment(display, this)
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

  getLegendType () {
    if (this.type === 'TRANSIT') {
      return this.type + '_' + this.mode
    }
    return this.type
  }

  toString () {
    return `RenderedSegment ${this.id} on ${this.pathSegment ? this.pathSegment.toString() : ' (null segment)'}`
  }
}
