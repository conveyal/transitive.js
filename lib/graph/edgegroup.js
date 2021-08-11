import PriorityQueue from 'priorityqueuejs'

import { distance, angleFromThreePoints } from '../util'

/**
 *  A group of edges that share the same endpoint vertices
 */

export default class EdgeGroup {
  constructor(fromVertex, toVertex, type) {
    this.fromVertex = fromVertex
    this.toVertex = toVertex
    this.type = type
    this.edges = []
    this.commonPoints = null
    this.worldLength = 0
  }

  addEdge(edge) {
    this.edges.push(edge)
    edge.edgeGroup = this

    // update the groups worldLength
    this.worldLength = Math.max(this.worldLength, edge.getWorldLength())

    if (this.commonPoints === null) {
      // if this is first edge added, initialize group's commonPoint array to include all of edge's points
      this.commonPoints = edge.pointArray.slice()
    } else {
      // otherwise, update commonPoints array to only include those in added edge
      this.commonPoints = this.commonPoints.concat(
        edge.pointArray.filter((pt) => this.commonPoints.indexOf(pt) !== -1)
      )
    }
  }

  getWorldLength() {
    return this.worldLength
  }

  getInternalVertexPQ() {
    // create an array of all points on the edge (endpoints and internal)
    const allPoints = [this.fromVertex.point].concat(this.commonPoints, [
      this.toVertex.point
    ])

    const pq = new PriorityQueue(function (a, b) {
      return a.weight - b.weight
    })

    for (let i = 1; i < allPoints.length - 1; i++) {
      const weight = this.getInternalVertexWeight(allPoints, i)
      pq.enq({
        point: allPoints[i],
        weight: weight
      })
    }

    return pq
  }

  getInternalVertexWeight(pointArray, index) {
    const x1 = pointArray[index - 1].worldX
    const y1 = pointArray[index - 1].worldY
    const x2 = pointArray[index].worldX
    const y2 = pointArray[index].worldY
    const x3 = pointArray[index + 1].worldX
    const y3 = pointArray[index + 1].worldY

    // the weighting function is a combination of:
    // - the distances from this internal point to the two adjacent points, normalized for edge length (longer distances are prioritized)
    // - the angle formed by this point and the two adjacent ones ('sharper' angles are prioritized)
    const inDist = distance(x1, y1, x2, y2)
    const outDist = distance(x2, y2, x3, y3)
    const theta = angleFromThreePoints(x1, y1, x2, y2, x3, y3)
    const edgeLen = this.getWorldLength()
    const weight =
      inDist / edgeLen + outDist / edgeLen + Math.abs(Math.PI - theta) / Math.PI

    return weight
  }

  hasTransit() {
    for (let i = 0; i < this.edges.length; i++) {
      if (this.edges[i].hasTransit()) return true
    }
    return false
  }

  isNonTransitPath() {
    return this.edges.length === 1 && this.edges[0].isNonTransitPath()
  }

  getTurnPoints(maxAngle) {
    maxAngle = maxAngle || 0.75 * Math.PI
    return this.commonPoints.filter(
      (pt) => pt.getType() === 'TURN' && Math.abs(pt.turnAngle) < maxAngle
    )
  }
}
