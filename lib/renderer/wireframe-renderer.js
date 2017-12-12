import { forEach } from 'lodash'
import d3 from 'd3'

import Renderer from './renderer'
import Point from '../point/point'

import interpolateLine from '../util/interpolate-line'

/**
 * A Renderer subclass for drawing a simplified representation of the graph
 * itself, i.e. just the edges and vertices.
 *
 * @param {Object} the main Transitive object
 */

export default class WireframeRenderer extends Renderer {
  render () {
    super.render()

    var graph = this.transitive.network.graph

    this.wireframeEdges = []
    forEach(graph.edges, edge => {
      var wfEdge = new WireframeEdge(edge)
      wfEdge.render(this.transitive.display)
      this.wireframeEdges.push(wfEdge)
    })

    this.wireframeVertices = []
    forEach(graph.vertices, vertex => {
      var wfVertex = new WireframeVertex(vertex)
      wfVertex.render(this.transitive.display)
      this.wireframeVertices.push(wfVertex)
    })

    this.transitive.refresh()
  }

  refresh (panning) {
    super.refresh(panning)

    forEach(this.wireframeEdges, wfEdge => {
      wfEdge.refresh(this.transitive.display)
    })

    forEach(this.wireframeVertices, wfVertex => {
      wfVertex.refresh(this.transitive.display)
    })
  }
}

/**
 * Expose `WireframeRenderer`
 */

module.exports = WireframeRenderer

/**
 * WireframeVertex helper class
 */

class WireframeVertex extends Point {
  constructor (vertex) {
    super({ vertex })
  }

  getType () {
    return 'WIREFRAME_VERTEX'
  }

  /**
   * Draw the vertex
   *
   * @param {Display} display
   */

  render (display) {
    super.render(display)

    this.initSvg(display)
    this.svgGroup
      .attr('class', 'transitive-sortable')
      .datum({
        owner: this,
        sortableType: 'POINT_WIREFRAME_VERTEX'
      })

    // set up the marker
    this.marker = this.markerSvg.append('circle')
      .datum({
        owner: this
      })
      .attr('class', 'transitive-wireframe-vertex-circle')
  }

  /**
   * Refresh the vertex
   *
   * @param {Display} display
   */

  refresh (display) {
    var x = display.xScale(this.vertex.x)
    var y = display.yScale(this.vertex.y)
    var translate = 'translate(' + x + ', ' + y + ')'
    this.marker.attr('transform', translate)
    display.styler.styleWireframeVertex(display, this)
  }
}

/**
 * WireframeEdge helper class
 */

class WireframeEdge {
  constructor (edge) {
    this.edge = edge
  }

  render (display) {
    this.line = d3.svg.line() // the line translation function
      .x((data, i) => {
        return data.x
      })
      .y((data, i) => {
        return data.y
      })
      .interpolate(interpolateLine.bind({
        segment: this,
        display: display
      }))

    this.svgGroup = display.svg.append('g')

    this.lineSvg = this.svgGroup.append('g')
      .attr('class', 'transitive-sortable')
      .datum({
        owner: this,
        sortableType: 'WIREFRAME_EDGE'
      })

    this.lineGraph = this.lineSvg.append('path')
      .attr('class', 'transitive-wireframe-edge-line')
  }

  refresh (display) {
    this.renderData = this.edge.getRenderCoords(0, 0, display, true)
    var lineData = this.line(this.renderData)
    this.lineGraph.attr('d', lineData)
    display.styler.styleWireframeEdge(display, this)
  }
}
