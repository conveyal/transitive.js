import { forEach } from 'lodash'

import drawGrid from '../display/draw-grid'

/**
 * A superclass for a Transitive network rendering engine.
 */

export default class Renderer {
  /**
   * Renderer constructor
   * @param {Object} transitive the main Transitive object
   */

  constructor (transitive) {
    this.transitive = transitive
  }

  render () {
    var display = this.transitive.display
    display.styler = this.transitive.styler

    // remove all old svg elements
    display.clear()
  }

  /**
   * Refresh
   */

  refresh (panning) {
    var display = this.transitive.display
    var network = this.transitive.network

    if (display.tileLayer) display.tileLayer.zoomed()

    network.graph.vertices.forEach(function (vertex) {
      vertex.point.clearRenderData()
    })
    network.graph.edges.forEach(function (edge) {
      edge.clearRenderData()
    })

    // draw the grid, if necessary
    if (this.transitive.options.drawGrid) drawGrid(display, this.gridCellSize)
  }

  /**
   * sortElements
   */

  sortElements () {}

  /**
   * focusPath
   */

  focusPath (path) {}

  isDraggable (point) {
    var draggableTypes = this.transitive.options.draggableTypes
    if (!draggableTypes) return false

    var retval = false
    forEach(draggableTypes, type => {
      if (type === point.getType()) {
        // Return true in ether of the following cases:
        // 1. No ID array is provided for this point type (i.e. entire type is draggable)
        // 2. An ID array is provided and it includes this Point's ID
        retval = !draggableTypes[type] || draggableTypes[type].indexOf(point.getId()) !== -1
      }
    })
    return retval
  }
}
