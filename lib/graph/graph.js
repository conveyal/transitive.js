import d3 from 'd3'
import { forEach } from 'lodash'

import MultiPoint from '../point/multipoint'
import { ccw, isOutwardVector, sm } from '../util'

import Edge from './edge'
import EdgeGroup from './edgegroup'
import Vertex from './vertex'

const debug = require('debug')('transitive:graph')

/**
 *  A graph representing the underlying 'wireframe' network
 */

export default class NetworkGraph {
  constructor(network, vertices) {
    this.network = network
    this.edges = []
    this.vertices = []

    /**
     *  Object mapping groups of edges that share the same two vertices.
     *  - Key is string of format A_B, where A and B are vertex IDs and A < B
     *  - Value is array of edges
     */
    this.edgeGroups = {}

    // Add all base vertices
    for (const i in vertices) {
      this.addVertex(vertices[i], vertices[i].worldX, vertices[i].worldY)
    }
  }

  /**
   * Get the bounds of the graph in the graph's internal x/y coordinate space
   *
   * @return [[left, top], [right, bottom]]
   */

  bounds() {
    let xmax = null
    let xmin = null
    let ymax = null
    let ymin = null

    for (const i in this.vertices) {
      const vertex = this.vertices[i]
      xmin = xmin ? Math.min(xmin, vertex.x) : vertex.x
      xmax = xmax ? Math.max(xmax, vertex.x) : vertex.x
      ymin = ymin ? Math.min(ymin, vertex.y) : vertex.y
      ymax = ymax ? Math.max(ymax, vertex.y) : vertex.y
    }

    const maxExtent = 20037508.34
    return [
      [xmin || -maxExtent, ymin || -maxExtent],
      [xmax || maxExtent, ymax || maxExtent]
    ]
  }

  /**
   * Add Vertex
   */

  addVertex(point, x, y) {
    if (x === undefined || y === undefined) {
      const xy = sm.forward([point.getLon(), point.getLat()])
      x = xy[0]
      y = xy[1]
    }
    const vertex = new Vertex(point, x, y)
    this.vertices.push(vertex)
    return vertex
  }

  /**
   * Add Edge
   */

  addEdge(stops, from, to, segmentType) {
    if (
      this.vertices.indexOf(from) === -1 ||
      this.vertices.indexOf(to) === -1
    ) {
      debug('Error: Cannot add edge. Graph does not contain vertices.')
      return
    }

    const edge = new Edge(stops, from, to)
    this.edges.push(edge)
    from.edges.push(edge)
    to.edges.push(edge)

    const groupKey = this.network.transitive.options.groupEdges
      ? this.getEdgeGroupKey(edge, segmentType)
      : edge.getId()

    if (!(groupKey in this.edgeGroups)) {
      this.edgeGroups[groupKey] = new EdgeGroup(
        edge.fromVertex,
        edge.toVertex,
        segmentType
      )
    }
    this.edgeGroups[groupKey].addEdge(edge)

    return edge
  }

  removeEdge(edge) {
    // remove from the graph's edge collection
    const edgeIndex = this.edges.indexOf(edge)
    if (edgeIndex !== -1) this.edges.splice(edgeIndex, 1)

    // remove from any associated path segment edge lists
    forEach(edge.pathSegments, (segment) => {
      segment.removeEdge(edge)
    })

    // remove from the endpoint vertex incidentEdge collections
    edge.fromVertex.removeEdge(edge)
    edge.toVertex.removeEdge(edge)
  }

  getEdgeGroup(edge) {
    return this.edgeGroups[this.getEdgeGroupKey(edge)]
  }

  getEdgeGroupKey(edge, segmentType) {
    return edge.fromVertex.getId() < edge.toVertex.getId()
      ? segmentType +
          '_' +
          edge.fromVertex.getId() +
          '_' +
          edge.toVertex.getId()
      : segmentType +
          '_' +
          edge.toVertex.getId() +
          '_' +
          edge.fromVertex.getId()
  }

  mergeVertices(vertexArray) {
    let xTotal = 0
    let yTotal = 0

    const vertexGroups = {
      MULTI: [],
      PLACE: [],
      STOP: [],
      TURN: []
    }
    forEach(vertexArray, (vertex) => {
      if (vertex.point.getType() in vertexGroups) {
        vertexGroups[vertex.point.getType()].push(vertex)
      }
    })

    // don't merge stops and places, or multiple places:
    if (
      (vertexGroups.STOP.length > 0 && vertexGroups.PLACE.length > 0) ||
      vertexGroups.PLACE.length > 1 ||
      vertexGroups.MULTI.length > 0
    ) {
      return
    }

    let mergePoint

    // if merging turns with a place, create a new merged vertex around the place
    if (vertexGroups.PLACE.length === 1 && vertexGroups.TURN.length > 0) {
      mergePoint = vertexGroups.PLACE[0].point
      // if merging turns with a single place, create a new merged vertex around the stop
    } else if (vertexGroups.STOP.length === 1 && vertexGroups.TURN.length > 0) {
      mergePoint = vertexGroups.STOP[0].point
      // if merging multiple stops, create a new MultiPoint vertex
    } else if (vertexGroups.STOP.length > 1) {
      mergePoint = new MultiPoint()
      forEach(vertexGroups.STOP, (stopVertex) => {
        mergePoint.addPoint(stopVertex.point)
      })
      // if merging multiple turns
    } else if (vertexGroups.TURN.length > 1) {
      mergePoint = vertexGroups.TURN[0].point
    }

    if (!mergePoint) return
    const mergedVertex = new Vertex(mergePoint, 0, 0)

    forEach(vertexArray, (vertex) => {
      xTotal += vertex.x
      yTotal += vertex.y

      forEach(vertex.edges.slice(), (edge) => {
        if (
          vertexArray.indexOf(edge.fromVertex) !== -1 &&
          vertexArray.indexOf(edge.toVertex) !== -1
        ) {
          this.removeEdge(edge)
          return
        }
        edge.replaceVertex(vertex, mergedVertex)
        mergedVertex.addEdge(edge)
      })
      const index = this.vertices.indexOf(vertex)
      if (index !== -1) this.vertices.splice(index, 1)
    })

    mergedVertex.x = xTotal / vertexArray.length
    mergedVertex.y = yTotal / vertexArray.length
    mergedVertex.oldVertices = vertexArray

    this.vertices.push(mergedVertex)
  }

  sortVertices() {
    this.vertices.sort((a, b) => {
      if (a.point && a.point.getType() === 'PLACE') return -1
      if (b.point && b.point.getType() === 'PLACE') return 1

      if (a.point && a.point.getType() === 'MULTI') return -1
      if (b.point && b.point.getType() === 'MULTI') return 1

      if (a.point && a.point.getType() === 'STOP') return -1
      if (b.point && b.point.getType() === 'STOP') return 1
    })
  }

  /**
   * Get the equivalent edge
   */

  getEquivalentEdge(pointArray, from, to) {
    for (let e = 0; e < this.edges.length; e++) {
      const edge = this.edges[e]
      if (
        edge.fromVertex === from &&
        edge.toVertex === to &&
        pointArray.length === edge.pointArray.length &&
        equal(pointArray, edge.pointArray)
      ) {
        return edge
      }
      if (
        edge.fromVertex === to &&
        edge.toVertex === from &&
        pointArray.length === edge.pointArray.length &&
        equal(pointArray.slice(0).reverse(), edge.pointArray)
      ) {
        return edge
      }
    }
  }

  /**
   *  Split a specified graph edge around a set of specified split points, where
   *  all split points are internal points of the edge to be split. A set of N
   *  valid split points will result in N+1 new edges. The original edge is
   *  removed from the graph.
   */

  splitEdgeAtInternalPoints(edge, points) {
    let subEdgePoints = []
    let newEdge
    const newEdgeInfoArr = []
    let fromVertex = edge.fromVertex
    let geomCoords = []

    // iterate through the parent edge points, creating new sub-edges as needed
    forEach(edge.pointArray, (point, i) => {
      if (edge.pointGeom && i < edge.pointGeom.length) {
        geomCoords = geomCoords.concat(edge.pointGeom[i])
      }
      if (points.indexOf(point) !== -1) {
        // we've reached a split point
        const x = point.worldX
        const y = point.worldY
        const newVertex = point.graphVertex || this.addVertex(point, x, y)
        newVertex.isInternal = true
        newEdge = this.addEdge(
          subEdgePoints,
          fromVertex,
          newVertex,
          edge.edgeGroup.type
        )
        newEdge.isInternal = true
        newEdge.copyPathSegments(edge)
        newEdgeInfoArr.push({
          fromVertex: fromVertex,
          graphEdge: newEdge
        })
        if (geomCoords.length > 0) newEdge.geomCoords = geomCoords

        subEdgePoints = []
        fromVertex = newVertex
        geomCoords = []
      } else {
        // otherwise, this point becomes an internal point of the new edge currently being created
        subEdgePoints.push(point)
      }
    })

    // create the last sub-edge
    newEdge = this.addEdge(
      subEdgePoints,
      fromVertex,
      edge.toVertex,
      edge.edgeGroup.type
    )
    newEdge.isInternal = true
    newEdge.copyPathSegments(edge)
    if (edge.pointGeom && edge.pointArray.length < edge.pointGeom.length) {
      geomCoords = geomCoords.concat(edge.pointGeom[edge.pointArray.length])
    }
    if (geomCoords.length > 0) newEdge.geomCoords = geomCoords

    newEdgeInfoArr.push({
      fromVertex: fromVertex,
      graphEdge: newEdge
    })

    // insert the new edge sequence into the affected segments
    forEach(edge.pathSegments, (pathSegment) => {
      const indexInSegment = pathSegment.getEdgeIndex(edge)
      const forward = pathSegment.edges[indexInSegment].forward
      let index = pathSegment.getEdgeIndex(edge)
      forEach(
        forward ? newEdgeInfoArr : newEdgeInfoArr.reverse(),
        (edgeInfo) => {
          pathSegment.insertEdgeAt(
            index,
            edgeInfo.graphEdge,
            forward ? edgeInfo.fromVertex : edgeInfo.toVertex
          )
          index++
        }
      )
    })

    // remove the original edge from the graph
    this.removeEdge(edge)
  }

  /* collapseTransfers = function(threshold) {
    if(!threshold) return;
    this.edges.forEach(function(edge) {
      if (edge.getLength() > threshold ||
        edge.fromVertex.point.containsFromPoint() ||
        edge.fromVertex.point.containsToPoint() ||
        edge.toVertex.point.containsFromPoint() ||
        edge.toVertex.point.containsToPoint()) return;
      //if(edge.fromVertex.point.getType() === 'PLACE' || edge.toVertex.point.getType() === 'PLACE') return;
      var notTransit = true;
      edge.pathSegments.forEach(function(segment) {
        notTransit = notTransit && segment.type !== 'TRANSIT';
      });
      if (notTransit) {
        this.mergeVertices([edge.fromVertex, edge.toVertex]);
      }
    }, this);
  }; */

  pruneVertices() {
    forEach(this.vertices, (vertex) => {
      if (vertex.point.containsSegmentEndPoint()) return

      const opposites = []
      const pathSegmentBundles = {} // maps pathSegment id list (string) to collection of edges (array)

      forEach(vertex.edges, (edge) => {
        const pathSegmentIds = edge.getPathSegmentIds()
        if (!(pathSegmentIds in pathSegmentBundles)) {
          pathSegmentBundles[pathSegmentIds] = []
        }
        pathSegmentBundles[pathSegmentIds].push(edge)
        const opp = edge.oppositeVertex(vertex)
        if (opposites.indexOf(opp) === -1) opposites.push(opp)
      })

      if (opposites.length !== 2) return

      for (const key in pathSegmentBundles) {
        const edgeArr = pathSegmentBundles[key]
        if (edgeArr.length === 2) this.mergeEdges(edgeArr[0], edgeArr[1])
      }
    })
  }

  mergeEdges(edge1, edge2) {
    // check for infinite recursion loop case
    if (
      edge1.fromVertex === edge2.toVertex &&
      edge2.fromVertex === edge1.toVertex
    ) {
      return
    }

    // reverse edges if necessary
    if (edge1.fromVertex === edge2.toVertex) {
      this.mergeEdges(edge2, edge1)
      return
    }

    if (edge1.toVertex !== edge2.fromVertex) return // edges cannot be merged

    const internalPoints = edge1.pointArray.concat(edge2.pointArray)

    const newEdge = this.addEdge(
      internalPoints,
      edge1.fromVertex,
      edge2.toVertex,
      edge1.edgeGroup.type
    )
    newEdge.pathSegments = edge1.pathSegments
    forEach(newEdge.pathSegments, (segment) => {
      const i = segment.getEdgeIndex(edge1)
      segment.insertEdgeAt(i, newEdge, newEdge.fromVertex)
    })

    // if both input edges are have coordinate geometry, merge the coords arrays in the new edge
    if (edge1.geomCoords && edge2.geomCoords) {
      newEdge.geomCoords = edge1.geomCoords.concat(
        edge2.geomCoords.length > 0 ? edge2.geomCoords.slice(1) : []
      )
    }

    debug('merging:')
    debug(edge1)
    debug(edge2)
    this.removeEdge(edge1)
    this.removeEdge(edge2)
  }

  snapToGrid(cellSize) {
    const coincidenceMap = {}
    forEach(this.vertices, (vertex) => {
      const nx = Math.round(vertex.x / cellSize) * cellSize
      const ny = Math.round(vertex.y / cellSize) * cellSize
      vertex.x = nx
      vertex.y = ny

      const key = nx + '_' + ny
      if (!(key in coincidenceMap)) coincidenceMap[key] = [vertex]
      else coincidenceMap[key].push(vertex)
    })

    forEach(coincidenceMap, (vertexArr) => {
      if (vertexArr.length > 1) {
        this.mergeVertices(vertexArr)
      }
    })
  }

  calculateGeometry(cellSize, angleConstraint) {
    forEach(this.edges, (edge) => {
      edge.calculateGeometry(cellSize, angleConstraint)
    })
  }

  resetCoordinates() {
    forEach(this.vertices, (vertex) => {
      vertex.x = vertex.origX
      vertex.y = vertex.origY
    })
  }

  recenter() {
    const xCoords = []
    const yCoords = []
    forEach(this.vertices, (v) => {
      xCoords.push(v.x)
      yCoords.push(v.y)
    })

    const mx = d3.median(xCoords)
    const my = d3.median(yCoords)

    forEach(this.vertices, (v) => {
      v.x = v.x - mx
      v.y = v.y - my
    })
  }

  /** 2D line bundling & offsetting **/

  apply2DOffsets() {
    this.initComparisons()

    const alignmentBundles = {} // maps alignment ID to array of range-bounded bundles on that alignment

    const addToBundle = (rEdge, alignmentId) => {
      let bundle

      // compute the alignment range of the edge being bundled
      const range = rEdge.graphEdge.getAlignmentRange(alignmentId)

      // check if bundles already exist for this alignment
      if (!(alignmentId in alignmentBundles)) {
        // if not, create new and add to collection
        bundle = new AlignmentBundle()
        bundle.addEdge(rEdge, range.min, range.max)
        alignmentBundles[alignmentId] = [bundle] // new AlignmentBundle();
      } else {
        // 1 or more bundles currently exist for this alignmentId
        const bundleArr = alignmentBundles[alignmentId]

        // see if the segment range overlaps with that of an existing bundle
        for (let i = 0; i < bundleArr.length; i++) {
          if (bundleArr[i].rangeOverlaps(range.min, range.max)) {
            bundleArr[i].addEdge(rEdge, range.min, range.max)
            return
          }
        }

        // ..if not, create a new bundle
        bundle = new AlignmentBundle()
        bundle.addEdge(rEdge, range.min, range.max)
        bundleArr.push(bundle)
      }
    }

    forEach(this.edges, (edge) => {
      const fromAlignmentId = edge.getFromAlignmentId()
      const toAlignmentId = edge.getToAlignmentId()

      forEach(edge.renderedEdges, (rEdge) => {
        addToBundle(rEdge, fromAlignmentId)
        addToBundle(rEdge, toAlignmentId)
      })
    })

    const bundleSorter = (a, b) => {
      const aId = a.patternIds || a.pathSegmentIds
      const bId = b.patternIds || b.pathSegmentIds

      const aVector = a.getAlignmentVector(this.currentAlignmentId)
      const bVector = b.getAlignmentVector(this.currentAlignmentId)
      const isOutward =
        isOutwardVector(aVector) && isOutwardVector(bVector) ? 1 : -1

      const abCompId = aId + '_' + bId
      if (abCompId in this.bundleComparisons) {
        return isOutward * this.bundleComparisons[abCompId]
      }

      const baCompId = bId + '_' + aId
      if (baCompId in this.bundleComparisons) {
        return isOutward * this.bundleComparisons[baCompId]
      }

      if (a.route && b.route && a.route.route_type !== b.route.route_type) {
        return a.route.route_type > b.route.route_type ? 1 : -1
      }

      const isForward = a.forward && b.forward ? 1 : -1
      return isForward * isOutward * (aId < bId ? -1 : 1)
    }

    forEach(Object.keys(alignmentBundles), (alignmentId) => {
      const bundleArr = alignmentBundles[alignmentId]
      forEach(bundleArr, (bundle) => {
        if (bundle.items.length <= 1) return
        const lw = 1.2
        const bundleWidth = lw * (bundle.items.length - 1)

        this.currentAlignmentId = alignmentId
        bundle.items.sort(bundleSorter)
        forEach(bundle.items, (rEdge, i) => {
          const offset = -bundleWidth / 2 + i * lw
          if (rEdge.getType() === 'TRANSIT') {
            forEach(rEdge.patterns, (pattern) => {
              pattern.offsetAlignment(alignmentId, offset)
            })
          } else rEdge.offsetAlignment(alignmentId, offset)
        })
      })
    })
  }

  /**
   * Traverses the graph vertex-by-vertex, creating comparisons between all pairs of
   * edges for which a topological relationship can be established.
   */

  initComparisons() {
    this.bundleComparisons = {}

    forEach(this.vertices, (vertex) => {
      const incidentGraphEdges = vertex.incidentEdges()

      const angleREdges = {}
      forEach(incidentGraphEdges, (incidentGraphEdge) => {
        const angle =
          incidentGraphEdge.fromVertex === vertex
            ? incidentGraphEdge.fromAngle
            : incidentGraphEdge.toAngle
        const angleDeg = (180 * angle) / Math.PI
        if (!(angleDeg in angleREdges)) angleREdges[angleDeg] = []
        angleREdges[angleDeg] = angleREdges[angleDeg].concat(
          incidentGraphEdge.renderedEdges
        )
      })

      forEach(angleREdges, (rEdges) => {
        if (rEdges.length < 2) return
        for (let i = 0; i < rEdges.length - 1; i++) {
          for (let j = i + 1; j < rEdges.length; j++) {
            const re1 = rEdges[i]
            const re2 = rEdges[j]

            let opp1 = re1.graphEdge.oppositeVertex(vertex)
            let opp2 = re2.graphEdge.oppositeVertex(vertex)

            let isCcw = ccw(opp1.x, opp1.y, vertex.x, vertex.y, opp2.x, opp2.y)

            if (isCcw === 0) {
              const s1Ext = re1.findExtension(opp1)
              const s2Ext = re2.findExtension(opp2)
              if (s1Ext) opp1 = s1Ext.graphEdge.oppositeVertex(opp1)
              if (s2Ext) opp2 = s2Ext.graphEdge.oppositeVertex(opp2)
              isCcw = ccw(opp1.x, opp1.y, vertex.x, vertex.y, opp2.x, opp2.y)
            }

            isCcw = getInverse(re1, re2, vertex) * isCcw

            if (isCcw > 0) {
              // e1 patterns are 'less' than e2 patterns
              this.storeComparison(re1, re2)
            }

            if (isCcw < 0) {
              // e2 patterns are 'less' than e2 patterns
              this.storeComparison(re2, re1)
            }
          }
        }
      })
    })
  }

  storeComparison(s1, s2) {
    const s1Id = s1.patternIds || s1.pathSegmentIds
    const s2Id = s2.patternIds || s2.pathSegmentIds
    debug(`storing comparison: ${s1Id}  < ${s2Id}`)
    this.bundleComparisons[`${s1Id}_${s2Id}`] = -1
    this.bundleComparisons[`${s2Id}_${s1Id}`] = 1
  }
}

/**
 *  AlignmentBundle class
 */

class AlignmentBundle {
  constructor() {
    this.items = [] // RenderedEdges
    this.min = Number.MAX_VALUE
    this.max = -Number.MAX_VALUE
  }

  addEdge(rEdge, min, max) {
    if (this.items.indexOf(rEdge) === -1) {
      this.items.push(rEdge)
    }

    this.min = Math.min(this.min, min)
    this.max = Math.max(this.max, max)
  }

  rangeOverlaps(min, max) {
    return this.min < max && min < this.max
  }
}

/** Helper functions **/

function getInverse(s1, s2, vertex) {
  return (s1.graphEdge.toVertex === vertex &&
    s2.graphEdge.toVertex === vertex) ||
    (s1.graphEdge.toVertex === vertex && s2.graphEdge.fromVertex === vertex)
    ? -1
    : 1
}

/**
 * Check if arrays are equal
 */

function equal(a, b) {
  if (a.length !== b.length) {
    return false
  }

  for (const i in a) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}
