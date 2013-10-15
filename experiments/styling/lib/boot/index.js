
/**
 * Dependencies
 */

var d3 = require('d3');
var TEST_DATA = require('./data');
var Display = require('./display');
var Graph = require('graph');
var Pattern = require('./pattern');
var Route = require('./route');
var Stop = require('./stop');
var _ = require('underscore');

/**
 *  The main class
 */

function App() {
  this.graph = new Graph();

  this.loadData(TEST_DATA);

  this.display = new Display(600, 600);

  //this.pattern = this.patterns['R1_A'];

  _.each(_.values(this.patterns), function (pattern) {
    pattern.draw(this.display);
    pattern.refresh(this.display);
  }, this);
}

App.prototype.loadData = function(data) {

  this.stops = {};
  _.each(data.stops, function (stopData) {
    var stop = new Stop(stopData);
    this.stops[stop.stop_id] = stop;
  }, this);

  this.routes = {};
  this.patterns = {};

  // A list of stops that will become vertices in the network graph. This includes all stops
  // that serve as a pattern endpoint and/or a convergence/divergence point between patterns
  var vertexStops = {};

  _.each(data.routes, function (routeData) {

    // set up the Route object
    var route = new Route(routeData);
    this.routes[route.route_id] = route;

    // iterate through the Route's constituent Patterns
    _.each(routeData.patterns, function (patternData) {

      // set up the Pattern object
      var pattern = new Pattern(patternData);
      this.patterns[patternData.pattern_id] = pattern;
      route.addPattern(pattern);

      _.each(patternData.stops, function (stopInfo) {
        var stop = this.stops[stopInfo.stop_id];
        pattern.stops.push(stop);
        stop.patterns.push(pattern);
      }, this);

      // add the start and end stops to the vertexStops collection
      var firstStop = pattern.stops[0];
      if (!(firstStop.getId() in vertexStops)) {
        vertexStops[firstStop.getId()] = firstStop;
      }

      var lastStop = pattern.stops[pattern.stops.length-1];
      if (!(lastStop.getId() in vertexStops)) {
        vertexStops[lastStop.getId()] = lastStop;
      }

    }, this);

  }, this);

  // populate the graph vertices
  _.each(_.values(vertexStops), function (stop) {
    var vertex = this.graph.addVertex(stop, 0, 0);
    stop.graphVertex = vertex;
  }, this);

  // populate the graph edges
  _.each(_.values(this.patterns), function (pattern) {

    // the vertex associated with the last vertex stop we passed in this sequence
    var lastVertex = null;

    // the collection of 'internal' (i.e. non-vertex) stops passed since the last vertex stop
    var internalStops = [];

    _.each(pattern.stops, function (stop) {

      if (stop.graphVertex) { // this is a vertex stop
        if (lastVertex !== null) {
          var edge = this.graph.getEquivalentEdge(internalStops, lastVertex, stop.graphVertex);
          if (edge === null) {
            edge = this.graph.addEdge(internalStops, lastVertex, stop.graphVertex);
          }
          pattern.graphEdges.push(edge);
        }
        lastVertex = stop.graphVertex;
        internalStops = [];
      } else { // this is an internal stop
        internalStops.push(stop);
      }

    }, this);
  }, this);
};

module.exports = function() {
  new App();
};
