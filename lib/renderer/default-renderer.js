import { forEach } from 'lodash'

import Renderer from './renderer'

/**
 * A Renderer subclass for the default network rendering engine.
 *
 * @param {Object} the main Transitive object
 */

export default class DefaultRenderer extends Renderer {
  render() {
    super.render()

    const display = this.transitive.display
    const network = this.transitive.network
    display.styler = this.transitive.styler

    // TODO: restore legend?

    // Process vertices/points
    const focusedPoints = []
    const unfocusedPoints = []
    forEach(network.graph.vertices, (vertex) => {
      vertex.point.clearRenderData()
      if (!vertex.point.isFocused()) unfocusedPoints.push(vertex.point)
      else focusedPoints.push(vertex.point)
    })

    forEach(network.renderedEdges, (rEdge) => {
      rEdge.refreshRenderData(display)
    })

    // Create arrays of focused, unfocused RenderedSegments
    const focusedSegments = []
    const unfocusedSegments = []
    forEach(network.paths, (path) => {
      forEach(path.segments, (pathSegment) => {
        forEach(pathSegment.renderedSegments, (renderedSegment) => {
          if (renderedSegment.isFocused()) focusedSegments.push(renderedSegment)
          else unfocusedSegments.push(renderedSegment)
        })
      })
    })

    // Render elements in the following order:

    // 1. Unfocused segments
    unfocusedSegments.forEach((rs) => rs.render(display))

    // 2. Unfocused points
    forEach(unfocusedPoints, (pt) => pt.render(display))

    // 3. Focused segments
    focusedSegments.forEach((rs) => rs.render(display))

    // 4. Focused points
    forEach(focusedPoints, (pt) => pt.render(display))

    // TODO: draw the edge-based points
    /* forEach(network.graph.edges, edge => {
      forEach(edge.pointArray, point => {
        point.render(display)
      })
    }) */

    // 5. Labels
    const labels = this.transitive.labeler.doLayout()
    forEach(labels.pointLabels, (label) => label.render(display))
    forEach(labels.segmentLabels, (label) => label.render(display))

    // Keep internal collection of rendered segments
    this.renderedSegments = focusedSegments.concat(unfocusedSegments)
  }

  refreshSegmentRenderData() {
    forEach(this.transitive.network.renderedEdges, (rEdge) => {
      rEdge.refreshRenderData(this.transitive.display)
    })

    // try intersecting adjacent rendered edges to create a smooth transition

    const isectKeys = [] // keep track of edge-edge intersections we've already computed
    forEach(this.transitive.network.paths, (path) => {
      forEach(path.segments, (pathSegment) => {
        forEach(pathSegment.renderedSegments, (rSegment) => {
          for (let s = 0; s < rSegment.renderedEdges.length - 1; s++) {
            const rEdge1 = rSegment.renderedEdges[s]
            const rEdge2 = rSegment.renderedEdges[s + 1]
            const key = rEdge1.getId() + '_' + rEdge2.getId()
            if (isectKeys.indexOf(key) !== -1) continue
            if (rEdge1.graphEdge.isInternal && rEdge2.graphEdge.isInternal) {
              rEdge1.intersect(rEdge2)
            }
            isectKeys.push(key)
          }
        })
      })
    })
  }

  /**
   * sortElements
   */

  sortElements() {
    this.renderedSegments.sort(function (a, b) {
      return a.compareTo(b)
    })

    const focusBaseZIndex = 100000

    forEach(this.renderedSegments, (rSegment, index) => {
      rSegment.zIndex =
        index * 10 + (rSegment.isFocused() ? focusBaseZIndex : 0)
    })

    forEach(this.transitive.network.graph.vertices, (vertex) => {
      const point = vertex.point
      point.zIndex = point.zIndex + (point.isFocused() ? focusBaseZIndex : 0)
    })

    this.transitive.display.svg
      .selectAll('.transitive-sortable')
      .sort(function (a, b) {
        const aIndex =
          typeof a.getZIndex === 'function'
            ? a.getZIndex()
            : a.owner.getZIndex()
        const bIndex =
          typeof b.getZIndex === 'function'
            ? b.getZIndex()
            : b.owner.getZIndex()
        return aIndex - bIndex
      })
  }

  /**
   * focusPath
   */

  focusPath(path) {
    let pathRenderedSegments = []
    const graph = this.transitive.network.graph

    if (path) {
      // if we're focusing a specific path
      pathRenderedSegments = path.getRenderedSegments()

      // un-focus all internal points
      forEach(graph.edges, (edge) => {
        edge.pointArray.forEach(function (point, i) {
          point.setAllPatternsFocused(false)
        })
      })
    } else {
      // if we're returning to 'all-focused' mode
      // re-focus all internal points
      forEach(graph.edges, (edge) => {
        forEach(edge.pointArray, (point, i) => {
          point.setAllPatternsFocused(true)
        })
      })
    }

    // Keep track of changed segments / points for transition animation (currently disabled)
    const focusChangeSegments = []
    const focusedVertexPoints = []

    forEach(this.renderedSegments, (rSegment) => {
      if (path && pathRenderedSegments.indexOf(rSegment) === -1) {
        if (rSegment.isFocused()) focusChangeSegments.push(rSegment)
        rSegment.setFocused(false)
      } else {
        if (!rSegment.isFocused()) focusChangeSegments.push(rSegment)
        rSegment.setFocused(true)
        focusedVertexPoints.push(rSegment.pathSegment.startVertex().point)
        focusedVertexPoints.push(rSegment.pathSegment.endVertex().point)
      }
    })

    const focusChangePoints = []
    forEach(graph.vertices, (vertex) => {
      const point = vertex.point
      if (focusedVertexPoints.indexOf(point) !== -1) {
        if (!point.isFocused()) focusChangePoints.push(point)
        point.setFocused(true)
      } else {
        if (point.isFocused()) focusChangePoints.push(point)
        point.setFocused(false)
      }
    })

    // bring the focused elements to the front for the transition
    // if (path) this.sortElements();

    // TODO: restore transitions
    /*
    // create a transition callback function that invokes refresh() after all transitions complete
    var n = 0
    var refreshOnEnd = (transition, callback) => {
      transition
        .each(() => { ++n })
        .on('end', () => { if (!--n) this.transitive.refresh() })
    }

    // run the transitions on the affected elements
    forEach(focusChangeSegments, segment => {
      segment.runFocusTransition(this.transitive.display, refreshOnEnd)
    })

    forEach(focusChangePoints, point => {
      point.runFocusTransition(this.transitive.display, refreshOnEnd)
    })
    */
    this.transitive.render()
  }
}
