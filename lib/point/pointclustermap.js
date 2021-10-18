import d3 from 'd3'
import { forEach } from 'lodash'

import { distance } from '../util'

import PointCluster from './pointcluster'
import MultiPoint from './multipoint'

/**
 * Utility class to cluster points into MultiPoint objects
 */

export default class PointClusterMap {
  constructor(transitive) {
    this.transitive = transitive

    this.clusters = []
    this.clusterLookup = {} // maps Point object to its containing cluster

    const pointArr = []
    forEach(
      Object.values(transitive.stops),
      (point) => {
        if (point.used) pointArr.push(point)
      },
      this
    )
    forEach(
      Object.values(transitive.turnPoints),
      (turnPoint) => {
        pointArr.push(turnPoint)
      },
      this
    )

    const links = d3.geom
      .voronoi()
      .x(function (d) {
        return d.worldX
      })
      .y(function (d) {
        return d.worldY
      })
      .links(pointArr)

    forEach(
      links,
      (link) => {
        const dist = distance(
          link.source.worldX,
          link.source.worldY,
          link.target.worldX,
          link.target.worldY
        )
        if (
          dist < 100 &&
          (link.source.getType() !== 'TURN' || link.target.getType() !== 'TURN')
        ) {
          const sourceInCluster = link.source in this.clusterLookup
          const targetInCluster = link.target in this.clusterLookup
          if (sourceInCluster && !targetInCluster) {
            this.addPointToCluster(link.target, this.clusterLookup[link.source])
          } else if (!sourceInCluster && targetInCluster) {
            this.addPointToCluster(link.source, this.clusterLookup[link.target])
          } else if (!sourceInCluster && !targetInCluster) {
            const cluster = new PointCluster()
            this.clusters.push(cluster)
            this.addPointToCluster(link.source, cluster)
            this.addPointToCluster(link.target, cluster)
          }
        }
      },
      this
    )

    this.vertexPoints = []
    forEach(this.clusters, (cluster) => {
      const multipoint = new MultiPoint(cluster.points)
      this.vertexPoints.push(multipoint)
      forEach(cluster.points, (point) => {
        point.multipoint = multipoint
      })
    })
  }

  addPointToCluster(point, cluster) {
    cluster.addPoint(point)
    this.clusterLookup[point] = cluster
  }

  clearMultiPoints() {
    forEach(this.clusters, (cluster) => {
      forEach(cluster.points, (point) => {
        point.multipoint = null
      })
    })
  }

  getVertexPoints(baseVertexPoints) {
    if (!baseVertexPoints) return this.vertexPoints
    const vertexPoints = this.vertexPoints.concat()
    forEach(baseVertexPoints, (point) => {
      if (!point.multipoint) vertexPoints.push(point)
    })
    return vertexPoints
  }
}
