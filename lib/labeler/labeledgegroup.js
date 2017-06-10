import { forEach } from 'lodash'

/**
 * LabelEdgeGroup
 */

export default class LabelEdgeGroup {
  constructor (renderedSegment) {
    this.renderedSegment = renderedSegment
    this.renderedEdges = []
  }

  addEdge (rEdge) {
    this.renderedEdges.push(rEdge)
    this.edgeIds = !this.edgeIds ? rEdge.getId() : this.edgeIds + ',' + rEdge.getId()
  }

  getLabelTextArray () {
    var textArray = []
    forEach(this.renderedSegment.pathSegment.getPatterns(), pattern => {
      var shortName = pattern.route.route_short_name
      if (textArray.indexOf(shortName) === -1) textArray.push(shortName)
    })
    return textArray
  }

  getLabelAnchors (display, spacing) {
    var labelAnchors = []
    var renderLen = this.getRenderLength(display)
    var anchorCount = Math.floor(renderLen / spacing)
    var pctSpacing = spacing / renderLen

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
    var renderLen = this.getRenderLength(display)
    var loc = t * renderLen

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

  getRenderLength (display) {
    if (!this.renderLength) {
      this.renderLength = 0
      forEach(this.renderedEdges, rEdge => {
        this.renderLength += rEdge.graphEdge.getRenderLength(display)
      })
    }
    return this.renderLength
  }
}
