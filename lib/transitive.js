
/**
 * Dependencies
 */

var d3 = require('d3');
var Display = require('./display');
var Emitter = require('emitter');
var Graph = require('./graph');
var Pattern = require('./pattern');
var Route = require('./route');
var Stop = require('./stop');
var Styler = require('./styler');
var toFunction = require('to-function');

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
 * Main object
 */

function Transitive(el, data, styles) {
  if (!(this instanceof Transitive)) {
    return new Transitive(el, data, styles);
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
 * Add a filter
 *
 * @param {String|Object|Function} filter
 */

Transitive.prototype.addFilter =
Transitive.prototype.filter = function(type, filter) {
  if (!this._filter[type]) this._filter[type] = [];
  this._filter[type].push(toFunction(filter));

  return this;
};

/**
 * Clear all filters
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

  return this;
};

/**
 * Load
 */

Transitive.prototype.load = function(data) {
  this.graph = new Graph();

  this.stops = generateStops(applyFilters(data.stops, this._filter.stops));

  this.routes = {};
  this.patterns = {};

  // A list of stops that will become vertices in the network graph.
  // This includes all stops that serve as a pattern endpoint and/or
  // a convergence/divergence point between patterns
  var vertexStops = {};

  // object maps stop ids to arrays of unique stop_ids reachable from that stop
  var adjacentStops = {};

  applyFilters(data.routes, this._filter.routes).forEach(function (routeData) {
    // set up the Route object
    var route = new Route(routeData);
    this.routes[route.route_id] = route;

    // iterate through the Route's constituent Patterns
    applyFilters(routeData.patterns, this._filter.patterns).forEach(function (patternData, i) {
      // set up the Pattern object
      var pattern = new Pattern(patternData);
      this.patterns[patternData.pattern_id] = pattern;
      route.addPattern(pattern);

      // iterate through this pattern's stops, associating stops/patterns with each other
      // and initializing the adjacentStops table
      var previousStop = null;
      patternData.stops.forEach(function (stopInfo) {
        var stop = this.stops[stopInfo.stop_id];
        //console.log(' - '+stop.getId()+' / ' + stop.stop_name);

        pattern.stops.push(stop);
        stop.patterns.push(pattern);

        if(previousStop) { // this block called for each pair of adjacent stops in pattern
          addStopAdjacency(adjacentStops, stop, previousStop);
          addStopAdjacency(adjacentStops, previousStop, stop);
        }
        previousStop = stop;
      }, this);

      // add the start and end stops to the vertexStops collection
      var firstStop = pattern.stops[0];
      if(!(firstStop.getId() in vertexStops)) {
        vertexStops[firstStop.getId()] = firstStop;
      }

      var lastStop = pattern.stops[pattern.stops.length-1];
      if(!(lastStop.getId() in vertexStops)) {
        vertexStops[lastStop.getId()] = lastStop;
      }
    }, this);
  }, this);

  //console.log('adj stops:');
  //console.log(adjacentStops);

  // determine the convergence/divergence vertex stops by looking for stops w/ >2 adjacent stops
  for(var stopId in adjacentStops) {
    if(adjacentStops[stopId].length > 2) {
      vertexStops[stopId] = this.stops[stopId];
    }
  }

  // populate the vertices in the graph object
  for (stopId in vertexStops) {
    var stop = vertexStops[stopId];
    var vertex = this.graph.addVertex(stop, 0, 0);
    stop.graphVertex = vertex;
  }

  populateGraphEdges(this.patterns, this.graph);

  this.graph.convertTo1D();
  //this.placeStopLabels();
  this.setScale();

  this.emit('loaded', this);

  return this;
};

/**
 * Helper function for stopAjacency table
 */

function addStopAdjacency(adjacentStops, stopA, stopB) {
  if (!adjacentStops[stopA.getId()]) {
    adjacentStops[stopA.getId()] = [];
  }

  if (adjacentStops[stopA.getId()].indexOf(stopB.getId()) === -1) {
    adjacentStops[stopA.getId()].push(stopB.getId());
  }
}

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
    pattern.draw(this.display, 10);
  }

  // initialize the stop svg elements
  for (key in this.stops) {
    this.stops[key].draw(this.display);
  }

  this.refresh();

  this.emit('rendered', this);

  return this;
};

/**
 * Render to
 */

Transitive.prototype.renderTo = function(el) {
  this.setElement(el);
  this.render();

  return this;
};

/**
 * Refresh
 */

Transitive.prototype.refresh = function() {
  // clear the stop render data
  for (var key in this.stops) {
    this.stops[key].renderData = [];
  }

  // refresh the patterns
  for (key in this.patterns) {
    var pattern = this.patterns[key];
    pattern.refreshRenderData(); // also updates the stop-level renderData

    this.style.renderPattern(this.display, pattern.svgGroup);
    pattern.refresh(this.display, this.style);
  }

  // refresh the stops
  for (key in this.stops) {
    var stop = this.stops[key];
    if(!stop.svgGroup) continue; // check if this stop is not currently rendered

    this.style.renderStop(this.display, stop.svgGroup);
    stop.refresh(this.display);
  }

  this.emit('refreshed', this);

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
};


/**
 * Place the stop text labels, minimizing overlap
 */

Transitive.prototype.placeStopLabels = function() {


  // determine the y-range of each pattern
  // refresh the patterns

  for (var key in this.patterns) {
    var minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;
    var pattern = this.patterns[key];
    var vertices = pattern.vertexArray();
    console.log(vertices);
    //vertices.forEach(function(vertex) {
    for(var i = 0; i < vertices.length; i++) {
      var vertex = vertices[i];
      minY = Math.min(minY, vertex.y);
      maxY = Math.max(maxY, vertex.y);
    }

    console.log('p yr: '+minY + ' to '+maxY);
  }

  //
  for (key in this.stops) {
    var stop = this.stops[key];
    if(stop.patterns.length === 0) continue; // check if this stop is not currently displayed

  }

};


/**
 * Generate Stops
 */

function generateStops(data) {
  var stops = {};

  data.forEach(function (stop) {
    stops[stop.stop_id] = new Stop(stop);
  });

  return stops;
}

/**
 * Populate the graph edges
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

    for (var stopId in pattern.stops) {
      var stop = pattern.stops[stopId];
      if (stop.graphVertex) { // this is a vertex stop
        if (lastVertex !== null) {
          var edge = graph.getEquivalentEdge(internalStops, lastVertex,
            stop.graphVertex);

          if (!edge) {
            edge = graph.addEdge(internalStops, lastVertex, stop.graphVertex);
          }

          pattern.addEdge(edge);
          edge.addPattern(pattern);
        }

        lastVertex = stop.graphVertex;
        internalStops = [];
      } else { // this is an internal stop
        internalStops.push(stop);
      }
    }
  }
}

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
