(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
'use strict';

var PathSegment = require('./pathsegment');
var NetworkPath = require('./path');
var TurnPoint = require('../point/turn');

var each = require('component-each');
/**
 * Expose `Journey`
 */

module.exports = Journey;

/**
 *
 */

function Journey(data, network) {
  this.network = network;

  for (var key in data) {
    this[key] = data[key];
  }

  this.path = new NetworkPath(this);

  each(this.segments, function (segmentInfo) {
    var pathSegment = new PathSegment(segmentInfo.type, this.path);
    pathSegment.journeySegment = segmentInfo;

    if (segmentInfo.type === 'TRANSIT') {
      if (segmentInfo.patterns) {
        each(segmentInfo.patterns, function (patternInfo) {
          pathSegment.addPattern(network.patterns[patternInfo.pattern_id], patternInfo.from_stop_index, patternInfo.to_stop_index);
        });
      } else if (segmentInfo.pattern_id) {
        // legacy support for single-pattern journey segments
        pathSegment.addPattern(network.patterns[segmentInfo.pattern_id], segmentInfo.from_stop_index, segmentInfo.to_stop_index);
      }
    } else {
      // non-transit segment
      var streetEdges = [];
      // screen out degenerate transfer segments
      if (segmentInfo.from.type === 'STOP' && segmentInfo.to.type === 'STOP' && segmentInfo.from.stop_id === segmentInfo.to.stop_id) return;

      pathSegment.points.push(getEndPoint(segmentInfo.from, network));
      if (segmentInfo.streetEdges && segmentInfo.streetEdges.length > 0) {
        var lastTurnPoint = null;

        for (var i = 0; i < segmentInfo.streetEdges.length; i++) {
          var streetEdgeId = segmentInfo.streetEdges[i];
          var streetEdge = network.streetEdges[streetEdgeId];
          streetEdge.id = streetEdgeId;
          streetEdges.push(streetEdge);
          if (i >= segmentInfo.streetEdges.length - 1) continue;

          if (lastTurnPoint) streetEdge.fromTurnPoint = lastTurnPoint;
          var lastIndex = streetEdge.length - 1;

          // screen out degenerate edges
          if (streetEdge.latLons[0][0] === streetEdge.latLons[lastIndex][0] && streetEdge.latLons[0][1] === streetEdge.latLons[lastIndex][1]) {
            continue;
          }

          // create a TurnPoint for the 'from' point of this edge
          var turnPoint = getTurnPoint({
            lat: streetEdge.latLons[lastIndex][0],
            lon: streetEdge.latLons[lastIndex][1],
            worldX: streetEdge.worldCoords[lastIndex][0],
            worldY: streetEdge.worldCoords[lastIndex][1]
          }, network);

          // compute the angle represented by this turn point
          /* turnPoint.turnAngle = Util.angleFromThreePoints(
            streetEdge.worldCoords[0][0],
            streetEdge.worldCoords[0][1],
            streetEdge.worldCoords[lastIndex][0],
            streetEdge.worldCoords[lastIndex][1],
            nextEdge.worldCoords[nextEdge.length-1][0],
            nextEdge.worldCoords[nextEdge.length-1][1]
          ); */

          pathSegment.points.push(turnPoint);
          lastTurnPoint = streetEdge.toTurnPoint = turnPoint;
        }
        pathSegment.streetEdges = streetEdges;
      }
      pathSegment.points.push(getEndPoint(segmentInfo.to, network));
    }
    this.path.addSegment(pathSegment);
  }, this);
}

function getEndPoint(pointInfo, network) {
  if (pointInfo.type === 'PLACE') {
    return network.places[pointInfo.place_id];
  } else if (pointInfo.type === 'STOP') {
    return network.stops[pointInfo.stop_id];
  }
}

Journey.prototype.getElementId = function () {
  return 'journey-' + this.journey_id;
};

/* utility function for creating non-duplicative TurnPoints */

function getTurnPoint(turnPointInfo, network) {
  var key = turnPointInfo.lat + '_' + turnPointInfo.lon;
  if (key in network.turnPoints) return network.turnPoints[key];
  var turnPoint = new TurnPoint(turnPointInfo, key);
  network.turnPoints[key] = turnPoint;
  // network.addVertexPoint(turnPoint);
  return turnPoint;
}

},{"../point/turn":29,"./path":4,"./pathsegment":5,"component-each":84}],3:[function(require,module,exports){
'use strict';

var each = require('component-each');
var debug = require('debug')('transitive:network');
var Emitter = require('component-emitter');

var Route = require('./route');
var RoutePattern = require('./pattern');
var Journey = require('./journey');

var Stop = require('../point/stop');
var Place = require('../point/place');
var PointClusterMap = require('../point/pointclustermap');
var RenderedEdge = require('../renderer/renderededge');
var RenderedSegment = require('../renderer/renderedsegment');

var Graph = require('../graph');

var Polyline = require('../util/polyline.js');
var SphericalMercator = require('../util/spherical-mercator');
var sm = new SphericalMercator();

/**
 * Expose `Network`
 */

module.exports = Network;

/**
 *
 */

function Network(transitive, data) {
  this.transitive = transitive;

  this.routes = {};
  this.stops = {};
  this.patterns = {};
  this.places = {};
  this.journeys = {};
  this.paths = [];
  this.baseVertexPoints = [];
  this.graph = new Graph(this, []);

  if (data) this.load(data);
}

/**
 * Mixin `Emitter`
 */

Emitter(Network.prototype);

/**
 * Load
 *
 * @param {Object} data
 */

Network.prototype.load = function (data) {
  debug('loading', data);
  var self = this;

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

  // Copy/decode the streetEdge objects
  this.streetEdges = {};
  each(data.streetEdges, function (data) {
    var latLons = Polyline.decode(data.geometry.points);
    var coords = [];
    each(latLons, function (latLon) {
      coords.push(sm.forward([latLon[1], latLon[0]]));
    });
    this.streetEdges[data.edge_id] = {
      latLons: latLons,
      worldCoords: coords,
      length: data.geometry.length
    };
  }, this);

  // Generate the route objects
  this.routes = {};
  each(data.routes, function (data) {
    this.routes[data.route_id] = new Route(data);
  }, this);

  // Generate the stop objects
  this.stops = {};
  each(data.stops, function (data) {
    this.stops[data.stop_id] = new Stop(data);
  }, this);

  // Generate the pattern objects
  this.patterns = {};
  each(data.patterns, function (data) {
    var pattern = new RoutePattern(data, this);
    this.patterns[data.pattern_id] = pattern;
    var route = this.routes[data.route_id];
    if (route) {
      route.addPattern(pattern);
      pattern.route = route;
    } else {
      debug('Error: pattern ' + data.pattern_id + ' refers to route that was not found: ' + data.route_id);
    }
    if (pattern.render) this.paths.push(pattern.createPath());
  }, this);

  // Generate the place objects
  this.places = {};
  each(data.places, function (data) {
    var place = this.places[data.place_id] = new Place(data, this);
    this.addVertexPoint(place);
  }, this);

  // Generate the internal Journey objects
  this.journeys = {};
  each(data.journeys, function (journeyData) {
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

  // when rendering pattern paths only, determine convergence/divergence vertex
  // stops by looking for stops w/ >2 adjacent stops
  if (!data.journeys || data.journeys.length === 0) {
    for (var stopId in this.adjacentStops) {
      if (this.adjacentStops[stopId].length > 2) {
        this.addVertexPoint(this.stops[stopId]);
      }
    }
  }

  // determine which TurnPoints should be base vertices
  var turnLookup = {};
  var addTurn = function addTurn(turn1, turn2) {
    if (!(turn1.getId() in turnLookup)) turnLookup[turn1.getId()] = [];
    if (turnLookup[turn1.getId()].indexOf(turn2) === -1) turnLookup[turn1.getId()].push(turn2);
  };
  each(this.streetEdges, function (streetEdgeId) {
    var streetEdge = self.streetEdges[streetEdgeId];
    if (streetEdge.fromTurnPoint && streetEdge.toTurnPoint) {
      addTurn(streetEdge.toTurnPoint, streetEdge.fromTurnPoint);
      addTurn(streetEdge.fromTurnPoint, streetEdge.toTurnPoint);
    }
  });
  each(turnLookup, function (turnPointId) {
    var count = turnLookup[turnPointId].length;
    if (count > 2) self.addVertexPoint(self.turnPoints[turnPointId]);
  });

  this.createGraph();

  this.loaded = true;
  this.emit('load', this);
  return this;
};

/** Graph Creation/Processing Methods **/

Network.prototype.clearGraphData = function () {
  each(this.paths, function (path) {
    path.clearGraphData();
  });
};

Network.prototype.createGraph = function () {
  this.applyZoomFactors(this.transitive.display.activeZoomFactors);

  // clear previous graph-specific data
  if (this.pointClusterMap) this.pointClusterMap.clearMultiPoints();
  each(this.stops, function (stopId) {
    this.stops[stopId].setFocused(true);
  }, this);

  // create the list of vertex points
  var vertexPoints;
  if (this.mergeVertexThreshold && this.mergeVertexThreshold > 0) {
    this.pointClusterMap = new PointClusterMap(this, this.mergeVertexThreshold);
    vertexPoints = this.pointClusterMap.getVertexPoints(this.baseVertexPoints);
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
  // this.initPlaceAdjacency();
  this.createRenderedSegments();
  this.transitive.labeler.updateLabelList(this.graph);
  this.updateGeometry(true);
};

Network.prototype.isSnapping = function () {
  return this.gridCellSize && this.gridCellSize !== 0;
};

/*
 * identify and populate the 'internal' vertex points, which is zoom-level specfic
 */

Network.prototype.createInternalVertexPoints = function () {
  this.internalVertexPoints = [];

  for (var i in this.graph.edgeGroups) {
    var edgeGroup = this.graph.edgeGroups[i];

    var wlen = edgeGroup.getWorldLength();

    var splitPoints = [];

    // compute the maximum number of internal points for this edge to add as graph vertices
    if (edgeGroup.hasTransit()) {
      var vertexFactor = this.internalVertexFactor; //! edgeGroup.hasTransit() ? 1 : this.internalVertexFactor;
      var newVertexCount = Math.floor(wlen / vertexFactor);

      // get the priority queue of the edge's internal points
      var pq = edgeGroup.getInternalVertexPQ();

      // pull the 'best' points from the queue until we reach the maximum
      while (splitPoints.length < newVertexCount && pq.size() > 0) {
        var el = pq.deq();
        splitPoints.push(el.point);
      }
    }

    // perform the split operation (if needed)
    if (splitPoints.length > 0) {
      for (var e = 0; e < edgeGroup.edges.length; e++) {
        var edge = edgeGroup.edges[e];
        this.graph.splitEdgeAtInternalPoints(edge, splitPoints);
      }
    }
  }
};

Network.prototype.updateGeometry = function () {
  // clear the stop render data
  // for (var key in this.stops) this.stops[key].renderData = [];

  this.graph.vertices.forEach(function (vertex) {
    // vertex.snapped = false;
    vertex.point.clearRenderData();
  });

  // refresh the edge-based points
  this.graph.edges.forEach(function (edge) {
    edge.pointArray.forEach(function (point) {
      point.clearRenderData();
    });
  });

  this.renderedEdges.forEach(function (rEdge) {
    rEdge.clearOffsets();
  });

  // if (snapGrid)
  // if(this.gridCellSize && this.gridCellSize !== 0) this.graph.snapToGrid(this.gridCellSize);

  // this.fixPointOverlaps();

  this.graph.calculateGeometry(this.gridCellSize, this.angleConstraint);

  this.graph.apply2DOffsets(this);
};

Network.prototype.applyZoomFactors = function (factors) {
  this.gridCellSize = factors.gridCellSize;
  this.internalVertexFactor = factors.internalVertexFactor;
  this.angleConstraint = factors.angleConstraint;
  this.mergeVertexThreshold = factors.mergeVertexThreshold;
};

/**
 *
 */

Network.prototype.processSegment = function (segment) {
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

    previousStop = point.getType() === 'STOP' ? point : null;

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

Network.prototype.addStopAdjacency = function (stopIdA, stopIdB) {
  if (!this.adjacentStops[stopIdA]) this.adjacentStops[stopIdA] = [];
  if (this.adjacentStops[stopIdA].indexOf(stopIdB) === -1) this.adjacentStops[stopIdA].push(stopIdB);
};

/**
 * Populate the graph edges
 */

Network.prototype.populateGraphEdges = function () {
  // vertex associated with the last vertex point we passed in this sequence
  var lastVertex = null;

  // collection of 'internal' (i.e. non-vertex) points passed
  // since the last vertex point
  var internalPoints = [];

  each(this.paths, function (path) {
    each(path.segments, function (segment) {
      lastVertex = null;

      var streetEdgeIndex = 0;

      // for transit segments, see if there is a pattern with inter-stop geometry defined
      var representativePattern = null;
      if (segment.type === 'TRANSIT') {
        for (var i = 0; i < segment.patternGroup.patterns.length; i++) {
          var pattern = segment.patternGroup.patterns[i];
          if (pattern.interStopGeometry && pattern.interStopGeometry.length === pattern.stops.length - 1) {
            representativePattern = pattern;
            break;
          }
        }
      }

      /**
       *  geomCoords: The geographic coordinates for the graph edge currently
       *  being constructed, used when rendering edges in "real-world" (i.e.
       *  non-schematic) mode. geomCoords data is only initialized here for
       *  street-based segments, using the segment's embedded street geometry
       *  data (if provided).
       */
      var geomCoords = [];

      /**
       *  pointGeom: An array of point-specific geometry (i.e. the alignment
       *  connecting this point to the following point in the containing
       *  segment's point sequence. Currently applies to transit segments only.
       *  pointGeom data is converted to geomCoords for rendering in the
       *  splitEdgeAtInternalPoints method of NetworkGraph
       */
      var pointGeom = [];

      each(segment.points, function (point, index) {
        if (segment.streetEdges) {
          // street-based segment with street-edge geometry
          for (var i = streetEdgeIndex; i < segment.streetEdges.length; i++) {
            if (index === 0) break;

            geomCoords = geomCoords.concat(geomCoords.length > 0 ? segment.streetEdges[i].worldCoords.slice(1) : segment.streetEdges[i].worldCoords);
            if (segment.streetEdges[i].toTurnPoint === point) {
              streetEdgeIndex = i + 1;
              break;
            }
          }
        } else if (representativePattern) {
          // transit-based segment with known geometry
          var fromIndex = segment.patternGroup.getFromIndex(representativePattern);

          // ignore the first stop, since the geometry at this index represents
          // the alignment leading into that stop
          if (index > 0) {
            // add the alignment extending from this stop to the pointGeom array
            var geom = representativePattern.interStopGeometry[fromIndex + index - 1];
            pointGeom.push(geom);
          }
        }

        if (point.multipoint) point = point.multipoint;

        if (point.graphVertex) {
          // this is a vertex point
          if (lastVertex !== null) {
            if (lastVertex.point === point) return;

            // see if an equivalent graph edge already exists
            var fromVertex = lastVertex;
            var toVertex = point.graphVertex;
            var edge = this.graph.getEquivalentEdge(internalPoints, fromVertex, toVertex);

            // create a new graph edge if necessary
            if (!edge) {
              edge = this.graph.addEdge(internalPoints, fromVertex, toVertex, segment.getType());
              if (geomCoords && geomCoords.length > 0) edge.geomCoords = geomCoords;
              if (pointGeom && pointGeom.length > 0) edge.pointGeom = pointGeom;
            }

            // associate the graph edge and path segment with each other
            segment.addEdge(edge, fromVertex);
            edge.addPathSegment(segment);

            // reset the geomCoords and pointGeom arrays for the next edge
            geomCoords = [];
            pointGeom = [];
          }

          lastVertex = point.graphVertex;
          internalPoints = [];
        } else {
          // this is an internal point
          internalPoints.push(point);
        }
      }, this);
      // }
    }, this);
  }, this);
};

Network.prototype.createGraphEdge = function (segment, fromVertex, toVertex, internalPoints, geomCoords) {
  var edge = this.graph.getEquivalentEdge(internalPoints, fromVertex, toVertex);

  if (!edge) {
    edge = this.graph.addEdge(internalPoints, fromVertex, toVertex, segment.getType());

    // calculate the angle and apply to edge stops
    /* var dx = fromVertex.x - toVertex.x;
    var dy = fromVertex.y - toVertex.y;
    var angle = Math.atan2(dy, dx) * 180 / Math.PI;
    point.angle = lastVertex.point.angle = angle;
    for (var is = 0; is < internalPoints.length; is++) {
      internalPoints[is].angle = angle;
    } */

    if (geomCoords) edge.geomCoords = geomCoords;

    debug('--- created edge ' + edge.toString());
    debug(edge);
    each(edge.geomCoords, function (c) {
      debug(c);
    });
  }

  segment.addEdge(edge, fromVertex);
  edge.addPathSegment(segment);
};

Network.prototype.annotateTransitPoints = function () {
  this.paths.forEach(function (path) {
    var transitSegments = [];
    path.segments.forEach(function (pathSegment) {
      if (pathSegment.type === 'TRANSIT') transitSegments.push(pathSegment);
    });

    path.segments.forEach(function (pathSegment) {
      if (pathSegment.type === 'TRANSIT') {
        // if first transit segment in path, mark 'from' endpoint as board point
        if (transitSegments.indexOf(pathSegment) === 0) {
          pathSegment.points[0].isBoardPoint = true;

          // if there are additional transit segments, mark the 'to' endpoint as a transfer point
          if (transitSegments.length > 1) pathSegment.points[pathSegment.points.length - 1].isTransferPoint = true;

          // if last transit segment in path, mark 'to' endpoint as alight point
        } else if (transitSegments.indexOf(pathSegment) === transitSegments.length - 1) {
          pathSegment.points[pathSegment.points.length - 1].isAlightPoint = true;

          // if there are additional transit segments, mark the 'from' endpoint as a transfer point
          if (transitSegments.length > 1) pathSegment.points[0].isTransferPoint = true;

          // if this is an 'internal' transit segment, mark both endpoints as transfer points
        } else if (transitSegments.length > 2) {
          pathSegment.points[0].isTransferPoint = true;
          pathSegment.points[pathSegment.points.length - 1].isTransferPoint = true;
        }
      }
    });
  });
};

Network.prototype.initPlaceAdjacency = function () {
  each(this.places, function (placeId) {
    var place = this.places[placeId];
    if (!place.graphVertex) return;
    each(place.graphVertex.incidentEdges(), function (edge) {
      var oppVertex = edge.oppositeVertex(place.graphVertex);
      if (oppVertex.point) {
        oppVertex.point.adjacentPlace = place;
      }
    });
  }, this);
};

Network.prototype.createRenderedSegments = function () {
  this.reLookup = {};
  this.renderedEdges = [];
  this.renderedSegments = [];

  for (var patternId in this.patterns) {
    this.patterns[patternId].renderedEdges = [];
  }

  each(this.paths, function (path) {
    each(path.segments, function (pathSegment) {
      pathSegment.renderedSegments = [];

      if (pathSegment.type === 'TRANSIT') {
        // create a RenderedSegment for each pattern, except for buses which are collapsed to a single segment
        var busPatterns = [];
        each(pathSegment.getPatterns(), function (pattern) {
          if (pattern.route.route_type === 3) busPatterns.push(pattern);else this.createRenderedSegment(pathSegment, [pattern]);
        }, this);
        if (busPatterns.length > 0) {
          this.createRenderedSegment(pathSegment, busPatterns);
        }
      } else {
        // non-transit segments
        this.createRenderedSegment(pathSegment);
      }
    }, this);
  }, this);

  this.renderedEdges.sort(function (a, b) {
    // process render transit segments before walk
    if (a.getType() === 'WALK') return 1;
    if (b.getType() === 'WALK') return -1;
  });
};

Network.prototype.createRenderedSegment = function (pathSegment, patterns) {
  var rSegment = new RenderedSegment(pathSegment);

  each(pathSegment.edges, function (edge) {
    var rEdge = this.createRenderedEdge(pathSegment, edge.graphEdge, edge.forward, patterns);
    rSegment.addRenderedEdge(rEdge);
  }, this);
  if (patterns) {
    rSegment.patterns = patterns;
    rSegment.mode = patterns[0].route.route_type;
  }

  pathSegment.addRenderedSegment(rSegment);
};

Network.prototype.createRenderedEdge = function (pathSegment, gEdge, forward, patterns) {
  var rEdge;

  // construct the edge key, disregarding mode qualifiers (e.g. "_RENT")
  var type = pathSegment.getType().split('_')[0];
  var key = gEdge.id + (forward ? 'F' : 'R') + '_' + type;

  // for non-bus transit edges, append an exemplar pattern ID to the key
  if (patterns && patterns[0].route.route_type !== 3) {
    key += '_' + patterns[0].getId();
  }

  // see if this r-edge already exists
  if (key in this.reLookup) {
    rEdge = this.reLookup[key];
  } else {
    // if not, create it
    rEdge = new RenderedEdge(gEdge, forward, type);
    if (patterns) {
      each(patterns, function (pattern) {
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
  return rEdge;
};

Network.prototype.addVertexPoint = function (point) {
  if (this.baseVertexPoints.indexOf(point) !== -1) return;
  this.baseVertexPoints.push(point);
};

},{"../graph":16,"../point/place":25,"../point/pointclustermap":27,"../point/stop":28,"../renderer/renderededge":32,"../renderer/renderedsegment":33,"../util/polyline.js":40,"../util/spherical-mercator":41,"./journey":2,"./pattern":6,"./route":8,"component-each":84,"component-emitter":85,"debug":90}],4:[function(require,module,exports){
'use strict';

var d3 = require('d3');

var interpolateLine = require('../util/interpolate-line');

/**
 * Expose `NetworkPath`
 */

module.exports = NetworkPath;

/**
 * NetworkPath -- a path through the network graph. Composed of PathSegments (which
 * are in turn composed of a sequence of graph edges)
 *
 * @param {Object} the parent onject (a RoutePattern or Journey)
 */

function NetworkPath(parent) {
  this.parent = parent;
  this.segments = [];
}

NetworkPath.prototype.clearGraphData = function (segment) {
  this.segments.forEach(function (segment) {
    segment.clearGraphData();
  });
};

/**
 * addSegment: add a new segment to the end of this NetworkPath
 */

NetworkPath.prototype.addSegment = function (segment) {
  this.segments.push(segment);
  segment.points.forEach(function (point) {
    point.paths.push(this);
  }, this);
};

/** highlight **/

NetworkPath.prototype.drawHighlight = function (display, capExtension) {
  this.line = d3.svg.line() // the line translation function
  .x(function (pointInfo, i) {
    return display.xScale(pointInfo.x) + (pointInfo.offsetX || 0);
  }).y(function (pointInfo, i) {
    return display.yScale(pointInfo.y) - (pointInfo.offsetY || 0);
  }).interpolate(interpolateLine.bind(this));

  this.lineGraph = display.svg.append('path').attr('id', 'transitive-path-highlight-' + this.parent.getElementId()).attr('class', 'transitive-path-highlight').style('stroke-width', 24).style('stroke', '#ff4').style('fill', 'none').style('visibility', 'hidden').data([this]);
};

NetworkPath.prototype.getRenderedSegments = function () {
  var renderedSegments = [];
  this.segments.forEach(function (pathSegment) {
    renderedSegments = renderedSegments.concat(pathSegment.renderedSegments);
  });
  return renderedSegments;
};

/**
 * getPointArray
 */

NetworkPath.prototype.getPointArray = function () {
  var points = [];
  for (var i = 0; i < this.segments.length; i++) {
    var segment = this.segments[i];
    if (i > 0 && segment.points[0] === this.segments[i - 1].points[this.segments[i - 1].points.length - 1]) {
      points.concat(segment.points.slice(1));
    } else {
      points.concat(segment.points);
    }
  }
  return points;
};

},{"../util/interpolate-line":39,"d3":88}],5:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var each = require('component-each');

var PatternGroup = require('./patterngroup');
var LabelEdgeGroup = require('../labeler/labeledgegroup.js');

var segmentId = 0;

/**
 * Expose `PathSegment`
 */

module.exports = PathSegment;

/**
 *
 */

function PathSegment(type, path) {
  this.id = segmentId++;
  this.type = type;
  this.path = path;
  this.points = [];
  this.edges = [];
  this.renderedSegments = [];
  this.patternGroup = new PatternGroup();
}

PathSegment.prototype.clearGraphData = function () {
  this.edges = [];
  this.points.forEach(function (point) {
    point.graphVertex = null;
  });
  this.renderLength = null;
};

PathSegment.prototype.getId = function () {
  return this.id;
};

PathSegment.prototype.getType = function () {
  return this.type;
};

PathSegment.prototype.addRenderedSegment = function (rSegment) {
  this.renderedSegments.push(rSegment);
};

PathSegment.prototype.addEdge = function (graphEdge, originVertex) {
  this.edges.push({
    graphEdge: graphEdge,
    forward: originVertex === graphEdge.fromVertex
  });
};

PathSegment.prototype.insertEdgeAt = function (index, graphEdge, originVertex) {
  var edgeInfo = {
    graphEdge: graphEdge,
    forward: originVertex === graphEdge.fromVertex
  };
  this.edges.splice(index, 0, edgeInfo);
};

PathSegment.prototype.removeEdge = function (graphEdge) {
  var index = null;
  for (var i = 0; i < this.edges.length; i++) {
    if (this.edges[i].graphEdge === graphEdge) {
      index = i;
      break;
    }
  }
  if (index !== null) this.edges.splice(index, 1);
};

PathSegment.prototype.getEdgeIndex = function (graphEdge) {
  for (var i = 0; i < this.edges.length; i++) {
    if (this.edges[i].graphEdge === graphEdge) return i;
  }
  return -1;
};

/**
 * Get graph vertices
 */

PathSegment.prototype.getGraphVertices = function () {
  var vertices = [];
  this.edges.forEach(function (edge, i) {
    if (i === 0) {
      vertices.push(edge.graphEdge.fromVertex);
    }
    vertices.push(edge.graphEdge.toVertex);
  });
  return vertices;
};

PathSegment.prototype.vertexArray = function () {
  var vertex = this.startVertex();
  var array = [vertex];

  this.edges.forEach(function (edgeInfo) {
    vertex = edgeInfo.graphEdge.oppositeVertex(vertex);
    array.push(vertex);
  });

  return array;
};

PathSegment.prototype.startVertex = function () {
  if (this.points[0].multipoint) return this.points[0].multipoint.graphVertex;
  if (!this.edges || this.edges.length === 0) return null;

  var firstGraphEdge = this.edges[0].graphEdge;
  return this.edges[0].forward ? firstGraphEdge.fromVertex : firstGraphEdge.toVertex;

  /* if (this.graphEdges.length === 1) return this.graphEdges[0].fromVertex;
  var first = this.graphEdges[0],
    next = this.graphEdges[1];
  if (first.toVertex == next.toVertex || first.toVertex == next.fromVertex)
    return first.fromVertex;
  if (first.fromVertex == next.toVertex || first.fromVertex == next.fromVertex)
    return first.toVertex;
  return null; */
};

PathSegment.prototype.endVertex = function () {
  if (this.points[this.points.length - 1].multipoint) return this.points[this.points.length - 1].multipoint.graphVertex;
  if (!this.edges || this.edges.length === 0) return null;

  var lastGraphEdge = this.edges[this.edges.length - 1].graphEdge;
  return this.edges[this.edges.length - 1].forward ? lastGraphEdge.toVertex : lastGraphEdge.fromVertex;

  /* if (this.graphEdges.length === 1) return this.graphEdges[0].toVertex;
  var last = this.graphEdges[this.graphEdges.length - 1],
    prev = this.graphEdges[this.graphEdges.length - 2];
  if (last.toVertex == prev.toVertex || last.toVertex == prev.fromVertex)
    return last.fromVertex;
  if (last.fromVertex == prev.toVertex || last.fromVertex == prev.fromVertex)
    return last.toVertex;
  return null; */
};

PathSegment.prototype.addPattern = function (pattern, fromIndex, toIndex) {
  // Initialize this segment's 'points' array to include the stops in the
  // provided pattern between the specified from and to indices, inclusive.
  // Only do this if the points array is empty or if the the length of the
  // segment being added exceeds that of the one currently stored.
  if (toIndex - fromIndex + 1 > this.points.length) {
    this.points = [];
    var lastStop = null;
    for (var i = fromIndex; i <= toIndex; i++) {
      var stop = pattern.stops[i];
      if (lastStop !== stop) {
        this.points.push(stop);
      }
      lastStop = stop;
    }
  }

  // Add the pattern to this segment's PatternGroup
  this.patternGroup.addPattern(pattern, fromIndex, toIndex);
};

PathSegment.prototype.getPattern = function () {
  return this.patternGroup.patterns[0];
};

PathSegment.prototype.getPatterns = function () {
  return this.patternGroup.patterns;
};

PathSegment.prototype.getMode = function () {
  return this.patternGroup.patterns[0].route.route_type;
};

PathSegment.prototype.toString = function () {
  var startVertex = this.startVertex();
  var endVertex = this.endVertex();
  return 'PathSegment id=' + this.id + ' type=' + this.type + ' from ' + (startVertex ? startVertex.toString() : '(unknown)') + ' to ' + (endVertex ? endVertex.toString() : '(unknown)');
};

PathSegment.prototype.getLabelEdgeGroups = function () {
  var edgeGroups = [];
  each(this.renderedSegments, function (rSegment) {
    if (!rSegment.isFocused()) return;
    var currentGroup = new LabelEdgeGroup(rSegment);
    each(rSegment.renderedEdges, function (rEdge) {
      currentGroup.addEdge(rEdge);
      if (rEdge.graphEdge.toVertex.point.containsSegmentEndPoint()) {
        edgeGroups.push(currentGroup);
        currentGroup = new LabelEdgeGroup(rSegment);
      }
    }, this);
  }, this);

  return edgeGroups;
};

},{"../labeler/labeledgegroup.js":20,"./patterngroup":7,"component-each":84}],6:[function(require,module,exports){
'use strict';

var each = require('component-each');

var NetworkPath = require('./path');
var PathSegment = require('./pathsegment');

var Polyline = require('../util/polyline.js');
var SphericalMercator = require('../util/spherical-mercator');
var sm = new SphericalMercator();

/**
 * Expose `RoutePattern`
 */

module.exports = RoutePattern;

/**
 * A RoutePattern
 *
 * @param {Object} RoutePattern data object from the transitive.js input
 */

function RoutePattern(data, transitive) {
  for (var key in data) {
    if (key === 'stops') continue;
    this[key] = data[key];
  }

  // the array of Stops that make up this pattern
  this.stops = [];

  // the inter-stop geometry, an array of point sequences (themselves arrays)
  // that represent the geometry beween stops i and i+1. This array should be
  // exactly one item shorter than the stops array.
  this.interStopGeometry = [];

  if (transitive) {
    each(data.stops, function (stop) {
      // look up the Stop in the master collection and add to the stops array
      this.stops.push(transitive.stops[stop.stop_id]);

      // if inter-stop geometry is provided: decode polyline, convert points
      // to SphericalMercator, and add to the interStopGeometry array
      if (stop.geometry) {
        var latLons = Polyline.decode(stop.geometry);
        var coords = [];
        each(latLons, function (latLon) {
          coords.push(sm.forward([latLon[1], latLon[0]]));
        });
        this.interStopGeometry.push(coords);
      }
    }, this);
  }

  this.renderedEdges = [];
}

RoutePattern.prototype.getId = function () {
  return this.pattern_id;
};

RoutePattern.prototype.getElementId = function () {
  return 'pattern-' + this.pattern_id;
};

RoutePattern.prototype.getName = function () {
  return this.pattern_name;
};

RoutePattern.prototype.addRenderedEdge = function (rEdge) {
  if (this.renderedEdges.indexOf(rEdge) === -1) this.renderedEdges.push(rEdge);
};

RoutePattern.prototype.offsetAlignment = function (alignmentId, offset) {
  each(this.renderedEdges, function (rEdge) {
    rEdge.offsetAlignment(alignmentId, offset);
  });
};

RoutePattern.prototype.createPath = function () {
  var path = new NetworkPath(this);
  var pathSegment = new PathSegment('TRANSIT', path);
  pathSegment.addPattern(this, 0, this.stops.length - 1);
  path.addSegment(pathSegment);
  return path;
};

},{"../util/polyline.js":40,"../util/spherical-mercator":41,"./path":4,"./pathsegment":5,"component-each":84}],7:[function(require,module,exports){
"use strict";

/**
 * Expose `PatternGroup`
 */

module.exports = PatternGroup;

/**
 * PatternGroup -- a collection of one or more RoutePatterns associated with
 * a PathSegment
 *
 * @param {Object} RoutePattern data object from the transitive.js input
 */

function PatternGroup() {
  this.patterns = [];

  // lookup tables mapping pattern IDs to their from/to indices in the containing PathSegment
  this.fromIndexLookup = {};
  this.toIndexLookup = {};
}

PatternGroup.prototype.addPattern = function (pattern, fromIndex, toIndex) {
  if (this.patterns.indexOf(pattern) === -1) {
    this.patterns.push(pattern);
    this.fromIndexLookup[pattern.pattern_id] = fromIndex;
    this.toIndexLookup[pattern.pattern_id] = toIndex;
  }
};

PatternGroup.prototype.getFromIndex = function (pattern) {
  return this.fromIndexLookup[pattern.pattern_id];
};

PatternGroup.prototype.getToIndex = function (pattern) {
  return this.toIndexLookup[pattern.pattern_id];
};

},{}],8:[function(require,module,exports){
'use strict';

/**
 * Expose `Route`
 */

module.exports = Route;

/**
 * A transit Route, as defined in the input data.
 * Routes contain one or more Patterns.
 *
 * @param {Object}
 */

function Route(data) {
  for (var key in data) {
    if (key === 'patterns') continue;
    this[key] = data[key];
  }

  this.patterns = [];
}

/**
 * Add Pattern
 *
 * @param {Pattern}
 */

Route.prototype.addPattern = function (pattern) {
  this.patterns.push(pattern);
  pattern.route = this;
};

Route.prototype.getColor = function () {
  if (this.route_color) {
    if (this.route_color.charAt(0) === '#') return this.route_color;
    return '#' + this.route_color;
  }

  // assign a random shade of gray
  /* var c = 128 + Math.floor(64 * Math.random());
  var hex = c.toString(16);
  hex = (hex.length === 1) ? '0' + hex : hex;
   this.route_color = '#' + hex + hex + hex;
   return this.route_color; */
};

},{}],9:[function(require,module,exports){
'use strict';

var d3 = require('d3');

module.exports = function () {
  var size = [960, 500];
  var scale = 256;
  var translate = [size[0] / 2, size[1] / 2];
  var zoomDelta = 0;

  function tile() {
    var z = Math.max(Math.log(scale) / Math.LN2 - 8, 0);
    var z0 = Math.round(z + zoomDelta);
    var k = Math.pow(2, z - z0 + 8);
    var origin = [(translate[0] - scale / 2) / k, (translate[1] - scale / 2) / k];
    var tiles = [];
    var cols = d3.range(Math.max(0, Math.floor(-origin[0])), Math.max(0, Math.ceil(size[0] / k - origin[0])));
    var rows = d3.range(Math.max(0, Math.floor(-origin[1])), Math.max(0, Math.ceil(size[1] / k - origin[1])));

    rows.forEach(function (y) {
      cols.forEach(function (x) {
        tiles.push([x, y, z0]);
      });
    });

    tiles.translate = origin;
    tiles.scale = k;

    return tiles;
  }

  tile.size = function (_) {
    if (!arguments.length) return size;
    size = _;
    return tile;
  };

  tile.scale = function (_) {
    if (!arguments.length) return scale;
    scale = _;
    return tile;
  };

  tile.translate = function (_) {
    if (!arguments.length) return translate;
    translate = _;
    return tile;
  };

  tile.zoomDelta = function (_) {
    if (!arguments.length) return zoomDelta;
    zoomDelta = +_;
    return tile;
  };

  return tile;
};

},{"d3":88}],10:[function(require,module,exports){
'use strict';

/**
 * Draw the snapping grid
 *
 * @param {Display} display object
 * @param {Number} cell size
 */

module.exports = function drawGrid(display, cellSize) {
  var svg = display.svg;
  var xScale = display.xScale;
  var yScale = display.yScale;

  // Remove all current gridlines
  svg.selectAll('.gridline').remove();

  // Add a grid group "behind" everything else
  var grid = svg.insert('g', ':first-child');

  var xRange = xScale.range();
  var yRange = yScale.range();
  var xDomain = xScale.domain();
  var yDomain = yScale.domain();

  var xMin = Math.round(xDomain[0] / cellSize) * cellSize;
  var xMax = Math.round(xDomain[1] / cellSize) * cellSize;
  for (var x = xMin; x <= xMax; x += cellSize) {
    appendLine(xScale(x), xScale(x), yRange[0], yRange[1]);
  }var yMin = Math.round(yDomain[0] / cellSize) * cellSize;
  var yMax = Math.round(yDomain[1] / cellSize) * cellSize;
  for (var y = yMin; y <= yMax; y += cellSize) {
    appendLine(xRange[0], xRange[1], yScale(y), yScale(y));
  }function appendLine(x1, x2, y1, y2) {
    grid.append('line').attr({
      'class': 'gridline',
      'x1': x1,
      'x2': x2,
      'y1': y1,
      'y2': y2
    });
  }
};

},{}],11:[function(require,module,exports){
'use strict';

var d3 = require('d3');
var debug = require('debug')('transitive:display');

var Legend = require('./legend');
var TileLayer = require('./tile-layer');

var SphericalMercator = require('../util/spherical-mercator');
var sm = new SphericalMercator();

/**
 * Expose `Display`
 */

module.exports = Display;

/**
 * The D3-based SVG display.
 *
 * @param {Object} options
 */

function Display(transitive) {
  this.transitive = transitive;
  var el = this.el = transitive.el;
  this.width = el.clientWidth;
  this.height = el.clientHeight;

  // Set up the pan/zoom behavior
  var zoom = this.zoom = d3.behavior.zoom().scaleExtent([0.25, 4]);

  var self = this;

  var zoomBehavior = function zoomBehavior() {
    self.computeScale();
    if (self.scale !== self.lastScale) {
      // zoom action
      self.zoomChanged();
    } else {
      // pan action
      setTimeout(transitive.refresh.bind(transitive, true), 0);
    }

    var llb = self.llBounds();
    debug('ll bounds: ' + llb[0][0] + ',' + llb[0][1] + ' to ' + llb[1][0] + ',' + llb[1][1]);
  };

  this.zoom.on('zoom.transitive', zoomBehavior);

  this.zoomFactors = transitive.options.zoomFactors || this.getDefaultZoomFactors();

  // set up the svg display
  var div = d3.select(el).attr('class', 'Transitive');

  if (transitive.options.zoomEnabled) {
    div.call(zoom);
  }

  this.svg = div.append('svg').attr('class', 'schematic-map');

  // initialize the x/y scale objects
  this.xScale = d3.scale.linear();
  this.yScale = d3.scale.linear();

  // set up the resize event handler
  if (transitive.options.autoResize) {
    d3.select(window).on('resize.display', function () {
      self.resized();
      transitive.refresh();
    });
  }

  // set the scale
  var bounds;
  if (transitive.options.initialBounds) {
    bounds = [sm.forward(transitive.options.initialBounds[0]), sm.forward(transitive.options.initialBounds[1])];
  } else if (transitive.network && transitive.network.graph) {
    bounds = transitive.network.graph.bounds();
  }

  if (bounds) {
    this.setScale(bounds, transitive.options);
    this.updateActiveZoomFactors(this.scale);
    this.lastScale = this.scale;
  } else {
    this.updateActiveZoomFactors(1);
  }

  // set up the map layer
  if (transitive.options.mapboxId) {
    this.tileLayer = new TileLayer({
      el: this.el,
      display: this,
      graph: transitive.graph,
      mapboxId: transitive.options.mapboxId
    });
  }

  // set up the legend
  if (transitive.options.legendEl) {
    this.legend = new Legend(transitive.options.legendEl, this, transitive);
  }

  transitive.emit('initialize display', transitive, this);
  return this;
}

/**
 * zoomChanged -- called when the zoom level changes, either by through the native
 * zoom support or the setBounds() API call. Updates zoom factors as needed and
 * performs appropriate update action (render or refresh)
 */

Display.prototype.zoomChanged = function () {
  if (this.updateActiveZoomFactors(this.scale)) {
    this.transitive.network = null;
    this.transitive.render();
  } else this.transitive.refresh();
  this.lastScale = this.scale;
};

Display.prototype.updateActiveZoomFactors = function (scale) {
  var updated = false;
  for (var i = 0; i < this.zoomFactors.length; i++) {
    var min = this.zoomFactors[i].minScale;
    var max = i < this.zoomFactors.length - 1 ? this.zoomFactors[i + 1].minScale : Number.MAX_VALUE;

    // check if we've crossed into a new zoomFactor partition
    if ((!this.lastScale || this.lastScale < min || this.lastScale >= max) && scale >= min && scale < max) {
      this.activeZoomFactors = this.zoomFactors[i];
      updated = true;
    }
  }
  return updated;
};

/**
 * Return default zoom factors
 */

Display.prototype.getDefaultZoomFactors = function (data) {
  return [{
    minScale: 0,
    gridCellSize: 25,
    internalVertexFactor: 1000000,
    angleConstraint: 45,
    mergeVertexThreshold: 200
  }, {
    minScale: 1.5,
    gridCellSize: 0,
    internalVertexFactor: 0,
    angleConstraint: 5,
    mergeVertexThreshold: 0
  }];
};

/**
 * Empty the display
 */

Display.prototype.empty = function () {
  debug('emptying svg');
  this.svg.selectAll('*').remove();

  this.haloLayer = this.svg.insert('g', ':first-child');
};

/**
 * Set the scale
 */

Display.prototype.setScale = function (bounds, options) {
  this.height = this.el.clientHeight;
  this.width = this.el.clientWidth;

  var domains = getDomains(this, this.height, this.width, bounds, options);
  this.xScale.domain(domains[0]);
  this.yScale.domain(domains[1]);

  this.xScale.range([0, this.width]);
  this.yScale.range([this.height, 0]);

  debug('x scale %j -> %j', this.xScale.domain(), this.xScale.range());
  debug('y scale %j -> %j', this.yScale.domain(), this.yScale.range());

  this.zoom.x(this.xScale).y(this.yScale);

  this.initXRes = (domains[0][1] - domains[0][0]) / this.width;
  this.scale = 1;

  this.scaleSet = true;
};

Display.prototype.computeScale = function () {
  var newXRes = (this.xScale.domain()[1] - this.xScale.domain()[0]) / this.width;
  this.scale = this.initXRes / newXRes;
};

/**
 * updateDomains -- set x/y domains of geographic (spherical mercator) coordinate
 * system. Does *not* check/adjust aspect ratio.
 */

Display.prototype.updateDomains = function (bounds) {
  this.xScale.domain([bounds[0][0], bounds[1][0]]);
  this.yScale.domain([bounds[0][1], bounds[1][1]]);

  this.zoom.x(this.xScale).y(this.yScale);

  this.computeScale();
};

Display.prototype.resized = function () {
  var newWidth = this.el.clientWidth;
  var newHeight = this.el.clientHeight;

  var xDomain = this.xScale.domain();
  var xFactor = newWidth / this.width;
  var xDomainAdj = (xDomain[1] - xDomain[0]) * (xFactor - 1) / 2;
  this.xScale.domain([xDomain[0] - xDomainAdj, xDomain[1] + xDomainAdj]);

  var yDomain = this.yScale.domain();
  var yFactor = newHeight / this.height;
  var yDomainAdj = (yDomain[1] - yDomain[0]) * (yFactor - 1) / 2;
  this.yScale.domain([yDomain[0] - yDomainAdj, yDomain[1] + yDomainAdj]);

  this.xScale.range([0, newWidth]);
  this.yScale.range([newHeight, 0]);

  this.height = newHeight;
  this.width = newWidth;

  this.zoom.x(this.xScale).y(this.yScale);
};

Display.prototype.xyBounds = function () {
  var x = this.xScale.domain();
  var y = this.yScale.domain();
  return [[x[0], y[0]], [x[1], y[1]]];
};

/**
 * Lat/lon bounds
 */

Display.prototype.llBounds = function () {
  var x = this.xScale.domain();
  var y = this.yScale.domain();

  return [sm.inverse([x[0], y[0]]), sm.inverse([x[1], y[1]])];
};

Display.prototype.isInRange = function (x, y) {
  var xRange = this.xScale.range();
  var yRange = this.yScale.range();

  return x >= xRange[0] && x <= xRange[1] && y >= yRange[1] && y <= yRange[0];
};

/**
 * Compute the x/y coordinate space domains to fit the graph.
 */

function getDomains(display, height, width, bounds, options) {
  var xmin = bounds[0][0];
  var xmax = bounds[1][0];
  var ymin = bounds[0][1];
  var ymax = bounds[1][1];
  var xRange = xmax - xmin;
  var yRange = ymax - ymin;

  var paddingFactor = options && options.paddingFactor ? options.paddingFactor : 0.1;

  var margins = getMargins(options);

  var usableHeight = height - margins.top - margins.bottom;
  var usableWidth = width - margins.left - margins.right;
  var displayAspect = width / height;
  var usableDisplayAspect = usableWidth / usableHeight;
  var graphAspect = xRange / (yRange === 0 ? -Infinity : yRange);

  var padding;
  var dispX1, dispX2, dispY1, dispY2;
  var dispXRange, dispYRange;

  if (usableDisplayAspect > graphAspect) {
    // y-axis is limiting
    padding = paddingFactor * yRange;
    dispY1 = ymin - padding;
    dispY2 = ymax + padding;
    dispYRange = yRange + 2 * padding;
    var addedYRange = height / usableHeight * dispYRange - dispYRange;
    if (margins.top > 0 || margins.bottom > 0) {
      dispY1 -= margins.bottom / (margins.bottom + margins.top) * addedYRange;
      dispY2 += margins.top / (margins.bottom + margins.top) * addedYRange;
    }
    dispXRange = (dispY2 - dispY1) * displayAspect;
    var xOffset = (margins.left - margins.right) / width;
    var xMidpoint = (xmax + xmin - dispXRange * xOffset) / 2;
    dispX1 = xMidpoint - dispXRange / 2;
    dispX2 = xMidpoint + dispXRange / 2;
  } else {
    // x-axis limiting
    padding = paddingFactor * xRange;
    dispX1 = xmin - padding;
    dispX2 = xmax + padding;
    dispXRange = xRange + 2 * padding;
    var addedXRange = width / usableWidth * dispXRange - dispXRange;
    if (margins.left > 0 || margins.right > 0) {
      dispX1 -= margins.left / (margins.left + margins.right) * addedXRange;
      dispX2 += margins.right / (margins.left + margins.right) * addedXRange;
    }

    dispYRange = (dispX2 - dispX1) / displayAspect;
    var yOffset = (margins.bottom - margins.top) / height;
    var yMidpoint = (ymax + ymin - dispYRange * yOffset) / 2;
    dispY1 = yMidpoint - dispYRange / 2;
    dispY2 = yMidpoint + dispYRange / 2;
  }

  return [[dispX1, dispX2], [dispY1, dispY2]];
}

function getMargins(options) {
  var margins = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  };

  if (options && options.displayMargins) {
    if (options.displayMargins.top) margins.top = options.displayMargins.top;
    if (options.displayMargins.bottom) margins.bottom = options.displayMargins.bottom;
    if (options.displayMargins.left) margins.left = options.displayMargins.left;
    if (options.displayMargins.right) margins.right = options.displayMargins.right;
  }

  return margins;
}

},{"../util/spherical-mercator":41,"./legend":12,"./tile-layer":13,"d3":88,"debug":90}],12:[function(require,module,exports){
'use strict';

var d3 = require('d3');

var RenderedEdge = require('../renderer/renderededge');
var RenderedSegment = require('../renderer/renderedsegment');
var Util = require('../util');
var Stop = require('../point/stop');

/**
 * Expose `Legend`
 */

module.exports = Legend;

function Legend(el, display, transitive) {
  this.el = el;
  this.display = display;
  this.transitive = transitive;

  this.height = Util.parsePixelStyle(d3.select(el).style('height'));
}

Legend.prototype.render = function (legendSegments) {
  d3.select(this.el).selectAll(':not(.doNotEmpty)').remove();

  this.x = this.spacing;
  this.y = this.height / 2;

  var segment;

  // iterate through the representative map segments
  for (var legendType in legendSegments) {
    var mapSegment = legendSegments[legendType];

    // create a segment solely for rendering in the legend
    segment = new RenderedSegment();
    segment.type = mapSegment.getType();
    segment.mode = mapSegment.mode;
    segment.patterns = mapSegment.patterns;

    var canvas = this.createCanvas();

    var renderData = [];
    renderData.push({
      x: 0,
      y: canvas.height / 2
    });
    renderData.push({
      x: canvas.width,
      y: canvas.height / 2
    });

    segment.render(canvas);
    segment.refresh(canvas, renderData);

    this.renderText(getDisplayText(legendType));

    this.x += this.spacing * 2;
  }

  // create the 'transfer' marker

  var rEdge = new RenderedEdge(null, true, 'TRANSIT');
  rEdge.pattern = {
    pattern_id: 'ptn',
    route: {
      route_type: 1
    }
  };

  var transferStop = new Stop();
  transferStop.isSegmentEndPoint = true;
  transferStop.isTransferPoint = true;

  this.renderPoint(transferStop, rEdge, 'Transfer');
};

Legend.prototype.renderPoint = function (point, rEdge, text) {
  var canvas = this.createCanvas();

  point.addRenderData({
    owner: point,
    rEdge: rEdge,
    x: canvas.width / 2,
    y: canvas.height / 2,
    offsetX: 0,
    offsetY: 0
  });

  point.render(canvas);

  canvas.styler.stylePoint(canvas, point);
  point.refresh(canvas);

  this.renderText(text);
};

Legend.prototype.renderText = function (text) {
  d3.select(this.el).append('div').attr('class', 'legendLabel').html(text);
};

Legend.prototype.createCanvas = function () {
  var container = d3.select(this.el).append('div').attr('class', 'legendSvg');

  var width = Util.parsePixelStyle(container.style('width'));
  if (!width || width === 0) width = 30;

  var height = Util.parsePixelStyle(container.style('height'));
  if (!height || height === 0) height = this.height;

  var canvas = {
    xScale: d3.scale.linear(),
    yScale: d3.scale.linear(),
    styler: this.transitive.styler,
    zoom: this.display.zoom,
    width: width,
    height: height,
    svg: container.append('svg').style('width', width).style('height', height)
  };

  return canvas;
};

function getDisplayText(type) {
  switch (type) {
    case 'WALK':
      return 'Walk';
    case 'BICYCLE':
      return 'Bike';
    case 'CAR':
      return 'Drive';
    case 'TRANSIT_0':
      return 'Tram';
    case 'TRANSIT_1':
      return 'Metro';
    case 'TRANSIT_2':
      return 'Rail';
    case 'TRANSIT_3':
      return 'Bus';
    case 'TRANSIT_4':
      return 'Ferry';
  }
  return type;
}

},{"../point/stop":28,"../renderer/renderededge":32,"../renderer/renderedsegment":33,"../util":38,"d3":88}],13:[function(require,module,exports){
'use strict';

var d3 = require('d3');
var debug = require('debug')('transitive:tile-layer');

var geoTile = require('./d3.geo.tile');

var prefix = prefixMatch(['webkit', 'ms', 'Moz', 'O']);

/**
 * Tile layer takes a parent element, a zoom behavior, and a Mapbox ID
 *
 * @param {Object} opts
 */

module.exports = function TileLayer(opts) {
  debug('creating the tile layer');

  var el = opts.el;
  var display = opts.display;
  var height = el.clientHeight;
  var id = opts.mapboxId;
  var width = el.clientWidth;

  // Set up the projection
  var projection = d3.geo.mercator().translate([width / 2, height / 2]);

  // Set up the map tiles
  var tile = geoTile();

  // Create the tile layer
  var tileLayer = d3.select(el).append('div').attr('class', 'tile-layer');

  // Initial zoom
  zoomed();

  this.zoomed = zoomed;

  // Reload tiles on pan and zoom
  function zoomed() {
    // Get the height and width
    height = el.clientHeight;
    width = el.clientWidth;

    // Set the map tile size
    tile.size([width, height]);

    // Get the current display bounds
    var bounds = display.llBounds();

    // Project the bounds based on the current projection
    var psw = projection(bounds[0]);
    var pne = projection(bounds[1]);

    // Based the new scale and translation vector off the current one
    var scale = projection.scale() * 2 * Math.PI;
    var translate = projection.translate();

    var dx = pne[0] - psw[0];
    var dy = pne[1] - psw[1];

    scale = scale * (1 / Math.max(dx / width, dy / height));
    projection.translate([width / 2, height / 2]).scale(scale / 2 / Math.PI);

    // Reproject the bounds based on the new scale and translation vector
    psw = projection(bounds[0]);
    pne = projection(bounds[1]);
    var x = (psw[0] + pne[0]) / 2;
    var y = (psw[1] + pne[1]) / 2;
    translate = [width - x, height - y];

    // Update the Geo tiles
    tile.scale(scale).translate(translate);

    // Get the new set of tiles and render
    renderTiles(tile());
  }

  // Render tiles
  function renderTiles(tiles) {
    var image = tileLayer.style(prefix + 'transform', matrix3d(tiles.scale, tiles.translate)).selectAll('.tile').data(tiles, function (d) {
      return d;
    });

    image.exit().remove();

    image.enter().append('img').attr('class', 'tile').attr('src', function (d) {
      return 'http://' + ['a', 'b', 'c', 'd'][Math.random() * 4 | 0] + '.tiles.mapbox.com/v3/' + id + '/' + d[2] + '/' + d[0] + '/' + d[1] + '.png';
    }).style('left', function (d) {
      return (d[0] << 8) + 'px';
    }).style('top', function (d) {
      return (d[1] << 8) + 'px';
    });
  }
};

/**
 * Get the 3D Transform Matrix
 */

function matrix3d(scale, translate) {
  var k = scale / 256;
  var r = scale % 1 ? Number : Math.round;
  return 'matrix3d(' + [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, r(translate[0] * scale), r(translate[1] * scale), 0, 1] + ')';
}

/**
 * Match the transform prefix
 */

function prefixMatch(p) {
  var i = -1;
  var n = p.length;
  var s = document.body.style;
  while (++i < n) {
    if (p[i] + 'Transform' in s) return '-' + p[i].toLowerCase() + '-';
  }
  return '';
}

},{"./d3.geo.tile":9,"d3":88,"debug":90}],14:[function(require,module,exports){
'use strict';

var each = require('component-each');

var Util = require('../util');

/**
 * Expose `Edge`
 */

module.exports = Edge;

/**
 * Initialize a new edge
 * @constructor
 * @param {Point[]} pointArray - the internal Points for this Edge
 * @param {Vertex} fromVertex
 * @param {Vertex} toVertex
 */

var edgeId = 0;

function Edge(pointArray, fromVertex, toVertex) {
  this.id = edgeId++;
  this.pointArray = pointArray;
  this.fromVertex = fromVertex;
  this.toVertex = toVertex;
  this.pathSegments = [];
  this.renderedEdges = [];
}

Edge.prototype.getId = function () {
  return this.id;
};

/**
 *
 */

Edge.prototype.getLength = function () {
  var dx = this.toVertex.x - this.fromVertex.x;
  var dy = this.toVertex.y - this.fromVertex.y;
  return Math.sqrt(dx * dx + dy * dy);
};

Edge.prototype.getWorldLength = function () {
  if (!this.worldLength) this.calculateWorldLengthAndMidpoint();
  return this.worldLength;
};

Edge.prototype.getWorldMidpoint = function () {
  if (!this.worldMidpoint) this.calculateWorldLengthAndMidpoint();
  return this.worldMidpoint;
};

Edge.prototype.calculateWorldLengthAndMidpoint = function () {
  var allPoints = [this.fromVertex.point].concat(this.pointArray, [this.toVertex.point]);
  this.worldLength = 0;
  for (var i = 0; i < allPoints.length - 1; i++) {
    this.worldLength += Util.distance(allPoints[i].worldX, allPoints[i].worldY, allPoints[i + 1].worldX, allPoints[i + 1].worldY);
  }

  if (this.worldLength === 0) {
    this.worldMidpoint = {
      x: this.fromVertex.point.worldX,
      y: this.fromVertex.point.worldY
    };
  } else {
    var distTraversed = 0;
    for (i = 0; i < allPoints.length - 1; i++) {
      var dist = Util.distance(allPoints[i].worldX, allPoints[i].worldY, allPoints[i + 1].worldX, allPoints[i + 1].worldY);
      if ((distTraversed + dist) / this.worldLength >= 0.5) {
        // find the position along this segment (0 <= t <= 1) where the edge midpoint lies
        var t = (0.5 - distTraversed / this.worldLength) / (dist / this.worldLength);
        this.worldMidpoint = {
          x: allPoints[i].worldX + t * (allPoints[i + 1].worldX - allPoints[i].worldX),
          y: allPoints[i].worldY + t * (allPoints[i + 1].worldY - allPoints[i].worldY)
        };
        this.pointsBeforeMidpoint = i;
        this.pointsAfterMidpoint = this.pointArray.length - i;
        break;
      }
      distTraversed += dist;
    }
  }
};

/**
 *
 */

Edge.prototype.isAxial = function () {
  return this.toVertex.x === this.fromVertex.x || this.toVertex.y === this.fromVertex.y;
};

/**
 *
 */

Edge.prototype.hasCurvature = function () {
  return this.elbow !== null;
};

/**
 *
 */

Edge.prototype.replaceVertex = function (oldVertex, newVertex) {
  if (oldVertex === this.fromVertex) this.fromVertex = newVertex;
  if (oldVertex === this.toVertex) this.toVertex = newVertex;
};

/**
 *  Add a path segment that traverses this edge
 */

Edge.prototype.addPathSegment = function (segment) {
  this.pathSegments.push(segment);
};

Edge.prototype.copyPathSegments = function (baseEdge) {
  each(baseEdge.pathSegments, function (pathSegment) {
    this.addPathSegment(pathSegment);
  }, this);
};

Edge.prototype.getPathSegmentIds = function (baseEdge) {
  var pathSegIds = [];
  each(this.pathSegments, function (segment) {
    pathSegIds.push(segment.id);
  });
  pathSegIds.sort();
  return pathSegIds.join(',');
};

/**
 *
 */

Edge.prototype.addRenderedEdge = function (rEdge) {
  if (this.renderedEdges.indexOf(rEdge) !== -1) return;
  this.renderedEdges.push(rEdge);
};

/** internal geometry functions **/

Edge.prototype.calculateGeometry = function (cellSize, angleConstraint) {
  // if(!this.hasTransit()) angleConstraint = 5;
  angleConstraint = angleConstraint || 45;

  this.angleConstraintR = angleConstraint * Math.PI / 180;

  this.fx = this.fromVertex.point.worldX;
  this.fy = this.fromVertex.point.worldY;
  this.tx = this.toVertex.point.worldX;
  this.ty = this.toVertex.point.worldY;

  var midpoint = this.getWorldMidpoint();

  var targetFromAngle = Util.getVectorAngle(midpoint.x - this.fx, midpoint.y - this.fy);
  this.constrainedFromAngle = Math.round(targetFromAngle / this.angleConstraintR) * this.angleConstraintR;

  var fromAngleDelta = Math.abs(this.constrainedFromAngle - targetFromAngle);
  this.fvx = Math.cos(this.constrainedFromAngle);
  this.fvy = Math.sin(this.constrainedFromAngle);

  var targetToAngle = Util.getVectorAngle(midpoint.x - this.tx, midpoint.y - this.ty);

  this.constrainedToAngle = Math.round(targetToAngle / this.angleConstraintR) * this.angleConstraintR;

  var toAngleDelta = Math.abs(this.constrainedToAngle - targetToAngle);
  this.tvx = Math.cos(this.constrainedToAngle);
  this.tvy = Math.sin(this.constrainedToAngle);

  var tol = 0.01;
  var v = Util.normalizeVector({
    x: this.toVertex.x - this.fromVertex.x,
    y: this.toVertex.y - this.fromVertex.y
  });

  // check if we need to add curvature
  if (!equalVectors(this.fvx, this.fvy, -this.tvx, -this.tvy, tol) || !equalVectors(this.fvx, this.fvy, v.x, v.y, tol)) {
    // see if the default endpoint angles produce a valid intersection
    var isect = this.computeEndpointIntersection();

    if (isect.intersect) {
      // if so, compute the elbow and we're done
      this.elbow = {
        x: this.fx + isect.u * this.fvx,
        y: this.fy + isect.u * this.fvy
      };
    } else {
      // if not, adjust the two endpoint angles until they properly intersect

      // default test: compare angle adjustments (if significant difference)
      if (Math.abs(fromAngleDelta - toAngleDelta) > 0.087) {
        if (fromAngleDelta < toAngleDelta) {
          this.adjustToAngle();
        } else {
          this.adjustFromAngle();
        }
      } else {
        // secondary test: look at distribution of shapepoints
        if (this.pointsAfterMidpoint < this.pointsBeforeMidpoint) {
          this.adjustToAngle();
        } else {
          this.adjustFromAngle();
        }
      }
    }
  }

  this.fromAngle = this.constrainedFromAngle;
  this.toAngle = this.constrainedToAngle;

  this.calculateVectors();
  this.calculateAlignmentIds();
};

/**
 *  Adjust the 'to' endpoint angle by rotating it increments of angleConstraintR
 *  until a valid intersection between the from and to endpoint rays is achieved.
 */

Edge.prototype.adjustToAngle = function () {
  var ccw = Util.ccw(this.fx, this.fy, this.fx + this.fvx, this.fy + this.fvy, this.tx, this.ty);
  var delta = ccw > 0 ? this.angleConstraintR : -this.angleConstraintR;
  var i = 0;
  var isect;
  while (i++ < 100) {
    this.constrainedToAngle += delta;
    this.tvx = Math.cos(this.constrainedToAngle);
    this.tvy = Math.sin(this.constrainedToAngle);
    isect = this.computeEndpointIntersection();
    if (isect.intersect) break;
  }
  this.elbow = {
    x: this.fx + isect.u * this.fvx,
    y: this.fy + isect.u * this.fvy
  };
};

/**
 *  Adjust the 'from' endpoint angle by rotating it increments of angleConstraintR
 *  until a valid intersection between the from and to endpoint rays is achieved.
 */

Edge.prototype.adjustFromAngle = function () {
  var ccw = Util.ccw(this.tx, this.ty, this.tx + this.tvx, this.ty + this.tvy, this.fx, this.fy);
  var delta = ccw > 0 ? this.angleConstraintR : -this.angleConstraintR;
  var i = 0;
  var isect;
  while (i++ < 100) {
    this.constrainedFromAngle += delta;
    this.fvx = Math.cos(this.constrainedFromAngle);
    this.fvy = Math.sin(this.constrainedFromAngle);
    isect = this.computeEndpointIntersection();
    if (isect.intersect) break;
  }
  this.elbow = {
    x: this.fx + isect.u * this.fvx,
    y: this.fy + isect.u * this.fvy
  };
};

Edge.prototype.computeEndpointIntersection = function () {
  return Util.rayIntersection(this.fx, this.fy, this.fvx, this.fvy, this.tx, this.ty, this.tvx, this.tvy);
};

function equalVectors(x1, y1, x2, y2, tol) {
  tol = tol || 0;
  return Math.abs(x1 - x2) < tol && Math.abs(y1 - y2) < tol;
}

Edge.prototype.calculateVectors = function (fromAngle, toAngle) {
  this.fromVector = {
    x: Math.cos(this.fromAngle),
    y: Math.sin(this.fromAngle)
  };

  this.fromleftVector = {
    x: -this.fromVector.y,
    y: this.fromVector.x
  };

  this.fromRightVector = {
    x: this.fromVector.y,
    y: -this.fromVector.x
  };

  this.toVector = {
    x: Math.cos(this.toAngle + Math.PI),
    y: Math.sin(this.toAngle + Math.PI)
  };

  this.toleftVector = {
    x: -this.toVector.y,
    y: this.toVector.x
  };

  this.toRightVector = {
    x: this.toVector.y,
    y: -this.toVector.x
  };
};

/**
 *  Compute the 'alignment id', a string that uniquely identifies a line in
 *  2D space given a point and angle relative to the x-axis.
 */

Edge.prototype.calculateAlignmentId = function (x, y, angle) {
  var angleD = Math.round(angle * 180 / Math.PI);
  if (angleD > 90) angleD -= 180;
  if (angleD <= -90) angleD += 180;

  if (angleD === 90) {
    return '90_x' + x;
  }

  // calculate the y-axis crossing
  var ya = Math.round(y - x * Math.tan(angle));
  return angleD + '_y' + ya;
};

Edge.prototype.calculateAlignmentIds = function () {
  this.fromAlignmentId = this.calculateAlignmentId(this.fromVertex.x, this.fromVertex.y, this.fromAngle);
  this.toAlignmentId = this.calculateAlignmentId(this.toVertex.x, this.toVertex.y, this.toAngle);
};

Edge.prototype.hasTransit = function (cellSize) {
  // debug(this);
  for (var i = 0; i < this.pathSegments.length; i++) {
    if (this.pathSegments[i].getType() === 'TRANSIT') {
      return true;
    }
  }
  return false;
};

Edge.prototype.getFromAlignmentId = function () {
  return this.fromAlignmentId;
};

Edge.prototype.getToAlignmentId = function () {
  return this.toAlignmentId;
};

Edge.prototype.getAlignmentRange = function (alignmentId) {
  var p1, p2;
  if (alignmentId === this.fromAlignmentId) {
    p1 = this.fromVertex;
    p2 = this.elbow || this.toVertex;
  } else if (alignmentId === this.toAlignmentId) {
    p1 = this.toVertex;
    p2 = this.elbow || this.fromVertex;
  } else {
    return null;
  }

  var min, max;
  if (alignmentId.substring(0, 2) === '90') {
    min = Math.min(p1.y, p2.y);
    max = Math.max(p1.y, p2.y);
  } else {
    min = Math.min(p1.x, p2.x);
    max = Math.max(p1.x, p2.x);
  }

  return {
    min: min,
    max: max
  };
};

Edge.prototype.align = function (vertex, vector) {
  if (this.aligned || !this.hasCurvature()) return;
  var currentVector = this.getVector(vertex);
  if (Math.abs(currentVector.x) !== Math.abs(vector.x) || Math.abs(currentVector.y) !== Math.abs(vector.y)) {
    this.curveAngle = -this.curveAngle;
    this.calculateGeometry();
  }
  this.aligned = true;
};

Edge.prototype.getGeometricCoords = function (fromOffsetPx, toOffsetPx, display, forward) {
  var coords = [];

  // reverse the coords array if needed
  var geomCoords = forward ? this.geomCoords : this.geomCoords.concat().reverse();

  each(geomCoords, function (coord, i) {
    var fromVector = null;
    var toVector = null;
    var rightVector;
    var xOffset, yOffset;
    var x1 = display.xScale(coord[0]);
    var y1 = display.yScale(coord[1]);

    // calculate the vector leading in to this coordinate
    if (i > 0) {
      var prevCoord = geomCoords[i - 1];
      var x0 = display.xScale(prevCoord[0]);
      var y0 = display.yScale(prevCoord[1]);
      if (x1 === x0 && y1 === y0) return;

      toVector = {
        x: x1 - x0,
        y: y1 - y0
      };
    }

    // calculate the vector leading out from this coordinate
    if (i < geomCoords.length - 1) {
      var nextCoord = geomCoords[i + 1];
      var x2 = display.xScale(nextCoord[0]);
      var y2 = display.yScale(nextCoord[1]);
      if (x2 === x1 && y2 === y1) return;

      fromVector = {
        x: x2 - x1,
        y: y2 - y1
      };
    }

    if (fromVector && !toVector) {
      // the first point in the geomCoords sequence
      rightVector = Util.normalizeVector({
        x: fromVector.y,
        y: -fromVector.x
      });
      xOffset = fromOffsetPx * rightVector.x;
      yOffset = fromOffsetPx * rightVector.y;
    } else if (!fromVector && toVector) {
      // the last point in the geomCoords sequence
      rightVector = Util.normalizeVector({
        x: toVector.y,
        y: -toVector.x
      });
      xOffset = fromOffsetPx * rightVector.x;
      yOffset = fromOffsetPx * rightVector.y;
    } else {
      // an internal point
      rightVector = Util.normalizeVector({
        x: fromVector.y,
        y: -fromVector.x
      });
      xOffset = fromOffsetPx * rightVector.x;
      yOffset = fromOffsetPx * rightVector.y;

      // TODO: properly compute the offsets based on both vectors
    }

    coords.push({
      x: x1 + xOffset,
      y: y1 + yOffset
    });
  }, this);
  return coords;
};

Edge.prototype.getRenderCoords = function (fromOffsetPx, toOffsetPx, display, forward) {
  var isBase = fromOffsetPx === 0 && toOffsetPx === 0;

  if (!this.baseRenderCoords && !isBase) {
    this.calculateBaseRenderCoords(display);
  }

  var fromOffsetX = fromOffsetPx * this.fromRightVector.x;
  var fromOffsetY = fromOffsetPx * this.fromRightVector.y;

  var toOffsetX = toOffsetPx * this.toRightVector.x;
  var toOffsetY = toOffsetPx * this.toRightVector.y;

  var fx = this.fromVertex.getRenderX(display) + fromOffsetX;
  var fy = this.fromVertex.getRenderY(display) - fromOffsetY;
  var fvx = this.fromVector.x;
  var fvy = -this.fromVector.y;

  var tx = this.toVertex.getRenderX(display) + toOffsetX;
  var ty = this.toVertex.getRenderY(display) - toOffsetY;
  var tvx = -this.toVector.x;
  var tvy = this.toVector.y;

  var coords = [];

  // append the first ('from') coordinate
  coords.push({
    x: forward ? fx : tx,
    y: forward ? fy : ty
  });

  var len = null;
  var x1;
  var y1;
  var x2;
  var y2;

  // determine if this edge has an elbow, i.e. a bend in the middle
  if (isBase && !this.isStraight() || !isBase && this.baseRenderCoords.length === 4) {
    var isect = Util.rayIntersection(fx, fy, fvx, fvy, tx, ty, tvx, tvy);
    if (isect.intersect) {
      var u = isect.u;
      var ex = fx + fvx * u;
      var ey = fy + fvy * u;

      this.ccw = Util.ccw(fx, fy, ex, ey, tx, ty);

      // calculate the angle of the arc
      var angleR = this.getElbowAngle();

      // calculate the radius of the arc in pixels, taking offsets into consideration
      var rPx = this.getBaseRadiusPx() - this.ccw * (fromOffsetPx + toOffsetPx) / 2;

      // calculate the distance from the elbow to place the arc endpoints in each direction
      var d = rPx * Math.tan(angleR / 2);

      // make sure the arc endpoint placement distance is not longer than the either of the
      // elbow-to-edge-endpoint distances
      var l1 = Util.distance(fx, fy, ex, ey);
      var l2 = Util.distance(tx, ty, ex, ey);
      d = Math.min(Math.min(l1, l2), d);

      x1 = ex - this.fromVector.x * d;
      y1 = ey + this.fromVector.y * d;

      x2 = ex + this.toVector.x * d;
      y2 = ey - this.toVector.y * d;

      var radius = Util.getRadiusFromAngleChord(angleR, Util.distance(x1, y1, x2, y2));
      var arc = angleR * (180 / Math.PI) * (this.ccw < 0 ? 1 : -1);

      if (forward) {
        coords.push({
          x: x1,
          y: y1,
          len: Util.distance(fx, fy, x1, y1)
        });

        coords.push({
          x: x2,
          y: y2,
          len: angleR * radius,
          arc: arc,
          radius: radius
        });

        len = Util.distance(x2, y2, tx, ty);
      } else {
        // backwards traversal
        coords.push({
          x: x2,
          y: y2,
          len: Util.distance(tx, ty, x2, y2)
        });

        coords.push({
          x: x1,
          y: y1,
          len: angleR * radius,
          arc: -arc,
          radius: radius
        });

        len = Util.distance(x1, y1, fx, fy);
      }
    }
  }

  // if the length wasn't calculated during elbow-creation, do it now
  if (len === null) len = Util.distance(fx, fy, tx, ty);

  // append the final ('to') coordinate
  coords.push({
    x: forward ? tx : fx,
    y: forward ? ty : fy,
    len: len
  });

  return coords;
};

Edge.prototype.calculateBaseRenderCoords = function (display) {
  this.baseRenderCoords = this.getRenderCoords(0, 0, display, true);
};

Edge.prototype.isStraight = function () {
  var tol = 0.00001;
  return Math.abs(this.fromVector.x - this.toVector.x) < tol && Math.abs(this.fromVector.y - this.toVector.y) < tol;
};

Edge.prototype.getBaseRadiusPx = function () {
  return 15;
};

Edge.prototype.getElbowAngle = function () {
  var cx = this.fromVector.x - this.toVector.x;
  var cy = this.fromVector.y - this.toVector.y;

  var c = Math.sqrt(cx * cx + cy * cy) / 2;

  var theta = Math.asin(c);

  return theta * 2;
};

Edge.prototype.getRenderLength = function (display) {
  if (!this.baseRenderCoords) this.calculateBaseRenderCoords(display);

  if (!this.renderLength) {
    this.renderLength = 0;
    for (var i = 1; i < this.baseRenderCoords.length; i++) {
      this.renderLength += this.baseRenderCoords[i].len;
    }
  }
  return this.renderLength;
};

/**
 * Retrieve the coordinate located at a defined percentage along an Edge's length.
 * @param {Number} t - a value between 0 and 1 representing the location of the
 *   point to be computed
 * @param {Object[]} coords - the offset coordinates computed for this edge.
 * @param {Display} display
 * @returns {Object} - the coordinate as an {x,y} Object
 */

Edge.prototype.coordAlongEdge = function (t, coords, display) {
  if (!this.baseRenderCoords) {
    this.calculateBaseRenderCoords(display);
  }

  if (coords.length !== this.baseRenderCoords.length) {
    return this.coordAlongOffsetEdge(t, coords, display);
  }

  // get the length of this edge in screen units using the "base" (i.e. un-offset) render coords
  var len = this.getRenderLength();

  var loc = t * len; // the target distance along the Edge's base geometry
  var cur = 0; // our current location along the edge (in world units)

  for (var i = 1; i < this.baseRenderCoords.length; i++) {
    if (loc < cur + this.baseRenderCoords[i].len) {
      var t2 = (loc - cur) / this.baseRenderCoords[i].len;

      if (coords[i].arc) {
        var r = coords[i].radius;
        var theta = Math.PI * coords[i].arc / 180;
        var ccw = Util.ccw(coords[0].x, coords[0].y, coords[1].x, coords[1].y, coords[2].x, coords[2].y);

        return Util.pointAlongArc(coords[1].x, coords[1].y, coords[2].x, coords[2].y, r, theta, ccw, t2);
      } else {
        var dx = coords[i].x - coords[i - 1].x;
        var dy = coords[i].y - coords[i - 1].y;

        return {
          x: coords[i - 1].x + dx * t2,
          y: coords[i - 1].y + dy * t2
        };
      }
    }
    cur += this.baseRenderCoords[i].len;
  }
};

Edge.prototype.coordAlongOffsetEdge = function (t, coords, display) {
  if (!this.baseRenderCoords) this.calculateBaseRenderCoords(display);

  var len = 0;
  for (var i = 1; i < coords.length; i++) {
    len += coords[i].len;
  }

  var loc = t * len; // the target distance along the Edge's base geometry
  var cur = 0; // our current location along the edge (in world units)

  for (i = 1; i < coords.length; i++) {
    if (loc < cur + coords[i].len) {
      var t2 = (loc - cur) / coords[i].len;

      if (coords[i].arc) {
        // arc segment
        var r = coords[i].radius;
        var theta = Math.PI * coords[i].arc / 180;
        var ccw = Util.ccw(coords[0].x, coords[0].y, coords[1].x, coords[1].y, coords[2].x, coords[2].y);

        return Util.pointAlongArc(coords[1].x, coords[1].y, coords[2].x, coords[2].y, r, theta, ccw, t2);
      } else {
        // straight segment
        var dx = coords[i].x - coords[i - 1].x;
        var dy = coords[i].y - coords[i - 1].y;

        return {
          x: coords[i - 1].x + dx * t2,
          y: coords[i - 1].y + dy * t2
        };
      }
    }
    cur += coords[i].len;
  }
};

Edge.prototype.clearRenderData = function () {
  this.baseRenderCoords = null;
  this.renderLength = null;
};

Edge.prototype.getVector = function (vertex) {
  if (vertex === this.fromVertex) return this.fromVector;
  if (vertex === this.toVertex) return this.toVector;
};

/**
 *  Gets the vertex opposite another vertex on an edge
 */

Edge.prototype.oppositeVertex = function (vertex) {
  if (vertex === this.toVertex) return this.fromVertex;
  if (vertex === this.fromVertex) return this.toVertex;
  return null;
};

Edge.prototype.commonVertex = function (edge) {
  if (this.fromVertex === edge.fromVertex || this.fromVertex === edge.toVertex) return this.fromVertex;
  if (this.toVertex === edge.fromVertex || this.toVertex === edge.toVertex) return this.toVertex;
  return null;
};

/**
 *
 */

Edge.prototype.setPointLabelPosition = function (pos, skip) {
  if (this.fromVertex.point !== skip) this.fromVertex.point.labelPosition = pos;
  if (this.toVertex.point !== skip) this.toVertex.point.labelPosition = pos;

  this.pointArray.forEach(function (point) {
    if (point !== skip) point.labelPosition = pos;
  });
};

/**
 *  Determines if this edge is part of a standalone, non-transit path
 *  (e.g. a walk/bike/drive-only journey)
 */

Edge.prototype.isNonTransitPath = function () {
  return this.pathSegments.length === 1 && this.pathSegments[0] !== 'TRANSIT' && this.pathSegments[0].path.segments.length === 1;
};

/**
 *
 */

Edge.prototype.toString = function () {
  return 'Edge ' + this.getId() + ' (' + this.fromVertex.toString() + ' to ' + this.toVertex.toString() + ')';
};

},{"../util":38,"component-each":84}],15:[function(require,module,exports){
'use strict';

var each = require('component-each');
var PriorityQueue = require('priorityqueuejs');

var Util = require('../util');

/**
 * Expose `EdgeGroup`
 */

module.exports = EdgeGroup;

/**
 *  A group of edges that share the same endpoint vertices
 */

function EdgeGroup(fromVertex, toVertex, type) {
  this.fromVertex = fromVertex;
  this.toVertex = toVertex;
  this.type = type;
  this.edges = [];
  this.commonPoints = null;
  this.worldLength = 0;
}

EdgeGroup.prototype.addEdge = function (edge) {
  this.edges.push(edge);
  edge.edgeGroup = this;

  // update the groups worldLength
  this.worldLength = Math.max(this.worldLength, edge.getWorldLength());

  if (this.commonPoints === null) {
    // if this is first edge added, initialize group's commonPoint array to include all of edge's points
    this.commonPoints = [];
    each(edge.pointArray, function (point) {
      this.commonPoints.push(point);
    }, this);
  } else {
    // otherwise, update commonPoints array to only include those in added edge
    var newCommonPoints = [];
    each(edge.pointArray, function (point) {
      if (this.commonPoints.indexOf(point) !== -1) newCommonPoints.push(point);
    }, this);
    this.commonPoints = newCommonPoints;
  }
};

EdgeGroup.prototype.getWorldLength = function () {
  return this.worldLength;
};

EdgeGroup.prototype.getInternalVertexPQ = function () {
  // create an array of all points on the edge (endpoints and internal)
  var allPoints = [this.fromVertex.point].concat(this.commonPoints, [this.toVertex.point]);

  var pq = new PriorityQueue(function (a, b) {
    return a.weight - b.weight;
  });

  for (var i = 1; i < allPoints.length - 1; i++) {
    var weight = this.getInternalVertexWeight(allPoints, i);
    pq.enq({
      weight: weight,
      point: allPoints[i]
    });
  }

  return pq;
};

EdgeGroup.prototype.getInternalVertexWeight = function (pointArray, index) {
  var x1 = pointArray[index - 1].worldX;
  var y1 = pointArray[index - 1].worldY;
  var x2 = pointArray[index].worldX;
  var y2 = pointArray[index].worldY;
  var x3 = pointArray[index + 1].worldX;
  var y3 = pointArray[index + 1].worldY;

  // the weighting function is a combination of:
  // - the distances from this internal point to the two adjacent points, normalized for edge length (longer distances are prioritized)
  // - the angle formed by this point and the two adjacent ones ('sharper' angles are prioritized)
  var inDist = Util.distance(x1, y1, x2, y2);
  var outDist = Util.distance(x2, y2, x3, y3);
  var theta = Util.angleFromThreePoints(x1, y1, x2, y2, x3, y3);
  var edgeLen = this.getWorldLength();
  var weight = inDist / edgeLen + outDist / edgeLen + Math.abs(Math.PI - theta) / Math.PI;

  return weight;
};

EdgeGroup.prototype.hasTransit = function () {
  for (var i = 0; i < this.edges.length; i++) {
    if (this.edges[i].hasTransit()) return true;
  }
  return false;
};

EdgeGroup.prototype.isNonTransitPath = function () {
  return this.edges.length === 1 && this.edges[0].isNonTransitPath();
};

EdgeGroup.prototype.getTurnPoints = function (maxAngle) {
  var points = [];
  maxAngle = maxAngle || 0.75 * Math.PI;
  each(this.commonPoints, function (point) {
    if (point.getType() !== 'TURN') return;
    if (Math.abs(point.turnAngle) < maxAngle) {
      points.push(point);
    }
  });
  return points;
};

},{"../util":38,"component-each":84,"priorityqueuejs":92}],16:[function(require,module,exports){
'use strict';

var d3 = require('d3');
var debug = require('debug')('transitive:graph');
var each = require('component-each');

var Edge = require('./edge');
var EdgeGroup = require('./edgegroup');
var Vertex = require('./vertex');
var MultiPoint = require('../point/multipoint');
var Util = require('../util');

/**
 * Expose `NetworkGraph`
 */

module.exports = NetworkGraph;

/**
 *  An graph representing the underlying 'wireframe' network
 */

function NetworkGraph(network, vertices) {
  this.network = network;
  this.edges = [];
  this.vertices = [];

  /**
   *  Object mapping groups of edges that share the same two vertices.
   *  - Key is string of format A_B, where A and B are vertex IDs and A < B
   *  - Value is array of edges
   */
  this.edgeGroups = {};

  // Add all base vertices
  for (var i in vertices) {
    this.addVertex(vertices[i], vertices[i].worldX, vertices[i].worldY);
  }
}

/**
 * Get the bounds of the graph in the graph's internal x/y coordinate space
 *
 * @return [[left, top], [right, bottom]]
 */

NetworkGraph.prototype.bounds = function () {
  var xmax = null;
  var xmin = null;
  var ymax = null;
  var ymin = null;

  for (var i in this.vertices) {
    var vertex = this.vertices[i];
    xmin = xmin ? Math.min(xmin, vertex.x) : vertex.x;
    xmax = xmax ? Math.max(xmax, vertex.x) : vertex.x;
    ymin = ymin ? Math.min(ymin, vertex.y) : vertex.y;
    ymax = ymax ? Math.max(ymax, vertex.y) : vertex.y;
  }

  var maxExtent = 20037508.34;
  return [[xmin || -maxExtent, ymin || -maxExtent], [xmax || maxExtent, ymax || maxExtent]];
};

/**
 * Add Vertex
 */

NetworkGraph.prototype.addVertex = function (point, x, y) {
  if (x === undefined || y === undefined) {
    var xy = Util.latLonToSphericalMercator(point.getLat(), point.getLon());
    x = xy[0];
    y = xy[1];
  }
  var vertex = new Vertex(point, x, y);
  this.vertices.push(vertex);
  return vertex;
};

/**
 * Add Edge
 */

NetworkGraph.prototype.addEdge = function (stops, from, to, segmentType) {
  if (this.vertices.indexOf(from) === -1 || this.vertices.indexOf(to) === -1) {
    debug('Error: Cannot add edge. Graph does not contain vertices.');
    return;
  }

  var edge = new Edge(stops, from, to);
  this.edges.push(edge);
  from.edges.push(edge);
  to.edges.push(edge);

  var groupKey = this.network.transitive.options.groupEdges ? this.getEdgeGroupKey(edge, segmentType) : edge.getId();

  if (!(groupKey in this.edgeGroups)) {
    this.edgeGroups[groupKey] = new EdgeGroup(edge.fromVertex, edge.toVertex, segmentType);
  }
  this.edgeGroups[groupKey].addEdge(edge);

  return edge;
};

NetworkGraph.prototype.removeEdge = function (edge) {
  // remove from the graph's edge collection
  var edgeIndex = this.edges.indexOf(edge);
  if (edgeIndex !== -1) this.edges.splice(edgeIndex, 1);

  // remove from any associated path segment edge lists
  edge.pathSegments.forEach(function (segment) {
    segment.removeEdge(edge);
  });

  // remove from the endpoint vertex incidentEdge collections
  edge.fromVertex.removeEdge(edge);
  edge.toVertex.removeEdge(edge);
};

NetworkGraph.prototype.getEdgeGroup = function (edge) {
  return this.edgeGroups[this.getEdgeGroupKey(edge)];
};

NetworkGraph.prototype.getEdgeGroupKey = function (edge, segmentType) {
  return edge.fromVertex.getId() < edge.toVertex.getId() ? segmentType + '_' + edge.fromVertex.getId() + '_' + edge.toVertex.getId() : segmentType + '_' + edge.toVertex.getId() + '_' + edge.fromVertex.getId();
};

NetworkGraph.prototype.mergeVertices = function (vertexArray) {
  var xTotal = 0;
  var yTotal = 0;

  var vertexGroups = {
    'STOP': [],
    'PLACE': [],
    'TURN': [],
    'MULTI': []
  };
  vertexArray.forEach(function (vertex) {
    if (vertex.point.getType() in vertexGroups) vertexGroups[vertex.point.getType()].push(vertex);
  });

  var mergePoint;

  // don't merge stops and places, or multiple places:
  if (vertexGroups.STOP.length > 0 && vertexGroups.PLACE.length > 0 || vertexGroups.PLACE.length > 1 || vertexGroups.MULTI.length > 0) return;

  // if merging turns with a place, create a new merged vertex around the place
  if (vertexGroups.PLACE.length === 1 && vertexGroups.TURN.length > 0) {
    mergePoint = vertexGroups.PLACE[0].point;
    // if merging turns with a single place, create a new merged vertex around the stop
  } else if (vertexGroups.STOP.length === 1 && vertexGroups.TURN.length > 0) {
    mergePoint = vertexGroups.STOP[0].point;
    // if merging multiple stops, create a new MultiPoint vertex
  } else if (vertexGroups.STOP.length > 1) {
    mergePoint = new MultiPoint();
    each(vertexGroups.STOP, function (stopVertex) {
      mergePoint.addPoint(stopVertex.point);
    });
    // if merging multiple turns
  } else if (vertexGroups.TURN.length > 1) {
    mergePoint = vertexGroups.TURN[0].point;
  }

  if (!mergePoint) return;
  var mergedVertex = new Vertex(mergePoint, 0, 0);

  vertexArray.forEach(function (vertex) {
    xTotal += vertex.x;
    yTotal += vertex.y;

    var edges = [];
    each(vertex.edges, function (edge) {
      edges.push(edge);
    });

    each(edges, function (edge) {
      if (vertexArray.indexOf(edge.fromVertex) !== -1 && vertexArray.indexOf(edge.toVertex) !== -1) {
        this.removeEdge(edge);
        return;
      }
      edge.replaceVertex(vertex, mergedVertex);
      mergedVertex.addEdge(edge);
    }, this);
    var index = this.vertices.indexOf(vertex);
    if (index !== -1) this.vertices.splice(index, 1);
  }, this);

  mergedVertex.x = xTotal / vertexArray.length;
  mergedVertex.y = yTotal / vertexArray.length;
  mergedVertex.oldVertices = vertexArray;

  this.vertices.push(mergedVertex);
};

NetworkGraph.prototype.sortVertices = function () {
  this.vertices.sort(function (a, b) {
    if (a.point && a.point.getType() === 'PLACE') return -1;
    if (b.point && b.point.getType() === 'PLACE') return 1;

    if (a.point && a.point.getType() === 'MULTI') return -1;
    if (b.point && b.point.getType() === 'MULTI') return 1;

    if (a.point && a.point.getType() === 'STOP') return -1;
    if (b.point && b.point.getType() === 'STOP') return 1;
  });
};

/**
 * Get the equivalent edge
 */

NetworkGraph.prototype.getEquivalentEdge = function (pointArray, from, to) {
  for (var e = 0; e < this.edges.length; e++) {
    var edge = this.edges[e];
    if (edge.fromVertex === from && edge.toVertex === to && pointArray.length === edge.pointArray.length && equal(pointArray, edge.pointArray)) {
      return edge;
    }
    if (edge.fromVertex === to && edge.toVertex === from && pointArray.length === edge.pointArray.length && equal(pointArray.slice(0).reverse(), edge.pointArray)) {
      return edge;
    }
  }
};

/**
 *  Split a specified graph edge around a set of specified split points, where
 *  all split points are internal points of the edge to be split. A set of N
 *  valid split points will result in N+1 new edges. The original edge is
 *  removed from the graph.
 */

NetworkGraph.prototype.splitEdgeAtInternalPoints = function (edge, points) {
  var subEdgePoints = [];
  var newEdge;
  var newEdgeInfoArr = [];
  var fromVertex = edge.fromVertex;
  var geomCoords = [];

  // iterate through the parent edge points, creating new sub-edges as needed
  each(edge.pointArray, function (point, i) {
    if (edge.pointGeom && i < edge.pointGeom.length) {
      geomCoords = geomCoords.concat(edge.pointGeom[i]);
    }
    if (points.indexOf(point) !== -1) {
      // we've reached a split point
      var x = point.worldX;
      var y = point.worldY;
      var newVertex = point.graphVertex || this.addVertex(point, x, y);
      newVertex.isInternal = true;
      newEdge = this.addEdge(subEdgePoints, fromVertex, newVertex, edge.edgeGroup.type);
      newEdge.isInternal = true;
      newEdge.copyPathSegments(edge);
      newEdgeInfoArr.push({
        graphEdge: newEdge,
        fromVertex: fromVertex
      });
      if (geomCoords.length > 0) newEdge.geomCoords = geomCoords;

      subEdgePoints = [];
      fromVertex = newVertex;
      geomCoords = [];
    } else {
      // otherwise, this point becomes an internal point of the new edge currently being created
      subEdgePoints.push(point);
    }
  }, this);

  // create the last sub-edge
  newEdge = this.addEdge(subEdgePoints, fromVertex, edge.toVertex, edge.edgeGroup.type);
  newEdge.isInternal = true;
  newEdge.copyPathSegments(edge);
  if (edge.pointGeom && edge.pointArray.length < edge.pointGeom.length) {
    geomCoords = geomCoords.concat(edge.pointGeom[edge.pointArray.length]);
  }
  if (geomCoords.length > 0) newEdge.geomCoords = geomCoords;

  newEdgeInfoArr.push({
    graphEdge: newEdge,
    fromVertex: fromVertex
  });

  // insert the new edge sequence into the affected segments
  each(edge.pathSegments, function (pathSegment) {
    var indexInSegment = pathSegment.getEdgeIndex(edge);
    var forward = pathSegment.edges[indexInSegment].forward;
    var index = pathSegment.getEdgeIndex(edge);
    each(forward ? newEdgeInfoArr : newEdgeInfoArr.reverse(), function (edgeInfo) {
      pathSegment.insertEdgeAt(index, edgeInfo.graphEdge, forward ? edgeInfo.fromVertex : edgeInfo.toVertex);
      index++;
    });
  });

  // remove the original edge from the graph
  this.removeEdge(edge);
};

/* NetworkGraph.prototype.collapseTransfers = function(threshold) {
  if(!threshold) return;
  this.edges.forEach(function(edge) {
    if (edge.getLength() > threshold ||
      edge.fromVertex.point.containsFromPoint() ||
      edge.fromVertex.point.containsToPoint() ||
      edge.toVertex.point.containsFromPoint() ||
      edge.toVertex.point.containsToPoint()) return;
    //if(edge.fromVertex.point.getType() === 'PLACE' || edge.toVertex.point.getType() === 'PLACE') return;
    var notTransit = true;
    edge.pathSegments.forEach(function(segment) {
      notTransit = notTransit && segment.type !== 'TRANSIT';
    });
    if (notTransit) {
      this.mergeVertices([edge.fromVertex, edge.toVertex]);
    }
  }, this);
}; */

NetworkGraph.prototype.pruneVertices = function () {
  each(this.vertices, function (vertex) {
    if (vertex.point.containsSegmentEndPoint()) return;

    var opposites = [];
    var pathSegmentBundles = {}; // maps pathSegment id list (string) to collection of edges (array)

    each(vertex.edges, function (edge) {
      var pathSegmentIds = edge.getPathSegmentIds();
      if (!(pathSegmentIds in pathSegmentBundles)) pathSegmentBundles[pathSegmentIds] = [];
      pathSegmentBundles[pathSegmentIds].push(edge);
      var opp = edge.oppositeVertex(vertex);
      if (opposites.indexOf(opp) === -1) opposites.push(opp);
    });

    if (opposites.length !== 2) return;

    each(pathSegmentBundles, function (ids) {
      var edgeArr = pathSegmentBundles[ids];
      if (edgeArr.length === 2) this.mergeEdges(edgeArr[0], edgeArr[1]);
    }, this);
  }, this);
};

NetworkGraph.prototype.mergeEdges = function (edge1, edge2) {
  // check for infinite recursion loop case
  if (edge1.fromVertex === edge2.toVertex && edge2.fromVertex === edge1.toVertex) {
    return;
  }

  // reverse edges if necessary
  if (edge1.fromVertex === edge2.toVertex) {
    this.mergeEdges(edge2, edge1);
    return;
  }

  if (edge1.toVertex !== edge2.fromVertex) return; // edges cannot be merged

  var internalPoints = edge1.pointArray.concat(edge2.pointArray);

  var newEdge = this.addEdge(internalPoints, edge1.fromVertex, edge2.toVertex, edge1.edgeGroup.type);
  newEdge.pathSegments = edge1.pathSegments;
  each(newEdge.pathSegments, function (segment) {
    // var i = segment.graphEdges.indexOf(edge1);
    // segment.graphEdges.splice(i, 0, newEdge);
    var i = segment.getEdgeIndex(edge1);
    segment.insertEdgeAt(i, newEdge, newEdge.fromVertex);
  });

  // if both input edges are have coordinate geometry, merge the coords arrays in the new edge
  if (edge1.geomCoords && edge2.geomCoords) {
    newEdge.geomCoords = edge1.geomCoords.concat(edge2.geomCoords.length > 0 ? edge2.geomCoords.slice(1) : []);
  }

  debug('merging:');
  debug(edge1);
  debug(edge2);
  this.removeEdge(edge1);
  this.removeEdge(edge2);
};

NetworkGraph.prototype.snapToGrid = function (cellSize) {
  var coincidenceMap = {};
  this.vertices.forEach(function (vertex) {
    var nx = Math.round(vertex.x / cellSize) * cellSize;
    var ny = Math.round(vertex.y / cellSize) * cellSize;
    vertex.x = nx;
    vertex.y = ny;

    var key = nx + '_' + ny;
    if (!(key in coincidenceMap)) coincidenceMap[key] = [vertex];else coincidenceMap[key].push(vertex);
  });

  each(coincidenceMap, function (key) {
    var vertexArr = coincidenceMap[key];
    if (vertexArr.length > 1) {
      this.mergeVertices(vertexArr);
    }
  }, this);
};

NetworkGraph.prototype.calculateGeometry = function (cellSize, angleConstraint) {
  this.edges.forEach(function (edge) {
    edge.calculateGeometry(cellSize, angleConstraint);
  });
};

NetworkGraph.prototype.resetCoordinates = function () {
  this.vertices.forEach(function (vertex) {
    vertex.x = vertex.origX;
    vertex.y = vertex.origY;
  });
};

NetworkGraph.prototype.recenter = function () {
  var xCoords = [];
  var yCoords = [];
  this.vertices.forEach(function (v) {
    xCoords.push(v.x);
    yCoords.push(v.y);
  });

  var mx = d3.median(xCoords);
  var my = d3.median(yCoords);

  this.vertices.forEach(function (v) {
    v.x = v.x - mx;
    v.y = v.y - my;
  });
};

/** 2D line bundling & offsetting **/

NetworkGraph.prototype.apply2DOffsets = function () {
  this.initComparisons();

  var alignmentBundles = {}; // maps alignment ID to array of range-bounded bundles on that alignment

  var addToBundle = function addToBundle(rEdge, alignmentId) {
    var bundle;

    // compute the alignment range of the edge being bundled
    var range = rEdge.graphEdge.getAlignmentRange(alignmentId);

    // check if bundles already exist for this alignment
    if (!(alignmentId in alignmentBundles)) {
      // if not, create new and add to collection
      bundle = new AlignmentBundle();
      bundle.addEdge(rEdge, range.min, range.max);
      alignmentBundles[alignmentId] = [bundle]; // new AlignmentBundle();
    } else {
      // 1 or more bundles currently exist for this alignmentId
      var bundleArr = alignmentBundles[alignmentId];

      // see if the segment range overlaps with that of an existing bundle
      for (var i = 0; i < bundleArr.length; i++) {
        if (bundleArr[i].rangeOverlaps(range.min, range.max)) {
          bundleArr[i].addEdge(rEdge, range.min, range.max);
          return;
        }
      }

      // ..if not, create a new bundle
      bundle = new AlignmentBundle();
      bundle.addEdge(rEdge, range.min, range.max);
      bundleArr.push(bundle);
    }
  };

  each(this.edges, function (edge) {
    var fromAlignmentId = edge.getFromAlignmentId();
    var toAlignmentId = edge.getToAlignmentId();

    each(edge.renderedEdges, function (rEdge) {
      addToBundle(rEdge, fromAlignmentId);
      addToBundle(rEdge, toAlignmentId);
    });
  });

  var bundleSorter = function (a, b) {
    var aId = a.patternIds || a.pathSegmentIds;
    var bId = b.patternIds || b.pathSegmentIds;

    var aVector = a.getAlignmentVector(this.currentAlignmentId);
    var bVector = b.getAlignmentVector(this.currentAlignmentId);
    var isOutward = Util.isOutwardVector(aVector) && Util.isOutwardVector(bVector) ? 1 : -1;

    var abCompId = aId + '_' + bId;
    if (abCompId in this.bundleComparisons) {
      return isOutward * this.bundleComparisons[abCompId];
    }

    var baCompId = bId + '_' + aId;
    if (baCompId in this.bundleComparisons) {
      return isOutward * this.bundleComparisons[baCompId];
    }

    if (a.route && b.route && a.route.route_type !== b.route.route_type) {
      return a.route.route_type > b.route.route_type ? 1 : -1;
    }

    var isForward = a.forward && b.forward ? 1 : -1;
    return isForward * isOutward * (aId < bId ? -1 : 1);
  }.bind(this);

  each(alignmentBundles, function (alignmentId) {
    var bundleArr = alignmentBundles[alignmentId];
    each(bundleArr, function (bundle) {
      if (bundle.items.length <= 1) return;
      var lw = 1.2;
      var bundleWidth = lw * (bundle.items.length - 1);

      this.currentAlignmentId = alignmentId;
      bundle.items.sort(bundleSorter);
      each(bundle.items, function (rEdge, i) {
        var offset = -bundleWidth / 2 + i * lw;
        if (rEdge.getType() === 'TRANSIT') {
          each(rEdge.patterns, function (pattern) {
            pattern.offsetAlignment(alignmentId, offset);
          });
        } else rEdge.offsetAlignment(alignmentId, offset);
      });
    }, this);
  }, this);
};

/**
 * Traverses the graph vertex-by-vertex, creating comparisons between all pairs of
 * edges for which a topological relationship can be established.
 */

NetworkGraph.prototype.initComparisons = function () {
  this.bundleComparisons = {};

  each(this.vertices, function (vertex) {
    var incidentGraphEdges = vertex.incidentEdges();

    var angleREdges = {};
    each(incidentGraphEdges, function (incidentGraphEdge) {
      var angle = incidentGraphEdge.fromVertex === vertex ? incidentGraphEdge.fromAngle : incidentGraphEdge.toAngle;
      var angleDeg = 180 * angle / Math.PI;
      if (!(angleDeg in angleREdges)) angleREdges[angleDeg] = [];
      angleREdges[angleDeg] = angleREdges[angleDeg].concat(incidentGraphEdge.renderedEdges);
    });

    each(angleREdges, function (angle) {
      var rEdges = angleREdges[angle];
      if (rEdges.length < 2) return;
      for (var i = 0; i < rEdges.length - 1; i++) {
        for (var j = i + 1; j < rEdges.length; j++) {
          var re1 = rEdges[i];
          var re2 = rEdges[j];

          var opp1 = re1.graphEdge.oppositeVertex(vertex);
          var opp2 = re2.graphEdge.oppositeVertex(vertex);

          var ccw = Util.ccw(opp1.x, opp1.y, vertex.x, vertex.y, opp2.x, opp2.y);

          if (ccw === 0) {
            var s1Ext = re1.findExtension(opp1);
            var s2Ext = re2.findExtension(opp2);
            if (s1Ext) opp1 = s1Ext.graphEdge.oppositeVertex(opp1);
            if (s2Ext) opp2 = s2Ext.graphEdge.oppositeVertex(opp2);
            ccw = Util.ccw(opp1.x, opp1.y, vertex.x, vertex.y, opp2.x, opp2.y);
          }

          ccw = getInverse(re1, re2, vertex) * ccw;

          if (ccw > 0) {
            // e1 patterns are 'less' than e2 patterns
            this.storeComparison(re1, re2);
          }

          if (ccw < 0) {
            // e2 patterns are 'less' than e2 patterns
            this.storeComparison(re2, re1);
          }
        }
      }
    }, this);
  }, this);
};

function getInverse(s1, s2, vertex) {
  return s1.graphEdge.toVertex === vertex && s2.graphEdge.toVertex === vertex || s1.graphEdge.toVertex === vertex && s2.graphEdge.fromVertex === vertex ? -1 : 1;
}

NetworkGraph.prototype.storeComparison = function (s1, s2) {
  var s1Id = s1.patternIds || s1.pathSegmentIds;
  var s2Id = s2.patternIds || s2.pathSegmentIds;
  debug('storing comparison: ' + s1Id + ' < ' + s2Id);
  this.bundleComparisons[s1Id + '_' + s2Id] = -1;
  this.bundleComparisons[s2Id + '_' + s1Id] = 1;
};

/**
 *  AlignmentBundle class
 */

function AlignmentBundle() {
  this.items = []; // RenderedEdges
  this.min = Number.MAX_VALUE;
  this.max = -Number.MAX_VALUE;
}

AlignmentBundle.prototype.addEdge = function (rEdge, min, max) {
  if (this.items.indexOf(rEdge) === -1) {
    this.items.push(rEdge);
  }

  this.min = Math.min(this.min, min);
  this.max = Math.max(this.max, max);
};

AlignmentBundle.prototype.rangeOverlaps = function (min, max) {
  return this.min < max && min < this.max;
};

/**
 * Check if arrays are equal
 */

function equal(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  for (var i in a) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

},{"../point/multipoint":24,"../util":38,"./edge":14,"./edgegroup":15,"./vertex":17,"component-each":84,"d3":88,"debug":90}],17:[function(require,module,exports){
'use strict';

/**
 * Expose `Vertex`
 */

module.exports = Vertex;

/**
 * Initialize new Vertex
 *
 * @param {Stop/Place}
 * @param {Number}
 * @param {Number}
 */

var edgeId = 0;

function Vertex(point, x, y) {
  this.id = edgeId++;
  this.point = point;
  this.point.graphVertex = this;
  this.x = this.origX = x;
  this.y = this.origY = y;
  this.edges = [];
}

Vertex.prototype.getId = function () {
  return this.id;
};

Vertex.prototype.getRenderX = function (display) {
  return display.xScale(this.x) + this.point.placeOffsets.x;
};

Vertex.prototype.getRenderY = function (display) {
  return display.yScale(this.y) + this.point.placeOffsets.y;
};

/**
 * Move to new coordinate
 *
 * @param {Number}
 * @param {Number}
 */

Vertex.prototype.moveTo = function (x, y) {
  this.x = x;
  this.y = y;
  /* this.edges.forEach(function (edge) {
    edge.calculateVectors();
  }); */
};

/**
 * Get array of edges incident to vertex. Allows specification of "incoming" edge that will not be included in results
 *
 * @param {Edge}
 */

Vertex.prototype.incidentEdges = function (inEdge) {
  var results = [];
  this.edges.forEach(function (edge) {
    if (edge !== inEdge) results.push(edge);
  });
  return results;
};

/**
 * Add an edge to the vertex's edge list
 *
 * @param {Edge}
 */

Vertex.prototype.addEdge = function (edge) {
  var index = this.edges.indexOf(edge);
  if (index === -1) this.edges.push(edge);
};

/**
 * Remove an edge from the vertex's edge list
 *
 * @param {Edge}
 */

Vertex.prototype.removeEdge = function (edge) {
  var index = this.edges.indexOf(edge);
  if (index !== -1) this.edges.splice(index, 1);
};

Vertex.prototype.toString = function () {
  return 'Vertex ' + this.getId() + ' (' + (this.point ? this.point.toString() : 'no point assigned') + ')';
};

},{}],18:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var augment = require('augment');
var each = require('component-each');
var d3 = require('d3');

var SegmentLabel = require('./segmentlabel');
var Util = require('../util');

/**
 * Labeler object
 */

var Labeler = augment(Object, function () {
  this.constructor = function (transitive) {
    this.transitive = transitive;
    this.clear();
  };

  this.clear = function (transitive) {
    this.points = [];
  };

  this.updateLabelList = function (graph) {
    this.points = [];
    graph.vertices.forEach(function (vertex) {
      var point = vertex.point;
      if (point.getType() === 'PLACE' || point.getType() === 'MULTI' || point.getType() === 'STOP' && point.isSegmentEndPoint) {
        this.points.push(point);
      }
    }, this);

    this.points.sort(function compare(a, b) {
      if (a.containsFromPoint() || a.containsToPoint()) return -1;
      if (b.containsFromPoint() || b.containsToPoint()) return 1;
      return 0;
    });
  };

  this.updateQuadtree = function () {
    this.quadtree = d3.geom.quadtree().extent([[-this.width, -this.height], [this.width * 2, this.height * 2]])([]);

    this.addPointsToQuadtree();
    // this.addSegmentsToQuadtree();
  };

  this.addPointsToQuadtree = function () {
    this.points.forEach(function (point) {
      var mbbox = point.getMarkerBBox();
      if (mbbox) this.addBBoxToQuadtree(point.getMarkerBBox());
    }, this);
  };

  this.addSegmentsToQuadtree = function () {
    this.transitive.renderSegments.forEach(function (segment) {
      if (segment.getType() !== 'TRANSIT') return;

      var lw = this.transitive.style.compute(this.transitive.style.segments['stroke-width'], this.transitive.display, segment);
      lw = parseFloat(lw.substring(0, lw.length - 2), 10) - 2;

      var x, x1, x2, y, y1, y2;
      // debug(segment.toString());
      if (segment.renderData.length === 2) {
        // basic straight segment
        if (segment.renderData[0].x === segment.renderData[1].x) {
          // vertical
          x = segment.renderData[0].x - lw / 2;
          y1 = segment.renderData[0].y;
          y2 = segment.renderData[1].y;
          this.addBBoxToQuadtree({
            x: x,
            y: Math.min(y1, y2),
            width: lw,
            height: Math.abs(y1 - y2)
          });
        } else if (segment.renderData[0].y === segment.renderData[1].y) {
          // horizontal
          x1 = segment.renderData[0].x;
          x2 = segment.renderData[1].x;
          y = segment.renderData[0].y - lw / 2;
          this.addBBoxToQuadtree({
            x: Math.min(x1, x2),
            y: y,
            width: Math.abs(x1 - x2),
            height: lw
          });
        }
      }

      if (segment.renderData.length === 4) {
        // basic curved segment

        if (segment.renderData[0].x === segment.renderData[1].x) {
          // vertical first
          x = segment.renderData[0].x - lw / 2;
          y1 = segment.renderData[0].y;
          y2 = segment.renderData[3].y;
          this.addBBoxToQuadtree({
            x: x,
            y: Math.min(y1, y2),
            width: lw,
            height: Math.abs(y1 - y2)
          });

          x1 = segment.renderData[0].x;
          x2 = segment.renderData[3].x;
          y = segment.renderData[3].y - lw / 2;
          this.addBBoxToQuadtree({
            x: Math.min(x1, x2),
            y: y,
            width: Math.abs(x1 - x2),
            height: lw
          });
        } else if (segment.renderData[0].y === segment.renderData[1].y) {
          // horiz first
          x1 = segment.renderData[0].x;
          x2 = segment.renderData[3].x;
          y = segment.renderData[0].y - lw / 2;
          this.addBBoxToQuadtree({
            x: Math.min(x1, x2),
            y: y,
            width: Math.abs(x1 - x2),
            height: lw
          });

          x = segment.renderData[3].x - lw / 2;
          y1 = segment.renderData[0].y;
          y2 = segment.renderData[3].y;
          this.addBBoxToQuadtree({
            x: x,
            y: Math.min(y1, y2),
            width: lw,
            height: Math.abs(y1 - y2)
          });
        }
      }
    }, this);
  };

  this.addBBoxToQuadtree = function (bbox) {
    if (bbox.x + bbox.width / 2 < 0 || bbox.x - bbox.width / 2 > this.width || bbox.y + bbox.height / 2 < 0 || bbox.y - bbox.height / 2 > this.height) return;

    this.quadtree.add([bbox.x + bbox.width / 2, bbox.y + bbox.height / 2, bbox]);

    this.maxBBoxWidth = Math.max(this.maxBBoxWidth, bbox.width);
    this.maxBBoxHeight = Math.max(this.maxBBoxHeight, bbox.height);
  };

  this.doLayout = function () {
    this.width = this.transitive.el.clientWidth;
    this.height = this.transitive.el.clientHeight;

    this.maxBBoxWidth = 0;
    this.maxBBoxHeight = 0;

    this.updateQuadtree();

    var labeledSegments = this.placeSegmentLabels();
    var labeledPoints = this.placePointLabels();

    return {
      segments: labeledSegments,
      points: labeledPoints
    };
  };

  this.placeSegmentLabels = function () {
    each(this.segmentLabels, function (label) {
      label.clear();
    });
    this.segmentLabels = [];
    this.placedLabelKeys = [];

    // collect the bus RenderSegments
    var busRSegments = [];
    each(this.transitive.network.paths, function (path) {
      each(path.getRenderedSegments(), function (rSegment) {
        if (rSegment.type === 'TRANSIT' && rSegment.mode === 3) busRSegments.push(rSegment);
      });
    }, this);

    var edgeGroups = [];
    each(this.transitive.network.paths, function (path) {
      each(path.segments, function (segment) {
        if (segment.type === 'TRANSIT' && segment.getMode() === 3) {
          edgeGroups = edgeGroups.concat(segment.getLabelEdgeGroups());
        }
      });
    }, this);

    // iterate through the sequence collection, labeling as necessary
    // each(busRSegments, function(rSegment) {
    each(edgeGroups, function (edgeGroup) {
      this.currentGroup = edgeGroup;
      // get the array of label strings to be places (typically the unique route short names)
      this.labelTextArray = edgeGroup.getLabelTextArray();

      // create the initial label for placement
      this.labelTextIndex = 0;

      var label = this.getNextLabel(); // this.constructSegmentLabel(rSegment, labelTextArray[labelTextIndex]);
      if (!label) return;

      // iterate through potential anchor locations, attempting placement at each one
      var labelAnchors = edgeGroup.getLabelAnchors(this.transitive.display, label.textHeight * 1.5);
      for (var i = 0; i < labelAnchors.length; i++) {
        label.labelAnchor = labelAnchors[i];

        // do not consider this anchor if it is out of the display range
        if (!this.transitive.display.isInRange(label.labelAnchor.x, label.labelAnchor.y)) continue;

        // check for conflicts with existing placed elements
        var bbox = label.getBBox();
        var conflicts = this.findOverlaps(label, bbox);

        if (conflicts.length === 0) {
          // if no conflicts

          // place the current label
          this.segmentLabels.push(label);
          this.quadtree.add([label.labelAnchor.x, label.labelAnchor.y, label]);
          // debug('placing seg label for ' + label.labelText);

          label = this.getNextLabel();
          if (!label) break;
        }
      } // end of anchor iteration loop
    }, this); // end of sequence iteration loop
  };

  this.getNextLabel = function () {
    while (this.labelTextIndex < this.labelTextArray.length) {
      var labelText = this.labelTextArray[this.labelTextIndex];
      var key = this.currentGroup.edgeIds + '_' + labelText;
      if (this.placedLabelKeys.indexOf(key) !== -1) {
        this.labelTextIndex++;
        continue;
      }
      var label = this.constructSegmentLabel(this.currentGroup.renderedSegment, labelText);
      this.placedLabelKeys.push(key);
      this.labelTextIndex++;
      return label;
    }
    return null;
  };

  this.constructSegmentLabel = function (segment, labelText) {
    var label = new SegmentLabel(segment, labelText);
    var styler = this.transitive.styler;
    label.fontFamily = styler.compute(styler.labels['font-family'], this.transitive.display, {
      segment: segment
    });
    label.fontSize = styler.compute(styler.labels['font-size'], this.transitive.display, {
      segment: segment
    });
    var textBBox = Util.getTextBBox(labelText, {
      'font-size': label.fontSize,
      'font-family': label.fontFamily
    });
    label.textWidth = textBBox.width;
    label.textHeight = textBBox.height;
    label.computeContainerDimensions();

    return label;
  };

  this.placePointLabels = function () {
    var styler = this.transitive.styler;

    var labeledPoints = [];

    this.points.forEach(function (point) {
      var labelText = point.label.getText();
      point.label.fontFamily = styler.compute(styler.labels['font-family'], this.transitive.display, {
        point: point
      });
      point.label.fontSize = styler.compute(styler.labels['font-size'], this.transitive.display, {
        point: point
      });
      var textBBox = Util.getTextBBox(labelText, {
        'font-size': point.label.fontSize,
        'font-family': point.label.fontFamily
      });
      point.label.textWidth = textBBox.width;
      point.label.textHeight = textBBox.height;

      var orientations = styler.compute(styler.labels.orientations, this.transitive.display, {
        point: point
      });

      var placedLabel = false;
      for (var i = 0; i < orientations.length; i++) {
        point.label.setOrientation(orientations[i]);
        if (!point.focused) continue;

        if (!point.label.labelAnchor) continue;

        var lx = point.label.labelAnchor.x;
        var ly = point.label.labelAnchor.y;

        // do not place label if out of range
        if (lx <= 0 || ly <= 0 || lx >= this.width || ly > this.height) continue;

        var labelBBox = point.label.getBBox();

        var overlaps = this.findOverlaps(point.label, labelBBox);

        // do not place label if it overlaps with others
        if (overlaps.length > 0) continue;

        // if we reach this point, the label is good to place

        point.label.setVisibility(true);
        labeledPoints.push(point);

        this.quadtree.add([labelBBox.x + labelBBox.width / 2, labelBBox.y + labelBBox.height / 2, point.label]);

        this.maxBBoxWidth = Math.max(this.maxBBoxWidth, labelBBox.width);
        this.maxBBoxHeight = Math.max(this.maxBBoxHeight, labelBBox.height);

        placedLabel = true;
        break; // do not consider any other orientations after places
      } // end of orientation loop

      // if label not placed at all, hide the element
      if (!placedLabel) {
        point.label.setVisibility(false);
      }
    }, this);
    return labeledPoints;
  };

  this.findOverlaps = function (label, labelBBox) {
    var minX = labelBBox.x - this.maxBBoxWidth / 2;
    var minY = labelBBox.y - this.maxBBoxHeight / 2;
    var maxX = labelBBox.x + labelBBox.width + this.maxBBoxWidth / 2;
    var maxY = labelBBox.y + labelBBox.height + this.maxBBoxHeight / 2;
    // debug('findOverlaps %s,%s %s,%s', minX,minY,maxX,maxY);

    var matchItems = [];
    this.quadtree.visit(function (node, x1, y1, x2, y2) {
      var p = node.point;
      if (p && p[0] >= minX && p[0] < maxX && p[1] >= minY && p[1] < maxY && label.intersects(p[2])) {
        matchItems.push(p[2]);
      }
      return x1 > maxX || y1 > maxY || x2 < minX || y2 < minY;
    });
    return matchItems;
  };

  this.findNearbySegmentLabels = function (label, x, y, buffer) {
    var minX = x - buffer;
    var minY = y - buffer;
    var maxX = x + buffer;
    var maxY = y + buffer;
    // debug('findNearby %s,%s %s,%s', minX,minY,maxX,maxY);

    var matchItems = [];
    this.quadtree.visit(function (node, x1, y1, x2, y2) {
      var p = node.point;
      if (p && p[0] >= minX && p[0] < maxX && p[1] >= minY && p[1] < maxY && p[2].parent && label.parent.patternIds === p[2].parent.patternIds) {
        matchItems.push(p[2]);
      }
      return x1 > maxX || y1 > maxY || x2 < minX || y2 < minY;
    });
    return matchItems;
  };
});

/**
 * Expose `Labeler`
 */

module.exports = Labeler;

},{"../util":38,"./segmentlabel":22,"augment":42,"component-each":84,"d3":88}],19:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var augment = require('augment');

/**
 * Label object
 */

var Label = augment(Object, function () {
  this.constructor = function (parent) {
    this.parent = parent;
    this.sortableType = 'LABEL';
  };

  this.getText = function () {
    if (!this.labelText) this.labelText = this.initText();
    return this.labelText;
  };

  this.initText = function () {
    return this.parent.getName();
  };

  this.render = function (display) {};

  this.refresh = function (display) {};

  this.setVisibility = function (visibility) {
    if (this.svgGroup) this.svgGroup.attr('visibility', visibility ? 'visible' : 'hidden');
  };

  this.getBBox = function () {
    return null;
  };

  this.intersects = function (obj) {
    return null;
  };

  this.intersectsBBox = function (bbox) {
    var thisBBox = this.getBBox(this.orientation);
    var r = thisBBox.x <= bbox.x + bbox.width && bbox.x <= thisBBox.x + thisBBox.width && thisBBox.y <= bbox.y + bbox.height && bbox.y <= thisBBox.y + thisBBox.height;
    return r;
  };

  this.isFocused = function () {
    return this.parent.isFocused();
  };

  this.getZIndex = function () {
    return 1000000;
  };
});

/**
 * Expose `Label`
 */

module.exports = Label;

},{"augment":42}],20:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var each = require('component-each');

/**
 * Expose `LabelEdgeGroup`
 */

module.exports = LabelEdgeGroup;

/**
 *
 */

function LabelEdgeGroup(renderedSegment) {
  this.renderedSegment = renderedSegment;
  this.renderedEdges = [];
}

LabelEdgeGroup.prototype.addEdge = function (rEdge) {
  this.renderedEdges.push(rEdge);
  this.edgeIds = !this.edgeIds ? rEdge.getId() : this.edgeIds + ',' + rEdge.getId();
};

LabelEdgeGroup.prototype.getLabelTextArray = function () {
  var textArray = [];
  each(this.renderedSegment.pathSegment.getPatterns(), function (pattern) {
    var shortName = pattern.route.route_short_name;
    if (textArray.indexOf(shortName) === -1) textArray.push(shortName);
  });
  return textArray;
};

LabelEdgeGroup.prototype.getLabelAnchors = function (display, spacing) {
  var labelAnchors = [];
  var renderLen = this.getRenderLength(display);
  var anchorCount = Math.floor(renderLen / spacing);
  var pctSpacing = spacing / renderLen;

  for (var i = 0; i < anchorCount; i++) {
    var t = i % 2 === 0 ? 0.5 + i / 2 * pctSpacing : 0.5 - (i + 1) / 2 * pctSpacing;
    var coord = this.coordAlongRenderedPath(t, display);
    if (coord) labelAnchors.push(coord);
  }

  return labelAnchors;
};

LabelEdgeGroup.prototype.coordAlongRenderedPath = function (t, display) {
  var renderLen = this.getRenderLength(display);
  var loc = t * renderLen;

  var cur = 0;
  for (var i = 0; i < this.renderedEdges.length; i++) {
    var rEdge = this.renderedEdges[i];
    var edgeRenderLen = rEdge.graphEdge.getRenderLength(display);
    if (loc <= cur + edgeRenderLen) {
      var t2 = (loc - cur) / edgeRenderLen;
      return rEdge.graphEdge.coordAlongEdge(t2, rEdge.renderData, display);
    }
    cur += edgeRenderLen;
  }
};

LabelEdgeGroup.prototype.getRenderLength = function (display) {
  if (!this.renderLength) {
    this.renderLength = 0;
    each(this.renderedEdges, function (rEdge) {
      this.renderLength += rEdge.graphEdge.getRenderLength(display);
    }, this);
  }
  return this.renderLength;
};

},{"component-each":84}],21:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var augment = require('augment');

var Label = require('./label');

/**
 * Label object
 */

var PointLabel = augment(Label, function (base) {
  this.constructor = function (parent) {
    base.constructor.call(this, parent);

    this.labelAngle = 0;
    this.labelPosition = 1;
  };

  this.initText = function () {
    return this.parent.getName();
  };

  this.render = function (display) {
    this.svgGroup = display.svg.append('g'); // this.parent.labelSvg;
    this.svgGroup.attr('class', 'transitive-sortable').datum({
      owner: this,
      sortableType: 'POINT_LABEL'
    });

    var typeStr = this.parent.getType().toLowerCase();

    this.mainLabel = this.svgGroup.append('text').datum({
      owner: this
    }).attr('id', 'transitive-' + typeStr + '-label-' + this.parent.getId()).text(this.getText()).attr('font-size', this.fontSize).attr('font-family', this.fontFamily).attr('class', 'transitive-' + typeStr + '-label');
  };

  this.refresh = function (display) {
    if (!this.labelAnchor) return;

    if (!this.svgGroup) this.render(display);

    this.svgGroup.attr('text-anchor', this.labelPosition > 0 ? 'start' : 'end').attr('transform', function (d, i) {
      return 'translate(' + this.labelAnchor.x + ',' + this.labelAnchor.y + ')';
    }.bind(this));

    this.mainLabel.attr('transform', function (d, i) {
      return 'rotate(' + this.labelAngle + ', 0, 0)';
    }.bind(this));
  };

  this.setOrientation = function (orientation) {
    this.orientation = orientation;

    var markerBBox = this.parent.getMarkerBBox();
    if (!markerBBox) return;

    var x, y;
    var offset = 5;

    if (orientation === 'E') {
      x = markerBBox.x + markerBBox.width + offset;
      y = markerBBox.y + markerBBox.height / 2;
      this.labelPosition = 1;
      this.labelAngle = 0;
    } else if (orientation === 'W') {
      x = markerBBox.x - offset;
      y = markerBBox.y + markerBBox.height / 2;
      this.labelPosition = -1;
      this.labelAngle = 0;
    } else if (orientation === 'NE') {
      x = markerBBox.x + markerBBox.width + offset;
      y = markerBBox.y - offset;
      this.labelPosition = 1;
      this.labelAngle = -45;
    } else if (orientation === 'SE') {
      x = markerBBox.x + markerBBox.width + offset;
      y = markerBBox.y + markerBBox.height + offset;
      this.labelPosition = 1;
      this.labelAngle = 45;
    } else if (orientation === 'NW') {
      x = markerBBox.x - offset;
      y = markerBBox.y - offset;
      this.labelPosition = -1;
      this.labelAngle = 45;
    } else if (orientation === 'SW') {
      x = markerBBox.x - offset;
      y = markerBBox.y + markerBBox.height + offset;
      this.labelPosition = -1;
      this.labelAngle = -45;
    } else if (orientation === 'N') {
      x = markerBBox.x + markerBBox.width / 2;
      y = markerBBox.y - offset;
      this.labelPosition = 1;
      this.labelAngle = -90;
    } else if (orientation === 'S') {
      x = markerBBox.x + markerBBox.width / 2;
      y = markerBBox.y + markerBBox.height + offset;
      this.labelPosition = -1;
      this.labelAngle = -90;
    }

    this.labelAnchor = {
      x: x,
      y: y
    };
  };

  this.getBBox = function () {
    if (this.orientation === 'E') {
      return {
        x: this.labelAnchor.x,
        y: this.labelAnchor.y - this.textHeight,
        width: this.textWidth,
        height: this.textHeight
      };
    }

    if (this.orientation === 'W') {
      return {
        x: this.labelAnchor.x - this.textWidth,
        y: this.labelAnchor.y - this.textHeight,
        width: this.textWidth,
        height: this.textHeight
      };
    }

    if (this.orientation === 'N') {
      return {
        x: this.labelAnchor.x - this.textHeight,
        y: this.labelAnchor.y - this.textWidth,
        width: this.textHeight,
        height: this.textWidth
      };
    }

    if (this.orientation === 'S') {
      return {
        x: this.labelAnchor.x - this.textHeight,
        y: this.labelAnchor.y,
        width: this.textHeight,
        height: this.textWidth
      };
    }

    var bboxSide = this.textWidth * Math.sqrt(2) / 2;

    if (this.orientation === 'NE') {
      return {
        x: this.labelAnchor.x,
        y: this.labelAnchor.y - bboxSide,
        width: bboxSide,
        height: bboxSide
      };
    }

    if (this.orientation === 'SE') {
      return {
        x: this.labelAnchor.x,
        y: this.labelAnchor.y,
        width: bboxSide,
        height: bboxSide
      };
    }

    if (this.orientation === 'NW') {
      return {
        x: this.labelAnchor.x - bboxSide,
        y: this.labelAnchor.y - bboxSide,
        width: bboxSide,
        height: bboxSide
      };
    }

    if (this.orientation === 'SW') {
      return {
        x: this.labelAnchor.x - bboxSide,
        y: this.labelAnchor.y,
        width: bboxSide,
        height: bboxSide
      };
    }
  };

  this.intersects = function (obj) {
    if (obj instanceof Label) {
      // todo: handle label-label intersection for diagonally placed labels separately
      return this.intersectsBBox(obj.getBBox());
    } else if (obj.x && obj.y && obj.width && obj.height) {
      return this.intersectsBBox(obj);
    }

    return false;
  };

  this.runFocusTransition = function (display, callback) {
    if (this.mainLabel) {
      if (this.parent.isFocused()) this.setVisibility(true);
      this.mainLabel.transition().style('opacity', this.parent.isFocused() ? 1 : 0).call(callback);
    }
  };
});

/**
 * Expose `PointLabel`
 */

module.exports = PointLabel;

},{"./label":19,"augment":42}],22:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var augment = require('augment');

var Label = require('./label');

/**
 * SegmentLabel object
 */

var SegmentLabel = augment(Label, function (base) {
  this.constructor = function (parent, text) {
    base.constructor.call(this, parent);
    this.labelText = text;
  };

  /* this.initText = function() {
    return this.parent.patterns[0].route.route_short_name;
  }; */

  this.render = function (display) {
    this.svgGroup = this.parent.labelSvg.append('g').attr('class', 'transitive-sortable').datum({
      owner: this,
      sortableType: 'LABEL'
    });

    var padding = this.getPadding();

    this.computeContainerDimensions();

    this.containerSvg = this.svgGroup.append('rect').datum(this) // { segment: this.parent })
    .attr({
      width: this.containerWidth,
      height: this.containerHeight
    }).attr('id', 'transitive-segment-label-container-' + this.parent.getId()).text(this.getText()).attr('class', 'transitive-segment-label-container');

    this.textSvg = this.svgGroup.append('text').datum(this) // { segment: this.parent })
    .attr('id', 'transitive-segment-label-' + this.parent.getId()).text(this.getText()).attr('class', 'transitive-segment-label').attr('font-size', this.fontSize).attr('font-family', this.fontFamily).attr('transform', function (d, i) {
      return 'translate(' + padding + ', ' + (this.textHeight - padding * 2) + ')';
    }.bind(this));
  };

  this.refresh = function (display) {
    if (!this.labelAnchor) return;

    if (!this.svgGroup) this.render(display);

    this.svgGroup.attr('transform', function (d, i) {
      var tx = this.labelAnchor.x - this.containerWidth / 2;
      var ty = this.labelAnchor.y - this.containerHeight / 2;
      return 'translate(' + tx + ',' + ty + ')';
    }.bind(this));
  };

  this.getPadding = function () {
    return this.textHeight * 0.1;
  };

  this.computeContainerDimensions = function () {
    this.containerWidth = this.textWidth + this.getPadding() * 2;
    this.containerHeight = this.textHeight;
  };

  this.getBBox = function () {
    return {
      x: this.labelAnchor.x - this.containerWidth / 2,
      y: this.labelAnchor.y - this.containerHeight / 2,
      width: this.containerWidth,
      height: this.containerHeight
    };
  };

  this.intersects = function (obj) {
    if (obj instanceof Label) {
      // todo: handle label-label intersection for diagonally placed labels separately
      return this.intersectsBBox(obj.getBBox());
    } else if (obj.x && obj.y && obj.width && obj.height) {
      return this.intersectsBBox(obj);
    }

    return false;
  };

  this.clear = function () {
    this.labelAnchor = null;
    if (this.svgGroup) {
      this.svgGroup.remove();
      this.svgGroup = null;
    }
  };
});

/**
 * Expose `SegmentLabel`
 */

module.exports = SegmentLabel;

},{"./label":19,"augment":42}],23:[function(require,module,exports){
'use strict';

var augment = require('augment');
var each = require('component-each');

var PointLabel = require('../labeler/pointlabel');

var Point = augment(Object, function () {
  this.constructor = function (data) {
    for (var key in data) {
      this[key] = data[key];
    }

    this.paths = [];
    this.renderData = [];

    this.label = new PointLabel(this);
    this.renderLabel = true;

    this.focused = true;
    this.sortableType = 'POINT';

    this.placeOffsets = {
      x: 0,
      y: 0
    };

    this.zIndex = 10000;
  };

  /**
   * Get unique ID for point -- must be defined by subclass
   */

  this.getId = function () {};

  this.getElementId = function () {
    return this.getType().toLowerCase() + '-' + this.getId();
  };

  /**
   * Get Point type -- must be defined by subclass
   */

  this.getType = function () {};

  /**
   * Get Point name
   */

  this.getName = function () {
    return this.getType() + ' point (ID=' + this.getId() + ')';
  };

  /**
   * Get latitude
   */

  this.getLat = function () {
    return 0;
  };

  /**
   * Get longitude
   */

  this.getLon = function () {
    return 0;
  };

  this.containsSegmentEndPoint = function () {
    return false;
  };

  this.containsBoardPoint = function () {
    return false;
  };

  this.containsAlightPoint = function () {
    return false;
  };

  this.containsTransferPoint = function () {
    return false;
  };

  this.getPatterns = function () {
    return [];
  };

  /**
   * Draw the point
   *
   * @param {Display} display
   */

  this.render = function (display) {
    this.label.svgGroup = null;
  };

  /**
   * Refresh a previously drawn point
   *
   * @param {Display} display
   */

  this.refresh = function (display) {};

  this.addRenderData = function () {};

  this.clearRenderData = function () {};

  this.containsFromPoint = function () {
    return false;
  };

  this.containsToPoint = function () {
    return false;
  };

  this.initSvg = function (display) {
    // set up the main svg group for this stop
    this.svgGroup = display.svg.append('g').attr('id', 'transitive-' + this.getType().toLowerCase() + '-' + this.getId())
    // .attr('class', 'transitive-sortable')
    .datum(this);

    this.markerSvg = this.svgGroup.append('g');
    this.labelSvg = this.svgGroup.append('g');
  };

  //* * Shared geom utility functions **//

  this.constructMergedMarker = function (display) {
    var dataArray = this.getRenderDataArray();
    var xValues = [];
    var yValues = [];
    dataArray.forEach(function (data) {
      var x = data.x; // display.xScale(data.x) + data.offsetX;
      var y = data.y; // display.yScale(data.y) - data.offsetY;
      xValues.push(x);
      yValues.push(y);
    });
    var minX = Math.min.apply(Math, xValues);
    var minY = Math.min.apply(Math, yValues);
    var maxX = Math.max.apply(Math, xValues);
    var maxY = Math.max.apply(Math, yValues);

    // retrieve marker type and radius from the styler
    var markerType = display.styler.compute(display.styler.stops_merged['marker-type'], display, {
      owner: this
    });
    var stylerRadius = display.styler.compute(display.styler.stops_merged.r, display, {
      owner: this
    });

    var width;
    var height;
    var r;

    // if this is a circle marker w/ a styler-defined fixed radius, use that
    if (markerType === 'circle' && stylerRadius) {
      width = height = stylerRadius * 2;
      r = stylerRadius;
      // otherwise, this is a dynamically-sized marker
    } else {
      var dx = maxX - minX;
      var dy = maxY - minY;

      var markerPadding = display.styler.compute(display.styler.stops_merged['marker-padding'], display, {
        owner: this
      }) || 0;

      var patternRadius = display.styler.compute(display.styler[this.patternStylerKey].r, display, {
        owner: this
      });
      r = parseFloat(patternRadius) + markerPadding;

      if (markerType === 'circle') {
        width = height = Math.max(dx, dy) + 2 * r;
        r = width / 2;
      } else {
        width = dx + 2 * r;
        height = dy + 2 * r;
        if (markerType === 'rectangle') r = 0;
      }
    }

    return {
      x: (minX + maxX) / 2 - width / 2,
      y: (minY + maxY) / 2 - height / 2,
      width: width,
      height: height,
      rx: r,
      ry: r
    };
  };

  this.initMarkerData = function (display) {
    if (this.getType() !== 'STOP' && this.getType() !== 'MULTI') return;

    this.mergedMarkerData = this.constructMergedMarker(display);

    this.placeOffsets = {
      x: 0,
      y: 0
    };
    if (this.adjacentPlace) {
      var placeR = display.styler.compute(display.styler.places.r, display, {
        owner: this.adjacentPlace
      });

      var placeX = display.xScale(this.adjacentPlace.worldX);
      var placeY = display.yScale(this.adjacentPlace.worldY);

      var thisR = this.mergedMarkerData.width / 2;
      var thisX = this.mergedMarkerData.x + thisR;
      var thisY = this.mergedMarkerData.y + thisR;

      var dx = thisX - placeX;
      var dy = thisY - placeY;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (placeR + thisR > dist) {
        var f = (placeR + thisR) / dist;
        this.placeOffsets = {
          x: dx * f - dx,
          y: dy * f - dy
        };

        this.mergedMarkerData.x += this.placeOffsets.x;
        this.mergedMarkerData.y += this.placeOffsets.y;

        each(this.graphVertex.incidentEdges(), function (edge) {
          each(edge.renderSegments, function (segment) {
            segment.refreshRenderData(display);
          });
        });
      }
    }
  };

  this.refreshLabel = function (display) {
    if (!this.renderLabel) return;
    this.label.refresh(display);
  };

  this.getMarkerBBox = function () {
    return this.markerSvg.node().getBBox();
  };

  this.setFocused = function (focused) {
    this.focused = focused;
  };

  this.isFocused = function () {
    return this.focused === true;
  };

  this.runFocusTransition = function (display, callback) {};

  this.setAllPatternsFocused = function () {};

  this.getZIndex = function () {
    return this.zIndex;
  };

  this.getAverageCoord = function () {
    var dataArray = this.getRenderDataArray();

    var xTotal = 0;
    var yTotal = 0;
    each(dataArray, function (data) {
      xTotal += data.x;
      yTotal += data.y;
    });

    return {
      x: xTotal / dataArray.length,
      y: yTotal / dataArray.length
    };
  };

  this.hasRenderData = function () {
    var dataArray = this.getRenderDataArray();
    return dataArray && dataArray.length > 0;
  };

  this.makeDraggable = function (transitive) {};

  this.toString = function () {
    return this.getType() + ' point: ' + this.getId() + ' (' + this.getName() + ')';
  };
});

/**
 * Expose `Point`
 */

module.exports = Point;

},{"../labeler/pointlabel":21,"augment":42,"component-each":84}],24:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var augment = require('augment');
var each = require('component-each');

var Point = require('./index');

/**
 *  MultiPoint: a Point subclass representing a collection of multiple points
 *  that have been merged into one for display purposes.
 */

var MultiPoint = augment(Point, function (base) {
  this.constructor = function (pointArray) {
    base.constructor.call(this);
    this.points = [];
    if (pointArray) {
      pointArray.forEach(function (point) {
        this.addPoint(point);
      }, this);
    }
    this.renderData = [];
    this.id = 'multi';
    this.toPoint = this.fromPoint = null;

    this.patternStylerKey = 'multipoints_pattern';
  };

  /**
   * Get id
   */

  this.getId = function () {
    return this.id;
  };

  /**
   * Get type
   */

  this.getType = function () {
    return 'MULTI';
  };

  this.getName = function () {
    if (this.fromPoint) return this.fromPoint.getName();
    if (this.toPoint) return this.toPoint.getName();
    var shortest = null;
    this.points.forEach(function (point) {
      if (point.getType() === 'TURN') return;
      if (!shortest || point.getName().length < shortest.length) shortest = point.getName();
    });

    return shortest;
  };

  this.containsSegmentEndPoint = function () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsSegmentEndPoint()) return true;
    }
    return false;
  };

  this.containsBoardPoint = function () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsBoardPoint()) return true;
    }
    return false;
  };

  this.containsAlightPoint = function () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsAlightPoint()) return true;
    }
    return false;
  };

  this.containsTransferPoint = function () {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].containsTransferPoint()) return true;
    }
    return false;
  };

  this.containsFromPoint = function () {
    return this.fromPoint !== null;
  };

  this.containsToPoint = function () {
    return this.toPoint !== null;
  };

  this.getPatterns = function () {
    var patterns = [];

    this.points.forEach(function (point) {
      if (!point.patterns) return;
      point.patterns.forEach(function (pattern) {
        if (patterns.indexOf(pattern) === -1) patterns.push(pattern);
      });
    });

    return patterns;
  };

  this.addPoint = function (point) {
    if (this.points.indexOf(point) !== -1) return;
    this.points.push(point);
    this.id += '-' + point.getId();
    if (point.containsFromPoint()) {
      // getType() === 'PLACE' && point.getId() === 'from') {
      this.fromPoint = point;
    }
    if (point.containsToPoint()) {
      // getType() === 'PLACE' && point.getId() === 'to') {
      this.toPoint = point;
    }
    this.calcWorldCoords();
  };

  this.calcWorldCoords = function () {
    var tx = 0;
    var ty = 0;
    each(this.points, function (point) {
      tx += point.worldX;
      ty += point.worldY;
    });

    this.worldX = tx / this.points.length;
    this.worldY = ty / this.points.length;
  };

  /**
   * Add render data
   *
   * @param {Object} stopInfo
   */

  this.addRenderData = function (pointInfo) {
    if (pointInfo.offsetX !== 0 || pointInfo.offsetY !== 0) this.hasOffsetPoints = true;
    this.renderData.push(pointInfo);
  };

  this.clearRenderData = function () {
    this.hasOffsetPoints = false;
    this.renderData = [];
  };

  /**
   * Draw a multipoint
   *
   * @param {Display} display
   */

  this.render = function (display) {
    base.render.call(this, display);

    if (!this.renderData) return;

    // set up the main svg group for this stop
    this.initSvg(display);
    this.svgGroup.attr('class', 'transitive-sortable').datum({
      owner: this,
      sortableType: 'POINT_MULTI'
    });

    if (this.containsSegmentEndPoint()) this.initMergedMarker(display);

    // set up the pattern markers
    /* this.marker = this.markerSvg.selectAll('circle')
      .data(this.renderData)
      .enter()
      .append('circle')
      .attr('class', 'transitive-multipoint-marker-pattern'); */
  };

  this.initMergedMarker = function (display) {
    // set up the merged marker
    if (this.fromPoint || this.toPoint) {
      this.mergedMarker = this.markerSvg.append('g').append('circle').datum({
        owner: this
      }).attr('class', 'transitive-multipoint-marker-merged');
    } else if (this.hasOffsetPoints || this.renderData.length > 1) {
      this.mergedMarker = this.markerSvg.append('g').append('rect').datum({
        owner: this
      }).attr('class', 'transitive-multipoint-marker-merged');
    }
  };

  /**
   * Refresh the point
   *
   * @param {Display} display
   */

  this.refresh = function (display) {
    if (!this.renderData) return;

    // refresh the merged marker
    if (this.mergedMarker) {
      if (!this.mergedMarkerData) this.initMarkerData(display);

      this.mergedMarker.datum({
        owner: this
      });
      this.mergedMarker.attr(this.mergedMarkerData);
    }

    /* var cx, cy;
    // refresh the pattern-level markers
    this.marker.data(this.renderData);
    this.marker.attr('transform', function (d, i) {
      cx = d.x;
      cy = d.y;
      var x = display.xScale(d.x) + d.offsetX;
      var y = display.yScale(d.y) - d.offsetY;
      return 'translate(' + x +', ' + y +')';
    }); */
  };

  this.getRenderDataArray = function () {
    return this.renderData;
  };

  this.setFocused = function (focused) {
    this.focused = focused;
    each(this.points, function (point) {
      point.setFocused(focused);
    });
  };

  this.runFocusTransition = function (display, callback) {
    if (this.mergedMarker) {
      var newStrokeColor = display.styler.compute(display.styler.multipoints_merged.stroke, display, {
        owner: this
      });
      this.mergedMarker.transition().style('stroke', newStrokeColor).call(callback);
    }
    if (this.label) this.label.runFocusTransition(display, callback);
  };
});

/**
 * Expose `MultiPoint`
 */

module.exports = MultiPoint;

},{"./index":23,"augment":42,"component-each":84}],25:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var augment = require('augment');
var d3 = require('d3');

var Point = require('./index');
var Util = require('../util');

var SphericalMercator = require('../util/spherical-mercator');
var sm = new SphericalMercator();

/**
 *  Place: a Point subclass representing a 'place' that can be rendered on the
 *  map. A place is a point *other* than a transit stop/station, e.g. a home/work
 *  location, a point of interest, etc.
 */

var Place = augment(Point, function (base) {
  /**
   *  the constructor
   */

  this.constructor = function (data) {
    base.constructor.call(this, data);

    if (data && data.place_lat && data.place_lon) {
      var xy = Util.latLonToSphericalMercator(data.place_lat, data.place_lon);
      this.worldX = xy[0];
      this.worldY = xy[1];
    }

    this.zIndex = 100000;
  };

  /**
   * Get Type
   */

  this.getType = function () {
    return 'PLACE';
  };

  /**
   * Get ID
   */

  this.getId = function () {
    return this.place_id;
  };

  /**
   * Get Name
   */

  this.getName = function () {
    return this.place_name;
  };

  /**
   * Get lat
   */

  this.getLat = function () {
    return this.place_lat;
  };

  /**
   * Get lon
   */

  this.getLon = function () {
    return this.place_lon;
  };

  this.containsSegmentEndPoint = function () {
    return true;
  };

  this.containsFromPoint = function () {
    return this.getId() === 'from';
  };

  this.containsToPoint = function () {
    return this.getId() === 'to';
  };

  this.addRenderData = function (pointInfo) {
    this.renderData.push(pointInfo);
  };

  this.getRenderDataArray = function () {
    return this.renderData;
  };

  this.clearRenderData = function () {
    this.renderData = [];
  };

  /**
   * Draw a place
   *
   * @param {Display} display
   */

  this.render = function (display) {
    base.render.call(this, display);
    if (!this.renderData) return;

    this.initSvg(display);
    this.svgGroup.attr('class', 'transitive-sortable').datum({
      owner: this,
      sortableType: 'POINT_PLACE'
    });

    // set up the markers
    this.marker = this.markerSvg.append('circle').datum({
      owner: this
    }).attr('class', 'transitive-place-circle');

    var iconUrl = display.styler.compute(display.styler.places_icon['xlink:href'], display, {
      owner: this
    });
    if (iconUrl) {
      this.icon = this.markerSvg.append('image').datum({
        owner: this
      }).attr('class', 'transitive-place-icon').attr('xlink:href', iconUrl);
    }
  };

  /**
   * Refresh the place
   *
   * @param {Display} display
   */

  this.refresh = function (display) {
    if (!this.renderData) return;

    // refresh the marker/icon
    var x = display.xScale(this.worldX);
    var y = display.yScale(this.worldY);
    var translate = 'translate(' + x + ', ' + y + ')';
    this.marker.attr('transform', translate);
    if (this.icon) this.icon.attr('transform', translate);
  };

  this.makeDraggable = function (transitive) {
    var place = this;
    var display = transitive.display;
    var drag = d3.behavior.drag().on('dragstart', function () {
      d3.event.sourceEvent.stopPropagation(); // silence other listeners
    }).on('drag', function () {
      if (place.graphVertex) {
        var boundingRect = display.el.getBoundingClientRect();
        var x = display.xScale.invert(d3.event.sourceEvent.pageX - boundingRect.left);
        var y = display.yScale.invert(d3.event.sourceEvent.pageY - boundingRect.top);

        place.worldX = x;
        place.worldY = y;
        var ll = sm.inverse([x, y]);
        place.place_lon = ll[0];
        place.place_lat = ll[1];

        place.refresh(display);
      }
    }).on('dragend', function () {
      transitive.emit('place.' + place.getId() + '.dragend', place);
    });
    this.markerSvg.call(drag);
  };
});

/**
 * Expose `Place`
 */

module.exports = Place;

},{"../util":38,"../util/spherical-mercator":41,"./index":23,"augment":42,"d3":88}],26:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var each = require('component-each');

/**
 * Expose `PointCluster`
 */

module.exports = PointCluster;

/**
 *
 */

function PointCluster() {
  this.points = [];
}

PointCluster.prototype.addPoint = function (point) {
  if (this.points.indexOf(point) === -1) this.points.push(point);
};

PointCluster.prototype.mergeVertices = function (graph) {
  var vertices = [];
  each(this.points, function (point) {
    vertices.push(point.graphVertex);
  });
  graph.mergeVertices(vertices);
};

},{"component-each":84}],27:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var d3 = require('d3');
var each = require('component-each');

var PointCluster = require('./pointcluster');
var MultiPoint = require('./multipoint');
var Util = require('../util');

/**
 * Expose `PointClusterMap`
 */

module.exports = PointClusterMap;

/**
 *
 */

function PointClusterMap(transitive) {
  this.transitive = transitive;

  this.clusters = [];
  this.clusterLookup = {}; // maps Point object to its containing cluster

  var pointArr = [];
  each(transitive.stops, function (key) {
    var point = transitive.stops[key];
    if (point.used) pointArr.push(point);
  }, this);
  each(transitive.turnPoints, function (key) {
    pointArr.push(transitive.turnPoints[key]);
  }, this);

  var links = d3.geom.voronoi().x(function (d) {
    return d.worldX;
  }).y(function (d) {
    return d.worldY;
  }).links(pointArr);

  each(links, function (link) {
    var dist = Util.distance(link.source.worldX, link.source.worldY, link.target.worldX, link.target.worldY);
    if (dist < 100 && (link.source.getType() !== 'TURN' || link.target.getType() !== 'TURN')) {
      var sourceInCluster = link.source in this.clusterLookup;
      var targetInCluster = link.target in this.clusterLookup;
      if (sourceInCluster && !targetInCluster) {
        this.addPointToCluster(link.target, this.clusterLookup[link.source]);
      } else if (!sourceInCluster && targetInCluster) {
        this.addPointToCluster(link.source, this.clusterLookup[link.target]);
      } else if (!sourceInCluster && !targetInCluster) {
        var cluster = new PointCluster();
        this.clusters.push(cluster);
        this.addPointToCluster(link.source, cluster);
        this.addPointToCluster(link.target, cluster);
      }
    }
  }, this);

  this.vertexPoints = [];
  each(this.clusters, function (cluster) {
    var multipoint = new MultiPoint(cluster.points);
    this.vertexPoints.push(multipoint);
    each(cluster.points, function (point) {
      point.multipoint = multipoint;
    }, this);
  }, this);
}

PointClusterMap.prototype.addPointToCluster = function (point, cluster) {
  cluster.addPoint(point);
  this.clusterLookup[point] = cluster;
};

PointClusterMap.prototype.clearMultiPoints = function () {
  each(this.clusters, function (cluster) {
    each(cluster.points, function (point) {
      point.multipoint = null;
    }, this);
  }, this);
};

PointClusterMap.prototype.getVertexPoints = function (baseVertexPoints) {
  if (!baseVertexPoints) return this.vertexPoints;
  var vertexPoints = this.vertexPoints.concat();
  each(baseVertexPoints, function (point) {
    if (!point.multipoint) vertexPoints.push(point);
  });
  return vertexPoints;
};

},{"../util":38,"./multipoint":24,"./pointcluster":26,"component-each":84,"d3":88}],28:[function(require,module,exports){
'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Dependencies
 */

var augment = require('augment');
var each = require('component-each');

var Point = require('./index');
var Util = require('../util');

/**
 *  Place: a Point subclass representing a 'place' that can be rendered on the
 *  map. A place is a point *other* than a transit stop/station, e.g. a home/work
 *  location, a point of interest, etc.
 */

var Stop = augment(Point, function (base) {
  this.constructor = function (data) {
    base.constructor.call(this, data);

    if (data && data.stop_lat && data.stop_lon) {
      var xy = Util.latLonToSphericalMercator(data.stop_lat, data.stop_lon);
      this.worldX = xy[0];
      this.worldY = xy[1];
    }

    this.patterns = [];

    this.patternRenderData = {};
    this.patternFocused = {};
    this.patternCount = 0;

    this.patternStylerKey = 'stops_pattern';

    this.isSegmentEndPoint = false;
  };

  /**
   * Get id
   */

  this.getId = function () {
    return this.stop_id;
  };

  /**
   * Get type
   */

  this.getType = function () {
    return 'STOP';
  };

  /**
   * Get name
   */

  this.getName = function () {
    if (!this.stop_name) return 'Unnamed Stop (ID=' + this.getId() + ')';
    return this.stop_name;
  };

  /**
   * Get lat
   */

  this.getLat = function () {
    return this.stop_lat;
  };

  /**
   * Get lon
   */

  this.getLon = function () {
    return this.stop_lon;
  };

  this.containsSegmentEndPoint = function () {
    return this.isSegmentEndPoint;
  };

  this.containsBoardPoint = function () {
    return this.isBoardPoint;
  };

  this.containsAlightPoint = function () {
    return this.isAlightPoint;
  };

  this.containsTransferPoint = function () {
    return this.isTransferPoint;
  };

  this.getPatterns = function () {
    return this.patterns;
  };

  this.addPattern = function (pattern) {
    if (this.patterns.indexOf(pattern) === -1) this.patterns.push(pattern);
  };

  /**
   * Add render data
   *
   * @param {Object} stopInfo
   */

  this.addRenderData = function (stopInfo) {
    if (stopInfo.rEdge.getType() === 'TRANSIT') {
      var s = {
        sortableType: 'POINT_STOP_PATTERN',
        owner: this,
        getZIndex: function getZIndex() {
          if (this.owner.graphVertex) {
            return this.owner.getZIndex();
          }
          return this.rEdge.getZIndex() + 1;
        }
      };

      for (var key in stopInfo) {
        s[key] = stopInfo[key];
      }var patternId = stopInfo.rEdge.patternIds;
      this.patternRenderData[patternId] = s; // .push(s);

      each(stopInfo.rEdge.patterns, function (pattern) {
        this.addPattern(pattern);
      }, this);
    }
    this.patternCount = (0, _keys2.default)(this.patternRenderData).length;
  };

  this.isPatternFocused = function (patternId) {
    if (!(patternId in this.patternFocused)) return true;
    return this.patternFocused[patternId];
  };

  this.setPatternFocused = function (patternId, focused) {
    this.patternFocused[patternId] = focused;
  };

  this.setAllPatternsFocused = function (focused) {
    for (var key in this.patternRenderData) {
      this.patternFocused[key] = focused;
    }
  };

  /**
   * Draw a stop
   *
   * @param {Display} display
   */

  this.render = function (display) {
    base.render.call(this, display);
    if ((0, _keys2.default)(this.patternRenderData).length === 0) return;

    var renderDataArray = this.getRenderDataArray();

    this.initSvg(display);

    // set up the merged marker
    this.mergedMarker = this.markerSvg.append('g').append('rect').attr('class', 'transitive-sortable transitive-stop-marker-merged').datum(this.getMergedRenderData());

    // set up the pattern-specific markers
    this.patternMarkers = this.markerSvg.append('g').selectAll('circle').data(renderDataArray).enter().append('circle').attr('class', 'transitive-sortable transitive-stop-marker-pattern');
  };

  /**
   * Refresh the stop
   *
   * @param {Display} display
   */

  this.refresh = function (display) {
    if (this.patternCount === 0) return;

    if (!this.mergedMarkerData) this.initMarkerData(display);

    // refresh the pattern-level markers
    this.patternMarkers.data(this.getRenderDataArray());

    this.patternMarkers.attr('transform', function (d, i) {
      if (!isNaN(d.x) && !isNaN(d.y)) {
        var x = d.x + this.placeOffsets.x;
        var y = d.y + this.placeOffsets.y;
        return 'translate(' + x + ', ' + y + ')';
      }
    }.bind(this));

    // refresh the merged marker
    if (this.mergedMarker) {
      this.mergedMarker.datum(this.getMergedRenderData());
      if (!isNaN(this.mergedMarkerData.x) && !isNaN(this.mergedMarkerData.y)) this.mergedMarker.attr(this.mergedMarkerData);
    }
  };

  this.getMergedRenderData = function () {
    return {
      owner: this,
      sortableType: 'POINT_STOP_MERGED'
    };
  };

  this.getRenderDataArray = function () {
    var dataArray = [];
    for (var patternId in this.patternRenderData) {
      dataArray.push(this.patternRenderData[patternId]);
    }
    return dataArray;
  };

  this.getMarkerBBox = function () {
    if (this.mergedMarker) return this.mergedMarkerData;
  };

  this.isFocused = function () {
    if (this.mergedMarker || !this.patternRenderData) {
      return this.focused === true;
    }

    var focused = true;
    for (var patternId in this.patternRenderData) {
      focused = this && this.isPatternFocused(patternId);
    }
    return focused;
  };

  this.runFocusTransition = function (display, callback) {
    if (this.mergedMarker) {
      var newStrokeColor = display.styler.compute(display.styler.stops_merged.stroke, display, {
        owner: this
      });
      this.mergedMarker.transition().style('stroke', newStrokeColor).call(callback);
    }
    if (this.label) this.label.runFocusTransition(display, callback);
  };

  this.clearRenderData = function () {
    this.patternRenderData = {};
    this.mergedMarkerData = null;
    this.placeOffsets = {
      x: 0,
      y: 0
    };
  };
});

/**
 * Expose `Stop`
 */

module.exports = Stop;

},{"../util":38,"./index":23,"augment":42,"babel-runtime/core-js/object/keys":44,"component-each":84}],29:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var augment = require('augment');

var Point = require('./index');

var SphericalMercator = require('../util/spherical-mercator');
var sm = new SphericalMercator();

/**
 *
 */

var TurnPoint = augment(Point, function (base) {
  this.constructor = function (data, id) {
    base.constructor.call(this, data);
    this.name = 'Turn @ ' + data.lat + ', ' + data.lon;
    if (!this.worldX || !this.worldY) {
      var smCoords = sm.forward([data.lon, data.lat]);
      this.worldX = smCoords[0];
      this.worldY = smCoords[1];
      this.isSegmentEndPoint = false;
    }
    this.id = id;
  };

  this.getId = function () {
    return this.id;
  };

  this.getType = function () {
    return 'TURN';
  };

  this.getName = function () {
    return this.name;
  };

  this.containsSegmentEndPoint = function () {
    return this.isSegmentEndPoint;
  };
});

/**
 * Expose `TurnPoint`
 */

module.exports = TurnPoint;

},{"../util/spherical-mercator":41,"./index":23,"augment":42}],30:[function(require,module,exports){
'use strict';

var augment = require('augment');
var each = require('component-each');

var Renderer = require('./index');

/**
 * A Renderer subclass for the default network rendering engine.
 *
 * @param {Object} the main Transitive object
 */

var DefaultRenderer = augment(Renderer, function (base) {
  this.constructor = function (transitive) {
    base.constructor.call(this, transitive);
  };

  this.render = function () {
    base.render.call(this);

    var self = this;
    var display = this.transitive.display;
    var network = this.transitive.network;
    display.styler = this.transitive.styler;

    var legendSegments = {};

    each(network.renderedEdges, function (rEdge) {
      rEdge.refreshRenderData(display);
    });

    each(network.paths, function (path) {
      each(path.segments, function (pathSegment) {
        each(pathSegment.renderedSegments, function (renderedSegment) {
          renderedSegment.render(display);
          var legendType = renderedSegment.getLegendType();
          if (!(legendType in legendSegments)) {
            legendSegments[legendType] = renderedSegment;
          }
        });
      });
    });

    // draw the vertex-based points

    each(network.graph.vertices, function (vertex) {
      vertex.point.render(display);
      if (self.isDraggable(vertex.point)) {
        vertex.point.makeDraggable(self.transitive);
      }
    });

    // draw the edge-based points
    each(network.graph.edges, function (edge) {
      edge.pointArray.forEach(function (point) {
        point.render(display);
      });
    });

    if (display.legend) display.legend.render(legendSegments);

    this.transitive.refresh();
  };

  /**
   * Refresh
   */

  this.refresh = function (panning) {
    base.refresh.call(this, panning);

    var display = this.transitive.display;
    var network = this.transitive.network;
    var styler = this.transitive.styler;

    network.graph.vertices.forEach(function (vertex) {
      vertex.point.clearRenderData();
    });
    network.graph.edges.forEach(function (edge) {
      edge.clearRenderData();
    });

    // refresh the segment and point marker data
    this.refreshSegmentRenderData();
    network.graph.vertices.forEach(function (vertex) {
      vertex.point.initMarkerData(display);
    });

    this.renderedSegments = [];
    each(network.paths, function (path) {
      each(path.segments, function (pathSegment) {
        each(pathSegment.renderedSegments, function (rSegment) {
          rSegment.refresh(display);
          this.renderedSegments.push(rSegment);
        }, this);
      }, this);
    }, this);

    network.graph.vertices.forEach(function (vertex) {
      var point = vertex.point;
      if (!point.svgGroup) return; // check if this point is not currently rendered
      styler.stylePoint(display, point);
      point.refresh(display);
    });

    // re-draw the edge-based points
    network.graph.edges.forEach(function (edge) {
      edge.pointArray.forEach(function (point) {
        if (!point.svgGroup) return; // check if this point is not currently rendered
        styler.styleStop(display, point);
        point.refresh(display);
      });
    });

    // refresh the label layout
    var labeledElements = this.transitive.labeler.doLayout();
    labeledElements.points.forEach(function (point) {
      point.refreshLabel(display);
      styler.stylePointLabel(display, point);
    });
    each(this.transitive.labeler.segmentLabels, function (label) {
      label.refresh(display);
      styler.styleSegmentLabel(display, label);
    });

    this.sortElements();
  };

  this.refreshSegmentRenderData = function () {
    each(this.transitive.network.renderedEdges, function (rEdge) {
      rEdge.refreshRenderData(this.transitive.display);
    }, this);

    // try intersecting adjacent rendered edges to create a smooth transition

    var isectKeys = []; // keep track of edge-edge intersections we've already computed
    each(this.transitive.network.paths, function (path) {
      each(path.segments, function (pathSegment) {
        each(pathSegment.renderedSegments, function (rSegment) {
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

  this.sortElements = function () {
    this.renderedSegments.sort(function (a, b) {
      return a.compareTo(b);
    });

    var focusBaseZIndex = 100000;

    this.renderedSegments.forEach(function (rSegment, index) {
      rSegment.zIndex = index * 10 + (rSegment.isFocused() ? focusBaseZIndex : 0);
    });

    this.transitive.network.graph.vertices.forEach(function (vertex) {
      var point = vertex.point;
      point.zIndex = point.zIndex + (point.isFocused() ? focusBaseZIndex : 0);
    });

    this.transitive.display.svg.selectAll('.transitive-sortable').sort(function (a, b) {
      var aIndex = typeof a.getZIndex === 'function' ? a.getZIndex() : a.owner.getZIndex();
      var bIndex = typeof b.getZIndex === 'function' ? b.getZIndex() : b.owner.getZIndex();
      return aIndex - bIndex;
    });
  };

  /**
   * focusPath
   */

  this.focusPath = function (path) {
    var self = this;
    var pathRenderedSegments = [];
    var graph = this.transitive.network.graph;

    if (path) {
      // if we're focusing a specific path
      pathRenderedSegments = path.getRenderedSegments();

      // un-focus all internal points
      graph.edges.forEach(function (edge) {
        edge.pointArray.forEach(function (point, i) {
          point.setAllPatternsFocused(false);
        });
      }, this);
    } else {
      // if we're returing to 'all-focused' mode
      // re-focus all internal points
      graph.edges.forEach(function (edge) {
        edge.pointArray.forEach(function (point, i) {
          point.setAllPatternsFocused(true);
        });
      }, this);
    }

    var focusChangeSegments = [];
    var focusedVertexPoints = [];
    each(this.renderedSegments, function (rSegment) {
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
    graph.vertices.forEach(function (vertex) {
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
    // if (path) this.sortElements();

    // create a transition callback function that invokes refresh() after all transitions complete
    var n = 0;
    var refreshOnEnd = function refreshOnEnd(transition, callback) {
      transition.each(function () {
        ++n;
      }).each('end', function () {
        if (! --n) self.transitive.refresh();
      });
    };

    // run the transtions on the affected elements
    each(focusChangeSegments, function (segment) {
      segment.runFocusTransition(this.transitive.display, refreshOnEnd);
    }, this);

    each(focusChangePoints, function (point) {
      point.runFocusTransition(this.transitive.display, refreshOnEnd);
    }, this);
  };
});

/**
 * Expose `DefaultRenderer`
 */

module.exports = DefaultRenderer;

},{"./index":31,"augment":42,"component-each":84}],31:[function(require,module,exports){
'use strict';

var augment = require('augment');
var each = require('component-each');

var drawGrid = require('../display/draw-grid');

/**
 * A superclass for a Transitive network rendering engine.
 *
 * @param {Object} the main Transitive object
 */

var Renderer = augment(Object, function () {
  this.constructor = function (transitive) {
    this.transitive = transitive;
  };

  this.render = function () {
    var display = this.transitive.display;
    display.styler = this.transitive.styler;

    // remove all old svg elements
    display.empty();
  };

  /**
   * Refresh
   */

  this.refresh = function (panning) {
    var display = this.transitive.display;
    var network = this.transitive.network;

    if (display.tileLayer) display.tileLayer.zoomed();

    network.graph.vertices.forEach(function (vertex) {
      vertex.point.clearRenderData();
    });
    network.graph.edges.forEach(function (edge) {
      edge.clearRenderData();
    });

    // draw the grid, if necessary
    if (this.transitive.options.drawGrid) drawGrid(display, this.gridCellSize);
  };

  /**
   * sortElements
   */

  this.sortElements = function () {};

  /**
   * focusPath
   */

  this.focusPath = function (path) {};

  this.isDraggable = function (point) {
    var draggableTypes = this.transitive.options.draggableTypes;
    if (!draggableTypes) return false;

    var retval = false;
    each(draggableTypes, function (type) {
      if (type === point.getType()) {
        // Return true in ether of the following cases:
        // 1. No ID array is provided for this point type (i.e. entire type is draggable)
        // 2. An ID array is provided and it includes this Point's ID
        retval = !draggableTypes[type] || draggableTypes[type].indexOf(point.getId()) !== -1;
      }
    });
    return retval;
  };
});

/**
 * Expose `Renderer`
 */

module.exports = Renderer;

},{"../display/draw-grid":10,"augment":42,"component-each":84}],32:[function(require,module,exports){
'use strict';

var each = require('component-each');

var Util = require('../util');

var rEdgeId = 0;

/**
 * Expose `RenderedEdge`
 */

module.exports = RenderedEdge;

/**
 *
 */

function RenderedEdge(graphEdge, forward, type) {
  this.id = rEdgeId++;
  this.graphEdge = graphEdge;
  this.forward = forward;
  this.type = type;
  this.points = [];
  this.clearOffsets();
  this.focused = true;
  this.sortableType = 'SEGMENT';
}

RenderedEdge.prototype.clearGraphData = function () {
  this.graphEdge = null;
  this.edgeFromOffset = 0;
  this.edgeToOffset = 0;
};

RenderedEdge.prototype.addPattern = function (pattern) {
  if (!this.patterns) this.patterns = [];
  if (this.patterns.indexOf(pattern) !== -1) return;
  this.patterns.push(pattern);

  // generate the patternIds field
  this.patternIds = constuctIdListString(this.patterns);
};

RenderedEdge.prototype.addPathSegment = function (pathSegment) {
  if (!this.pathSegments) this.pathSegments = [];
  if (this.pathSegments.indexOf(pathSegment) !== -1) return;
  this.pathSegments.push(pathSegment);

  // generate the pathSegmentIds field
  this.pathSegmentIds = constuctIdListString(this.pathSegments);
};

function constuctIdListString(items) {
  var idArr = [];
  each(items, function (item) {
    idArr.push(item.getId());
  });
  idArr.sort();
  return idArr.join(',');
}

RenderedEdge.prototype.getId = function () {
  return this.id;
};

RenderedEdge.prototype.getType = function () {
  return this.type;
};

RenderedEdge.prototype.setFromOffset = function (offset) {
  this.fromOffset = offset;
};

RenderedEdge.prototype.setToOffset = function (offset) {
  this.toOffset = offset;
};

RenderedEdge.prototype.clearOffsets = function () {
  this.fromOffset = 0;
  this.toOffset = 0;
};

RenderedEdge.prototype.getAlignmentVector = function (alignmentId) {
  if (this.graphEdge.getFromAlignmentId() === alignmentId) {
    return this.graphEdge.fromVector;
  }
  if (this.graphEdge.getToAlignmentId() === alignmentId) {
    return this.graphEdge.toVector;
  }
  return null;
};

RenderedEdge.prototype.offsetAlignment = function (alignmentId, offset) {
  if (this.graphEdge.getFromAlignmentId() === alignmentId) {
    this.setFromOffset(Util.isOutwardVector(this.graphEdge.fromVector) ? offset : -offset);
  }
  if (this.graphEdge.getToAlignmentId() === alignmentId) {
    this.setToOffset(Util.isOutwardVector(this.graphEdge.toVector) ? offset : -offset);
  }
};

RenderedEdge.prototype.setFocused = function (focused) {
  this.focused = focused;
};

RenderedEdge.prototype.refreshRenderData = function (display) {
  if (this.graphEdge.fromVertex.x === this.graphEdge.toVertex.x && this.graphEdge.fromVertex.y === this.graphEdge.toVertex.y) {
    this.renderData = [];
    return;
  }

  this.lineWidth = this.computeLineWidth(display, true);

  var fromOffsetPx = this.fromOffset * this.lineWidth;
  var toOffsetPx = this.toOffset * this.lineWidth;

  if (this.graphEdge.geomCoords) {
    this.renderData = this.graphEdge.getGeometricCoords(fromOffsetPx, toOffsetPx, display, this.forward);
  } else {
    this.renderData = this.graphEdge.getRenderCoords(fromOffsetPx, toOffsetPx, display, this.forward);
  }

  var firstRenderPoint = this.renderData[0];
  var lastRenderPoint = this.renderData[this.renderData.length - 1];

  var pt;
  if (!this.graphEdge.fromVertex.isInternal) {
    pt = this.forward ? firstRenderPoint : lastRenderPoint;
    if (pt) {
      this.graphEdge.fromVertex.point.addRenderData({
        x: pt.x,
        y: pt.y,
        rEdge: this
      });
    }
  }

  pt = this.forward ? lastRenderPoint : firstRenderPoint;
  if (pt) {
    this.graphEdge.toVertex.point.addRenderData({
      x: pt.x,
      y: pt.y,
      rEdge: this
    });
  }

  each(this.graphEdge.pointArray, function (point, i) {
    if (point.getType() === 'TURN') return;
    var t = (i + 1) / (this.graphEdge.pointArray.length + 1);
    var coord = this.graphEdge.coordAlongEdge(this.forward ? t : 1 - t, this.renderData, display);
    if (coord) {
      point.addRenderData({
        x: coord.x,
        y: coord.y,
        rEdge: this
      });
    }
  }, this);
};

RenderedEdge.prototype.computeLineWidth = function (display, includeEnvelope) {
  var styler = display.styler;
  if (styler && display) {
    // compute the line width
    var env = styler.compute(styler.segments.envelope, display, this);
    if (env && includeEnvelope) {
      return parseFloat(env.substring(0, env.length - 2), 10) - 2;
    } else {
      var lw = styler.compute(styler.segments['stroke-width'], display, this);
      return parseFloat(lw.substring(0, lw.length - 2), 10) - 2;
    }
  }
};

RenderedEdge.prototype.isFocused = function () {
  return this.focused === true;
};

RenderedEdge.prototype.getZIndex = function () {
  return 10000;
};

/**
 *  Computes the point of intersection between two adjacent, offset RenderedEdges (the
 *  edge the function is called on and a second egde passed as a parameter)
 *  by "extending" the adjacent edges and finding the point of intersection. If
 *  such a point exists, the existing renderData arrays for the edges are
 *  adjusted accordingly, as are any associated stops.
 */

RenderedEdge.prototype.intersect = function (rEdge) {
  // do no intersect adjacent edges of unequal bundle size
  if (this.graphEdge.renderedEdges.length !== rEdge.graphEdge.renderedEdges.length) return;

  var commonVertex = this.graphEdge.commonVertex(rEdge.graphEdge);
  if (!commonVertex || commonVertex.point.isSegmentEndPoint) return;

  var thisCheck = commonVertex === this.graphEdge.fromVertex && this.forward || commonVertex === this.graphEdge.toVertex && !this.forward;
  var otherCheck = commonVertex === rEdge.graphEdge.fromVertex && rEdge.forward || commonVertex === rEdge.graphEdge.toVertex && !rEdge.forward;

  var p1 = thisCheck ? this.renderData[0] : this.renderData[this.renderData.length - 1];
  var v1 = this.graphEdge.getVector(commonVertex);

  var p2 = otherCheck ? rEdge.renderData[0] : rEdge.renderData[rEdge.renderData.length - 1];
  var v2 = rEdge.graphEdge.getVector(commonVertex);

  if (!p1 || !p2 || !v1 || !v2 || p1.x === p2.x && p1.y === p2.y) return;

  var isect = Util.lineIntersection(p1.x, p1.y, p1.x + v1.x, p1.y - v1.y, p2.x, p2.y, p2.x + v2.x, p2.y - v2.y);

  if (!isect.intersect) return;

  // adjust the endpoint of the first edge
  if (thisCheck) {
    this.renderData[0].x = isect.x;
    this.renderData[0].y = isect.y;
  } else {
    this.renderData[this.renderData.length - 1].x = isect.x;
    this.renderData[this.renderData.length - 1].y = isect.y;
  }

  // adjust the endpoint of the second edge
  if (otherCheck) {
    rEdge.renderData[0].x = isect.x;
    rEdge.renderData[0].y = isect.y;
  } else {
    rEdge.renderData[rEdge.renderData.length - 1].x = isect.x;
    rEdge.renderData[rEdge.renderData.length - 1].y = isect.y;
  }

  // update the point renderData
  commonVertex.point.addRenderData({
    x: isect.x,
    y: isect.y,
    rEdge: this
  });
};

RenderedEdge.prototype.findExtension = function (vertex) {
  var incidentEdges = vertex.incidentEdges(this.graphEdge);
  var bundlerId = this.patternIds || this.pathSegmentIds;
  for (var e = 0; e < incidentEdges.length; e++) {
    var edgeSegments = incidentEdges[e].renderedEdges;
    for (var s = 0; s < edgeSegments.length; s++) {
      var segment = edgeSegments[s];
      var otherId = segment.patternIds || segment.pathSegmentIds;
      if (bundlerId === otherId) {
        return segment;
      }
    }
  }
};

RenderedEdge.prototype.toString = function () {
  return 'RenderedEdge ' + this.id + ' type=' + this.type + ' on ' + this.graphEdge.toString() + ' w/ patterns ' + this.patternIds + ' fwd=' + this.forward;
};

},{"../util":38,"component-each":84}],33:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */

var d3 = require('d3');
var each = require('component-each');

var interpolateLine = require('../util/interpolate-line');

/**
 * Expose `RenderedSegment`
 */

module.exports = RenderedSegment;

var rSegmentId = 0;

/**
 *
 */

function RenderedSegment(pathSegment) {
  this.id = rSegmentId++;
  this.renderedEdges = [];
  this.pathSegment = pathSegment;
  if (pathSegment) this.type = pathSegment.type;
  this.focused = true;
}

RenderedSegment.prototype.getId = function () {
  return this.id;
};

RenderedSegment.prototype.getType = function () {
  return this.type;
};

RenderedSegment.prototype.addRenderedEdge = function (rEdge) {
  this.renderedEdges.push(rEdge);
};

RenderedSegment.prototype.render = function (display) {
  this.line = d3.svg.line() // the line translation function
  .x(function (data, i) {
    return data.x;
  }).y(function (data, i) {
    return data.y;
  }).interpolate(interpolateLine.bind({
    segment: this,
    display: display
  }));

  this.svgGroup = display.svg.append('g');

  this.lineSvg = this.svgGroup.append('g').attr('class', 'transitive-sortable').datum({
    owner: this,
    sortableType: 'SEGMENT'
  });

  this.labelSvg = this.svgGroup.append('g');

  this.lineGraph = this.lineSvg.append('path');

  this.lineGraph.attr('class', 'transitive-line').data([this]);

  this.lineGraphFront = this.lineSvg.append('path');

  this.lineGraphFront.attr('class', 'transitive-line-front').data([this]);

  if (display.haloLayer) {
    this.lineGraphHalo = display.haloLayer.append('path');

    this.lineGraphHalo.attr('class', 'transitive-line-halo').data([this]);
  }
};

RenderedSegment.prototype.refresh = function (display, renderData) {
  if (renderData) {
    this.renderData = renderData;
  } else {
    this.renderData = [];
    each(this.renderedEdges, function (rEdge) {
      this.renderData = this.renderData.concat(rEdge.renderData);
    }, this);
  }

  var lineData = this.line(this.renderData);
  this.lineGraph.attr('d', lineData);
  this.lineGraphFront.attr('d', lineData);
  if (this.lineGraphHalo) this.lineGraphHalo.attr('d', lineData);
  display.styler.styleSegment(display, this);
};

RenderedSegment.prototype.setFocused = function (focused) {
  this.focused = focused;
};

RenderedSegment.prototype.isFocused = function () {
  return this.focused;
};

RenderedSegment.prototype.runFocusTransition = function (display, callback) {
  var newColor = display.styler.compute(display.styler.segments.stroke, display, this);
  this.lineGraph.transition().style('stroke', newColor).call(callback);
};

RenderedSegment.prototype.getZIndex = function () {
  return this.zIndex;
};

RenderedSegment.prototype.computeLineWidth = function (display, includeEnvelope) {
  var styler = display.styler;
  if (styler && display) {
    // compute the line width
    var env = styler.compute(styler.segments.envelope, display, this);
    if (env && includeEnvelope) {
      return parseFloat(env.substring(0, env.length - 2), 10) - 2;
    } else {
      var lw = styler.compute(styler.segments['stroke-width'], display, this);
      return parseFloat(lw.substring(0, lw.length - 2), 10) - 2;
    }
  }
};

RenderedSegment.prototype.compareTo = function (other) {
  // show transit segments in front of other types
  if (this.type === 'TRANSIT' && other.type !== 'TRANSIT') return -1;
  if (other.type === 'TRANSIT' && this.type !== 'TRANSIT') return 1;

  if (this.type === 'TRANSIT' && other.type === 'TRANSIT') {
    // for two transit segments, try sorting transit mode first
    if (this.mode && other.mode && this.mode !== other.mode) {
      return this.mode > other.mode;
    }

    // for two transit segments of the same mode, sort by id (for display consistency)
    return this.getId() < other.getId();
  }
};

RenderedSegment.prototype.getLabelTextArray = function () {
  var textArray = [];
  each(this.patterns, function (pattern) {
    var shortName = pattern.route.route_short_name;
    if (textArray.indexOf(shortName) === -1) textArray.push(shortName);
  });
  return textArray;
};

RenderedSegment.prototype.getLabelAnchors = function (display, spacing) {
  var labelAnchors = [];
  this.computeRenderLength(display);
  var anchorCount = Math.floor(this.renderLength / spacing);
  var pctSpacing = spacing / this.renderLength;

  for (var i = 0; i < anchorCount; i++) {
    var t = i % 2 === 0 ? 0.5 + i / 2 * pctSpacing : 0.5 - (i + 1) / 2 * pctSpacing;
    var coord = this.coordAlongRenderedPath(t, display);
    if (coord) labelAnchors.push(coord);
  }

  return labelAnchors;
};

RenderedSegment.prototype.coordAlongRenderedPath = function (t, display) {
  var loc = t * this.renderLength;

  var cur = 0;
  for (var i = 0; i < this.renderedEdges.length; i++) {
    var rEdge = this.renderedEdges[i];
    var edgeRenderLen = rEdge.graphEdge.getRenderLength(display);
    if (loc <= cur + edgeRenderLen) {
      var t2 = (loc - cur) / edgeRenderLen;
      return rEdge.graphEdge.coordAlongEdge(t2, rEdge.renderData, display);
    }
    cur += edgeRenderLen;
  }
};

RenderedSegment.prototype.computeRenderLength = function (display) {
  this.renderLength = 0;
  each(this.renderedEdges, function (rEdge) {
    this.renderLength += rEdge.graphEdge.getRenderLength(display);
  }, this);
};

RenderedSegment.prototype.getLegendType = function () {
  if (this.type === 'TRANSIT') {
    return this.type + '_' + this.mode;
  }
  return this.type;
};

RenderedSegment.prototype.toString = function () {
  return 'RenderedSegment ' + this.id + ' on ' + (this.pathSegment ? this.pathSegment.toString() : ' (null segment)');
};

},{"../util/interpolate-line":39,"component-each":84,"d3":88}],34:[function(require,module,exports){
'use strict';

var d3 = require('d3');
var augment = require('augment');
var each = require('component-each');

var Renderer = require('./index');
var Point = require('../point/index');

var interpolateLine = require('../util/interpolate-line');

/**
 * A Renderer subclass for drawing a simplified representation of the graph
 * itself, i.e. just the edges and vertices.
 *
 * @param {Object} the main Transitive object
 */

var WireframeRenderer = augment(Renderer, function (base) {
  this.constructor = function (transitive) {
    base.constructor.call(this, transitive);
  };

  this.render = function () {
    base.render.call(this);

    var graph = this.transitive.network.graph;

    var self = this;

    this.wireframeEdges = [];
    each(graph.edges, function (edge) {
      var wfEdge = new WireframeEdge(edge);
      wfEdge.render(self.transitive.display);
      self.wireframeEdges.push(wfEdge);
    });

    this.wireframeVertices = [];
    each(graph.vertices, function (vertex) {
      var wfVertex = new WireframeVertex(vertex);
      wfVertex.render(self.transitive.display);
      self.wireframeVertices.push(wfVertex);
    });

    this.transitive.refresh();
  };

  this.refresh = function (panning) {
    base.refresh.call(this, panning);
    var self = this;

    each(this.wireframeEdges, function (wfEdge) {
      wfEdge.refresh(self.transitive.display);
    });

    each(this.wireframeVertices, function (wfVertex) {
      wfVertex.refresh(self.transitive.display);
    });
  };

  /**
   * sortElements
   */

  this.sortElements = function () {};
});

/**
 * Expose `WireframeRenderer`
 */

module.exports = WireframeRenderer;

/**
 * WireframeVertex helper class
 */

var WireframeVertex = augment(Point, function (base) {
  this.constructor = function (vertex) {
    base.constructor.call(this, {
      vertex: vertex
    });
  };

  this.getType = function () {
    return 'WIREFRAME_VERTEX';
  };

  /**
   * Draw the vertex
   *
   * @param {Display} display
   */

  this.render = function (display) {
    base.render.call(this, display);

    this.initSvg(display);
    this.svgGroup.attr('class', 'transitive-sortable').datum({
      owner: this,
      sortableType: 'POINT_WIREFRAME_VERTEX'
    });

    // set up the marker
    this.marker = this.markerSvg.append('circle').datum({
      owner: this
    }).attr('class', 'transitive-wireframe-vertex-circle');
  };

  /**
   * Refresh the vertex
   *
   * @param {Display} display
   */

  this.refresh = function (display) {
    var x = display.xScale(this.vertex.x);
    var y = display.yScale(this.vertex.y);
    var translate = 'translate(' + x + ', ' + y + ')';
    this.marker.attr('transform', translate);
    display.styler.styleWireframeVertex(display, this);
  };
});

/**
 * WireframeEdge helper class
 */

var WireframeEdge = augment(Object, function () {
  this.constructor = function (edge) {
    this.edge = edge;
  };

  this.render = function (display) {
    this.line = d3.svg.line() // the line translation function
    .x(function (data, i) {
      return data.x;
    }).y(function (data, i) {
      return data.y;
    }).interpolate(interpolateLine.bind({
      segment: this,
      display: display
    }));

    this.svgGroup = display.svg.append('g');

    this.lineSvg = this.svgGroup.append('g').attr('class', 'transitive-sortable').datum({
      owner: this,
      sortableType: 'WIREFRAME_EDGE'
    });

    this.lineGraph = this.lineSvg.append('path').attr('class', 'transitive-wireframe-edge-line');
  };

  this.refresh = function (display) {
    this.renderData = this.edge.getRenderCoords(0, 0, display, true);
    var lineData = this.line(this.renderData);
    this.lineGraph.attr('d', lineData);
    display.styler.styleWireframeEdge(display, this);
  };
});

},{"../point/index":23,"../util/interpolate-line":39,"./index":31,"augment":42,"component-each":84,"d3":88}],35:[function(require,module,exports){
'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Route = require('../core/route');
var RoutePattern = require('../core/pattern');
var Util = require('../util');

var styles = require('./styles');

/**
 * Element Types
 */

var types = ['labels', 'segments', 'segments_front', 'segments_halo', 'segment_labels', 'segment_label_containers', 'stops_merged', 'stops_pattern', 'places', 'places_icon', 'multipoints_merged', 'multipoints_pattern', 'wireframe_vertices', 'wireframe_edges'];

/**
 * SVG attributes
 */

var svgAttributes = ['height', 'target', 'title', 'width', 'y1', 'y2', 'x1', 'x2', 'cx', 'cy', 'dx', 'dy', 'rx', 'ry', 'd', 'r', 'y', 'x', 'transform'];

/**
 * Expose `Styler`
 */

module.exports = Styler;

/**
 * Styler object
 */

function Styler(styles) {
  if (!(this instanceof Styler)) return new Styler(styles);

  // reset styles
  this.reset();

  // load styles
  if (styles) this.load(styles);
}

/**
 * Clear all current styles
 */

Styler.prototype.clear = function () {
  for (var i in types) {
    this[types[i]] = {};
  }
};

/**
 * Reset to the predefined styles
 */

Styler.prototype.reset = function () {
  for (var i in types) {
    var type = types[i];
    this[type] = (0, _assign2.default)({}, styles[type] || {});
    for (var key in this[type]) {
      if (!Array.isArray(this[type][key])) this[type][key] = [this[type][key]];
    }
  }
};

/**
 * Load rules
 *
 * @param {Object} a set of style rules
 */

Styler.prototype.load = function (styles) {
  for (var i in types) {
    var type = types[i];
    if (styles[type]) {
      for (var key in styles[type]) {
        this[type][key] = (this[type][key] || []).concat(styles[type][key]);
      }
    }
  }
};

/**
 * Style a Segment using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {RenderedSegment} Transitive RenderedSegment object
 */

Styler.prototype.styleSegment = function (display, segment) {
  if (segment.lineGraphHalo) {
    this.applyAttrAndStyle(display, segment.lineGraphHalo, this.segments_halo);
  }

  this.applyAttrAndStyle(display, segment.lineGraph, this.segments);

  this.applyAttrAndStyle(display, segment.lineGraphFront, this.segments_front);
};

/**
 * Style a WireframeEdge using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {WireframeEdge} Transitive WireframeEdge object
 */

Styler.prototype.styleWireframeEdge = function (display, wfEdge) {
  this.applyAttrAndStyle(display, wfEdge.svgGroup.selectAll('.transitive-wireframe-edge-line'), this.wireframe_edges);
};

/**
 * Style a Point using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {Point} Transitive Point object
 */

Styler.prototype.stylePoint = function (display, point) {
  if (point.getType() === 'STOP') this.styleStop(display, point);
  if (point.getType() === 'PLACE') this.stylePlace(display, point);
  if (point.getType() === 'MULTI') this.styleMultiPoint(display, point);
  if (point.getType() === 'WIREFRAME_VERTEX') this.styleWireframeVertex(display, point);
};

/**
 * Style a Stop using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {Stop} Transitive Stop object
 */

Styler.prototype.styleStop = function (display, stop) {
  this.applyAttrAndStyle(display, stop.patternMarkers, this.stops_pattern);

  this.applyAttrAndStyle(display, stop.mergedMarker, this.stops_merged);

  this.applyAttrAndStyle(display, stop.svgGroup.selectAll('.transitive-stop-label'), this.labels);
};

/**
 * Style a Place using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {Place} Transitive Place object
 */

Styler.prototype.stylePlace = function (display, place) {
  this.applyAttrAndStyle(display, place.svgGroup.selectAll('.transitive-place-circle'), this.places);

  this.applyAttrAndStyle(display, place.svgGroup.selectAll('.transitive-place-icon'), this.places_icon);

  this.applyAttrAndStyle(display, place.svgGroup.selectAll('.transitive-place-label'), this.labels);
};

/**
 * Style a MultiPoint using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {MultiPoint} Transitive MultiPoint object
 */

Styler.prototype.styleMultiPoint = function (display, multipoint) {
  this.applyAttrAndStyle(display, multipoint.svgGroup.selectAll('.transitive-multipoint-marker-pattern'), this.multipoints_pattern);

  this.applyAttrAndStyle(display, multipoint.svgGroup.selectAll('.transitive-multipoint-marker-merged'), this.multipoints_merged);

  this.applyAttrAndStyle(display, multipoint.svgGroup.selectAll('.transitive-multi-label'), this.labels);
};

/**
 * Style a WireframeVertex using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {WireframeVertex} Transitive WireframeVertex object
 */

Styler.prototype.styleWireframeVertex = function (display, wfVertex) {
  this.applyAttrAndStyle(display, wfVertex.svgGroup.selectAll('.transitive-wireframe-vertex-circle'), this.wireframe_vertices);
};

/**
 * Style a Point label using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {Point} Transitive Point object
 */

Styler.prototype.stylePointLabel = function (display, point) {
  var pointType = point.getType().toLowerCase();

  this.applyAttrAndStyle(display, point.svgGroup.selectAll('.transitive-' + pointType + '-label'), this.labels);
};

/**
 * Style a Segment label using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {SegmentLabel} Transitive SegmentLabel object
 */

Styler.prototype.styleSegmentLabel = function (display, label) {
  this.applyAttrAndStyle(display, label.svgGroup.selectAll('.transitive-segment-label-container'), this.segment_label_containers);
  this.applyAttrAndStyle(display, label.svgGroup.selectAll('.transitive-segment-label'), this.segment_labels);
};

/**
 * Check if it's an attribute or a style and apply accordingly
 *
 * @param {Display} the Display object
 * @param {Object} a D3 list of elements
 * @param {Object} the list of attributes
 */

Styler.prototype.applyAttrAndStyle = function (display, elements, attributes) {
  for (var name in attributes) {
    var rules = attributes[name];
    var fn = svgAttributes.indexOf(name) === -1 ? 'style' : 'attr';

    this.applyRules(display, elements, name, rules, fn);
  }
};

/**
 * Apply style/attribute rules to a list of elements
 *
 * @param {Display} display object
 * @param {Object} elements
 * @param {String} rule name
 * @param {Array} rules
 * @param {String} style/attr
 */

Styler.prototype.applyRules = function (display, elements, name, rules, fn) {
  var self = this;
  elements[fn](name, function (data, index) {
    return self.compute(rules, display, data, index);
  });
};

/**
 * Compute a style rule based on the current display and data
 *
 * @param {Array} array of rules
 * @param {Object} the Display object
 * @param {Object} data associated with this object
 * @param {Number} index of this object
 */

Styler.prototype.compute = function (rules, display, data, index) {
  var computed;
  var self = this;
  for (var i in rules) {
    var rule = rules[i];
    var val = isFunction(rule) ? rule.call(self, display, data, index, styles.utils) : rule;
    if (val !== undefined && val !== null) computed = val;
  }
  return computed;
};

/**
 * Return the collection of default segment styles for a mode.
 *
 * @param {String} an OTP mode string
 */

Styler.prototype.getModeStyles = function (mode, display) {
  var modeStyles = {};

  // simulate a segment w/ the specified style
  var segment = {
    focused: true,
    isFocused: function isFocused() {
      return true;
    }
  };

  if (mode === 'WALK' || mode === 'BICYCLE' || mode === 'BICYCLE_RENT' || mode === 'CAR') {
    segment.type = mode;
  } else {
    // assume a transit mode
    segment.type = 'TRANSIT';
    segment.mode = Util.otpModeToGtfsType(mode);
    var route = new Route({
      route_type: segment.mode,
      agency_id: '',
      route_id: '',
      route_short_name: '',
      route_long_name: ''
    });
    var pattern = new RoutePattern({});
    route.addPattern(pattern);
    segment.patterns = [pattern];
  }

  for (var attrName in this.segments) {
    var rules = this.segments[attrName];
    for (var i in rules) {
      var rule = rules[i];
      var val = isFunction(rule) ? rule.call(this, display, segment, 0, styles.utils) : rule;
      if (val !== undefined && val !== null) {
        modeStyles[attrName] = val;
      }
    }
  }

  return modeStyles;
};

/**
 * Is function?
 */

function isFunction(val) {
  return Object.prototype.toString.call(val) === '[object Function]';
}

},{"../core/pattern":6,"../core/route":8,"../util":38,"./styles":36,"babel-runtime/core-js/object/assign":43}],36:[function(require,module,exports){
'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var d3 = require('d3');

/**
 * Scales for utility functions to use
 */

var zoomScale = d3.scale.linear().domain([0.25, 1, 4]);
var strokeScale = d3.scale.linear().domain([0.25, 1, 4]).range([5, 12, 19]);
var fontScale = d3.scale.linear().domain([0.25, 1, 4]).range([10, 14, 18]);

/**
 * Scales for utility functions to use
 */

var notFocusedColor = '#e0e0e0';

/**
 * Expose `utils` for the style functions to use
 */

exports.utils = {
  pixels: function pixels(zoom, min, normal, max) {
    return zoomScale.range([min, normal, max])(zoom);
  },
  strokeWidth: function strokeWidth(display) {
    return strokeScale(display.zoom.scale());
  },
  fontSize: function fontSize(display, data) {
    return Math.floor(fontScale(display.zoom.scale()));
  },
  defineSegmentCircleMarker: function defineSegmentCircleMarker(display, segment, radius, fillColor) {
    var markerId = 'circleMarker-' + segment.getId();
    display.svg.append('defs').append('svg:marker').attr('id', markerId).attr('refX', radius).attr('refY', radius).attr('markerWidth', radius * 2).attr('markerHeight', radius * 2).attr('markerUnits', 'userSpaceOnUse').append('svg:circle').attr('cx', radius).attr('cy', radius).attr('r', radius).attr('fill', segment.focused ? fillColor : notFocusedColor);

    return 'url(#' + markerId + ')';
  }
};

/**
 * Default Wireframe Edge/Vertex Rules
 */

exports.wireframe_vertices = {
  cx: 0,
  cy: 0,
  r: 3,
  fill: '#000'
};

exports.wireframe_edges = {
  stroke: '#444',
  'stroke-width': 2,
  'stroke-dasharray': '3px 2px',
  fill: 'none'
};

/**
 * Default Merged Stops Rules
 */

var stopsMerged = exports.stops_merged = {
  fill: function fill(display, data, index, utils) {
    return '#fff';
  },
  r: function r(display, data, index, utils) {
    return utils.pixels(display.zoom.scale(), 8, 12, 16);
  },
  stroke: function stroke(display, data, index, utils) {
    var point = data.owner;
    if (!point.isFocused()) return notFocusedColor;
    return '#000';
  },
  'stroke-width': function strokeWidth(display, data, index, utils) {
    return 2;
  },

  /**
   *  Transitive-specific attribute specifying the shape of the main stop marker.
   *  Can be 'roundedrect', 'rectangle' or 'circle'
   */

  'marker-type': ['circle', function (display, data, index, utils) {
    var point = data.owner;
    if ((point.containsBoardPoint() || point.containsAlightPoint()) && !point.containsTransferPoint()) return 'circle';
  }],

  /**
   *  Transitive-specific attribute specifying any additional padding, in pixels,
   *  to apply to main stop marker. A value of zero (default) results in a that
   *  marker is flush to the edges of the pattern segment(s) the point is set against.
   *  A value greater than zero creates a marker that is larger than the width of
   *  the segments(s).
   */

  'marker-padding': 3,

  visibility: function visibility(display, data) {
    if (!data.owner.containsSegmentEndPoint()) return 'hidden';
  }
};

/**
 * Stops Along a Pattern
 */

var stopsPattern = exports.stops_pattern = {
  cx: 0,
  cy: 0,
  r: [4, function (display, data, index, utils) {
    return utils.pixels(display.zoom.scale(), 1, 2, 4);
  }, function (display, data, index, utils) {
    var point = data.owner;
    var busOnly = true;
    point.getPatterns().forEach(function (pattern) {
      if (pattern.route && pattern.route.route_type !== 3) busOnly = false;
    });
    if (busOnly && !point.containsSegmentEndPoint()) {
      return 0.5 * utils.pixels(display.zoom.scale(), 2, 4, 6.5);
    }
  }],
  stroke: 'none',
  visibility: function visibility(display, data) {
    if (display.zoom.scale() < 1.5) return 'hidden';
    if (data.owner.containsSegmentEndPoint()) return 'hidden';
  }
};

/**
 * Default place rules
 */

exports.places = {
  cx: 0,
  cy: 0,
  r: 14,
  stroke: '0px',
  fill: '#fff'
};

/**
 * Default MultiPoint rules -- based on Stop rules
 */

var multipointsMerged = exports.multipoints_merged = (0, _assign2.default)({}, stopsMerged);

multipointsMerged.visibility = true;

/**
 * Default Multipoint Stops along a pattern
 */

exports.multipoints_pattern = (0, _assign2.default)({}, stopsPattern);

/**
 * Default label rules
 */

exports.labels = {
  'font-size': function fontSize(display, data, index, utils) {
    return utils.fontSize(display, data) + 'px';
  },
  'font-weight': function fontWeight(display, data, index, utils) {
    var point = data.owner.parent;
    if (point.containsBoardPoint() || point.containsAlightPoint()) return 'bold';
  },

  /**
   * 'orientations' is a transitive-specific attribute used to specify allowable
   * label placement orientations expressed as one of eight compass directions
   * relative to the point being labeled:
   *
   *        'N'
   *    'NW' |  'NE'
   *       \ | /
   *  'W' -- O -- 'E'
   *       / | \
   *    'SW' | 'SE'
   *        'S
   *
   * Labels oriented 'E' or 'W' are rendered horizontally, 'N' and 'S' vertically,
   * and all others at a 45-degree angle.
   *
   * Returns an array of allowed orientation codes in the order that they will be
   * tried by the labeler.
   */

  orientations: [['E', 'W']]
};

/**
 * All path segments
 * TODO: update old route-pattern-specific code below
 */

exports.segments = {
  stroke: ['#008', function (display, data) {
    var segment = data;
    if (!segment.focused) return notFocusedColor;
    if (segment.type === 'TRANSIT') {
      if (segment.patterns) {
        if (segment.patterns[0].route.route_short_name.toLowerCase().substring(0, 2) === 'dc') return '#f00';
        return segment.patterns[0].route.getColor();
      }
    } else if (segment.type === 'CAR') {
      return '#888';
    }
  }],
  'stroke-dasharray': [false, function (display, data) {
    var segment = data;
    if (segment.frequency && segment.frequency.average < 12) {
      if (segment.frequency.average > 6) return '12px, 12px';
      return '12px, 2px';
    }
  }],
  'stroke-width': ['12px', function (display, data, index, utils) {
    var segment = data;

    if (segment.mode === 3) {
      return utils.pixels(display.zoom.scale(), 2, 4, 8) + 'px';
    }
    return utils.pixels(display.zoom.scale(), 4, 8, 12) + 'px';
  }],
  envelope: [function (display, data, index, utils) {
    var segment = data;
    if (segment.type !== 'TRANSIT') {
      return '8px';
    }
    if (segment.mode === 3) {
      return utils.pixels(display.zoom.scale(), 4, 6, 10) + 'px';
    }
    return utils.pixels(display.zoom.scale(), 6, 10, 14) + 'px';
  }]
};

/**
 * Segments Front
 */

exports.segments_front = {
  stroke: '#008',
  'stroke-width': function strokeWidth(display, data, index, utils) {
    return utils.pixels(display.zoom.scale(), 3, 6, 10) / 2 + 'px';
  },
  fill: 'none',
  display: ['none', function (display, data, index, utils) {
    if (data.pattern && data.pattern.route && data.pattern.route.route_type === 3 && data.pattern.route.route_short_name.toLowerCase().substring(0, 2) === 'dc') {
      return 'inline';
    }
  }]
};

/**
 * Segments Halo
 */

exports.segments_halo = {
  stroke: '#fff',
  'stroke-width': function strokeWidth(display, data, index, utils) {
    return data.computeLineWidth(display) + 8;
  },
  'stroke-linecap': 'round',
  fill: 'none'
};

/**
 * Label Containers
 */

exports.segment_label_containers = {
  fill: function fill(display, data) {
    if (!data.isFocused()) return notFocusedColor;
  },
  'stroke-width': function strokeWidth(display, data) {
    if (data.parent.pattern && data.parent.pattern.route.route_short_name.toLowerCase().substring(0, 2) === 'dc') return 1;
    return 0;
  },
  rx: 3,
  ry: 3
};

},{"babel-runtime/core-js/object/assign":43,"d3":88}],37:[function(require,module,exports){
'use strict';

var d3 = require('d3');
var Emitter = require('component-emitter');

var Network = require('./core/network');

var Display = require('./display');

var DefaultRenderer = require('./renderer/default-renderer');
var WireframeRenderer = require('./renderer/wireframe-renderer');

var Styler = require('./styler');
var Labeler = require('./labeler');

var SphericalMercator = require('./util/spherical-mercator');
var sm = new SphericalMercator();

/*
 * Expose `Transitive`
 */

module.exports = Transitive;

/**
 * Create a new instance of `Transitive`
 *
 * @param {Object} options object
 *   - data {Object} data to render
 *   - styles {Object} styles to apply
 *   - el {Element} the DOM element to render the main display to
 *   - legendEl {Element} the DOM element to render the legend to
 *   - drawGrid {Boolean} whether to draw a background grid (defaults to false)
 *   - gridCellSize {Number} resolution of the grid in SphericalMercator meters
 *   - draggableTypes {Array} a list of network element types to enable dragging for
 *   - initialBounds {Array} initial lon/lat bounds for the display expressed as [[west, south], [east, north]]
 *   - displayMargins {Object} padding to apply to the initial rendered network within the display. Expressed in pixels for top/bottom/left/right
 *   - mapboxId {String} an Mapbox tileset id for rendering background tiles (Deprecated -- use Leaflet with Leaflet.TransitiveLayer)
 *   - zoomEnabled {Boolean} whether to enable the display's built-in zoom/pan functionality (defaults to true)
 *   - autoResize {Boolean} whether the display should listen for window resize events and update automatically (defaults to true)
 *   - groupEdges {Boolean} whether to consider edges with the same origin/destination equivalent for rendering, even if intermediate stop sequence is different (defaults to true)
 */

function Transitive(options) {
  console.log('**** trn');
  if (!(this instanceof Transitive)) return new Transitive(options);

  this.options = options;
  if (this.options.zoomEnabled === undefined) this.options.zoomEnabled = true;
  if (this.options.autoResize === undefined) this.options.autoResize = true;
  if (this.options.groupEdges === undefined) this.options.groupEdges = true;

  if (options.el) this.setElement(options.el);

  this.data = options.data;

  this.setRenderer(this.options.initialRenderer || 'default');

  this.labeler = new Labeler(this);
  this.styler = new Styler(options.styles);
}

/**
 * Mixin `Emitter`
 */

Emitter(Transitive.prototype);

/**
 * Clear the Network data and redraw the (empty) map
 */

Transitive.prototype.clearData = function () {
  this.network = this.data = null;
  this.labeler.clear();
  this.emit('clear data', this);
};

/**
 * Update the Network data and redraw the map
 */

Transitive.prototype.updateData = function (data) {
  this.network = null;
  this.data = data;
  if (this.display) this.display.scaleSet = false;
  this.labeler.clear();
  this.emit('update data', this);
};

/**
 * Return the collection of default segment styles for a mode.
 *
 * @param {String} an OTP mode string
 */

Transitive.prototype.getModeStyles = function (mode) {
  return this.styler.getModeStyles(mode, this.display || new Display(this));
};

/** Display/Render Methods **/

/**
 * Set the DOM element that serves as the main map canvas
 */

Transitive.prototype.setElement = function (el, legendEl) {
  if (this.el) d3.select(this.el).selectAll('*').remove();

  this.el = el;
  this.display = new Display(this);

  // Emit click events
  var self = this;
  this.display.svg.on('click', function () {
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
 * Set the DOM element that serves as the main map canvas
 */

Transitive.prototype.setRenderer = function (type) {
  switch (type) {
    case 'wireframe':
      this.renderer = new WireframeRenderer(this);
      break;
    case 'default':
      this.renderer = new DefaultRenderer(this);
      break;
  }
};

/**
 * Render
 */

Transitive.prototype.render = function () {
  if (!this.network) {
    this.network = new Network(this, this.data);
  }

  if (!this.display.scaleSet) {
    this.display.setScale(this.network.graph.bounds(), this.options);
  }

  this.renderer.render();

  this.emit('render', this);
};

/**
 * Render to
 *
 * @param {Element} el
 */

Transitive.prototype.renderTo = function (el) {
  this.setElement(el);
  this.render();

  this.emit('render to', this);
  return this;
};

/**
 * Refresh
 */

Transitive.prototype.refresh = function (panning) {
  if (!this.network) {
    this.render();
  }

  this.renderer.refresh();
};

/**
 * focusJourney
 */

Transitive.prototype.focusJourney = function (journeyId) {
  var path = journeyId ? this.network.journeys[journeyId].path : null;
  this.renderer.focusPath(path);
};

/**
 * Sets the Display bounds
 * @param {Array} lon/lat bounds expressed as [[west, south], [east, north]]
 */

Transitive.prototype.setDisplayBounds = function (llBounds) {
  this.display.updateDomains([sm.forward(llBounds[0]), sm.forward(llBounds[1])]);
  this.display.zoomChanged();
};

/**
 * Gets the Network bounds
 * @returns {Array} lon/lat bounds expressed as [[west, south], [east, north]]
 */

Transitive.prototype.getNetworkBounds = function () {
  if (!this.network || !this.network.graph) return null;
  var graphBounds = this.network.graph.bounds();
  var ll1 = sm.inverse(graphBounds[0]);
  var ll2 = sm.inverse(graphBounds[1]);
  return [[Math.min(ll1[0], ll2[0]), Math.min(ll1[1], ll2[1])], [Math.max(ll1[0], ll2[0]), Math.max(ll1[1], ll2[1])]];
};

/**
 * resize
 */

Transitive.prototype.resize = function (width, height) {
  if (!this.display) return;
  d3.select(this.display.el).style('width', width + 'px').style('height', height + 'px');
  this.display.resized();
};

},{"./core/network":3,"./display":11,"./labeler":18,"./renderer/default-renderer":30,"./renderer/wireframe-renderer":34,"./styler":35,"./util/spherical-mercator":41,"component-emitter":85,"d3":88}],38:[function(require,module,exports){
'use strict';

/**
 * General Transitive utilities library
 */

var d3 = require('d3');

var tolerance = 0.000001;

module.exports.fuzzyEquals = function (a, b, tol) {
  tol = tol || tolerance;
  return Math.abs(a - b) < tol;
};

module.exports.distance = function (x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
};

module.exports.getRadiusFromAngleChord = function (angleR, chordLen) {
  return chordLen / 2 / Math.sin(angleR / 2);
};

/*
 * CCW utility function. Accepts 3 coord pairs; result is positive if points
 * have counterclockwise orientation, negative if clockwise, 0 if collinear.
 */

module.exports.ccw = function (ax, ay, bx, by, cx, cy) {
  var raw = module.exports.ccwRaw(ax, ay, bx, by, cx, cy);
  return raw === 0 ? 0 : raw / Math.abs(raw);
};

module.exports.ccwRaw = function (ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
};

/*
 * Compute angle formed by three points in cartesian plane using law of cosines
 */

module.exports.angleFromThreePoints = function (ax, ay, bx, by, cx, cy) {
  var c = module.exports.distance(ax, ay, bx, by);
  var a = module.exports.distance(bx, by, cx, cy);
  var b = module.exports.distance(ax, ay, cx, cy);
  return Math.acos((a * a + c * c - b * b) / (2 * a * c));
};

module.exports.pointAlongArc = function (x1, y1, x2, y2, r, theta, ccw, t) {
  ccw = Math.abs(ccw) / ccw; // convert to 1 or -1

  var rot = Math.PI / 2 - Math.abs(theta) / 2;
  var vectToCenter = module.exports.normalizeVector(module.exports.rotateVector({
    x: x2 - x1,
    y: y2 - y1
  }, ccw * rot));

  // calculate the center of the arc circle
  var cx = x1 + r * vectToCenter.x;
  var cy = y1 + r * vectToCenter.y;

  var vectFromCenter = module.exports.negateVector(vectToCenter);
  rot = Math.abs(theta) * t * ccw;
  vectFromCenter = module.exports.normalizeVector(module.exports.rotateVector(vectFromCenter, rot));

  return {
    x: cx + r * vectFromCenter.x,
    y: cy + r * vectFromCenter.y
  };
};

module.exports.getVectorAngle = function (x, y) {
  var t = Math.atan(y / x);

  if (x < 0 && t <= 0) t += Math.PI;else if (x < 0 && t >= 0) t -= Math.PI;

  return t;
};

module.exports.rayIntersection = function (ax, ay, avx, avy, bx, by, bvx, bvy) {
  var u = ((by - ay) * bvx - (bx - ax) * bvy) / (bvx * avy - bvy * avx);
  var v = ((by - ay) * avx - (bx - ax) * avy) / (bvx * avy - bvy * avx);

  return {
    u: u,
    v: v,
    intersect: u > -tolerance && v > -tolerance
  };
};

module.exports.lineIntersection = function (x1, y1, x2, y2, x3, y3, x4, y4) {
  var d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (d === 0) {
    // lines are parallel
    return {
      intersect: false
    };
  }

  return {
    x: ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d,
    y: ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d,
    intersect: true
  };
};

/**
 * Parse a pixel-based style descriptor, returning an number.
 *
 * @param {String/Number}
 */

module.exports.parsePixelStyle = function (descriptor) {
  if (typeof descriptor === 'number') return descriptor;
  return parseFloat(descriptor.substring(0, descriptor.length - 2), 10);
};

module.exports.isOutwardVector = function (vector) {
  if (!module.exports.fuzzyEquals(vector.x, 0)) return vector.x > 0;
  return vector.y > 0;
};

module.exports.getTextBBox = function (text, attrs) {
  var container = d3.select('body').append('svg');
  container.append('text').attr({
    x: -1000,
    y: -1000
  }).attr(attrs).text(text);
  var bbox = container.node().getBBox();
  container.remove();

  return {
    height: bbox.height,
    width: bbox.width
  };
};

/**
 * Convert lat/lon coords to spherical mercator meter x/y coords
 */

module.exports.latLonToSphericalMercator = function (lat, lon) {
  var r = 6378137;
  var x = r * lon * Math.PI / 180;
  var y = r * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
  return [x, y];
};

/**
 * vector utilities
 */

module.exports.normalizeVector = function (v) {
  var d = Math.sqrt(v.x * v.x + v.y * v.y);
  return {
    x: v.x / d,
    y: v.y / d
  };
};

module.exports.rotateVector = function (v, theta) {
  return {
    x: v.x * Math.cos(theta) - v.y * Math.sin(theta),
    y: v.x * Math.sin(theta) + v.y * Math.cos(theta)
  };
};

module.exports.negateVector = function (v) {
  return {
    x: -v.x,
    y: -v.y
  };
};

module.exports.addVectors = function (v1, v2) {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y
  };
};

/**
 * GTFS utilities
 */

module.exports.otpModeToGtfsType = function (otpMode) {
  switch (otpMode) {
    case 'TRAM':
      return 0;
    case 'SUBWAY':
      return 1;
    case 'RAIL':
      return 2;
    case 'BUS':
      return 3;
    case 'FERRY':
      return 4;
    case 'CABLE_CAR':
      return 5;
    case 'GONDOLA':
      return 6;
    case 'FUNICULAR':
      return 7;
  }
};

},{"d3":88}],39:[function(require,module,exports){
'use strict';

/**
 * Line interpolation utility function
 *
 * @param {Array} points
 */

var Util = require('./index');

module.exports = function (points) {
  var newPoints, i, r;

  // determine if we need to resample the path (i.e. place new points at a regular
  // interval for marker-based styling) based on styler settings
  var resampleSpacing = this.display.styler.compute(this.display.styler.segments['marker-spacing'], this.display, this.segment);

  // handle the case of a simple straight line
  if (points.length === 2) {
    if (resampleSpacing) {
      newPoints = [points[0]];
      newPoints = newPoints.concat(resampleLine(points[0], points[1], resampleSpacing));
      return newPoints.join(' ');
    }
    return points.join(' ');
  }

  // otherwise, assume a curved segment

  if (resampleSpacing) {
    newPoints = [points[0]];
    for (i = 1; i < points.length; i++) {
      if (this.segment.renderData[i].arc) {
        // debug(this.renderData[i]);
        // var r = this.renderData[i].radius;
        // var sweep = (this.renderData[i].arc > 0) ? 0 : 1;
        // str += 'A ' + r + ',' + r + ' 0 0 ' + sweep + ' ' + points[i];
        r = this.segment.renderData[i].radius;
        var theta = this.segment.renderData[i].arc * Math.PI / 180;
        newPoints = newPoints.concat(resampleArc(points[i - 1], points[i], r, theta, -this.segment.renderData[i].arc, resampleSpacing));
      } else {
        newPoints = newPoints.concat(resampleLine(points[i - 1], points[i], resampleSpacing));
      }
    }
    return newPoints.join(' ');
  } else {
    var str = points[0];
    for (i = 1; i < points.length; i++) {
      if (this.segment.renderData[i].arc) {
        r = this.segment.renderData[i].radius;
        var sweep = this.segment.renderData[i].arc > 0 ? 0 : 1;
        str += 'A ' + r + ',' + r + ' 0 0 ' + sweep + ' ' + points[i];
      } else {
        str += 'L' + points[i];
      }
    }
    return str;
  }
};

function resampleLine(startPt, endPt, spacing) {
  var dx = endPt[0] - startPt[0];
  var dy = endPt[1] - startPt[1];
  var len = Math.sqrt(dx * dx + dy * dy);

  var sampledPts = [startPt];
  for (var l = spacing; l < len; l += spacing) {
    var t = l / len;
    sampledPts.push([startPt[0] + t * dx, startPt[1] + t * dy]);
  }

  sampledPts.push(endPt);

  return sampledPts;
}

function resampleArc(startPt, endPt, r, theta, ccw, spacing) {
  var len = r * Math.abs(theta);

  var sampledPts = [];
  for (var l = spacing; l < len; l += spacing) {
    var t = l / len;
    var pt = Util.pointAlongArc(startPt[0], startPt[1], endPt[0], endPt[1], r, Math.abs(theta), ccw, t);
    sampledPts.push([pt.x, pt.y]);
  }

  return sampledPts;
}

},{"./index":38}],40:[function(require,module,exports){
"use strict";

module.exports.decode = function (polyline) {
  var currentPosition = 0;

  var currentLat = 0;
  var currentLng = 0;

  var dataLength = polyline.length;

  var polylineLatLngs = [];

  while (currentPosition < dataLength) {
    var shift = 0;
    var result = 0;

    var byte;

    do {
      byte = polyline.charCodeAt(currentPosition++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    var deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    currentLat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = polyline.charCodeAt(currentPosition++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    var deltLng = result & 1 ? ~(result >> 1) : result >> 1;

    currentLng += deltLng;

    polylineLatLngs.push([currentLat * 0.00001, currentLng * 0.00001]);
  }
  return polylineLatLngs;
};

},{}],41:[function(require,module,exports){
'use strict';

var SphericalMercator = function () {
  // Closures including constants and other precalculated values.
  var cache = {};
  // var EPSLN = 1.0e-10
  var D2R = Math.PI / 180;
  var R2D = 180 / Math.PI;
  // 900913 properties.
  var A = 6378137;
  var MAXEXTENT = 20037508.34;

  // SphericalMercator constructor: precaches calculations
  // for fast tile lookups.
  function SphericalMercator(options) {
    options = options || {};
    this.size = options.size || 256;
    if (!cache[this.size]) {
      var size = this.size;
      var c = cache[this.size] = {};
      c.Bc = [];
      c.Cc = [];
      c.zc = [];
      c.Ac = [];
      for (var d = 0; d < 30; d++) {
        c.Bc.push(size / 360);
        c.Cc.push(size / (2 * Math.PI));
        c.zc.push(size / 2);
        c.Ac.push(size);
        size *= 2;
      }
    }
    this.Bc = cache[this.size].Bc;
    this.Cc = cache[this.size].Cc;
    this.zc = cache[this.size].zc;
    this.Ac = cache[this.size].Ac;
  }

  // Convert lon lat to screen pixel value
  //
  // - `ll` {Array} `[lon, lat]` array of geographic coordinates.
  // - `zoom` {Number} zoom level.
  SphericalMercator.prototype.px = function (ll, zoom) {
    var d = this.zc[zoom];
    var f = Math.min(Math.max(Math.sin(D2R * ll[1]), -0.9999), 0.9999);
    var x = Math.round(d + ll[0] * this.Bc[zoom]);
    var y = Math.round(d + 0.5 * Math.log((1 + f) / (1 - f)) * -this.Cc[zoom]);
    if (x > this.Ac[zoom]) x = this.Ac[zoom];
    if (y > this.Ac[zoom]) y = this.Ac[zoom];
    // (x < 0) && (x = 0);
    // (y < 0) && (y = 0);
    return [x, y];
  };

  // Convert screen pixel value to lon lat
  //
  // - `px` {Array} `[x, y]` array of geographic coordinates.
  // - `zoom` {Number} zoom level.
  SphericalMercator.prototype.ll = function (px, zoom) {
    var g = (px[1] - this.zc[zoom]) / -this.Cc[zoom];
    var lon = (px[0] - this.zc[zoom]) / this.Bc[zoom];
    var lat = R2D * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
    return [lon, lat];
  };

  // Convert tile xyz value to bbox of the form `[w, s, e, n]`
  //
  // - `x` {Number} x (longitude) number.
  // - `y` {Number} y (latitude) number.
  // - `zoom` {Number} zoom.
  // - `tms_style` {Boolean} whether to compute using tms-style.
  // - `srs` {String} projection for resulting bbox (WGS84|900913).
  // - `return` {Array} bbox array of values in form `[w, s, e, n]`.
  SphericalMercator.prototype.bbox = function (x, y, zoom, tmsStyle, srs) {
    // Convert xyz into bbox with srs WGS84
    if (tmsStyle) {
      y = Math.pow(2, zoom) - 1 - y;
    }
    // Use +y to make sure it's a number to avoid inadvertent concatenation.
    var ll = [x * this.size, (+y + 1) * this.size]; // lower left
    // Use +x to make sure it's a number to avoid inadvertent concatenation.
    var ur = [(+x + 1) * this.size, y * this.size]; // upper right
    var bbox = this.ll(ll, zoom).concat(this.ll(ur, zoom));

    // If web mercator requested reproject to 900913.
    if (srs === '900913') {
      return this.convert(bbox, '900913');
    } else {
      return bbox;
    }
  };

  // Convert bbox to xyx bounds
  //
  // - `bbox` {Number} bbox in the form `[w, s, e, n]`.
  // - `zoom` {Number} zoom.
  // - `tms_style` {Boolean} whether to compute using tms-style.
  // - `srs` {String} projection of input bbox (WGS84|900913).
  // - `@return` {Object} XYZ bounds containing minX, maxX, minY, maxY properties.
  SphericalMercator.prototype.xyz = function (bbox, zoom, tmsStyle, srs) {
    // If web mercator provided reproject to WGS84.
    if (srs === '900913') {
      bbox = this.convert(bbox, 'WGS84');
    }

    var ll = [bbox[0], bbox[1]]; // lower left
    var ur = [bbox[2], bbox[3]]; // upper right
    var pxll = this.px(ll, zoom);
    var pxur = this.px(ur, zoom);
    // Y = 0 for XYZ is the top hence minY uses px_ur[1].
    var bounds = {
      minX: Math.floor(pxll[0] / this.size),
      minY: Math.floor(pxur[1] / this.size),
      maxX: Math.floor((pxur[0] - 1) / this.size),
      maxY: Math.floor((pxll[1] - 1) / this.size)
    };
    if (tmsStyle) {
      var tms = {
        minY: Math.pow(2, zoom) - 1 - bounds.maxY,
        maxY: Math.pow(2, zoom) - 1 - bounds.minY
      };
      bounds.minY = tms.minY;
      bounds.maxY = tms.maxY;
    }
    return bounds;
  };

  // Convert projection of given bbox.
  //
  // - `bbox` {Number} bbox in the form `[w, s, e, n]`.
  // - `to` {String} projection of output bbox (WGS84|900913). Input bbox
  //   assumed to be the "other" projection.
  // - `@return` {Object} bbox with reprojected coordinates.
  SphericalMercator.prototype.convert = function (bbox, to) {
    if (to === '900913') {
      return this.forward(bbox.slice(0, 2)).concat(this.forward(bbox.slice(2, 4)));
    } else {
      return this.inverse(bbox.slice(0, 2)).concat(this.inverse(bbox.slice(2, 4)));
    }
  };

  // Convert lon/lat values to 900913 x/y.
  SphericalMercator.prototype.forward = function (ll) {
    var xy = [A * ll[0] * D2R, A * Math.log(Math.tan(Math.PI * 0.25 + 0.5 * ll[1] * D2R))];
    // if xy value is beyond maxextent (e.g. poles), return maxextent.
    if (xy[0] > MAXEXTENT) xy[0] = MAXEXTENT;
    if (xy[0] < -MAXEXTENT) xy[0] = -MAXEXTENT;
    if (xy[1] > MAXEXTENT) xy[1] = MAXEXTENT;
    if (xy[1] < -MAXEXTENT) xy[1] = -MAXEXTENT;
    return xy;
  };

  // Convert 900913 x/y values to lon/lat.
  SphericalMercator.prototype.inverse = function (xy) {
    return [xy[0] * R2D / A, (Math.PI * 0.5 - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D];
  };

  return SphericalMercator;
}();

if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
  module.exports = exports = SphericalMercator;
}

},{}],42:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) define(factory);
    else if (typeof module === "object") module.exports = factory();
    else global.augment = factory();
}(this, function () {
    "use strict";

    var Factory = function () {};
    var slice = Array.prototype.slice;

    var augment = function (base, body) {
        var uber = Factory.prototype = typeof base === "function" ? base.prototype : base;
        var prototype = new Factory, properties = body.apply(prototype, slice.call(arguments, 2).concat(uber));
        if (typeof properties === "object") for (var key in properties) prototype[key] = properties[key];
        if (!prototype.hasOwnProperty("constructor")) return prototype;
        var constructor = prototype.constructor;
        constructor.prototype = prototype;
        return constructor;
    };

    augment.defclass = function (prototype) {
        var constructor = prototype.constructor;
        constructor.prototype = prototype;
        return constructor;
    };

    augment.extend = function (base, body) {
        return augment(base, function (uber) {
            this.uber = uber;
            return body;
        });
    };

    return augment;
}));
},{}],43:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/assign"), __esModule: true };
},{"core-js/library/fn/object/assign":45}],44:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/keys"), __esModule: true };
},{"core-js/library/fn/object/keys":46}],45:[function(require,module,exports){
require('../../modules/es6.object.assign');
module.exports = require('../../modules/_core').Object.assign;
},{"../../modules/_core":51,"../../modules/es6.object.assign":82}],46:[function(require,module,exports){
require('../../modules/es6.object.keys');
module.exports = require('../../modules/_core').Object.keys;
},{"../../modules/_core":51,"../../modules/es6.object.keys":83}],47:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],48:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./_is-object":64}],49:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject')
  , toLength  = require('./_to-length')
  , toIndex   = require('./_to-index');
module.exports = function(IS_INCLUDES){
  return function($this, el, fromIndex){
    var O      = toIObject($this)
      , length = toLength(O.length)
      , index  = toIndex(fromIndex, length)
      , value;
    // Array#includes uses SameValueZero equality algorithm
    if(IS_INCLUDES && el != el)while(length > index){
      value = O[index++];
      if(value != value)return true;
    // Array#toIndex ignores holes, Array#includes - not
    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
      if(O[index] === el)return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};
},{"./_to-index":75,"./_to-iobject":77,"./_to-length":78}],50:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],51:[function(require,module,exports){
var core = module.exports = {version: '2.4.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],52:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./_a-function":47}],53:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],54:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_fails":58}],55:[function(require,module,exports){
var isObject = require('./_is-object')
  , document = require('./_global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./_global":59,"./_is-object":64}],56:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');
},{}],57:[function(require,module,exports){
var global    = require('./_global')
  , core      = require('./_core')
  , ctx       = require('./_ctx')
  , hide      = require('./_hide')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , IS_WRAP   = type & $export.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE]
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(a, b, c){
        if(this instanceof C){
          switch(arguments.length){
            case 0: return new C;
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if(IS_PROTO){
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if(type & $export.R && expProto && !expProto[key])hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library` 
module.exports = $export;
},{"./_core":51,"./_ctx":52,"./_global":59,"./_hide":61}],58:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],59:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],60:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],61:[function(require,module,exports){
var dP         = require('./_object-dp')
  , createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./_descriptors":54,"./_object-dp":66,"./_property-desc":72}],62:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function(){
  return Object.defineProperty(require('./_dom-create')('div'), 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_descriptors":54,"./_dom-create":55,"./_fails":58}],63:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./_cof":50}],64:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],65:[function(require,module,exports){
'use strict';
// 19.1.2.1 Object.assign(target, source, ...)
var getKeys  = require('./_object-keys')
  , gOPS     = require('./_object-gops')
  , pIE      = require('./_object-pie')
  , toObject = require('./_to-object')
  , IObject  = require('./_iobject')
  , $assign  = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || require('./_fails')(function(){
  var A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
  var T     = toObject(target)
    , aLen  = arguments.length
    , index = 1
    , getSymbols = gOPS.f
    , isEnum     = pIE.f;
  while(aLen > index){
    var S      = IObject(arguments[index++])
      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
  } return T;
} : $assign;
},{"./_fails":58,"./_iobject":63,"./_object-gops":67,"./_object-keys":69,"./_object-pie":70,"./_to-object":79}],66:[function(require,module,exports){
var anObject       = require('./_an-object')
  , IE8_DOM_DEFINE = require('./_ie8-dom-define')
  , toPrimitive    = require('./_to-primitive')
  , dP             = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes){
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if(IE8_DOM_DEFINE)try {
    return dP(O, P, Attributes);
  } catch(e){ /* empty */ }
  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
  if('value' in Attributes)O[P] = Attributes.value;
  return O;
};
},{"./_an-object":48,"./_descriptors":54,"./_ie8-dom-define":62,"./_to-primitive":80}],67:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;
},{}],68:[function(require,module,exports){
var has          = require('./_has')
  , toIObject    = require('./_to-iobject')
  , arrayIndexOf = require('./_array-includes')(false)
  , IE_PROTO     = require('./_shared-key')('IE_PROTO');

module.exports = function(object, names){
  var O      = toIObject(object)
    , i      = 0
    , result = []
    , key;
  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while(names.length > i)if(has(O, key = names[i++])){
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};
},{"./_array-includes":49,"./_has":60,"./_shared-key":73,"./_to-iobject":77}],69:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys       = require('./_object-keys-internal')
  , enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O){
  return $keys(O, enumBugKeys);
};
},{"./_enum-bug-keys":56,"./_object-keys-internal":68}],70:[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;
},{}],71:[function(require,module,exports){
// most Object methods by ES6 should accept primitives
var $export = require('./_export')
  , core    = require('./_core')
  , fails   = require('./_fails');
module.exports = function(KEY, exec){
  var fn  = (core.Object || {})[KEY] || Object[KEY]
    , exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function(){ fn(1); }), 'Object', exp);
};
},{"./_core":51,"./_export":57,"./_fails":58}],72:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],73:[function(require,module,exports){
var shared = require('./_shared')('keys')
  , uid    = require('./_uid');
module.exports = function(key){
  return shared[key] || (shared[key] = uid(key));
};
},{"./_shared":74,"./_uid":81}],74:[function(require,module,exports){
var global = require('./_global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./_global":59}],75:[function(require,module,exports){
var toInteger = require('./_to-integer')
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};
},{"./_to-integer":76}],76:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],77:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject')
  , defined = require('./_defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./_defined":53,"./_iobject":63}],78:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./_to-integer":76}],79:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./_defined":53}],80:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function(it, S){
  if(!isObject(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};
},{"./_is-object":64}],81:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],82:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./_export');

$export($export.S + $export.F, 'Object', {assign: require('./_object-assign')});
},{"./_export":57,"./_object-assign":65}],83:[function(require,module,exports){
// 19.1.2.14 Object.keys(O)
var toObject = require('./_to-object')
  , $keys    = require('./_object-keys');

require('./_object-sap')('keys', function(){
  return function keys(it){
    return $keys(toObject(it));
  };
});
},{"./_object-keys":69,"./_object-sap":71,"./_to-object":79}],84:[function(require,module,exports){

/**
 * Module dependencies.
 */

try {
  var type = require('type');
} catch (err) {
  var type = require('component-type');
}

var toFunction = require('to-function');

/**
 * HOP reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Iterate the given `obj` and invoke `fn(val, i)`
 * in optional context `ctx`.
 *
 * @param {String|Array|Object} obj
 * @param {Function} fn
 * @param {Object} [ctx]
 * @api public
 */

module.exports = function(obj, fn, ctx){
  fn = toFunction(fn);
  ctx = ctx || this;
  switch (type(obj)) {
    case 'array':
      return array(obj, fn, ctx);
    case 'object':
      if ('number' == typeof obj.length) return array(obj, fn, ctx);
      return object(obj, fn, ctx);
    case 'string':
      return string(obj, fn, ctx);
  }
};

/**
 * Iterate string chars.
 *
 * @param {String} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function string(obj, fn, ctx) {
  for (var i = 0; i < obj.length; ++i) {
    fn.call(ctx, obj.charAt(i), i);
  }
}

/**
 * Iterate object keys.
 *
 * @param {Object} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function object(obj, fn, ctx) {
  for (var key in obj) {
    if (has.call(obj, key)) {
      fn.call(ctx, key, obj[key]);
    }
  }
}

/**
 * Iterate array-ish.
 *
 * @param {Array|Object} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function array(obj, fn, ctx) {
  for (var i = 0; i < obj.length; ++i) {
    fn.call(ctx, obj[i], i);
  }
}

},{"component-type":87,"to-function":93,"type":87}],85:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],86:[function(require,module,exports){
/**
 * Global Names
 */

var globals = /\b(Array|Date|Object|Math|JSON)\b/g;

/**
 * Return immediate identifiers parsed from `str`.
 *
 * @param {String} str
 * @param {String|Function} map function or prefix
 * @return {Array}
 * @api public
 */

module.exports = function(str, fn){
  var p = unique(props(str));
  if (fn && 'string' == typeof fn) fn = prefixed(fn);
  if (fn) return map(str, p, fn);
  return p;
};

/**
 * Return immediate identifiers in `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

function props(str) {
  return str
    .replace(/\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, '')
    .replace(globals, '')
    .match(/[a-zA-Z_]\w*/g)
    || [];
}

/**
 * Return `str` with `props` mapped with `fn`.
 *
 * @param {String} str
 * @param {Array} props
 * @param {Function} fn
 * @return {String}
 * @api private
 */

function map(str, props, fn) {
  var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
  return str.replace(re, function(_){
    if ('(' == _[_.length - 1]) return fn(_);
    if (!~props.indexOf(_)) return _;
    return fn(_);
  });
}

/**
 * Return unique array.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function unique(arr) {
  var ret = [];

  for (var i = 0; i < arr.length; i++) {
    if (~ret.indexOf(arr[i])) continue;
    ret.push(arr[i]);
  }

  return ret;
}

/**
 * Map with prefix `str`.
 */

function prefixed(str) {
  return function(_){
    return str + _;
  };
}

},{}],87:[function(require,module,exports){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

},{}],88:[function(require,module,exports){
!function() {
  var d3 = {
    version: "3.5.17"
  };
  var d3_arraySlice = [].slice, d3_array = function(list) {
    return d3_arraySlice.call(list);
  };
  var d3_document = this.document;
  function d3_documentElement(node) {
    return node && (node.ownerDocument || node.document || node).documentElement;
  }
  function d3_window(node) {
    return node && (node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView);
  }
  if (d3_document) {
    try {
      d3_array(d3_document.documentElement.childNodes)[0].nodeType;
    } catch (e) {
      d3_array = function(list) {
        var i = list.length, array = new Array(i);
        while (i--) array[i] = list[i];
        return array;
      };
    }
  }
  if (!Date.now) Date.now = function() {
    return +new Date();
  };
  if (d3_document) {
    try {
      d3_document.createElement("DIV").style.setProperty("opacity", 0, "");
    } catch (error) {
      var d3_element_prototype = this.Element.prototype, d3_element_setAttribute = d3_element_prototype.setAttribute, d3_element_setAttributeNS = d3_element_prototype.setAttributeNS, d3_style_prototype = this.CSSStyleDeclaration.prototype, d3_style_setProperty = d3_style_prototype.setProperty;
      d3_element_prototype.setAttribute = function(name, value) {
        d3_element_setAttribute.call(this, name, value + "");
      };
      d3_element_prototype.setAttributeNS = function(space, local, value) {
        d3_element_setAttributeNS.call(this, space, local, value + "");
      };
      d3_style_prototype.setProperty = function(name, value, priority) {
        d3_style_setProperty.call(this, name, value + "", priority);
      };
    }
  }
  d3.ascending = d3_ascending;
  function d3_ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }
  d3.descending = function(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  };
  d3.min = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
    }
    return a;
  };
  d3.max = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
    }
    return a;
  };
  d3.extent = function(array, f) {
    var i = -1, n = array.length, a, b, c;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = c = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = c = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
    return [ a, c ];
  };
  function d3_number(x) {
    return x === null ? NaN : +x;
  }
  function d3_numeric(x) {
    return !isNaN(x);
  }
  d3.sum = function(array, f) {
    var s = 0, n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = +array[i])) s += a;
    } else {
      while (++i < n) if (d3_numeric(a = +f.call(array, array[i], i))) s += a;
    }
    return s;
  };
  d3.mean = function(array, f) {
    var s = 0, n = array.length, a, i = -1, j = n;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = d3_number(array[i]))) s += a; else --j;
    } else {
      while (++i < n) if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) s += a; else --j;
    }
    if (j) return s / j;
  };
  d3.quantile = function(values, p) {
    var H = (values.length - 1) * p + 1, h = Math.floor(H), v = +values[h - 1], e = H - h;
    return e ? v + e * (values[h] - v) : v;
  };
  d3.median = function(array, f) {
    var numbers = [], n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = d3_number(array[i]))) numbers.push(a);
    } else {
      while (++i < n) if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) numbers.push(a);
    }
    if (numbers.length) return d3.quantile(numbers.sort(d3_ascending), .5);
  };
  d3.variance = function(array, f) {
    var n = array.length, m = 0, a, d, s = 0, i = -1, j = 0;
    if (arguments.length === 1) {
      while (++i < n) {
        if (d3_numeric(a = d3_number(array[i]))) {
          d = a - m;
          m += d / ++j;
          s += d * (a - m);
        }
      }
    } else {
      while (++i < n) {
        if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) {
          d = a - m;
          m += d / ++j;
          s += d * (a - m);
        }
      }
    }
    if (j > 1) return s / (j - 1);
  };
  d3.deviation = function() {
    var v = d3.variance.apply(this, arguments);
    return v ? Math.sqrt(v) : v;
  };
  function d3_bisector(compare) {
    return {
      left: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1; else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid; else lo = mid + 1;
        }
        return lo;
      }
    };
  }
  var d3_bisect = d3_bisector(d3_ascending);
  d3.bisectLeft = d3_bisect.left;
  d3.bisect = d3.bisectRight = d3_bisect.right;
  d3.bisector = function(f) {
    return d3_bisector(f.length === 1 ? function(d, x) {
      return d3_ascending(f(d), x);
    } : f);
  };
  d3.shuffle = function(array, i0, i1) {
    if ((m = arguments.length) < 3) {
      i1 = array.length;
      if (m < 2) i0 = 0;
    }
    var m = i1 - i0, t, i;
    while (m) {
      i = Math.random() * m-- | 0;
      t = array[m + i0], array[m + i0] = array[i + i0], array[i + i0] = t;
    }
    return array;
  };
  d3.permute = function(array, indexes) {
    var i = indexes.length, permutes = new Array(i);
    while (i--) permutes[i] = array[indexes[i]];
    return permutes;
  };
  d3.pairs = function(array) {
    var i = 0, n = array.length - 1, p0, p1 = array[0], pairs = new Array(n < 0 ? 0 : n);
    while (i < n) pairs[i] = [ p0 = p1, p1 = array[++i] ];
    return pairs;
  };
  d3.transpose = function(matrix) {
    if (!(n = matrix.length)) return [];
    for (var i = -1, m = d3.min(matrix, d3_transposeLength), transpose = new Array(m); ++i < m; ) {
      for (var j = -1, n, row = transpose[i] = new Array(n); ++j < n; ) {
        row[j] = matrix[j][i];
      }
    }
    return transpose;
  };
  function d3_transposeLength(d) {
    return d.length;
  }
  d3.zip = function() {
    return d3.transpose(arguments);
  };
  d3.keys = function(map) {
    var keys = [];
    for (var key in map) keys.push(key);
    return keys;
  };
  d3.values = function(map) {
    var values = [];
    for (var key in map) values.push(map[key]);
    return values;
  };
  d3.entries = function(map) {
    var entries = [];
    for (var key in map) entries.push({
      key: key,
      value: map[key]
    });
    return entries;
  };
  d3.merge = function(arrays) {
    var n = arrays.length, m, i = -1, j = 0, merged, array;
    while (++i < n) j += arrays[i].length;
    merged = new Array(j);
    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }
    return merged;
  };
  var abs = Math.abs;
  d3.range = function(start, stop, step) {
    if (arguments.length < 3) {
      step = 1;
      if (arguments.length < 2) {
        stop = start;
        start = 0;
      }
    }
    if ((stop - start) / step === Infinity) throw new Error("infinite range");
    var range = [], k = d3_range_integerScale(abs(step)), i = -1, j;
    start *= k, stop *= k, step *= k;
    if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k); else while ((j = start + step * ++i) < stop) range.push(j / k);
    return range;
  };
  function d3_range_integerScale(x) {
    var k = 1;
    while (x * k % 1) k *= 10;
    return k;
  }
  function d3_class(ctor, properties) {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  }
  d3.map = function(object, f) {
    var map = new d3_Map();
    if (object instanceof d3_Map) {
      object.forEach(function(key, value) {
        map.set(key, value);
      });
    } else if (Array.isArray(object)) {
      var i = -1, n = object.length, o;
      if (arguments.length === 1) while (++i < n) map.set(i, object[i]); else while (++i < n) map.set(f.call(object, o = object[i], i), o);
    } else {
      for (var key in object) map.set(key, object[key]);
    }
    return map;
  };
  function d3_Map() {
    this._ = Object.create(null);
  }
  var d3_map_proto = "__proto__", d3_map_zero = "\x00";
  d3_class(d3_Map, {
    has: d3_map_has,
    get: function(key) {
      return this._[d3_map_escape(key)];
    },
    set: function(key, value) {
      return this._[d3_map_escape(key)] = value;
    },
    remove: d3_map_remove,
    keys: d3_map_keys,
    values: function() {
      var values = [];
      for (var key in this._) values.push(this._[key]);
      return values;
    },
    entries: function() {
      var entries = [];
      for (var key in this._) entries.push({
        key: d3_map_unescape(key),
        value: this._[key]
      });
      return entries;
    },
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this._) f.call(this, d3_map_unescape(key), this._[key]);
    }
  });
  function d3_map_escape(key) {
    return (key += "") === d3_map_proto || key[0] === d3_map_zero ? d3_map_zero + key : key;
  }
  function d3_map_unescape(key) {
    return (key += "")[0] === d3_map_zero ? key.slice(1) : key;
  }
  function d3_map_has(key) {
    return d3_map_escape(key) in this._;
  }
  function d3_map_remove(key) {
    return (key = d3_map_escape(key)) in this._ && delete this._[key];
  }
  function d3_map_keys() {
    var keys = [];
    for (var key in this._) keys.push(d3_map_unescape(key));
    return keys;
  }
  function d3_map_size() {
    var size = 0;
    for (var key in this._) ++size;
    return size;
  }
  function d3_map_empty() {
    for (var key in this._) return false;
    return true;
  }
  d3.nest = function() {
    var nest = {}, keys = [], sortKeys = [], sortValues, rollup;
    function map(mapType, array, depth) {
      if (depth >= keys.length) return rollup ? rollup.call(nest, array) : sortValues ? array.sort(sortValues) : array;
      var i = -1, n = array.length, key = keys[depth++], keyValue, object, setter, valuesByKey = new d3_Map(), values;
      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(object = array[i]))) {
          values.push(object);
        } else {
          valuesByKey.set(keyValue, [ object ]);
        }
      }
      if (mapType) {
        object = mapType();
        setter = function(keyValue, values) {
          object.set(keyValue, map(mapType, values, depth));
        };
      } else {
        object = {};
        setter = function(keyValue, values) {
          object[keyValue] = map(mapType, values, depth);
        };
      }
      valuesByKey.forEach(setter);
      return object;
    }
    function entries(map, depth) {
      if (depth >= keys.length) return map;
      var array = [], sortKey = sortKeys[depth++];
      map.forEach(function(key, keyMap) {
        array.push({
          key: key,
          values: entries(keyMap, depth)
        });
      });
      return sortKey ? array.sort(function(a, b) {
        return sortKey(a.key, b.key);
      }) : array;
    }
    nest.map = function(array, mapType) {
      return map(mapType, array, 0);
    };
    nest.entries = function(array) {
      return entries(map(d3.map, array, 0), 0);
    };
    nest.key = function(d) {
      keys.push(d);
      return nest;
    };
    nest.sortKeys = function(order) {
      sortKeys[keys.length - 1] = order;
      return nest;
    };
    nest.sortValues = function(order) {
      sortValues = order;
      return nest;
    };
    nest.rollup = function(f) {
      rollup = f;
      return nest;
    };
    return nest;
  };
  d3.set = function(array) {
    var set = new d3_Set();
    if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);
    return set;
  };
  function d3_Set() {
    this._ = Object.create(null);
  }
  d3_class(d3_Set, {
    has: d3_map_has,
    add: function(key) {
      this._[d3_map_escape(key += "")] = true;
      return key;
    },
    remove: d3_map_remove,
    values: d3_map_keys,
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this._) f.call(this, d3_map_unescape(key));
    }
  });
  d3.behavior = {};
  function d3_identity(d) {
    return d;
  }
  d3.rebind = function(target, source) {
    var i = 1, n = arguments.length, method;
    while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
    return target;
  };
  function d3_rebind(target, source, method) {
    return function() {
      var value = method.apply(source, arguments);
      return value === source ? target : value;
    };
  }
  function d3_vendorSymbol(object, name) {
    if (name in object) return name;
    name = name.charAt(0).toUpperCase() + name.slice(1);
    for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
      var prefixName = d3_vendorPrefixes[i] + name;
      if (prefixName in object) return prefixName;
    }
  }
  var d3_vendorPrefixes = [ "webkit", "ms", "moz", "Moz", "o", "O" ];
  function d3_noop() {}
  d3.dispatch = function() {
    var dispatch = new d3_dispatch(), i = -1, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    return dispatch;
  };
  function d3_dispatch() {}
  d3_dispatch.prototype.on = function(type, listener) {
    var i = type.indexOf("."), name = "";
    if (i >= 0) {
      name = type.slice(i + 1);
      type = type.slice(0, i);
    }
    if (type) return arguments.length < 2 ? this[type].on(name) : this[type].on(name, listener);
    if (arguments.length === 2) {
      if (listener == null) for (type in this) {
        if (this.hasOwnProperty(type)) this[type].on(name, null);
      }
      return this;
    }
  };
  function d3_dispatch_event(dispatch) {
    var listeners = [], listenerByName = new d3_Map();
    function event() {
      var z = listeners, i = -1, n = z.length, l;
      while (++i < n) if (l = z[i].on) l.apply(this, arguments);
      return dispatch;
    }
    event.on = function(name, listener) {
      var l = listenerByName.get(name), i;
      if (arguments.length < 2) return l && l.on;
      if (l) {
        l.on = null;
        listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
        listenerByName.remove(name);
      }
      if (listener) listeners.push(listenerByName.set(name, {
        on: listener
      }));
      return dispatch;
    };
    return event;
  }
  d3.event = null;
  function d3_eventPreventDefault() {
    d3.event.preventDefault();
  }
  function d3_eventSource() {
    var e = d3.event, s;
    while (s = e.sourceEvent) e = s;
    return e;
  }
  function d3_eventDispatch(target) {
    var dispatch = new d3_dispatch(), i = 0, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    dispatch.of = function(thiz, argumentz) {
      return function(e1) {
        try {
          var e0 = e1.sourceEvent = d3.event;
          e1.target = target;
          d3.event = e1;
          dispatch[e1.type].apply(thiz, argumentz);
        } finally {
          d3.event = e0;
        }
      };
    };
    return dispatch;
  }
  d3.requote = function(s) {
    return s.replace(d3_requote_re, "\\$&");
  };
  var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  var d3_subclass = {}.__proto__ ? function(object, prototype) {
    object.__proto__ = prototype;
  } : function(object, prototype) {
    for (var property in prototype) object[property] = prototype[property];
  };
  function d3_selection(groups) {
    d3_subclass(groups, d3_selectionPrototype);
    return groups;
  }
  var d3_select = function(s, n) {
    return n.querySelector(s);
  }, d3_selectAll = function(s, n) {
    return n.querySelectorAll(s);
  }, d3_selectMatches = function(n, s) {
    var d3_selectMatcher = n.matches || n[d3_vendorSymbol(n, "matchesSelector")];
    d3_selectMatches = function(n, s) {
      return d3_selectMatcher.call(n, s);
    };
    return d3_selectMatches(n, s);
  };
  if (typeof Sizzle === "function") {
    d3_select = function(s, n) {
      return Sizzle(s, n)[0] || null;
    };
    d3_selectAll = Sizzle;
    d3_selectMatches = Sizzle.matchesSelector;
  }
  d3.selection = function() {
    return d3.select(d3_document.documentElement);
  };
  var d3_selectionPrototype = d3.selection.prototype = [];
  d3_selectionPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, group, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(subnode = selector.call(node, node.__data__, i, j));
          if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selector(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_select(selector, this);
    };
  }
  d3_selectionPrototype.selectAll = function(selector) {
    var subgroups = [], subgroup, node;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
          subgroup.parentNode = node;
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selectorAll(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_selectAll(selector, this);
    };
  }
  var d3_nsXhtml = "http://www.w3.org/1999/xhtml";
  var d3_nsPrefix = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: d3_nsXhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };
  d3.ns = {
    prefix: d3_nsPrefix,
    qualify: function(name) {
      var i = name.indexOf(":"), prefix = name;
      if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
      return d3_nsPrefix.hasOwnProperty(prefix) ? {
        space: d3_nsPrefix[prefix],
        local: name
      } : name;
    }
  };
  d3_selectionPrototype.attr = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node();
        name = d3.ns.qualify(name);
        return name.local ? node.getAttributeNS(name.space, name.local) : node.getAttribute(name);
      }
      for (value in name) this.each(d3_selection_attr(value, name[value]));
      return this;
    }
    return this.each(d3_selection_attr(name, value));
  };
  function d3_selection_attr(name, value) {
    name = d3.ns.qualify(name);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrConstant() {
      this.setAttribute(name, value);
    }
    function attrConstantNS() {
      this.setAttributeNS(name.space, name.local, value);
    }
    function attrFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttribute(name); else this.setAttribute(name, x);
    }
    function attrFunctionNS() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttributeNS(name.space, name.local); else this.setAttributeNS(name.space, name.local, x);
    }
    return value == null ? name.local ? attrNullNS : attrNull : typeof value === "function" ? name.local ? attrFunctionNS : attrFunction : name.local ? attrConstantNS : attrConstant;
  }
  function d3_collapse(s) {
    return s.trim().replace(/\s+/g, " ");
  }
  d3_selectionPrototype.classed = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node(), n = (name = d3_selection_classes(name)).length, i = -1;
        if (value = node.classList) {
          while (++i < n) if (!value.contains(name[i])) return false;
        } else {
          value = node.getAttribute("class");
          while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
        }
        return true;
      }
      for (value in name) this.each(d3_selection_classed(value, name[value]));
      return this;
    }
    return this.each(d3_selection_classed(name, value));
  };
  function d3_selection_classedRe(name) {
    return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
  }
  function d3_selection_classes(name) {
    return (name + "").trim().split(/^|\s+/);
  }
  function d3_selection_classed(name, value) {
    name = d3_selection_classes(name).map(d3_selection_classedName);
    var n = name.length;
    function classedConstant() {
      var i = -1;
      while (++i < n) name[i](this, value);
    }
    function classedFunction() {
      var i = -1, x = value.apply(this, arguments);
      while (++i < n) name[i](this, x);
    }
    return typeof value === "function" ? classedFunction : classedConstant;
  }
  function d3_selection_classedName(name) {
    var re = d3_selection_classedRe(name);
    return function(node, value) {
      if (c = node.classList) return value ? c.add(name) : c.remove(name);
      var c = node.getAttribute("class") || "";
      if (value) {
        re.lastIndex = 0;
        if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
      } else {
        node.setAttribute("class", d3_collapse(c.replace(re, " ")));
      }
    };
  }
  d3_selectionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
        return this;
      }
      if (n < 2) {
        var node = this.node();
        return d3_window(node).getComputedStyle(node, null).getPropertyValue(name);
      }
      priority = "";
    }
    return this.each(d3_selection_style(name, value, priority));
  };
  function d3_selection_style(name, value, priority) {
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleConstant() {
      this.style.setProperty(name, value, priority);
    }
    function styleFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.style.removeProperty(name); else this.style.setProperty(name, x, priority);
    }
    return value == null ? styleNull : typeof value === "function" ? styleFunction : styleConstant;
  }
  d3_selectionPrototype.property = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") return this.node()[name];
      for (value in name) this.each(d3_selection_property(value, name[value]));
      return this;
    }
    return this.each(d3_selection_property(name, value));
  };
  function d3_selection_property(name, value) {
    function propertyNull() {
      delete this[name];
    }
    function propertyConstant() {
      this[name] = value;
    }
    function propertyFunction() {
      var x = value.apply(this, arguments);
      if (x == null) delete this[name]; else this[name] = x;
    }
    return value == null ? propertyNull : typeof value === "function" ? propertyFunction : propertyConstant;
  }
  d3_selectionPrototype.text = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    } : value == null ? function() {
      this.textContent = "";
    } : function() {
      this.textContent = value;
    }) : this.node().textContent;
  };
  d3_selectionPrototype.html = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    } : value == null ? function() {
      this.innerHTML = "";
    } : function() {
      this.innerHTML = value;
    }) : this.node().innerHTML;
  };
  d3_selectionPrototype.append = function(name) {
    name = d3_selection_creator(name);
    return this.select(function() {
      return this.appendChild(name.apply(this, arguments));
    });
  };
  function d3_selection_creator(name) {
    function create() {
      var document = this.ownerDocument, namespace = this.namespaceURI;
      return namespace === d3_nsXhtml && document.documentElement.namespaceURI === d3_nsXhtml ? document.createElement(name) : document.createElementNS(namespace, name);
    }
    function createNS() {
      return this.ownerDocument.createElementNS(name.space, name.local);
    }
    return typeof name === "function" ? name : (name = d3.ns.qualify(name)).local ? createNS : create;
  }
  d3_selectionPrototype.insert = function(name, before) {
    name = d3_selection_creator(name);
    before = d3_selection_selector(before);
    return this.select(function() {
      return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);
    });
  };
  d3_selectionPrototype.remove = function() {
    return this.each(d3_selectionRemove);
  };
  function d3_selectionRemove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }
  d3_selectionPrototype.data = function(value, key) {
    var i = -1, n = this.length, group, node;
    if (!arguments.length) {
      value = new Array(n = (group = this[0]).length);
      while (++i < n) {
        if (node = group[i]) {
          value[i] = node.__data__;
        }
      }
      return value;
    }
    function bind(group, groupData) {
      var i, n = group.length, m = groupData.length, n0 = Math.min(n, m), updateNodes = new Array(m), enterNodes = new Array(m), exitNodes = new Array(n), node, nodeData;
      if (key) {
        var nodeByKeyValue = new d3_Map(), keyValues = new Array(n), keyValue;
        for (i = -1; ++i < n; ) {
          if (node = group[i]) {
            if (nodeByKeyValue.has(keyValue = key.call(node, node.__data__, i))) {
              exitNodes[i] = node;
            } else {
              nodeByKeyValue.set(keyValue, node);
            }
            keyValues[i] = keyValue;
          }
        }
        for (i = -1; ++i < m; ) {
          if (!(node = nodeByKeyValue.get(keyValue = key.call(groupData, nodeData = groupData[i], i)))) {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          } else if (node !== true) {
            updateNodes[i] = node;
            node.__data__ = nodeData;
          }
          nodeByKeyValue.set(keyValue, true);
        }
        for (i = -1; ++i < n; ) {
          if (i in keyValues && nodeByKeyValue.get(keyValues[i]) !== true) {
            exitNodes[i] = group[i];
          }
        }
      } else {
        for (i = -1; ++i < n0; ) {
          node = group[i];
          nodeData = groupData[i];
          if (node) {
            node.__data__ = nodeData;
            updateNodes[i] = node;
          } else {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          }
        }
        for (;i < m; ++i) {
          enterNodes[i] = d3_selection_dataNode(groupData[i]);
        }
        for (;i < n; ++i) {
          exitNodes[i] = group[i];
        }
      }
      enterNodes.update = updateNodes;
      enterNodes.parentNode = updateNodes.parentNode = exitNodes.parentNode = group.parentNode;
      enter.push(enterNodes);
      update.push(updateNodes);
      exit.push(exitNodes);
    }
    var enter = d3_selection_enter([]), update = d3_selection([]), exit = d3_selection([]);
    if (typeof value === "function") {
      while (++i < n) {
        bind(group = this[i], value.call(group, group.parentNode.__data__, i));
      }
    } else {
      while (++i < n) {
        bind(group = this[i], value);
      }
    }
    update.enter = function() {
      return enter;
    };
    update.exit = function() {
      return exit;
    };
    return update;
  };
  function d3_selection_dataNode(data) {
    return {
      __data__: data
    };
  }
  d3_selectionPrototype.datum = function(value) {
    return arguments.length ? this.property("__data__", value) : this.property("__data__");
  };
  d3_selectionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_filter(selector) {
    return function() {
      return d3_selectMatches(this, selector);
    };
  }
  d3_selectionPrototype.order = function() {
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
        if (node = group[i]) {
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }
    return this;
  };
  d3_selectionPrototype.sort = function(comparator) {
    comparator = d3_selection_sortComparator.apply(this, arguments);
    for (var j = -1, m = this.length; ++j < m; ) this[j].sort(comparator);
    return this.order();
  };
  function d3_selection_sortComparator(comparator) {
    if (!arguments.length) comparator = d3_ascending;
    return function(a, b) {
      return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
    };
  }
  d3_selectionPrototype.each = function(callback) {
    return d3_selection_each(this, function(node, i, j) {
      callback.call(node, node.__data__, i, j);
    });
  };
  function d3_selection_each(groups, callback) {
    for (var j = 0, m = groups.length; j < m; j++) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
        if (node = group[i]) callback(node, i, j);
      }
    }
    return groups;
  }
  d3_selectionPrototype.call = function(callback) {
    var args = d3_array(arguments);
    callback.apply(args[0] = this, args);
    return this;
  };
  d3_selectionPrototype.empty = function() {
    return !this.node();
  };
  d3_selectionPrototype.node = function() {
    for (var j = 0, m = this.length; j < m; j++) {
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        var node = group[i];
        if (node) return node;
      }
    }
    return null;
  };
  d3_selectionPrototype.size = function() {
    var n = 0;
    d3_selection_each(this, function() {
      ++n;
    });
    return n;
  };
  function d3_selection_enter(selection) {
    d3_subclass(selection, d3_selection_enterPrototype);
    return selection;
  }
  var d3_selection_enterPrototype = [];
  d3.selection.enter = d3_selection_enter;
  d3.selection.enter.prototype = d3_selection_enterPrototype;
  d3_selection_enterPrototype.append = d3_selectionPrototype.append;
  d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
  d3_selection_enterPrototype.node = d3_selectionPrototype.node;
  d3_selection_enterPrototype.call = d3_selectionPrototype.call;
  d3_selection_enterPrototype.size = d3_selectionPrototype.size;
  d3_selection_enterPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, upgroup, group, node;
    for (var j = -1, m = this.length; ++j < m; ) {
      upgroup = (group = this[j]).update;
      subgroups.push(subgroup = []);
      subgroup.parentNode = group.parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
          subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  d3_selection_enterPrototype.insert = function(name, before) {
    if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
    return d3_selectionPrototype.insert.call(this, name, before);
  };
  function d3_selection_enterInsertBefore(enter) {
    var i0, j0;
    return function(d, i, j) {
      var group = enter[j].update, n = group.length, node;
      if (j != j0) j0 = j, i0 = 0;
      if (i >= i0) i0 = i + 1;
      while (!(node = group[i0]) && ++i0 < n) ;
      return node;
    };
  }
  d3.select = function(node) {
    var group;
    if (typeof node === "string") {
      group = [ d3_select(node, d3_document) ];
      group.parentNode = d3_document.documentElement;
    } else {
      group = [ node ];
      group.parentNode = d3_documentElement(node);
    }
    return d3_selection([ group ]);
  };
  d3.selectAll = function(nodes) {
    var group;
    if (typeof nodes === "string") {
      group = d3_array(d3_selectAll(nodes, d3_document));
      group.parentNode = d3_document.documentElement;
    } else {
      group = d3_array(nodes);
      group.parentNode = null;
    }
    return d3_selection([ group ]);
  };
  d3_selectionPrototype.on = function(type, listener, capture) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof type !== "string") {
        if (n < 2) listener = false;
        for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
        return this;
      }
      if (n < 2) return (n = this.node()["__on" + type]) && n._;
      capture = false;
    }
    return this.each(d3_selection_on(type, listener, capture));
  };
  function d3_selection_on(type, listener, capture) {
    var name = "__on" + type, i = type.indexOf("."), wrap = d3_selection_onListener;
    if (i > 0) type = type.slice(0, i);
    var filter = d3_selection_onFilters.get(type);
    if (filter) type = filter, wrap = d3_selection_onFilter;
    function onRemove() {
      var l = this[name];
      if (l) {
        this.removeEventListener(type, l, l.$);
        delete this[name];
      }
    }
    function onAdd() {
      var l = wrap(listener, d3_array(arguments));
      onRemove.call(this);
      this.addEventListener(type, this[name] = l, l.$ = capture);
      l._ = listener;
    }
    function removeAll() {
      var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"), match;
      for (var name in this) {
        if (match = name.match(re)) {
          var l = this[name];
          this.removeEventListener(match[1], l, l.$);
          delete this[name];
        }
      }
    }
    return i ? listener ? onAdd : onRemove : listener ? d3_noop : removeAll;
  }
  var d3_selection_onFilters = d3.map({
    mouseenter: "mouseover",
    mouseleave: "mouseout"
  });
  if (d3_document) {
    d3_selection_onFilters.forEach(function(k) {
      if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
    });
  }
  function d3_selection_onListener(listener, argumentz) {
    return function(e) {
      var o = d3.event;
      d3.event = e;
      argumentz[0] = this.__data__;
      try {
        listener.apply(this, argumentz);
      } finally {
        d3.event = o;
      }
    };
  }
  function d3_selection_onFilter(listener, argumentz) {
    var l = d3_selection_onListener(listener, argumentz);
    return function(e) {
      var target = this, related = e.relatedTarget;
      if (!related || related !== target && !(related.compareDocumentPosition(target) & 8)) {
        l.call(target, e);
      }
    };
  }
  var d3_event_dragSelect, d3_event_dragId = 0;
  function d3_event_dragSuppress(node) {
    var name = ".dragsuppress-" + ++d3_event_dragId, click = "click" + name, w = d3.select(d3_window(node)).on("touchmove" + name, d3_eventPreventDefault).on("dragstart" + name, d3_eventPreventDefault).on("selectstart" + name, d3_eventPreventDefault);
    if (d3_event_dragSelect == null) {
      d3_event_dragSelect = "onselectstart" in node ? false : d3_vendorSymbol(node.style, "userSelect");
    }
    if (d3_event_dragSelect) {
      var style = d3_documentElement(node).style, select = style[d3_event_dragSelect];
      style[d3_event_dragSelect] = "none";
    }
    return function(suppressClick) {
      w.on(name, null);
      if (d3_event_dragSelect) style[d3_event_dragSelect] = select;
      if (suppressClick) {
        var off = function() {
          w.on(click, null);
        };
        w.on(click, function() {
          d3_eventPreventDefault();
          off();
        }, true);
        setTimeout(off, 0);
      }
    };
  }
  d3.mouse = function(container) {
    return d3_mousePoint(container, d3_eventSource());
  };
  var d3_mouse_bug44083 = this.navigator && /WebKit/.test(this.navigator.userAgent) ? -1 : 0;
  function d3_mousePoint(container, e) {
    if (e.changedTouches) e = e.changedTouches[0];
    var svg = container.ownerSVGElement || container;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      if (d3_mouse_bug44083 < 0) {
        var window = d3_window(container);
        if (window.scrollX || window.scrollY) {
          svg = d3.select("body").append("svg").style({
            position: "absolute",
            top: 0,
            left: 0,
            margin: 0,
            padding: 0,
            border: "none"
          }, "important");
          var ctm = svg[0][0].getScreenCTM();
          d3_mouse_bug44083 = !(ctm.f || ctm.e);
          svg.remove();
        }
      }
      if (d3_mouse_bug44083) point.x = e.pageX, point.y = e.pageY; else point.x = e.clientX, 
      point.y = e.clientY;
      point = point.matrixTransform(container.getScreenCTM().inverse());
      return [ point.x, point.y ];
    }
    var rect = container.getBoundingClientRect();
    return [ e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop ];
  }
  d3.touch = function(container, touches, identifier) {
    if (arguments.length < 3) identifier = touches, touches = d3_eventSource().changedTouches;
    if (touches) for (var i = 0, n = touches.length, touch; i < n; ++i) {
      if ((touch = touches[i]).identifier === identifier) {
        return d3_mousePoint(container, touch);
      }
    }
  };
  d3.behavior.drag = function() {
    var event = d3_eventDispatch(drag, "drag", "dragstart", "dragend"), origin = null, mousedown = dragstart(d3_noop, d3.mouse, d3_window, "mousemove", "mouseup"), touchstart = dragstart(d3_behavior_dragTouchId, d3.touch, d3_identity, "touchmove", "touchend");
    function drag() {
      this.on("mousedown.drag", mousedown).on("touchstart.drag", touchstart);
    }
    function dragstart(id, position, subject, move, end) {
      return function() {
        var that = this, target = d3.event.target.correspondingElement || d3.event.target, parent = that.parentNode, dispatch = event.of(that, arguments), dragged = 0, dragId = id(), dragName = ".drag" + (dragId == null ? "" : "-" + dragId), dragOffset, dragSubject = d3.select(subject(target)).on(move + dragName, moved).on(end + dragName, ended), dragRestore = d3_event_dragSuppress(target), position0 = position(parent, dragId);
        if (origin) {
          dragOffset = origin.apply(that, arguments);
          dragOffset = [ dragOffset.x - position0[0], dragOffset.y - position0[1] ];
        } else {
          dragOffset = [ 0, 0 ];
        }
        dispatch({
          type: "dragstart"
        });
        function moved() {
          var position1 = position(parent, dragId), dx, dy;
          if (!position1) return;
          dx = position1[0] - position0[0];
          dy = position1[1] - position0[1];
          dragged |= dx | dy;
          position0 = position1;
          dispatch({
            type: "drag",
            x: position1[0] + dragOffset[0],
            y: position1[1] + dragOffset[1],
            dx: dx,
            dy: dy
          });
        }
        function ended() {
          if (!position(parent, dragId)) return;
          dragSubject.on(move + dragName, null).on(end + dragName, null);
          dragRestore(dragged);
          dispatch({
            type: "dragend"
          });
        }
      };
    }
    drag.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return drag;
    };
    return d3.rebind(drag, event, "on");
  };
  function d3_behavior_dragTouchId() {
    return d3.event.changedTouches[0].identifier;
  }
  d3.touches = function(container, touches) {
    if (arguments.length < 2) touches = d3_eventSource().touches;
    return touches ? d3_array(touches).map(function(touch) {
      var point = d3_mousePoint(container, touch);
      point.identifier = touch.identifier;
      return point;
    }) : [];
  };
  var ε = 1e-6, ε2 = ε * ε, π = Math.PI, τ = 2 * π, τε = τ - ε, halfπ = π / 2, d3_radians = π / 180, d3_degrees = 180 / π;
  function d3_sgn(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  }
  function d3_cross2d(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }
  function d3_acos(x) {
    return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
  }
  function d3_asin(x) {
    return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
  }
  function d3_sinh(x) {
    return ((x = Math.exp(x)) - 1 / x) / 2;
  }
  function d3_cosh(x) {
    return ((x = Math.exp(x)) + 1 / x) / 2;
  }
  function d3_tanh(x) {
    return ((x = Math.exp(2 * x)) - 1) / (x + 1);
  }
  function d3_haversin(x) {
    return (x = Math.sin(x / 2)) * x;
  }
  var ρ = Math.SQRT2, ρ2 = 2, ρ4 = 4;
  d3.interpolateZoom = function(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2], dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, i, S;
    if (d2 < ε2) {
      S = Math.log(w1 / w0) / ρ;
      i = function(t) {
        return [ ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(ρ * t * S) ];
      };
    } else {
      var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + ρ4 * d2) / (2 * w0 * ρ2 * d1), b1 = (w1 * w1 - w0 * w0 - ρ4 * d2) / (2 * w1 * ρ2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / ρ;
      i = function(t) {
        var s = t * S, coshr0 = d3_cosh(r0), u = w0 / (ρ2 * d1) * (coshr0 * d3_tanh(ρ * s + r0) - d3_sinh(r0));
        return [ ux0 + u * dx, uy0 + u * dy, w0 * coshr0 / d3_cosh(ρ * s + r0) ];
      };
    }
    i.duration = S * 1e3;
    return i;
  };
  d3.behavior.zoom = function() {
    var view = {
      x: 0,
      y: 0,
      k: 1
    }, translate0, center0, center, size = [ 960, 500 ], scaleExtent = d3_behavior_zoomInfinity, duration = 250, zooming = 0, mousedown = "mousedown.zoom", mousemove = "mousemove.zoom", mouseup = "mouseup.zoom", mousewheelTimer, touchstart = "touchstart.zoom", touchtime, event = d3_eventDispatch(zoom, "zoomstart", "zoom", "zoomend"), x0, x1, y0, y1;
    if (!d3_behavior_zoomWheel) {
      d3_behavior_zoomWheel = "onwheel" in d3_document ? (d3_behavior_zoomDelta = function() {
        return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1);
      }, "wheel") : "onmousewheel" in d3_document ? (d3_behavior_zoomDelta = function() {
        return d3.event.wheelDelta;
      }, "mousewheel") : (d3_behavior_zoomDelta = function() {
        return -d3.event.detail;
      }, "MozMousePixelScroll");
    }
    function zoom(g) {
      g.on(mousedown, mousedowned).on(d3_behavior_zoomWheel + ".zoom", mousewheeled).on("dblclick.zoom", dblclicked).on(touchstart, touchstarted);
    }
    zoom.event = function(g) {
      g.each(function() {
        var dispatch = event.of(this, arguments), view1 = view;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.zoom", function() {
            view = this.__chart__ || {
              x: 0,
              y: 0,
              k: 1
            };
            zoomstarted(dispatch);
          }).tween("zoom:zoom", function() {
            var dx = size[0], dy = size[1], cx = center0 ? center0[0] : dx / 2, cy = center0 ? center0[1] : dy / 2, i = d3.interpolateZoom([ (cx - view.x) / view.k, (cy - view.y) / view.k, dx / view.k ], [ (cx - view1.x) / view1.k, (cy - view1.y) / view1.k, dx / view1.k ]);
            return function(t) {
              var l = i(t), k = dx / l[2];
              this.__chart__ = view = {
                x: cx - l[0] * k,
                y: cy - l[1] * k,
                k: k
              };
              zoomed(dispatch);
            };
          }).each("interrupt.zoom", function() {
            zoomended(dispatch);
          }).each("end.zoom", function() {
            zoomended(dispatch);
          });
        } else {
          this.__chart__ = view;
          zoomstarted(dispatch);
          zoomed(dispatch);
          zoomended(dispatch);
        }
      });
    };
    zoom.translate = function(_) {
      if (!arguments.length) return [ view.x, view.y ];
      view = {
        x: +_[0],
        y: +_[1],
        k: view.k
      };
      rescale();
      return zoom;
    };
    zoom.scale = function(_) {
      if (!arguments.length) return view.k;
      view = {
        x: view.x,
        y: view.y,
        k: null
      };
      scaleTo(+_);
      rescale();
      return zoom;
    };
    zoom.scaleExtent = function(_) {
      if (!arguments.length) return scaleExtent;
      scaleExtent = _ == null ? d3_behavior_zoomInfinity : [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.center = function(_) {
      if (!arguments.length) return center;
      center = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.size = function(_) {
      if (!arguments.length) return size;
      size = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.duration = function(_) {
      if (!arguments.length) return duration;
      duration = +_;
      return zoom;
    };
    zoom.x = function(z) {
      if (!arguments.length) return x1;
      x1 = z;
      x0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    zoom.y = function(z) {
      if (!arguments.length) return y1;
      y1 = z;
      y0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    function location(p) {
      return [ (p[0] - view.x) / view.k, (p[1] - view.y) / view.k ];
    }
    function point(l) {
      return [ l[0] * view.k + view.x, l[1] * view.k + view.y ];
    }
    function scaleTo(s) {
      view.k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
    }
    function translateTo(p, l) {
      l = point(l);
      view.x += p[0] - l[0];
      view.y += p[1] - l[1];
    }
    function zoomTo(that, p, l, k) {
      that.__chart__ = {
        x: view.x,
        y: view.y,
        k: view.k
      };
      scaleTo(Math.pow(2, k));
      translateTo(center0 = p, l);
      that = d3.select(that);
      if (duration > 0) that = that.transition().duration(duration);
      that.call(zoom.event);
    }
    function rescale() {
      if (x1) x1.domain(x0.range().map(function(x) {
        return (x - view.x) / view.k;
      }).map(x0.invert));
      if (y1) y1.domain(y0.range().map(function(y) {
        return (y - view.y) / view.k;
      }).map(y0.invert));
    }
    function zoomstarted(dispatch) {
      if (!zooming++) dispatch({
        type: "zoomstart"
      });
    }
    function zoomed(dispatch) {
      rescale();
      dispatch({
        type: "zoom",
        scale: view.k,
        translate: [ view.x, view.y ]
      });
    }
    function zoomended(dispatch) {
      if (!--zooming) dispatch({
        type: "zoomend"
      }), center0 = null;
    }
    function mousedowned() {
      var that = this, dispatch = event.of(that, arguments), dragged = 0, subject = d3.select(d3_window(that)).on(mousemove, moved).on(mouseup, ended), location0 = location(d3.mouse(that)), dragRestore = d3_event_dragSuppress(that);
      d3_selection_interrupt.call(that);
      zoomstarted(dispatch);
      function moved() {
        dragged = 1;
        translateTo(d3.mouse(that), location0);
        zoomed(dispatch);
      }
      function ended() {
        subject.on(mousemove, null).on(mouseup, null);
        dragRestore(dragged);
        zoomended(dispatch);
      }
    }
    function touchstarted() {
      var that = this, dispatch = event.of(that, arguments), locations0 = {}, distance0 = 0, scale0, zoomName = ".zoom-" + d3.event.changedTouches[0].identifier, touchmove = "touchmove" + zoomName, touchend = "touchend" + zoomName, targets = [], subject = d3.select(that), dragRestore = d3_event_dragSuppress(that);
      started();
      zoomstarted(dispatch);
      subject.on(mousedown, null).on(touchstart, started);
      function relocate() {
        var touches = d3.touches(that);
        scale0 = view.k;
        touches.forEach(function(t) {
          if (t.identifier in locations0) locations0[t.identifier] = location(t);
        });
        return touches;
      }
      function started() {
        var target = d3.event.target;
        d3.select(target).on(touchmove, moved).on(touchend, ended);
        targets.push(target);
        var changed = d3.event.changedTouches;
        for (var i = 0, n = changed.length; i < n; ++i) {
          locations0[changed[i].identifier] = null;
        }
        var touches = relocate(), now = Date.now();
        if (touches.length === 1) {
          if (now - touchtime < 500) {
            var p = touches[0];
            zoomTo(that, p, locations0[p.identifier], Math.floor(Math.log(view.k) / Math.LN2) + 1);
            d3_eventPreventDefault();
          }
          touchtime = now;
        } else if (touches.length > 1) {
          var p = touches[0], q = touches[1], dx = p[0] - q[0], dy = p[1] - q[1];
          distance0 = dx * dx + dy * dy;
        }
      }
      function moved() {
        var touches = d3.touches(that), p0, l0, p1, l1;
        d3_selection_interrupt.call(that);
        for (var i = 0, n = touches.length; i < n; ++i, l1 = null) {
          p1 = touches[i];
          if (l1 = locations0[p1.identifier]) {
            if (l0) break;
            p0 = p1, l0 = l1;
          }
        }
        if (l1) {
          var distance1 = (distance1 = p1[0] - p0[0]) * distance1 + (distance1 = p1[1] - p0[1]) * distance1, scale1 = distance0 && Math.sqrt(distance1 / distance0);
          p0 = [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ];
          l0 = [ (l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2 ];
          scaleTo(scale1 * scale0);
        }
        touchtime = null;
        translateTo(p0, l0);
        zoomed(dispatch);
      }
      function ended() {
        if (d3.event.touches.length) {
          var changed = d3.event.changedTouches;
          for (var i = 0, n = changed.length; i < n; ++i) {
            delete locations0[changed[i].identifier];
          }
          for (var identifier in locations0) {
            return void relocate();
          }
        }
        d3.selectAll(targets).on(zoomName, null);
        subject.on(mousedown, mousedowned).on(touchstart, touchstarted);
        dragRestore();
        zoomended(dispatch);
      }
    }
    function mousewheeled() {
      var dispatch = event.of(this, arguments);
      if (mousewheelTimer) clearTimeout(mousewheelTimer); else d3_selection_interrupt.call(this), 
      translate0 = location(center0 = center || d3.mouse(this)), zoomstarted(dispatch);
      mousewheelTimer = setTimeout(function() {
        mousewheelTimer = null;
        zoomended(dispatch);
      }, 50);
      d3_eventPreventDefault();
      scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * view.k);
      translateTo(center0, translate0);
      zoomed(dispatch);
    }
    function dblclicked() {
      var p = d3.mouse(this), k = Math.log(view.k) / Math.LN2;
      zoomTo(this, p, location(p), d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1);
    }
    return d3.rebind(zoom, event, "on");
  };
  var d3_behavior_zoomInfinity = [ 0, Infinity ], d3_behavior_zoomDelta, d3_behavior_zoomWheel;
  d3.color = d3_color;
  function d3_color() {}
  d3_color.prototype.toString = function() {
    return this.rgb() + "";
  };
  d3.hsl = d3_hsl;
  function d3_hsl(h, s, l) {
    return this instanceof d3_hsl ? void (this.h = +h, this.s = +s, this.l = +l) : arguments.length < 2 ? h instanceof d3_hsl ? new d3_hsl(h.h, h.s, h.l) : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl) : new d3_hsl(h, s, l);
  }
  var d3_hslPrototype = d3_hsl.prototype = new d3_color();
  d3_hslPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_hsl(this.h, this.s, this.l / k);
  };
  d3_hslPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_hsl(this.h, this.s, k * this.l);
  };
  d3_hslPrototype.rgb = function() {
    return d3_hsl_rgb(this.h, this.s, this.l);
  };
  function d3_hsl_rgb(h, s, l) {
    var m1, m2;
    h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
    s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
    l = l < 0 ? 0 : l > 1 ? 1 : l;
    m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
    m1 = 2 * l - m2;
    function v(h) {
      if (h > 360) h -= 360; else if (h < 0) h += 360;
      if (h < 60) return m1 + (m2 - m1) * h / 60;
      if (h < 180) return m2;
      if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
      return m1;
    }
    function vv(h) {
      return Math.round(v(h) * 255);
    }
    return new d3_rgb(vv(h + 120), vv(h), vv(h - 120));
  }
  d3.hcl = d3_hcl;
  function d3_hcl(h, c, l) {
    return this instanceof d3_hcl ? void (this.h = +h, this.c = +c, this.l = +l) : arguments.length < 2 ? h instanceof d3_hcl ? new d3_hcl(h.h, h.c, h.l) : h instanceof d3_lab ? d3_lab_hcl(h.l, h.a, h.b) : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b) : new d3_hcl(h, c, l);
  }
  var d3_hclPrototype = d3_hcl.prototype = new d3_color();
  d3_hclPrototype.brighter = function(k) {
    return new d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.darker = function(k) {
    return new d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.rgb = function() {
    return d3_hcl_lab(this.h, this.c, this.l).rgb();
  };
  function d3_hcl_lab(h, c, l) {
    if (isNaN(h)) h = 0;
    if (isNaN(c)) c = 0;
    return new d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
  }
  d3.lab = d3_lab;
  function d3_lab(l, a, b) {
    return this instanceof d3_lab ? void (this.l = +l, this.a = +a, this.b = +b) : arguments.length < 2 ? l instanceof d3_lab ? new d3_lab(l.l, l.a, l.b) : l instanceof d3_hcl ? d3_hcl_lab(l.h, l.c, l.l) : d3_rgb_lab((l = d3_rgb(l)).r, l.g, l.b) : new d3_lab(l, a, b);
  }
  var d3_lab_K = 18;
  var d3_lab_X = .95047, d3_lab_Y = 1, d3_lab_Z = 1.08883;
  var d3_labPrototype = d3_lab.prototype = new d3_color();
  d3_labPrototype.brighter = function(k) {
    return new d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.darker = function(k) {
    return new d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.rgb = function() {
    return d3_lab_rgb(this.l, this.a, this.b);
  };
  function d3_lab_rgb(l, a, b) {
    var y = (l + 16) / 116, x = y + a / 500, z = y - b / 200;
    x = d3_lab_xyz(x) * d3_lab_X;
    y = d3_lab_xyz(y) * d3_lab_Y;
    z = d3_lab_xyz(z) * d3_lab_Z;
    return new d3_rgb(d3_xyz_rgb(3.2404542 * x - 1.5371385 * y - .4985314 * z), d3_xyz_rgb(-.969266 * x + 1.8760108 * y + .041556 * z), d3_xyz_rgb(.0556434 * x - .2040259 * y + 1.0572252 * z));
  }
  function d3_lab_hcl(l, a, b) {
    return l > 0 ? new d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l) : new d3_hcl(NaN, NaN, l);
  }
  function d3_lab_xyz(x) {
    return x > .206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
  }
  function d3_xyz_lab(x) {
    return x > .008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
  }
  function d3_xyz_rgb(r) {
    return Math.round(255 * (r <= .00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - .055));
  }
  d3.rgb = d3_rgb;
  function d3_rgb(r, g, b) {
    return this instanceof d3_rgb ? void (this.r = ~~r, this.g = ~~g, this.b = ~~b) : arguments.length < 2 ? r instanceof d3_rgb ? new d3_rgb(r.r, r.g, r.b) : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb) : new d3_rgb(r, g, b);
  }
  function d3_rgbNumber(value) {
    return new d3_rgb(value >> 16, value >> 8 & 255, value & 255);
  }
  function d3_rgbString(value) {
    return d3_rgbNumber(value) + "";
  }
  var d3_rgbPrototype = d3_rgb.prototype = new d3_color();
  d3_rgbPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    var r = this.r, g = this.g, b = this.b, i = 30;
    if (!r && !g && !b) return new d3_rgb(i, i, i);
    if (r && r < i) r = i;
    if (g && g < i) g = i;
    if (b && b < i) b = i;
    return new d3_rgb(Math.min(255, r / k), Math.min(255, g / k), Math.min(255, b / k));
  };
  d3_rgbPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_rgb(k * this.r, k * this.g, k * this.b);
  };
  d3_rgbPrototype.hsl = function() {
    return d3_rgb_hsl(this.r, this.g, this.b);
  };
  d3_rgbPrototype.toString = function() {
    return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
  };
  function d3_rgb_hex(v) {
    return v < 16 ? "0" + Math.max(0, v).toString(16) : Math.min(255, v).toString(16);
  }
  function d3_rgb_parse(format, rgb, hsl) {
    var r = 0, g = 0, b = 0, m1, m2, color;
    m1 = /([a-z]+)\((.*)\)/.exec(format = format.toLowerCase());
    if (m1) {
      m2 = m1[2].split(",");
      switch (m1[1]) {
       case "hsl":
        {
          return hsl(parseFloat(m2[0]), parseFloat(m2[1]) / 100, parseFloat(m2[2]) / 100);
        }

       case "rgb":
        {
          return rgb(d3_rgb_parseNumber(m2[0]), d3_rgb_parseNumber(m2[1]), d3_rgb_parseNumber(m2[2]));
        }
      }
    }
    if (color = d3_rgb_names.get(format)) {
      return rgb(color.r, color.g, color.b);
    }
    if (format != null && format.charAt(0) === "#" && !isNaN(color = parseInt(format.slice(1), 16))) {
      if (format.length === 4) {
        r = (color & 3840) >> 4;
        r = r >> 4 | r;
        g = color & 240;
        g = g >> 4 | g;
        b = color & 15;
        b = b << 4 | b;
      } else if (format.length === 7) {
        r = (color & 16711680) >> 16;
        g = (color & 65280) >> 8;
        b = color & 255;
      }
    }
    return rgb(r, g, b);
  }
  function d3_rgb_hsl(r, g, b) {
    var min = Math.min(r /= 255, g /= 255, b /= 255), max = Math.max(r, g, b), d = max - min, h, s, l = (max + min) / 2;
    if (d) {
      s = l < .5 ? d / (max + min) : d / (2 - max - min);
      if (r == max) h = (g - b) / d + (g < b ? 6 : 0); else if (g == max) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60;
    } else {
      h = NaN;
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new d3_hsl(h, s, l);
  }
  function d3_rgb_lab(r, g, b) {
    r = d3_rgb_xyz(r);
    g = d3_rgb_xyz(g);
    b = d3_rgb_xyz(b);
    var x = d3_xyz_lab((.4124564 * r + .3575761 * g + .1804375 * b) / d3_lab_X), y = d3_xyz_lab((.2126729 * r + .7151522 * g + .072175 * b) / d3_lab_Y), z = d3_xyz_lab((.0193339 * r + .119192 * g + .9503041 * b) / d3_lab_Z);
    return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
  }
  function d3_rgb_xyz(r) {
    return (r /= 255) <= .04045 ? r / 12.92 : Math.pow((r + .055) / 1.055, 2.4);
  }
  function d3_rgb_parseNumber(c) {
    var f = parseFloat(c);
    return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
  }
  var d3_rgb_names = d3.map({
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  });
  d3_rgb_names.forEach(function(key, value) {
    d3_rgb_names.set(key, d3_rgbNumber(value));
  });
  function d3_functor(v) {
    return typeof v === "function" ? v : function() {
      return v;
    };
  }
  d3.functor = d3_functor;
  d3.xhr = d3_xhrType(d3_identity);
  function d3_xhrType(response) {
    return function(url, mimeType, callback) {
      if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, 
      mimeType = null;
      return d3_xhr(url, mimeType, response, callback);
    };
  }
  function d3_xhr(url, mimeType, response, callback) {
    var xhr = {}, dispatch = d3.dispatch("beforesend", "progress", "load", "error"), headers = {}, request = new XMLHttpRequest(), responseType = null;
    if (this.XDomainRequest && !("withCredentials" in request) && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest();
    "onload" in request ? request.onload = request.onerror = respond : request.onreadystatechange = function() {
      request.readyState > 3 && respond();
    };
    function respond() {
      var status = request.status, result;
      if (!status && d3_xhrHasResponse(request) || status >= 200 && status < 300 || status === 304) {
        try {
          result = response.call(xhr, request);
        } catch (e) {
          dispatch.error.call(xhr, e);
          return;
        }
        dispatch.load.call(xhr, result);
      } else {
        dispatch.error.call(xhr, request);
      }
    }
    request.onprogress = function(event) {
      var o = d3.event;
      d3.event = event;
      try {
        dispatch.progress.call(xhr, request);
      } finally {
        d3.event = o;
      }
    };
    xhr.header = function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers[name];
      if (value == null) delete headers[name]; else headers[name] = value + "";
      return xhr;
    };
    xhr.mimeType = function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return xhr;
    };
    xhr.responseType = function(value) {
      if (!arguments.length) return responseType;
      responseType = value;
      return xhr;
    };
    xhr.response = function(value) {
      response = value;
      return xhr;
    };
    [ "get", "post" ].forEach(function(method) {
      xhr[method] = function() {
        return xhr.send.apply(xhr, [ method ].concat(d3_array(arguments)));
      };
    });
    xhr.send = function(method, data, callback) {
      if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
      request.open(method, url, true);
      if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
      if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
      if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
      if (responseType != null) request.responseType = responseType;
      if (callback != null) xhr.on("error", callback).on("load", function(request) {
        callback(null, request);
      });
      dispatch.beforesend.call(xhr, request);
      request.send(data == null ? null : data);
      return xhr;
    };
    xhr.abort = function() {
      request.abort();
      return xhr;
    };
    d3.rebind(xhr, dispatch, "on");
    return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
  }
  function d3_xhr_fixCallback(callback) {
    return callback.length === 1 ? function(error, request) {
      callback(error == null ? request : null);
    } : callback;
  }
  function d3_xhrHasResponse(request) {
    var type = request.responseType;
    return type && type !== "text" ? request.response : request.responseText;
  }
  d3.dsv = function(delimiter, mimeType) {
    var reFormat = new RegExp('["' + delimiter + "\n]"), delimiterCode = delimiter.charCodeAt(0);
    function dsv(url, row, callback) {
      if (arguments.length < 3) callback = row, row = null;
      var xhr = d3_xhr(url, mimeType, row == null ? response : typedResponse(row), callback);
      xhr.row = function(_) {
        return arguments.length ? xhr.response((row = _) == null ? response : typedResponse(_)) : row;
      };
      return xhr;
    }
    function response(request) {
      return dsv.parse(request.responseText);
    }
    function typedResponse(f) {
      return function(request) {
        return dsv.parse(request.responseText, f);
      };
    }
    dsv.parse = function(text, f) {
      var o;
      return dsv.parseRows(text, function(row, i) {
        if (o) return o(row, i - 1);
        var a = new Function("d", "return {" + row.map(function(name, i) {
          return JSON.stringify(name) + ": d[" + i + "]";
        }).join(",") + "}");
        o = f ? function(row, i) {
          return f(a(row), i);
        } : a;
      });
    };
    dsv.parseRows = function(text, f) {
      var EOL = {}, EOF = {}, rows = [], N = text.length, I = 0, n = 0, t, eol;
      function token() {
        if (I >= N) return EOF;
        if (eol) return eol = false, EOL;
        var j = I;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          var c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.slice(j + 1, i).replace(/""/g, '"');
        }
        while (I < N) {
          var c = text.charCodeAt(I++), k = 1;
          if (c === 10) eol = true; else if (c === 13) {
            eol = true;
            if (text.charCodeAt(I) === 10) ++I, ++k;
          } else if (c !== delimiterCode) continue;
          return text.slice(j, I - k);
        }
        return text.slice(j);
      }
      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && (a = f(a, n++)) == null) continue;
        rows.push(a);
      }
      return rows;
    };
    dsv.format = function(rows) {
      if (Array.isArray(rows[0])) return dsv.formatRows(rows);
      var fieldSet = new d3_Set(), fields = [];
      rows.forEach(function(row) {
        for (var field in row) {
          if (!fieldSet.has(field)) {
            fields.push(fieldSet.add(field));
          }
        }
      });
      return [ fields.map(formatValue).join(delimiter) ].concat(rows.map(function(row) {
        return fields.map(function(field) {
          return formatValue(row[field]);
        }).join(delimiter);
      })).join("\n");
    };
    dsv.formatRows = function(rows) {
      return rows.map(formatRow).join("\n");
    };
    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }
    function formatValue(text) {
      return reFormat.test(text) ? '"' + text.replace(/\"/g, '""') + '"' : text;
    }
    return dsv;
  };
  d3.csv = d3.dsv(",", "text/csv");
  d3.tsv = d3.dsv("	", "text/tab-separated-values");
  var d3_timer_queueHead, d3_timer_queueTail, d3_timer_interval, d3_timer_timeout, d3_timer_frame = this[d3_vendorSymbol(this, "requestAnimationFrame")] || function(callback) {
    setTimeout(callback, 17);
  };
  d3.timer = function() {
    d3_timer.apply(this, arguments);
  };
  function d3_timer(callback, delay, then) {
    var n = arguments.length;
    if (n < 2) delay = 0;
    if (n < 3) then = Date.now();
    var time = then + delay, timer = {
      c: callback,
      t: time,
      n: null
    };
    if (d3_timer_queueTail) d3_timer_queueTail.n = timer; else d3_timer_queueHead = timer;
    d3_timer_queueTail = timer;
    if (!d3_timer_interval) {
      d3_timer_timeout = clearTimeout(d3_timer_timeout);
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
    return timer;
  }
  function d3_timer_step() {
    var now = d3_timer_mark(), delay = d3_timer_sweep() - now;
    if (delay > 24) {
      if (isFinite(delay)) {
        clearTimeout(d3_timer_timeout);
        d3_timer_timeout = setTimeout(d3_timer_step, delay);
      }
      d3_timer_interval = 0;
    } else {
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  }
  d3.timer.flush = function() {
    d3_timer_mark();
    d3_timer_sweep();
  };
  function d3_timer_mark() {
    var now = Date.now(), timer = d3_timer_queueHead;
    while (timer) {
      if (now >= timer.t && timer.c(now - timer.t)) timer.c = null;
      timer = timer.n;
    }
    return now;
  }
  function d3_timer_sweep() {
    var t0, t1 = d3_timer_queueHead, time = Infinity;
    while (t1) {
      if (t1.c) {
        if (t1.t < time) time = t1.t;
        t1 = (t0 = t1).n;
      } else {
        t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
      }
    }
    d3_timer_queueTail = t0;
    return time;
  }
  function d3_format_precision(x, p) {
    return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
  }
  d3.round = function(x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
  };
  var d3_formatPrefixes = [ "y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y" ].map(d3_formatPrefix);
  d3.formatPrefix = function(value, precision) {
    var i = 0;
    if (value = +value) {
      if (value < 0) value *= -1;
      if (precision) value = d3.round(value, d3_format_precision(value, precision));
      i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
      i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
    }
    return d3_formatPrefixes[8 + i / 3];
  };
  function d3_formatPrefix(d, i) {
    var k = Math.pow(10, abs(8 - i) * 3);
    return {
      scale: i > 8 ? function(d) {
        return d / k;
      } : function(d) {
        return d * k;
      },
      symbol: d
    };
  }
  function d3_locale_numberFormat(locale) {
    var locale_decimal = locale.decimal, locale_thousands = locale.thousands, locale_grouping = locale.grouping, locale_currency = locale.currency, formatGroup = locale_grouping && locale_thousands ? function(value, width) {
      var i = value.length, t = [], j = 0, g = locale_grouping[0], length = 0;
      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = locale_grouping[j = (j + 1) % locale_grouping.length];
      }
      return t.reverse().join(locale_thousands);
    } : d3_identity;
    return function(specifier) {
      var match = d3_format_re.exec(specifier), fill = match[1] || " ", align = match[2] || ">", sign = match[3] || "-", symbol = match[4] || "", zfill = match[5], width = +match[6], comma = match[7], precision = match[8], type = match[9], scale = 1, prefix = "", suffix = "", integer = false, exponent = true;
      if (precision) precision = +precision.substring(1);
      if (zfill || fill === "0" && align === "=") {
        zfill = fill = "0";
        align = "=";
      }
      switch (type) {
       case "n":
        comma = true;
        type = "g";
        break;

       case "%":
        scale = 100;
        suffix = "%";
        type = "f";
        break;

       case "p":
        scale = 100;
        suffix = "%";
        type = "r";
        break;

       case "b":
       case "o":
       case "x":
       case "X":
        if (symbol === "#") prefix = "0" + type.toLowerCase();

       case "c":
        exponent = false;

       case "d":
        integer = true;
        precision = 0;
        break;

       case "s":
        scale = -1;
        type = "r";
        break;
      }
      if (symbol === "$") prefix = locale_currency[0], suffix = locale_currency[1];
      if (type == "r" && !precision) type = "g";
      if (precision != null) {
        if (type == "g") precision = Math.max(1, Math.min(21, precision)); else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
      }
      type = d3_format_types.get(type) || d3_format_typeDefault;
      var zcomma = zfill && comma;
      return function(value) {
        var fullSuffix = suffix;
        if (integer && value % 1) return "";
        var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign === "-" ? "" : sign;
        if (scale < 0) {
          var unit = d3.formatPrefix(value, precision);
          value = unit.scale(value);
          fullSuffix = unit.symbol + suffix;
        } else {
          value *= scale;
        }
        value = type(value, precision);
        var i = value.lastIndexOf("."), before, after;
        if (i < 0) {
          var j = exponent ? value.lastIndexOf("e") : -1;
          if (j < 0) before = value, after = ""; else before = value.substring(0, j), after = value.substring(j);
        } else {
          before = value.substring(0, i);
          after = locale_decimal + value.substring(i + 1);
        }
        if (!zfill && comma) before = formatGroup(before, Infinity);
        var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length), padding = length < width ? new Array(length = width - length + 1).join(fill) : "";
        if (zcomma) before = formatGroup(padding + before, padding.length ? width - after.length : Infinity);
        negative += prefix;
        value = before + after;
        return (align === "<" ? negative + value + padding : align === ">" ? padding + negative + value : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length) : negative + (zcomma ? value : padding + value)) + fullSuffix;
      };
    };
  }
  var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;
  var d3_format_types = d3.map({
    b: function(x) {
      return x.toString(2);
    },
    c: function(x) {
      return String.fromCharCode(x);
    },
    o: function(x) {
      return x.toString(8);
    },
    x: function(x) {
      return x.toString(16);
    },
    X: function(x) {
      return x.toString(16).toUpperCase();
    },
    g: function(x, p) {
      return x.toPrecision(p);
    },
    e: function(x, p) {
      return x.toExponential(p);
    },
    f: function(x, p) {
      return x.toFixed(p);
    },
    r: function(x, p) {
      return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p))));
    }
  });
  function d3_format_typeDefault(x) {
    return x + "";
  }
  var d3_time = d3.time = {}, d3_date = Date;
  function d3_date_utc() {
    this._ = new Date(arguments.length > 1 ? Date.UTC.apply(this, arguments) : arguments[0]);
  }
  d3_date_utc.prototype = {
    getDate: function() {
      return this._.getUTCDate();
    },
    getDay: function() {
      return this._.getUTCDay();
    },
    getFullYear: function() {
      return this._.getUTCFullYear();
    },
    getHours: function() {
      return this._.getUTCHours();
    },
    getMilliseconds: function() {
      return this._.getUTCMilliseconds();
    },
    getMinutes: function() {
      return this._.getUTCMinutes();
    },
    getMonth: function() {
      return this._.getUTCMonth();
    },
    getSeconds: function() {
      return this._.getUTCSeconds();
    },
    getTime: function() {
      return this._.getTime();
    },
    getTimezoneOffset: function() {
      return 0;
    },
    valueOf: function() {
      return this._.valueOf();
    },
    setDate: function() {
      d3_time_prototype.setUTCDate.apply(this._, arguments);
    },
    setDay: function() {
      d3_time_prototype.setUTCDay.apply(this._, arguments);
    },
    setFullYear: function() {
      d3_time_prototype.setUTCFullYear.apply(this._, arguments);
    },
    setHours: function() {
      d3_time_prototype.setUTCHours.apply(this._, arguments);
    },
    setMilliseconds: function() {
      d3_time_prototype.setUTCMilliseconds.apply(this._, arguments);
    },
    setMinutes: function() {
      d3_time_prototype.setUTCMinutes.apply(this._, arguments);
    },
    setMonth: function() {
      d3_time_prototype.setUTCMonth.apply(this._, arguments);
    },
    setSeconds: function() {
      d3_time_prototype.setUTCSeconds.apply(this._, arguments);
    },
    setTime: function() {
      d3_time_prototype.setTime.apply(this._, arguments);
    }
  };
  var d3_time_prototype = Date.prototype;
  function d3_time_interval(local, step, number) {
    function round(date) {
      var d0 = local(date), d1 = offset(d0, 1);
      return date - d0 < d1 - date ? d0 : d1;
    }
    function ceil(date) {
      step(date = local(new d3_date(date - 1)), 1);
      return date;
    }
    function offset(date, k) {
      step(date = new d3_date(+date), k);
      return date;
    }
    function range(t0, t1, dt) {
      var time = ceil(t0), times = [];
      if (dt > 1) {
        while (time < t1) {
          if (!(number(time) % dt)) times.push(new Date(+time));
          step(time, 1);
        }
      } else {
        while (time < t1) times.push(new Date(+time)), step(time, 1);
      }
      return times;
    }
    function range_utc(t0, t1, dt) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = t0;
        return range(utc, t1, dt);
      } finally {
        d3_date = Date;
      }
    }
    local.floor = local;
    local.round = round;
    local.ceil = ceil;
    local.offset = offset;
    local.range = range;
    var utc = local.utc = d3_time_interval_utc(local);
    utc.floor = utc;
    utc.round = d3_time_interval_utc(round);
    utc.ceil = d3_time_interval_utc(ceil);
    utc.offset = d3_time_interval_utc(offset);
    utc.range = range_utc;
    return local;
  }
  function d3_time_interval_utc(method) {
    return function(date, k) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = date;
        return method(utc, k)._;
      } finally {
        d3_date = Date;
      }
    };
  }
  d3_time.year = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setMonth(0, 1);
    return date;
  }, function(date, offset) {
    date.setFullYear(date.getFullYear() + offset);
  }, function(date) {
    return date.getFullYear();
  });
  d3_time.years = d3_time.year.range;
  d3_time.years.utc = d3_time.year.utc.range;
  d3_time.day = d3_time_interval(function(date) {
    var day = new d3_date(2e3, 0);
    day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    return day;
  }, function(date, offset) {
    date.setDate(date.getDate() + offset);
  }, function(date) {
    return date.getDate() - 1;
  });
  d3_time.days = d3_time.day.range;
  d3_time.days.utc = d3_time.day.utc.range;
  d3_time.dayOfYear = function(date) {
    var year = d3_time.year(date);
    return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
  };
  [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ].forEach(function(day, i) {
    i = 7 - i;
    var interval = d3_time[day] = d3_time_interval(function(date) {
      (date = d3_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
      return date;
    }, function(date, offset) {
      date.setDate(date.getDate() + Math.floor(offset) * 7);
    }, function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
    });
    d3_time[day + "s"] = interval.range;
    d3_time[day + "s"].utc = interval.utc.range;
    d3_time[day + "OfYear"] = function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7);
    };
  });
  d3_time.week = d3_time.sunday;
  d3_time.weeks = d3_time.sunday.range;
  d3_time.weeks.utc = d3_time.sunday.utc.range;
  d3_time.weekOfYear = d3_time.sundayOfYear;
  function d3_locale_timeFormat(locale) {
    var locale_dateTime = locale.dateTime, locale_date = locale.date, locale_time = locale.time, locale_periods = locale.periods, locale_days = locale.days, locale_shortDays = locale.shortDays, locale_months = locale.months, locale_shortMonths = locale.shortMonths;
    function d3_time_format(template) {
      var n = template.length;
      function format(date) {
        var string = [], i = -1, j = 0, c, p, f;
        while (++i < n) {
          if (template.charCodeAt(i) === 37) {
            string.push(template.slice(j, i));
            if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
            if (f = d3_time_formats[c]) c = f(date, p == null ? c === "e" ? " " : "0" : p);
            string.push(c);
            j = i + 1;
          }
        }
        string.push(template.slice(j, i));
        return string.join("");
      }
      format.parse = function(string) {
        var d = {
          y: 1900,
          m: 0,
          d: 1,
          H: 0,
          M: 0,
          S: 0,
          L: 0,
          Z: null
        }, i = d3_time_parse(d, template, string, 0);
        if (i != string.length) return null;
        if ("p" in d) d.H = d.H % 12 + d.p * 12;
        var localZ = d.Z != null && d3_date !== d3_date_utc, date = new (localZ ? d3_date_utc : d3_date)();
        if ("j" in d) date.setFullYear(d.y, 0, d.j); else if ("W" in d || "U" in d) {
          if (!("w" in d)) d.w = "W" in d ? 1 : 0;
          date.setFullYear(d.y, 0, 1);
          date.setFullYear(d.y, 0, "W" in d ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7 : d.w + d.U * 7 - (date.getDay() + 6) % 7);
        } else date.setFullYear(d.y, d.m, d.d);
        date.setHours(d.H + (d.Z / 100 | 0), d.M + d.Z % 100, d.S, d.L);
        return localZ ? date._ : date;
      };
      format.toString = function() {
        return template;
      };
      return format;
    }
    function d3_time_parse(date, template, string, j) {
      var c, p, t, i = 0, n = template.length, m = string.length;
      while (i < n) {
        if (j >= m) return -1;
        c = template.charCodeAt(i++);
        if (c === 37) {
          t = template.charAt(i++);
          p = d3_time_parsers[t in d3_time_formatPads ? template.charAt(i++) : t];
          if (!p || (j = p(date, string, j)) < 0) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }
      return j;
    }
    d3_time_format.utc = function(template) {
      var local = d3_time_format(template);
      function format(date) {
        try {
          d3_date = d3_date_utc;
          var utc = new d3_date();
          utc._ = date;
          return local(utc);
        } finally {
          d3_date = Date;
        }
      }
      format.parse = function(string) {
        try {
          d3_date = d3_date_utc;
          var date = local.parse(string);
          return date && date._;
        } finally {
          d3_date = Date;
        }
      };
      format.toString = local.toString;
      return format;
    };
    d3_time_format.multi = d3_time_format.utc.multi = d3_time_formatMulti;
    var d3_time_periodLookup = d3.map(), d3_time_dayRe = d3_time_formatRe(locale_days), d3_time_dayLookup = d3_time_formatLookup(locale_days), d3_time_dayAbbrevRe = d3_time_formatRe(locale_shortDays), d3_time_dayAbbrevLookup = d3_time_formatLookup(locale_shortDays), d3_time_monthRe = d3_time_formatRe(locale_months), d3_time_monthLookup = d3_time_formatLookup(locale_months), d3_time_monthAbbrevRe = d3_time_formatRe(locale_shortMonths), d3_time_monthAbbrevLookup = d3_time_formatLookup(locale_shortMonths);
    locale_periods.forEach(function(p, i) {
      d3_time_periodLookup.set(p.toLowerCase(), i);
    });
    var d3_time_formats = {
      a: function(d) {
        return locale_shortDays[d.getDay()];
      },
      A: function(d) {
        return locale_days[d.getDay()];
      },
      b: function(d) {
        return locale_shortMonths[d.getMonth()];
      },
      B: function(d) {
        return locale_months[d.getMonth()];
      },
      c: d3_time_format(locale_dateTime),
      d: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      e: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      H: function(d, p) {
        return d3_time_formatPad(d.getHours(), p, 2);
      },
      I: function(d, p) {
        return d3_time_formatPad(d.getHours() % 12 || 12, p, 2);
      },
      j: function(d, p) {
        return d3_time_formatPad(1 + d3_time.dayOfYear(d), p, 3);
      },
      L: function(d, p) {
        return d3_time_formatPad(d.getMilliseconds(), p, 3);
      },
      m: function(d, p) {
        return d3_time_formatPad(d.getMonth() + 1, p, 2);
      },
      M: function(d, p) {
        return d3_time_formatPad(d.getMinutes(), p, 2);
      },
      p: function(d) {
        return locale_periods[+(d.getHours() >= 12)];
      },
      S: function(d, p) {
        return d3_time_formatPad(d.getSeconds(), p, 2);
      },
      U: function(d, p) {
        return d3_time_formatPad(d3_time.sundayOfYear(d), p, 2);
      },
      w: function(d) {
        return d.getDay();
      },
      W: function(d, p) {
        return d3_time_formatPad(d3_time.mondayOfYear(d), p, 2);
      },
      x: d3_time_format(locale_date),
      X: d3_time_format(locale_time),
      y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 100, p, 2);
      },
      Y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 1e4, p, 4);
      },
      Z: d3_time_zone,
      "%": function() {
        return "%";
      }
    };
    var d3_time_parsers = {
      a: d3_time_parseWeekdayAbbrev,
      A: d3_time_parseWeekday,
      b: d3_time_parseMonthAbbrev,
      B: d3_time_parseMonth,
      c: d3_time_parseLocaleFull,
      d: d3_time_parseDay,
      e: d3_time_parseDay,
      H: d3_time_parseHour24,
      I: d3_time_parseHour24,
      j: d3_time_parseDayOfYear,
      L: d3_time_parseMilliseconds,
      m: d3_time_parseMonthNumber,
      M: d3_time_parseMinutes,
      p: d3_time_parseAmPm,
      S: d3_time_parseSeconds,
      U: d3_time_parseWeekNumberSunday,
      w: d3_time_parseWeekdayNumber,
      W: d3_time_parseWeekNumberMonday,
      x: d3_time_parseLocaleDate,
      X: d3_time_parseLocaleTime,
      y: d3_time_parseYear,
      Y: d3_time_parseFullYear,
      Z: d3_time_parseZone,
      "%": d3_time_parseLiteralPercent
    };
    function d3_time_parseWeekdayAbbrev(date, string, i) {
      d3_time_dayAbbrevRe.lastIndex = 0;
      var n = d3_time_dayAbbrevRe.exec(string.slice(i));
      return n ? (date.w = d3_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseWeekday(date, string, i) {
      d3_time_dayRe.lastIndex = 0;
      var n = d3_time_dayRe.exec(string.slice(i));
      return n ? (date.w = d3_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonthAbbrev(date, string, i) {
      d3_time_monthAbbrevRe.lastIndex = 0;
      var n = d3_time_monthAbbrevRe.exec(string.slice(i));
      return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonth(date, string, i) {
      d3_time_monthRe.lastIndex = 0;
      var n = d3_time_monthRe.exec(string.slice(i));
      return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseLocaleFull(date, string, i) {
      return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
    }
    function d3_time_parseLocaleDate(date, string, i) {
      return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
    }
    function d3_time_parseLocaleTime(date, string, i) {
      return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
    }
    function d3_time_parseAmPm(date, string, i) {
      var n = d3_time_periodLookup.get(string.slice(i, i += 2).toLowerCase());
      return n == null ? -1 : (date.p = n, i);
    }
    return d3_time_format;
  }
  var d3_time_formatPads = {
    "-": "",
    _: " ",
    "0": "0"
  }, d3_time_numberRe = /^\s*\d+/, d3_time_percentRe = /^%/;
  function d3_time_formatPad(value, fill, width) {
    var sign = value < 0 ? "-" : "", string = (sign ? -value : value) + "", length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }
  function d3_time_formatRe(names) {
    return new RegExp("^(?:" + names.map(d3.requote).join("|") + ")", "i");
  }
  function d3_time_formatLookup(names) {
    var map = new d3_Map(), i = -1, n = names.length;
    while (++i < n) map.set(names[i].toLowerCase(), i);
    return map;
  }
  function d3_time_parseWeekdayNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 1));
    return n ? (date.w = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberSunday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i));
    return n ? (date.U = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberMonday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i));
    return n ? (date.W = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseFullYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 4));
    return n ? (date.y = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.y = d3_time_expandYear(+n[0]), i + n[0].length) : -1;
  }
  function d3_time_parseZone(date, string, i) {
    return /^[+-]\d{4}$/.test(string = string.slice(i, i + 5)) ? (date.Z = -string, 
    i + 5) : -1;
  }
  function d3_time_expandYear(d) {
    return d + (d > 68 ? 1900 : 2e3);
  }
  function d3_time_parseMonthNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.m = n[0] - 1, i + n[0].length) : -1;
  }
  function d3_time_parseDay(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.d = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseDayOfYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 3));
    return n ? (date.j = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseHour24(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.H = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMinutes(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.M = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseSeconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.S = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMilliseconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 3));
    return n ? (date.L = +n[0], i + n[0].length) : -1;
  }
  function d3_time_zone(d) {
    var z = d.getTimezoneOffset(), zs = z > 0 ? "-" : "+", zh = abs(z) / 60 | 0, zm = abs(z) % 60;
    return zs + d3_time_formatPad(zh, "0", 2) + d3_time_formatPad(zm, "0", 2);
  }
  function d3_time_parseLiteralPercent(date, string, i) {
    d3_time_percentRe.lastIndex = 0;
    var n = d3_time_percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }
  function d3_time_formatMulti(formats) {
    var n = formats.length, i = -1;
    while (++i < n) formats[i][0] = this(formats[i][0]);
    return function(date) {
      var i = 0, f = formats[i];
      while (!f[1](date)) f = formats[++i];
      return f[0](date);
    };
  }
  d3.locale = function(locale) {
    return {
      numberFormat: d3_locale_numberFormat(locale),
      timeFormat: d3_locale_timeFormat(locale)
    };
  };
  var d3_locale_enUS = d3.locale({
    decimal: ".",
    thousands: ",",
    grouping: [ 3 ],
    currency: [ "$", "" ],
    dateTime: "%a %b %e %X %Y",
    date: "%m/%d/%Y",
    time: "%H:%M:%S",
    periods: [ "AM", "PM" ],
    days: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
    shortDays: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
    months: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
    shortMonths: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
  });
  d3.format = d3_locale_enUS.numberFormat;
  d3.geo = {};
  function d3_adder() {}
  d3_adder.prototype = {
    s: 0,
    t: 0,
    add: function(y) {
      d3_adderSum(y, this.t, d3_adderTemp);
      d3_adderSum(d3_adderTemp.s, this.s, this);
      if (this.s) this.t += d3_adderTemp.t; else this.s = d3_adderTemp.t;
    },
    reset: function() {
      this.s = this.t = 0;
    },
    valueOf: function() {
      return this.s;
    }
  };
  var d3_adderTemp = new d3_adder();
  function d3_adderSum(a, b, o) {
    var x = o.s = a + b, bv = x - a, av = x - bv;
    o.t = a - av + (b - bv);
  }
  d3.geo.stream = function(object, listener) {
    if (object && d3_geo_streamObjectType.hasOwnProperty(object.type)) {
      d3_geo_streamObjectType[object.type](object, listener);
    } else {
      d3_geo_streamGeometry(object, listener);
    }
  };
  function d3_geo_streamGeometry(geometry, listener) {
    if (geometry && d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {
      d3_geo_streamGeometryType[geometry.type](geometry, listener);
    }
  }
  var d3_geo_streamObjectType = {
    Feature: function(feature, listener) {
      d3_geo_streamGeometry(feature.geometry, listener);
    },
    FeatureCollection: function(object, listener) {
      var features = object.features, i = -1, n = features.length;
      while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);
    }
  };
  var d3_geo_streamGeometryType = {
    Sphere: function(object, listener) {
      listener.sphere();
    },
    Point: function(object, listener) {
      object = object.coordinates;
      listener.point(object[0], object[1], object[2]);
    },
    MultiPoint: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) object = coordinates[i], listener.point(object[0], object[1], object[2]);
    },
    LineString: function(object, listener) {
      d3_geo_streamLine(object.coordinates, listener, 0);
    },
    MultiLineString: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);
    },
    Polygon: function(object, listener) {
      d3_geo_streamPolygon(object.coordinates, listener);
    },
    MultiPolygon: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);
    },
    GeometryCollection: function(object, listener) {
      var geometries = object.geometries, i = -1, n = geometries.length;
      while (++i < n) d3_geo_streamGeometry(geometries[i], listener);
    }
  };
  function d3_geo_streamLine(coordinates, listener, closed) {
    var i = -1, n = coordinates.length - closed, coordinate;
    listener.lineStart();
    while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1], coordinate[2]);
    listener.lineEnd();
  }
  function d3_geo_streamPolygon(coordinates, listener) {
    var i = -1, n = coordinates.length;
    listener.polygonStart();
    while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);
    listener.polygonEnd();
  }
  d3.geo.area = function(object) {
    d3_geo_areaSum = 0;
    d3.geo.stream(object, d3_geo_area);
    return d3_geo_areaSum;
  };
  var d3_geo_areaSum, d3_geo_areaRingSum = new d3_adder();
  var d3_geo_area = {
    sphere: function() {
      d3_geo_areaSum += 4 * π;
    },
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_areaRingSum.reset();
      d3_geo_area.lineStart = d3_geo_areaRingStart;
    },
    polygonEnd: function() {
      var area = 2 * d3_geo_areaRingSum;
      d3_geo_areaSum += area < 0 ? 4 * π + area : area;
      d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;
    }
  };
  function d3_geo_areaRingStart() {
    var λ00, φ00, λ0, cosφ0, sinφ0;
    d3_geo_area.point = function(λ, φ) {
      d3_geo_area.point = nextPoint;
      λ0 = (λ00 = λ) * d3_radians, cosφ0 = Math.cos(φ = (φ00 = φ) * d3_radians / 2 + π / 4), 
      sinφ0 = Math.sin(φ);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      φ = φ * d3_radians / 2 + π / 4;
      var dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, cosφ = Math.cos(φ), sinφ = Math.sin(φ), k = sinφ0 * sinφ, u = cosφ0 * cosφ + k * Math.cos(adλ), v = k * sdλ * Math.sin(adλ);
      d3_geo_areaRingSum.add(Math.atan2(v, u));
      λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
    }
    d3_geo_area.lineEnd = function() {
      nextPoint(λ00, φ00);
    };
  }
  function d3_geo_cartesian(spherical) {
    var λ = spherical[0], φ = spherical[1], cosφ = Math.cos(φ);
    return [ cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ) ];
  }
  function d3_geo_cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function d3_geo_cartesianCross(a, b) {
    return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
  }
  function d3_geo_cartesianAdd(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
  }
  function d3_geo_cartesianScale(vector, k) {
    return [ vector[0] * k, vector[1] * k, vector[2] * k ];
  }
  function d3_geo_cartesianNormalize(d) {
    var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l;
    d[1] /= l;
    d[2] /= l;
  }
  function d3_geo_spherical(cartesian) {
    return [ Math.atan2(cartesian[1], cartesian[0]), d3_asin(cartesian[2]) ];
  }
  function d3_geo_sphericalEqual(a, b) {
    return abs(a[0] - b[0]) < ε && abs(a[1] - b[1]) < ε;
  }
  d3.geo.bounds = function() {
    var λ0, φ0, λ1, φ1, λ_, λ__, φ__, p0, dλSum, ranges, range;
    var bound = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        bound.point = ringPoint;
        bound.lineStart = ringStart;
        bound.lineEnd = ringEnd;
        dλSum = 0;
        d3_geo_area.polygonStart();
      },
      polygonEnd: function() {
        d3_geo_area.polygonEnd();
        bound.point = point;
        bound.lineStart = lineStart;
        bound.lineEnd = lineEnd;
        if (d3_geo_areaRingSum < 0) λ0 = -(λ1 = 180), φ0 = -(φ1 = 90); else if (dλSum > ε) φ1 = 90; else if (dλSum < -ε) φ0 = -90;
        range[0] = λ0, range[1] = λ1;
      }
    };
    function point(λ, φ) {
      ranges.push(range = [ λ0 = λ, λ1 = λ ]);
      if (φ < φ0) φ0 = φ;
      if (φ > φ1) φ1 = φ;
    }
    function linePoint(λ, φ) {
      var p = d3_geo_cartesian([ λ * d3_radians, φ * d3_radians ]);
      if (p0) {
        var normal = d3_geo_cartesianCross(p0, p), equatorial = [ normal[1], -normal[0], 0 ], inflection = d3_geo_cartesianCross(equatorial, normal);
        d3_geo_cartesianNormalize(inflection);
        inflection = d3_geo_spherical(inflection);
        var dλ = λ - λ_, s = dλ > 0 ? 1 : -1, λi = inflection[0] * d3_degrees * s, antimeridian = abs(dλ) > 180;
        if (antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = inflection[1] * d3_degrees;
          if (φi > φ1) φ1 = φi;
        } else if (λi = (λi + 360) % 360 - 180, antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = -inflection[1] * d3_degrees;
          if (φi < φ0) φ0 = φi;
        } else {
          if (φ < φ0) φ0 = φ;
          if (φ > φ1) φ1 = φ;
        }
        if (antimeridian) {
          if (λ < λ_) {
            if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
          } else {
            if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
          }
        } else {
          if (λ1 >= λ0) {
            if (λ < λ0) λ0 = λ;
            if (λ > λ1) λ1 = λ;
          } else {
            if (λ > λ_) {
              if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
            } else {
              if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
            }
          }
        }
      } else {
        point(λ, φ);
      }
      p0 = p, λ_ = λ;
    }
    function lineStart() {
      bound.point = linePoint;
    }
    function lineEnd() {
      range[0] = λ0, range[1] = λ1;
      bound.point = point;
      p0 = null;
    }
    function ringPoint(λ, φ) {
      if (p0) {
        var dλ = λ - λ_;
        dλSum += abs(dλ) > 180 ? dλ + (dλ > 0 ? 360 : -360) : dλ;
      } else λ__ = λ, φ__ = φ;
      d3_geo_area.point(λ, φ);
      linePoint(λ, φ);
    }
    function ringStart() {
      d3_geo_area.lineStart();
    }
    function ringEnd() {
      ringPoint(λ__, φ__);
      d3_geo_area.lineEnd();
      if (abs(dλSum) > ε) λ0 = -(λ1 = 180);
      range[0] = λ0, range[1] = λ1;
      p0 = null;
    }
    function angle(λ0, λ1) {
      return (λ1 -= λ0) < 0 ? λ1 + 360 : λ1;
    }
    function compareRanges(a, b) {
      return a[0] - b[0];
    }
    function withinRange(x, range) {
      return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
    }
    return function(feature) {
      φ1 = λ1 = -(λ0 = φ0 = Infinity);
      ranges = [];
      d3.geo.stream(feature, bound);
      var n = ranges.length;
      if (n) {
        ranges.sort(compareRanges);
        for (var i = 1, a = ranges[0], b, merged = [ a ]; i < n; ++i) {
          b = ranges[i];
          if (withinRange(b[0], a) || withinRange(b[1], a)) {
            if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
            if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
          } else {
            merged.push(a = b);
          }
        }
        var best = -Infinity, dλ;
        for (var n = merged.length - 1, i = 0, a = merged[n], b; i <= n; a = b, ++i) {
          b = merged[i];
          if ((dλ = angle(a[1], b[0])) > best) best = dλ, λ0 = b[0], λ1 = a[1];
        }
      }
      ranges = range = null;
      return λ0 === Infinity || φ0 === Infinity ? [ [ NaN, NaN ], [ NaN, NaN ] ] : [ [ λ0, φ0 ], [ λ1, φ1 ] ];
    };
  }();
  d3.geo.centroid = function(object) {
    d3_geo_centroidW0 = d3_geo_centroidW1 = d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
    d3.geo.stream(object, d3_geo_centroid);
    var x = d3_geo_centroidX2, y = d3_geo_centroidY2, z = d3_geo_centroidZ2, m = x * x + y * y + z * z;
    if (m < ε2) {
      x = d3_geo_centroidX1, y = d3_geo_centroidY1, z = d3_geo_centroidZ1;
      if (d3_geo_centroidW1 < ε) x = d3_geo_centroidX0, y = d3_geo_centroidY0, z = d3_geo_centroidZ0;
      m = x * x + y * y + z * z;
      if (m < ε2) return [ NaN, NaN ];
    }
    return [ Math.atan2(y, x) * d3_degrees, d3_asin(z / Math.sqrt(m)) * d3_degrees ];
  };
  var d3_geo_centroidW0, d3_geo_centroidW1, d3_geo_centroidX0, d3_geo_centroidY0, d3_geo_centroidZ0, d3_geo_centroidX1, d3_geo_centroidY1, d3_geo_centroidZ1, d3_geo_centroidX2, d3_geo_centroidY2, d3_geo_centroidZ2;
  var d3_geo_centroid = {
    sphere: d3_noop,
    point: d3_geo_centroidPoint,
    lineStart: d3_geo_centroidLineStart,
    lineEnd: d3_geo_centroidLineEnd,
    polygonStart: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidLineStart;
    }
  };
  function d3_geo_centroidPoint(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians);
    d3_geo_centroidPointXYZ(cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ));
  }
  function d3_geo_centroidPointXYZ(x, y, z) {
    ++d3_geo_centroidW0;
    d3_geo_centroidX0 += (x - d3_geo_centroidX0) / d3_geo_centroidW0;
    d3_geo_centroidY0 += (y - d3_geo_centroidY0) / d3_geo_centroidW0;
    d3_geo_centroidZ0 += (z - d3_geo_centroidZ0) / d3_geo_centroidW0;
  }
  function d3_geo_centroidLineStart() {
    var x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroid.point = nextPoint;
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), w = Math.atan2(Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_geo_centroidLineEnd() {
    d3_geo_centroid.point = d3_geo_centroidPoint;
  }
  function d3_geo_centroidRingStart() {
    var λ00, φ00, x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ00 = λ, φ00 = φ;
      d3_geo_centroid.point = nextPoint;
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    d3_geo_centroid.lineEnd = function() {
      nextPoint(λ00, φ00);
      d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;
      d3_geo_centroid.point = d3_geo_centroidPoint;
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), cx = y0 * z - z0 * y, cy = z0 * x - x0 * z, cz = x0 * y - y0 * x, m = Math.sqrt(cx * cx + cy * cy + cz * cz), u = x0 * x + y0 * y + z0 * z, v = m && -d3_acos(u) / m, w = Math.atan2(m, u);
      d3_geo_centroidX2 += v * cx;
      d3_geo_centroidY2 += v * cy;
      d3_geo_centroidZ2 += v * cz;
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_geo_compose(a, b) {
    function compose(x, y) {
      return x = a(x, y), b(x[0], x[1]);
    }
    if (a.invert && b.invert) compose.invert = function(x, y) {
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);
    };
    return compose;
  }
  function d3_true() {
    return true;
  }
  function d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener) {
    var subject = [], clip = [];
    segments.forEach(function(segment) {
      if ((n = segment.length - 1) <= 0) return;
      var n, p0 = segment[0], p1 = segment[n];
      if (d3_geo_sphericalEqual(p0, p1)) {
        listener.lineStart();
        for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);
        listener.lineEnd();
        return;
      }
      var a = new d3_geo_clipPolygonIntersection(p0, segment, null, true), b = new d3_geo_clipPolygonIntersection(p0, null, a, false);
      a.o = b;
      subject.push(a);
      clip.push(b);
      a = new d3_geo_clipPolygonIntersection(p1, segment, null, false);
      b = new d3_geo_clipPolygonIntersection(p1, null, a, true);
      a.o = b;
      subject.push(a);
      clip.push(b);
    });
    clip.sort(compare);
    d3_geo_clipPolygonLinkCircular(subject);
    d3_geo_clipPolygonLinkCircular(clip);
    if (!subject.length) return;
    for (var i = 0, entry = clipStartInside, n = clip.length; i < n; ++i) {
      clip[i].e = entry = !entry;
    }
    var start = subject[0], points, point;
    while (1) {
      var current = start, isSubject = true;
      while (current.v) if ((current = current.n) === start) return;
      points = current.z;
      listener.lineStart();
      do {
        current.v = current.o.v = true;
        if (current.e) {
          if (isSubject) {
            for (var i = 0, n = points.length; i < n; ++i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.n.x, 1, listener);
          }
          current = current.n;
        } else {
          if (isSubject) {
            points = current.p.z;
            for (var i = points.length - 1; i >= 0; --i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.p.x, -1, listener);
          }
          current = current.p;
        }
        current = current.o;
        points = current.z;
        isSubject = !isSubject;
      } while (!current.v);
      listener.lineEnd();
    }
  }
  function d3_geo_clipPolygonLinkCircular(array) {
    if (!(n = array.length)) return;
    var n, i = 0, a = array[0], b;
    while (++i < n) {
      a.n = b = array[i];
      b.p = a;
      a = b;
    }
    a.n = b = array[0];
    b.p = a;
  }
  function d3_geo_clipPolygonIntersection(point, points, other, entry) {
    this.x = point;
    this.z = points;
    this.o = other;
    this.e = entry;
    this.v = false;
    this.n = this.p = null;
  }
  function d3_geo_clip(pointVisible, clipLine, interpolate, clipStart) {
    return function(rotate, listener) {
      var line = clipLine(listener), rotatedClipStart = rotate.invert(clipStart[0], clipStart[1]);
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          segments = [];
          polygon = [];
        },
        polygonEnd: function() {
          clip.point = point;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = d3.merge(segments);
          var clipStartInside = d3_geo_pointInPolygon(rotatedClipStart, polygon);
          if (segments.length) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            d3_geo_clipPolygon(segments, d3_geo_clipSort, clipStartInside, interpolate, listener);
          } else if (clipStartInside) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            interpolate(null, null, 1, listener);
            listener.lineEnd();
          }
          if (polygonStarted) listener.polygonEnd(), polygonStarted = false;
          segments = polygon = null;
        },
        sphere: function() {
          listener.polygonStart();
          listener.lineStart();
          interpolate(null, null, 1, listener);
          listener.lineEnd();
          listener.polygonEnd();
        }
      };
      function point(λ, φ) {
        var point = rotate(λ, φ);
        if (pointVisible(λ = point[0], φ = point[1])) listener.point(λ, φ);
      }
      function pointLine(λ, φ) {
        var point = rotate(λ, φ);
        line.point(point[0], point[1]);
      }
      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }
      function lineEnd() {
        clip.point = point;
        line.lineEnd();
      }
      var segments;
      var buffer = d3_geo_clipBufferListener(), ringListener = clipLine(buffer), polygonStarted = false, polygon, ring;
      function pointRing(λ, φ) {
        ring.push([ λ, φ ]);
        var point = rotate(λ, φ);
        ringListener.point(point[0], point[1]);
      }
      function ringStart() {
        ringListener.lineStart();
        ring = [];
      }
      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringListener.lineEnd();
        var clean = ringListener.clean(), ringSegments = buffer.buffer(), segment, n = ringSegments.length;
        ring.pop();
        polygon.push(ring);
        ring = null;
        if (!n) return;
        if (clean & 1) {
          segment = ringSegments[0];
          var n = segment.length - 1, i = -1, point;
          if (n > 0) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            while (++i < n) listener.point((point = segment[i])[0], point[1]);
            listener.lineEnd();
          }
          return;
        }
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
        segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));
      }
      return clip;
    };
  }
  function d3_geo_clipSegmentLength1(segment) {
    return segment.length > 1;
  }
  function d3_geo_clipBufferListener() {
    var lines = [], line;
    return {
      lineStart: function() {
        lines.push(line = []);
      },
      point: function(λ, φ) {
        line.push([ λ, φ ]);
      },
      lineEnd: d3_noop,
      buffer: function() {
        var buffer = lines;
        lines = [];
        line = null;
        return buffer;
      },
      rejoin: function() {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
      }
    };
  }
  function d3_geo_clipSort(a, b) {
    return ((a = a.x)[0] < 0 ? a[1] - halfπ - ε : halfπ - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfπ - ε : halfπ - b[1]);
  }
  var d3_geo_clipAntimeridian = d3_geo_clip(d3_true, d3_geo_clipAntimeridianLine, d3_geo_clipAntimeridianInterpolate, [ -π, -π / 2 ]);
  function d3_geo_clipAntimeridianLine(listener) {
    var λ0 = NaN, φ0 = NaN, sλ0 = NaN, clean;
    return {
      lineStart: function() {
        listener.lineStart();
        clean = 1;
      },
      point: function(λ1, φ1) {
        var sλ1 = λ1 > 0 ? π : -π, dλ = abs(λ1 - λ0);
        if (abs(dλ - π) < ε) {
          listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? halfπ : -halfπ);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          listener.point(λ1, φ0);
          clean = 0;
        } else if (sλ0 !== sλ1 && dλ >= π) {
          if (abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;
          if (abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;
          φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          clean = 0;
        }
        listener.point(λ0 = λ1, φ0 = φ1);
        sλ0 = sλ1;
      },
      lineEnd: function() {
        listener.lineEnd();
        λ0 = φ0 = NaN;
      },
      clean: function() {
        return 2 - clean;
      }
    };
  }
  function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {
    var cosφ0, cosφ1, sinλ0_λ1 = Math.sin(λ0 - λ1);
    return abs(sinλ0_λ1) > ε ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1) - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0)) / (cosφ0 * cosφ1 * sinλ0_λ1)) : (φ0 + φ1) / 2;
  }
  function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
    var φ;
    if (from == null) {
      φ = direction * halfπ;
      listener.point(-π, φ);
      listener.point(0, φ);
      listener.point(π, φ);
      listener.point(π, 0);
      listener.point(π, -φ);
      listener.point(0, -φ);
      listener.point(-π, -φ);
      listener.point(-π, 0);
      listener.point(-π, φ);
    } else if (abs(from[0] - to[0]) > ε) {
      var s = from[0] < to[0] ? π : -π;
      φ = direction * s / 2;
      listener.point(-s, φ);
      listener.point(0, φ);
      listener.point(s, φ);
    } else {
      listener.point(to[0], to[1]);
    }
  }
  function d3_geo_pointInPolygon(point, polygon) {
    var meridian = point[0], parallel = point[1], meridianNormal = [ Math.sin(meridian), -Math.cos(meridian), 0 ], polarAngle = 0, winding = 0;
    d3_geo_areaRingSum.reset();
    for (var i = 0, n = polygon.length; i < n; ++i) {
      var ring = polygon[i], m = ring.length;
      if (!m) continue;
      var point0 = ring[0], λ0 = point0[0], φ0 = point0[1] / 2 + π / 4, sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), j = 1;
      while (true) {
        if (j === m) j = 0;
        point = ring[j];
        var λ = point[0], φ = point[1] / 2 + π / 4, sinφ = Math.sin(φ), cosφ = Math.cos(φ), dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, antimeridian = adλ > π, k = sinφ0 * sinφ;
        d3_geo_areaRingSum.add(Math.atan2(k * sdλ * Math.sin(adλ), cosφ0 * cosφ + k * Math.cos(adλ)));
        polarAngle += antimeridian ? dλ + sdλ * τ : dλ;
        if (antimeridian ^ λ0 >= meridian ^ λ >= meridian) {
          var arc = d3_geo_cartesianCross(d3_geo_cartesian(point0), d3_geo_cartesian(point));
          d3_geo_cartesianNormalize(arc);
          var intersection = d3_geo_cartesianCross(meridianNormal, arc);
          d3_geo_cartesianNormalize(intersection);
          var φarc = (antimeridian ^ dλ >= 0 ? -1 : 1) * d3_asin(intersection[2]);
          if (parallel > φarc || parallel === φarc && (arc[0] || arc[1])) {
            winding += antimeridian ^ dλ >= 0 ? 1 : -1;
          }
        }
        if (!j++) break;
        λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ, point0 = point;
      }
    }
    return (polarAngle < -ε || polarAngle < ε && d3_geo_areaRingSum < -ε) ^ winding & 1;
  }
  function d3_geo_clipCircle(radius) {
    var cr = Math.cos(radius), smallRadius = cr > 0, notHemisphere = abs(cr) > ε, interpolate = d3_geo_circleInterpolate(radius, 6 * d3_radians);
    return d3_geo_clip(visible, clipLine, interpolate, smallRadius ? [ 0, -radius ] : [ -π, radius - π ]);
    function visible(λ, φ) {
      return Math.cos(λ) * Math.cos(φ) > cr;
    }
    function clipLine(listener) {
      var point0, c0, v0, v00, clean;
      return {
        lineStart: function() {
          v00 = v0 = false;
          clean = 1;
        },
        point: function(λ, φ) {
          var point1 = [ λ, φ ], point2, v = visible(λ, φ), c = smallRadius ? v ? 0 : code(λ, φ) : v ? code(λ + (λ < 0 ? π : -π), φ) : 0;
          if (!point0 && (v00 = v0 = v)) listener.lineStart();
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {
              point1[0] += ε;
              point1[1] += ε;
              v = visible(point1[0], point1[1]);
            }
          }
          if (v !== v0) {
            clean = 0;
            if (v) {
              listener.lineStart();
              point2 = intersect(point1, point0);
              listener.point(point2[0], point2[1]);
            } else {
              point2 = intersect(point0, point1);
              listener.point(point2[0], point2[1]);
              listener.lineEnd();
            }
            point0 = point2;
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            var t;
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0;
              if (smallRadius) {
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
              } else {
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
              }
            }
          }
          if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) {
            listener.point(point1[0], point1[1]);
          }
          point0 = point1, v0 = v, c0 = c;
        },
        lineEnd: function() {
          if (v0) listener.lineEnd();
          point0 = null;
        },
        clean: function() {
          return clean | (v00 && v0) << 1;
        }
      };
    }
    function intersect(a, b, two) {
      var pa = d3_geo_cartesian(a), pb = d3_geo_cartesian(b);
      var n1 = [ 1, 0, 0 ], n2 = d3_geo_cartesianCross(pa, pb), n2n2 = d3_geo_cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
      if (!determinant) return !two && a;
      var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = d3_geo_cartesianCross(n1, n2), A = d3_geo_cartesianScale(n1, c1), B = d3_geo_cartesianScale(n2, c2);
      d3_geo_cartesianAdd(A, B);
      var u = n1xn2, w = d3_geo_cartesianDot(A, u), uu = d3_geo_cartesianDot(u, u), t2 = w * w - uu * (d3_geo_cartesianDot(A, A) - 1);
      if (t2 < 0) return;
      var t = Math.sqrt(t2), q = d3_geo_cartesianScale(u, (-w - t) / uu);
      d3_geo_cartesianAdd(q, A);
      q = d3_geo_spherical(q);
      if (!two) return q;
      var λ0 = a[0], λ1 = b[0], φ0 = a[1], φ1 = b[1], z;
      if (λ1 < λ0) z = λ0, λ0 = λ1, λ1 = z;
      var δλ = λ1 - λ0, polar = abs(δλ - π) < ε, meridian = polar || δλ < ε;
      if (!polar && φ1 < φ0) z = φ0, φ0 = φ1, φ1 = z;
      if (meridian ? polar ? φ0 + φ1 > 0 ^ q[1] < (abs(q[0] - λ0) < ε ? φ0 : φ1) : φ0 <= q[1] && q[1] <= φ1 : δλ > π ^ (λ0 <= q[0] && q[0] <= λ1)) {
        var q1 = d3_geo_cartesianScale(u, (-w + t) / uu);
        d3_geo_cartesianAdd(q1, A);
        return [ q, d3_geo_spherical(q1) ];
      }
    }
    function code(λ, φ) {
      var r = smallRadius ? radius : π - radius, code = 0;
      if (λ < -r) code |= 1; else if (λ > r) code |= 2;
      if (φ < -r) code |= 4; else if (φ > r) code |= 8;
      return code;
    }
  }
  function d3_geom_clipLine(x0, y0, x1, y1) {
    return function(line) {
      var a = line.a, b = line.b, ax = a.x, ay = a.y, bx = b.x, by = b.y, t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay, r;
      r = x0 - ax;
      if (!dx && r > 0) return;
      r /= dx;
      if (dx < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dx > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = x1 - ax;
      if (!dx && r < 0) return;
      r /= dx;
      if (dx < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dx > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      r = y0 - ay;
      if (!dy && r > 0) return;
      r /= dy;
      if (dy < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dy > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = y1 - ay;
      if (!dy && r < 0) return;
      r /= dy;
      if (dy < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dy > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      if (t0 > 0) line.a = {
        x: ax + t0 * dx,
        y: ay + t0 * dy
      };
      if (t1 < 1) line.b = {
        x: ax + t1 * dx,
        y: ay + t1 * dy
      };
      return line;
    };
  }
  var d3_geo_clipExtentMAX = 1e9;
  d3.geo.clipExtent = function() {
    var x0, y0, x1, y1, stream, clip, clipExtent = {
      stream: function(output) {
        if (stream) stream.valid = false;
        stream = clip(output);
        stream.valid = true;
        return stream;
      },
      extent: function(_) {
        if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
        clip = d3_geo_clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]);
        if (stream) stream.valid = false, stream = null;
        return clipExtent;
      }
    };
    return clipExtent.extent([ [ 0, 0 ], [ 960, 500 ] ]);
  };
  function d3_geo_clipExtent(x0, y0, x1, y1) {
    return function(listener) {
      var listener_ = listener, bufferListener = d3_geo_clipBufferListener(), clipLine = d3_geom_clipLine(x0, y0, x1, y1), segments, polygon, ring;
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          listener = bufferListener;
          segments = [];
          polygon = [];
          clean = true;
        },
        polygonEnd: function() {
          listener = listener_;
          segments = d3.merge(segments);
          var clipStartInside = insidePolygon([ x0, y1 ]), inside = clean && clipStartInside, visible = segments.length;
          if (inside || visible) {
            listener.polygonStart();
            if (inside) {
              listener.lineStart();
              interpolate(null, null, 1, listener);
              listener.lineEnd();
            }
            if (visible) {
              d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener);
            }
            listener.polygonEnd();
          }
          segments = polygon = ring = null;
        }
      };
      function insidePolygon(p) {
        var wn = 0, n = polygon.length, y = p[1];
        for (var i = 0; i < n; ++i) {
          for (var j = 1, v = polygon[i], m = v.length, a = v[0], b; j < m; ++j) {
            b = v[j];
            if (a[1] <= y) {
              if (b[1] > y && d3_cross2d(a, b, p) > 0) ++wn;
            } else {
              if (b[1] <= y && d3_cross2d(a, b, p) < 0) --wn;
            }
            a = b;
          }
        }
        return wn !== 0;
      }
      function interpolate(from, to, direction, listener) {
        var a = 0, a1 = 0;
        if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoints(from, to) < 0 ^ direction > 0) {
          do {
            listener.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
          } while ((a = (a + direction + 4) % 4) !== a1);
        } else {
          listener.point(to[0], to[1]);
        }
      }
      function pointVisible(x, y) {
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
      }
      function point(x, y) {
        if (pointVisible(x, y)) listener.point(x, y);
      }
      var x__, y__, v__, x_, y_, v_, first, clean;
      function lineStart() {
        clip.point = linePoint;
        if (polygon) polygon.push(ring = []);
        first = true;
        v_ = false;
        x_ = y_ = NaN;
      }
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__);
          if (v__ && v_) bufferListener.rejoin();
          segments.push(bufferListener.buffer());
        }
        clip.point = point;
        if (v_) listener.lineEnd();
      }
      function linePoint(x, y) {
        x = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, x));
        y = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, y));
        var v = pointVisible(x, y);
        if (polygon) ring.push([ x, y ]);
        if (first) {
          x__ = x, y__ = y, v__ = v;
          first = false;
          if (v) {
            listener.lineStart();
            listener.point(x, y);
          }
        } else {
          if (v && v_) listener.point(x, y); else {
            var l = {
              a: {
                x: x_,
                y: y_
              },
              b: {
                x: x,
                y: y
              }
            };
            if (clipLine(l)) {
              if (!v_) {
                listener.lineStart();
                listener.point(l.a.x, l.a.y);
              }
              listener.point(l.b.x, l.b.y);
              if (!v) listener.lineEnd();
              clean = false;
            } else if (v) {
              listener.lineStart();
              listener.point(x, y);
              clean = false;
            }
          }
        }
        x_ = x, y_ = y, v_ = v;
      }
      return clip;
    };
    function corner(p, direction) {
      return abs(p[0] - x0) < ε ? direction > 0 ? 0 : 3 : abs(p[0] - x1) < ε ? direction > 0 ? 2 : 1 : abs(p[1] - y0) < ε ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;
    }
    function compare(a, b) {
      return comparePoints(a.x, b.x);
    }
    function comparePoints(a, b) {
      var ca = corner(a, 1), cb = corner(b, 1);
      return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];
    }
  }
  function d3_geo_conic(projectAt) {
    var φ0 = 0, φ1 = π / 3, m = d3_geo_projectionMutator(projectAt), p = m(φ0, φ1);
    p.parallels = function(_) {
      if (!arguments.length) return [ φ0 / π * 180, φ1 / π * 180 ];
      return m(φ0 = _[0] * π / 180, φ1 = _[1] * π / 180);
    };
    return p;
  }
  function d3_geo_conicEqualArea(φ0, φ1) {
    var sinφ0 = Math.sin(φ0), n = (sinφ0 + Math.sin(φ1)) / 2, C = 1 + sinφ0 * (2 * n - sinφ0), ρ0 = Math.sqrt(C) / n;
    function forward(λ, φ) {
      var ρ = Math.sqrt(C - 2 * n * Math.sin(φ)) / n;
      return [ ρ * Math.sin(λ *= n), ρ0 - ρ * Math.cos(λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = ρ0 - y;
      return [ Math.atan2(x, ρ0_y) / n, d3_asin((C - (x * x + ρ0_y * ρ0_y) * n * n) / (2 * n)) ];
    };
    return forward;
  }
  (d3.geo.conicEqualArea = function() {
    return d3_geo_conic(d3_geo_conicEqualArea);
  }).raw = d3_geo_conicEqualArea;
  d3.geo.albers = function() {
    return d3.geo.conicEqualArea().rotate([ 96, 0 ]).center([ -.6, 38.7 ]).parallels([ 29.5, 45.5 ]).scale(1070);
  };
  d3.geo.albersUsa = function() {
    var lower48 = d3.geo.albers();
    var alaska = d3.geo.conicEqualArea().rotate([ 154, 0 ]).center([ -2, 58.5 ]).parallels([ 55, 65 ]);
    var hawaii = d3.geo.conicEqualArea().rotate([ 157, 0 ]).center([ -3, 19.9 ]).parallels([ 8, 18 ]);
    var point, pointStream = {
      point: function(x, y) {
        point = [ x, y ];
      }
    }, lower48Point, alaskaPoint, hawaiiPoint;
    function albersUsa(coordinates) {
      var x = coordinates[0], y = coordinates[1];
      point = null;
      (lower48Point(x, y), point) || (alaskaPoint(x, y), point) || hawaiiPoint(x, y);
      return point;
    }
    albersUsa.invert = function(coordinates) {
      var k = lower48.scale(), t = lower48.translate(), x = (coordinates[0] - t[0]) / k, y = (coordinates[1] - t[1]) / k;
      return (y >= .12 && y < .234 && x >= -.425 && x < -.214 ? alaska : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii : lower48).invert(coordinates);
    };
    albersUsa.stream = function(stream) {
      var lower48Stream = lower48.stream(stream), alaskaStream = alaska.stream(stream), hawaiiStream = hawaii.stream(stream);
      return {
        point: function(x, y) {
          lower48Stream.point(x, y);
          alaskaStream.point(x, y);
          hawaiiStream.point(x, y);
        },
        sphere: function() {
          lower48Stream.sphere();
          alaskaStream.sphere();
          hawaiiStream.sphere();
        },
        lineStart: function() {
          lower48Stream.lineStart();
          alaskaStream.lineStart();
          hawaiiStream.lineStart();
        },
        lineEnd: function() {
          lower48Stream.lineEnd();
          alaskaStream.lineEnd();
          hawaiiStream.lineEnd();
        },
        polygonStart: function() {
          lower48Stream.polygonStart();
          alaskaStream.polygonStart();
          hawaiiStream.polygonStart();
        },
        polygonEnd: function() {
          lower48Stream.polygonEnd();
          alaskaStream.polygonEnd();
          hawaiiStream.polygonEnd();
        }
      };
    };
    albersUsa.precision = function(_) {
      if (!arguments.length) return lower48.precision();
      lower48.precision(_);
      alaska.precision(_);
      hawaii.precision(_);
      return albersUsa;
    };
    albersUsa.scale = function(_) {
      if (!arguments.length) return lower48.scale();
      lower48.scale(_);
      alaska.scale(_ * .35);
      hawaii.scale(_);
      return albersUsa.translate(lower48.translate());
    };
    albersUsa.translate = function(_) {
      if (!arguments.length) return lower48.translate();
      var k = lower48.scale(), x = +_[0], y = +_[1];
      lower48Point = lower48.translate(_).clipExtent([ [ x - .455 * k, y - .238 * k ], [ x + .455 * k, y + .238 * k ] ]).stream(pointStream).point;
      alaskaPoint = alaska.translate([ x - .307 * k, y + .201 * k ]).clipExtent([ [ x - .425 * k + ε, y + .12 * k + ε ], [ x - .214 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      hawaiiPoint = hawaii.translate([ x - .205 * k, y + .212 * k ]).clipExtent([ [ x - .214 * k + ε, y + .166 * k + ε ], [ x - .115 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      return albersUsa;
    };
    return albersUsa.scale(1070);
  };
  var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_pathAreaPolygon = 0;
      d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;
      d3_geo_pathAreaSum += abs(d3_geo_pathAreaPolygon / 2);
    }
  };
  function d3_geo_pathAreaRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathArea.point = function(x, y) {
      d3_geo_pathArea.point = nextPoint;
      x00 = x0 = x, y00 = y0 = y;
    };
    function nextPoint(x, y) {
      d3_geo_pathAreaPolygon += y0 * x - x0 * y;
      x0 = x, y0 = y;
    }
    d3_geo_pathArea.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  var d3_geo_pathBoundsX0, d3_geo_pathBoundsY0, d3_geo_pathBoundsX1, d3_geo_pathBoundsY1;
  var d3_geo_pathBounds = {
    point: d3_geo_pathBoundsPoint,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_pathBoundsPoint(x, y) {
    if (x < d3_geo_pathBoundsX0) d3_geo_pathBoundsX0 = x;
    if (x > d3_geo_pathBoundsX1) d3_geo_pathBoundsX1 = x;
    if (y < d3_geo_pathBoundsY0) d3_geo_pathBoundsY0 = y;
    if (y > d3_geo_pathBoundsY1) d3_geo_pathBoundsY1 = y;
  }
  function d3_geo_pathBuffer() {
    var pointCircle = d3_geo_pathBufferCircle(4.5), buffer = [];
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointCircle = d3_geo_pathBufferCircle(_);
        return stream;
      },
      result: function() {
        if (buffer.length) {
          var result = buffer.join("");
          buffer = [];
          return result;
        }
      }
    };
    function point(x, y) {
      buffer.push("M", x, ",", y, pointCircle);
    }
    function pointLineStart(x, y) {
      buffer.push("M", x, ",", y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      buffer.push("L", x, ",", y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      buffer.push("Z");
    }
    return stream;
  }
  function d3_geo_pathBufferCircle(radius) {
    return "m0," + radius + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius + "z";
  }
  var d3_geo_pathCentroid = {
    point: d3_geo_pathCentroidPoint,
    lineStart: d3_geo_pathCentroidLineStart,
    lineEnd: d3_geo_pathCentroidLineEnd,
    polygonStart: function() {
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;
      d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;
    }
  };
  function d3_geo_pathCentroidPoint(x, y) {
    d3_geo_centroidX0 += x;
    d3_geo_centroidY0 += y;
    ++d3_geo_centroidZ0;
  }
  function d3_geo_pathCentroidLineStart() {
    var x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
  }
  function d3_geo_pathCentroidLineEnd() {
    d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
  }
  function d3_geo_pathCentroidRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x00 = x0 = x, y00 = y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      z = y0 * x - x0 * y;
      d3_geo_centroidX2 += z * (x0 + x);
      d3_geo_centroidY2 += z * (y0 + y);
      d3_geo_centroidZ2 += z * 3;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
    d3_geo_pathCentroid.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  function d3_geo_pathContext(context) {
    var pointRadius = 4.5;
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointRadius = _;
        return stream;
      },
      result: d3_noop
    };
    function point(x, y) {
      context.moveTo(x + pointRadius, y);
      context.arc(x, y, pointRadius, 0, τ);
    }
    function pointLineStart(x, y) {
      context.moveTo(x, y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      context.lineTo(x, y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      context.closePath();
    }
    return stream;
  }
  function d3_geo_resample(project) {
    var δ2 = .5, cosMinDistance = Math.cos(30 * d3_radians), maxDepth = 16;
    function resample(stream) {
      return (maxDepth ? resampleRecursive : resampleNone)(stream);
    }
    function resampleNone(stream) {
      return d3_geo_transformPoint(stream, function(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      });
    }
    function resampleRecursive(stream) {
      var λ00, φ00, x00, y00, a00, b00, c00, λ0, x0, y0, a0, b0, c0;
      var resample = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          stream.polygonStart();
          resample.lineStart = ringStart;
        },
        polygonEnd: function() {
          stream.polygonEnd();
          resample.lineStart = lineStart;
        }
      };
      function point(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      }
      function lineStart() {
        x0 = NaN;
        resample.point = linePoint;
        stream.lineStart();
      }
      function linePoint(λ, φ) {
        var c = d3_geo_cartesian([ λ, φ ]), p = project(λ, φ);
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x0 = p[0], y0 = p[1], λ0 = λ, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x0, y0);
      }
      function lineEnd() {
        resample.point = point;
        stream.lineEnd();
      }
      function ringStart() {
        lineStart();
        resample.point = ringPoint;
        resample.lineEnd = ringEnd;
      }
      function ringPoint(λ, φ) {
        linePoint(λ00 = λ, φ00 = φ), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
        resample.point = linePoint;
      }
      function ringEnd() {
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x00, y00, λ00, a00, b00, c00, maxDepth, stream);
        resample.lineEnd = lineEnd;
        lineEnd();
      }
      return resample;
    }
    function resampleLineTo(x0, y0, λ0, a0, b0, c0, x1, y1, λ1, a1, b1, c1, depth, stream) {
      var dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy;
      if (d2 > 4 * δ2 && depth--) {
        var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = Math.sqrt(a * a + b * b + c * c), φ2 = Math.asin(c /= m), λ2 = abs(abs(c) - 1) < ε || abs(λ0 - λ1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a), p = project(λ2, φ2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > δ2 || abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
          resampleLineTo(x0, y0, λ0, a0, b0, c0, x2, y2, λ2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, λ2, a, b, c, x1, y1, λ1, a1, b1, c1, depth, stream);
        }
      }
    }
    resample.precision = function(_) {
      if (!arguments.length) return Math.sqrt(δ2);
      maxDepth = (δ2 = _ * _) > 0 && 16;
      return resample;
    };
    return resample;
  }
  d3.geo.path = function() {
    var pointRadius = 4.5, projection, context, projectStream, contextStream, cacheStream;
    function path(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
        if (!cacheStream || !cacheStream.valid) cacheStream = projectStream(contextStream);
        d3.geo.stream(object, cacheStream);
      }
      return contextStream.result();
    }
    path.area = function(object) {
      d3_geo_pathAreaSum = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathArea));
      return d3_geo_pathAreaSum;
    };
    path.centroid = function(object) {
      d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathCentroid));
      return d3_geo_centroidZ2 ? [ d3_geo_centroidX2 / d3_geo_centroidZ2, d3_geo_centroidY2 / d3_geo_centroidZ2 ] : d3_geo_centroidZ1 ? [ d3_geo_centroidX1 / d3_geo_centroidZ1, d3_geo_centroidY1 / d3_geo_centroidZ1 ] : d3_geo_centroidZ0 ? [ d3_geo_centroidX0 / d3_geo_centroidZ0, d3_geo_centroidY0 / d3_geo_centroidZ0 ] : [ NaN, NaN ];
    };
    path.bounds = function(object) {
      d3_geo_pathBoundsX1 = d3_geo_pathBoundsY1 = -(d3_geo_pathBoundsX0 = d3_geo_pathBoundsY0 = Infinity);
      d3.geo.stream(object, projectStream(d3_geo_pathBounds));
      return [ [ d3_geo_pathBoundsX0, d3_geo_pathBoundsY0 ], [ d3_geo_pathBoundsX1, d3_geo_pathBoundsY1 ] ];
    };
    path.projection = function(_) {
      if (!arguments.length) return projection;
      projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;
      return reset();
    };
    path.context = function(_) {
      if (!arguments.length) return context;
      contextStream = (context = _) == null ? new d3_geo_pathBuffer() : new d3_geo_pathContext(_);
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
      return reset();
    };
    path.pointRadius = function(_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
      return path;
    };
    function reset() {
      cacheStream = null;
      return path;
    }
    return path.projection(d3.geo.albersUsa()).context(null);
  };
  function d3_geo_pathProjectStream(project) {
    var resample = d3_geo_resample(function(x, y) {
      return project([ x * d3_degrees, y * d3_degrees ]);
    });
    return function(stream) {
      return d3_geo_projectionRadians(resample(stream));
    };
  }
  d3.geo.transform = function(methods) {
    return {
      stream: function(stream) {
        var transform = new d3_geo_transform(stream);
        for (var k in methods) transform[k] = methods[k];
        return transform;
      }
    };
  };
  function d3_geo_transform(stream) {
    this.stream = stream;
  }
  d3_geo_transform.prototype = {
    point: function(x, y) {
      this.stream.point(x, y);
    },
    sphere: function() {
      this.stream.sphere();
    },
    lineStart: function() {
      this.stream.lineStart();
    },
    lineEnd: function() {
      this.stream.lineEnd();
    },
    polygonStart: function() {
      this.stream.polygonStart();
    },
    polygonEnd: function() {
      this.stream.polygonEnd();
    }
  };
  function d3_geo_transformPoint(stream, point) {
    return {
      point: point,
      sphere: function() {
        stream.sphere();
      },
      lineStart: function() {
        stream.lineStart();
      },
      lineEnd: function() {
        stream.lineEnd();
      },
      polygonStart: function() {
        stream.polygonStart();
      },
      polygonEnd: function() {
        stream.polygonEnd();
      }
    };
  }
  d3.geo.projection = d3_geo_projection;
  d3.geo.projectionMutator = d3_geo_projectionMutator;
  function d3_geo_projection(project) {
    return d3_geo_projectionMutator(function() {
      return project;
    })();
  }
  function d3_geo_projectionMutator(projectAt) {
    var project, rotate, projectRotate, projectResample = d3_geo_resample(function(x, y) {
      x = project(x, y);
      return [ x[0] * k + δx, δy - x[1] * k ];
    }), k = 150, x = 480, y = 250, λ = 0, φ = 0, δλ = 0, δφ = 0, δγ = 0, δx, δy, preclip = d3_geo_clipAntimeridian, postclip = d3_identity, clipAngle = null, clipExtent = null, stream;
    function projection(point) {
      point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);
      return [ point[0] * k + δx, δy - point[1] * k ];
    }
    function invert(point) {
      point = projectRotate.invert((point[0] - δx) / k, (δy - point[1]) / k);
      return point && [ point[0] * d3_degrees, point[1] * d3_degrees ];
    }
    projection.stream = function(output) {
      if (stream) stream.valid = false;
      stream = d3_geo_projectionRadians(preclip(rotate, projectResample(postclip(output))));
      stream.valid = true;
      return stream;
    };
    projection.clipAngle = function(_) {
      if (!arguments.length) return clipAngle;
      preclip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle((clipAngle = +_) * d3_radians);
      return invalidate();
    };
    projection.clipExtent = function(_) {
      if (!arguments.length) return clipExtent;
      clipExtent = _;
      postclip = _ ? d3_geo_clipExtent(_[0][0], _[0][1], _[1][0], _[1][1]) : d3_identity;
      return invalidate();
    };
    projection.scale = function(_) {
      if (!arguments.length) return k;
      k = +_;
      return reset();
    };
    projection.translate = function(_) {
      if (!arguments.length) return [ x, y ];
      x = +_[0];
      y = +_[1];
      return reset();
    };
    projection.center = function(_) {
      if (!arguments.length) return [ λ * d3_degrees, φ * d3_degrees ];
      λ = _[0] % 360 * d3_radians;
      φ = _[1] % 360 * d3_radians;
      return reset();
    };
    projection.rotate = function(_) {
      if (!arguments.length) return [ δλ * d3_degrees, δφ * d3_degrees, δγ * d3_degrees ];
      δλ = _[0] % 360 * d3_radians;
      δφ = _[1] % 360 * d3_radians;
      δγ = _.length > 2 ? _[2] % 360 * d3_radians : 0;
      return reset();
    };
    d3.rebind(projection, projectResample, "precision");
    function reset() {
      projectRotate = d3_geo_compose(rotate = d3_geo_rotation(δλ, δφ, δγ), project);
      var center = project(λ, φ);
      δx = x - center[0] * k;
      δy = y + center[1] * k;
      return invalidate();
    }
    function invalidate() {
      if (stream) stream.valid = false, stream = null;
      return projection;
    }
    return function() {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return reset();
    };
  }
  function d3_geo_projectionRadians(stream) {
    return d3_geo_transformPoint(stream, function(x, y) {
      stream.point(x * d3_radians, y * d3_radians);
    });
  }
  function d3_geo_equirectangular(λ, φ) {
    return [ λ, φ ];
  }
  (d3.geo.equirectangular = function() {
    return d3_geo_projection(d3_geo_equirectangular);
  }).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;
  d3.geo.rotation = function(rotate) {
    rotate = d3_geo_rotation(rotate[0] % 360 * d3_radians, rotate[1] * d3_radians, rotate.length > 2 ? rotate[2] * d3_radians : 0);
    function forward(coordinates) {
      coordinates = rotate(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    }
    forward.invert = function(coordinates) {
      coordinates = rotate.invert(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    };
    return forward;
  };
  function d3_geo_identityRotation(λ, φ) {
    return [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
  }
  d3_geo_identityRotation.invert = d3_geo_equirectangular;
  function d3_geo_rotation(δλ, δφ, δγ) {
    return δλ ? δφ || δγ ? d3_geo_compose(d3_geo_rotationλ(δλ), d3_geo_rotationφγ(δφ, δγ)) : d3_geo_rotationλ(δλ) : δφ || δγ ? d3_geo_rotationφγ(δφ, δγ) : d3_geo_identityRotation;
  }
  function d3_geo_forwardRotationλ(δλ) {
    return function(λ, φ) {
      return λ += δλ, [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
    };
  }
  function d3_geo_rotationλ(δλ) {
    var rotation = d3_geo_forwardRotationλ(δλ);
    rotation.invert = d3_geo_forwardRotationλ(-δλ);
    return rotation;
  }
  function d3_geo_rotationφγ(δφ, δγ) {
    var cosδφ = Math.cos(δφ), sinδφ = Math.sin(δφ), cosδγ = Math.cos(δγ), sinδγ = Math.sin(δγ);
    function rotation(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδφ + x * sinδφ;
      return [ Math.atan2(y * cosδγ - k * sinδγ, x * cosδφ - z * sinδφ), d3_asin(k * cosδγ + y * sinδγ) ];
    }
    rotation.invert = function(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδγ - y * sinδγ;
      return [ Math.atan2(y * cosδγ + z * sinδγ, x * cosδφ + k * sinδφ), d3_asin(k * cosδφ - x * sinδφ) ];
    };
    return rotation;
  }
  d3.geo.circle = function() {
    var origin = [ 0, 0 ], angle, precision = 6, interpolate;
    function circle() {
      var center = typeof origin === "function" ? origin.apply(this, arguments) : origin, rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert, ring = [];
      interpolate(null, null, 1, {
        point: function(x, y) {
          ring.push(x = rotate(x, y));
          x[0] *= d3_degrees, x[1] *= d3_degrees;
        }
      });
      return {
        type: "Polygon",
        coordinates: [ ring ]
      };
    }
    circle.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return circle;
    };
    circle.angle = function(x) {
      if (!arguments.length) return angle;
      interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);
      return circle;
    };
    circle.precision = function(_) {
      if (!arguments.length) return precision;
      interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);
      return circle;
    };
    return circle.angle(90);
  };
  function d3_geo_circleInterpolate(radius, precision) {
    var cr = Math.cos(radius), sr = Math.sin(radius);
    return function(from, to, direction, listener) {
      var step = direction * precision;
      if (from != null) {
        from = d3_geo_circleAngle(cr, from);
        to = d3_geo_circleAngle(cr, to);
        if (direction > 0 ? from < to : from > to) from += direction * τ;
      } else {
        from = radius + direction * τ;
        to = radius - .5 * step;
      }
      for (var point, t = from; direction > 0 ? t > to : t < to; t -= step) {
        listener.point((point = d3_geo_spherical([ cr, -sr * Math.cos(t), -sr * Math.sin(t) ]))[0], point[1]);
      }
    };
  }
  function d3_geo_circleAngle(cr, point) {
    var a = d3_geo_cartesian(point);
    a[0] -= cr;
    d3_geo_cartesianNormalize(a);
    var angle = d3_acos(-a[1]);
    return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - ε) % (2 * Math.PI);
  }
  d3.geo.distance = function(a, b) {
    var Δλ = (b[0] - a[0]) * d3_radians, φ0 = a[1] * d3_radians, φ1 = b[1] * d3_radians, sinΔλ = Math.sin(Δλ), cosΔλ = Math.cos(Δλ), sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1), t;
    return Math.atan2(Math.sqrt((t = cosφ1 * sinΔλ) * t + (t = cosφ0 * sinφ1 - sinφ0 * cosφ1 * cosΔλ) * t), sinφ0 * sinφ1 + cosφ0 * cosφ1 * cosΔλ);
  };
  d3.geo.graticule = function() {
    var x1, x0, X1, X0, y1, y0, Y1, Y0, dx = 10, dy = dx, DX = 90, DY = 360, x, y, X, Y, precision = 2.5;
    function graticule() {
      return {
        type: "MultiLineString",
        coordinates: lines()
      };
    }
    function lines() {
      return d3.range(Math.ceil(X0 / DX) * DX, X1, DX).map(X).concat(d3.range(Math.ceil(Y0 / DY) * DY, Y1, DY).map(Y)).concat(d3.range(Math.ceil(x0 / dx) * dx, x1, dx).filter(function(x) {
        return abs(x % DX) > ε;
      }).map(x)).concat(d3.range(Math.ceil(y0 / dy) * dy, y1, dy).filter(function(y) {
        return abs(y % DY) > ε;
      }).map(y));
    }
    graticule.lines = function() {
      return lines().map(function(coordinates) {
        return {
          type: "LineString",
          coordinates: coordinates
        };
      });
    };
    graticule.outline = function() {
      return {
        type: "Polygon",
        coordinates: [ X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1)) ]
      };
    };
    graticule.extent = function(_) {
      if (!arguments.length) return graticule.minorExtent();
      return graticule.majorExtent(_).minorExtent(_);
    };
    graticule.majorExtent = function(_) {
      if (!arguments.length) return [ [ X0, Y0 ], [ X1, Y1 ] ];
      X0 = +_[0][0], X1 = +_[1][0];
      Y0 = +_[0][1], Y1 = +_[1][1];
      if (X0 > X1) _ = X0, X0 = X1, X1 = _;
      if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
      return graticule.precision(precision);
    };
    graticule.minorExtent = function(_) {
      if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
      x0 = +_[0][0], x1 = +_[1][0];
      y0 = +_[0][1], y1 = +_[1][1];
      if (x0 > x1) _ = x0, x0 = x1, x1 = _;
      if (y0 > y1) _ = y0, y0 = y1, y1 = _;
      return graticule.precision(precision);
    };
    graticule.step = function(_) {
      if (!arguments.length) return graticule.minorStep();
      return graticule.majorStep(_).minorStep(_);
    };
    graticule.majorStep = function(_) {
      if (!arguments.length) return [ DX, DY ];
      DX = +_[0], DY = +_[1];
      return graticule;
    };
    graticule.minorStep = function(_) {
      if (!arguments.length) return [ dx, dy ];
      dx = +_[0], dy = +_[1];
      return graticule;
    };
    graticule.precision = function(_) {
      if (!arguments.length) return precision;
      precision = +_;
      x = d3_geo_graticuleX(y0, y1, 90);
      y = d3_geo_graticuleY(x0, x1, precision);
      X = d3_geo_graticuleX(Y0, Y1, 90);
      Y = d3_geo_graticuleY(X0, X1, precision);
      return graticule;
    };
    return graticule.majorExtent([ [ -180, -90 + ε ], [ 180, 90 - ε ] ]).minorExtent([ [ -180, -80 - ε ], [ 180, 80 + ε ] ]);
  };
  function d3_geo_graticuleX(y0, y1, dy) {
    var y = d3.range(y0, y1 - ε, dy).concat(y1);
    return function(x) {
      return y.map(function(y) {
        return [ x, y ];
      });
    };
  }
  function d3_geo_graticuleY(x0, x1, dx) {
    var x = d3.range(x0, x1 - ε, dx).concat(x1);
    return function(y) {
      return x.map(function(x) {
        return [ x, y ];
      });
    };
  }
  function d3_source(d) {
    return d.source;
  }
  function d3_target(d) {
    return d.target;
  }
  d3.geo.greatArc = function() {
    var source = d3_source, source_, target = d3_target, target_;
    function greatArc() {
      return {
        type: "LineString",
        coordinates: [ source_ || source.apply(this, arguments), target_ || target.apply(this, arguments) ]
      };
    }
    greatArc.distance = function() {
      return d3.geo.distance(source_ || source.apply(this, arguments), target_ || target.apply(this, arguments));
    };
    greatArc.source = function(_) {
      if (!arguments.length) return source;
      source = _, source_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.target = function(_) {
      if (!arguments.length) return target;
      target = _, target_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.precision = function() {
      return arguments.length ? greatArc : 0;
    };
    return greatArc;
  };
  d3.geo.interpolate = function(source, target) {
    return d3_geo_interpolate(source[0] * d3_radians, source[1] * d3_radians, target[0] * d3_radians, target[1] * d3_radians);
  };
  function d3_geo_interpolate(x0, y0, x1, y1) {
    var cy0 = Math.cos(y0), sy0 = Math.sin(y0), cy1 = Math.cos(y1), sy1 = Math.sin(y1), kx0 = cy0 * Math.cos(x0), ky0 = cy0 * Math.sin(x0), kx1 = cy1 * Math.cos(x1), ky1 = cy1 * Math.sin(x1), d = 2 * Math.asin(Math.sqrt(d3_haversin(y1 - y0) + cy0 * cy1 * d3_haversin(x1 - x0))), k = 1 / Math.sin(d);
    var interpolate = d ? function(t) {
      var B = Math.sin(t *= d) * k, A = Math.sin(d - t) * k, x = A * kx0 + B * kx1, y = A * ky0 + B * ky1, z = A * sy0 + B * sy1;
      return [ Math.atan2(y, x) * d3_degrees, Math.atan2(z, Math.sqrt(x * x + y * y)) * d3_degrees ];
    } : function() {
      return [ x0 * d3_degrees, y0 * d3_degrees ];
    };
    interpolate.distance = d;
    return interpolate;
  }
  d3.geo.length = function(object) {
    d3_geo_lengthSum = 0;
    d3.geo.stream(object, d3_geo_length);
    return d3_geo_lengthSum;
  };
  var d3_geo_lengthSum;
  var d3_geo_length = {
    sphere: d3_noop,
    point: d3_noop,
    lineStart: d3_geo_lengthLineStart,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_lengthLineStart() {
    var λ0, sinφ0, cosφ0;
    d3_geo_length.point = function(λ, φ) {
      λ0 = λ * d3_radians, sinφ0 = Math.sin(φ *= d3_radians), cosφ0 = Math.cos(φ);
      d3_geo_length.point = nextPoint;
    };
    d3_geo_length.lineEnd = function() {
      d3_geo_length.point = d3_geo_length.lineEnd = d3_noop;
    };
    function nextPoint(λ, φ) {
      var sinφ = Math.sin(φ *= d3_radians), cosφ = Math.cos(φ), t = abs((λ *= d3_radians) - λ0), cosΔλ = Math.cos(t);
      d3_geo_lengthSum += Math.atan2(Math.sqrt((t = cosφ * Math.sin(t)) * t + (t = cosφ0 * sinφ - sinφ0 * cosφ * cosΔλ) * t), sinφ0 * sinφ + cosφ0 * cosφ * cosΔλ);
      λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ;
    }
  }
  function d3_geo_azimuthal(scale, angle) {
    function azimuthal(λ, φ) {
      var cosλ = Math.cos(λ), cosφ = Math.cos(φ), k = scale(cosλ * cosφ);
      return [ k * cosφ * Math.sin(λ), k * Math.sin(φ) ];
    }
    azimuthal.invert = function(x, y) {
      var ρ = Math.sqrt(x * x + y * y), c = angle(ρ), sinc = Math.sin(c), cosc = Math.cos(c);
      return [ Math.atan2(x * sinc, ρ * cosc), Math.asin(ρ && y * sinc / ρ) ];
    };
    return azimuthal;
  }
  var d3_geo_azimuthalEqualArea = d3_geo_azimuthal(function(cosλcosφ) {
    return Math.sqrt(2 / (1 + cosλcosφ));
  }, function(ρ) {
    return 2 * Math.asin(ρ / 2);
  });
  (d3.geo.azimuthalEqualArea = function() {
    return d3_geo_projection(d3_geo_azimuthalEqualArea);
  }).raw = d3_geo_azimuthalEqualArea;
  var d3_geo_azimuthalEquidistant = d3_geo_azimuthal(function(cosλcosφ) {
    var c = Math.acos(cosλcosφ);
    return c && c / Math.sin(c);
  }, d3_identity);
  (d3.geo.azimuthalEquidistant = function() {
    return d3_geo_projection(d3_geo_azimuthalEquidistant);
  }).raw = d3_geo_azimuthalEquidistant;
  function d3_geo_conicConformal(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), t = function(φ) {
      return Math.tan(π / 4 + φ / 2);
    }, n = φ0 === φ1 ? Math.sin(φ0) : Math.log(cosφ0 / Math.cos(φ1)) / Math.log(t(φ1) / t(φ0)), F = cosφ0 * Math.pow(t(φ0), n) / n;
    if (!n) return d3_geo_mercator;
    function forward(λ, φ) {
      if (F > 0) {
        if (φ < -halfπ + ε) φ = -halfπ + ε;
      } else {
        if (φ > halfπ - ε) φ = halfπ - ε;
      }
      var ρ = F / Math.pow(t(φ), n);
      return [ ρ * Math.sin(n * λ), F - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = F - y, ρ = d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y);
      return [ Math.atan2(x, ρ0_y) / n, 2 * Math.atan(Math.pow(F / ρ, 1 / n)) - halfπ ];
    };
    return forward;
  }
  (d3.geo.conicConformal = function() {
    return d3_geo_conic(d3_geo_conicConformal);
  }).raw = d3_geo_conicConformal;
  function d3_geo_conicEquidistant(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), n = φ0 === φ1 ? Math.sin(φ0) : (cosφ0 - Math.cos(φ1)) / (φ1 - φ0), G = cosφ0 / n + φ0;
    if (abs(n) < ε) return d3_geo_equirectangular;
    function forward(λ, φ) {
      var ρ = G - φ;
      return [ ρ * Math.sin(n * λ), G - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = G - y;
      return [ Math.atan2(x, ρ0_y) / n, G - d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y) ];
    };
    return forward;
  }
  (d3.geo.conicEquidistant = function() {
    return d3_geo_conic(d3_geo_conicEquidistant);
  }).raw = d3_geo_conicEquidistant;
  var d3_geo_gnomonic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / cosλcosφ;
  }, Math.atan);
  (d3.geo.gnomonic = function() {
    return d3_geo_projection(d3_geo_gnomonic);
  }).raw = d3_geo_gnomonic;
  function d3_geo_mercator(λ, φ) {
    return [ λ, Math.log(Math.tan(π / 4 + φ / 2)) ];
  }
  d3_geo_mercator.invert = function(x, y) {
    return [ x, 2 * Math.atan(Math.exp(y)) - halfπ ];
  };
  function d3_geo_mercatorProjection(project) {
    var m = d3_geo_projection(project), scale = m.scale, translate = m.translate, clipExtent = m.clipExtent, clipAuto;
    m.scale = function() {
      var v = scale.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.translate = function() {
      var v = translate.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.clipExtent = function(_) {
      var v = clipExtent.apply(m, arguments);
      if (v === m) {
        if (clipAuto = _ == null) {
          var k = π * scale(), t = translate();
          clipExtent([ [ t[0] - k, t[1] - k ], [ t[0] + k, t[1] + k ] ]);
        }
      } else if (clipAuto) {
        v = null;
      }
      return v;
    };
    return m.clipExtent(null);
  }
  (d3.geo.mercator = function() {
    return d3_geo_mercatorProjection(d3_geo_mercator);
  }).raw = d3_geo_mercator;
  var d3_geo_orthographic = d3_geo_azimuthal(function() {
    return 1;
  }, Math.asin);
  (d3.geo.orthographic = function() {
    return d3_geo_projection(d3_geo_orthographic);
  }).raw = d3_geo_orthographic;
  var d3_geo_stereographic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / (1 + cosλcosφ);
  }, function(ρ) {
    return 2 * Math.atan(ρ);
  });
  (d3.geo.stereographic = function() {
    return d3_geo_projection(d3_geo_stereographic);
  }).raw = d3_geo_stereographic;
  function d3_geo_transverseMercator(λ, φ) {
    return [ Math.log(Math.tan(π / 4 + φ / 2)), -λ ];
  }
  d3_geo_transverseMercator.invert = function(x, y) {
    return [ -y, 2 * Math.atan(Math.exp(x)) - halfπ ];
  };
  (d3.geo.transverseMercator = function() {
    var projection = d3_geo_mercatorProjection(d3_geo_transverseMercator), center = projection.center, rotate = projection.rotate;
    projection.center = function(_) {
      return _ ? center([ -_[1], _[0] ]) : (_ = center(), [ _[1], -_[0] ]);
    };
    projection.rotate = function(_) {
      return _ ? rotate([ _[0], _[1], _.length > 2 ? _[2] + 90 : 90 ]) : (_ = rotate(), 
      [ _[0], _[1], _[2] - 90 ]);
    };
    return rotate([ 0, 0, 90 ]);
  }).raw = d3_geo_transverseMercator;
  d3.geom = {};
  function d3_geom_pointX(d) {
    return d[0];
  }
  function d3_geom_pointY(d) {
    return d[1];
  }
  d3.geom.hull = function(vertices) {
    var x = d3_geom_pointX, y = d3_geom_pointY;
    if (arguments.length) return hull(vertices);
    function hull(data) {
      if (data.length < 3) return [];
      var fx = d3_functor(x), fy = d3_functor(y), i, n = data.length, points = [], flippedPoints = [];
      for (i = 0; i < n; i++) {
        points.push([ +fx.call(this, data[i], i), +fy.call(this, data[i], i), i ]);
      }
      points.sort(d3_geom_hullOrder);
      for (i = 0; i < n; i++) flippedPoints.push([ points[i][0], -points[i][1] ]);
      var upper = d3_geom_hullUpper(points), lower = d3_geom_hullUpper(flippedPoints);
      var skipLeft = lower[0] === upper[0], skipRight = lower[lower.length - 1] === upper[upper.length - 1], polygon = [];
      for (i = upper.length - 1; i >= 0; --i) polygon.push(data[points[upper[i]][2]]);
      for (i = +skipLeft; i < lower.length - skipRight; ++i) polygon.push(data[points[lower[i]][2]]);
      return polygon;
    }
    hull.x = function(_) {
      return arguments.length ? (x = _, hull) : x;
    };
    hull.y = function(_) {
      return arguments.length ? (y = _, hull) : y;
    };
    return hull;
  };
  function d3_geom_hullUpper(points) {
    var n = points.length, hull = [ 0, 1 ], hs = 2;
    for (var i = 2; i < n; i++) {
      while (hs > 1 && d3_cross2d(points[hull[hs - 2]], points[hull[hs - 1]], points[i]) <= 0) --hs;
      hull[hs++] = i;
    }
    return hull.slice(0, hs);
  }
  function d3_geom_hullOrder(a, b) {
    return a[0] - b[0] || a[1] - b[1];
  }
  d3.geom.polygon = function(coordinates) {
    d3_subclass(coordinates, d3_geom_polygonPrototype);
    return coordinates;
  };
  var d3_geom_polygonPrototype = d3.geom.polygon.prototype = [];
  d3_geom_polygonPrototype.area = function() {
    var i = -1, n = this.length, a, b = this[n - 1], area = 0;
    while (++i < n) {
      a = b;
      b = this[i];
      area += a[1] * b[0] - a[0] * b[1];
    }
    return area * .5;
  };
  d3_geom_polygonPrototype.centroid = function(k) {
    var i = -1, n = this.length, x = 0, y = 0, a, b = this[n - 1], c;
    if (!arguments.length) k = -1 / (6 * this.area());
    while (++i < n) {
      a = b;
      b = this[i];
      c = a[0] * b[1] - b[0] * a[1];
      x += (a[0] + b[0]) * c;
      y += (a[1] + b[1]) * c;
    }
    return [ x * k, y * k ];
  };
  d3_geom_polygonPrototype.clip = function(subject) {
    var input, closed = d3_geom_polygonClosed(subject), i = -1, n = this.length - d3_geom_polygonClosed(this), j, m, a = this[n - 1], b, c, d;
    while (++i < n) {
      input = subject.slice();
      subject.length = 0;
      b = this[i];
      c = input[(m = input.length - closed) - 1];
      j = -1;
      while (++j < m) {
        d = input[j];
        if (d3_geom_polygonInside(d, a, b)) {
          if (!d3_geom_polygonInside(c, a, b)) {
            subject.push(d3_geom_polygonIntersect(c, d, a, b));
          }
          subject.push(d);
        } else if (d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        c = d;
      }
      if (closed) subject.push(subject[0]);
      a = b;
    }
    return subject;
  };
  function d3_geom_polygonInside(p, a, b) {
    return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
  }
  function d3_geom_polygonIntersect(c, d, a, b) {
    var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3, y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3, ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
    return [ x1 + ua * x21, y1 + ua * y21 ];
  }
  function d3_geom_polygonClosed(coordinates) {
    var a = coordinates[0], b = coordinates[coordinates.length - 1];
    return !(a[0] - b[0] || a[1] - b[1]);
  }
  var d3_geom_voronoiEdges, d3_geom_voronoiCells, d3_geom_voronoiBeaches, d3_geom_voronoiBeachPool = [], d3_geom_voronoiFirstCircle, d3_geom_voronoiCircles, d3_geom_voronoiCirclePool = [];
  function d3_geom_voronoiBeach() {
    d3_geom_voronoiRedBlackNode(this);
    this.edge = this.site = this.circle = null;
  }
  function d3_geom_voronoiCreateBeach(site) {
    var beach = d3_geom_voronoiBeachPool.pop() || new d3_geom_voronoiBeach();
    beach.site = site;
    return beach;
  }
  function d3_geom_voronoiDetachBeach(beach) {
    d3_geom_voronoiDetachCircle(beach);
    d3_geom_voronoiBeaches.remove(beach);
    d3_geom_voronoiBeachPool.push(beach);
    d3_geom_voronoiRedBlackNode(beach);
  }
  function d3_geom_voronoiRemoveBeach(beach) {
    var circle = beach.circle, x = circle.x, y = circle.cy, vertex = {
      x: x,
      y: y
    }, previous = beach.P, next = beach.N, disappearing = [ beach ];
    d3_geom_voronoiDetachBeach(beach);
    var lArc = previous;
    while (lArc.circle && abs(x - lArc.circle.x) < ε && abs(y - lArc.circle.cy) < ε) {
      previous = lArc.P;
      disappearing.unshift(lArc);
      d3_geom_voronoiDetachBeach(lArc);
      lArc = previous;
    }
    disappearing.unshift(lArc);
    d3_geom_voronoiDetachCircle(lArc);
    var rArc = next;
    while (rArc.circle && abs(x - rArc.circle.x) < ε && abs(y - rArc.circle.cy) < ε) {
      next = rArc.N;
      disappearing.push(rArc);
      d3_geom_voronoiDetachBeach(rArc);
      rArc = next;
    }
    disappearing.push(rArc);
    d3_geom_voronoiDetachCircle(rArc);
    var nArcs = disappearing.length, iArc;
    for (iArc = 1; iArc < nArcs; ++iArc) {
      rArc = disappearing[iArc];
      lArc = disappearing[iArc - 1];
      d3_geom_voronoiSetEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
    }
    lArc = disappearing[0];
    rArc = disappearing[nArcs - 1];
    rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, rArc.site, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiAddBeach(site) {
    var x = site.x, directrix = site.y, lArc, rArc, dxl, dxr, node = d3_geom_voronoiBeaches._;
    while (node) {
      dxl = d3_geom_voronoiLeftBreakPoint(node, directrix) - x;
      if (dxl > ε) node = node.L; else {
        dxr = x - d3_geom_voronoiRightBreakPoint(node, directrix);
        if (dxr > ε) {
          if (!node.R) {
            lArc = node;
            break;
          }
          node = node.R;
        } else {
          if (dxl > -ε) {
            lArc = node.P;
            rArc = node;
          } else if (dxr > -ε) {
            lArc = node;
            rArc = node.N;
          } else {
            lArc = rArc = node;
          }
          break;
        }
      }
    }
    var newArc = d3_geom_voronoiCreateBeach(site);
    d3_geom_voronoiBeaches.insert(lArc, newArc);
    if (!lArc && !rArc) return;
    if (lArc === rArc) {
      d3_geom_voronoiDetachCircle(lArc);
      rArc = d3_geom_voronoiCreateBeach(lArc.site);
      d3_geom_voronoiBeaches.insert(newArc, rArc);
      newArc.edge = rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      d3_geom_voronoiAttachCircle(lArc);
      d3_geom_voronoiAttachCircle(rArc);
      return;
    }
    if (!rArc) {
      newArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      return;
    }
    d3_geom_voronoiDetachCircle(lArc);
    d3_geom_voronoiDetachCircle(rArc);
    var lSite = lArc.site, ax = lSite.x, ay = lSite.y, bx = site.x - ax, by = site.y - ay, rSite = rArc.site, cx = rSite.x - ax, cy = rSite.y - ay, d = 2 * (bx * cy - by * cx), hb = bx * bx + by * by, hc = cx * cx + cy * cy, vertex = {
      x: (cy * hb - by * hc) / d + ax,
      y: (bx * hc - cx * hb) / d + ay
    };
    d3_geom_voronoiSetEdgeEnd(rArc.edge, lSite, rSite, vertex);
    newArc.edge = d3_geom_voronoiCreateEdge(lSite, site, null, vertex);
    rArc.edge = d3_geom_voronoiCreateEdge(site, rSite, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiLeftBreakPoint(arc, directrix) {
    var site = arc.site, rfocx = site.x, rfocy = site.y, pby2 = rfocy - directrix;
    if (!pby2) return rfocx;
    var lArc = arc.P;
    if (!lArc) return -Infinity;
    site = lArc.site;
    var lfocx = site.x, lfocy = site.y, plby2 = lfocy - directrix;
    if (!plby2) return lfocx;
    var hl = lfocx - rfocx, aby2 = 1 / pby2 - 1 / plby2, b = hl / plby2;
    if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;
    return (rfocx + lfocx) / 2;
  }
  function d3_geom_voronoiRightBreakPoint(arc, directrix) {
    var rArc = arc.N;
    if (rArc) return d3_geom_voronoiLeftBreakPoint(rArc, directrix);
    var site = arc.site;
    return site.y === directrix ? site.x : Infinity;
  }
  function d3_geom_voronoiCell(site) {
    this.site = site;
    this.edges = [];
  }
  d3_geom_voronoiCell.prototype.prepare = function() {
    var halfEdges = this.edges, iHalfEdge = halfEdges.length, edge;
    while (iHalfEdge--) {
      edge = halfEdges[iHalfEdge].edge;
      if (!edge.b || !edge.a) halfEdges.splice(iHalfEdge, 1);
    }
    halfEdges.sort(d3_geom_voronoiHalfEdgeOrder);
    return halfEdges.length;
  };
  function d3_geom_voronoiCloseCells(extent) {
    var x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], x2, y2, x3, y3, cells = d3_geom_voronoiCells, iCell = cells.length, cell, iHalfEdge, halfEdges, nHalfEdges, start, end;
    while (iCell--) {
      cell = cells[iCell];
      if (!cell || !cell.prepare()) continue;
      halfEdges = cell.edges;
      nHalfEdges = halfEdges.length;
      iHalfEdge = 0;
      while (iHalfEdge < nHalfEdges) {
        end = halfEdges[iHalfEdge].end(), x3 = end.x, y3 = end.y;
        start = halfEdges[++iHalfEdge % nHalfEdges].start(), x2 = start.x, y2 = start.y;
        if (abs(x3 - x2) > ε || abs(y3 - y2) > ε) {
          halfEdges.splice(iHalfEdge, 0, new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, end, abs(x3 - x0) < ε && y1 - y3 > ε ? {
            x: x0,
            y: abs(x2 - x0) < ε ? y2 : y1
          } : abs(y3 - y1) < ε && x1 - x3 > ε ? {
            x: abs(y2 - y1) < ε ? x2 : x1,
            y: y1
          } : abs(x3 - x1) < ε && y3 - y0 > ε ? {
            x: x1,
            y: abs(x2 - x1) < ε ? y2 : y0
          } : abs(y3 - y0) < ε && x3 - x0 > ε ? {
            x: abs(y2 - y0) < ε ? x2 : x0,
            y: y0
          } : null), cell.site, null));
          ++nHalfEdges;
        }
      }
    }
  }
  function d3_geom_voronoiHalfEdgeOrder(a, b) {
    return b.angle - a.angle;
  }
  function d3_geom_voronoiCircle() {
    d3_geom_voronoiRedBlackNode(this);
    this.x = this.y = this.arc = this.site = this.cy = null;
  }
  function d3_geom_voronoiAttachCircle(arc) {
    var lArc = arc.P, rArc = arc.N;
    if (!lArc || !rArc) return;
    var lSite = lArc.site, cSite = arc.site, rSite = rArc.site;
    if (lSite === rSite) return;
    var bx = cSite.x, by = cSite.y, ax = lSite.x - bx, ay = lSite.y - by, cx = rSite.x - bx, cy = rSite.y - by;
    var d = 2 * (ax * cy - ay * cx);
    if (d >= -ε2) return;
    var ha = ax * ax + ay * ay, hc = cx * cx + cy * cy, x = (cy * ha - ay * hc) / d, y = (ax * hc - cx * ha) / d, cy = y + by;
    var circle = d3_geom_voronoiCirclePool.pop() || new d3_geom_voronoiCircle();
    circle.arc = arc;
    circle.site = cSite;
    circle.x = x + bx;
    circle.y = cy + Math.sqrt(x * x + y * y);
    circle.cy = cy;
    arc.circle = circle;
    var before = null, node = d3_geom_voronoiCircles._;
    while (node) {
      if (circle.y < node.y || circle.y === node.y && circle.x <= node.x) {
        if (node.L) node = node.L; else {
          before = node.P;
          break;
        }
      } else {
        if (node.R) node = node.R; else {
          before = node;
          break;
        }
      }
    }
    d3_geom_voronoiCircles.insert(before, circle);
    if (!before) d3_geom_voronoiFirstCircle = circle;
  }
  function d3_geom_voronoiDetachCircle(arc) {
    var circle = arc.circle;
    if (circle) {
      if (!circle.P) d3_geom_voronoiFirstCircle = circle.N;
      d3_geom_voronoiCircles.remove(circle);
      d3_geom_voronoiCirclePool.push(circle);
      d3_geom_voronoiRedBlackNode(circle);
      arc.circle = null;
    }
  }
  function d3_geom_voronoiClipEdges(extent) {
    var edges = d3_geom_voronoiEdges, clip = d3_geom_clipLine(extent[0][0], extent[0][1], extent[1][0], extent[1][1]), i = edges.length, e;
    while (i--) {
      e = edges[i];
      if (!d3_geom_voronoiConnectEdge(e, extent) || !clip(e) || abs(e.a.x - e.b.x) < ε && abs(e.a.y - e.b.y) < ε) {
        e.a = e.b = null;
        edges.splice(i, 1);
      }
    }
  }
  function d3_geom_voronoiConnectEdge(edge, extent) {
    var vb = edge.b;
    if (vb) return true;
    var va = edge.a, x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], lSite = edge.l, rSite = edge.r, lx = lSite.x, ly = lSite.y, rx = rSite.x, ry = rSite.y, fx = (lx + rx) / 2, fy = (ly + ry) / 2, fm, fb;
    if (ry === ly) {
      if (fx < x0 || fx >= x1) return;
      if (lx > rx) {
        if (!va) va = {
          x: fx,
          y: y0
        }; else if (va.y >= y1) return;
        vb = {
          x: fx,
          y: y1
        };
      } else {
        if (!va) va = {
          x: fx,
          y: y1
        }; else if (va.y < y0) return;
        vb = {
          x: fx,
          y: y0
        };
      }
    } else {
      fm = (lx - rx) / (ry - ly);
      fb = fy - fm * fx;
      if (fm < -1 || fm > 1) {
        if (lx > rx) {
          if (!va) va = {
            x: (y0 - fb) / fm,
            y: y0
          }; else if (va.y >= y1) return;
          vb = {
            x: (y1 - fb) / fm,
            y: y1
          };
        } else {
          if (!va) va = {
            x: (y1 - fb) / fm,
            y: y1
          }; else if (va.y < y0) return;
          vb = {
            x: (y0 - fb) / fm,
            y: y0
          };
        }
      } else {
        if (ly < ry) {
          if (!va) va = {
            x: x0,
            y: fm * x0 + fb
          }; else if (va.x >= x1) return;
          vb = {
            x: x1,
            y: fm * x1 + fb
          };
        } else {
          if (!va) va = {
            x: x1,
            y: fm * x1 + fb
          }; else if (va.x < x0) return;
          vb = {
            x: x0,
            y: fm * x0 + fb
          };
        }
      }
    }
    edge.a = va;
    edge.b = vb;
    return true;
  }
  function d3_geom_voronoiEdge(lSite, rSite) {
    this.l = lSite;
    this.r = rSite;
    this.a = this.b = null;
  }
  function d3_geom_voronoiCreateEdge(lSite, rSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, rSite);
    d3_geom_voronoiEdges.push(edge);
    if (va) d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, va);
    if (vb) d3_geom_voronoiSetEdgeEnd(edge, rSite, lSite, vb);
    d3_geom_voronoiCells[lSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, lSite, rSite));
    d3_geom_voronoiCells[rSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, rSite, lSite));
    return edge;
  }
  function d3_geom_voronoiCreateBorderEdge(lSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, null);
    edge.a = va;
    edge.b = vb;
    d3_geom_voronoiEdges.push(edge);
    return edge;
  }
  function d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, vertex) {
    if (!edge.a && !edge.b) {
      edge.a = vertex;
      edge.l = lSite;
      edge.r = rSite;
    } else if (edge.l === rSite) {
      edge.b = vertex;
    } else {
      edge.a = vertex;
    }
  }
  function d3_geom_voronoiHalfEdge(edge, lSite, rSite) {
    var va = edge.a, vb = edge.b;
    this.edge = edge;
    this.site = lSite;
    this.angle = rSite ? Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x) : edge.l === lSite ? Math.atan2(vb.x - va.x, va.y - vb.y) : Math.atan2(va.x - vb.x, vb.y - va.y);
  }
  d3_geom_voronoiHalfEdge.prototype = {
    start: function() {
      return this.edge.l === this.site ? this.edge.a : this.edge.b;
    },
    end: function() {
      return this.edge.l === this.site ? this.edge.b : this.edge.a;
    }
  };
  function d3_geom_voronoiRedBlackTree() {
    this._ = null;
  }
  function d3_geom_voronoiRedBlackNode(node) {
    node.U = node.C = node.L = node.R = node.P = node.N = null;
  }
  d3_geom_voronoiRedBlackTree.prototype = {
    insert: function(after, node) {
      var parent, grandpa, uncle;
      if (after) {
        node.P = after;
        node.N = after.N;
        if (after.N) after.N.P = node;
        after.N = node;
        if (after.R) {
          after = after.R;
          while (after.L) after = after.L;
          after.L = node;
        } else {
          after.R = node;
        }
        parent = after;
      } else if (this._) {
        after = d3_geom_voronoiRedBlackFirst(this._);
        node.P = null;
        node.N = after;
        after.P = after.L = node;
        parent = after;
      } else {
        node.P = node.N = null;
        this._ = node;
        parent = null;
      }
      node.L = node.R = null;
      node.U = parent;
      node.C = true;
      after = node;
      while (parent && parent.C) {
        grandpa = parent.U;
        if (parent === grandpa.L) {
          uncle = grandpa.R;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.R) {
              d3_geom_voronoiRedBlackRotateLeft(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, grandpa);
          }
        } else {
          uncle = grandpa.L;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.L) {
              d3_geom_voronoiRedBlackRotateRight(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, grandpa);
          }
        }
        parent = after.U;
      }
      this._.C = false;
    },
    remove: function(node) {
      if (node.N) node.N.P = node.P;
      if (node.P) node.P.N = node.N;
      node.N = node.P = null;
      var parent = node.U, sibling, left = node.L, right = node.R, next, red;
      if (!left) next = right; else if (!right) next = left; else next = d3_geom_voronoiRedBlackFirst(right);
      if (parent) {
        if (parent.L === node) parent.L = next; else parent.R = next;
      } else {
        this._ = next;
      }
      if (left && right) {
        red = next.C;
        next.C = node.C;
        next.L = left;
        left.U = next;
        if (next !== right) {
          parent = next.U;
          next.U = node.U;
          node = next.R;
          parent.L = node;
          next.R = right;
          right.U = next;
        } else {
          next.U = parent;
          parent = next;
          node = next.R;
        }
      } else {
        red = node.C;
        node = next;
      }
      if (node) node.U = parent;
      if (red) return;
      if (node && node.C) {
        node.C = false;
        return;
      }
      do {
        if (node === this._) break;
        if (node === parent.L) {
          sibling = parent.R;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            sibling = parent.R;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.R || !sibling.R.C) {
              sibling.L.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateRight(this, sibling);
              sibling = parent.R;
            }
            sibling.C = parent.C;
            parent.C = sibling.R.C = false;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            node = this._;
            break;
          }
        } else {
          sibling = parent.L;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            sibling = parent.L;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.L || !sibling.L.C) {
              sibling.R.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateLeft(this, sibling);
              sibling = parent.L;
            }
            sibling.C = parent.C;
            parent.C = sibling.L.C = false;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            node = this._;
            break;
          }
        }
        sibling.C = true;
        node = parent;
        parent = parent.U;
      } while (!node.C);
      if (node) node.C = false;
    }
  };
  function d3_geom_voronoiRedBlackRotateLeft(tree, node) {
    var p = node, q = node.R, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.R = q.L;
    if (p.R) p.R.U = p;
    q.L = p;
  }
  function d3_geom_voronoiRedBlackRotateRight(tree, node) {
    var p = node, q = node.L, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.L = q.R;
    if (p.L) p.L.U = p;
    q.R = p;
  }
  function d3_geom_voronoiRedBlackFirst(node) {
    while (node.L) node = node.L;
    return node;
  }
  function d3_geom_voronoi(sites, bbox) {
    var site = sites.sort(d3_geom_voronoiVertexOrder).pop(), x0, y0, circle;
    d3_geom_voronoiEdges = [];
    d3_geom_voronoiCells = new Array(sites.length);
    d3_geom_voronoiBeaches = new d3_geom_voronoiRedBlackTree();
    d3_geom_voronoiCircles = new d3_geom_voronoiRedBlackTree();
    while (true) {
      circle = d3_geom_voronoiFirstCircle;
      if (site && (!circle || site.y < circle.y || site.y === circle.y && site.x < circle.x)) {
        if (site.x !== x0 || site.y !== y0) {
          d3_geom_voronoiCells[site.i] = new d3_geom_voronoiCell(site);
          d3_geom_voronoiAddBeach(site);
          x0 = site.x, y0 = site.y;
        }
        site = sites.pop();
      } else if (circle) {
        d3_geom_voronoiRemoveBeach(circle.arc);
      } else {
        break;
      }
    }
    if (bbox) d3_geom_voronoiClipEdges(bbox), d3_geom_voronoiCloseCells(bbox);
    var diagram = {
      cells: d3_geom_voronoiCells,
      edges: d3_geom_voronoiEdges
    };
    d3_geom_voronoiBeaches = d3_geom_voronoiCircles = d3_geom_voronoiEdges = d3_geom_voronoiCells = null;
    return diagram;
  }
  function d3_geom_voronoiVertexOrder(a, b) {
    return b.y - a.y || b.x - a.x;
  }
  d3.geom.voronoi = function(points) {
    var x = d3_geom_pointX, y = d3_geom_pointY, fx = x, fy = y, clipExtent = d3_geom_voronoiClipExtent;
    if (points) return voronoi(points);
    function voronoi(data) {
      var polygons = new Array(data.length), x0 = clipExtent[0][0], y0 = clipExtent[0][1], x1 = clipExtent[1][0], y1 = clipExtent[1][1];
      d3_geom_voronoi(sites(data), clipExtent).cells.forEach(function(cell, i) {
        var edges = cell.edges, site = cell.site, polygon = polygons[i] = edges.length ? edges.map(function(e) {
          var s = e.start();
          return [ s.x, s.y ];
        }) : site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1 ? [ [ x0, y1 ], [ x1, y1 ], [ x1, y0 ], [ x0, y0 ] ] : [];
        polygon.point = data[i];
      });
      return polygons;
    }
    function sites(data) {
      return data.map(function(d, i) {
        return {
          x: Math.round(fx(d, i) / ε) * ε,
          y: Math.round(fy(d, i) / ε) * ε,
          i: i
        };
      });
    }
    voronoi.links = function(data) {
      return d3_geom_voronoi(sites(data)).edges.filter(function(edge) {
        return edge.l && edge.r;
      }).map(function(edge) {
        return {
          source: data[edge.l.i],
          target: data[edge.r.i]
        };
      });
    };
    voronoi.triangles = function(data) {
      var triangles = [];
      d3_geom_voronoi(sites(data)).cells.forEach(function(cell, i) {
        var site = cell.site, edges = cell.edges.sort(d3_geom_voronoiHalfEdgeOrder), j = -1, m = edges.length, e0, s0, e1 = edges[m - 1].edge, s1 = e1.l === site ? e1.r : e1.l;
        while (++j < m) {
          e0 = e1;
          s0 = s1;
          e1 = edges[j].edge;
          s1 = e1.l === site ? e1.r : e1.l;
          if (i < s0.i && i < s1.i && d3_geom_voronoiTriangleArea(site, s0, s1) < 0) {
            triangles.push([ data[i], data[s0.i], data[s1.i] ]);
          }
        }
      });
      return triangles;
    };
    voronoi.x = function(_) {
      return arguments.length ? (fx = d3_functor(x = _), voronoi) : x;
    };
    voronoi.y = function(_) {
      return arguments.length ? (fy = d3_functor(y = _), voronoi) : y;
    };
    voronoi.clipExtent = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent;
      clipExtent = _ == null ? d3_geom_voronoiClipExtent : _;
      return voronoi;
    };
    voronoi.size = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent && clipExtent[1];
      return voronoi.clipExtent(_ && [ [ 0, 0 ], _ ]);
    };
    return voronoi;
  };
  var d3_geom_voronoiClipExtent = [ [ -1e6, -1e6 ], [ 1e6, 1e6 ] ];
  function d3_geom_voronoiTriangleArea(a, b, c) {
    return (a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y);
  }
  d3.geom.delaunay = function(vertices) {
    return d3.geom.voronoi().triangles(vertices);
  };
  d3.geom.quadtree = function(points, x1, y1, x2, y2) {
    var x = d3_geom_pointX, y = d3_geom_pointY, compat;
    if (compat = arguments.length) {
      x = d3_geom_quadtreeCompatX;
      y = d3_geom_quadtreeCompatY;
      if (compat === 3) {
        y2 = y1;
        x2 = x1;
        y1 = x1 = 0;
      }
      return quadtree(points);
    }
    function quadtree(data) {
      var d, fx = d3_functor(x), fy = d3_functor(y), xs, ys, i, n, x1_, y1_, x2_, y2_;
      if (x1 != null) {
        x1_ = x1, y1_ = y1, x2_ = x2, y2_ = y2;
      } else {
        x2_ = y2_ = -(x1_ = y1_ = Infinity);
        xs = [], ys = [];
        n = data.length;
        if (compat) for (i = 0; i < n; ++i) {
          d = data[i];
          if (d.x < x1_) x1_ = d.x;
          if (d.y < y1_) y1_ = d.y;
          if (d.x > x2_) x2_ = d.x;
          if (d.y > y2_) y2_ = d.y;
          xs.push(d.x);
          ys.push(d.y);
        } else for (i = 0; i < n; ++i) {
          var x_ = +fx(d = data[i], i), y_ = +fy(d, i);
          if (x_ < x1_) x1_ = x_;
          if (y_ < y1_) y1_ = y_;
          if (x_ > x2_) x2_ = x_;
          if (y_ > y2_) y2_ = y_;
          xs.push(x_);
          ys.push(y_);
        }
      }
      var dx = x2_ - x1_, dy = y2_ - y1_;
      if (dx > dy) y2_ = y1_ + dx; else x2_ = x1_ + dy;
      function insert(n, d, x, y, x1, y1, x2, y2) {
        if (isNaN(x) || isNaN(y)) return;
        if (n.leaf) {
          var nx = n.x, ny = n.y;
          if (nx != null) {
            if (abs(nx - x) + abs(ny - y) < .01) {
              insertChild(n, d, x, y, x1, y1, x2, y2);
            } else {
              var nPoint = n.point;
              n.x = n.y = n.point = null;
              insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);
              insertChild(n, d, x, y, x1, y1, x2, y2);
            }
          } else {
            n.x = x, n.y = y, n.point = d;
          }
        } else {
          insertChild(n, d, x, y, x1, y1, x2, y2);
        }
      }
      function insertChild(n, d, x, y, x1, y1, x2, y2) {
        var xm = (x1 + x2) * .5, ym = (y1 + y2) * .5, right = x >= xm, below = y >= ym, i = below << 1 | right;
        n.leaf = false;
        n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode());
        if (right) x1 = xm; else x2 = xm;
        if (below) y1 = ym; else y2 = ym;
        insert(n, d, x, y, x1, y1, x2, y2);
      }
      var root = d3_geom_quadtreeNode();
      root.add = function(d) {
        insert(root, d, +fx(d, ++i), +fy(d, i), x1_, y1_, x2_, y2_);
      };
      root.visit = function(f) {
        d3_geom_quadtreeVisit(f, root, x1_, y1_, x2_, y2_);
      };
      root.find = function(point) {
        return d3_geom_quadtreeFind(root, point[0], point[1], x1_, y1_, x2_, y2_);
      };
      i = -1;
      if (x1 == null) {
        while (++i < n) {
          insert(root, data[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
        }
        --i;
      } else data.forEach(root.add);
      xs = ys = data = d = null;
      return root;
    }
    quadtree.x = function(_) {
      return arguments.length ? (x = _, quadtree) : x;
    };
    quadtree.y = function(_) {
      return arguments.length ? (y = _, quadtree) : y;
    };
    quadtree.extent = function(_) {
      if (!arguments.length) return x1 == null ? null : [ [ x1, y1 ], [ x2, y2 ] ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = +_[0][0], y1 = +_[0][1], x2 = +_[1][0], 
      y2 = +_[1][1];
      return quadtree;
    };
    quadtree.size = function(_) {
      if (!arguments.length) return x1 == null ? null : [ x2 - x1, y2 - y1 ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = y1 = 0, x2 = +_[0], y2 = +_[1];
      return quadtree;
    };
    return quadtree;
  };
  function d3_geom_quadtreeCompatX(d) {
    return d.x;
  }
  function d3_geom_quadtreeCompatY(d) {
    return d.y;
  }
  function d3_geom_quadtreeNode() {
    return {
      leaf: true,
      nodes: [],
      point: null,
      x: null,
      y: null
    };
  }
  function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {
    if (!f(node, x1, y1, x2, y2)) {
      var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, children = node.nodes;
      if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);
      if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);
      if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);
      if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);
    }
  }
  function d3_geom_quadtreeFind(root, x, y, x0, y0, x3, y3) {
    var minDistance2 = Infinity, closestPoint;
    (function find(node, x1, y1, x2, y2) {
      if (x1 > x3 || y1 > y3 || x2 < x0 || y2 < y0) return;
      if (point = node.point) {
        var point, dx = x - node.x, dy = y - node.y, distance2 = dx * dx + dy * dy;
        if (distance2 < minDistance2) {
          var distance = Math.sqrt(minDistance2 = distance2);
          x0 = x - distance, y0 = y - distance;
          x3 = x + distance, y3 = y + distance;
          closestPoint = point;
        }
      }
      var children = node.nodes, xm = (x1 + x2) * .5, ym = (y1 + y2) * .5, right = x >= xm, below = y >= ym;
      for (var i = below << 1 | right, j = i + 4; i < j; ++i) {
        if (node = children[i & 3]) switch (i & 3) {
         case 0:
          find(node, x1, y1, xm, ym);
          break;

         case 1:
          find(node, xm, y1, x2, ym);
          break;

         case 2:
          find(node, x1, ym, xm, y2);
          break;

         case 3:
          find(node, xm, ym, x2, y2);
          break;
        }
      }
    })(root, x0, y0, x3, y3);
    return closestPoint;
  }
  d3.interpolateRgb = d3_interpolateRgb;
  function d3_interpolateRgb(a, b) {
    a = d3.rgb(a);
    b = d3.rgb(b);
    var ar = a.r, ag = a.g, ab = a.b, br = b.r - ar, bg = b.g - ag, bb = b.b - ab;
    return function(t) {
      return "#" + d3_rgb_hex(Math.round(ar + br * t)) + d3_rgb_hex(Math.round(ag + bg * t)) + d3_rgb_hex(Math.round(ab + bb * t));
    };
  }
  d3.interpolateObject = d3_interpolateObject;
  function d3_interpolateObject(a, b) {
    var i = {}, c = {}, k;
    for (k in a) {
      if (k in b) {
        i[k] = d3_interpolate(a[k], b[k]);
      } else {
        c[k] = a[k];
      }
    }
    for (k in b) {
      if (!(k in a)) {
        c[k] = b[k];
      }
    }
    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }
  d3.interpolateNumber = d3_interpolateNumber;
  function d3_interpolateNumber(a, b) {
    a = +a, b = +b;
    return function(t) {
      return a * (1 - t) + b * t;
    };
  }
  d3.interpolateString = d3_interpolateString;
  function d3_interpolateString(a, b) {
    var bi = d3_interpolate_numberA.lastIndex = d3_interpolate_numberB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
    a = a + "", b = b + "";
    while ((am = d3_interpolate_numberA.exec(a)) && (bm = d3_interpolate_numberB.exec(b))) {
      if ((bs = bm.index) > bi) {
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s[i]) s[i] += bm; else s[++i] = bm;
      } else {
        s[++i] = null;
        q.push({
          i: i,
          x: d3_interpolateNumber(am, bm)
        });
      }
      bi = d3_interpolate_numberB.lastIndex;
    }
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; else s[++i] = bs;
    }
    return s.length < 2 ? q[0] ? (b = q[0].x, function(t) {
      return b(t) + "";
    }) : function() {
      return b;
    } : (b = q.length, function(t) {
      for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    });
  }
  var d3_interpolate_numberA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, d3_interpolate_numberB = new RegExp(d3_interpolate_numberA.source, "g");
  d3.interpolate = d3_interpolate;
  function d3_interpolate(a, b) {
    var i = d3.interpolators.length, f;
    while (--i >= 0 && !(f = d3.interpolators[i](a, b))) ;
    return f;
  }
  d3.interpolators = [ function(a, b) {
    var t = typeof b;
    return (t === "string" ? d3_rgb_names.has(b.toLowerCase()) || /^(#|rgb\(|hsl\()/i.test(b) ? d3_interpolateRgb : d3_interpolateString : b instanceof d3_color ? d3_interpolateRgb : Array.isArray(b) ? d3_interpolateArray : t === "object" && isNaN(b) ? d3_interpolateObject : d3_interpolateNumber)(a, b);
  } ];
  d3.interpolateArray = d3_interpolateArray;
  function d3_interpolateArray(a, b) {
    var x = [], c = [], na = a.length, nb = b.length, n0 = Math.min(a.length, b.length), i;
    for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));
    for (;i < na; ++i) c[i] = a[i];
    for (;i < nb; ++i) c[i] = b[i];
    return function(t) {
      for (i = 0; i < n0; ++i) c[i] = x[i](t);
      return c;
    };
  }
  var d3_ease_default = function() {
    return d3_identity;
  };
  var d3_ease = d3.map({
    linear: d3_ease_default,
    poly: d3_ease_poly,
    quad: function() {
      return d3_ease_quad;
    },
    cubic: function() {
      return d3_ease_cubic;
    },
    sin: function() {
      return d3_ease_sin;
    },
    exp: function() {
      return d3_ease_exp;
    },
    circle: function() {
      return d3_ease_circle;
    },
    elastic: d3_ease_elastic,
    back: d3_ease_back,
    bounce: function() {
      return d3_ease_bounce;
    }
  });
  var d3_ease_mode = d3.map({
    "in": d3_identity,
    out: d3_ease_reverse,
    "in-out": d3_ease_reflect,
    "out-in": function(f) {
      return d3_ease_reflect(d3_ease_reverse(f));
    }
  });
  d3.ease = function(name) {
    var i = name.indexOf("-"), t = i >= 0 ? name.slice(0, i) : name, m = i >= 0 ? name.slice(i + 1) : "in";
    t = d3_ease.get(t) || d3_ease_default;
    m = d3_ease_mode.get(m) || d3_identity;
    return d3_ease_clamp(m(t.apply(null, d3_arraySlice.call(arguments, 1))));
  };
  function d3_ease_clamp(f) {
    return function(t) {
      return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
    };
  }
  function d3_ease_reverse(f) {
    return function(t) {
      return 1 - f(1 - t);
    };
  }
  function d3_ease_reflect(f) {
    return function(t) {
      return .5 * (t < .5 ? f(2 * t) : 2 - f(2 - 2 * t));
    };
  }
  function d3_ease_quad(t) {
    return t * t;
  }
  function d3_ease_cubic(t) {
    return t * t * t;
  }
  function d3_ease_cubicInOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var t2 = t * t, t3 = t2 * t;
    return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
  }
  function d3_ease_poly(e) {
    return function(t) {
      return Math.pow(t, e);
    };
  }
  function d3_ease_sin(t) {
    return 1 - Math.cos(t * halfπ);
  }
  function d3_ease_exp(t) {
    return Math.pow(2, 10 * (t - 1));
  }
  function d3_ease_circle(t) {
    return 1 - Math.sqrt(1 - t * t);
  }
  function d3_ease_elastic(a, p) {
    var s;
    if (arguments.length < 2) p = .45;
    if (arguments.length) s = p / τ * Math.asin(1 / a); else a = 1, s = p / 4;
    return function(t) {
      return 1 + a * Math.pow(2, -10 * t) * Math.sin((t - s) * τ / p);
    };
  }
  function d3_ease_back(s) {
    if (!s) s = 1.70158;
    return function(t) {
      return t * t * ((s + 1) * t - s);
    };
  }
  function d3_ease_bounce(t) {
    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
  }
  d3.interpolateHcl = d3_interpolateHcl;
  function d3_interpolateHcl(a, b) {
    a = d3.hcl(a);
    b = d3.hcl(b);
    var ah = a.h, ac = a.c, al = a.l, bh = b.h - ah, bc = b.c - ac, bl = b.l - al;
    if (isNaN(bc)) bc = 0, ac = isNaN(ac) ? b.c : ac;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hcl_lab(ah + bh * t, ac + bc * t, al + bl * t) + "";
    };
  }
  d3.interpolateHsl = d3_interpolateHsl;
  function d3_interpolateHsl(a, b) {
    a = d3.hsl(a);
    b = d3.hsl(b);
    var ah = a.h, as = a.s, al = a.l, bh = b.h - ah, bs = b.s - as, bl = b.l - al;
    if (isNaN(bs)) bs = 0, as = isNaN(as) ? b.s : as;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hsl_rgb(ah + bh * t, as + bs * t, al + bl * t) + "";
    };
  }
  d3.interpolateLab = d3_interpolateLab;
  function d3_interpolateLab(a, b) {
    a = d3.lab(a);
    b = d3.lab(b);
    var al = a.l, aa = a.a, ab = a.b, bl = b.l - al, ba = b.a - aa, bb = b.b - ab;
    return function(t) {
      return d3_lab_rgb(al + bl * t, aa + ba * t, ab + bb * t) + "";
    };
  }
  d3.interpolateRound = d3_interpolateRound;
  function d3_interpolateRound(a, b) {
    b -= a;
    return function(t) {
      return Math.round(a + b * t);
    };
  }
  d3.transform = function(string) {
    var g = d3_document.createElementNS(d3.ns.prefix.svg, "g");
    return (d3.transform = function(string) {
      if (string != null) {
        g.setAttribute("transform", string);
        var t = g.transform.baseVal.consolidate();
      }
      return new d3_transform(t ? t.matrix : d3_transformIdentity);
    })(string);
  };
  function d3_transform(m) {
    var r0 = [ m.a, m.b ], r1 = [ m.c, m.d ], kx = d3_transformNormalize(r0), kz = d3_transformDot(r0, r1), ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
    if (r0[0] * r1[1] < r1[0] * r0[1]) {
      r0[0] *= -1;
      r0[1] *= -1;
      kx *= -1;
      kz *= -1;
    }
    this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;
    this.translate = [ m.e, m.f ];
    this.scale = [ kx, ky ];
    this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;
  }
  d3_transform.prototype.toString = function() {
    return "translate(" + this.translate + ")rotate(" + this.rotate + ")skewX(" + this.skew + ")scale(" + this.scale + ")";
  };
  function d3_transformDot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function d3_transformNormalize(a) {
    var k = Math.sqrt(d3_transformDot(a, a));
    if (k) {
      a[0] /= k;
      a[1] /= k;
    }
    return k;
  }
  function d3_transformCombine(a, b, k) {
    a[0] += k * b[0];
    a[1] += k * b[1];
    return a;
  }
  var d3_transformIdentity = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0
  };
  d3.interpolateTransform = d3_interpolateTransform;
  function d3_interpolateTransformPop(s) {
    return s.length ? s.pop() + "," : "";
  }
  function d3_interpolateTranslate(ta, tb, s, q) {
    if (ta[0] !== tb[0] || ta[1] !== tb[1]) {
      var i = s.push("translate(", null, ",", null, ")");
      q.push({
        i: i - 4,
        x: d3_interpolateNumber(ta[0], tb[0])
      }, {
        i: i - 2,
        x: d3_interpolateNumber(ta[1], tb[1])
      });
    } else if (tb[0] || tb[1]) {
      s.push("translate(" + tb + ")");
    }
  }
  function d3_interpolateRotate(ra, rb, s, q) {
    if (ra !== rb) {
      if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360;
      q.push({
        i: s.push(d3_interpolateTransformPop(s) + "rotate(", null, ")") - 2,
        x: d3_interpolateNumber(ra, rb)
      });
    } else if (rb) {
      s.push(d3_interpolateTransformPop(s) + "rotate(" + rb + ")");
    }
  }
  function d3_interpolateSkew(wa, wb, s, q) {
    if (wa !== wb) {
      q.push({
        i: s.push(d3_interpolateTransformPop(s) + "skewX(", null, ")") - 2,
        x: d3_interpolateNumber(wa, wb)
      });
    } else if (wb) {
      s.push(d3_interpolateTransformPop(s) + "skewX(" + wb + ")");
    }
  }
  function d3_interpolateScale(ka, kb, s, q) {
    if (ka[0] !== kb[0] || ka[1] !== kb[1]) {
      var i = s.push(d3_interpolateTransformPop(s) + "scale(", null, ",", null, ")");
      q.push({
        i: i - 4,
        x: d3_interpolateNumber(ka[0], kb[0])
      }, {
        i: i - 2,
        x: d3_interpolateNumber(ka[1], kb[1])
      });
    } else if (kb[0] !== 1 || kb[1] !== 1) {
      s.push(d3_interpolateTransformPop(s) + "scale(" + kb + ")");
    }
  }
  function d3_interpolateTransform(a, b) {
    var s = [], q = [];
    a = d3.transform(a), b = d3.transform(b);
    d3_interpolateTranslate(a.translate, b.translate, s, q);
    d3_interpolateRotate(a.rotate, b.rotate, s, q);
    d3_interpolateSkew(a.skew, b.skew, s, q);
    d3_interpolateScale(a.scale, b.scale, s, q);
    a = b = null;
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  }
  function d3_uninterpolateNumber(a, b) {
    b = (b -= a = +a) || 1 / b;
    return function(x) {
      return (x - a) / b;
    };
  }
  function d3_uninterpolateClamp(a, b) {
    b = (b -= a = +a) || 1 / b;
    return function(x) {
      return Math.max(0, Math.min(1, (x - a) / b));
    };
  }
  d3.layout = {};
  d3.layout.bundle = function() {
    return function(links) {
      var paths = [], i = -1, n = links.length;
      while (++i < n) paths.push(d3_layout_bundlePath(links[i]));
      return paths;
    };
  };
  function d3_layout_bundlePath(link) {
    var start = link.source, end = link.target, lca = d3_layout_bundleLeastCommonAncestor(start, end), points = [ start ];
    while (start !== lca) {
      start = start.parent;
      points.push(start);
    }
    var k = points.length;
    while (end !== lca) {
      points.splice(k, 0, end);
      end = end.parent;
    }
    return points;
  }
  function d3_layout_bundleAncestors(node) {
    var ancestors = [], parent = node.parent;
    while (parent != null) {
      ancestors.push(node);
      node = parent;
      parent = parent.parent;
    }
    ancestors.push(node);
    return ancestors;
  }
  function d3_layout_bundleLeastCommonAncestor(a, b) {
    if (a === b) return a;
    var aNodes = d3_layout_bundleAncestors(a), bNodes = d3_layout_bundleAncestors(b), aNode = aNodes.pop(), bNode = bNodes.pop(), sharedNode = null;
    while (aNode === bNode) {
      sharedNode = aNode;
      aNode = aNodes.pop();
      bNode = bNodes.pop();
    }
    return sharedNode;
  }
  d3.layout.chord = function() {
    var chord = {}, chords, groups, matrix, n, padding = 0, sortGroups, sortSubgroups, sortChords;
    function relayout() {
      var subgroups = {}, groupSums = [], groupIndex = d3.range(n), subgroupIndex = [], k, x, x0, i, j;
      chords = [];
      groups = [];
      k = 0, i = -1;
      while (++i < n) {
        x = 0, j = -1;
        while (++j < n) {
          x += matrix[i][j];
        }
        groupSums.push(x);
        subgroupIndex.push(d3.range(n));
        k += x;
      }
      if (sortGroups) {
        groupIndex.sort(function(a, b) {
          return sortGroups(groupSums[a], groupSums[b]);
        });
      }
      if (sortSubgroups) {
        subgroupIndex.forEach(function(d, i) {
          d.sort(function(a, b) {
            return sortSubgroups(matrix[i][a], matrix[i][b]);
          });
        });
      }
      k = (τ - padding * n) / k;
      x = 0, i = -1;
      while (++i < n) {
        x0 = x, j = -1;
        while (++j < n) {
          var di = groupIndex[i], dj = subgroupIndex[di][j], v = matrix[di][dj], a0 = x, a1 = x += v * k;
          subgroups[di + "-" + dj] = {
            index: di,
            subindex: dj,
            startAngle: a0,
            endAngle: a1,
            value: v
          };
        }
        groups[di] = {
          index: di,
          startAngle: x0,
          endAngle: x,
          value: groupSums[di]
        };
        x += padding;
      }
      i = -1;
      while (++i < n) {
        j = i - 1;
        while (++j < n) {
          var source = subgroups[i + "-" + j], target = subgroups[j + "-" + i];
          if (source.value || target.value) {
            chords.push(source.value < target.value ? {
              source: target,
              target: source
            } : {
              source: source,
              target: target
            });
          }
        }
      }
      if (sortChords) resort();
    }
    function resort() {
      chords.sort(function(a, b) {
        return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
      });
    }
    chord.matrix = function(x) {
      if (!arguments.length) return matrix;
      n = (matrix = x) && matrix.length;
      chords = groups = null;
      return chord;
    };
    chord.padding = function(x) {
      if (!arguments.length) return padding;
      padding = x;
      chords = groups = null;
      return chord;
    };
    chord.sortGroups = function(x) {
      if (!arguments.length) return sortGroups;
      sortGroups = x;
      chords = groups = null;
      return chord;
    };
    chord.sortSubgroups = function(x) {
      if (!arguments.length) return sortSubgroups;
      sortSubgroups = x;
      chords = null;
      return chord;
    };
    chord.sortChords = function(x) {
      if (!arguments.length) return sortChords;
      sortChords = x;
      if (chords) resort();
      return chord;
    };
    chord.chords = function() {
      if (!chords) relayout();
      return chords;
    };
    chord.groups = function() {
      if (!groups) relayout();
      return groups;
    };
    return chord;
  };
  d3.layout.force = function() {
    var force = {}, event = d3.dispatch("start", "tick", "end"), timer, size = [ 1, 1 ], drag, alpha, friction = .9, linkDistance = d3_layout_forceLinkDistance, linkStrength = d3_layout_forceLinkStrength, charge = -30, chargeDistance2 = d3_layout_forceChargeDistance2, gravity = .1, theta2 = .64, nodes = [], links = [], distances, strengths, charges;
    function repulse(node) {
      return function(quad, x1, _, x2) {
        if (quad.point !== node) {
          var dx = quad.cx - node.x, dy = quad.cy - node.y, dw = x2 - x1, dn = dx * dx + dy * dy;
          if (dw * dw / theta2 < dn) {
            if (dn < chargeDistance2) {
              var k = quad.charge / dn;
              node.px -= dx * k;
              node.py -= dy * k;
            }
            return true;
          }
          if (quad.point && dn && dn < chargeDistance2) {
            var k = quad.pointCharge / dn;
            node.px -= dx * k;
            node.py -= dy * k;
          }
        }
        return !quad.charge;
      };
    }
    force.tick = function() {
      if ((alpha *= .99) < .005) {
        timer = null;
        event.end({
          type: "end",
          alpha: alpha = 0
        });
        return true;
      }
      var n = nodes.length, m = links.length, q, i, o, s, t, l, k, x, y;
      for (i = 0; i < m; ++i) {
        o = links[i];
        s = o.source;
        t = o.target;
        x = t.x - s.x;
        y = t.y - s.y;
        if (l = x * x + y * y) {
          l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
          x *= l;
          y *= l;
          t.x -= x * (k = s.weight + t.weight ? s.weight / (s.weight + t.weight) : .5);
          t.y -= y * k;
          s.x += x * (k = 1 - k);
          s.y += y * k;
        }
      }
      if (k = alpha * gravity) {
        x = size[0] / 2;
        y = size[1] / 2;
        i = -1;
        if (k) while (++i < n) {
          o = nodes[i];
          o.x += (x - o.x) * k;
          o.y += (y - o.y) * k;
        }
      }
      if (charge) {
        d3_layout_forceAccumulate(q = d3.geom.quadtree(nodes), alpha, charges);
        i = -1;
        while (++i < n) {
          if (!(o = nodes[i]).fixed) {
            q.visit(repulse(o));
          }
        }
      }
      i = -1;
      while (++i < n) {
        o = nodes[i];
        if (o.fixed) {
          o.x = o.px;
          o.y = o.py;
        } else {
          o.x -= (o.px - (o.px = o.x)) * friction;
          o.y -= (o.py - (o.py = o.y)) * friction;
        }
      }
      event.tick({
        type: "tick",
        alpha: alpha
      });
    };
    force.nodes = function(x) {
      if (!arguments.length) return nodes;
      nodes = x;
      return force;
    };
    force.links = function(x) {
      if (!arguments.length) return links;
      links = x;
      return force;
    };
    force.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return force;
    };
    force.linkDistance = function(x) {
      if (!arguments.length) return linkDistance;
      linkDistance = typeof x === "function" ? x : +x;
      return force;
    };
    force.distance = force.linkDistance;
    force.linkStrength = function(x) {
      if (!arguments.length) return linkStrength;
      linkStrength = typeof x === "function" ? x : +x;
      return force;
    };
    force.friction = function(x) {
      if (!arguments.length) return friction;
      friction = +x;
      return force;
    };
    force.charge = function(x) {
      if (!arguments.length) return charge;
      charge = typeof x === "function" ? x : +x;
      return force;
    };
    force.chargeDistance = function(x) {
      if (!arguments.length) return Math.sqrt(chargeDistance2);
      chargeDistance2 = x * x;
      return force;
    };
    force.gravity = function(x) {
      if (!arguments.length) return gravity;
      gravity = +x;
      return force;
    };
    force.theta = function(x) {
      if (!arguments.length) return Math.sqrt(theta2);
      theta2 = x * x;
      return force;
    };
    force.alpha = function(x) {
      if (!arguments.length) return alpha;
      x = +x;
      if (alpha) {
        if (x > 0) {
          alpha = x;
        } else {
          timer.c = null, timer.t = NaN, timer = null;
          event.end({
            type: "end",
            alpha: alpha = 0
          });
        }
      } else if (x > 0) {
        event.start({
          type: "start",
          alpha: alpha = x
        });
        timer = d3_timer(force.tick);
      }
      return force;
    };
    force.start = function() {
      var i, n = nodes.length, m = links.length, w = size[0], h = size[1], neighbors, o;
      for (i = 0; i < n; ++i) {
        (o = nodes[i]).index = i;
        o.weight = 0;
      }
      for (i = 0; i < m; ++i) {
        o = links[i];
        if (typeof o.source == "number") o.source = nodes[o.source];
        if (typeof o.target == "number") o.target = nodes[o.target];
        ++o.source.weight;
        ++o.target.weight;
      }
      for (i = 0; i < n; ++i) {
        o = nodes[i];
        if (isNaN(o.x)) o.x = position("x", w);
        if (isNaN(o.y)) o.y = position("y", h);
        if (isNaN(o.px)) o.px = o.x;
        if (isNaN(o.py)) o.py = o.y;
      }
      distances = [];
      if (typeof linkDistance === "function") for (i = 0; i < m; ++i) distances[i] = +linkDistance.call(this, links[i], i); else for (i = 0; i < m; ++i) distances[i] = linkDistance;
      strengths = [];
      if (typeof linkStrength === "function") for (i = 0; i < m; ++i) strengths[i] = +linkStrength.call(this, links[i], i); else for (i = 0; i < m; ++i) strengths[i] = linkStrength;
      charges = [];
      if (typeof charge === "function") for (i = 0; i < n; ++i) charges[i] = +charge.call(this, nodes[i], i); else for (i = 0; i < n; ++i) charges[i] = charge;
      function position(dimension, size) {
        if (!neighbors) {
          neighbors = new Array(n);
          for (j = 0; j < n; ++j) {
            neighbors[j] = [];
          }
          for (j = 0; j < m; ++j) {
            var o = links[j];
            neighbors[o.source.index].push(o.target);
            neighbors[o.target.index].push(o.source);
          }
        }
        var candidates = neighbors[i], j = -1, l = candidates.length, x;
        while (++j < l) if (!isNaN(x = candidates[j][dimension])) return x;
        return Math.random() * size;
      }
      return force.resume();
    };
    force.resume = function() {
      return force.alpha(.1);
    };
    force.stop = function() {
      return force.alpha(0);
    };
    force.drag = function() {
      if (!drag) drag = d3.behavior.drag().origin(d3_identity).on("dragstart.force", d3_layout_forceDragstart).on("drag.force", dragmove).on("dragend.force", d3_layout_forceDragend);
      if (!arguments.length) return drag;
      this.on("mouseover.force", d3_layout_forceMouseover).on("mouseout.force", d3_layout_forceMouseout).call(drag);
    };
    function dragmove(d) {
      d.px = d3.event.x, d.py = d3.event.y;
      force.resume();
    }
    return d3.rebind(force, event, "on");
  };
  function d3_layout_forceDragstart(d) {
    d.fixed |= 2;
  }
  function d3_layout_forceDragend(d) {
    d.fixed &= ~6;
  }
  function d3_layout_forceMouseover(d) {
    d.fixed |= 4;
    d.px = d.x, d.py = d.y;
  }
  function d3_layout_forceMouseout(d) {
    d.fixed &= ~4;
  }
  function d3_layout_forceAccumulate(quad, alpha, charges) {
    var cx = 0, cy = 0;
    quad.charge = 0;
    if (!quad.leaf) {
      var nodes = quad.nodes, n = nodes.length, i = -1, c;
      while (++i < n) {
        c = nodes[i];
        if (c == null) continue;
        d3_layout_forceAccumulate(c, alpha, charges);
        quad.charge += c.charge;
        cx += c.charge * c.cx;
        cy += c.charge * c.cy;
      }
    }
    if (quad.point) {
      if (!quad.leaf) {
        quad.point.x += Math.random() - .5;
        quad.point.y += Math.random() - .5;
      }
      var k = alpha * charges[quad.point.index];
      quad.charge += quad.pointCharge = k;
      cx += k * quad.point.x;
      cy += k * quad.point.y;
    }
    quad.cx = cx / quad.charge;
    quad.cy = cy / quad.charge;
  }
  var d3_layout_forceLinkDistance = 20, d3_layout_forceLinkStrength = 1, d3_layout_forceChargeDistance2 = Infinity;
  d3.layout.hierarchy = function() {
    var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren, value = d3_layout_hierarchyValue;
    function hierarchy(root) {
      var stack = [ root ], nodes = [], node;
      root.depth = 0;
      while ((node = stack.pop()) != null) {
        nodes.push(node);
        if ((childs = children.call(hierarchy, node, node.depth)) && (n = childs.length)) {
          var n, childs, child;
          while (--n >= 0) {
            stack.push(child = childs[n]);
            child.parent = node;
            child.depth = node.depth + 1;
          }
          if (value) node.value = 0;
          node.children = childs;
        } else {
          if (value) node.value = +value.call(hierarchy, node, node.depth) || 0;
          delete node.children;
        }
      }
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var childs, parent;
        if (sort && (childs = node.children)) childs.sort(sort);
        if (value && (parent = node.parent)) parent.value += node.value;
      });
      return nodes;
    }
    hierarchy.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return hierarchy;
    };
    hierarchy.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return hierarchy;
    };
    hierarchy.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return hierarchy;
    };
    hierarchy.revalue = function(root) {
      if (value) {
        d3_layout_hierarchyVisitBefore(root, function(node) {
          if (node.children) node.value = 0;
        });
        d3_layout_hierarchyVisitAfter(root, function(node) {
          var parent;
          if (!node.children) node.value = +value.call(hierarchy, node, node.depth) || 0;
          if (parent = node.parent) parent.value += node.value;
        });
      }
      return root;
    };
    return hierarchy;
  };
  function d3_layout_hierarchyRebind(object, hierarchy) {
    d3.rebind(object, hierarchy, "sort", "children", "value");
    object.nodes = object;
    object.links = d3_layout_hierarchyLinks;
    return object;
  }
  function d3_layout_hierarchyVisitBefore(node, callback) {
    var nodes = [ node ];
    while ((node = nodes.pop()) != null) {
      callback(node);
      if ((children = node.children) && (n = children.length)) {
        var n, children;
        while (--n >= 0) nodes.push(children[n]);
      }
    }
  }
  function d3_layout_hierarchyVisitAfter(node, callback) {
    var nodes = [ node ], nodes2 = [];
    while ((node = nodes.pop()) != null) {
      nodes2.push(node);
      if ((children = node.children) && (n = children.length)) {
        var i = -1, n, children;
        while (++i < n) nodes.push(children[i]);
      }
    }
    while ((node = nodes2.pop()) != null) {
      callback(node);
    }
  }
  function d3_layout_hierarchyChildren(d) {
    return d.children;
  }
  function d3_layout_hierarchyValue(d) {
    return d.value;
  }
  function d3_layout_hierarchySort(a, b) {
    return b.value - a.value;
  }
  function d3_layout_hierarchyLinks(nodes) {
    return d3.merge(nodes.map(function(parent) {
      return (parent.children || []).map(function(child) {
        return {
          source: parent,
          target: child
        };
      });
    }));
  }
  d3.layout.partition = function() {
    var hierarchy = d3.layout.hierarchy(), size = [ 1, 1 ];
    function position(node, x, dx, dy) {
      var children = node.children;
      node.x = x;
      node.y = node.depth * dy;
      node.dx = dx;
      node.dy = dy;
      if (children && (n = children.length)) {
        var i = -1, n, c, d;
        dx = node.value ? dx / node.value : 0;
        while (++i < n) {
          position(c = children[i], x, d = c.value * dx, dy);
          x += d;
        }
      }
    }
    function depth(node) {
      var children = node.children, d = 0;
      if (children && (n = children.length)) {
        var i = -1, n;
        while (++i < n) d = Math.max(d, depth(children[i]));
      }
      return 1 + d;
    }
    function partition(d, i) {
      var nodes = hierarchy.call(this, d, i);
      position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));
      return nodes;
    }
    partition.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return partition;
    };
    return d3_layout_hierarchyRebind(partition, hierarchy);
  };
  d3.layout.pie = function() {
    var value = Number, sort = d3_layout_pieSortByValue, startAngle = 0, endAngle = τ, padAngle = 0;
    function pie(data) {
      var n = data.length, values = data.map(function(d, i) {
        return +value.call(pie, d, i);
      }), a = +(typeof startAngle === "function" ? startAngle.apply(this, arguments) : startAngle), da = (typeof endAngle === "function" ? endAngle.apply(this, arguments) : endAngle) - a, p = Math.min(Math.abs(da) / n, +(typeof padAngle === "function" ? padAngle.apply(this, arguments) : padAngle)), pa = p * (da < 0 ? -1 : 1), sum = d3.sum(values), k = sum ? (da - n * pa) / sum : 0, index = d3.range(n), arcs = [], v;
      if (sort != null) index.sort(sort === d3_layout_pieSortByValue ? function(i, j) {
        return values[j] - values[i];
      } : function(i, j) {
        return sort(data[i], data[j]);
      });
      index.forEach(function(i) {
        arcs[i] = {
          data: data[i],
          value: v = values[i],
          startAngle: a,
          endAngle: a += v * k + pa,
          padAngle: p
        };
      });
      return arcs;
    }
    pie.value = function(_) {
      if (!arguments.length) return value;
      value = _;
      return pie;
    };
    pie.sort = function(_) {
      if (!arguments.length) return sort;
      sort = _;
      return pie;
    };
    pie.startAngle = function(_) {
      if (!arguments.length) return startAngle;
      startAngle = _;
      return pie;
    };
    pie.endAngle = function(_) {
      if (!arguments.length) return endAngle;
      endAngle = _;
      return pie;
    };
    pie.padAngle = function(_) {
      if (!arguments.length) return padAngle;
      padAngle = _;
      return pie;
    };
    return pie;
  };
  var d3_layout_pieSortByValue = {};
  d3.layout.stack = function() {
    var values = d3_identity, order = d3_layout_stackOrderDefault, offset = d3_layout_stackOffsetZero, out = d3_layout_stackOut, x = d3_layout_stackX, y = d3_layout_stackY;
    function stack(data, index) {
      if (!(n = data.length)) return data;
      var series = data.map(function(d, i) {
        return values.call(stack, d, i);
      });
      var points = series.map(function(d) {
        return d.map(function(v, i) {
          return [ x.call(stack, v, i), y.call(stack, v, i) ];
        });
      });
      var orders = order.call(stack, points, index);
      series = d3.permute(series, orders);
      points = d3.permute(points, orders);
      var offsets = offset.call(stack, points, index);
      var m = series[0].length, n, i, j, o;
      for (j = 0; j < m; ++j) {
        out.call(stack, series[0][j], o = offsets[j], points[0][j][1]);
        for (i = 1; i < n; ++i) {
          out.call(stack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
        }
      }
      return data;
    }
    stack.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      return stack;
    };
    stack.order = function(x) {
      if (!arguments.length) return order;
      order = typeof x === "function" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;
      return stack;
    };
    stack.offset = function(x) {
      if (!arguments.length) return offset;
      offset = typeof x === "function" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;
      return stack;
    };
    stack.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      return stack;
    };
    stack.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      return stack;
    };
    stack.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      return stack;
    };
    return stack;
  };
  function d3_layout_stackX(d) {
    return d.x;
  }
  function d3_layout_stackY(d) {
    return d.y;
  }
  function d3_layout_stackOut(d, y0, y) {
    d.y0 = y0;
    d.y = y;
  }
  var d3_layout_stackOrders = d3.map({
    "inside-out": function(data) {
      var n = data.length, i, j, max = data.map(d3_layout_stackMaxIndex), sums = data.map(d3_layout_stackReduceSum), index = d3.range(n).sort(function(a, b) {
        return max[a] - max[b];
      }), top = 0, bottom = 0, tops = [], bottoms = [];
      for (i = 0; i < n; ++i) {
        j = index[i];
        if (top < bottom) {
          top += sums[j];
          tops.push(j);
        } else {
          bottom += sums[j];
          bottoms.push(j);
        }
      }
      return bottoms.reverse().concat(tops);
    },
    reverse: function(data) {
      return d3.range(data.length).reverse();
    },
    "default": d3_layout_stackOrderDefault
  });
  var d3_layout_stackOffsets = d3.map({
    silhouette: function(data) {
      var n = data.length, m = data[0].length, sums = [], max = 0, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o > max) max = o;
        sums.push(o);
      }
      for (j = 0; j < m; ++j) {
        y0[j] = (max - sums[j]) / 2;
      }
      return y0;
    },
    wiggle: function(data) {
      var n = data.length, x = data[0], m = x.length, i, j, k, s1, s2, s3, dx, o, o0, y0 = [];
      y0[0] = o = o0 = 0;
      for (j = 1; j < m; ++j) {
        for (i = 0, s1 = 0; i < n; ++i) s1 += data[i][j][1];
        for (i = 0, s2 = 0, dx = x[j][0] - x[j - 1][0]; i < n; ++i) {
          for (k = 0, s3 = (data[i][j][1] - data[i][j - 1][1]) / (2 * dx); k < i; ++k) {
            s3 += (data[k][j][1] - data[k][j - 1][1]) / dx;
          }
          s2 += s3 * data[i][j][1];
        }
        y0[j] = o -= s1 ? s2 / s1 * dx : 0;
        if (o < o0) o0 = o;
      }
      for (j = 0; j < m; ++j) y0[j] -= o0;
      return y0;
    },
    expand: function(data) {
      var n = data.length, m = data[0].length, k = 1 / n, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o) for (i = 0; i < n; i++) data[i][j][1] /= o; else for (i = 0; i < n; i++) data[i][j][1] = k;
      }
      for (j = 0; j < m; ++j) y0[j] = 0;
      return y0;
    },
    zero: d3_layout_stackOffsetZero
  });
  function d3_layout_stackOrderDefault(data) {
    return d3.range(data.length);
  }
  function d3_layout_stackOffsetZero(data) {
    var j = -1, m = data[0].length, y0 = [];
    while (++j < m) y0[j] = 0;
    return y0;
  }
  function d3_layout_stackMaxIndex(array) {
    var i = 1, j = 0, v = array[0][1], k, n = array.length;
    for (;i < n; ++i) {
      if ((k = array[i][1]) > v) {
        j = i;
        v = k;
      }
    }
    return j;
  }
  function d3_layout_stackReduceSum(d) {
    return d.reduce(d3_layout_stackSum, 0);
  }
  function d3_layout_stackSum(p, d) {
    return p + d[1];
  }
  d3.layout.histogram = function() {
    var frequency = true, valuer = Number, ranger = d3_layout_histogramRange, binner = d3_layout_histogramBinSturges;
    function histogram(data, i) {
      var bins = [], values = data.map(valuer, this), range = ranger.call(this, values, i), thresholds = binner.call(this, range, values, i), bin, i = -1, n = values.length, m = thresholds.length - 1, k = frequency ? 1 : 1 / n, x;
      while (++i < m) {
        bin = bins[i] = [];
        bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
        bin.y = 0;
      }
      if (m > 0) {
        i = -1;
        while (++i < n) {
          x = values[i];
          if (x >= range[0] && x <= range[1]) {
            bin = bins[d3.bisect(thresholds, x, 1, m) - 1];
            bin.y += k;
            bin.push(data[i]);
          }
        }
      }
      return bins;
    }
    histogram.value = function(x) {
      if (!arguments.length) return valuer;
      valuer = x;
      return histogram;
    };
    histogram.range = function(x) {
      if (!arguments.length) return ranger;
      ranger = d3_functor(x);
      return histogram;
    };
    histogram.bins = function(x) {
      if (!arguments.length) return binner;
      binner = typeof x === "number" ? function(range) {
        return d3_layout_histogramBinFixed(range, x);
      } : d3_functor(x);
      return histogram;
    };
    histogram.frequency = function(x) {
      if (!arguments.length) return frequency;
      frequency = !!x;
      return histogram;
    };
    return histogram;
  };
  function d3_layout_histogramBinSturges(range, values) {
    return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));
  }
  function d3_layout_histogramBinFixed(range, n) {
    var x = -1, b = +range[0], m = (range[1] - b) / n, f = [];
    while (++x <= n) f[x] = m * x + b;
    return f;
  }
  function d3_layout_histogramRange(values) {
    return [ d3.min(values), d3.max(values) ];
  }
  d3.layout.pack = function() {
    var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort), padding = 0, size = [ 1, 1 ], radius;
    function pack(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], w = size[0], h = size[1], r = radius == null ? Math.sqrt : typeof radius === "function" ? radius : function() {
        return radius;
      };
      root.x = root.y = 0;
      d3_layout_hierarchyVisitAfter(root, function(d) {
        d.r = +r(d.value);
      });
      d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);
      if (padding) {
        var dr = padding * (radius ? 1 : Math.max(2 * root.r / w, 2 * root.r / h)) / 2;
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r += dr;
        });
        d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r -= dr;
        });
      }
      d3_layout_packTransform(root, w / 2, h / 2, radius ? 1 : 1 / Math.max(2 * root.r / w, 2 * root.r / h));
      return nodes;
    }
    pack.size = function(_) {
      if (!arguments.length) return size;
      size = _;
      return pack;
    };
    pack.radius = function(_) {
      if (!arguments.length) return radius;
      radius = _ == null || typeof _ === "function" ? _ : +_;
      return pack;
    };
    pack.padding = function(_) {
      if (!arguments.length) return padding;
      padding = +_;
      return pack;
    };
    return d3_layout_hierarchyRebind(pack, hierarchy);
  };
  function d3_layout_packSort(a, b) {
    return a.value - b.value;
  }
  function d3_layout_packInsert(a, b) {
    var c = a._pack_next;
    a._pack_next = b;
    b._pack_prev = a;
    b._pack_next = c;
    c._pack_prev = b;
  }
  function d3_layout_packSplice(a, b) {
    a._pack_next = b;
    b._pack_prev = a;
  }
  function d3_layout_packIntersects(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, dr = a.r + b.r;
    return .999 * dr * dr > dx * dx + dy * dy;
  }
  function d3_layout_packSiblings(node) {
    if (!(nodes = node.children) || !(n = nodes.length)) return;
    var nodes, xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, a, b, c, i, j, k, n;
    function bound(node) {
      xMin = Math.min(node.x - node.r, xMin);
      xMax = Math.max(node.x + node.r, xMax);
      yMin = Math.min(node.y - node.r, yMin);
      yMax = Math.max(node.y + node.r, yMax);
    }
    nodes.forEach(d3_layout_packLink);
    a = nodes[0];
    a.x = -a.r;
    a.y = 0;
    bound(a);
    if (n > 1) {
      b = nodes[1];
      b.x = b.r;
      b.y = 0;
      bound(b);
      if (n > 2) {
        c = nodes[2];
        d3_layout_packPlace(a, b, c);
        bound(c);
        d3_layout_packInsert(a, c);
        a._pack_prev = c;
        d3_layout_packInsert(c, b);
        b = a._pack_next;
        for (i = 3; i < n; i++) {
          d3_layout_packPlace(a, b, c = nodes[i]);
          var isect = 0, s1 = 1, s2 = 1;
          for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
            if (d3_layout_packIntersects(j, c)) {
              isect = 1;
              break;
            }
          }
          if (isect == 1) {
            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
              if (d3_layout_packIntersects(k, c)) {
                break;
              }
            }
          }
          if (isect) {
            if (s1 < s2 || s1 == s2 && b.r < a.r) d3_layout_packSplice(a, b = j); else d3_layout_packSplice(a = k, b);
            i--;
          } else {
            d3_layout_packInsert(a, c);
            b = c;
            bound(c);
          }
        }
      }
    }
    var cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2, cr = 0;
    for (i = 0; i < n; i++) {
      c = nodes[i];
      c.x -= cx;
      c.y -= cy;
      cr = Math.max(cr, c.r + Math.sqrt(c.x * c.x + c.y * c.y));
    }
    node.r = cr;
    nodes.forEach(d3_layout_packUnlink);
  }
  function d3_layout_packLink(node) {
    node._pack_next = node._pack_prev = node;
  }
  function d3_layout_packUnlink(node) {
    delete node._pack_next;
    delete node._pack_prev;
  }
  function d3_layout_packTransform(node, x, y, k) {
    var children = node.children;
    node.x = x += k * node.x;
    node.y = y += k * node.y;
    node.r *= k;
    if (children) {
      var i = -1, n = children.length;
      while (++i < n) d3_layout_packTransform(children[i], x, y, k);
    }
  }
  function d3_layout_packPlace(a, b, c) {
    var db = a.r + c.r, dx = b.x - a.x, dy = b.y - a.y;
    if (db && (dx || dy)) {
      var da = b.r + c.r, dc = dx * dx + dy * dy;
      da *= da;
      db *= db;
      var x = .5 + (db - da) / (2 * dc), y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
      c.x = a.x + x * dx + y * dy;
      c.y = a.y + x * dy - y * dx;
    } else {
      c.x = a.x + db;
      c.y = a.y;
    }
  }
  d3.layout.tree = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = null;
    function tree(d, i) {
      var nodes = hierarchy.call(this, d, i), root0 = nodes[0], root1 = wrapTree(root0);
      d3_layout_hierarchyVisitAfter(root1, firstWalk), root1.parent.m = -root1.z;
      d3_layout_hierarchyVisitBefore(root1, secondWalk);
      if (nodeSize) d3_layout_hierarchyVisitBefore(root0, sizeNode); else {
        var left = root0, right = root0, bottom = root0;
        d3_layout_hierarchyVisitBefore(root0, function(node) {
          if (node.x < left.x) left = node;
          if (node.x > right.x) right = node;
          if (node.depth > bottom.depth) bottom = node;
        });
        var tx = separation(left, right) / 2 - left.x, kx = size[0] / (right.x + separation(right, left) / 2 + tx), ky = size[1] / (bottom.depth || 1);
        d3_layout_hierarchyVisitBefore(root0, function(node) {
          node.x = (node.x + tx) * kx;
          node.y = node.depth * ky;
        });
      }
      return nodes;
    }
    function wrapTree(root0) {
      var root1 = {
        A: null,
        children: [ root0 ]
      }, queue = [ root1 ], node1;
      while ((node1 = queue.pop()) != null) {
        for (var children = node1.children, child, i = 0, n = children.length; i < n; ++i) {
          queue.push((children[i] = child = {
            _: children[i],
            parent: node1,
            children: (child = children[i].children) && child.slice() || [],
            A: null,
            a: null,
            z: 0,
            m: 0,
            c: 0,
            s: 0,
            t: null,
            i: i
          }).a = child);
        }
      }
      return root1.children[0];
    }
    function firstWalk(v) {
      var children = v.children, siblings = v.parent.children, w = v.i ? siblings[v.i - 1] : null;
      if (children.length) {
        d3_layout_treeShift(v);
        var midpoint = (children[0].z + children[children.length - 1].z) / 2;
        if (w) {
          v.z = w.z + separation(v._, w._);
          v.m = v.z - midpoint;
        } else {
          v.z = midpoint;
        }
      } else if (w) {
        v.z = w.z + separation(v._, w._);
      }
      v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
    }
    function secondWalk(v) {
      v._.x = v.z + v.parent.m;
      v.m += v.parent.m;
    }
    function apportion(v, w, ancestor) {
      if (w) {
        var vip = v, vop = v, vim = w, vom = vip.parent.children[0], sip = vip.m, sop = vop.m, sim = vim.m, som = vom.m, shift;
        while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {
          vom = d3_layout_treeLeft(vom);
          vop = d3_layout_treeRight(vop);
          vop.a = v;
          shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
          if (shift > 0) {
            d3_layout_treeMove(d3_layout_treeAncestor(vim, v, ancestor), v, shift);
            sip += shift;
            sop += shift;
          }
          sim += vim.m;
          sip += vip.m;
          som += vom.m;
          sop += vop.m;
        }
        if (vim && !d3_layout_treeRight(vop)) {
          vop.t = vim;
          vop.m += sim - sop;
        }
        if (vip && !d3_layout_treeLeft(vom)) {
          vom.t = vip;
          vom.m += sip - som;
          ancestor = v;
        }
      }
      return ancestor;
    }
    function sizeNode(node) {
      node.x *= size[0];
      node.y = node.depth * size[1];
    }
    tree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return tree;
    };
    tree.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null ? sizeNode : null;
      return tree;
    };
    tree.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) == null ? null : sizeNode;
      return tree;
    };
    return d3_layout_hierarchyRebind(tree, hierarchy);
  };
  function d3_layout_treeSeparation(a, b) {
    return a.parent == b.parent ? 1 : 2;
  }
  function d3_layout_treeLeft(v) {
    var children = v.children;
    return children.length ? children[0] : v.t;
  }
  function d3_layout_treeRight(v) {
    var children = v.children, n;
    return (n = children.length) ? children[n - 1] : v.t;
  }
  function d3_layout_treeMove(wm, wp, shift) {
    var change = shift / (wp.i - wm.i);
    wp.c -= change;
    wp.s += shift;
    wm.c += change;
    wp.z += shift;
    wp.m += shift;
  }
  function d3_layout_treeShift(v) {
    var shift = 0, change = 0, children = v.children, i = children.length, w;
    while (--i >= 0) {
      w = children[i];
      w.z += shift;
      w.m += shift;
      shift += w.s + (change += w.c);
    }
  }
  function d3_layout_treeAncestor(vim, v, ancestor) {
    return vim.a.parent === v.parent ? vim.a : ancestor;
  }
  d3.layout.cluster = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = false;
    function cluster(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], previousNode, x = 0;
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var children = node.children;
        if (children && children.length) {
          node.x = d3_layout_clusterX(children);
          node.y = d3_layout_clusterY(children);
        } else {
          node.x = previousNode ? x += separation(node, previousNode) : 0;
          node.y = 0;
          previousNode = node;
        }
      });
      var left = d3_layout_clusterLeft(root), right = d3_layout_clusterRight(root), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2;
      d3_layout_hierarchyVisitAfter(root, nodeSize ? function(node) {
        node.x = (node.x - root.x) * size[0];
        node.y = (root.y - node.y) * size[1];
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * size[0];
        node.y = (1 - (root.y ? node.y / root.y : 1)) * size[1];
      });
      return nodes;
    }
    cluster.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return cluster;
    };
    cluster.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null;
      return cluster;
    };
    cluster.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) != null;
      return cluster;
    };
    return d3_layout_hierarchyRebind(cluster, hierarchy);
  };
  function d3_layout_clusterY(children) {
    return 1 + d3.max(children, function(child) {
      return child.y;
    });
  }
  function d3_layout_clusterX(children) {
    return children.reduce(function(x, child) {
      return x + child.x;
    }, 0) / children.length;
  }
  function d3_layout_clusterLeft(node) {
    var children = node.children;
    return children && children.length ? d3_layout_clusterLeft(children[0]) : node;
  }
  function d3_layout_clusterRight(node) {
    var children = node.children, n;
    return children && (n = children.length) ? d3_layout_clusterRight(children[n - 1]) : node;
  }
  d3.layout.treemap = function() {
    var hierarchy = d3.layout.hierarchy(), round = Math.round, size = [ 1, 1 ], padding = null, pad = d3_layout_treemapPadNull, sticky = false, stickies, mode = "squarify", ratio = .5 * (1 + Math.sqrt(5));
    function scale(children, k) {
      var i = -1, n = children.length, child, area;
      while (++i < n) {
        area = (child = children[i]).value * (k < 0 ? 0 : k);
        child.area = isNaN(area) || area <= 0 ? 0 : area;
      }
    }
    function squarify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), row = [], remaining = children.slice(), child, best = Infinity, score, u = mode === "slice" ? rect.dx : mode === "dice" ? rect.dy : mode === "slice-dice" ? node.depth & 1 ? rect.dy : rect.dx : Math.min(rect.dx, rect.dy), n;
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while ((n = remaining.length) > 0) {
          row.push(child = remaining[n - 1]);
          row.area += child.area;
          if (mode !== "squarify" || (score = worst(row, u)) <= best) {
            remaining.pop();
            best = score;
          } else {
            row.area -= row.pop().area;
            position(row, u, rect, false);
            u = Math.min(rect.dx, rect.dy);
            row.length = row.area = 0;
            best = Infinity;
          }
        }
        if (row.length) {
          position(row, u, rect, true);
          row.length = row.area = 0;
        }
        children.forEach(squarify);
      }
    }
    function stickify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), remaining = children.slice(), child, row = [];
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while (child = remaining.pop()) {
          row.push(child);
          row.area += child.area;
          if (child.z != null) {
            position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);
            row.length = row.area = 0;
          }
        }
        children.forEach(stickify);
      }
    }
    function worst(row, u) {
      var s = row.area, r, rmax = 0, rmin = Infinity, i = -1, n = row.length;
      while (++i < n) {
        if (!(r = row[i].area)) continue;
        if (r < rmin) rmin = r;
        if (r > rmax) rmax = r;
      }
      s *= s;
      u *= u;
      return s ? Math.max(u * rmax * ratio / s, s / (u * rmin * ratio)) : Infinity;
    }
    function position(row, u, rect, flush) {
      var i = -1, n = row.length, x = rect.x, y = rect.y, v = u ? round(row.area / u) : 0, o;
      if (u == rect.dx) {
        if (flush || v > rect.dy) v = rect.dy;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dy = v;
          x += o.dx = Math.min(rect.x + rect.dx - x, v ? round(o.area / v) : 0);
        }
        o.z = true;
        o.dx += rect.x + rect.dx - x;
        rect.y += v;
        rect.dy -= v;
      } else {
        if (flush || v > rect.dx) v = rect.dx;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dx = v;
          y += o.dy = Math.min(rect.y + rect.dy - y, v ? round(o.area / v) : 0);
        }
        o.z = false;
        o.dy += rect.y + rect.dy - y;
        rect.x += v;
        rect.dx -= v;
      }
    }
    function treemap(d) {
      var nodes = stickies || hierarchy(d), root = nodes[0];
      root.x = root.y = 0;
      if (root.value) root.dx = size[0], root.dy = size[1]; else root.dx = root.dy = 0;
      if (stickies) hierarchy.revalue(root);
      scale([ root ], root.dx * root.dy / root.value);
      (stickies ? stickify : squarify)(root);
      if (sticky) stickies = nodes;
      return nodes;
    }
    treemap.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return treemap;
    };
    treemap.padding = function(x) {
      if (!arguments.length) return padding;
      function padFunction(node) {
        var p = x.call(treemap, node, node.depth);
        return p == null ? d3_layout_treemapPadNull(node) : d3_layout_treemapPad(node, typeof p === "number" ? [ p, p, p, p ] : p);
      }
      function padConstant(node) {
        return d3_layout_treemapPad(node, x);
      }
      var type;
      pad = (padding = x) == null ? d3_layout_treemapPadNull : (type = typeof x) === "function" ? padFunction : type === "number" ? (x = [ x, x, x, x ], 
      padConstant) : padConstant;
      return treemap;
    };
    treemap.round = function(x) {
      if (!arguments.length) return round != Number;
      round = x ? Math.round : Number;
      return treemap;
    };
    treemap.sticky = function(x) {
      if (!arguments.length) return sticky;
      sticky = x;
      stickies = null;
      return treemap;
    };
    treemap.ratio = function(x) {
      if (!arguments.length) return ratio;
      ratio = x;
      return treemap;
    };
    treemap.mode = function(x) {
      if (!arguments.length) return mode;
      mode = x + "";
      return treemap;
    };
    return d3_layout_hierarchyRebind(treemap, hierarchy);
  };
  function d3_layout_treemapPadNull(node) {
    return {
      x: node.x,
      y: node.y,
      dx: node.dx,
      dy: node.dy
    };
  }
  function d3_layout_treemapPad(node, padding) {
    var x = node.x + padding[3], y = node.y + padding[0], dx = node.dx - padding[1] - padding[3], dy = node.dy - padding[0] - padding[2];
    if (dx < 0) {
      x += dx / 2;
      dx = 0;
    }
    if (dy < 0) {
      y += dy / 2;
      dy = 0;
    }
    return {
      x: x,
      y: y,
      dx: dx,
      dy: dy
    };
  }
  d3.random = {
    normal: function(µ, σ) {
      var n = arguments.length;
      if (n < 2) σ = 1;
      if (n < 1) µ = 0;
      return function() {
        var x, y, r;
        do {
          x = Math.random() * 2 - 1;
          y = Math.random() * 2 - 1;
          r = x * x + y * y;
        } while (!r || r > 1);
        return µ + σ * x * Math.sqrt(-2 * Math.log(r) / r);
      };
    },
    logNormal: function() {
      var random = d3.random.normal.apply(d3, arguments);
      return function() {
        return Math.exp(random());
      };
    },
    bates: function(m) {
      var random = d3.random.irwinHall(m);
      return function() {
        return random() / m;
      };
    },
    irwinHall: function(m) {
      return function() {
        for (var s = 0, j = 0; j < m; j++) s += Math.random();
        return s;
      };
    }
  };
  d3.scale = {};
  function d3_scaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [ start, stop ] : [ stop, start ];
  }
  function d3_scaleRange(scale) {
    return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
  }
  function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
    var u = uninterpolate(domain[0], domain[1]), i = interpolate(range[0], range[1]);
    return function(x) {
      return i(u(x));
    };
  }
  function d3_scale_nice(domain, nice) {
    var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], dx;
    if (x1 < x0) {
      dx = i0, i0 = i1, i1 = dx;
      dx = x0, x0 = x1, x1 = dx;
    }
    domain[i0] = nice.floor(x0);
    domain[i1] = nice.ceil(x1);
    return domain;
  }
  function d3_scale_niceStep(step) {
    return step ? {
      floor: function(x) {
        return Math.floor(x / step) * step;
      },
      ceil: function(x) {
        return Math.ceil(x / step) * step;
      }
    } : d3_scale_niceIdentity;
  }
  var d3_scale_niceIdentity = {
    floor: d3_identity,
    ceil: d3_identity
  };
  function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
    var u = [], i = [], j = 0, k = Math.min(domain.length, range.length) - 1;
    if (domain[k] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }
    while (++j <= k) {
      u.push(uninterpolate(domain[j - 1], domain[j]));
      i.push(interpolate(range[j - 1], range[j]));
    }
    return function(x) {
      var j = d3.bisect(domain, x, 1, k) - 1;
      return i[j](u[j](x));
    };
  }
  d3.scale.linear = function() {
    return d3_scale_linear([ 0, 1 ], [ 0, 1 ], d3_interpolate, false);
  };
  function d3_scale_linear(domain, range, interpolate, clamp) {
    var output, input;
    function rescale() {
      var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear, uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
      output = linear(domain, range, uninterpolate, interpolate);
      input = linear(range, domain, uninterpolate, d3_interpolate);
      return scale;
    }
    function scale(x) {
      return output(x);
    }
    scale.invert = function(y) {
      return input(y);
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(Number);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.rangeRound = function(x) {
      return scale.range(x).interpolate(d3_interpolateRound);
    };
    scale.clamp = function(x) {
      if (!arguments.length) return clamp;
      clamp = x;
      return rescale();
    };
    scale.interpolate = function(x) {
      if (!arguments.length) return interpolate;
      interpolate = x;
      return rescale();
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      d3_scale_linearNice(domain, m);
      return rescale();
    };
    scale.copy = function() {
      return d3_scale_linear(domain, range, interpolate, clamp);
    };
    return rescale();
  }
  function d3_scale_linearRebind(scale, linear) {
    return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
  }
  function d3_scale_linearNice(domain, m) {
    d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
    d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
    return domain;
  }
  function d3_scale_linearTickRange(domain, m) {
    if (m == null) m = 10;
    var extent = d3_scaleExtent(domain), span = extent[1] - extent[0], step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)), err = m / span * step;
    if (err <= .15) step *= 10; else if (err <= .35) step *= 5; else if (err <= .75) step *= 2;
    extent[0] = Math.ceil(extent[0] / step) * step;
    extent[1] = Math.floor(extent[1] / step) * step + step * .5;
    extent[2] = step;
    return extent;
  }
  function d3_scale_linearTicks(domain, m) {
    return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
  }
  function d3_scale_linearTickFormat(domain, m, format) {
    var range = d3_scale_linearTickRange(domain, m);
    if (format) {
      var match = d3_format_re.exec(format);
      match.shift();
      if (match[8] === "s") {
        var prefix = d3.formatPrefix(Math.max(abs(range[0]), abs(range[1])));
        if (!match[7]) match[7] = "." + d3_scale_linearPrecision(prefix.scale(range[2]));
        match[8] = "f";
        format = d3.format(match.join(""));
        return function(d) {
          return format(prefix.scale(d)) + prefix.symbol;
        };
      }
      if (!match[7]) match[7] = "." + d3_scale_linearFormatPrecision(match[8], range);
      format = match.join("");
    } else {
      format = ",." + d3_scale_linearPrecision(range[2]) + "f";
    }
    return d3.format(format);
  }
  var d3_scale_linearFormatSignificant = {
    s: 1,
    g: 1,
    p: 1,
    r: 1,
    e: 1
  };
  function d3_scale_linearPrecision(value) {
    return -Math.floor(Math.log(value) / Math.LN10 + .01);
  }
  function d3_scale_linearFormatPrecision(type, range) {
    var p = d3_scale_linearPrecision(range[2]);
    return type in d3_scale_linearFormatSignificant ? Math.abs(p - d3_scale_linearPrecision(Math.max(abs(range[0]), abs(range[1])))) + +(type !== "e") : p - (type === "%") * 2;
  }
  d3.scale.log = function() {
    return d3_scale_log(d3.scale.linear().domain([ 0, 1 ]), 10, true, [ 1, 10 ]);
  };
  function d3_scale_log(linear, base, positive, domain) {
    function log(x) {
      return (positive ? Math.log(x < 0 ? 0 : x) : -Math.log(x > 0 ? 0 : -x)) / Math.log(base);
    }
    function pow(x) {
      return positive ? Math.pow(base, x) : -Math.pow(base, -x);
    }
    function scale(x) {
      return linear(log(x));
    }
    scale.invert = function(x) {
      return pow(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      positive = x[0] >= 0;
      linear.domain((domain = x.map(Number)).map(log));
      return scale;
    };
    scale.base = function(_) {
      if (!arguments.length) return base;
      base = +_;
      linear.domain(domain.map(log));
      return scale;
    };
    scale.nice = function() {
      var niced = d3_scale_nice(domain.map(log), positive ? Math : d3_scale_logNiceNegative);
      linear.domain(niced);
      domain = niced.map(pow);
      return scale;
    };
    scale.ticks = function() {
      var extent = d3_scaleExtent(domain), ticks = [], u = extent[0], v = extent[1], i = Math.floor(log(u)), j = Math.ceil(log(v)), n = base % 1 ? 2 : base;
      if (isFinite(j - i)) {
        if (positive) {
          for (;i < j; i++) for (var k = 1; k < n; k++) ticks.push(pow(i) * k);
          ticks.push(pow(i));
        } else {
          ticks.push(pow(i));
          for (;i++ < j; ) for (var k = n - 1; k > 0; k--) ticks.push(pow(i) * k);
        }
        for (i = 0; ticks[i] < u; i++) {}
        for (j = ticks.length; ticks[j - 1] > v; j--) {}
        ticks = ticks.slice(i, j);
      }
      return ticks;
    };
    scale.tickFormat = function(n, format) {
      if (!arguments.length) return d3_scale_logFormat;
      if (arguments.length < 2) format = d3_scale_logFormat; else if (typeof format !== "function") format = d3.format(format);
      var k = Math.max(1, base * n / scale.ticks().length);
      return function(d) {
        var i = d / pow(Math.round(log(d)));
        if (i * base < base - .5) i *= base;
        return i <= k ? format(d) : "";
      };
    };
    scale.copy = function() {
      return d3_scale_log(linear.copy(), base, positive, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  var d3_scale_logFormat = d3.format(".0e"), d3_scale_logNiceNegative = {
    floor: function(x) {
      return -Math.ceil(-x);
    },
    ceil: function(x) {
      return -Math.floor(-x);
    }
  };
  d3.scale.pow = function() {
    return d3_scale_pow(d3.scale.linear(), 1, [ 0, 1 ]);
  };
  function d3_scale_pow(linear, exponent, domain) {
    var powp = d3_scale_powPow(exponent), powb = d3_scale_powPow(1 / exponent);
    function scale(x) {
      return linear(powp(x));
    }
    scale.invert = function(x) {
      return powb(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      linear.domain((domain = x.map(Number)).map(powp));
      return scale;
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      return scale.domain(d3_scale_linearNice(domain, m));
    };
    scale.exponent = function(x) {
      if (!arguments.length) return exponent;
      powp = d3_scale_powPow(exponent = x);
      powb = d3_scale_powPow(1 / exponent);
      linear.domain(domain.map(powp));
      return scale;
    };
    scale.copy = function() {
      return d3_scale_pow(linear.copy(), exponent, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_scale_powPow(e) {
    return function(x) {
      return x < 0 ? -Math.pow(-x, e) : Math.pow(x, e);
    };
  }
  d3.scale.sqrt = function() {
    return d3.scale.pow().exponent(.5);
  };
  d3.scale.ordinal = function() {
    return d3_scale_ordinal([], {
      t: "range",
      a: [ [] ]
    });
  };
  function d3_scale_ordinal(domain, ranger) {
    var index, range, rangeBand;
    function scale(x) {
      return range[((index.get(x) || (ranger.t === "range" ? index.set(x, domain.push(x)) : NaN)) - 1) % range.length];
    }
    function steps(start, step) {
      return d3.range(domain.length).map(function(i) {
        return start + step * i;
      });
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = [];
      index = new d3_Map();
      var i = -1, n = x.length, xi;
      while (++i < n) if (!index.has(xi = x[i])) index.set(xi, domain.push(xi));
      return scale[ranger.t].apply(scale, ranger.a);
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      rangeBand = 0;
      ranger = {
        t: "range",
        a: arguments
      };
      return scale;
    };
    scale.rangePoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = domain.length < 2 ? (start = (start + stop) / 2, 
      0) : (stop - start) / (domain.length - 1 + padding);
      range = steps(start + step * padding / 2, step);
      rangeBand = 0;
      ranger = {
        t: "rangePoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundPoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = domain.length < 2 ? (start = stop = Math.round((start + stop) / 2), 
      0) : (stop - start) / (domain.length - 1 + padding) | 0;
      range = steps(start + Math.round(step * padding / 2 + (stop - start - (domain.length - 1 + padding) * step) / 2), step);
      rangeBand = 0;
      ranger = {
        t: "rangeRoundPoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = (stop - start) / (domain.length - padding + 2 * outerPadding);
      range = steps(start + step * outerPadding, step);
      if (reverse) range.reverse();
      rangeBand = step * (1 - padding);
      ranger = {
        t: "rangeBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = Math.floor((stop - start) / (domain.length - padding + 2 * outerPadding));
      range = steps(start + Math.round((stop - start - (domain.length - padding) * step) / 2), step);
      if (reverse) range.reverse();
      rangeBand = Math.round(step * (1 - padding));
      ranger = {
        t: "rangeRoundBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeBand = function() {
      return rangeBand;
    };
    scale.rangeExtent = function() {
      return d3_scaleExtent(ranger.a[0]);
    };
    scale.copy = function() {
      return d3_scale_ordinal(domain, ranger);
    };
    return scale.domain(domain);
  }
  d3.scale.category10 = function() {
    return d3.scale.ordinal().range(d3_category10);
  };
  d3.scale.category20 = function() {
    return d3.scale.ordinal().range(d3_category20);
  };
  d3.scale.category20b = function() {
    return d3.scale.ordinal().range(d3_category20b);
  };
  d3.scale.category20c = function() {
    return d3.scale.ordinal().range(d3_category20c);
  };
  var d3_category10 = [ 2062260, 16744206, 2924588, 14034728, 9725885, 9197131, 14907330, 8355711, 12369186, 1556175 ].map(d3_rgbString);
  var d3_category20 = [ 2062260, 11454440, 16744206, 16759672, 2924588, 10018698, 14034728, 16750742, 9725885, 12955861, 9197131, 12885140, 14907330, 16234194, 8355711, 13092807, 12369186, 14408589, 1556175, 10410725 ].map(d3_rgbString);
  var d3_category20b = [ 3750777, 5395619, 7040719, 10264286, 6519097, 9216594, 11915115, 13556636, 9202993, 12426809, 15186514, 15190932, 8666169, 11356490, 14049643, 15177372, 8077683, 10834324, 13528509, 14589654 ].map(d3_rgbString);
  var d3_category20c = [ 3244733, 7057110, 10406625, 13032431, 15095053, 16616764, 16625259, 16634018, 3253076, 7652470, 10607003, 13101504, 7695281, 10394312, 12369372, 14342891, 6513507, 9868950, 12434877, 14277081 ].map(d3_rgbString);
  d3.scale.quantile = function() {
    return d3_scale_quantile([], []);
  };
  function d3_scale_quantile(domain, range) {
    var thresholds;
    function rescale() {
      var k = 0, q = range.length;
      thresholds = [];
      while (++k < q) thresholds[k - 1] = d3.quantile(domain, k / q);
      return scale;
    }
    function scale(x) {
      if (!isNaN(x = +x)) return range[d3.bisect(thresholds, x)];
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(d3_number).filter(d3_numeric).sort(d3_ascending);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.quantiles = function() {
      return thresholds;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return y < 0 ? [ NaN, NaN ] : [ y > 0 ? thresholds[y - 1] : domain[0], y < thresholds.length ? thresholds[y] : domain[domain.length - 1] ];
    };
    scale.copy = function() {
      return d3_scale_quantile(domain, range);
    };
    return rescale();
  }
  d3.scale.quantize = function() {
    return d3_scale_quantize(0, 1, [ 0, 1 ]);
  };
  function d3_scale_quantize(x0, x1, range) {
    var kx, i;
    function scale(x) {
      return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];
    }
    function rescale() {
      kx = range.length / (x1 - x0);
      i = range.length - 1;
      return scale;
    }
    scale.domain = function(x) {
      if (!arguments.length) return [ x0, x1 ];
      x0 = +x[0];
      x1 = +x[x.length - 1];
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      y = y < 0 ? NaN : y / kx + x0;
      return [ y, y + 1 / kx ];
    };
    scale.copy = function() {
      return d3_scale_quantize(x0, x1, range);
    };
    return rescale();
  }
  d3.scale.threshold = function() {
    return d3_scale_threshold([ .5 ], [ 0, 1 ]);
  };
  function d3_scale_threshold(domain, range) {
    function scale(x) {
      if (x <= x) return range[d3.bisect(domain, x)];
    }
    scale.domain = function(_) {
      if (!arguments.length) return domain;
      domain = _;
      return scale;
    };
    scale.range = function(_) {
      if (!arguments.length) return range;
      range = _;
      return scale;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return [ domain[y - 1], domain[y] ];
    };
    scale.copy = function() {
      return d3_scale_threshold(domain, range);
    };
    return scale;
  }
  d3.scale.identity = function() {
    return d3_scale_identity([ 0, 1 ]);
  };
  function d3_scale_identity(domain) {
    function identity(x) {
      return +x;
    }
    identity.invert = identity;
    identity.domain = identity.range = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(identity);
      return identity;
    };
    identity.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    identity.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    identity.copy = function() {
      return d3_scale_identity(domain);
    };
    return identity;
  }
  d3.svg = {};
  function d3_zero() {
    return 0;
  }
  d3.svg.arc = function() {
    var innerRadius = d3_svg_arcInnerRadius, outerRadius = d3_svg_arcOuterRadius, cornerRadius = d3_zero, padRadius = d3_svg_arcAuto, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle, padAngle = d3_svg_arcPadAngle;
    function arc() {
      var r0 = Math.max(0, +innerRadius.apply(this, arguments)), r1 = Math.max(0, +outerRadius.apply(this, arguments)), a0 = startAngle.apply(this, arguments) - halfπ, a1 = endAngle.apply(this, arguments) - halfπ, da = Math.abs(a1 - a0), cw = a0 > a1 ? 0 : 1;
      if (r1 < r0) rc = r1, r1 = r0, r0 = rc;
      if (da >= τε) return circleSegment(r1, cw) + (r0 ? circleSegment(r0, 1 - cw) : "") + "Z";
      var rc, cr, rp, ap, p0 = 0, p1 = 0, x0, y0, x1, y1, x2, y2, x3, y3, path = [];
      if (ap = (+padAngle.apply(this, arguments) || 0) / 2) {
        rp = padRadius === d3_svg_arcAuto ? Math.sqrt(r0 * r0 + r1 * r1) : +padRadius.apply(this, arguments);
        if (!cw) p1 *= -1;
        if (r1) p1 = d3_asin(rp / r1 * Math.sin(ap));
        if (r0) p0 = d3_asin(rp / r0 * Math.sin(ap));
      }
      if (r1) {
        x0 = r1 * Math.cos(a0 + p1);
        y0 = r1 * Math.sin(a0 + p1);
        x1 = r1 * Math.cos(a1 - p1);
        y1 = r1 * Math.sin(a1 - p1);
        var l1 = Math.abs(a1 - a0 - 2 * p1) <= π ? 0 : 1;
        if (p1 && d3_svg_arcSweep(x0, y0, x1, y1) === cw ^ l1) {
          var h1 = (a0 + a1) / 2;
          x0 = r1 * Math.cos(h1);
          y0 = r1 * Math.sin(h1);
          x1 = y1 = null;
        }
      } else {
        x0 = y0 = 0;
      }
      if (r0) {
        x2 = r0 * Math.cos(a1 - p0);
        y2 = r0 * Math.sin(a1 - p0);
        x3 = r0 * Math.cos(a0 + p0);
        y3 = r0 * Math.sin(a0 + p0);
        var l0 = Math.abs(a0 - a1 + 2 * p0) <= π ? 0 : 1;
        if (p0 && d3_svg_arcSweep(x2, y2, x3, y3) === 1 - cw ^ l0) {
          var h0 = (a0 + a1) / 2;
          x2 = r0 * Math.cos(h0);
          y2 = r0 * Math.sin(h0);
          x3 = y3 = null;
        }
      } else {
        x2 = y2 = 0;
      }
      if (da > ε && (rc = Math.min(Math.abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments))) > .001) {
        cr = r0 < r1 ^ cw ? 0 : 1;
        var rc1 = rc, rc0 = rc;
        if (da < π) {
          var oc = x3 == null ? [ x2, y2 ] : x1 == null ? [ x0, y0 ] : d3_geom_polygonIntersect([ x0, y0 ], [ x3, y3 ], [ x1, y1 ], [ x2, y2 ]), ax = x0 - oc[0], ay = y0 - oc[1], bx = x1 - oc[0], by = y1 - oc[1], kc = 1 / Math.sin(Math.acos((ax * bx + ay * by) / (Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by))) / 2), lc = Math.sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
          rc0 = Math.min(rc, (r0 - lc) / (kc - 1));
          rc1 = Math.min(rc, (r1 - lc) / (kc + 1));
        }
        if (x1 != null) {
          var t30 = d3_svg_arcCornerTangents(x3 == null ? [ x2, y2 ] : [ x3, y3 ], [ x0, y0 ], r1, rc1, cw), t12 = d3_svg_arcCornerTangents([ x1, y1 ], [ x2, y2 ], r1, rc1, cw);
          if (rc === rc1) {
            path.push("M", t30[0], "A", rc1, ",", rc1, " 0 0,", cr, " ", t30[1], "A", r1, ",", r1, " 0 ", 1 - cw ^ d3_svg_arcSweep(t30[1][0], t30[1][1], t12[1][0], t12[1][1]), ",", cw, " ", t12[1], "A", rc1, ",", rc1, " 0 0,", cr, " ", t12[0]);
          } else {
            path.push("M", t30[0], "A", rc1, ",", rc1, " 0 1,", cr, " ", t12[0]);
          }
        } else {
          path.push("M", x0, ",", y0);
        }
        if (x3 != null) {
          var t03 = d3_svg_arcCornerTangents([ x0, y0 ], [ x3, y3 ], r0, -rc0, cw), t21 = d3_svg_arcCornerTangents([ x2, y2 ], x1 == null ? [ x0, y0 ] : [ x1, y1 ], r0, -rc0, cw);
          if (rc === rc0) {
            path.push("L", t21[0], "A", rc0, ",", rc0, " 0 0,", cr, " ", t21[1], "A", r0, ",", r0, " 0 ", cw ^ d3_svg_arcSweep(t21[1][0], t21[1][1], t03[1][0], t03[1][1]), ",", 1 - cw, " ", t03[1], "A", rc0, ",", rc0, " 0 0,", cr, " ", t03[0]);
          } else {
            path.push("L", t21[0], "A", rc0, ",", rc0, " 0 0,", cr, " ", t03[0]);
          }
        } else {
          path.push("L", x2, ",", y2);
        }
      } else {
        path.push("M", x0, ",", y0);
        if (x1 != null) path.push("A", r1, ",", r1, " 0 ", l1, ",", cw, " ", x1, ",", y1);
        path.push("L", x2, ",", y2);
        if (x3 != null) path.push("A", r0, ",", r0, " 0 ", l0, ",", 1 - cw, " ", x3, ",", y3);
      }
      path.push("Z");
      return path.join("");
    }
    function circleSegment(r1, cw) {
      return "M0," + r1 + "A" + r1 + "," + r1 + " 0 1," + cw + " 0," + -r1 + "A" + r1 + "," + r1 + " 0 1," + cw + " 0," + r1;
    }
    arc.innerRadius = function(v) {
      if (!arguments.length) return innerRadius;
      innerRadius = d3_functor(v);
      return arc;
    };
    arc.outerRadius = function(v) {
      if (!arguments.length) return outerRadius;
      outerRadius = d3_functor(v);
      return arc;
    };
    arc.cornerRadius = function(v) {
      if (!arguments.length) return cornerRadius;
      cornerRadius = d3_functor(v);
      return arc;
    };
    arc.padRadius = function(v) {
      if (!arguments.length) return padRadius;
      padRadius = v == d3_svg_arcAuto ? d3_svg_arcAuto : d3_functor(v);
      return arc;
    };
    arc.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return arc;
    };
    arc.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return arc;
    };
    arc.padAngle = function(v) {
      if (!arguments.length) return padAngle;
      padAngle = d3_functor(v);
      return arc;
    };
    arc.centroid = function() {
      var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2, a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - halfπ;
      return [ Math.cos(a) * r, Math.sin(a) * r ];
    };
    return arc;
  };
  var d3_svg_arcAuto = "auto";
  function d3_svg_arcInnerRadius(d) {
    return d.innerRadius;
  }
  function d3_svg_arcOuterRadius(d) {
    return d.outerRadius;
  }
  function d3_svg_arcStartAngle(d) {
    return d.startAngle;
  }
  function d3_svg_arcEndAngle(d) {
    return d.endAngle;
  }
  function d3_svg_arcPadAngle(d) {
    return d && d.padAngle;
  }
  function d3_svg_arcSweep(x0, y0, x1, y1) {
    return (x0 - x1) * y0 - (y0 - y1) * x0 > 0 ? 0 : 1;
  }
  function d3_svg_arcCornerTangents(p0, p1, r1, rc, cw) {
    var x01 = p0[0] - p1[0], y01 = p0[1] - p1[1], lo = (cw ? rc : -rc) / Math.sqrt(x01 * x01 + y01 * y01), ox = lo * y01, oy = -lo * x01, x1 = p0[0] + ox, y1 = p0[1] + oy, x2 = p1[0] + ox, y2 = p1[1] + oy, x3 = (x1 + x2) / 2, y3 = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, d2 = dx * dx + dy * dy, r = r1 - rc, D = x1 * y2 - x2 * y1, d = (dy < 0 ? -1 : 1) * Math.sqrt(Math.max(0, r * r * d2 - D * D)), cx0 = (D * dy - dx * d) / d2, cy0 = (-D * dx - dy * d) / d2, cx1 = (D * dy + dx * d) / d2, cy1 = (-D * dx + dy * d) / d2, dx0 = cx0 - x3, dy0 = cy0 - y3, dx1 = cx1 - x3, dy1 = cy1 - y3;
    if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;
    return [ [ cx0 - ox, cy0 - oy ], [ cx0 * r1 / r, cy0 * r1 / r ] ];
  }
  function d3_svg_line(projection) {
    var x = d3_geom_pointX, y = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, tension = .7;
    function line(data) {
      var segments = [], points = [], i = -1, n = data.length, d, fx = d3_functor(x), fy = d3_functor(y);
      function segment() {
        segments.push("M", interpolate(projection(points), tension));
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points.push([ +fx.call(this, d, i), +fy.call(this, d, i) ]);
        } else if (points.length) {
          segment();
          points = [];
        }
      }
      if (points.length) segment();
      return segments.length ? segments.join("") : null;
    }
    line.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return line;
    };
    line.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return line;
    };
    line.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return line;
    };
    line.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      return line;
    };
    line.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return line;
    };
    return line;
  }
  d3.svg.line = function() {
    return d3_svg_line(d3_identity);
  };
  var d3_svg_lineInterpolators = d3.map({
    linear: d3_svg_lineLinear,
    "linear-closed": d3_svg_lineLinearClosed,
    step: d3_svg_lineStep,
    "step-before": d3_svg_lineStepBefore,
    "step-after": d3_svg_lineStepAfter,
    basis: d3_svg_lineBasis,
    "basis-open": d3_svg_lineBasisOpen,
    "basis-closed": d3_svg_lineBasisClosed,
    bundle: d3_svg_lineBundle,
    cardinal: d3_svg_lineCardinal,
    "cardinal-open": d3_svg_lineCardinalOpen,
    "cardinal-closed": d3_svg_lineCardinalClosed,
    monotone: d3_svg_lineMonotone
  });
  d3_svg_lineInterpolators.forEach(function(key, value) {
    value.key = key;
    value.closed = /-closed$/.test(key);
  });
  function d3_svg_lineLinear(points) {
    return points.length > 1 ? points.join("L") : points + "Z";
  }
  function d3_svg_lineLinearClosed(points) {
    return points.join("L") + "Z";
  }
  function d3_svg_lineStep(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p[0] + (p = points[i])[0]) / 2, "V", p[1]);
    if (n > 1) path.push("H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepBefore(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("V", (p = points[i])[1], "H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepAfter(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p = points[i])[0], "V", p[1]);
    return path.join("");
  }
  function d3_svg_lineCardinalOpen(points, tension) {
    return points.length < 4 ? d3_svg_lineLinear(points) : points[1] + d3_svg_lineHermite(points.slice(1, -1), d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineCardinalClosed(points, tension) {
    return points.length < 3 ? d3_svg_lineLinearClosed(points) : points[0] + d3_svg_lineHermite((points.push(points[0]), 
    points), d3_svg_lineCardinalTangents([ points[points.length - 2] ].concat(points, [ points[1] ]), tension));
  }
  function d3_svg_lineCardinal(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineHermite(points, tangents) {
    if (tangents.length < 1 || points.length != tangents.length && points.length != tangents.length + 2) {
      return d3_svg_lineLinear(points);
    }
    var quad = points.length != tangents.length, path = "", p0 = points[0], p = points[1], t0 = tangents[0], t = t0, pi = 1;
    if (quad) {
      path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3) + "," + p[0] + "," + p[1];
      p0 = points[1];
      pi = 2;
    }
    if (tangents.length > 1) {
      t = tangents[1];
      p = points[pi];
      pi++;
      path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1]) + "," + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      for (var i = 2; i < tangents.length; i++, pi++) {
        p = points[pi];
        t = tangents[i];
        path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      }
    }
    if (quad) {
      var lp = points[pi];
      path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3) + "," + lp[0] + "," + lp[1];
    }
    return path;
  }
  function d3_svg_lineCardinalTangents(points, tension) {
    var tangents = [], a = (1 - tension) / 2, p0, p1 = points[0], p2 = points[1], i = 1, n = points.length;
    while (++i < n) {
      p0 = p1;
      p1 = p2;
      p2 = points[i];
      tangents.push([ a * (p2[0] - p0[0]), a * (p2[1] - p0[1]) ]);
    }
    return tangents;
  }
  function d3_svg_lineBasis(points) {
    if (points.length < 3) return d3_svg_lineLinear(points);
    var i = 1, n = points.length, pi = points[0], x0 = pi[0], y0 = pi[1], px = [ x0, x0, x0, (pi = points[1])[0] ], py = [ y0, y0, y0, pi[1] ], path = [ x0, ",", y0, "L", d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    points.push(points[n - 1]);
    while (++i <= n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    points.pop();
    path.push("L", pi);
    return path.join("");
  }
  function d3_svg_lineBasisOpen(points) {
    if (points.length < 4) return d3_svg_lineLinear(points);
    var path = [], i = -1, n = points.length, pi, px = [ 0 ], py = [ 0 ];
    while (++i < 3) {
      pi = points[i];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px) + "," + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));
    --i;
    while (++i < n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBasisClosed(points) {
    var path, i = -1, n = points.length, m = n + 4, pi, px = [], py = [];
    while (++i < 4) {
      pi = points[i % n];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path = [ d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    --i;
    while (++i < m) {
      pi = points[i % n];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBundle(points, tension) {
    var n = points.length - 1;
    if (n) {
      var x0 = points[0][0], y0 = points[0][1], dx = points[n][0] - x0, dy = points[n][1] - y0, i = -1, p, t;
      while (++i <= n) {
        p = points[i];
        t = i / n;
        p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);
        p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
      }
    }
    return d3_svg_lineBasis(points);
  }
  function d3_svg_lineDot4(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  var d3_svg_lineBasisBezier1 = [ 0, 2 / 3, 1 / 3, 0 ], d3_svg_lineBasisBezier2 = [ 0, 1 / 3, 2 / 3, 0 ], d3_svg_lineBasisBezier3 = [ 0, 1 / 6, 2 / 3, 1 / 6 ];
  function d3_svg_lineBasisBezier(path, x, y) {
    path.push("C", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));
  }
  function d3_svg_lineSlope(p0, p1) {
    return (p1[1] - p0[1]) / (p1[0] - p0[0]);
  }
  function d3_svg_lineFiniteDifferences(points) {
    var i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = d3_svg_lineSlope(p0, p1);
    while (++i < j) {
      m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;
    }
    m[i] = d;
    return m;
  }
  function d3_svg_lineMonotoneTangents(points) {
    var tangents = [], d, a, b, s, m = d3_svg_lineFiniteDifferences(points), i = -1, j = points.length - 1;
    while (++i < j) {
      d = d3_svg_lineSlope(points[i], points[i + 1]);
      if (abs(d) < ε) {
        m[i] = m[i + 1] = 0;
      } else {
        a = m[i] / d;
        b = m[i + 1] / d;
        s = a * a + b * b;
        if (s > 9) {
          s = d * 3 / Math.sqrt(s);
          m[i] = s * a;
          m[i + 1] = s * b;
        }
      }
    }
    i = -1;
    while (++i <= j) {
      s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
      tangents.push([ s || 0, m[i] * s || 0 ]);
    }
    return tangents;
  }
  function d3_svg_lineMonotone(points) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));
  }
  d3.svg.line.radial = function() {
    var line = d3_svg_line(d3_svg_lineRadial);
    line.radius = line.x, delete line.x;
    line.angle = line.y, delete line.y;
    return line;
  };
  function d3_svg_lineRadial(points) {
    var point, i = -1, n = points.length, r, a;
    while (++i < n) {
      point = points[i];
      r = point[0];
      a = point[1] - halfπ;
      point[0] = r * Math.cos(a);
      point[1] = r * Math.sin(a);
    }
    return points;
  }
  function d3_svg_area(projection) {
    var x0 = d3_geom_pointX, x1 = d3_geom_pointX, y0 = 0, y1 = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, interpolateReverse = interpolate, L = "L", tension = .7;
    function area(data) {
      var segments = [], points0 = [], points1 = [], i = -1, n = data.length, d, fx0 = d3_functor(x0), fy0 = d3_functor(y0), fx1 = x0 === x1 ? function() {
        return x;
      } : d3_functor(x1), fy1 = y0 === y1 ? function() {
        return y;
      } : d3_functor(y1), x, y;
      function segment() {
        segments.push("M", interpolate(projection(points1), tension), L, interpolateReverse(projection(points0.reverse()), tension), "Z");
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points0.push([ x = +fx0.call(this, d, i), y = +fy0.call(this, d, i) ]);
          points1.push([ +fx1.call(this, d, i), +fy1.call(this, d, i) ]);
        } else if (points0.length) {
          segment();
          points0 = [];
          points1 = [];
        }
      }
      if (points0.length) segment();
      return segments.length ? segments.join("") : null;
    }
    area.x = function(_) {
      if (!arguments.length) return x1;
      x0 = x1 = _;
      return area;
    };
    area.x0 = function(_) {
      if (!arguments.length) return x0;
      x0 = _;
      return area;
    };
    area.x1 = function(_) {
      if (!arguments.length) return x1;
      x1 = _;
      return area;
    };
    area.y = function(_) {
      if (!arguments.length) return y1;
      y0 = y1 = _;
      return area;
    };
    area.y0 = function(_) {
      if (!arguments.length) return y0;
      y0 = _;
      return area;
    };
    area.y1 = function(_) {
      if (!arguments.length) return y1;
      y1 = _;
      return area;
    };
    area.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return area;
    };
    area.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      interpolateReverse = interpolate.reverse || interpolate;
      L = interpolate.closed ? "M" : "L";
      return area;
    };
    area.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return area;
    };
    return area;
  }
  d3_svg_lineStepBefore.reverse = d3_svg_lineStepAfter;
  d3_svg_lineStepAfter.reverse = d3_svg_lineStepBefore;
  d3.svg.area = function() {
    return d3_svg_area(d3_identity);
  };
  d3.svg.area.radial = function() {
    var area = d3_svg_area(d3_svg_lineRadial);
    area.radius = area.x, delete area.x;
    area.innerRadius = area.x0, delete area.x0;
    area.outerRadius = area.x1, delete area.x1;
    area.angle = area.y, delete area.y;
    area.startAngle = area.y0, delete area.y0;
    area.endAngle = area.y1, delete area.y1;
    return area;
  };
  d3.svg.chord = function() {
    var source = d3_source, target = d3_target, radius = d3_svg_chordRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function chord(d, i) {
      var s = subgroup(this, source, d, i), t = subgroup(this, target, d, i);
      return "M" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0) + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0) + arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0)) + "Z";
    }
    function subgroup(self, f, d, i) {
      var subgroup = f.call(self, d, i), r = radius.call(self, subgroup, i), a0 = startAngle.call(self, subgroup, i) - halfπ, a1 = endAngle.call(self, subgroup, i) - halfπ;
      return {
        r: r,
        a0: a0,
        a1: a1,
        p0: [ r * Math.cos(a0), r * Math.sin(a0) ],
        p1: [ r * Math.cos(a1), r * Math.sin(a1) ]
      };
    }
    function equals(a, b) {
      return a.a0 == b.a0 && a.a1 == b.a1;
    }
    function arc(r, p, a) {
      return "A" + r + "," + r + " 0 " + +(a > π) + ",1 " + p;
    }
    function curve(r0, p0, r1, p1) {
      return "Q 0,0 " + p1;
    }
    chord.radius = function(v) {
      if (!arguments.length) return radius;
      radius = d3_functor(v);
      return chord;
    };
    chord.source = function(v) {
      if (!arguments.length) return source;
      source = d3_functor(v);
      return chord;
    };
    chord.target = function(v) {
      if (!arguments.length) return target;
      target = d3_functor(v);
      return chord;
    };
    chord.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return chord;
    };
    chord.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return chord;
    };
    return chord;
  };
  function d3_svg_chordRadius(d) {
    return d.radius;
  }
  d3.svg.diagonal = function() {
    var source = d3_source, target = d3_target, projection = d3_svg_diagonalProjection;
    function diagonal(d, i) {
      var p0 = source.call(this, d, i), p3 = target.call(this, d, i), m = (p0.y + p3.y) / 2, p = [ p0, {
        x: p0.x,
        y: m
      }, {
        x: p3.x,
        y: m
      }, p3 ];
      p = p.map(projection);
      return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3];
    }
    diagonal.source = function(x) {
      if (!arguments.length) return source;
      source = d3_functor(x);
      return diagonal;
    };
    diagonal.target = function(x) {
      if (!arguments.length) return target;
      target = d3_functor(x);
      return diagonal;
    };
    diagonal.projection = function(x) {
      if (!arguments.length) return projection;
      projection = x;
      return diagonal;
    };
    return diagonal;
  };
  function d3_svg_diagonalProjection(d) {
    return [ d.x, d.y ];
  }
  d3.svg.diagonal.radial = function() {
    var diagonal = d3.svg.diagonal(), projection = d3_svg_diagonalProjection, projection_ = diagonal.projection;
    diagonal.projection = function(x) {
      return arguments.length ? projection_(d3_svg_diagonalRadialProjection(projection = x)) : projection;
    };
    return diagonal;
  };
  function d3_svg_diagonalRadialProjection(projection) {
    return function() {
      var d = projection.apply(this, arguments), r = d[0], a = d[1] - halfπ;
      return [ r * Math.cos(a), r * Math.sin(a) ];
    };
  }
  d3.svg.symbol = function() {
    var type = d3_svg_symbolType, size = d3_svg_symbolSize;
    function symbol(d, i) {
      return (d3_svg_symbols.get(type.call(this, d, i)) || d3_svg_symbolCircle)(size.call(this, d, i));
    }
    symbol.type = function(x) {
      if (!arguments.length) return type;
      type = d3_functor(x);
      return symbol;
    };
    symbol.size = function(x) {
      if (!arguments.length) return size;
      size = d3_functor(x);
      return symbol;
    };
    return symbol;
  };
  function d3_svg_symbolSize() {
    return 64;
  }
  function d3_svg_symbolType() {
    return "circle";
  }
  function d3_svg_symbolCircle(size) {
    var r = Math.sqrt(size / π);
    return "M0," + r + "A" + r + "," + r + " 0 1,1 0," + -r + "A" + r + "," + r + " 0 1,1 0," + r + "Z";
  }
  var d3_svg_symbols = d3.map({
    circle: d3_svg_symbolCircle,
    cross: function(size) {
      var r = Math.sqrt(size / 5) / 2;
      return "M" + -3 * r + "," + -r + "H" + -r + "V" + -3 * r + "H" + r + "V" + -r + "H" + 3 * r + "V" + r + "H" + r + "V" + 3 * r + "H" + -r + "V" + r + "H" + -3 * r + "Z";
    },
    diamond: function(size) {
      var ry = Math.sqrt(size / (2 * d3_svg_symbolTan30)), rx = ry * d3_svg_symbolTan30;
      return "M0," + -ry + "L" + rx + ",0" + " 0," + ry + " " + -rx + ",0" + "Z";
    },
    square: function(size) {
      var r = Math.sqrt(size) / 2;
      return "M" + -r + "," + -r + "L" + r + "," + -r + " " + r + "," + r + " " + -r + "," + r + "Z";
    },
    "triangle-down": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + ry + "L" + rx + "," + -ry + " " + -rx + "," + -ry + "Z";
    },
    "triangle-up": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + -ry + "L" + rx + "," + ry + " " + -rx + "," + ry + "Z";
    }
  });
  d3.svg.symbolTypes = d3_svg_symbols.keys();
  var d3_svg_symbolSqrt3 = Math.sqrt(3), d3_svg_symbolTan30 = Math.tan(30 * d3_radians);
  d3_selectionPrototype.transition = function(name) {
    var id = d3_transitionInheritId || ++d3_transitionId, ns = d3_transitionNamespace(name), subgroups = [], subgroup, node, transition = d3_transitionInherit || {
      time: Date.now(),
      ease: d3_ease_cubicInOut,
      delay: 0,
      duration: 250
    };
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) d3_transitionNode(node, i, ns, id, transition);
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_selectionPrototype.interrupt = function(name) {
    return this.each(name == null ? d3_selection_interrupt : d3_selection_interruptNS(d3_transitionNamespace(name)));
  };
  var d3_selection_interrupt = d3_selection_interruptNS(d3_transitionNamespace());
  function d3_selection_interruptNS(ns) {
    return function() {
      var lock, activeId, active;
      if ((lock = this[ns]) && (active = lock[activeId = lock.active])) {
        active.timer.c = null;
        active.timer.t = NaN;
        if (--lock.count) delete lock[activeId]; else delete this[ns];
        lock.active += .5;
        active.event && active.event.interrupt.call(this, this.__data__, active.index);
      }
    };
  }
  function d3_transition(groups, ns, id) {
    d3_subclass(groups, d3_transitionPrototype);
    groups.namespace = ns;
    groups.id = id;
    return groups;
  }
  var d3_transitionPrototype = [], d3_transitionId = 0, d3_transitionInheritId, d3_transitionInherit;
  d3_transitionPrototype.call = d3_selectionPrototype.call;
  d3_transitionPrototype.empty = d3_selectionPrototype.empty;
  d3_transitionPrototype.node = d3_selectionPrototype.node;
  d3_transitionPrototype.size = d3_selectionPrototype.size;
  d3.transition = function(selection, name) {
    return selection && selection.transition ? d3_transitionInheritId ? selection.transition(name) : selection : d3.selection().transition(selection);
  };
  d3.transition.prototype = d3_transitionPrototype;
  d3_transitionPrototype.select = function(selector) {
    var id = this.id, ns = this.namespace, subgroups = [], subgroup, subnode, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i, j))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          d3_transitionNode(subnode, i, ns, id, node[ns][id]);
          subgroup.push(subnode);
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_transitionPrototype.selectAll = function(selector) {
    var id = this.id, ns = this.namespace, subgroups = [], subgroup, subnodes, node, subnode, transition;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          transition = node[ns][id];
          subnodes = selector.call(node, node.__data__, i, j);
          subgroups.push(subgroup = []);
          for (var k = -1, o = subnodes.length; ++k < o; ) {
            if (subnode = subnodes[k]) d3_transitionNode(subnode, k, ns, id, transition);
            subgroup.push(subnode);
          }
        }
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_transitionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_transition(subgroups, this.namespace, this.id);
  };
  d3_transitionPrototype.tween = function(name, tween) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 2) return this.node()[ns][id].tween.get(name);
    return d3_selection_each(this, tween == null ? function(node) {
      node[ns][id].tween.remove(name);
    } : function(node) {
      node[ns][id].tween.set(name, tween);
    });
  };
  function d3_transition_tween(groups, name, value, tween) {
    var id = groups.id, ns = groups.namespace;
    return d3_selection_each(groups, typeof value === "function" ? function(node, i, j) {
      node[ns][id].tween.set(name, tween(value.call(node, node.__data__, i, j)));
    } : (value = tween(value), function(node) {
      node[ns][id].tween.set(name, value);
    }));
  }
  d3_transitionPrototype.attr = function(nameNS, value) {
    if (arguments.length < 2) {
      for (value in nameNS) this.attr(value, nameNS[value]);
      return this;
    }
    var interpolate = nameNS == "transform" ? d3_interpolateTransform : d3_interpolate, name = d3.ns.qualify(nameNS);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrTween(b) {
      return b == null ? attrNull : (b += "", function() {
        var a = this.getAttribute(name), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttribute(name, i(t));
        });
      });
    }
    function attrTweenNS(b) {
      return b == null ? attrNullNS : (b += "", function() {
        var a = this.getAttributeNS(name.space, name.local), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttributeNS(name.space, name.local, i(t));
        });
      });
    }
    return d3_transition_tween(this, "attr." + nameNS, value, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.attrTween = function(nameNS, tween) {
    var name = d3.ns.qualify(nameNS);
    function attrTween(d, i) {
      var f = tween.call(this, d, i, this.getAttribute(name));
      return f && function(t) {
        this.setAttribute(name, f(t));
      };
    }
    function attrTweenNS(d, i) {
      var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
      return f && function(t) {
        this.setAttributeNS(name.space, name.local, f(t));
      };
    }
    return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.style(priority, name[priority], value);
        return this;
      }
      priority = "";
    }
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleString(b) {
      return b == null ? styleNull : (b += "", function() {
        var a = d3_window(this).getComputedStyle(this, null).getPropertyValue(name), i;
        return a !== b && (i = d3_interpolate(a, b), function(t) {
          this.style.setProperty(name, i(t), priority);
        });
      });
    }
    return d3_transition_tween(this, "style." + name, value, styleString);
  };
  d3_transitionPrototype.styleTween = function(name, tween, priority) {
    if (arguments.length < 3) priority = "";
    function styleTween(d, i) {
      var f = tween.call(this, d, i, d3_window(this).getComputedStyle(this, null).getPropertyValue(name));
      return f && function(t) {
        this.style.setProperty(name, f(t), priority);
      };
    }
    return this.tween("style." + name, styleTween);
  };
  d3_transitionPrototype.text = function(value) {
    return d3_transition_tween(this, "text", value, d3_transition_text);
  };
  function d3_transition_text(b) {
    if (b == null) b = "";
    return function() {
      this.textContent = b;
    };
  }
  d3_transitionPrototype.remove = function() {
    var ns = this.namespace;
    return this.each("end.transition", function() {
      var p;
      if (this[ns].count < 2 && (p = this.parentNode)) p.removeChild(this);
    });
  };
  d3_transitionPrototype.ease = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].ease;
    if (typeof value !== "function") value = d3.ease.apply(d3, arguments);
    return d3_selection_each(this, function(node) {
      node[ns][id].ease = value;
    });
  };
  d3_transitionPrototype.delay = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].delay;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node[ns][id].delay = +value.call(node, node.__data__, i, j);
    } : (value = +value, function(node) {
      node[ns][id].delay = value;
    }));
  };
  d3_transitionPrototype.duration = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].duration;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node[ns][id].duration = Math.max(1, value.call(node, node.__data__, i, j));
    } : (value = Math.max(1, value), function(node) {
      node[ns][id].duration = value;
    }));
  };
  d3_transitionPrototype.each = function(type, listener) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 2) {
      var inherit = d3_transitionInherit, inheritId = d3_transitionInheritId;
      try {
        d3_transitionInheritId = id;
        d3_selection_each(this, function(node, i, j) {
          d3_transitionInherit = node[ns][id];
          type.call(node, node.__data__, i, j);
        });
      } finally {
        d3_transitionInherit = inherit;
        d3_transitionInheritId = inheritId;
      }
    } else {
      d3_selection_each(this, function(node) {
        var transition = node[ns][id];
        (transition.event || (transition.event = d3.dispatch("start", "end", "interrupt"))).on(type, listener);
      });
    }
    return this;
  };
  d3_transitionPrototype.transition = function() {
    var id0 = this.id, id1 = ++d3_transitionId, ns = this.namespace, subgroups = [], subgroup, group, node, transition;
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if (node = group[i]) {
          transition = node[ns][id0];
          d3_transitionNode(node, i, ns, id1, {
            time: transition.time,
            ease: transition.ease,
            delay: transition.delay + transition.duration,
            duration: transition.duration
          });
        }
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, ns, id1);
  };
  function d3_transitionNamespace(name) {
    return name == null ? "__transition__" : "__transition_" + name + "__";
  }
  function d3_transitionNode(node, i, ns, id, inherit) {
    var lock = node[ns] || (node[ns] = {
      active: 0,
      count: 0
    }), transition = lock[id], time, timer, duration, ease, tweens;
    function schedule(elapsed) {
      var delay = transition.delay;
      timer.t = delay + time;
      if (delay <= elapsed) return start(elapsed - delay);
      timer.c = start;
    }
    function start(elapsed) {
      var activeId = lock.active, active = lock[activeId];
      if (active) {
        active.timer.c = null;
        active.timer.t = NaN;
        --lock.count;
        delete lock[activeId];
        active.event && active.event.interrupt.call(node, node.__data__, active.index);
      }
      for (var cancelId in lock) {
        if (+cancelId < id) {
          var cancel = lock[cancelId];
          cancel.timer.c = null;
          cancel.timer.t = NaN;
          --lock.count;
          delete lock[cancelId];
        }
      }
      timer.c = tick;
      d3_timer(function() {
        if (timer.c && tick(elapsed || 1)) {
          timer.c = null;
          timer.t = NaN;
        }
        return 1;
      }, 0, time);
      lock.active = id;
      transition.event && transition.event.start.call(node, node.__data__, i);
      tweens = [];
      transition.tween.forEach(function(key, value) {
        if (value = value.call(node, node.__data__, i)) {
          tweens.push(value);
        }
      });
      ease = transition.ease;
      duration = transition.duration;
    }
    function tick(elapsed) {
      var t = elapsed / duration, e = ease(t), n = tweens.length;
      while (n > 0) {
        tweens[--n].call(node, e);
      }
      if (t >= 1) {
        transition.event && transition.event.end.call(node, node.__data__, i);
        if (--lock.count) delete lock[id]; else delete node[ns];
        return 1;
      }
    }
    if (!transition) {
      time = inherit.time;
      timer = d3_timer(schedule, 0, time);
      transition = lock[id] = {
        tween: new d3_Map(),
        time: time,
        timer: timer,
        delay: inherit.delay,
        duration: inherit.duration,
        ease: inherit.ease,
        index: i
      };
      inherit = null;
      ++lock.count;
    }
  }
  d3.svg.axis = function() {
    var scale = d3.scale.linear(), orient = d3_svg_axisDefaultOrient, innerTickSize = 6, outerTickSize = 6, tickPadding = 3, tickArguments_ = [ 10 ], tickValues = null, tickFormat_;
    function axis(g) {
      g.each(function() {
        var g = d3.select(this);
        var scale0 = this.__chart__ || scale, scale1 = this.__chart__ = scale.copy();
        var ticks = tickValues == null ? scale1.ticks ? scale1.ticks.apply(scale1, tickArguments_) : scale1.domain() : tickValues, tickFormat = tickFormat_ == null ? scale1.tickFormat ? scale1.tickFormat.apply(scale1, tickArguments_) : d3_identity : tickFormat_, tick = g.selectAll(".tick").data(ticks, scale1), tickEnter = tick.enter().insert("g", ".domain").attr("class", "tick").style("opacity", ε), tickExit = d3.transition(tick.exit()).style("opacity", ε).remove(), tickUpdate = d3.transition(tick.order()).style("opacity", 1), tickSpacing = Math.max(innerTickSize, 0) + tickPadding, tickTransform;
        var range = d3_scaleRange(scale1), path = g.selectAll(".domain").data([ 0 ]), pathUpdate = (path.enter().append("path").attr("class", "domain"), 
        d3.transition(path));
        tickEnter.append("line");
        tickEnter.append("text");
        var lineEnter = tickEnter.select("line"), lineUpdate = tickUpdate.select("line"), text = tick.select("text").text(tickFormat), textEnter = tickEnter.select("text"), textUpdate = tickUpdate.select("text"), sign = orient === "top" || orient === "left" ? -1 : 1, x1, x2, y1, y2;
        if (orient === "bottom" || orient === "top") {
          tickTransform = d3_svg_axisX, x1 = "x", y1 = "y", x2 = "x2", y2 = "y2";
          text.attr("dy", sign < 0 ? "0em" : ".71em").style("text-anchor", "middle");
          pathUpdate.attr("d", "M" + range[0] + "," + sign * outerTickSize + "V0H" + range[1] + "V" + sign * outerTickSize);
        } else {
          tickTransform = d3_svg_axisY, x1 = "y", y1 = "x", x2 = "y2", y2 = "x2";
          text.attr("dy", ".32em").style("text-anchor", sign < 0 ? "end" : "start");
          pathUpdate.attr("d", "M" + sign * outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + sign * outerTickSize);
        }
        lineEnter.attr(y2, sign * innerTickSize);
        textEnter.attr(y1, sign * tickSpacing);
        lineUpdate.attr(x2, 0).attr(y2, sign * innerTickSize);
        textUpdate.attr(x1, 0).attr(y1, sign * tickSpacing);
        if (scale1.rangeBand) {
          var x = scale1, dx = x.rangeBand() / 2;
          scale0 = scale1 = function(d) {
            return x(d) + dx;
          };
        } else if (scale0.rangeBand) {
          scale0 = scale1;
        } else {
          tickExit.call(tickTransform, scale1, scale0);
        }
        tickEnter.call(tickTransform, scale0, scale1);
        tickUpdate.call(tickTransform, scale1, scale1);
      });
    }
    axis.scale = function(x) {
      if (!arguments.length) return scale;
      scale = x;
      return axis;
    };
    axis.orient = function(x) {
      if (!arguments.length) return orient;
      orient = x in d3_svg_axisOrients ? x + "" : d3_svg_axisDefaultOrient;
      return axis;
    };
    axis.ticks = function() {
      if (!arguments.length) return tickArguments_;
      tickArguments_ = d3_array(arguments);
      return axis;
    };
    axis.tickValues = function(x) {
      if (!arguments.length) return tickValues;
      tickValues = x;
      return axis;
    };
    axis.tickFormat = function(x) {
      if (!arguments.length) return tickFormat_;
      tickFormat_ = x;
      return axis;
    };
    axis.tickSize = function(x) {
      var n = arguments.length;
      if (!n) return innerTickSize;
      innerTickSize = +x;
      outerTickSize = +arguments[n - 1];
      return axis;
    };
    axis.innerTickSize = function(x) {
      if (!arguments.length) return innerTickSize;
      innerTickSize = +x;
      return axis;
    };
    axis.outerTickSize = function(x) {
      if (!arguments.length) return outerTickSize;
      outerTickSize = +x;
      return axis;
    };
    axis.tickPadding = function(x) {
      if (!arguments.length) return tickPadding;
      tickPadding = +x;
      return axis;
    };
    axis.tickSubdivide = function() {
      return arguments.length && axis;
    };
    return axis;
  };
  var d3_svg_axisDefaultOrient = "bottom", d3_svg_axisOrients = {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1
  };
  function d3_svg_axisX(selection, x0, x1) {
    selection.attr("transform", function(d) {
      var v0 = x0(d);
      return "translate(" + (isFinite(v0) ? v0 : x1(d)) + ",0)";
    });
  }
  function d3_svg_axisY(selection, y0, y1) {
    selection.attr("transform", function(d) {
      var v0 = y0(d);
      return "translate(0," + (isFinite(v0) ? v0 : y1(d)) + ")";
    });
  }
  d3.svg.brush = function() {
    var event = d3_eventDispatch(brush, "brushstart", "brush", "brushend"), x = null, y = null, xExtent = [ 0, 0 ], yExtent = [ 0, 0 ], xExtentDomain, yExtentDomain, xClamp = true, yClamp = true, resizes = d3_svg_brushResizes[0];
    function brush(g) {
      g.each(function() {
        var g = d3.select(this).style("pointer-events", "all").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)").on("mousedown.brush", brushstart).on("touchstart.brush", brushstart);
        var background = g.selectAll(".background").data([ 0 ]);
        background.enter().append("rect").attr("class", "background").style("visibility", "hidden").style("cursor", "crosshair");
        g.selectAll(".extent").data([ 0 ]).enter().append("rect").attr("class", "extent").style("cursor", "move");
        var resize = g.selectAll(".resize").data(resizes, d3_identity);
        resize.exit().remove();
        resize.enter().append("g").attr("class", function(d) {
          return "resize " + d;
        }).style("cursor", function(d) {
          return d3_svg_brushCursor[d];
        }).append("rect").attr("x", function(d) {
          return /[ew]$/.test(d) ? -3 : null;
        }).attr("y", function(d) {
          return /^[ns]/.test(d) ? -3 : null;
        }).attr("width", 6).attr("height", 6).style("visibility", "hidden");
        resize.style("display", brush.empty() ? "none" : null);
        var gUpdate = d3.transition(g), backgroundUpdate = d3.transition(background), range;
        if (x) {
          range = d3_scaleRange(x);
          backgroundUpdate.attr("x", range[0]).attr("width", range[1] - range[0]);
          redrawX(gUpdate);
        }
        if (y) {
          range = d3_scaleRange(y);
          backgroundUpdate.attr("y", range[0]).attr("height", range[1] - range[0]);
          redrawY(gUpdate);
        }
        redraw(gUpdate);
      });
    }
    brush.event = function(g) {
      g.each(function() {
        var event_ = event.of(this, arguments), extent1 = {
          x: xExtent,
          y: yExtent,
          i: xExtentDomain,
          j: yExtentDomain
        }, extent0 = this.__chart__ || extent1;
        this.__chart__ = extent1;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.brush", function() {
            xExtentDomain = extent0.i;
            yExtentDomain = extent0.j;
            xExtent = extent0.x;
            yExtent = extent0.y;
            event_({
              type: "brushstart"
            });
          }).tween("brush:brush", function() {
            var xi = d3_interpolateArray(xExtent, extent1.x), yi = d3_interpolateArray(yExtent, extent1.y);
            xExtentDomain = yExtentDomain = null;
            return function(t) {
              xExtent = extent1.x = xi(t);
              yExtent = extent1.y = yi(t);
              event_({
                type: "brush",
                mode: "resize"
              });
            };
          }).each("end.brush", function() {
            xExtentDomain = extent1.i;
            yExtentDomain = extent1.j;
            event_({
              type: "brush",
              mode: "resize"
            });
            event_({
              type: "brushend"
            });
          });
        } else {
          event_({
            type: "brushstart"
          });
          event_({
            type: "brush",
            mode: "resize"
          });
          event_({
            type: "brushend"
          });
        }
      });
    };
    function redraw(g) {
      g.selectAll(".resize").attr("transform", function(d) {
        return "translate(" + xExtent[+/e$/.test(d)] + "," + yExtent[+/^s/.test(d)] + ")";
      });
    }
    function redrawX(g) {
      g.select(".extent").attr("x", xExtent[0]);
      g.selectAll(".extent,.n>rect,.s>rect").attr("width", xExtent[1] - xExtent[0]);
    }
    function redrawY(g) {
      g.select(".extent").attr("y", yExtent[0]);
      g.selectAll(".extent,.e>rect,.w>rect").attr("height", yExtent[1] - yExtent[0]);
    }
    function brushstart() {
      var target = this, eventTarget = d3.select(d3.event.target), event_ = event.of(target, arguments), g = d3.select(target), resizing = eventTarget.datum(), resizingX = !/^(n|s)$/.test(resizing) && x, resizingY = !/^(e|w)$/.test(resizing) && y, dragging = eventTarget.classed("extent"), dragRestore = d3_event_dragSuppress(target), center, origin = d3.mouse(target), offset;
      var w = d3.select(d3_window(target)).on("keydown.brush", keydown).on("keyup.brush", keyup);
      if (d3.event.changedTouches) {
        w.on("touchmove.brush", brushmove).on("touchend.brush", brushend);
      } else {
        w.on("mousemove.brush", brushmove).on("mouseup.brush", brushend);
      }
      g.interrupt().selectAll("*").interrupt();
      if (dragging) {
        origin[0] = xExtent[0] - origin[0];
        origin[1] = yExtent[0] - origin[1];
      } else if (resizing) {
        var ex = +/w$/.test(resizing), ey = +/^n/.test(resizing);
        offset = [ xExtent[1 - ex] - origin[0], yExtent[1 - ey] - origin[1] ];
        origin[0] = xExtent[ex];
        origin[1] = yExtent[ey];
      } else if (d3.event.altKey) center = origin.slice();
      g.style("pointer-events", "none").selectAll(".resize").style("display", null);
      d3.select("body").style("cursor", eventTarget.style("cursor"));
      event_({
        type: "brushstart"
      });
      brushmove();
      function keydown() {
        if (d3.event.keyCode == 32) {
          if (!dragging) {
            center = null;
            origin[0] -= xExtent[1];
            origin[1] -= yExtent[1];
            dragging = 2;
          }
          d3_eventPreventDefault();
        }
      }
      function keyup() {
        if (d3.event.keyCode == 32 && dragging == 2) {
          origin[0] += xExtent[1];
          origin[1] += yExtent[1];
          dragging = 0;
          d3_eventPreventDefault();
        }
      }
      function brushmove() {
        var point = d3.mouse(target), moved = false;
        if (offset) {
          point[0] += offset[0];
          point[1] += offset[1];
        }
        if (!dragging) {
          if (d3.event.altKey) {
            if (!center) center = [ (xExtent[0] + xExtent[1]) / 2, (yExtent[0] + yExtent[1]) / 2 ];
            origin[0] = xExtent[+(point[0] < center[0])];
            origin[1] = yExtent[+(point[1] < center[1])];
          } else center = null;
        }
        if (resizingX && move1(point, x, 0)) {
          redrawX(g);
          moved = true;
        }
        if (resizingY && move1(point, y, 1)) {
          redrawY(g);
          moved = true;
        }
        if (moved) {
          redraw(g);
          event_({
            type: "brush",
            mode: dragging ? "move" : "resize"
          });
        }
      }
      function move1(point, scale, i) {
        var range = d3_scaleRange(scale), r0 = range[0], r1 = range[1], position = origin[i], extent = i ? yExtent : xExtent, size = extent[1] - extent[0], min, max;
        if (dragging) {
          r0 -= position;
          r1 -= size + position;
        }
        min = (i ? yClamp : xClamp) ? Math.max(r0, Math.min(r1, point[i])) : point[i];
        if (dragging) {
          max = (min += position) + size;
        } else {
          if (center) position = Math.max(r0, Math.min(r1, 2 * center[i] - min));
          if (position < min) {
            max = min;
            min = position;
          } else {
            max = position;
          }
        }
        if (extent[0] != min || extent[1] != max) {
          if (i) yExtentDomain = null; else xExtentDomain = null;
          extent[0] = min;
          extent[1] = max;
          return true;
        }
      }
      function brushend() {
        brushmove();
        g.style("pointer-events", "all").selectAll(".resize").style("display", brush.empty() ? "none" : null);
        d3.select("body").style("cursor", null);
        w.on("mousemove.brush", null).on("mouseup.brush", null).on("touchmove.brush", null).on("touchend.brush", null).on("keydown.brush", null).on("keyup.brush", null);
        dragRestore();
        event_({
          type: "brushend"
        });
      }
    }
    brush.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.clamp = function(z) {
      if (!arguments.length) return x && y ? [ xClamp, yClamp ] : x ? xClamp : y ? yClamp : null;
      if (x && y) xClamp = !!z[0], yClamp = !!z[1]; else if (x) xClamp = !!z; else if (y) yClamp = !!z;
      return brush;
    };
    brush.extent = function(z) {
      var x0, x1, y0, y1, t;
      if (!arguments.length) {
        if (x) {
          if (xExtentDomain) {
            x0 = xExtentDomain[0], x1 = xExtentDomain[1];
          } else {
            x0 = xExtent[0], x1 = xExtent[1];
            if (x.invert) x0 = x.invert(x0), x1 = x.invert(x1);
            if (x1 < x0) t = x0, x0 = x1, x1 = t;
          }
        }
        if (y) {
          if (yExtentDomain) {
            y0 = yExtentDomain[0], y1 = yExtentDomain[1];
          } else {
            y0 = yExtent[0], y1 = yExtent[1];
            if (y.invert) y0 = y.invert(y0), y1 = y.invert(y1);
            if (y1 < y0) t = y0, y0 = y1, y1 = t;
          }
        }
        return x && y ? [ [ x0, y0 ], [ x1, y1 ] ] : x ? [ x0, x1 ] : y && [ y0, y1 ];
      }
      if (x) {
        x0 = z[0], x1 = z[1];
        if (y) x0 = x0[0], x1 = x1[0];
        xExtentDomain = [ x0, x1 ];
        if (x.invert) x0 = x(x0), x1 = x(x1);
        if (x1 < x0) t = x0, x0 = x1, x1 = t;
        if (x0 != xExtent[0] || x1 != xExtent[1]) xExtent = [ x0, x1 ];
      }
      if (y) {
        y0 = z[0], y1 = z[1];
        if (x) y0 = y0[1], y1 = y1[1];
        yExtentDomain = [ y0, y1 ];
        if (y.invert) y0 = y(y0), y1 = y(y1);
        if (y1 < y0) t = y0, y0 = y1, y1 = t;
        if (y0 != yExtent[0] || y1 != yExtent[1]) yExtent = [ y0, y1 ];
      }
      return brush;
    };
    brush.clear = function() {
      if (!brush.empty()) {
        xExtent = [ 0, 0 ], yExtent = [ 0, 0 ];
        xExtentDomain = yExtentDomain = null;
      }
      return brush;
    };
    brush.empty = function() {
      return !!x && xExtent[0] == xExtent[1] || !!y && yExtent[0] == yExtent[1];
    };
    return d3.rebind(brush, event, "on");
  };
  var d3_svg_brushCursor = {
    n: "ns-resize",
    e: "ew-resize",
    s: "ns-resize",
    w: "ew-resize",
    nw: "nwse-resize",
    ne: "nesw-resize",
    se: "nwse-resize",
    sw: "nesw-resize"
  };
  var d3_svg_brushResizes = [ [ "n", "e", "s", "w", "nw", "ne", "se", "sw" ], [ "e", "w" ], [ "n", "s" ], [] ];
  var d3_time_format = d3_time.format = d3_locale_enUS.timeFormat;
  var d3_time_formatUtc = d3_time_format.utc;
  var d3_time_formatIso = d3_time_formatUtc("%Y-%m-%dT%H:%M:%S.%LZ");
  d3_time_format.iso = Date.prototype.toISOString && +new Date("2000-01-01T00:00:00.000Z") ? d3_time_formatIsoNative : d3_time_formatIso;
  function d3_time_formatIsoNative(date) {
    return date.toISOString();
  }
  d3_time_formatIsoNative.parse = function(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  };
  d3_time_formatIsoNative.toString = d3_time_formatIso.toString;
  d3_time.second = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 1e3) * 1e3);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 1e3);
  }, function(date) {
    return date.getSeconds();
  });
  d3_time.seconds = d3_time.second.range;
  d3_time.seconds.utc = d3_time.second.utc.range;
  d3_time.minute = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 6e4) * 6e4);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 6e4);
  }, function(date) {
    return date.getMinutes();
  });
  d3_time.minutes = d3_time.minute.range;
  d3_time.minutes.utc = d3_time.minute.utc.range;
  d3_time.hour = d3_time_interval(function(date) {
    var timezone = date.getTimezoneOffset() / 60;
    return new d3_date((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 36e5);
  }, function(date) {
    return date.getHours();
  });
  d3_time.hours = d3_time.hour.range;
  d3_time.hours.utc = d3_time.hour.utc.range;
  d3_time.month = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setDate(1);
    return date;
  }, function(date, offset) {
    date.setMonth(date.getMonth() + offset);
  }, function(date) {
    return date.getMonth();
  });
  d3_time.months = d3_time.month.range;
  d3_time.months.utc = d3_time.month.utc.range;
  function d3_time_scale(linear, methods, format) {
    function scale(x) {
      return linear(x);
    }
    scale.invert = function(x) {
      return d3_time_scaleDate(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return linear.domain().map(d3_time_scaleDate);
      linear.domain(x);
      return scale;
    };
    function tickMethod(extent, count) {
      var span = extent[1] - extent[0], target = span / count, i = d3.bisect(d3_time_scaleSteps, target);
      return i == d3_time_scaleSteps.length ? [ methods.year, d3_scale_linearTickRange(extent.map(function(d) {
        return d / 31536e6;
      }), count)[2] ] : !i ? [ d3_time_scaleMilliseconds, d3_scale_linearTickRange(extent, count)[2] ] : methods[target / d3_time_scaleSteps[i - 1] < d3_time_scaleSteps[i] / target ? i - 1 : i];
    }
    scale.nice = function(interval, skip) {
      var domain = scale.domain(), extent = d3_scaleExtent(domain), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" && tickMethod(extent, interval);
      if (method) interval = method[0], skip = method[1];
      function skipped(date) {
        return !isNaN(date) && !interval.range(date, d3_time_scaleDate(+date + 1), skip).length;
      }
      return scale.domain(d3_scale_nice(domain, skip > 1 ? {
        floor: function(date) {
          while (skipped(date = interval.floor(date))) date = d3_time_scaleDate(date - 1);
          return date;
        },
        ceil: function(date) {
          while (skipped(date = interval.ceil(date))) date = d3_time_scaleDate(+date + 1);
          return date;
        }
      } : interval));
    };
    scale.ticks = function(interval, skip) {
      var extent = d3_scaleExtent(scale.domain()), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" ? tickMethod(extent, interval) : !interval.range && [ {
        range: interval
      }, skip ];
      if (method) interval = method[0], skip = method[1];
      return interval.range(extent[0], d3_time_scaleDate(+extent[1] + 1), skip < 1 ? 1 : skip);
    };
    scale.tickFormat = function() {
      return format;
    };
    scale.copy = function() {
      return d3_time_scale(linear.copy(), methods, format);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_time_scaleDate(t) {
    return new Date(t);
  }
  var d3_time_scaleSteps = [ 1e3, 5e3, 15e3, 3e4, 6e4, 3e5, 9e5, 18e5, 36e5, 108e5, 216e5, 432e5, 864e5, 1728e5, 6048e5, 2592e6, 7776e6, 31536e6 ];
  var d3_time_scaleLocalMethods = [ [ d3_time.second, 1 ], [ d3_time.second, 5 ], [ d3_time.second, 15 ], [ d3_time.second, 30 ], [ d3_time.minute, 1 ], [ d3_time.minute, 5 ], [ d3_time.minute, 15 ], [ d3_time.minute, 30 ], [ d3_time.hour, 1 ], [ d3_time.hour, 3 ], [ d3_time.hour, 6 ], [ d3_time.hour, 12 ], [ d3_time.day, 1 ], [ d3_time.day, 2 ], [ d3_time.week, 1 ], [ d3_time.month, 1 ], [ d3_time.month, 3 ], [ d3_time.year, 1 ] ];
  var d3_time_scaleLocalFormat = d3_time_format.multi([ [ ".%L", function(d) {
    return d.getMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getMinutes();
  } ], [ "%I %p", function(d) {
    return d.getHours();
  } ], [ "%a %d", function(d) {
    return d.getDay() && d.getDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getDate() != 1;
  } ], [ "%B", function(d) {
    return d.getMonth();
  } ], [ "%Y", d3_true ] ]);
  var d3_time_scaleMilliseconds = {
    range: function(start, stop, step) {
      return d3.range(Math.ceil(start / step) * step, +stop, step).map(d3_time_scaleDate);
    },
    floor: d3_identity,
    ceil: d3_identity
  };
  d3_time_scaleLocalMethods.year = d3_time.year;
  d3_time.scale = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);
  };
  var d3_time_scaleUtcMethods = d3_time_scaleLocalMethods.map(function(m) {
    return [ m[0].utc, m[1] ];
  });
  var d3_time_scaleUtcFormat = d3_time_formatUtc.multi([ [ ".%L", function(d) {
    return d.getUTCMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getUTCSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getUTCMinutes();
  } ], [ "%I %p", function(d) {
    return d.getUTCHours();
  } ], [ "%a %d", function(d) {
    return d.getUTCDay() && d.getUTCDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getUTCDate() != 1;
  } ], [ "%B", function(d) {
    return d.getUTCMonth();
  } ], [ "%Y", d3_true ] ]);
  d3_time_scaleUtcMethods.year = d3_time.year.utc;
  d3_time.scale.utc = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleUtcMethods, d3_time_scaleUtcFormat);
  };
  d3.text = d3_xhrType(function(request) {
    return request.responseText;
  });
  d3.json = function(url, callback) {
    return d3_xhr(url, "application/json", d3_json, callback);
  };
  function d3_json(request) {
    return JSON.parse(request.responseText);
  }
  d3.html = function(url, callback) {
    return d3_xhr(url, "text/html", d3_html, callback);
  };
  function d3_html(request) {
    var range = d3_document.createRange();
    range.selectNode(d3_document.body);
    return range.createContextualFragment(request.responseText);
  }
  d3.xml = d3_xhrType(function(request) {
    return request.responseXML;
  });
  if (typeof define === "function" && define.amd) this.d3 = d3, define(d3); else if (typeof module === "object" && module.exports) module.exports = d3; else this.d3 = d3;
}();
},{}],89:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000
var m = s * 60
var h = m * 60
var d = h * 24
var y = d * 365.25

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {}
  var type = typeof val
  if (type === 'string' && val.length > 0) {
    return parse(val)
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ?
			fmtLong(val) :
			fmtShort(val)
  }
  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val))
}

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str)
  if (str.length > 10000) {
    return
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str)
  if (!match) {
    return
  }
  var n = parseFloat(match[1])
  var type = (match[2] || 'ms').toLowerCase()
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y
    case 'days':
    case 'day':
    case 'd':
      return n * d
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n
    default:
      return undefined
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd'
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h'
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm'
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's'
  }
  return ms + 'ms'
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms'
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name
  }
  return Math.ceil(ms / n) + ' ' + name + 's'
}

},{}],90:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window && typeof window.process !== 'undefined' && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document && 'WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window && window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  try {
    return exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (typeof process !== 'undefined' && 'env' in process) {
    return process.env.DEBUG;
  }
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))

},{"./debug":91,"_process":1}],91:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":89}],92:[function(require,module,exports){
/**
 * Expose `PriorityQueue`.
 */
module.exports = PriorityQueue;

/**
 * Initializes a new empty `PriorityQueue` with the given `comparator(a, b)`
 * function, uses `.DEFAULT_COMPARATOR()` when no function is provided.
 *
 * The comparator function must return a positive number when `a > b`, 0 when
 * `a == b` and a negative number when `a < b`.
 *
 * @param {Function}
 * @return {PriorityQueue}
 * @api public
 */
function PriorityQueue(comparator) {
  this._comparator = comparator || PriorityQueue.DEFAULT_COMPARATOR;
  this._elements = [];
}

/**
 * Compares `a` and `b`, when `a > b` it returns a positive number, when
 * it returns 0 and when `a < b` it returns a negative number.
 *
 * @param {String|Number} a
 * @param {String|Number} b
 * @return {Number}
 * @api public
 */
PriorityQueue.DEFAULT_COMPARATOR = function(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  } else {
    a = a.toString();
    b = b.toString();

    if (a == b) return 0;

    return (a > b) ? 1 : -1;
  }
};

/**
 * Returns whether the priority queue is empty or not.
 *
 * @return {Boolean}
 * @api public
 */
PriorityQueue.prototype.isEmpty = function() {
  return this.size() === 0;
};

/**
 * Peeks at the top element of the priority queue.
 *
 * @return {Object}
 * @throws {Error} when the queue is empty.
 * @api public
 */
PriorityQueue.prototype.peek = function() {
  if (this.isEmpty()) throw new Error('PriorityQueue is empty');

  return this._elements[0];
};

/**
 * Dequeues the top element of the priority queue.
 *
 * @return {Object}
 * @throws {Error} when the queue is empty.
 * @api public
 */
PriorityQueue.prototype.deq = function() {
  var first = this.peek();
  var last = this._elements.pop();
  var size = this.size();

  if (size === 0) return first;

  this._elements[0] = last;
  var current = 0;

  while (current < size) {
    var largest = current;
    var left = (2 * current) + 1;
    var right = (2 * current) + 2;

    if (left < size && this._compare(left, largest) >= 0) {
      largest = left;
    }

    if (right < size && this._compare(right, largest) >= 0) {
      largest = right;
    }

    if (largest === current) break;

    this._swap(largest, current);
    current = largest;
  }

  return first;
};

/**
 * Enqueues the `element` at the priority queue and returns its new size.
 *
 * @param {Object} element
 * @return {Number}
 * @api public
 */
PriorityQueue.prototype.enq = function(element) {
  var size = this._elements.push(element);
  var current = size - 1;

  while (current > 0) {
    var parent = Math.floor((current - 1) / 2);

    if (this._compare(current, parent) <= 0) break;

    this._swap(parent, current);
    current = parent;
  }

  return size;
};

/**
 * Returns the size of the priority queue.
 *
 * @return {Number}
 * @api public
 */
PriorityQueue.prototype.size = function() {
  return this._elements.length;
};

/**
 *  Iterates over queue elements
 *
 *  @param {Function} fn
 */
PriorityQueue.prototype.forEach = function(fn) {
  return this._elements.forEach(fn);
};

/**
 * Compares the values at position `a` and `b` in the priority queue using its
 * comparator function.
 *
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 * @api private
 */
PriorityQueue.prototype._compare = function(a, b) {
  return this._comparator(this._elements[a], this._elements[b]);
};

/**
 * Swaps the values at position `a` and `b` in the priority queue.
 *
 * @param {Number} a
 * @param {Number} b
 * @api private
 */
PriorityQueue.prototype._swap = function(a, b) {
  var aux = this._elements[a];
  this._elements[a] = this._elements[b];
  this._elements[b] = aux;
};

},{}],93:[function(require,module,exports){

/**
 * Module Dependencies
 */

var expr;
try {
  expr = require('props');
} catch(e) {
  expr = require('component-props');
}

/**
 * Expose `toFunction()`.
 */

module.exports = toFunction;

/**
 * Convert `obj` to a `Function`.
 *
 * @param {Mixed} obj
 * @return {Function}
 * @api private
 */

function toFunction(obj) {
  switch ({}.toString.call(obj)) {
    case '[object Object]':
      return objectToFunction(obj);
    case '[object Function]':
      return obj;
    case '[object String]':
      return stringToFunction(obj);
    case '[object RegExp]':
      return regexpToFunction(obj);
    default:
      return defaultToFunction(obj);
  }
}

/**
 * Default to strict equality.
 *
 * @param {Mixed} val
 * @return {Function}
 * @api private
 */

function defaultToFunction(val) {
  return function(obj){
    return val === obj;
  };
}

/**
 * Convert `re` to a function.
 *
 * @param {RegExp} re
 * @return {Function}
 * @api private
 */

function regexpToFunction(re) {
  return function(obj){
    return re.test(obj);
  };
}

/**
 * Convert property `str` to a function.
 *
 * @param {String} str
 * @return {Function}
 * @api private
 */

function stringToFunction(str) {
  // immediate such as "> 20"
  if (/^ *\W+/.test(str)) return new Function('_', 'return _ ' + str);

  // properties such as "name.first" or "age > 18" or "age > 18 && age < 36"
  return new Function('_', 'return ' + get(str));
}

/**
 * Convert `object` to a function.
 *
 * @param {Object} object
 * @return {Function}
 * @api private
 */

function objectToFunction(obj) {
  var match = {};
  for (var key in obj) {
    match[key] = typeof obj[key] === 'string'
      ? defaultToFunction(obj[key])
      : toFunction(obj[key]);
  }
  return function(val){
    if (typeof val !== 'object') return false;
    for (var key in match) {
      if (!(key in val)) return false;
      if (!match[key](val[key])) return false;
    }
    return true;
  };
}

/**
 * Built the getter function. Supports getter style functions
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function get(str) {
  var props = expr(str);
  if (!props.length) return '_.' + str;

  var val, i, prop;
  for (i = 0; i < props.length; i++) {
    prop = props[i];
    val = '_.' + prop;
    val = "('function' == typeof " + val + " ? " + val + "() : " + val + ")";

    // mimic negative lookbehind to avoid problems with nested properties
    str = stripNested(prop, str, val);
  }

  return str;
}

/**
 * Mimic negative lookbehind to avoid problems with nested properties.
 *
 * See: http://blog.stevenlevithan.com/archives/mimic-lookbehind-javascript
 *
 * @param {String} prop
 * @param {String} str
 * @param {String} val
 * @return {String}
 * @api private
 */

function stripNested (prop, str, val) {
  return str.replace(new RegExp('(\\.)?' + prop, 'g'), function($0, $1) {
    return $1 ? $0 : val;
  });
}

},{"component-props":86,"props":86}]},{},[37])
//# sourceMappingURL=bundle.js.map
