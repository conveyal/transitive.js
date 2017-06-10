import d3 from 'd3'

import interpolateLine from '../util/interpolate-line'

/**
 * A path through the network graph. Composed of PathSegments (which
 * are in turn composed of a sequence of graph edges)
 */
export default class NetworkPath {
  /**
   * NetworkPath constructor
   * @param {Object} parent the parent object (a RoutePattern or Journey)
   */

  constructor (parent) {
    this.parent = parent
    this.segments = []
  }

  clearGraphData (segment) {
    this.segments.forEach(function (segment) {
      segment.clearGraphData()
    })
  }

  /**
   * addSegment: add a new segment to the end of this NetworkPath
   */

  addSegment (segment) {
    this.segments.push(segment)
    segment.points.forEach(function (point) {
      point.paths.push(this)
    }, this)
  }

  /** highlight **/

  drawHighlight (display, capExtension) {
    this.line = d3.svg.line() // the line translation function
    .x(function (pointInfo, i) {
      return display.xScale(pointInfo.x) + (pointInfo.offsetX || 0)
    })
      .y(function (pointInfo, i) {
        return display.yScale(pointInfo.y) - (pointInfo.offsetY || 0)
      })
      .interpolate(interpolateLine.bind(this))

    this.lineGraph = display.svg.append('path')
      .attr('id', 'transitive-path-highlight-' + this.parent.getElementId())
      .attr('class', 'transitive-path-highlight')
      .style('stroke-width', 24).style('stroke', '#ff4')
      .style('fill', 'none')
      .style('visibility', 'hidden')
      .data([this])
  }

  getRenderedSegments () {
    var renderedSegments = []
    this.segments.forEach(function (pathSegment) {
      renderedSegments = renderedSegments.concat(pathSegment.renderedSegments)
    })
    return renderedSegments
  }

  /**
   * getPointArray
   */

  getPointArray () {
    var points = []
    for (var i = 0; i < this.segments.length; i++) {
      var segment = this.segments[i]
      if (i > 0 && segment.points[0] === this.segments[i - 1].points[this.segments[i - 1].points.length - 1]) {
        points.concat(segment.points.slice(1))
      } else {
        points.concat(segment.points)
      }
    }
    return points
  }
}
