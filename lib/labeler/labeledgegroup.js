import { forEach } from 'lodash'

/**
 * LabelEdgeGroup
 */

export default class LabelEdgeGroup {
  constructor(renderedSegment) {
    this.renderedSegment = renderedSegment
    this.renderedEdges = []
  }

  addEdge(rEdge) {
    this.renderedEdges.push(rEdge)
    this.edgeIds = !this.edgeIds
      ? rEdge.getId()
      : this.edgeIds + ',' + rEdge.getId()
  }

  getLabelTextArray() {
    const textArray = []
    forEach(this.renderedSegment.pathSegment.getPatterns(), (pattern) => {
      const shortName = pattern.route.route_short_name
      if (textArray.indexOf(shortName) === -1) textArray.push(shortName)
    })
    return textArray
  }

  /**
   * Find the potential anchors for a label given a display and spacing.
   * @param  {Display} display
   * @param  {Number} spacing - spacing needed for label placement (i.e., label
   *                            height with buffer)
   */
  getLabelAnchors(display, spacing) {
    const labelAnchors = []
    const renderLen = this.getRenderLength(display)
    // Determine how many anchors might fit along length.
    const anchorCount = Math.floor(renderLen / spacing)
    const pctSpacing = spacing / renderLen

    for (let i = 0; i < anchorCount; i++) {
      // Calculate potential position of anchor.
      const t =
        i % 2 === 0
          ? 0.5 + (i / 2) * pctSpacing
          : 0.5 - ((i + 1) / 2) * pctSpacing
      // Attempt to find coordinate along path for potential anchor.
      const coord = this.coordAlongRenderedPath(t, display)
      if (coord) labelAnchors.push(coord)
    }

    return labelAnchors
  }

  /**
   * Get the coordinate located at a defined percentage along along a rendered path.
   * @param {Number} t - a value between 0 and 1 representing the location of the
   *   point to be computed
   * @param {Display} display
   * @returns {Object} - the coordinate as an {x,y} Object
   */
  coordAlongRenderedPath(t, display) {
    const renderLen = this.getRenderLength(display)
    // Get location along path.
    const loc = t * renderLen

    // Iterate over each edge in path, accumulating distance as we go.
    let cur = 0
    for (let i = 0; i < this.renderedEdges.length; i++) {
      const rEdge = this.renderedEdges[i]
      const edgeRenderLen = rEdge.graphEdge.getRenderLength(display)
      if (loc <= cur + edgeRenderLen) {
        // If location is along this edge, find and return the position along
        // the edge.
        const t2 = (loc - cur) / edgeRenderLen
        const coord = rEdge.graphEdge.coordAlongEdge(
          t2,
          rEdge.renderData,
          display
        )
        return coord
      }
      cur += edgeRenderLen
    }
  }

  /**
   * Get the total render length for the edge group, which consists of the sum
   * of each graph edge length.
   */
  getRenderLength(display) {
    if (!this.renderLength) {
      this.renderLength = 0
      forEach(this.renderedEdges, (rEdge) => {
        this.renderLength += rEdge.graphEdge.getRenderLength(display)
      })
    }
    return this.renderLength
  }
}
