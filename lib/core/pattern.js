import { forEach } from 'lodash'

import { decode } from '../util/polyline.js'
import { sm } from '../util'

import NetworkPath from './path'
import PathSegment from './pathsegment'

/**
 * A RoutePattern
 */
export default class RoutePattern {
  /**
   * RoutePattern constructor
   *
   * @param {Object} RoutePattern data object from the transitive.js input
   */

  constructor(data, transitive) {
    for (const key in data) {
      if (key === 'stops') continue
      this[key] = data[key]
    }

    // the array of Stops that make up this pattern
    this.stops = []

    // the inter-stop geometry, an array of point sequences (themselves arrays)
    // that represent the geometry between stops i and i+1. This array should be
    // exactly one item shorter than the stops array.
    this.interStopGeometry = []

    if (transitive) {
      forEach(data.stops, (stop) => {
        // look up the Stop in the master collection and add to the stops array
        this.stops.push(transitive.stops[stop.stop_id])

        // if inter-stop geometry is provided: decode polyline, convert points
        // to SphericalMercator, and add to the interStopGeometry array
        if (stop.geometry) {
          const latLons = decode(stop.geometry)
          const coords = []
          forEach(latLons, (latLon) => {
            coords.push(sm.forward([latLon[1], latLon[0]]))
          })
          this.interStopGeometry.push(coords)
        }
      })
    }

    this.renderedEdges = []
  }

  getId() {
    return this.pattern_id
  }

  getElementId() {
    return 'pattern-' + this.pattern_id
  }

  getName() {
    return this.pattern_name
  }

  addRenderedEdge(rEdge) {
    if (this.renderedEdges.indexOf(rEdge) === -1) this.renderedEdges.push(rEdge)
  }

  offsetAlignment(alignmentId, offset) {
    forEach(this.renderedEdges, (rEdge) => {
      rEdge.offsetAlignment(alignmentId, offset)
    })
  }

  createPath() {
    const path = new NetworkPath(this)
    const pathSegment = new PathSegment('TRANSIT', path)
    pathSegment.addPattern(this, 0, this.stops.length - 1)
    path.addSegment(pathSegment)
    return path
  }
}
