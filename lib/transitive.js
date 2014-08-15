var d3 = require('d3');
var debug = require('debug')('transitive');
var Emitter = require('emitter');
var each = require('each');

var Display = require('./display');
var drawGrid = require('./draw-grid');
var Graph = require('./graph');
var NetworkPath = require('./path');
var Route = require('./route');
var RoutePattern = require('./pattern');
var Journey = require('./journey');
var Stop = require('./point/stop');
var Place = require('./point/place');
var Styler = require('./styler');
var RenderSegment = require('./rendersegment');
var Labeler = require('./labeler');
var Label = require('./labeler/label');
var Legend = require('./legend');
var createTileLayer = require('./tile-layer');

/**
 * Expose `Transitive`
 */

module.exports = Transitive;

/**
 * Expose `version`
 */

module.exports.version = '0.3.0';

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
  this.baseGridCellSize = this.gridCellSize = options.gridCellSize || 500;
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

  // Store data
  this.data = data;

  // A list of points (stops & places) that will always become vertices in the network
  // graph (regardless of zoom scale). This includes all points that serve as a segment
  // endpoint and/or a convergence/divergence point between segments
  this.baseVertexPoints = [];

  // object maps stop ids to arrays of unique stop_ids reachable from that stop
  this.adjacentStops = {};

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
  data.places.forEach(function(data) {
    var place = this.places[data.place_id] = new Place(data, this);
    this.addVertexPoint(place);
  }, this);

  // Generate the internal Journey objects
  this.journeys = {};
  if (data.journeys) {
    data.journeys.forEach((function(journeyData) {
      var journey = new Journey(journeyData, this);
      this.journeys[journeyData.journey_id] = journey;
      this.paths.push(journey.path);

    }).bind(this));
  }

  // process the path segments
  for (var p = 0; p < this.paths.length; p++) {
    var path = this.paths[p];
    for (var s = 0; s < path.segments.length; s++) {
      this.processSegment(path.segments[s]);
    }
  }

  // determine the convergence/divergence vertex stops by looking for stops w/ >2 adjacent stops
  /*for (var stopId in this.adjacentStops) {
    if (this.adjacentStops[stopId].length > 2) {
      this.addVertexPoint(this.stops[stopId]);
    }
  }*/

  this.createGraph();
  this.setScale();

  this.loaded = true;
  this.emit('load', this);
  return this;
};

/** Graph Creation/Processing Methods **/

Transitive.prototype.createGraph = function() {

  // core graph creation steps
  this.graph = new Graph(this.baseVertexPoints);
  this.populateGraphEdges();
  this.graph.collapseTransfers(this.gridCellSize / 2);
  this.createInternalVertexPoints();
  this.graph.sortVertices();

  /*console.log('');
  each(this.graph.edges, function(edge) {
    console.log(edge.toString());
    //console.log(this.graph.getEdgeGroup(edge));
    each(edge.pointArray, function(p) {
      console.log(' - ' + p.getName());
    });
  }, this);*/

  // other post-processing actions
  this.annotateTransitPoints();
  this.initPlaceAdjacency();
  this.populateRenderSegments();
  this.labeler.updateLabelList();
  this.updateGeometry(true);
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
  for(var i in this.graph.edgeGroups) {
    var edgeGroup = this.graph.edgeGroups[i];

    var wlen = edgeGroup.getWorldLength();
    //var wlen = edge.getWorldLength();

    // compute the maximum number of internal points for this edge to add as graph vertices
    var vertexFactor = !edgeGroup.hasTransit() ? 1 : this.getInternalVertexFactor();
    var newVertexCount = Math.floor((wlen / this.gridCellSize) / vertexFactor);

    // get the priority queue of the edge's internal points
    var pq = edgeGroup.getInternalVertexPQ();

    // pull the 'best' points from the queue until we reach the maximum
    var splitPoints = [];
    while(splitPoints.length < newVertexCount && pq.size() > 0) {
      var el = pq.deq();
      splitPoints.push(el.point);
    }

    // perform the split operation (if needed)
    if (splitPoints.length > 0) {
      for(var e = 0; e < edgeGroup.edges.length; e++) {
        var edge = edgeGroup.edges[e];
        this.graph.splitEdgeAtInternalPoints(edge, splitPoints);
      }
    }

  }
  //}, this);
};


Transitive.prototype.updateGeometry = function(snapGrid) {

  // clear the stop render data
  //for (var key in this.stops) this.stops[key].renderData = [];

  this.graph.vertices.forEach(function(vertex) {
    vertex.snapped = false;
    vertex.point.clearRenderData();
  });

  // refresh the edge-based points
  this.graph.edges.forEach(function(edge) {
    edge.pointArray.forEach(function(point) {
      point.clearRenderData();
    });
  });

  this.renderSegments.forEach(function(segment) {
    segment.clearOffsets();
  });

  //if (snapGrid) this.graph.snapToGrid(this.gridCellSize);

  //this.fixPointOverlaps();

  this.graph.calculateGeometry(this.gridCellSize, this.getAngleConstraint());

  this.graph.apply2DOffsets(this);
};

Transitive.prototype.getInternalVertexFactor = function() {

  var scale = this.display.zoom.scale();

  if (scale > 3) return 5;
  if (scale > 2.5) return 10;
  if (scale > 2) return 15;
  if (scale > 1.5) return 20;
  if (scale > 1) return 25;

  return 100;

};

Transitive.prototype.getAngleConstraint = function() {

  var scale = this.display.zoom.scale();

  if (scale > 3) return 5;
  if (scale > 2.5) return 10;
  if (scale > 2) return 15;
  if (scale > 1.5) return 30;
  if (scale > 1) return 45;

  return 90;

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
 *
 * @param {Object} patterns
 * @param {Graph} graph
 */

Transitive.prototype.populateGraphEdges = function() {
  // vertex associated with the last vertex point we passed in this sequence
  var lastVertex = null;

  // collection of 'internal' (i.e. non-vertex) points passed
  // since the last vertex point
  var internalPoints = [];

  for (var p = 0; p < this.paths.length; p++) {
    var path = this.paths[p];
    for (var s = 0; s < path.segments.length; s++) {
      var segment = path.segments[s];

      lastVertex = null;
      var lastVertexIndex = 0;

      for (var i = 0; i < segment.points.length; i++) {
        var point = segment.points[i];
        if (point.graphVertex) { // this is a vertex point
          if (lastVertex !== null) {
            var edge = this.graph.getEquivalentEdge(internalPoints, lastVertex,
              point.graphVertex);

            if (!edge) {
              edge = this.graph.addEdge(internalPoints, lastVertex, point.graphVertex, segment.getType());

              // calculate the angle and apply to edge stops
              var dx = point.graphVertex.x - lastVertex.x;
              var dy = point.graphVertex.y - lastVertex.y;
              var angle = Math.atan2(dy, dx) * 180 / Math.PI;
              point.angle = lastVertex.point.angle = angle;
              for (var is = 0; is < internalPoints.length; is++) {
                internalPoints[is].angle = angle;
              }
            }

            segment.graphEdges.push(edge);
            edge.addPathSegment(segment);
          }

          lastVertex = point.graphVertex;
          lastVertexIndex = i;
          internalPoints = [];
        } else { // this is an internal point
          internalPoints.push(point);
        }
      }
    }
  }
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
    if(!place.graphVertex) return;
    each(place.graphVertex.incidentEdges(), function(edge) {
      var oppVertex = edge.oppositeVertex(place.graphVertex);
      if(oppVertex.point) {
        oppVertex.point.adjacentPlace = place;
      }
    });
  }, this);
};

Transitive.prototype.populateRenderSegments = function() {
  this.rsLookup = {};
  this.renderSegments = [];

  for (var patternId in this.patterns) {
    this.patterns[patternId].renderSegments = [];
  }

  each(this.paths, function(path) {

    each(path.segments, function(pathSegment) {

      pathSegment.renderSegments = [];
      each(pathSegment.graphEdges, function(edge) {

        if(pathSegment.type === 'TRANSIT') {

          // create a RenderSegment for each pattern, except for buses which are collapsed to a single segment
          var busPatterns = [];
          each(pathSegment.getPatterns(), function(pattern) {
            if(pattern.route.route_type === 3) busPatterns.push(pattern);
            else this.createRenderSegment(pathSegment, edge, [pattern]);
          }, this);
          if(busPatterns.length > 0) {
            this.createRenderSegment(pathSegment, edge, busPatterns);
          }
          //this.createRenderSegment(pathSegment, edge, pathSegment.getPatterns()[0]);
        }
        else this.createRenderSegment(pathSegment, edge);

      }, this);
    }, this);
  }, this);

  this.renderSegments.sort(function(a, b) { // process render transit segments before walk
    if (a.getType() === 'WALK') return 1;
    if (b.getType() === 'WALK') return -1;
  });
};

Transitive.prototype.createRenderSegment = function(pathSegment, edge, patterns) {
  var renderSegment;
  var key = edge.id + '_' + pathSegment.getType();

  if(patterns && patterns[0].route.route_type !== 3) {
    key += '_' + patterns[0].getId();
  }

  if (key in this.rsLookup) {
    renderSegment = this.rsLookup[key];
  } else {
    renderSegment = new RenderSegment(edge, pathSegment.type);
    if(patterns) {
      each(patterns, function(pattern) {
        pattern.addRenderSegment(renderSegment);
        renderSegment.addPattern(pattern);
      });
      renderSegment.mode = patterns[0].route.route_type;
    }
    renderSegment.points.push(edge.fromVertex.point);
    renderSegment.points.push(edge.toVertex.point);
    edge.addRenderSegment(renderSegment);
    renderSegment.path = pathSegment.path;

    this.renderSegments.push(renderSegment);
    this.rsLookup[key] = renderSegment;
  }
  pathSegment.renderSegments.push(renderSegment);
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
  this.initializeDisplay();

  if (this.graph) this.setScale();

  this.emit('set element', this, this.el);
  return this;
};

/**
 * Create the Display object and set up the pan/zoom functionality
 */

Transitive.prototype.initializeDisplay = function() {

  var self = this;
  this.display = new Display(this.options);

  var zoomBehavior = this.options.useDynamicRendering ?
    function() {
      var scale = self.display.zoom.scale();
      //debug('scale', scale);
      if (scale !== self.lastScale) {
        self.lastScale = scale;
        self.gridCellSize = self.baseGridCellSize * (1 / scale);

        self.paths.forEach(function(path) {
          path.clearGraphData();
        });

        self.createGraph();
        self.render();
      } else {
        self.refresh();
      }

      var llb = self.display.llBounds();
      debug('ll bounds: ' + llb[0][0] + ',' + llb[0][1] + ' to ' + llb[1][0] +
        ',' + llb[1][1]);
    } :
    function() {
      self.refresh();
    };

  this.display.zoom.on('zoom.transitive', zoomBehavior);

  this.emit('initialize display', this, this.display);
  return this;
};

/**
 * Set scale
 */

Transitive.prototype.setScale = function() {
  var bounds = this.graph.bounds();

  this.display.setScale(this.el.clientHeight, this.el.clientWidth, this.graph.bounds());
  this.lastScale = this.display.zoom.scale();

  if (this.options.mapboxId) {
    createTileLayer({
      el: this.el,
      display: this.display,
      graph: this.graph,
      mapboxId: this.options.mapboxId
    });
  }

  this.emit('set scale', this);
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

  // draw the segments
  for (var s = 0; s < this.renderSegments.length; s++) {
    var segment = this.renderSegments[s];
    //console.log(segment);
    segment.refreshRenderData(this.display);
    segment.render(this.display, 0); // 10);
    var legendType = segment.getLegendType();
    if (!(legendType in legendSegments)) {
      legendSegments[legendType] = segment;
    }
  }

  // draw the vertex-based points
  this.graph.vertices.forEach(function(vertex) {
    vertex.point.render(this.display);
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

Transitive.prototype.refresh = function() {

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


  // re-draw the segments
  each(this.renderSegments, function(segment) {
    segment.refresh(this.display);
  }, this);

  // refresh the path highlights
  /*for(var p = 0; p < this.paths.length; p++) {
    this.paths[p].refreshHighlight(this.display);
  }*/

  // re-draw the vertex-based points
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
  /*labeledElements.segments.forEach(function(segment) {
    segment.refreshLabel(this.display);
    this.style.renderSegmentLabel(this.display, segment);
  }, this);*/
  each(this.labeler.segmentLabels, function(label) {
    label.refresh(this.display);
    this.style.renderSegmentLabel(this.display, label);
  }, this);

  this.sortElements();

  this.emit('refresh', this);
  return this;
};

Transitive.prototype.refreshSegmentRenderData = function() {
  each(this.renderSegments, function(segment) {
    segment.refreshRenderData(this.display);
  }, this);


  for (var patternId in this.patterns) {
    var pattern = this.patterns[patternId];
    for (var s = 0; s < pattern.renderSegments.length - 1; s++) {
      var seg1 = pattern.renderSegments[s];
      var seg2 = pattern.renderSegments[s + 1];
      if (seg1.graphEdge.isInternal && seg2.graphEdge.isInternal) {
        seg1.intersect(seg2);
      }
    }
  }

};

Transitive.prototype.sortElements = function(journeyId) {

  this.renderSegments.sort(function(a, b) {
    if (a.isFocused() && !b.isFocused()) return 1;
    if (b.isFocused() && !a.isFocused()) return -1;
    return (a.compareTo(b));
  });

  this.renderSegments.forEach(function(segment, index) {
    segment.zIndex = index * 10;
  });

  this.display.svg.selectAll('.transitive-sortable').sort(function(a, b) {
    var aIndex = (typeof a.getZIndex === 'function') ? a.getZIndex() : a.owner
      .getZIndex();
    var bIndex = (typeof b.getZIndex === 'function') ? b.getZIndex() : b.owner
      .getZIndex();
    return aIndex - bIndex;
  });
};

Transitive.prototype.focusJourney = function(journeyId) {
  var journeyRenderSegments = [];

  if (journeyId) {
    var journey = this.journeys[journeyId];
    journeyRenderSegments = journey.path.getRenderSegments();

    this.graph.edges.forEach(function(edge) {
      edge.pointArray.forEach(function(point, i) {
        point.setAllPatternsFocused(false);
      });
    }, this);
  } else {
    this.graph.edges.forEach(function(edge) {
      edge.pointArray.forEach(function(point, i) {
        point.setAllPatternsFocused(true);
      });
    }, this);
  }

  var focusedVertexPoints = [];
  //var focusedInternalPoints = [];
  this.renderSegments.forEach(function(segment) {
    if (journeyId && journeyRenderSegments.indexOf(segment) === -1) {
      segment.setFocused(false);
    } else {
      segment.setFocused(true);
      //segment.graphEdges.forEach(function(edge, edgeIndex) {
      focusedVertexPoints.push(segment.graphEdge.fromVertex.point);
      focusedVertexPoints.push(segment.graphEdge.toVertex.point);
      if(segment.pattern) {
        segment.graphEdge.pointArray.forEach(function(point, i) {
          point.setPatternFocused(segment.pattern.getId(), true);
        });
      }
      //});

    }
  });

  this.graph.vertices.forEach(function(vertex) {
    var point = vertex.point;
    point.setFocused(focusedVertexPoints.indexOf(point) !== -1);
  }, this);

  this.refresh();
};

Transitive.prototype.offsetSegment = function(segment, axisId, offset) {
  if (segment.pattern) {
    this.renderSegments.forEach(function(rseg) {
      if (rseg.pattern && rseg.pattern.pattern_id === segment.pattern.pattern_id) {
        rseg.offsetAxis(axisId, offset);
      }
    });
  } else segment.offsetAxis(axisId, offset);
};
