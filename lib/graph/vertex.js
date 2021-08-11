/**
 * Vertex
 */

let vertexId = 0

export default class Vertex {
  /**
   * Vertex constructor
   *
   * @param {Object} point the Point (a Stop, Place, etc.) attached to this vertex
   * @param {Number} x
   * @param {Number} y
   */

  constructor(point, x, y) {
    this.id = vertexId++
    this.point = point
    this.point.graphVertex = this
    this.x = this.origX = x
    this.y = this.origY = y
    this.edges = []
  }

  getId() {
    return this.id
  }

  getRenderX(display) {
    return display.xScale.compute(this.x) + this.point.placeOffsets.x
  }

  getRenderY(display) {
    return display.yScale.compute(this.y) + this.point.placeOffsets.y
  }

  /**
   * Move to new coordinate
   *
   * @param {Number}
   * @param {Number}
   */

  moveTo(x, y) {
    this.x = x
    this.y = y
    /* this.edges.forEach(function (edge) {
      edge.calculateVectors();
    }); */
  }

  /**
   * Get array of edges incident to vertex. Allows specification of "incoming"
   * edge that will not be included in results.
   *
   * @param {Edge} inEdge optional incoming edge tp ignore
   */

  incidentEdges(inEdge) {
    return this.edges.filter((edge) => edge !== inEdge)
  }

  /**
   * Add an edge to the vertex's edge list
   *
   * @param {Edge} edge
   */

  addEdge(edge) {
    const index = this.edges.indexOf(edge)
    if (index === -1) this.edges.push(edge)
  }

  /**
   * Remove an edge from the vertex's edge list
   *
   * @param {Edge} edge
   */

  removeEdge(edge) {
    const index = this.edges.indexOf(edge)
    if (index !== -1) this.edges.splice(index, 1)
  }

  toString() {
    return `Vertex ${this.getId()} (${
      this.point ? this.point.toString() : 'no point assigned'
    })`
  }
}
