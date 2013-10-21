
/**
 * Dependencies
 */

var Styler = require('styler');
var Graph = require('graph');
var Linemap = require('linemap');

// temporary
var STYLE1 = {
  className: 'style1',

  stopRadius: 5,
  stopOffsetX: 0,
  stopOffsetY: 0,

  labelOffsetX: 0,
  labelOffsetY: -12,
  labelRotation: -45,

  capExtension: 10
};


/**
 * Expose `Transitive`
 */

module.exports = Transitive;

/**
 * Main object
 */

function Transitive(el, data, staticStyle, computedStyles) {
  if (!(this instanceof Transitive)) {
    return new Transitive();
  }

  this.graph = new Graph.NetworkGraph();
  this.display = new Linemap.Display(600, 600);

  this.el = el;
  this.styler = new Styler(staticStyle, computedStyles);

  this.load(data);
  this.render();
}

/**
 * Load
 */

Transitive.prototype.load = function(data) {

  this.stops = {};
  data.stops.forEach(function(stopData) {
    var stop = new Linemap.Stop(stopData);
    this.stops[stop.stop_id] = stop;
  }, this);

  this.routes = {};
  this.patterns = {};

  // A list of stops that will become vertices in the network graph. This includes all stops
  // that serve as a pattern endpoint and/or a convergence/divergence point between patterns 
  var vertexStops = {};

  data.routes.forEach(function(routeData) {
    
    // set up the Route object
    var route = new Linemap.Route(routeData);
    this.routes[route.route_id] = route;

    // iterate through the Route's constituent Patterns
    routeData.patterns.forEach(function(patternData) {

      // set up the Pattern object
      var pattern = new Linemap.Pattern(patternData);
      this.patterns[patternData.pattern_id] = pattern;
      route.addPattern(pattern);

      patternData.stops.forEach(function(stopInfo) {
        var stop = this.stops[stopInfo.stop_id];
        pattern.stops.push(stop);
        stop.patterns.push(pattern);
      }, this);

      // add the start and end stops to the vertexStops collection
      var firstStop = pattern.stops[0];
      if(!(firstStop.getId() in vertexStops)) vertexStops[firstStop.getId()] = firstStop;

      var lastStop = pattern.stops[pattern.stops.length-1];
      if(!(lastStop.getId() in vertexStops)) vertexStops[lastStop.getId()] = lastStop;

    }, this);

  }, this);



  // populate the graph vertices
  for(var stopId in vertexStops) {
    var stop = vertexStops[stopId];
    var vertex = this.graph.addVertex(stop, 0, 0);
    stop.graphVertex = vertex;
  }

  // populate the graph edges
  var patterns = [];
  for(var key in this.patterns) patterns.push(this.patterns[key]);
  patterns.forEach(function(pattern) {
    // the vertex associated with the last vertex stop we passed in this sequence 
    var lastVertex = null;
    
    // the collection of 'internal' (i.e. non-vertex) stops passed since the last vertex stop 
    var internalStops = [];
    
    pattern.stops.forEach(function(stop) {
      
      if(stop.graphVertex) { // this is a vertex stop
        if(lastVertex !== null) {
          var edge = this.graph.getEquivalentEdge(internalStops, lastVertex, stop.graphVertex);
          if(edge === null) edge = this.graph.addEdge(internalStops, lastVertex, stop.graphVertex);
          pattern.graphEdges.push(edge);
        }
        lastVertex = stop.graphVertex;
        internalStops = [];
      }

      else { // this is an internal stop
        internalStops.push(stop);
      }

    }, this);
  }, this);
};


/**
 * Render
 */

Transitive.prototype.render = function() {
  // render ?
  for(var key in this.patterns) {
    var pattern = this.patterns[key];
    pattern.draw(this.display);
    pattern.applyStyle(STYLE1); // temporary
    pattern.refresh(this.display);
  }
};

/**
 * Set element
 */

Transitive.prototype.setElement = function(el) {
  this.el = el;
  this.render();
};
