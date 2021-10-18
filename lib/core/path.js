/**
 * A path through the network graph. Composed of PathSegments (which
 * are in turn composed of a sequence of graph edges)
 */
export default class NetworkPath {
  /**
   * NetworkPath constructor
   * @param {Object} parent the parent object (a RoutePattern or Journey)
   */

  constructor(parent) {
    this.parent = parent
    this.segments = []
  }

  clearGraphData(segment) {
    this.segments.forEach(function (segment) {
      segment.clearGraphData()
    })
  }

  /**
   * addSegment: add a new segment to the end of this NetworkPath
   */

  addSegment(segment) {
    this.segments.push(segment)
    segment.points.forEach(function (point) {
      point.paths.push(this)
    }, this)
  }

  getRenderedSegments() {
    let renderedSegments = []
    this.segments.forEach(function (pathSegment) {
      renderedSegments = renderedSegments.concat(pathSegment.renderedSegments)
    })
    return renderedSegments
  }

  /**
   * getPointArray
   */

  getPointArray() {
    const points = []
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]
      if (
        i > 0 &&
        segment.points[0] ===
          this.segments[i - 1].points[this.segments[i - 1].points.length - 1]
      ) {
        points.concat(segment.points.slice(1))
      } else {
        points.concat(segment.points)
      }
    }
    return points
  }
}
