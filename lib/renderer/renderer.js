import { forEach } from 'lodash'

/**
 * A superclass for a Transitive network rendering engine.
 */

export default class Renderer {
  /**
   * Renderer constructor
   * @param {Object} transitive the main Transitive object
   */

  constructor(transitive) {
    this.transitive = transitive
  }

  render() {
    const display = this.transitive.display
    const graph = this.transitive.network.graph

    display.styler = this.transitive.styler

    graph.vertices.forEach((vertex) => {
      vertex.point.clearRenderData()
    })
    graph.edges.forEach((edge) => {
      edge.clearRenderData()
    })

    // Clear the display
    display.clear()
  }

  /**
   * Does not need to be implemented by subclass
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  sortElements() {}

  /**
   * Does not need to be implemented by subclass
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  focusPath(path) {}

  isDraggable(point) {
    const draggableTypes = this.transitive.options.draggableTypes
    if (!draggableTypes) return false

    let retval = false
    forEach(draggableTypes, (type) => {
      if (type === point.getType()) {
        // Return true in ether of the following cases:
        // 1. No ID array is provided for this point type (i.e. entire type is draggable)
        // 2. An ID array is provided and it includes this Point's ID
        retval =
          !draggableTypes[type] ||
          draggableTypes[type].indexOf(point.getId()) !== -1
      }
    })
    return retval
  }
}
