import { forEach } from 'lodash'
import Emitter from 'component-emitter'

import Stop from '../point/stop'
import Place from '../point/place'
import PointClusterMap from '../point/pointclustermap'
import RenderedEdge from '../renderer/renderededge'
import RenderedSegment from '../renderer/renderedsegment'
import Graph from '../graph/graph'
import { decode } from '../util/polyline.js'
import { sm } from '../util'

import Journey from './journey'
import RoutePattern from './pattern'
import Route from './route'

const debug = require('debug')('transitive:network')

/**
 * Network
 */
export default class Network {
  constructor(transitive, data) {
    this.transitive = transitive

    this.routes = {}
    this.stops = {}
    this.patterns = {}
    this.places = {}
    this.journeys = {}
    this.paths = []
    this.baseVertexPoints = []
    this.graph = new Graph(this, [])

    if (data) this.load(data)
  }

  /**
   * Load
   *
   * @param {Object} data
   */

  load(data) {
    debug('loading', data)

    // check data
    if (!data) data = {}

    // Store data
    this.data = data

    // A list of points (stops & places) that will always become vertices in the network
    // graph (regardless of zoom scale). This includes all points that serve as a segment
    // endpoint and/or a convergence/divergence point between segments
    this.baseVertexPoints = []

    // object maps stop ids to arrays of unique stop_ids reachable from that stop
    this.adjacentStops = {}

    // maps lat_lon key to unique TurnPoint object
    this.turnPoints = {}

    // Copy/decode the streetEdge objects
    this.streetEdges = {}
    forEach(data.streetEdges, (streetEdgeData) => {
      const latLons = decode(streetEdgeData.geometry.points)
      const coords = []
      forEach(latLons, (latLon) => {
        coords.push(sm.forward([latLon[1], latLon[0]]))
      })
      this.streetEdges[streetEdgeData.edge_id] = {
        latLons: latLons,
        length: streetEdgeData.geometry.length,
        worldCoords: coords
      }
    })

    // Generate the route objects
    this.routes = {}
    forEach(data.routes, (routeData) => {
      this.routes[routeData.route_id] = new Route(routeData)
    })

    // Generate the stop objects
    this.stops = {}
    forEach(data.stops, (stopData) => {
      this.stops[stopData.stop_id] = new Stop(stopData)
    })

    // Generate the pattern objects
    this.patterns = {}
    forEach(data.patterns, (patternData) => {
      const pattern = new RoutePattern(patternData, this)
      this.patterns[patternData.pattern_id] = pattern
      const route = this.routes[patternData.route_id]
      if (route) {
        route.addPattern(pattern)
        pattern.route = route
      } else {
        debug(
          'Error: pattern ' +
            patternData.pattern_id +
            ' refers to route that was not found: ' +
            patternData.route_id
        )
      }
      if (pattern.render) this.paths.push(pattern.createPath())
    })

    // Generate the place objects
    this.places = {}
    forEach(data.places, (placeData) => {
      const place = (this.places[placeData.place_id] = new Place(
        placeData,
        this
      ))
      this.addVertexPoint(place)
    })

    // Generate the internal Journey objects
    this.journeys = {}
    forEach(data.journeys, (journeyData) => {
      const journey = new Journey(journeyData, this)
      this.journeys[journeyData.journey_id] = journey
      this.paths.push(journey.path)
    })

    // process the path segments
    for (let p = 0; p < this.paths.length; p++) {
      const path = this.paths[p]
      for (let s = 0; s < path.segments.length; s++) {
        this.processSegment(path.segments[s])
      }
    }

    // when rendering pattern paths only, determine convergence/divergence vertex
    // stops by looking for stops w/ >2 adjacent stops
    if (!data.journeys || data.journeys.length === 0) {
      for (const stopId in this.adjacentStops) {
        if (this.adjacentStops[stopId].length > 2) {
          this.addVertexPoint(this.stops[stopId])
        }
      }
    }

    // determine which TurnPoints should be base vertices
    const turnLookup = {}
    const addTurn = function (turn1, turn2) {
      if (!(turn1.getId() in turnLookup)) turnLookup[turn1.getId()] = []
      if (turnLookup[turn1.getId()].indexOf(turn2) === -1) {
        turnLookup[turn1.getId()].push(turn2)
      }
    }
    forEach(Object.values(this.streetEdges), (streetEdge) => {
      if (streetEdge.fromTurnPoint && streetEdge.toTurnPoint) {
        addTurn(streetEdge.toTurnPoint, streetEdge.fromTurnPoint)
        addTurn(streetEdge.fromTurnPoint, streetEdge.toTurnPoint)
      }
    })
    for (const turnPointId in turnLookup) {
      const count = turnLookup[turnPointId].length
      if (count > 2) this.addVertexPoint(this.turnPoints[turnPointId])
    }

    this.createGraph()

    this.loaded = true
    this.emit('load', this)
    return this
  }

  /** Graph Creation/Processing Methods **/

  clearGraphData() {
    forEach(this.paths, (path) => {
      path.clearGraphData()
    })
  }

  createGraph() {
    this.applyZoomFactors(this.transitive.display.activeZoomFactors)

    // clear previous graph-specific data
    if (this.pointClusterMap) this.pointClusterMap.clearMultiPoints()
    forEach(Object.values(this.stops), (stop) => {
      stop.setFocused(true)
    })

    // create the list of vertex points
    let vertexPoints
    if (this.mergeVertexThreshold && this.mergeVertexThreshold > 0) {
      this.pointClusterMap = new PointClusterMap(
        this,
        this.mergeVertexThreshold
      )
      vertexPoints = this.pointClusterMap.getVertexPoints(this.baseVertexPoints)
    } else vertexPoints = this.baseVertexPoints

    // core graph creation steps
    this.graph = new Graph(this, vertexPoints)
    this.populateGraphEdges()
    this.graph.pruneVertices()
    this.createInternalVertexPoints()
    if (this.isSnapping()) this.graph.snapToGrid(this.gridCellSize)
    this.graph.sortVertices()

    // other post-processing actions
    this.annotateTransitPoints()
    // this.initPlaceAdjacency();
    this.createRenderedSegments()
    this.transitive.labeler.updateLabelList(this.graph)
    this.updateGeometry(true)
  }

  isSnapping() {
    return this.gridCellSize && this.gridCellSize !== 0
  }

  /*
   * identify and populate the 'internal' vertex points, which is zoom-level specfic
   */

  createInternalVertexPoints() {
    this.internalVertexPoints = []

    for (const i in this.graph.edgeGroups) {
      const edgeGroup = this.graph.edgeGroups[i]

      const wlen = edgeGroup.getWorldLength()

      const splitPoints = []

      // compute the maximum number of internal points for this edge to add as graph vertices
      if (edgeGroup.hasTransit()) {
        const vertexFactor = this.internalVertexFactor //! edgeGroup.hasTransit() ? 1 : this.internalVertexFactor;
        const newVertexCount = Math.floor(wlen / vertexFactor)

        // get the priority queue of the edge's internal points
        const pq = edgeGroup.getInternalVertexPQ()

        // pull the 'best' points from the queue until we reach the maximum
        while (splitPoints.length < newVertexCount && pq.size() > 0) {
          const el = pq.deq()
          splitPoints.push(el.point)
        }
      }

      // perform the split operation (if needed)
      if (splitPoints.length > 0) {
        for (let e = 0; e < edgeGroup.edges.length; e++) {
          const edge = edgeGroup.edges[e]
          this.graph.splitEdgeAtInternalPoints(edge, splitPoints)
        }
      } else if (edgeGroup.hasTransit()) {
        // special case: transit edge with no internal vertices (i.e. intermediate stops)
        edgeGroup.edges.forEach((edge) => {
          if (edge.pointGeom && edge.pointGeom.length > 0) {
            edge.geomCoords = edge.pointGeom[0].slice(0)
          }
        })
      }
    }
  }

  updateGeometry() {
    // clear the stop render data
    // for (var key in this.stops) this.stops[key].renderData = [];

    this.graph.vertices.forEach(function (vertex) {
      // vertex.snapped = false;
      vertex.point.clearRenderData()
    })

    // refresh the edge-based points
    this.graph.edges.forEach(function (edge) {
      edge.pointArray.forEach(function (point) {
        point.clearRenderData()
      })
    })

    this.renderedEdges.forEach(function (rEdge) {
      rEdge.clearOffsets()
    })

    // if (snapGrid)
    // if(this.gridCellSize && this.gridCellSize !== 0) this.graph.snapToGrid(this.gridCellSize);

    // this.fixPointOverlaps();

    this.graph.calculateGeometry(this.gridCellSize, this.angleConstraint)

    this.graph.apply2DOffsets(this)
  }

  applyZoomFactors(factors) {
    this.gridCellSize = factors.gridCellSize
    this.internalVertexFactor = factors.internalVertexFactor
    this.angleConstraint = factors.angleConstraint
    this.mergeVertexThreshold = factors.mergeVertexThreshold
    this.useGeographicRendering = factors.useGeographicRendering
  }

  /**
   *
   */

  processSegment(segment) {
    // iterate through this pattern's stops, associating stops/patterns with
    // each other and initializing the adjacentStops table
    let previousStop = null
    for (let i = 0; i < segment.points.length; i++) {
      const point = segment.points[i]
      point.used = true

      // called for each pair of adjacent stops in sequence
      if (previousStop && point.getType() === 'STOP') {
        this.addStopAdjacency(point.getId(), previousStop.getId())
        this.addStopAdjacency(previousStop.getId(), point.getId())
      }

      previousStop = point.getType() === 'STOP' ? point : null

      // add the start and end points to the vertexStops collection
      const startPoint = segment.points[0]
      this.addVertexPoint(startPoint)
      startPoint.isSegmentEndPoint = true

      const endPoint = segment.points[segment.points.length - 1]
      this.addVertexPoint(endPoint)
      endPoint.isSegmentEndPoint = true
    }
  }

  /**
   * Helper function for stopAjacency table
   *
   * @param {Stop} adjacent stops list
   * @param {Stop} stopA
   * @param {Stop} stopB
   */

  addStopAdjacency(stopIdA, stopIdB) {
    if (!this.adjacentStops[stopIdA]) this.adjacentStops[stopIdA] = []
    if (this.adjacentStops[stopIdA].indexOf(stopIdB) === -1) {
      this.adjacentStops[stopIdA].push(stopIdB)
    }
  }

  /**
   * Populate the graph edges
   */

  populateGraphEdges() {
    // vertex associated with the last vertex point we passed in this sequence
    let lastVertex = null

    // collection of 'internal' (i.e. non-vertex) points passed
    // since the last vertex point
    let internalPoints = []

    forEach(this.paths, (path) => {
      forEach(path.segments, (segment) => {
        lastVertex = null

        let streetEdgeIndex = 0

        // for transit segments, see if there is a pattern with inter-stop geometry defined
        let representativePattern = null
        if (segment.type === 'TRANSIT') {
          for (let i = 0; i < segment.patternGroup.patterns.length; i++) {
            const pattern = segment.patternGroup.patterns[i]
            if (
              pattern.interStopGeometry &&
              pattern.interStopGeometry.length === pattern.stops.length - 1
            ) {
              representativePattern = pattern
              break
            }
          }
        }

        /**
         *  geomCoords: The geographic coordinates for the graph edge currently
         *  being constructed, used when rendering edges in "real-world" (i.e.
         *  non-schematic) mode. geomCoords data is only initialized here for
         *  street-based segments, using the segment's embedded street geometry
         *  data (if provided).
         */
        let geomCoords = []

        /**
         *  pointGeom: An array of point-specific geometry (i.e. the alignment
         *  connecting this point to the following point in the containing
         *  segment's point sequence. Currently applies to transit segments only.
         *  pointGeom data is converted to geomCoords for rendering in the
         *  splitEdgeAtInternalPoints method of NetworkGraph
         */
        let pointGeom = []

        forEach(segment.points, (point, index) => {
          if (segment.streetEdges) {
            // street-based segment with street-edge geometry
            for (let i = streetEdgeIndex; i < segment.streetEdges.length; i++) {
              if (index === 0) break

              geomCoords = geomCoords.concat(
                geomCoords.length > 0
                  ? segment.streetEdges[i].worldCoords.slice(1)
                  : segment.streetEdges[i].worldCoords
              )
              if (segment.streetEdges[i].toTurnPoint === point) {
                streetEdgeIndex = i + 1
                break
              }
            }
          } else if (representativePattern) {
            // transit-based segment with known geometry
            const fromIndex = segment.patternGroup.getFromIndex(
              representativePattern
            )

            // ignore the first stop, since the geometry at this index represents
            // the alignment leading into that stop
            if (index > 0) {
              // add the alignment extending from this stop to the pointGeom array
              const geom =
                representativePattern.interStopGeometry[fromIndex + index - 1]
              pointGeom.push(geom)
            }
          }

          if (point.multipoint) point = point.multipoint

          if (point.graphVertex) {
            // this is a vertex point
            if (lastVertex !== null) {
              if (lastVertex.point === point) return

              // see if an equivalent graph edge already exists
              const fromVertex = lastVertex
              const toVertex = point.graphVertex
              let edge = this.graph.getEquivalentEdge(
                internalPoints,
                fromVertex,
                toVertex
              )

              // create a new graph edge if necessary
              if (!edge) {
                edge = this.graph.addEdge(
                  internalPoints,
                  fromVertex,
                  toVertex,
                  segment.getType()
                )
                if (geomCoords && geomCoords.length > 0) {
                  edge.geomCoords = geomCoords
                }
                if (pointGeom && pointGeom.length > 0) {
                  edge.pointGeom = pointGeom
                }
              }

              // associate the graph edge and path segment with each other
              segment.addEdge(edge, fromVertex)
              edge.addPathSegment(segment)

              // reset the geomCoords and pointGeom arrays for the next edge
              geomCoords = []
              pointGeom = []
            }

            lastVertex = point.graphVertex
            internalPoints = []
          } else {
            // this is an internal point
            internalPoints.push(point)
          }
        })
      })
    })
  }

  createGraphEdge(segment, fromVertex, toVertex, internalPoints, geomCoords) {
    let edge = this.graph.getEquivalentEdge(
      internalPoints,
      fromVertex,
      toVertex
    )

    if (!edge) {
      edge = this.graph.addEdge(
        internalPoints,
        fromVertex,
        toVertex,
        segment.getType()
      )

      // calculate the angle and apply to edge stops
      /* var dx = fromVertex.x - toVertex.x;
      var dy = fromVertex.y - toVertex.y;
      var angle = Math.atan2(dy, dx) * 180 / Math.PI;
      point.angle = lastVertex.point.angle = angle;
      for (var is = 0; is < internalPoints.length; is++) {
        internalPoints[is].angle = angle;
      } */

      if (geomCoords) edge.geomCoords = geomCoords

      debug('--- created edge ' + edge.toString())
    }

    segment.addEdge(edge, fromVertex)
    edge.addPathSegment(segment)
  }

  annotateTransitPoints() {
    this.paths.forEach(function (path) {
      const transitSegments = []
      path.segments.forEach(function (pathSegment) {
        if (pathSegment.type === 'TRANSIT') transitSegments.push(pathSegment)
      })

      path.segments.forEach(function (pathSegment) {
        if (pathSegment.type === 'TRANSIT') {
          // if first transit segment in path, mark 'from' endpoint as board point
          if (transitSegments.indexOf(pathSegment) === 0) {
            pathSegment.points[0].isBoardPoint = true

            // if there are additional transit segments, mark the 'to' endpoint as a transfer point
            if (transitSegments.length > 1) {
              pathSegment.points[
                pathSegment.points.length - 1
              ].isTransferPoint = true
            }

            // if last transit segment in path, mark 'to' endpoint as alight point
          } else if (
            transitSegments.indexOf(pathSegment) ===
            transitSegments.length - 1
          ) {
            pathSegment.points[
              pathSegment.points.length - 1
            ].isAlightPoint = true

            // if there are additional transit segments, mark the 'from' endpoint as a transfer point
            if (transitSegments.length > 1) {
              pathSegment.points[0].isTransferPoint = true
            }

            // if this is an 'internal' transit segment, mark both endpoints as transfer points
          } else if (transitSegments.length > 2) {
            pathSegment.points[0].isTransferPoint = true
            pathSegment.points[
              pathSegment.points.length - 1
            ].isTransferPoint = true
          }
        }
      })
    })
  }

  initPlaceAdjacency() {
    forEach(Object.values(this.places), (place) => {
      if (!place.graphVertex) return
      forEach(place.graphVertex.incidentEdges(), (edge) => {
        const oppVertex = edge.oppositeVertex(place.graphVertex)
        if (oppVertex.point) {
          oppVertex.point.adjacentPlace = place
        }
      })
    })
  }

  createRenderedSegments() {
    this.reLookup = {}
    this.renderedEdges = []
    this.renderedSegments = []

    for (const patternId in this.patterns) {
      this.patterns[patternId].renderedEdges = []
    }

    forEach(this.paths, (path) => {
      forEach(path.segments, (pathSegment) => {
        pathSegment.renderedSegments = []

        if (pathSegment.type === 'TRANSIT') {
          // create a RenderedSegment for each pattern, except for buses which are collapsed to a single segment
          const busPatterns = []
          forEach(pathSegment.getPatterns(), (pattern) => {
            if (pattern.route.route_type === 3) busPatterns.push(pattern)
            else this.createRenderedSegment(pathSegment, [pattern])
          })
          if (busPatterns.length > 0) {
            this.createRenderedSegment(pathSegment, busPatterns)
          }
        } else {
          // non-transit segments
          this.createRenderedSegment(pathSegment)
        }
      })
    })

    this.renderedEdges.sort(function (a, b) {
      // process render transit segments before walk
      if (a.getType() === 'WALK') return 1
      if (b.getType() === 'WALK') return -1
    })
  }

  createRenderedSegment(pathSegment, patterns) {
    const rSegment = new RenderedSegment(pathSegment)

    forEach(pathSegment.edges, (edge) => {
      const rEdge = this.createRenderedEdge(
        pathSegment,
        edge.graphEdge,
        edge.forward,
        patterns
      )
      rSegment.addRenderedEdge(rEdge)
    })
    if (patterns) {
      rSegment.patterns = patterns
      rSegment.mode = patterns[0].route.route_type
    }

    pathSegment.addRenderedSegment(rSegment)
  }

  createRenderedEdge(pathSegment, gEdge, forward, patterns) {
    let rEdge

    // construct the edge key, disregarding mode qualifiers (e.g. "_RENT")
    const type = pathSegment.getType().split('_')[0]
    let key = gEdge.id + (forward ? 'F' : 'R') + '_' + type

    // for non-bus transit edges, append an exemplar pattern ID to the key
    if (patterns && patterns[0].route.route_type !== 3) {
      key += '_' + patterns[0].getId()
    }

    // see if this r-edge already exists
    if (key in this.reLookup) {
      rEdge = this.reLookup[key]
    } else {
      // if not, create it
      rEdge = new RenderedEdge(
        gEdge,
        forward,
        type,
        this.useGeographicRendering
      )
      if (patterns) {
        forEach(patterns, (pattern) => {
          pattern.addRenderedEdge(rEdge)
          rEdge.addPattern(pattern)
        })
        rEdge.mode = patterns[0].route.route_type
      }
      rEdge.points.push(gEdge.fromVertex.point)
      rEdge.points.push(gEdge.toVertex.point)
      gEdge.addRenderedEdge(rEdge)
      rEdge.addPathSegment(pathSegment)

      this.renderedEdges.push(rEdge)
      this.reLookup[key] = rEdge
    }
    return rEdge
  }

  addVertexPoint(point) {
    if (this.baseVertexPoints.indexOf(point) !== -1) return
    this.baseVertexPoints.push(point)
  }
}

/**
 * Mixin `Emitter`
 */

Emitter(Network.prototype)
