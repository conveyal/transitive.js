import { forEach } from 'lodash'

import Renderer from './renderer'
import { renderDataToSvgPath } from '../util'

/**
 * A Renderer subclass for drawing a simplified representation of the graph
 * itself, i.e. just the edges and vertices.
 *
 * @param {Object} the main Transitive object
 */

export default class WireframeRenderer extends Renderer {
  render () {
    super.render()

    const { display } = this.transitive
    const { graph } = this.transitive.network

    // Draw the edges
    forEach(graph.edges, edge => {
      // Get a basic, non-offset edge renderData array
      const renderData = edge.getRenderCoords(0, 0, display, true)

      display.drawPath(renderDataToSvgPath(renderData), {
        fill: 'none',
        'stroke-width': 2,
        stroke: '#000',
        'stroke-dasharray': '4,2'
      })
    })

    // Draw the vertices
    forEach(graph.vertices, vertex => {
      display.drawCircle({
        x: display.xScale(vertex.x),
        y: display.yScale(vertex.y)
      }, {
        r: 4,
        fill: '#000'
      })
    })
  }

  refresh (panning) { }
}
