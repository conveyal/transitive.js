import { forEach } from 'lodash'

import { isOutwardVector, lineIntersection } from '../util'

let rEdgeId = 0

/**
 * RenderedEdge
 */

export default class RenderedEdge {
  constructor(graphEdge, forward, type, useGeographicRendering) {
    this.id = rEdgeId++
    this.graphEdge = graphEdge
    this.forward = forward
    this.type = type
    this.points = []
    this.clearOffsets()
    this.focused = true
    this.sortableType = 'SEGMENT'
    this.useGeographicRendering = useGeographicRendering
  }

  clearGraphData() {
    this.graphEdge = null
    this.edgeFromOffset = 0
    this.edgeToOffset = 0
  }

  addPattern(pattern) {
    if (!this.patterns) this.patterns = []
    if (this.patterns.indexOf(pattern) !== -1) return
    this.patterns.push(pattern)

    // generate the patternIds field
    this.patternIds = constuctIdListString(this.patterns)
  }

  addPathSegment(pathSegment) {
    if (!this.pathSegments) this.pathSegments = []
    if (this.pathSegments.indexOf(pathSegment) !== -1) return
    this.pathSegments.push(pathSegment)

    // generate the pathSegmentIds field
    this.pathSegmentIds = constuctIdListString(this.pathSegments)
  }

  getId() {
    return this.id
  }

  getType() {
    return this.type
  }

  setFromOffset(offset) {
    this.fromOffset = offset
  }

  setToOffset(offset) {
    this.toOffset = offset
  }

  clearOffsets() {
    this.fromOffset = 0
    this.toOffset = 0
  }

  getAlignmentVector(alignmentId) {
    if (this.graphEdge.getFromAlignmentId() === alignmentId) {
      return this.graphEdge.fromVector
    }
    if (this.graphEdge.getToAlignmentId() === alignmentId) {
      return this.graphEdge.toVector
    }
    return null
  }

  offsetAlignment(alignmentId, offset) {
    // If from/to alignment IDs match, set respective offset.
    if (this.graphEdge.getFromAlignmentId() === alignmentId) {
      this.setFromOffset(
        isOutwardVector(this.graphEdge.fromVector) ? offset : -offset
      )
    }
    if (this.graphEdge.getToAlignmentId() === alignmentId) {
      this.setToOffset(
        isOutwardVector(this.graphEdge.toVector) ? offset : -offset
      )
    }
  }

  setFocused(focused) {
    this.focused = focused
  }

  refreshRenderData(display) {
    if (
      this.graphEdge.fromVertex.x === this.graphEdge.toVertex.x &&
      this.graphEdge.fromVertex.y === this.graphEdge.toVertex.y
    ) {
      this.renderData = []
      return
    }

    this.lineWidth = this.computeLineWidth(display, true)

    const fromOffsetPx = this.fromOffset * this.lineWidth
    const toOffsetPx = this.toOffset * this.lineWidth

    if (this.useGeographicRendering && this.graphEdge.geomCoords) {
      this.renderData = this.graphEdge.getGeometricCoords(
        fromOffsetPx,
        toOffsetPx,
        display,
        this.forward
      )
    } else {
      this.renderData = this.graphEdge.getRenderCoords(
        fromOffsetPx,
        toOffsetPx,
        display,
        this.forward
      )
    }

    const firstRenderPoint = this.renderData[0]
    const lastRenderPoint = this.renderData[this.renderData.length - 1]

    let pt
    if (!this.graphEdge.fromVertex.isInternal) {
      pt = this.forward ? firstRenderPoint : lastRenderPoint
      if (pt) {
        this.graphEdge.fromVertex.point.addRenderData({
          rEdge: this,
          x: pt.x,
          y: pt.y
        })
      }
    }

    pt = this.forward ? lastRenderPoint : firstRenderPoint
    if (pt) {
      this.graphEdge.toVertex.point.addRenderData({
        rEdge: this,
        x: pt.x,
        y: pt.y
      })
    }

    forEach(this.graphEdge.pointArray, (point, i) => {
      if (point.getType() === 'TURN') return
      const t = (i + 1) / (this.graphEdge.pointArray.length + 1)
      const coord = this.graphEdge.coordAlongEdge(
        this.forward ? t : 1 - t,
        this.renderData,
        display
      )
      if (coord) {
        point.addRenderData({
          rEdge: this,
          x: coord.x,
          y: coord.y
        })
      }
    })
  }

  computeLineWidth(display, includeEnvelope) {
    const styler = display.styler
    if (styler && display) {
      // compute the line width
      const env = styler.compute(styler.segments.envelope, display, this)
      if (env && includeEnvelope) {
        return parseFloat(env.substring(0, env.length - 2), 10) - 2
      } else {
        const lw = styler.compute(
          styler.segments['stroke-width'],
          display,
          this
        )
        return parseFloat(lw.substring(0, lw.length - 2), 10) - 2
      }
    }
  }

  isFocused() {
    return this.focused === true
  }

  getZIndex() {
    return 10000
  }

  /**
   *  Computes the point of intersection between two adjacent, offset RenderedEdges (the
   *  edge the function is called on and a second edge passed as a parameter)
   *  by "extending" the adjacent edges and finding the point of intersection. If
   *  such a point exists, the existing renderData arrays for the edges are
   *  adjusted accordingly, as are any associated stops.
   */

  intersect(rEdge) {
    // do no intersect adjacent edges of unequal bundle size
    if (
      this.graphEdge.renderedEdges.length !==
      rEdge.graphEdge.renderedEdges.length
    ) {
      return
    }

    const commonVertex = this.graphEdge.commonVertex(rEdge.graphEdge)
    if (!commonVertex || commonVertex.point.isSegmentEndPoint) return

    const thisCheck =
      (commonVertex === this.graphEdge.fromVertex && this.forward) ||
      (commonVertex === this.graphEdge.toVertex && !this.forward)
    const otherCheck =
      (commonVertex === rEdge.graphEdge.fromVertex && rEdge.forward) ||
      (commonVertex === rEdge.graphEdge.toVertex && !rEdge.forward)

    const p1 = thisCheck
      ? this.renderData[0]
      : this.renderData[this.renderData.length - 1]
    const v1 = this.graphEdge.getVector(commonVertex)

    const p2 = otherCheck
      ? rEdge.renderData[0]
      : rEdge.renderData[rEdge.renderData.length - 1]
    const v2 = rEdge.graphEdge.getVector(commonVertex)

    if (!p1 || !p2 || !v1 || !v2 || (p1.x === p2.x && p1.y === p2.y)) return

    const isect = lineIntersection(
      p1.x,
      p1.y,
      p1.x + v1.x,
      p1.y - v1.y,
      p2.x,
      p2.y,
      p2.x + v2.x,
      p2.y - v2.y
    )

    if (!isect.intersect) return

    // adjust the endpoint of the first edge
    if (thisCheck) {
      this.renderData[0].x = isect.x
      this.renderData[0].y = isect.y
    } else {
      this.renderData[this.renderData.length - 1].x = isect.x
      this.renderData[this.renderData.length - 1].y = isect.y
    }

    // adjust the endpoint of the second edge
    if (otherCheck) {
      rEdge.renderData[0].x = isect.x
      rEdge.renderData[0].y = isect.y
    } else {
      rEdge.renderData[rEdge.renderData.length - 1].x = isect.x
      rEdge.renderData[rEdge.renderData.length - 1].y = isect.y
    }

    // update the point renderData
    commonVertex.point.addRenderData({
      rEdge: this,
      x: isect.x,
      y: isect.y
    })
  }

  findExtension(vertex) {
    const incidentEdges = vertex.incidentEdges(this.graphEdge)
    const bundlerId = this.patternIds || this.pathSegmentIds
    for (let e = 0; e < incidentEdges.length; e++) {
      const edgeSegments = incidentEdges[e].renderedEdges
      for (let s = 0; s < edgeSegments.length; s++) {
        const segment = edgeSegments[s]
        const otherId = segment.patternIds || segment.pathSegmentIds
        if (bundlerId === otherId) {
          return segment
        }
      }
    }
  }

  toString() {
    return `RenderedEdge ${this.id} type=${
      this.type
    } on ${this.graphEdge.toString()} w/ patterns ${this.patternIds} fwd=${
      this.forward
    }`
  }
}

/**
 * Helper method to construct a merged ID string from a list of items with
 * their own IDs
 */

function constuctIdListString(items) {
  const idArr = []
  forEach(items, (item) => {
    idArr.push(item.getId())
  })
  idArr.sort()
  return idArr.join(',')
}
