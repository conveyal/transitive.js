var debug = require('debug')('transitive:renderer');
var each = require('each');

var drawGrid = require('../display/draw-grid');

/**
 * Expose `Renderer`
 */

module.exports = Renderer;

/**
 * The network rendering engine.
 *
 * @param {Object} the main Transitive object
 */

function Renderer(transitive) {
  this.transitive = transitive;
}

Renderer.prototype.render = function() {

  var self = this;
  var display = this.transitive.display;
  var network = this.transitive.network;
  var options = this.transitive.options;
  display.styler = this.transitive.styler;

  // remove all old svg elements
  display.empty();

  // draw the path highlights
  /*for (var p = 0; p < this.paths.length; p++) {
    this.paths[p].drawHighlight(this.display);
  }*/

  var legendSegments = {};

  each(network.renderedEdges, function(rEdge) {
    rEdge.refreshRenderData(display);
  });

  each(network.paths, function(path) {
    each(path.segments, function(pathSegment) {
      each(pathSegment.renderedSegments, function(renderedSegment) {
        renderedSegment.render(display);
        var legendType = renderedSegment.getLegendType();
        if (!(legendType in legendSegments)) {
          legendSegments[legendType] = renderedSegment;
        }
      });
    });
  });

  // draw the vertex-based points
  each(network.graph.vertices, function(vertex) {
    vertex.point.render(display);
    if (options.draggableTypes && options.draggableTypes.indexOf(
      vertex.point.getType()) !== -1) {
      vertex.point.makeDraggable(self.transitive);
    }
  });

  // draw the edge-based points
  each(network.graph.edges, function(edge) {
    edge.pointArray.forEach(function(point) {
      point.render(display);
    });
  });

  if (display.legend) display.legend.render(legendSegments);

  this.transitive.refresh();
};


/**
 * Refresh
 */

Renderer.prototype.refresh = function(panning) {

  var display = this.transitive.display;
  var network = this.transitive.network;
  var options = this.transitive.options;
  var styler = this.transitive.styler;

  if (display.tileLayer) display.tileLayer.zoomed();

  network.graph.vertices.forEach(function(vertex) {
    vertex.point.clearRenderData();
  });
  network.graph.edges.forEach(function(edge) {
    edge.clearRenderData();
  });

  // draw the grid, if necessary
  if (options.drawGrid) drawGrid(display, this.gridCellSize);

  // refresh the segment and point marker data
  this.refreshSegmentRenderData();
  network.graph.vertices.forEach(function(vertex) {
    vertex.point.initMarkerData(display);
  });

  this.renderedSegments = [];
  each(network.paths, function(path) {
    each(path.segments, function(pathSegment) {
      each(pathSegment.renderedSegments, function(rSegment) {
        rSegment.refresh(display);
        this.renderedSegments.push(rSegment);
      }, this);
    }, this);
  }, this);

  network.graph.vertices.forEach(function(vertex) {
    var point = vertex.point;
    if (!point.svgGroup) return; // check if this point is not currently rendered
    styler.renderPoint(display, point);
    point.refresh(display);
  });

  // re-draw the edge-based points
  network.graph.edges.forEach(function(edge) {
    edge.pointArray.forEach(function(point) {
      if (!point.svgGroup) return; // check if this point is not currently rendered
      styler.renderStop(display, point);
      point.refresh(display);
    });
  });

  // refresh the label layout
  var labeledElements = this.transitive.labeler.doLayout();
  labeledElements.points.forEach(function(point) {
    point.refreshLabel(display);
    styler.renderPointLabel(display, point);
  });
  each(this.transitive.labeler.segmentLabels, function(label) {
    label.refresh(display);
    styler.renderSegmentLabel(display, label);
  });

  this.sortElements();

};

Renderer.prototype.refreshSegmentRenderData = function() {
  each(this.transitive.network.renderedEdges, function(rEdge) {
    rEdge.refreshRenderData(this.transitive.display);
  }, this);

  // try intersecting adjacent rendered edges to create a smooth transition

  var isectKeys = []; // keep track of edge-edge intersections we've already computed
  each(this.transitive.network.paths, function(path) {
    each(path.segments, function(pathSegment) {
      each(pathSegment.renderedSegments, function(rSegment) {
        for (var s = 0; s < rSegment.renderedEdges.length - 1; s++) {
          var rEdge1 = rSegment.renderedEdges[s];
          var rEdge2 = rSegment.renderedEdges[s + 1];
          var key = rEdge1.getId() + '_' + rEdge2.getId();
          if (isectKeys.indexOf(key) !== -1) continue;
          if (rEdge1.graphEdge.isInternal && rEdge2.graphEdge.isInternal) {
            rEdge1.intersect(rEdge2);
          }
          isectKeys.push(key);
        }
      });
    });
  });
};

/**
 * sortElements
 */

Renderer.prototype.sortElements = function() {

  this.renderedSegments.sort(function(a, b) {
    return (a.compareTo(b));
  });

  var focusBaseZIndex = 100000;

  this.renderedSegments.forEach(function(rSegment, index) {
    rSegment.zIndex = index * 10 + (rSegment.isFocused() ? focusBaseZIndex :
      0);
  });

  this.transitive.network.graph.vertices.forEach(function(vertex) {
    var point = vertex.point;
    point.zIndex = point.zIndex + (point.isFocused() ? focusBaseZIndex : 0);
  });

  this.transitive.display.svg.selectAll('.transitive-sortable').sort(function(a, b) {
    var aIndex = (typeof a.getZIndex === 'function') ? a.getZIndex() : a.owner
      .getZIndex();
    var bIndex = (typeof b.getZIndex === 'function') ? b.getZIndex() : b.owner
      .getZIndex();
    return aIndex - bIndex;
  });
};

/**
 * focusPath
 */

Renderer.prototype.focusPath = function(path) {

  var self = this;
  var pathRenderedSegments = [];
  var graph = this.transitive.network.graph;

  if (path) { // if we're focusing a specific path
    pathRenderedSegments = path.getRenderedSegments();

    // un-focus all internal points
    graph.edges.forEach(function(edge) {
      edge.pointArray.forEach(function(point, i) {
        point.setAllPatternsFocused(false);
      });
    }, this);
  } else { // if we're returing to 'all-focused' mode
    // re-focus all internal points
    graph.edges.forEach(function(edge) {
      edge.pointArray.forEach(function(point, i) {
        point.setAllPatternsFocused(true);
      });
    }, this);
  }

  var focusChangeSegments = [],
    focusedVertexPoints = [];
  each(this.renderedSegments, function(rSegment) {
    if (path && pathRenderedSegments.indexOf(rSegment) === -1) {
      if (rSegment.isFocused()) focusChangeSegments.push(rSegment);
      rSegment.setFocused(false);
    } else {
      if (!rSegment.isFocused()) focusChangeSegments.push(rSegment);
      rSegment.setFocused(true);
      focusedVertexPoints.push(rSegment.pathSegment.startVertex().point);
      focusedVertexPoints.push(rSegment.pathSegment.endVertex().point);
    }
  });

  var focusChangePoints = [];
  graph.vertices.forEach(function(vertex) {
    var point = vertex.point;
    if (focusedVertexPoints.indexOf(point) !== -1) {
      if (!point.isFocused()) focusChangePoints.push(point);
      point.setFocused(true);
    } else {
      if (point.isFocused()) focusChangePoints.push(point);
      point.setFocused(false);
    }
  }, this);

  // bring the focused elements to the front for the transition
  //if (path) this.sortElements();

  // create a transition callback function that invokes refresh() after all transitions complete
  var n = 0;
  var refreshOnEnd = function(transition, callback) {
    transition
      .each(function() {
        ++n;
      })
      .each("end", function() {
        if (!--n) self.transitive.refresh();
      });
  };

  // run the transtions on the affected elements
  each(focusChangeSegments, function(segment) {
    segment.runFocusTransition(this.transitive.display, refreshOnEnd);
  }, this);

  each(focusChangePoints, function(point) {
    point.runFocusTransition(this.transitive.display, refreshOnEnd);
  }, this);

};
