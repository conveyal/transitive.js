import { forEach } from 'lodash'

import Renderer from './renderer'

/**
 * A Renderer subclass for the default network rendering engine.
 *
 * @param {Object} the main Transitive object
 */

export default class DefaultRenderer extends Renderer {
  render () {
    super.render()

    var display = this.transitive.display
    var network = this.transitive.network
    display.styler = this.transitive.styler

    var legendSegments = {}

    forEach(network.renderedEdges, rEdge => {
      rEdge.refreshRenderData(display)
    })

    forEach(network.paths, path => {
      forEach(path.segments, pathSegment => {
        forEach(pathSegment.renderedSegments, renderedSegment => {
          renderedSegment.render(display)
          var legendType = renderedSegment.getLegendType()
          if (!(legendType in legendSegments)) {
            legendSegments[legendType] = renderedSegment
          }
        })
      })
    })

    // draw the vertex-based points

    forEach(network.graph.vertices, vertex => {
      vertex.point.render(display)
      if (this.isDraggable(vertex.point)) {
        vertex.point.makeDraggable(this.transitive)
      }
    })

    // draw the edge-based points
    forEach(network.graph.edges, edge => {
      forEach(edge.pointArray, point => {
        point.render(display)
      })
    })

    if (display.legend) display.legend.render(legendSegments)

    this.transitive.refresh()
  }

  /**
   * Refresh
   */

  refresh (panning) {
    super.refresh(panning)

    var display = this.transitive.display
    var network = this.transitive.network
    var styler = this.transitive.styler

    forEach(network.graph.vertices, vertex => {
      vertex.point.clearRenderData()
    })
    forEach(network.graph.edges, edge => {
      edge.clearRenderData()
    })

    // refresh the segment and point marker data
    this.refreshSegmentRenderData()
    forEach(network.graph.vertices, vertex => {
      vertex.point.initMarkerData(display)
    })

    this.renderedSegments = []
    forEach(network.paths, path => {
      forEach(path.segments, pathSegment => {
        forEach(pathSegment.renderedSegments, rSegment => {
          rSegment.refresh(display)
          this.renderedSegments.push(rSegment)
        })
      })
    })

    forEach(network.graph.vertices, vertex => {
      var point = vertex.point
      if (!point.svgGroup) return // check if this point is not currently rendered
      styler.stylePoint(display, point)
      point.refresh(display)
    })

    // re-draw the edge-based points
    forEach(network.graph.edges, edge => {
      forEach(edge.pointArray, point => {
        if (!point.svgGroup) return // check if this point is not currently rendered
        styler.styleStop(display, point)
        point.refresh(display)
      })
    })

    // refresh the label layout
    var labeledElements = this.transitive.labeler.doLayout()
    forEach(labeledElements.points, point => {
      point.refreshLabel(display)
      styler.stylePointLabel(display, point)
    })
    forEach(this.transitive.labeler.segmentLabels, label => {
      label.refresh(display)
      styler.styleSegmentLabel(display, label)
    })

    this.sortElements()
  }

  refreshSegmentRenderData () {
    forEach(this.transitive.network.renderedEdges, rEdge => {
      rEdge.refreshRenderData(this.transitive.display)
    })

    // try intersecting adjacent rendered edges to create a smooth transition

    var isectKeys = [] // keep track of edge-edge intersections we've already computed
    forEach(this.transitive.network.paths, path => {
      forEach(path.segments, pathSegment => {
        forEach(pathSegment.renderedSegments, rSegment => {
          for (var s = 0; s < rSegment.renderedEdges.length - 1; s++) {
            var rEdge1 = rSegment.renderedEdges[s]
            var rEdge2 = rSegment.renderedEdges[s + 1]
            var key = rEdge1.getId() + '_' + rEdge2.getId()
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

  sortElements () {
    this.renderedSegments.sort(function (a, b) {
      return (a.compareTo(b))
    })

    var focusBaseZIndex = 100000

    forEach(this.renderedSegments, (rSegment, index) => {
      rSegment.zIndex = index * 10 + (rSegment.isFocused()
        ? focusBaseZIndex
        : 0)
    })

    forEach(this.transitive.network.graph.vertices, vertex => {
      var point = vertex.point
      point.zIndex = point.zIndex + (point.isFocused() ? focusBaseZIndex : 0)
    })

    this.transitive.display.svg.selectAll('.transitive-sortable').sort(function (a, b) {
      var aIndex = (typeof a.getZIndex === 'function') ? a.getZIndex() : a.owner
        .getZIndex()
      var bIndex = (typeof b.getZIndex === 'function') ? b.getZIndex() : b.owner
        .getZIndex()
      return aIndex - bIndex
    })
  }

  /**
   * focusPath
   */

  focusPath (path) {
    var self = this
    var pathRenderedSegments = []
    var graph = this.transitive.network.graph

    if (path) { // if we're focusing a specific path
      pathRenderedSegments = path.getRenderedSegments()

      // un-focus all internal points
      forEach(graph.edges, edge => {
        edge.pointArray.forEach(function (point, i) {
          point.setAllPatternsFocused(false)
        })
      })
    } else { // if we're returing to 'all-focused' mode
      // re-focus all internal points
      forEach(graph.edges, edge => {
        forEach(edge.pointArray, (point, i) => {
          point.setAllPatternsFocused(true)
        })
      })
    }

    var focusChangeSegments = []
    var focusedVertexPoints = []
    forEach(this.renderedSegments, rSegment => {
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

    var focusChangePoints = []
    forEach(graph.vertices, vertex => {
      var point = vertex.point
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

    // create a transition callback function that invokes refresh() after all transitions complete
    var n = 0
    var refreshOnEnd = function (transition, callback) {
      transition
        .each(function () {
          ++n
        })
        .each('end', function () {
          if (!--n) self.transitive.refresh()
        })
    }

    // run the transtions on the affected elements
    forEach(focusChangeSegments, segment => {
      segment.runFocusTransition(this.transitive.display, refreshOnEnd)
    })

    forEach(focusChangePoints, point => {
      point.runFocusTransition(this.transitive.display, refreshOnEnd)
    })
  }
}
