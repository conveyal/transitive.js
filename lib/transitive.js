
/**
 * Dependencies
 */

var d3 = require('d3');
var debug = require('debug')('transitive');
var Display = require('./display');
var Emitter = require('emitter');
var Graph = require('./graph');
var Pattern = require('./pattern');
var Route = require('./route');
var Stop = require('./stop');
var Journey = require('./journey');
var Styler = require('./styler');
var OtpProfile = require('./profile');

var toFunction = require('to-function');
var each = require('each');

/**
 * Expose `Transitive`
 */

module.exports = Transitive;

/**
 * Expose `d3`
 */

module.exports.d3 = Transitive.prototype.d3 = d3;

/**
 * Expose `version`
 */

module.exports.version = '0.0.0';

/**
 * Create a new instance of `Transitive`
 *
 * @param {Element} element to render to
 * @param {Object} data to render
 * @param {Object} styles to apply
 * @param {Object} options object
 */

function Transitive(el, data, styles, options) {
  if (!(this instanceof Transitive)) {
    return new Transitive(el, data, styles, options);
  }

  this.clearFilters();
  this.data = data;
  this.setElement(el);
  this.style = new Styler(styles);
}

/**
 * Mixin `Emitter`
 */

Emitter(Transitive.prototype);

/**
 * Add a data filter
 *
 * @param {String} type
 * @param {String|Object|Function} filter, gets passed to `to-function`
 */

Transitive.prototype.addFilter =
Transitive.prototype.filter = function(type, filter) {
  if (!this._filter[type]) this._filter[type] = [];
  this._filter[type].push(toFunction(filter));

  return this;
};

/**
 * Clear all data filters
 *
 * @param {String} filter type
 */

Transitive.prototype.clearFilters = function(type) {
  if (type) {
    this._filter[type] = [];
  } else {
    this._filter = {
      patterns: [],
      routes: [],
      stops: []
    };
  }

  this.emit('clear filters', this);
  return this;
};

/**
 * Load
 *
 * @param {Object} data
 */

Transitive.prototype.load = function(data) {
  debug('load', data);

  this.graph = new Graph();

  // Generate the stop objects
  this.stops = {};
  applyFilters(data.stops, this._filter.stops).forEach(function (data) {
    this.stops[data.stop_id] = new Stop(data);
  }, this);

  // A list of stops that will become vertices in the network graph. This
  // includes all stops that serve as a pattern endpoint and/or a
  // convergence/divergence point between patterns
  var vertexStops = {};

  // object maps stop ids to arrays of unique stop_ids reachable from that stop
  var adjacentStops = {};

  // Generate the routes & patterns
  this.routes = {};
  this.patterns = {};
  this.journeys = {};

  if(data.routes) {
    applyFilters(data.routes, this._filter.routes).forEach(function (routeData) {
      var route = this.routes[routeData.route_id] = new Route(routeData);
      // iterate through the Route's constituent Patterns
      applyFilters(routeData.patterns, this._filter.patterns).forEach(function (patternData, i) {
        var pattern = this.processStopSequence(patternData, patternData.pattern_id, vertexStops, adjacentStops);
        pattern.route = route;
      }, this);
    }, this);
  }

  if(data.journeys) {
    data.journeys.forEach((function(journeyData) {
      var journey = new Journey(journeyData);
      var pattern = this.processStopSequence(journeyData, journeyData.journey_id, vertexStops, adjacentStops);
      journey.addPattern(pattern);
      //journey.combinedPattern = pattern;
      this.journeys[journeyData.journey_id] = journey;

    }).bind(this));
  }

  // determine the convergence/divergence vertex stops by looking for stops w/ >2 adjacent stops
  for (var stopId in adjacentStops) {
    if (adjacentStops[stopId].length > 2) {
      vertexStops[stopId] = this.stops[stopId];
      this.stops[stopId].isBranchPoint = true;
    }
  }

  // populate the vertices in the graph object
  for (stopId in vertexStops) {
    var stop = vertexStops[stopId];
    var vertex = this.graph.addVertex(stop, 0, 0);
    stop.graphVertex = vertex;
  }

  populateGraphEdges(this.patterns, this.graph);

  //this.graph.convertTo1D();
  this.graph.apply2DOffsets();
  //this.placeStopLabels();
  this.setScale();

  this.emit('load', this);
  return this;
};

/**
 *
 */

Transitive.prototype.processStopSequence = function(data, id, vertexStops, adjacentStops) {
  // Create the Pattern object
  var pattern = this.patterns[id] = new Pattern(id, data);

  // iterate through this pattern's stops, associating stops/patterns with
  // each other and initializing the adjacentStops table
  var previousStop = null;
  //data.stops.forEach(function (stopInfo) {
  for(var i=0; i < data.stops.length; i++) {
    var stopInfo = data.stops[i];
    var stop = this.stops[stopInfo.stop_id];

    pattern.stops.push(stop);
    stop.patterns.push(pattern);

    // called for each pair of adjacent stops in pattern
    if (previousStop) {
      addStopAdjacency(adjacentStops, stop.getId(), previousStop.getId());
      addStopAdjacency(adjacentStops, previousStop.getId(), stop.getId());
    }

    previousStop = stop;

    if(stopInfo.transfer) {
      vertexStops[stop.getId()] = stop;
      stop.isSegmentEndPoint = true;
    }
    else stop.isSegmentEndPoint = false;

    stop.isFromLocation = (stopInfo.fromLocation === true);
    stop.isToLocation = (stopInfo.toLocation === true);
  }

  // add the start and end stops to the vertexStops collection
  var firstStop = pattern.stops[0];
  if(!(firstStop.getId() in vertexStops)) {
    vertexStops[firstStop.getId()] = firstStop;
  }
  firstStop.isEndPoint = true;

  var lastStop = pattern.stops[pattern.stops.length-1];
  if(!(lastStop.getId() in vertexStops)) {
    vertexStops[lastStop.getId()] = lastStop;
  }
  lastStop.isEndPoint = true;

  return pattern;
};


/**
 * LoadProfile
 *
 * options:
 *   
 */

Transitive.prototype.loadProfile = function(profileData, endpoint, callback, options) {
  var profile = new OtpProfile(profileData, endpoint, (function(data) {
    this.data = data;
    callback.call(this, data);
  }).bind(this), options);

  // this.style.load(profile.styles);

  // apply computed behaviors
  this.on('render', function (transitive) {
    each(profile.computed, function (behavior) {
      behavior(transitive);
    });
  });

};

/**
 * Render
 */

Transitive.prototype.render = function() {
  this.load(this.data);

  var display = this.display;
  var offsetLeft = this.el.offsetLeft;
  var offsetTop = this.el.offsetTop;

  // remove all old svg elements
  this.display.empty();

  // initialize the pattern svg elements
  for (var key in this.patterns) {
    var pattern = this.patterns[key];
    pattern.refreshRenderData();
    pattern.draw(this.display, 0); // 10);
  }

  // Draw the stop svg elements
  for (key in this.stops) this.stops[key].draw(this.display);

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

  for (var key in this.patterns) {
    this.patterns[key].clearOffsets();
  }

  this.graph.apply2DOffsets();

  // clear the stop render data
  for (key in this.stops) this.stops[key].renderData = [];

  // refresh the patterns
  for (key in this.patterns) {
    var pattern = this.patterns[key];
    pattern.refreshRenderData(); // also updates the stop-level renderData

    for(var i = 0; i < pattern.segments.length; i++) {
      this.style.renderPattern(this.display, pattern.segments[i].lineGraph);
    }

    pattern.refresh(this.display, this.style);
  }

  // refresh the stops
  for (key in this.stops) {
    var stop = this.stops[key];
    if (!stop.svgGroup) continue; // check if this stop is not currently rendered

    this.style.renderStop(this.display, stop);
    stop.refresh(this.display);
  }

  this.emit('refresh', this);
  return this;
};

/**
 * Set element
 */

Transitive.prototype.setElement = function(el) {
  if (this.el) this.el.innerHTML = null;

  this.el = el;

  this.display = new Display(el);
  this.display.zoom.on('zoom', this.refresh.bind(this));

  this.setScale();

  this.emit('set element', this);
  return this;
};

/**
 * Set scale
 */

Transitive.prototype.setScale = function() {
  if (this.display && this.el && this.graph) {
    this.display.setScale(this.el.clientHeight, this.el.clientWidth,
      this.graph);
  }

  this.emit('set scale', this);
  return this;
};


/**
 * Apply an array of filters to an array of data
 *
 * @param {Array} data
 * @param {Array} filters
 */

function applyFilters(data, filters) {
  filters.forEach(function (filter) {
    data = data.filter(filter);
  });

  return data;
}

/**
 * Helper function for stopAjacency table
 *
 * @param {Stop} adjacent stops list
 * @param {Stop} stopA
 * @param {Stop} stopB
 */

function addStopAdjacency(stops, stopIdA, stopIdB) {
  if (!stops[stopIdA]) stops[stopIdA] = [];
  if (stops[stopIdA].indexOf(stopIdB) === -1) stops[stopIdA].push(stopIdB);
}

/**
 * Populate the graph edges
 *
 * @param {Object} patterns
 * @param {Graph} graph
 */

function populateGraphEdges(patterns, graph) {
  // vertex associated with the last vertex stop we passed in this sequence
  var lastVertex = null;

  // collection of 'internal' (i.e. non-vertex) stops passed
  // since the last vertex stop
  var internalStops = [];

  for (var id in patterns) {
    var pattern = patterns[id];

    lastVertex = null;
    var lastVertexIndex = 0;

    for(var i=0; i< pattern.stops.length; i++) {
      var stop = pattern.stops[i];
      if (stop.graphVertex) { // this is a vertex stop
        if (lastVertex !== null) {
          var edge = graph.getEquivalentEdge(internalStops, lastVertex,
            stop.graphVertex);

          if (!edge) {
            edge = graph.addEdge(internalStops, lastVertex, stop.graphVertex);

            // calculate the angle and apply to edge stops
            var dx = stop.graphVertex.x - lastVertex.x;
            var dy = stop.graphVertex.y - lastVertex.y;
            var angle = Math.atan2(dy, dx) * 180 / Math.PI;
            stop.angle = lastVertex.stop.angle = angle;
            for(var s = 0; s < internalStops.length; s++) {
              internalStops[s].angle = angle;
            }
          }

          pattern.addEdge(edge);
          edge.addPattern(pattern);

          // add the segment
          var patternSegment = {
            pattern: pattern
          };

          if(pattern.journey.stops[lastVertexIndex].boardSegment) {
            patternSegment.otpSegment = pattern.journey.stops[lastVertexIndex].boardSegment;
          }
          pattern.segments.push(patternSegment);
        }

        lastVertex = stop.graphVertex;
        lastVertexIndex = i;
        internalStops = [];
      } else { // this is an internal stop
        internalStops.push(stop);
      }
    }
  }
}
