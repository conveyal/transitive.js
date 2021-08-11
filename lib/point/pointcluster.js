import { forEach } from 'lodash'

/**
 * Utility class used when clustering points into MultiPoint objects
 */

export default class PointCluster {
  constructor() {
    this.points = []
  }

  addPoint(point) {
    if (this.points.indexOf(point) === -1) this.points.push(point)
  }

  mergeVertices(graph) {
    const vertices = []
    forEach(this.points, (point) => {
      vertices.push(point.graphVertex)
    })
    graph.mergeVertices(vertices)
  }
}
