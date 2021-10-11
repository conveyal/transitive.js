import { forEach } from 'lodash'

import LabelEdgeGroup from '../labeler/labeledgegroup.js'

import PatternGroup from './patterngroup'

/**
 * PathSegment
 */
let segmentId = 0

export default class PathSegment {
  constructor(type, path) {
    this.id = segmentId++
    this.type = type
    this.path = path
    this.points = []
    this.edges = []
    this.renderedSegments = []
    this.patternGroup = new PatternGroup()
  }

  clearGraphData() {
    this.edges = []
    this.points.forEach(function (point) {
      point.graphVertex = null
    })
    this.renderLength = null
  }

  getId() {
    return this.id
  }

  getType() {
    return this.type
  }

  addRenderedSegment(rSegment) {
    this.renderedSegments.push(rSegment)
  }

  addEdge(graphEdge, originVertex) {
    this.edges.push({
      forward: originVertex === graphEdge.fromVertex,
      graphEdge: graphEdge
    })
  }

  insertEdgeAt(index, graphEdge, originVertex) {
    const edgeInfo = {
      forward: originVertex === graphEdge.fromVertex,
      graphEdge: graphEdge
    }
    this.edges.splice(index, 0, edgeInfo)
  }

  removeEdge(graphEdge) {
    let index = null
    for (let i = 0; i < this.edges.length; i++) {
      if (this.edges[i].graphEdge === graphEdge) {
        index = i
        break
      }
    }
    if (index !== null) this.edges.splice(index, 1)
  }

  getEdgeIndex(graphEdge) {
    for (let i = 0; i < this.edges.length; i++) {
      if (this.edges[i].graphEdge === graphEdge) return i
    }
    return -1
  }

  /**
   * Get graph vertices
   */

  getGraphVertices() {
    const vertices = []
    this.edges.forEach(function (edge, i) {
      if (i === 0) {
        vertices.push(edge.graphEdge.fromVertex)
      }
      vertices.push(edge.graphEdge.toVertex)
    })
    return vertices
  }

  vertexArray() {
    let vertex = this.startVertex()
    const array = [vertex]

    this.edges.forEach(function (edgeInfo) {
      vertex = edgeInfo.graphEdge.oppositeVertex(vertex)
      array.push(vertex)
    })

    return array
  }

  startVertex() {
    if (this.points[0].multipoint) return this.points[0].multipoint.graphVertex
    if (!this.edges || this.edges.length === 0) return null

    const firstGraphEdge = this.edges[0].graphEdge
    return this.edges[0].forward
      ? firstGraphEdge.fromVertex
      : firstGraphEdge.toVertex

    /* if (this.graphEdges.length === 1) return this.graphEdges[0].fromVertex;
    var first = this.graphEdges[0],
      next = this.graphEdges[1];
    if (first.toVertex == next.toVertex || first.toVertex == next.fromVertex)
      return first.fromVertex;
    if (first.fromVertex == next.toVertex || first.fromVertex == next.fromVertex)
      return first.toVertex;
    return null; */
  }

  endVertex() {
    if (this.points[this.points.length - 1].multipoint) {
      return this.points[this.points.length - 1].multipoint.graphVertex
    }
    if (!this.edges || this.edges.length === 0) return null

    const lastGraphEdge = this.edges[this.edges.length - 1].graphEdge
    return this.edges[this.edges.length - 1].forward
      ? lastGraphEdge.toVertex
      : lastGraphEdge.fromVertex

    /* if (this.graphEdges.length === 1) return this.graphEdges[0].toVertex;
    var last = this.graphEdges[this.graphEdges.length - 1],
      prev = this.graphEdges[this.graphEdges.length - 2];
    if (last.toVertex == prev.toVertex || last.toVertex == prev.fromVertex)
      return last.fromVertex;
    if (last.fromVertex == prev.toVertex || last.fromVertex == prev.fromVertex)
      return last.toVertex;
    return null; */
  }

  addPattern(pattern, fromIndex, toIndex) {
    // Initialize this segment's 'points' array to include the stops in the
    // provided pattern between the specified from and to indices, inclusive.
    // Only do this if the points array is empty or if the the length of the
    // segment being added exceeds that of the one currently stored.
    if (toIndex - fromIndex + 1 > this.points.length) {
      this.points = []
      let lastStop = null
      for (let i = fromIndex; i <= toIndex; i++) {
        const stop = pattern.stops[i]
        if (lastStop !== stop) {
          this.points.push(stop)
        }
        lastStop = stop
      }
    }

    // Add the pattern to this segment's PatternGroup
    this.patternGroup.addPattern(pattern, fromIndex, toIndex)
  }

  getPattern() {
    return this.patternGroup.patterns[0]
  }

  getPatterns() {
    return this.patternGroup.patterns
  }

  getMode() {
    return this.patternGroup.patterns[0].route.route_type
  }

  toString() {
    const startVertex = this.startVertex()
    const endVertex = this.endVertex()
    return (
      'PathSegment id=' +
      this.id +
      ' type=' +
      this.type +
      ' from ' +
      (startVertex ? startVertex.toString() : '(unknown)') +
      ' to ' +
      (endVertex ? endVertex.toString() : '(unknown)')
    )
  }

  getLabelEdgeGroups() {
    const edgeGroups = []
    forEach(this.renderedSegments, (rSegment) => {
      if (!rSegment.isFocused()) return
      let currentGroup = new LabelEdgeGroup(rSegment)
      forEach(rSegment.renderedEdges, (rEdge) => {
        currentGroup.addEdge(rEdge)
        if (rEdge.graphEdge.toVertex.point.containsSegmentEndPoint()) {
          edgeGroups.push(currentGroup)
          currentGroup = new LabelEdgeGroup(rSegment)
        }
      })
    })

    return edgeGroups
  }
}
