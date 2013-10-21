
/**
 * Dependencies
 */

var Display = require('display');
var Graph = require('graph');
var Pattern = require('pattern');
var Route = require('route');
var Stop = require('stop');
var Styler = require('styler');

/**
 * Expose `Transitive`
 */

module.exports = Transitive;

/**
 * Main object
 */

function Transitive(el, data, passiveStyles, computedStyles) {
  if (!(this instanceof Transitive)) {
    return new Transitive(el, data, passiveStyles, computedStyles);
  }

  this.display = new Display(el);
  this.display.zoom.on('zoom', this.refresh.bind(this));

  this.graph = new Graph();
  this.style = new Styler(passiveStyles, computedStyles);

  this.load(data);
  this.render();
}

/**
 * Load
 */

Transitive.prototype.load = function(data) {

  this.stops = generateStops(data.stops);

  this.routes = {};
  this.patterns = {};

  // A list of stops that will become vertices in the network graph.
  // This includes all stops that serve as a pattern endpoint and/or
  // a convergence/divergence point between patterns
  var vertexStops = {};

  data.routes.forEach(function (routeData) {
    // set up the Route object
    var route = new Route(routeData);
    this.routes[route.route_id] = route;

    // iterate through the Route's constituent Patterns
    routeData.patterns.forEach(function (patternData) {

      // set up the Pattern object
      var pattern = new Pattern(patternData);
      this.patterns[patternData.pattern_id] = pattern;
      route.addPattern(pattern);

      patternData.stops.forEach(function (stopInfo) {
        var stop = this.stops[stopInfo.stop_id];
        pattern.stops.push(stop);
        stop.patterns.push(pattern);
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

  // populate the graph vertices
  for (var stopId in vertexStops) {
    var stop = vertexStops[stopId];
    var vertex = this.graph.addVertex(stop, 0, 0);
    stop.graphVertex = vertex;
  }

  populateGraphEdges(this.patterns, this.graph);
};

/**
 * Render
 */

Transitive.prototype.render = function() {
  for (var key in this.patterns) {
    var pattern = this.patterns[key];

    pattern.draw(this.display, 10);
  }

  this.refresh();
};

/**
 * Refresh
 */

Transitive.prototype.refresh = function() {
  for (var key in this.patterns) {
    var pattern = this.patterns[key];

    this.style.render(pattern.svgGroup, this.display);
    pattern.refresh(this.display);
  }
};

/**
 * Set element
 */

Transitive.prototype.setElement = function(el) {
  this.display.setElement(el);
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

    for (var stopId in pattern.stops) {
      var stop = pattern.stops[stopId];
      if (stop.graphVertex) { // this is a vertex stop
        if (lastVertex !== null) {
          var edge = graph.getEquivalentEdge(internalStops, lastVertex,
            stop.graphVertex);

          if (!edge) {
            edge = graph.addEdge(internalStops, lastVertex, stop.graphVertex);
          }

          pattern.graphEdges.push(edge);
        }

        lastVertex = stop.graphVertex;
        internalStops = [];
      } else { // this is an internal stop
        internalStops.push(stop);
      }
    }
  }
}
