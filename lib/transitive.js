var d3 = require('d3');
var debug = require('debug')('transitive');
var Emitter = require('emitter');
var each = require('each');

var Display = require('./display');
var drawGrid = require('./display/draw-grid');
var Legend = require('./display/legend');

var Graph = require('./graph');

var NetworkPath = require('./core/path');
var Route = require('./core/route');
var RoutePattern = require('./core/pattern');
var Journey = require('./core/journey');
var RenderedEdge = require('./core/renderededge');
var RenderedSegment = require('./core/renderedsegment');

var Stop = require('./point/stop');
var Place = require('./point/place');
var PointClusterMap = require('./point/pointclustermap');

var Styler = require('./styler');

var Labeler = require('./labeler');
var Label = require('./labeler/label');

var SphericalMercator = require('./util/spherical-mercator');

var sm = new SphericalMercator();

/**
 * Expose `Transitive`
 */

module.exports = Transitive;

/**
 * Expose `version`
 */

module.exports.version = '0.6.4';

/**
 * Create a new instance of `Transitive`
 *
 * @param {Object} options object
 *   - data {Object} data to render
 *   - drawGrid {Boolean} defaults to false
 *   - el {Element} element to render to
 *   - gridCellSize {Number} size of the grid
 *   - style {Object} styles to apply
 */

function Transitive(options) {

  if (!(this instanceof Transitive)) return new Transitive(options);

  this.options = options;
  if (this.options.useDynamicRendering === undefined) this.options.useDynamicRendering =
    true;

  if (options.el) this.setElement(options.el);

  this.data = options.data;
  this.labeler = new Labeler(this);

  this.paths = [];
  this.style = new Styler(options.styles);
  if (options.legendEl) this.legend = new Legend(options.legendEl, this);
}

/**
 * Mixin `Emitter`
 */

Emitter(Transitive.prototype);

/**
 * Load
 *
 * @param {Object} data
 */

Transitive.prototype.load = function(data) {
  debug('loading', data);

  // check data
  if (!data) data = {};

  // Store data
  this.data = data;

  // A list of points (stops & places) that will always become vertices in the network
  // graph (regardless of zoom scale). This includes all points that serve as a segment
  // endpoint and/or a convergence/divergence point between segments
  this.baseVertexPoints = [];

  // object maps stop ids to arrays of unique stop_ids reachable from that stop
  this.adjacentStops = {};

  // maps lat_lon key to unique TurnPoint object
  this.turnPoints = {};

  // Generate the route objects
  this.routes = {};
  each(data.routes, function(data) {
    this.routes[data.route_id] = new Route(data);
  }, this);

  // Generate the stop objects
  this.stops = {};
  each(data.stops, function(data) {
    this.stops[data.stop_id] = new Stop(data);
  }, this);

  // Generate the pattern objects
  this.patterns = {};
  each(data.patterns, function(data) {
    var pattern = new RoutePattern(data, this);
    this.patterns[data.pattern_id] = pattern;
    var route = this.routes[data.route_id];
    if (route) {
      route.addPattern(pattern);
      pattern.route = route;
    } else {
      console.log('Error: pattern ' + data.pattern_id +
        ' refers to route that was not found: ' + data.route_id);
    }
  }, this);

  // Generate the place objects
  this.places = {};
  each(data.places, function(data) {
    var place = this.places[data.place_id] = new Place(data, this);
    this.addVertexPoint(place);
  }, this);

  // Generate the internal Journey objects
  this.journeys = {};
  each(data.journeys, function(journeyData) {
    var journey = new Journey(journeyData, this);
    this.journeys[journeyData.journey_id] = journey;
    this.paths.push(journey.path);
  }, this);

  // process the path segments
  for (var p = 0; p < this.paths.length; p++) {
    var path = this.paths[p];
    for (var s = 0; s < path.segments.length; s++) {
      this.processSegment(path.segments[s]);
    }
  }

  this.createGraph();

  this.loaded = true;
  this.emit('load', this);
  return this;
};

Transitive.prototype.clearData = function() {
  this.routes = {};
  this.stops = {};
  this.patterns = {};
  this.places = {};
  this.journeys = {};
  this.paths = [];
  this.baseVertexPoints = [];
  this.data = null;
  this.graph = new Graph(this, []);
  this.labeler.clear();
  this.render();
};

Transitive.prototype.updateData = function(data) {
  if (this.data) this.clearData();
  this.loaded = false;
  this.data = data;
  this.render();
};

/**
 * Return the collection of default segment styles for a mode.
 *
 * @param {String} an OTP mode string
 */

Transitive.prototype.getModeStyles = function(mode) {
  return this.style.getModeStyles(mode, this.display);
};

/** Graph Creation/Processing Methods **/

Transitive.prototype.clearGraphData = function() {
  this.paths.forEach(function(path) {
    path.clearGraphData();
  });
};

Transitive.prototype.createGraph = function() {

  // clear previous graph-specific data
  if (this.pointClusterMap) this.pointClusterMap.clearMultiPoints();
  each(this.stops, function(stopId) {
    this.stops[stopId].setFocused(true);
  }, this);

  // create the list of vertex points
  var vertexPoints; // = this.baseVertexPoints.concat();
  if (this.mergeVertexThreshold && this.mergeVertexThreshold > 0) {
    this.pointClusterMap = new PointClusterMap(this, this.mergeVertexThreshold);
    vertexPoints = this.pointClusterMap.getVertexPoints(this.baseVertexPoints);
    /*each(this.pointClusterMap.vertexPoints, function(point) {
      if(vertexPoints.indexOf(point) === -1) vertexPoints.push(point);
    });*/
  } else vertexPoints = this.baseVertexPoints;

  // core graph creation steps
  this.graph = new Graph(this, vertexPoints);
  this.populateGraphEdges();
  this.graph.pruneVertices();
  this.createInternalVertexPoints();
  if (this.isSnapping()) this.graph.snapToGrid(this.gridCellSize);
  this.graph.sortVertices();

  // other post-processing actions
  this.annotateTransitPoints();
  //this.initPlaceAdjacency();
  this.createRenderedSegments();
  this.labeler.updateLabelList();
  this.updateGeometry(true);
};

Transitive.prototype.isSnapping = function() {
  return this.gridCellSize && this.gridCellSize !== 0;
};

/*
 * identify and populate the 'internal' vertex points, which is zoom-level specfic
 */

Transitive.prototype.createInternalVertexPoints = function() {

  this.internalVertexPoints = [];

  // create a shallow-cloned copy
  var edges = [];
  each(this.graph.edges, function(e) {
    //if(this.graph.getEdgeGroup(e) && this.graph.getEdgeGroup(e).length === 1) edges.push(e);
    edges.push(e);
  }, this);

  //each(edges, function(edge) {
  for (var i in this.graph.edgeGroups) {
    var edgeGroup = this.graph.edgeGroups[i];

    var wlen = edgeGroup.getWorldLength();
    //var wlen = edge.getWorldLength();

    // compute the maximum number of internal points for this edge to add as graph vertices
    var vertexFactor = !edgeGroup.hasTransit() ? 1 : this.internalVertexFactor;
    var newVertexCount = Math.floor(wlen / vertexFactor);

    // get the priority queue of the edge's internal points
    var pq = edgeGroup.getInternalVertexPQ();

    // pull the 'best' points from the queue until we reach the maximum
    var splitPoints = [];
    while (splitPoints.length < newVertexCount && pq.size() > 0) {
      var el = pq.deq();
      splitPoints.push(el.point);
    }

    // perform the split operation (if needed)
    if (splitPoints.length > 0) {
      for (var e = 0; e < edgeGroup.edges.length; e++) {
        var edge = edgeGroup.edges[e];
        this.graph.splitEdgeAtInternalPoints(edge, splitPoints);
      }
    }

  }
  //}, this);
};

Transitive.prototype.updateGeometry = function() {

  // clear the stop render data
  //for (var key in this.stops) this.stops[key].renderData = [];

  this.graph.vertices.forEach(function(vertex) {
    //vertex.snapped = false;
    vertex.point.clearRenderData();
  });

  // refresh the edge-based points
  this.graph.edges.forEach(function(edge) {
    edge.pointArray.forEach(function(point) {
      point.clearRenderData();
    });
  });

  this.renderedEdges.forEach(function(rEdge) {
    rEdge.clearOffsets();
  });

  //if (snapGrid)
  //if(this.gridCellSize && this.gridCellSize !== 0) this.graph.snapToGrid(this.gridCellSize);

  //this.fixPointOverlaps();

  this.graph.calculateGeometry(this.gridCellSize, this.angleConstraint);

  this.graph.apply2DOffsets(this);
};

Transitive.prototype.updateZoomFactors = function(factors) {
  this.gridCellSize = factors.gridCellSize;
  this.internalVertexFactor = factors.internalVertexFactor;
  this.angleConstraint = factors.angleConstraint;
  this.mergeVertexThreshold = factors.mergeVertexThreshold;
};

/**
 *
 */

Transitive.prototype.processSegment = function(segment) {

  // iterate through this pattern's stops, associating stops/patterns with
  // each other and initializing the adjacentStops table
  var previousStop = null;
  for (var i = 0; i < segment.points.length; i++) {
    var point = segment.points[i];
    point.used = true;

    // called for each pair of adjacent stops in sequence
    if (previousStop && point.getType() === 'STOP') {
      this.addStopAdjacency(point.getId(), previousStop.getId());
      this.addStopAdjacency(previousStop.getId(), point.getId());
    }

    previousStop = (point.getType() === 'STOP') ? point : null;

    // add the start and end points to the vertexStops collection
    var startPoint = segment.points[0];
    this.addVertexPoint(startPoint);
    startPoint.isSegmentEndPoint = true;

    var endPoint = segment.points[segment.points.length - 1];
    this.addVertexPoint(endPoint);
    endPoint.isSegmentEndPoint = true;

  }
};

/**
 * Helper function for stopAjacency table
 *
 * @param {Stop} adjacent stops list
 * @param {Stop} stopA
 * @param {Stop} stopB
 */

Transitive.prototype.addStopAdjacency = function(stopIdA, stopIdB) {
  if (!this.adjacentStops[stopIdA]) this.adjacentStops[stopIdA] = [];
  if (this.adjacentStops[stopIdA].indexOf(stopIdB) === -1) this.adjacentStops[
    stopIdA].push(stopIdB);
};

/**
 * Populate the graph edges
 */

Transitive.prototype.populateGraphEdges = function() {
  // vertex associated with the last vertex point we passed in this sequence
  var lastVertex = null;

  // collection of 'internal' (i.e. non-vertex) points passed
  // since the last vertex point
  var internalPoints = [];

  each(this.paths, function(path) {
    each(path.segments, function(segment) {

      if (segment.geomCoords && this.internalVertexFactor <= 1) {
        var edge = this.graph.addEdge(internalPoints, segment.points[0].graphVertex,
          segment.points[segment.points.length - 1].graphVertex, segment.getType()
        );
        edge.geomCoords = segment.geomCoords;
        segment.graphEdges.push(edge);
        edge.addPathSegment(segment);
        return;
      }

      lastVertex = null;
      var lastVertexIndex = 0;

      each(segment.points, function(point, index) {

        if (point.multipoint) point = point.multipoint;
        if (point.graphVertex) { // this is a vertex point
          if (lastVertex !== null) {
            if (lastVertex.point === point) return;
            var edge = this.graph.getEquivalentEdge(internalPoints,
              lastVertex,
              point.graphVertex);

            if (!edge) {
              edge = this.graph.addEdge(internalPoints, lastVertex, point
                .graphVertex, segment.getType());

              // calculate the angle and apply to edge stops
              var dx = point.graphVertex.x - lastVertex.x;
              var dy = point.graphVertex.y - lastVertex.y;
              var angle = Math.atan2(dy, dx) * 180 / Math.PI;
              point.angle = lastVertex.point.angle = angle;
              for (var is = 0; is < internalPoints.length; is++) {
                internalPoints[is].angle = angle;
              }
            }

            segment.addEdge(edge);
            edge.addPathSegment(segment);
          }

          lastVertex = point.graphVertex;
          lastVertexIndex = index;
          internalPoints = [];
        } else { // this is an internal point
          internalPoints.push(point);
        }
      }, this);
    }, this);
  }, this);
};

Transitive.prototype.annotateTransitPoints = function() {
  var lookup = {};

  this.paths.forEach(function(path) {

    var transitSegments = [];
    path.segments.forEach(function(pathSegment) {
      if (pathSegment.type === 'TRANSIT') transitSegments.push(pathSegment);
    });

    path.segments.forEach(function(pathSegment) {
      if (pathSegment.type === 'TRANSIT') {

        // if first transit segment in path, mark 'from' endpoint as board point
        if (transitSegments.indexOf(pathSegment) === 0) {
          pathSegment.points[0].isBoardPoint = true;

          // if there are additional transit segments, mark the 'to' endpoint as a transfer point
          if (transitSegments.length > 1) pathSegment.points[pathSegment.points
            .length - 1].isTransferPoint = true;
        }

        // if last transit segment in path, mark 'to' endpoint as alight point
        else if (transitSegments.indexOf(pathSegment) === transitSegments.length -
          1) {
          pathSegment.points[pathSegment.points.length - 1].isAlightPoint =
            true;

          // if there are additional transit segments, mark the 'from' endpoint as a transfer point
          if (transitSegments.length > 1) pathSegment.points[0].isTransferPoint =
            true;
        }

        // if this is an 'internal' transit segment, mark both endpoints as transfer points
        else if (transitSegments.length > 2) {
          pathSegment.points[0].isTransferPoint = true;
          pathSegment.points[pathSegment.points.length - 1].isTransferPoint =
            true;
        }

      }
    });
  });
};

Transitive.prototype.initPlaceAdjacency = function() {
  each(this.places, function(placeId) {
    var place = this.places[placeId];
    if (!place.graphVertex) return;
    each(place.graphVertex.incidentEdges(), function(edge) {
      var oppVertex = edge.oppositeVertex(place.graphVertex);
      if (oppVertex.point) {
        oppVertex.point.adjacentPlace = place;
      }
    });
  }, this);
};

Transitive.prototype.createRenderedSegments = function() {
  this.reLookup = {};
  this.renderedEdges = [];
  this.renderedSegments = [];

  for (var patternId in this.patterns) {
    this.patterns[patternId].renderedEdges = [];
  }

  each(this.paths, function(path) {

    each(path.segments, function(pathSegment) {
      pathSegment.renderedSegments = [];

      if (pathSegment.type === 'TRANSIT') {

        // create a RenderedSegment for each pattern, except for buses which are collapsed to a single segment
        var busPatterns = [];
        each(pathSegment.getPatterns(), function(pattern) {
          if (pattern.route.route_type === 3) busPatterns.push(pattern);
          else this.createRenderedSegment(pathSegment, [pattern]);
        }, this);
        if (busPatterns.length > 0) {
          this.createRenderedSegment(pathSegment, busPatterns);
        }
      } else { // non-transit segments
        this.createRenderedSegment(pathSegment);
      }
    }, this);
  }, this);

  this.renderedEdges.sort(function(a, b) { // process render transit segments before walk
    if (a.getType() === 'WALK') return 1;
    if (b.getType() === 'WALK') return -1;
  });
};

Transitive.prototype.createRenderedSegment = function(pathSegment, patterns) {

  var rSegment = new RenderedSegment(pathSegment);

  each(pathSegment.graphEdges, function(gEdge) {
    var rEdge = this.createRenderedEdge(pathSegment, gEdge, patterns);
    rSegment.addRenderedEdge(rEdge);
  }, this);
  if (patterns) {
    rSegment.patterns = patterns;
    rSegment.mode = patterns[0].route.route_type;
  }

  pathSegment.addRenderedSegment(rSegment);
};

Transitive.prototype.createRenderedEdge = function(pathSegment, gEdge, patterns) {
  var rEdge;
  var key = gEdge.id + '_' + pathSegment.getType();

  if (patterns && patterns[0].route.route_type !== 3) {
    key += '_' + patterns[0].getId();
  }

  if (key in this.reLookup) {
    rEdge = this.reLookup[key];
  } else {
    rEdge = new RenderedEdge(gEdge, pathSegment.type);
    if (patterns) {
      each(patterns, function(pattern) {
        pattern.addRenderedEdge(rEdge);
        rEdge.addPattern(pattern);
      });
      rEdge.mode = patterns[0].route.route_type;
    }
    rEdge.points.push(gEdge.fromVertex.point);
    rEdge.points.push(gEdge.toVertex.point);
    gEdge.addRenderedEdge(rEdge);
    rEdge.addPathSegment(pathSegment);

    this.renderedEdges.push(rEdge);
    this.reLookup[key] = rEdge;
  }
  //pathSegment.renderedEdges.push(rEdge);
  return rEdge;
};

Transitive.prototype.addVertexPoint = function(point) {
  if (this.baseVertexPoints.indexOf(point) !== -1) return;
  this.baseVertexPoints.push(point);
};

/** Display/Render Methods **/

/**
 * Set the DOM element that serves as the main map canvas
 */

Transitive.prototype.setElement = function(el, legendEl) {
  if (this.el) this.el.innerHTML = null;

  this.el = el;
  this.display = new Display(this);

  // Emit click events
  var self = this;
  this.display.svg.on('click', function() {
    var x = d3.event.x;
    var y = d3.event.y;
    var geographic = sm.inverse([x, y]);
    self.emit('click', {
      x: x,
      y: y,
      lng: geographic[0],
      lat: geographic[1]
    });
  });

  this.emit('set element', this, this.el);
  return this;
};

/**
 * Render
 */

Transitive.prototype.render = function() {
  if (!this.loaded) {
    this.load(this.data);
  }

  //var display = this.display;
  this.display.styler = this.style;

  var offsetLeft = this.el.offsetLeft;
  var offsetTop = this.el.offsetTop;

  // remove all old svg elements
  this.display.empty();

  // draw the path highlights
  for (var p = 0; p < this.paths.length; p++) {
    this.paths[p].drawHighlight(this.display);
  }

  var legendSegments = {};

  each(this.renderedEdges, function(rEdge) {
    rEdge.refreshRenderData(this.display);
  }, this);

  each(this.paths, function(path) {
    each(path.segments, function(pathSegment) {
      each(pathSegment.renderedSegments, function(renderedSegment) {
        renderedSegment.render(this.display);
        var legendType = renderedSegment.getLegendType();
        if (!(legendType in legendSegments)) {
          legendSegments[legendType] = renderedSegment;
        }

      }, this);
    }, this);
  }, this);

  // draw the vertex-based points
  this.graph.vertices.forEach(function(vertex) {
    vertex.point.render(this.display);
    if (this.options.draggableTypes && this.options.draggableTypes.indexOf(
      vertex.point.getType()) !== -1) {
      vertex.point.makeDraggable(this);
    }
  }, this);

  // draw the edge-based points
  this.graph.edges.forEach(function(edge) {
    edge.pointArray.forEach(function(point) {
      point.render(this.display);
    }, this);
  }, this);

  if (this.legend) this.legend.render(legendSegments);

  this.refresh();

  this.emit('render', this);
  return this;
};

/**
 * Render to
 *
 * @param {Element} el
 */

Transitive.prototype.renderTo = function(el) {
  this.setElement(el);
  this.render();

  this.emit('render to', this);
  return this;
};

/**
 * Refresh
 */

Transitive.prototype.refresh = function(panning) {

  if (this.display.tileLayer) this.display.tileLayer.zoomed();

  this.graph.vertices.forEach(function(vertex) {
    vertex.point.clearRenderData();
  }, this);
  this.graph.edges.forEach(function(edge) {
    edge.clearRenderData();
  });

  // draw the grid, if necessary
  if (this.options.drawGrid) drawGrid(this.display, this.gridCellSize);

  // refresh the segment and point marker data
  this.refreshSegmentRenderData();
  this.graph.vertices.forEach(function(vertex) {
    vertex.point.initMarkerData(this.display);
  }, this);

  this.renderedSegments = [];
  each(this.paths, function(path) {
    each(path.segments, function(pathSegment) {
      each(pathSegment.renderedSegments, function(rSegment) {
        rSegment.refresh(this.display);
        this.renderedSegments.push(rSegment);
      }, this);
    }, this);
  }, this);

  this.graph.vertices.forEach(function(vertex) {
    var point = vertex.point;
    if (!point.svgGroup) return; // check if this point is not currently rendered
    this.style.renderPoint(this.display, point);
    point.refresh(this.display);
  }, this);

  // re-draw the edge-based points
  this.graph.edges.forEach(function(edge) {
    edge.pointArray.forEach(function(point) {
      if (!point.svgGroup) return; // check if this point is not currently rendered
      this.style.renderStop(this.display, point);
      point.refresh(this.display);
    }, this);
  }, this);

  // refresh the label layout
  var labeledElements = this.labeler.doLayout();
  labeledElements.points.forEach(function(point) {
    point.refreshLabel(this.display);
    this.style.renderPointLabel(this.display, point);
  }, this);
  each(this.labeler.segmentLabels, function(label) {
    label.refresh(this.display);
    this.style.renderSegmentLabel(this.display, label);
  }, this);

  this.sortElements();

};

Transitive.prototype.refreshSegmentRenderData = function() {
  each(this.renderedEdges, function(rEdge) {
    rEdge.refreshRenderData(this.display);
  }, this);

  // try intersecting adjacent rendered edges to create a smooth transition

  var isectKeys = []; // keep track of edge-edge intersections we've already computed
  each(this.paths, function(path) {
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

Transitive.prototype.sortElements = function() {

  this.renderedSegments.sort(function(a, b) {
    return (a.compareTo(b));
  });

  var focusBaseZIndex = 100000;

  this.renderedSegments.forEach(function(rSegment, index) {
    rSegment.zIndex = index * 10 + (rSegment.isFocused() ? focusBaseZIndex :
      0);
  });

  this.graph.vertices.forEach(function(vertex) {
    var point = vertex.point;
    point.zIndex = point.zIndex + (point.isFocused() ? focusBaseZIndex : 0);
  }, this);

  this.display.svg.selectAll('.transitive-sortable').sort(function(a, b) {
    var aIndex = (typeof a.getZIndex === 'function') ? a.getZIndex() : a.owner
      .getZIndex();
    var bIndex = (typeof b.getZIndex === 'function') ? b.getZIndex() : b.owner
      .getZIndex();
    return aIndex - bIndex;
  });
};

Transitive.prototype.focusJourney = function(journeyId) {

  var journeyRenderedSegments = [];

  if (journeyId) { // if we're focusing a specific journey
    journeyRenderedSegments = this.journeys[journeyId].path.getRenderedSegments();

    // un-focus all internal points
    this.graph.edges.forEach(function(edge) {
      edge.pointArray.forEach(function(point, i) {
        point.setAllPatternsFocused(false);
      });
    }, this);
  } else { // if we're returing to 'all-focused' mode
    // re-focus all internal points
    this.graph.edges.forEach(function(edge) {
      edge.pointArray.forEach(function(point, i) {
        point.setAllPatternsFocused(true);
      });
    }, this);
  }

  var focusChangeSegments = [],
    focusedVertexPoints = [];
  each(this.renderedSegments, function(rSegment) {
    if (journeyId && journeyRenderedSegments.indexOf(rSegment) === -1) {
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
  this.graph.vertices.forEach(function(vertex) {
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
  if (journeyId) this.sortElements();

  // create a transition callback function that invokes refresh() after all transitions complete
  var n = 0,
    self = this;
  var refreshOnEnd = function(transition, callback) {
    transition
      .each(function() {
        ++n;
      })
      .each("end", function() {
        if (!--n) self.refresh();
      });
  };

  // run the transtions on the affected elements
  each(focusChangeSegments, function(segment) {
    segment.runFocusTransition(this.display, refreshOnEnd);
  }, this);

  each(focusChangePoints, function(point) {
    point.runFocusTransition(this.display, refreshOnEnd);
  }, this);

};

Transitive.prototype.offsetEdge = function(rEdge, axisId, offset) {
  if (rEdge.pattern) {
    this.renderedEdges.forEach(function(re) {
      if (re.pattern && re.pattern.pattern_id === rEdge.pattern.pattern_id) {
        re.offsetAxis(axisId, offset);
      }
    });
  } else rEdge.offsetAxis(axisId, offset);
};
