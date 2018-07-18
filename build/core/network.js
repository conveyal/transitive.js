'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

var _componentEmitter = require('component-emitter');

var _componentEmitter2 = _interopRequireDefault(_componentEmitter);

var _route = require('./route');

var _route2 = _interopRequireDefault(_route);

var _pattern = require('./pattern');

var _pattern2 = _interopRequireDefault(_pattern);

var _journey = require('./journey');

var _journey2 = _interopRequireDefault(_journey);

var _stop = require('../point/stop');

var _stop2 = _interopRequireDefault(_stop);

var _place = require('../point/place');

var _place2 = _interopRequireDefault(_place);

var _pointclustermap = require('../point/pointclustermap');

var _pointclustermap2 = _interopRequireDefault(_pointclustermap);

var _renderededge = require('../renderer/renderededge');

var _renderededge2 = _interopRequireDefault(_renderededge);

var _renderedsegment = require('../renderer/renderedsegment');

var _renderedsegment2 = _interopRequireDefault(_renderedsegment);

var _graph = require('../graph/graph');

var _graph2 = _interopRequireDefault(_graph);

var _polyline = require('../util/polyline.js');

var _polyline2 = _interopRequireDefault(_polyline);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('transitive:network');

/**
 * Network
 */
var Network = function () {
  function Network(transitive, data) {
    (0, _classCallCheck3.default)(this, Network);

    this.transitive = transitive;

    this.routes = {};
    this.stops = {};
    this.patterns = {};
    this.places = {};
    this.journeys = {};
    this.paths = [];
    this.baseVertexPoints = [];
    this.graph = new _graph2.default(this, []);

    if (data) this.load(data);
  }

  /**
   * Load
   *
   * @param {Object} data
   */

  (0, _createClass3.default)(Network, [{
    key: 'load',
    value: function load(data) {
      var _this = this;

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

      // Copy/decode the streetEdge objects
      this.streetEdges = {};
      (0, _lodash.forEach)(data.streetEdges, function (streetEdgeData) {
        var latLons = _polyline2.default.decode(streetEdgeData.geometry.points);
        var coords = [];
        (0, _lodash.forEach)(latLons, function (latLon) {
          coords.push(_util.sm.forward([latLon[1], latLon[0]]));
        });
        _this.streetEdges[streetEdgeData.edge_id] = {
          latLons: latLons,
          worldCoords: coords,
          length: streetEdgeData.geometry.length
        };
      });

      // Generate the route objects
      this.routes = {};
      (0, _lodash.forEach)(data.routes, function (routeData) {
        _this.routes[routeData.route_id] = new _route2.default(routeData);
      });

      // Generate the stop objects
      this.stops = {};
      (0, _lodash.forEach)(data.stops, function (stopData) {
        _this.stops[stopData.stop_id] = new _stop2.default(stopData);
      });

      // Generate the pattern objects
      this.patterns = {};
      (0, _lodash.forEach)(data.patterns, function (patternData) {
        var pattern = new _pattern2.default(patternData, _this);
        _this.patterns[patternData.pattern_id] = pattern;
        var route = _this.routes[patternData.route_id];
        if (route) {
          route.addPattern(pattern);
          pattern.route = route;
        } else {
          debug('Error: pattern ' + patternData.pattern_id + ' refers to route that was not found: ' + patternData.route_id);
        }
        if (pattern.render) _this.paths.push(pattern.createPath());
      });

      // Generate the place objects
      this.places = {};
      (0, _lodash.forEach)(data.places, function (placeData) {
        var place = _this.places[placeData.place_id] = new _place2.default(placeData, _this);
        _this.addVertexPoint(place);
      });

      // Generate the internal Journey objects
      this.journeys = {};
      (0, _lodash.forEach)(data.journeys, function (journeyData) {
        var journey = new _journey2.default(journeyData, _this);
        _this.journeys[journeyData.journey_id] = journey;
        _this.paths.push(journey.path);
      });

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
      (0, _lodash.forEach)((0, _values2.default)(this.streetEdges), function (streetEdge) {
        if (streetEdge.fromTurnPoint && streetEdge.toTurnPoint) {
          addTurn(streetEdge.toTurnPoint, streetEdge.fromTurnPoint);
          addTurn(streetEdge.fromTurnPoint, streetEdge.toTurnPoint);
        }
      });
      for (var turnPointId in turnLookup) {
        var count = turnLookup[turnPointId].length;
        if (count > 2) this.addVertexPoint(this.turnPoints[turnPointId]);
      }

      this.createGraph();

      this.loaded = true;
      this.emit('load', this);
      return this;
    }

    /** Graph Creation/Processing Methods **/

  }, {
    key: 'clearGraphData',
    value: function clearGraphData() {
      (0, _lodash.forEach)(this.paths, function (path) {
        path.clearGraphData();
      });
    }
  }, {
    key: 'createGraph',
    value: function createGraph() {
      this.applyZoomFactors(this.transitive.display.activeZoomFactors);

      // clear previous graph-specific data
      if (this.pointClusterMap) this.pointClusterMap.clearMultiPoints();
      (0, _lodash.forEach)((0, _values2.default)(this.stops), function (stop) {
        stop.setFocused(true);
      });

      // create the list of vertex points
      var vertexPoints;
      if (this.mergeVertexThreshold && this.mergeVertexThreshold > 0) {
        this.pointClusterMap = new _pointclustermap2.default(this, this.mergeVertexThreshold);
        vertexPoints = this.pointClusterMap.getVertexPoints(this.baseVertexPoints);
      } else vertexPoints = this.baseVertexPoints;

      // core graph creation steps
      this.graph = new _graph2.default(this, vertexPoints);
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
    }
  }, {
    key: 'isSnapping',
    value: function isSnapping() {
      return this.gridCellSize && this.gridCellSize !== 0;
    }

    /*
     * identify and populate the 'internal' vertex points, which is zoom-level specfic
     */

  }, {
    key: 'createInternalVertexPoints',
    value: function createInternalVertexPoints() {
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
        } else if (edgeGroup.hasTransit()) {
          // special case: transit edge with no internal vertices (i.e. intermediate stops)
          edgeGroup.edges.forEach(function (edge) {
            if (edge.pointGeom && edge.pointGeom.length > 0) {
              edge.geomCoords = edge.pointGeom[0].slice(0);
            }
          });
        }
      }
    }
  }, {
    key: 'updateGeometry',
    value: function updateGeometry() {
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
    }
  }, {
    key: 'applyZoomFactors',
    value: function applyZoomFactors(factors) {
      this.gridCellSize = factors.gridCellSize;
      this.internalVertexFactor = factors.internalVertexFactor;
      this.angleConstraint = factors.angleConstraint;
      this.mergeVertexThreshold = factors.mergeVertexThreshold;
      this.useGeographicRendering = factors.useGeographicRendering;
    }

    /**
     *
     */

  }, {
    key: 'processSegment',
    value: function processSegment(segment) {
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
    }

    /**
     * Helper function for stopAjacency table
     *
     * @param {Stop} adjacent stops list
     * @param {Stop} stopA
     * @param {Stop} stopB
     */

  }, {
    key: 'addStopAdjacency',
    value: function addStopAdjacency(stopIdA, stopIdB) {
      if (!this.adjacentStops[stopIdA]) this.adjacentStops[stopIdA] = [];
      if (this.adjacentStops[stopIdA].indexOf(stopIdB) === -1) this.adjacentStops[stopIdA].push(stopIdB);
    }

    /**
     * Populate the graph edges
     */

  }, {
    key: 'populateGraphEdges',
    value: function populateGraphEdges() {
      var _this2 = this;

      // vertex associated with the last vertex point we passed in this sequence
      var lastVertex = null;

      // collection of 'internal' (i.e. non-vertex) points passed
      // since the last vertex point
      var internalPoints = [];

      (0, _lodash.forEach)(this.paths, function (path) {
        (0, _lodash.forEach)(path.segments, function (segment) {
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

          (0, _lodash.forEach)(segment.points, function (point, index) {
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
                var edge = _this2.graph.getEquivalentEdge(internalPoints, fromVertex, toVertex);

                // create a new graph edge if necessary
                if (!edge) {
                  edge = _this2.graph.addEdge(internalPoints, fromVertex, toVertex, segment.getType());
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
          });
        });
      });
    }
  }, {
    key: 'createGraphEdge',
    value: function createGraphEdge(segment, fromVertex, toVertex, internalPoints, geomCoords) {
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
      }

      segment.addEdge(edge, fromVertex);
      edge.addPathSegment(segment);
    }
  }, {
    key: 'annotateTransitPoints',
    value: function annotateTransitPoints() {
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
    }
  }, {
    key: 'initPlaceAdjacency',
    value: function initPlaceAdjacency() {
      (0, _lodash.forEach)((0, _values2.default)(this.places), function (place) {
        if (!place.graphVertex) return;
        (0, _lodash.forEach)(place.graphVertex.incidentEdges(), function (edge) {
          var oppVertex = edge.oppositeVertex(place.graphVertex);
          if (oppVertex.point) {
            oppVertex.point.adjacentPlace = place;
          }
        });
      });
    }
  }, {
    key: 'createRenderedSegments',
    value: function createRenderedSegments() {
      var _this3 = this;

      this.reLookup = {};
      this.renderedEdges = [];
      this.renderedSegments = [];

      for (var patternId in this.patterns) {
        this.patterns[patternId].renderedEdges = [];
      }

      (0, _lodash.forEach)(this.paths, function (path) {
        (0, _lodash.forEach)(path.segments, function (pathSegment) {
          pathSegment.renderedSegments = [];

          if (pathSegment.type === 'TRANSIT') {
            // create a RenderedSegment for each pattern, except for buses which are collapsed to a single segment
            var busPatterns = [];
            (0, _lodash.forEach)(pathSegment.getPatterns(), function (pattern) {
              if (pattern.route.route_type === 3) busPatterns.push(pattern);else _this3.createRenderedSegment(pathSegment, [pattern]);
            });
            if (busPatterns.length > 0) {
              _this3.createRenderedSegment(pathSegment, busPatterns);
            }
          } else {
            // non-transit segments
            _this3.createRenderedSegment(pathSegment);
          }
        });
      });

      this.renderedEdges.sort(function (a, b) {
        // process render transit segments before walk
        if (a.getType() === 'WALK') return 1;
        if (b.getType() === 'WALK') return -1;
      });
    }
  }, {
    key: 'createRenderedSegment',
    value: function createRenderedSegment(pathSegment, patterns) {
      var _this4 = this;

      var rSegment = new _renderedsegment2.default(pathSegment);

      (0, _lodash.forEach)(pathSegment.edges, function (edge) {
        var rEdge = _this4.createRenderedEdge(pathSegment, edge.graphEdge, edge.forward, patterns);
        rSegment.addRenderedEdge(rEdge);
      });
      if (patterns) {
        rSegment.patterns = patterns;
        rSegment.mode = patterns[0].route.route_type;
      }

      pathSegment.addRenderedSegment(rSegment);
    }
  }, {
    key: 'createRenderedEdge',
    value: function createRenderedEdge(pathSegment, gEdge, forward, patterns) {
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
        rEdge = new _renderededge2.default(gEdge, forward, type, this.useGeographicRendering);
        if (patterns) {
          (0, _lodash.forEach)(patterns, function (pattern) {
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
    }
  }, {
    key: 'addVertexPoint',
    value: function addVertexPoint(point) {
      if (this.baseVertexPoints.indexOf(point) !== -1) return;
      this.baseVertexPoints.push(point);
    }
  }]);
  return Network;
}();

/**
 * Mixin `Emitter`
 */

exports.default = Network;
(0, _componentEmitter2.default)(Network.prototype);
module.exports = exports['default'];

//# sourceMappingURL=network.js