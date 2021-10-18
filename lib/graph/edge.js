import { forEach } from 'lodash'

import {
  ccw,
  distance,
  getRadiusFromAngleChord,
  getVectorAngle,
  normalizeVector,
  pointAlongArc,
  rayIntersection
} from '../util'

/**
 * Edge
 */

let edgeId = 0

export default class Edge {
  /**
   * Initialize a new edge
   * @constructor
   * @param {Point[]} pointArray - the internal Points for this Edge
   * @param {Vertex} fromVertex
   * @param {Vertex} toVertex
   */

  constructor(pointArray, fromVertex, toVertex) {
    this.id = edgeId++
    this.pointArray = pointArray
    this.fromVertex = fromVertex
    this.toVertex = toVertex
    this.pathSegments = []
    this.renderedEdges = []
  }

  getId() {
    return this.id
  }

  /**
   *
   */

  getLength() {
    const dx = this.toVertex.x - this.fromVertex.x
    const dy = this.toVertex.y - this.fromVertex.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  getWorldLength() {
    if (!this.worldLength) this.calculateWorldLengthAndMidpoint()
    return this.worldLength
  }

  getWorldMidpoint() {
    if (!this.worldMidpoint) this.calculateWorldLengthAndMidpoint()
    return this.worldMidpoint
  }

  calculateWorldLengthAndMidpoint() {
    const allPoints = [this.fromVertex.point].concat(this.pointArray, [
      this.toVertex.point
    ])
    this.worldLength = 0
    for (var i = 0; i < allPoints.length - 1; i++) {
      this.worldLength += distance(
        allPoints[i].worldX,
        allPoints[i].worldY,
        allPoints[i + 1].worldX,
        allPoints[i + 1].worldY
      )
    }

    if (this.worldLength === 0) {
      this.worldMidpoint = {
        x: this.fromVertex.point.worldX,
        y: this.fromVertex.point.worldY
      }
    } else {
      let distTraversed = 0
      for (i = 0; i < allPoints.length - 1; i++) {
        const dist = distance(
          allPoints[i].worldX,
          allPoints[i].worldY,
          allPoints[i + 1].worldX,
          allPoints[i + 1].worldY
        )
        if ((distTraversed + dist) / this.worldLength >= 0.5) {
          // find the position along this segment (0 <= t <= 1) where the edge midpoint lies
          const t =
            (0.5 - distTraversed / this.worldLength) / (dist / this.worldLength)
          this.worldMidpoint = {
            x:
              allPoints[i].worldX +
              t * (allPoints[i + 1].worldX - allPoints[i].worldX),
            y:
              allPoints[i].worldY +
              t * (allPoints[i + 1].worldY - allPoints[i].worldY)
          }
          this.pointsBeforeMidpoint = i
          this.pointsAfterMidpoint = this.pointArray.length - i
          break
        }
        distTraversed += dist
      }
    }
  }

  /**
   *
   */

  isAxial() {
    return (
      this.toVertex.x === this.fromVertex.x ||
      this.toVertex.y === this.fromVertex.y
    )
  }

  /**
   *
   */

  hasCurvature() {
    return this.elbow !== null
  }

  /**
   *
   */

  replaceVertex(oldVertex, newVertex) {
    if (oldVertex === this.fromVertex) this.fromVertex = newVertex
    if (oldVertex === this.toVertex) this.toVertex = newVertex
  }

  /**
   *  Add a path segment that traverses this edge
   */

  addPathSegment(segment) {
    this.pathSegments.push(segment)
  }

  copyPathSegments(baseEdge) {
    forEach(baseEdge.pathSegments, (pathSegment) => {
      this.addPathSegment(pathSegment)
    })
  }

  getPathSegmentIds(baseEdge) {
    const pathSegIds = this.pathSegments.map((segment) => segment.id)
    pathSegIds.sort()
    return pathSegIds.join(',')
  }

  /**
   *
   */

  addRenderedEdge(rEdge) {
    if (this.renderedEdges.indexOf(rEdge) !== -1) return
    this.renderedEdges.push(rEdge)
  }

  /** internal geometry functions **/

  calculateGeometry(cellSize, angleConstraint) {
    // if(!this.hasTransit()) angleConstraint = 5;
    angleConstraint = angleConstraint || 45

    this.angleConstraintR = (angleConstraint * Math.PI) / 180

    this.fx = this.fromVertex.point.worldX
    this.fy = this.fromVertex.point.worldY
    this.tx = this.toVertex.point.worldX
    this.ty = this.toVertex.point.worldY

    const midpoint = this.getWorldMidpoint()

    const targetFromAngle = getVectorAngle(
      midpoint.x - this.fx,
      midpoint.y - this.fy
    )
    this.constrainedFromAngle =
      Math.round(targetFromAngle / this.angleConstraintR) *
      this.angleConstraintR

    const fromAngleDelta = Math.abs(this.constrainedFromAngle - targetFromAngle)
    this.fvx = Math.cos(this.constrainedFromAngle)
    this.fvy = Math.sin(this.constrainedFromAngle)

    const targetToAngle = getVectorAngle(
      midpoint.x - this.tx,
      midpoint.y - this.ty
    )

    this.constrainedToAngle =
      Math.round(targetToAngle / this.angleConstraintR) * this.angleConstraintR

    const toAngleDelta = Math.abs(this.constrainedToAngle - targetToAngle)
    this.tvx = Math.cos(this.constrainedToAngle)
    this.tvy = Math.sin(this.constrainedToAngle)

    const tol = 0.01
    const v = normalizeVector({
      x: this.toVertex.x - this.fromVertex.x,
      y: this.toVertex.y - this.fromVertex.y
    })

    // check if we need to add curvature
    if (
      !equalVectors(this.fvx, this.fvy, -this.tvx, -this.tvy, tol) ||
      !equalVectors(this.fvx, this.fvy, v.x, v.y, tol)
    ) {
      // see if the default endpoint angles produce a valid intersection
      const isect = this.computeEndpointIntersection()

      if (isect.intersect) {
        // if so, compute the elbow and we're done
        this.elbow = {
          x: this.fx + isect.u * this.fvx,
          y: this.fy + isect.u * this.fvy
        }
      } else {
        // if not, adjust the two endpoint angles until they properly intersect

        // default test: compare angle adjustments (if significant difference)
        if (Math.abs(fromAngleDelta - toAngleDelta) > 0.087) {
          if (fromAngleDelta < toAngleDelta) {
            this.adjustToAngle()
          } else {
            this.adjustFromAngle()
          }
        } else {
          // secondary test: look at distribution of shapepoints
          if (this.pointsAfterMidpoint < this.pointsBeforeMidpoint) {
            this.adjustToAngle()
          } else {
            this.adjustFromAngle()
          }
        }
      }
    }

    this.fromAngle = this.constrainedFromAngle
    this.toAngle = this.constrainedToAngle

    this.calculateVectors()
    this.calculateAlignmentIds()
  }

  /**
   *  Adjust the 'to' endpoint angle by rotating it increments of angleConstraintR
   *  until a valid intersection between the from and to endpoint rays is achieved.
   */

  adjustToAngle() {
    const isCcw = ccw(
      this.fx,
      this.fy,
      this.fx + this.fvx,
      this.fy + this.fvy,
      this.tx,
      this.ty
    )
    const delta = isCcw > 0 ? this.angleConstraintR : -this.angleConstraintR
    let i = 0
    let isect
    while (i++ < 100) {
      this.constrainedToAngle += delta
      this.tvx = Math.cos(this.constrainedToAngle)
      this.tvy = Math.sin(this.constrainedToAngle)
      isect = this.computeEndpointIntersection()
      if (isect.intersect) break
    }
    this.elbow = {
      x: this.fx + isect.u * this.fvx,
      y: this.fy + isect.u * this.fvy
    }
  }

  /**
   *  Adjust the 'from' endpoint angle by rotating it increments of angleConstraintR
   *  until a valid intersection between the from and to endpoint rays is achieved.
   */

  adjustFromAngle() {
    const isCcw = ccw(
      this.tx,
      this.ty,
      this.tx + this.tvx,
      this.ty + this.tvy,
      this.fx,
      this.fy
    )
    const delta = isCcw > 0 ? this.angleConstraintR : -this.angleConstraintR
    let i = 0
    let isect
    while (i++ < 100) {
      this.constrainedFromAngle += delta
      this.fvx = Math.cos(this.constrainedFromAngle)
      this.fvy = Math.sin(this.constrainedFromAngle)
      isect = this.computeEndpointIntersection()
      if (isect.intersect) break
    }
    this.elbow = {
      x: this.fx + isect.u * this.fvx,
      y: this.fy + isect.u * this.fvy
    }
  }

  computeEndpointIntersection() {
    return rayIntersection(
      this.fx,
      this.fy,
      this.fvx,
      this.fvy,
      this.tx,
      this.ty,
      this.tvx,
      this.tvy
    )
  }

  calculateVectors(fromAngle, toAngle) {
    this.fromVector = {
      x: Math.cos(this.fromAngle),
      y: Math.sin(this.fromAngle)
    }

    this.fromleftVector = {
      x: -this.fromVector.y,
      y: this.fromVector.x
    }

    this.fromRightVector = {
      x: this.fromVector.y,
      y: -this.fromVector.x
    }

    this.toVector = {
      x: Math.cos(this.toAngle + Math.PI),
      y: Math.sin(this.toAngle + Math.PI)
    }

    this.toleftVector = {
      x: -this.toVector.y,
      y: this.toVector.x
    }

    this.toRightVector = {
      x: this.toVector.y,
      y: -this.toVector.x
    }
  }

  /**
   *  Compute the 'alignment id', a string that uniquely identifies a line in
   *  2D space given a point and angle relative to the x-axis.
   */

  calculateAlignmentId(x, y, angle) {
    let angleD = Math.round((angle * 180) / Math.PI)
    if (angleD > 90) angleD -= 180
    if (angleD <= -90) angleD += 180

    if (angleD === 90) {
      return '90_x' + x
    }

    // calculate the y-axis crossing
    const ya = Math.round(y - x * Math.tan(angle))
    return angleD + '_y' + ya
  }

  calculateAlignmentIds() {
    this.fromAlignmentId = this.calculateAlignmentId(
      this.fromVertex.x,
      this.fromVertex.y,
      this.fromAngle
    )
    this.toAlignmentId = this.calculateAlignmentId(
      this.toVertex.x,
      this.toVertex.y,
      this.toAngle
    )
  }

  hasTransit(cellSize) {
    // debug(this);
    for (let i = 0; i < this.pathSegments.length; i++) {
      if (this.pathSegments[i].getType() === 'TRANSIT') {
        return true
      }
    }
    return false
  }

  getFromAlignmentId() {
    return this.fromAlignmentId
  }

  getToAlignmentId() {
    return this.toAlignmentId
  }

  getAlignmentRange(alignmentId) {
    let p1, p2
    if (alignmentId === this.fromAlignmentId) {
      p1 = this.fromVertex
      p2 = this.elbow || this.toVertex
    } else if (alignmentId === this.toAlignmentId) {
      p1 = this.toVertex
      p2 = this.elbow || this.fromVertex
    } else {
      return null
    }

    let max, min
    if (alignmentId.substring(0, 2) === '90') {
      min = Math.min(p1.y, p2.y)
      max = Math.max(p1.y, p2.y)
    } else {
      min = Math.min(p1.x, p2.x)
      max = Math.max(p1.x, p2.x)
    }

    return {
      max: max,
      min: min
    }
  }

  align(vertex, vector) {
    if (this.aligned || !this.hasCurvature()) return
    const currentVector = this.getVector(vertex)
    if (
      Math.abs(currentVector.x) !== Math.abs(vector.x) ||
      Math.abs(currentVector.y) !== Math.abs(vector.y)
    ) {
      this.curveAngle = -this.curveAngle
      this.calculateGeometry()
    }
    this.aligned = true
  }

  getGeometricCoords(fromOffsetPx, toOffsetPx, display, forward) {
    const coords = []

    // reverse the coords array if needed
    const geomCoords = forward
      ? this.geomCoords
      : this.geomCoords.concat().reverse()

    forEach(geomCoords, (coord, i) => {
      let fromVector = null
      let toVector = null
      let rightVector
      let xOffset, yOffset
      const x1 = display.xScale.compute(coord[0])
      const y1 = display.yScale.compute(coord[1])

      // calculate the vector leading in to this coordinate
      if (i > 0) {
        const prevCoord = geomCoords[i - 1]
        const x0 = display.xScale.compute(prevCoord[0])
        const y0 = display.yScale.compute(prevCoord[1])
        if (x1 === x0 && y1 === y0) return

        toVector = {
          x: x1 - x0,
          y: y1 - y0
        }
      }

      // calculate the vector leading out from this coordinate
      if (i < geomCoords.length - 1) {
        const nextCoord = geomCoords[i + 1]
        const x2 = display.xScale.compute(nextCoord[0])
        const y2 = display.yScale.compute(nextCoord[1])
        if (x2 === x1 && y2 === y1) return

        fromVector = {
          x: x2 - x1,
          y: y2 - y1
        }
      }

      if (fromVector && !toVector) {
        // the first point in the geomCoords sequence
        rightVector = normalizeVector({
          x: fromVector.y,
          y: -fromVector.x
        })
        xOffset = fromOffsetPx * rightVector.x
        yOffset = fromOffsetPx * rightVector.y
      } else if (!fromVector && toVector) {
        // the last point in the geomCoords sequence
        rightVector = normalizeVector({
          x: toVector.y,
          y: -toVector.x
        })
        xOffset = fromOffsetPx * rightVector.x
        yOffset = fromOffsetPx * rightVector.y
      } else {
        // an internal point
        rightVector = normalizeVector({
          x: fromVector.y,
          y: -fromVector.x
        })
        xOffset = fromOffsetPx * rightVector.x
        yOffset = fromOffsetPx * rightVector.y

        // TODO: properly compute the offsets based on both vectors
      }

      coords.push({
        x: x1 + xOffset,
        y: y1 + yOffset
      })
    })
    return coords
  }

  /**
   * Get render coords for the provided offsets (0 values for offsets imply base
   * render coordinates).
   */
  getRenderCoords(fromOffsetPx, toOffsetPx, display, forward) {
    const isBase = fromOffsetPx === 0 && toOffsetPx === 0

    if (!this.baseRenderCoords && !isBase) {
      this.calculateBaseRenderCoords(display)
    }

    const fromOffsetX = fromOffsetPx * this.fromRightVector.x
    const fromOffsetY = fromOffsetPx * this.fromRightVector.y

    const toOffsetX = toOffsetPx * this.toRightVector.x
    const toOffsetY = toOffsetPx * this.toRightVector.y

    const fx = this.fromVertex.getRenderX(display) + fromOffsetX
    const fy = this.fromVertex.getRenderY(display) - fromOffsetY
    const fvx = this.fromVector.x
    const fvy = -this.fromVector.y

    const tx = this.toVertex.getRenderX(display) + toOffsetX
    const ty = this.toVertex.getRenderY(display) - toOffsetY
    const tvx = -this.toVector.x
    const tvy = this.toVector.y

    const coords = []

    // append the first ('from') coordinate
    coords.push({
      x: forward ? fx : tx,
      y: forward ? fy : ty
    })

    let len = null
    let x1
    let y1
    let x2
    let y2

    // determine if this edge has an elbow, i.e. a bend in the middle
    if (
      (isBase && !this.isStraight()) ||
      (!isBase && this.baseRenderCoords.length === 4)
    ) {
      const isect = rayIntersection(fx, fy, fvx, fvy, tx, ty, tvx, tvy)
      if (isect.intersect) {
        const u = isect.u
        const ex = fx + fvx * u
        const ey = fy + fvy * u

        this.ccw = ccw(fx, fy, ex, ey, tx, ty)

        // calculate the angle of the arc
        const angleR = this.getElbowAngle()

        // calculate the radius of the arc in pixels, taking offsets into consideration
        const rPx =
          this.getBaseRadiusPx() - (this.ccw * (fromOffsetPx + toOffsetPx)) / 2

        // calculate the distance from the elbow to place the arc endpoints in each direction
        let d = rPx * Math.tan(angleR / 2)

        // make sure the arc endpoint placement distance is not longer than the either of the
        // elbow-to-edge-endpoint distances
        const l1 = distance(fx, fy, ex, ey)
        const l2 = distance(tx, ty, ex, ey)
        d = Math.min(Math.min(l1, l2), d)

        x1 = ex - this.fromVector.x * d
        y1 = ey + this.fromVector.y * d

        x2 = ex + this.toVector.x * d
        y2 = ey - this.toVector.y * d

        const radius = getRadiusFromAngleChord(angleR, distance(x1, y1, x2, y2))
        const arc = angleR * (180 / Math.PI) * (this.ccw < 0 ? 1 : -1)

        if (forward) {
          coords.push({
            len: distance(fx, fy, x1, y1),
            x: x1,
            y: y1
          })

          coords.push({
            arc: arc,
            ex,
            ey,
            len: angleR * radius,
            radius: radius,
            x: x2,
            y: y2
          })

          len = distance(x2, y2, tx, ty)
        } else {
          // backwards traversal
          coords.push({
            len: distance(tx, ty, x2, y2),
            x: x2,
            y: y2
          })

          coords.push({
            arc: -arc,
            len: angleR * radius,
            radius: radius,
            x: x1,
            y: y1
          })

          len = distance(x1, y1, fx, fy)
        }
      }
    }

    // if the length wasn't calculated during elbow-creation, do it now
    if (len === null) len = distance(fx, fy, tx, ty)

    // append the final ('to') coordinate
    coords.push({
      len: len,
      x: forward ? tx : fx,
      y: forward ? ty : fy
    })

    return coords
  }

  calculateBaseRenderCoords(display) {
    this.baseRenderCoords = this.getRenderCoords(0, 0, display, true)
  }

  isStraight() {
    const tol = 0.00001
    return (
      Math.abs(this.fromVector.x - this.toVector.x) < tol &&
      Math.abs(this.fromVector.y - this.toVector.y) < tol
    )
  }

  getBaseRadiusPx() {
    return 15
  }

  getElbowAngle() {
    const cx = this.fromVector.x - this.toVector.x
    const cy = this.fromVector.y - this.toVector.y

    const c = Math.sqrt(cx * cx + cy * cy) / 2

    const theta = Math.asin(c)

    return theta * 2
  }

  getRenderLength(display) {
    if (!this.baseRenderCoords) this.calculateBaseRenderCoords(display)

    if (!this.renderLength) {
      this.renderLength = 0
      for (let i = 1; i < this.baseRenderCoords.length; i++) {
        this.renderLength += this.baseRenderCoords[i].len
      }
    }
    return this.renderLength
  }

  /**
   * Retrieve the coordinate located at a defined percentage along an Edge's length.
   * @param {Number} t - a value between 0 and 1 representing the location of the
   *   point to be computed
   * @param {Object[]} coords - the offset coordinates computed for this edge.
   * @param {Display} display
   * @returns {Object} - the coordinate as an {x,y} Object
   */
  coordAlongEdge(t, coords, display) {
    if (!this.baseRenderCoords) {
      this.calculateBaseRenderCoords(display)
    }

    if (coords.length !== this.baseRenderCoords.length) {
      // If the render edge coordinates do not match the base render coordinates,
      // get coordinate along "offset edge."
      return this.coordAlongOffsetEdge(t, coords, display)
    }

    // get the length of this edge in screen units using the "base" (i.e. un-offset) render coords
    const len = this.getRenderLength()
    // the target distance along the Edge's base geometry
    const loc = t * len
    return this.coordAlongRefEdge(loc, coords, this.baseRenderCoords)
  }

  /**
   * Get coordinate along "offset edge."
   * @param {[type]} t - a value between 0 and 1 representing the location of the
   *   point to be computed
   * @param {Object[]} coords - the offset coordinates computed for this edge.
   * @returns {Object} - the coordinate as an {x,y} Object
   */
  coordAlongOffsetEdge(t, coords) {
    // Get total length of edge by summing inter-coordinate distances.
    let len = 0
    for (let i = 1; i < coords.length; i++) {
      const c0 = coords[i - 1]
      const c = coords[i]
      if (!c.len) {
        // If length between coord not available, calculate.
        c.len = distance(c0.x, c0.y, c.x, c.y)
      }
      len += c.len
    }
    // the target distance along the Edge's base geometry
    const loc = t * len
    return this.coordAlongRefEdge(loc, coords)
  }

  /**
   * Iterate over reference coordinates (which default to input coords) to find
   * the coordinate along the edge at distance along edge.
   * @param  {[type]} targetDistance - target distance along edge's base geometry
   * @param  {[type]} coords - coordinates for edge
   * @param  {[type]} [refCoordinates=coords] - reference coordinates to use for
   *                                            distance. Defaults to coords.
   * @returns {Object} - the coordinate as an {x,y} Object
   */
  coordAlongRefEdge(targetDistance, coords, refCoordinates = coords) {
    // our current location along the edge (in world units)
    let currentLocation = 0
    for (let i = 1; i < refCoordinates.length; i++) {
      const distanceToNextCoord = refCoordinates[i].len
      const { arc, radius, x, y } = coords[i]
      if (targetDistance < currentLocation + distanceToNextCoord) {
        // Location falls within the previous and next coordinates. Calculate
        // percentage along segment.
        const percentAlong =
          (targetDistance - currentLocation) / distanceToNextCoord
        if (arc) {
          // Generate coordinate on arc segment
          const theta = (Math.PI * arc) / 180
          const [c0, c1, c2] = coords
          const isCcw = ccw(c0.x, c0.y, c1.x, c1.y, c2.x, c2.y)
          return pointAlongArc(
            c1.x,
            c1.y,
            c2.x,
            c2.y,
            radius,
            theta,
            isCcw,
            percentAlong
          )
        } else {
          // Generate coordinate on straight segment
          const dx = x - coords[i - 1].x
          const dy = y - coords[i - 1].y
          return {
            x: coords[i - 1].x + dx * percentAlong,
            y: coords[i - 1].y + dy * percentAlong
          }
        }
      }
      currentLocation += distanceToNextCoord
    }
  }

  clearRenderData() {
    this.baseRenderCoords = null
    this.renderLength = null
  }

  getVector(vertex) {
    if (vertex === this.fromVertex) return this.fromVector
    if (vertex === this.toVertex) return this.toVector
  }

  /**
   *  Gets the vertex opposite another vertex on an edge
   */

  oppositeVertex(vertex) {
    if (vertex === this.toVertex) return this.fromVertex
    if (vertex === this.fromVertex) return this.toVertex
    return null
  }

  commonVertex(edge) {
    if (
      this.fromVertex === edge.fromVertex ||
      this.fromVertex === edge.toVertex
    ) {
      return this.fromVertex
    }
    if (this.toVertex === edge.fromVertex || this.toVertex === edge.toVertex) {
      return this.toVertex
    }
    return null
  }

  /**
   *
   */

  setPointLabelPosition(pos, skip) {
    if (this.fromVertex.point !== skip) {
      this.fromVertex.point.labelPosition = pos
    }
    if (this.toVertex.point !== skip) this.toVertex.point.labelPosition = pos

    forEach(this.pointArray, (point) => {
      if (point !== skip) point.labelPosition = pos
    })
  }

  /**
   *  Determines if this edge is part of a standalone, non-transit path
   *  (e.g. a walk/bike/drive-only journey)
   */

  isNonTransitPath() {
    return (
      this.pathSegments.length === 1 &&
      this.pathSegments[0] !== 'TRANSIT' &&
      this.pathSegments[0].path.segments.length === 1
    )
  }

  /**
   *
   */

  toString() {
    return (
      'Edge ' +
      this.getId() +
      ' (' +
      this.fromVertex.toString() +
      ' to ' +
      this.toVertex.toString() +
      ')'
    )
  }
}

/** helper functions **/

function equalVectors(x1, y1, x2, y2, tol) {
  tol = tol || 0
  return Math.abs(x1 - x2) < tol && Math.abs(y1 - y2) < tol
}
