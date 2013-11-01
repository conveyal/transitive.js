
/**
 * Dependencies
 */

var d3 = require('d3');
var Display = require('./display');
var Graph = require('./graph');
var Pattern = require('./pattern');
var Route = require('./route');
var Stop = require('./stop');
var Styler = require('./styler');

/**
 * Expose `Transitive`
 */

module.exports = Transitive;

/**
 * Make `d3` accessible
 */

module.exports.d3 = d3;

/**
 * Version
 */

module.exports.version = '0.0.0';

/**
 * Main object
 */

function Transitive(el, data, passiveStyles, computedStyles) {
  if (!(this instanceof Transitive)) {
    return new Transitive(el, data, passiveStyles, computedStyles);
  }

  this.style = new Styler(passiveStyles, computedStyles);

  this.load(data);
  this.renderTo(el);
}

/**
 * Load
 */

Transitive.prototype.load = function(data) {
  this.graph = new Graph();

  this.stops = generateStops(data.stops);

  this.routes = {};
  this.patterns = {};

  // A list of stops that will become vertices in the network graph.
  // This includes all stops that serve as a pattern endpoint and/or
  // a convergence/divergence point between patterns
  var vertexStops = {};

  // object maps stop ids to arrays of unique stop_ids reachable from that stop
  var adjacentStops = {};

  data.routes.forEach(function (routeData) {
    // set up the Route object
    var route = new Route(routeData);
    this.routes[route.route_id] = route;

    var patternCount = routeData.patterns.length;

    // iterate through the Route's constituent Patterns
    routeData.patterns.forEach(function (patternData, i) {

      // temp: only look at direction=0 patterns
      if(parseInt(patternData.direction_id, 10) === 0) {
        return;
      }

      //console.log('processing pattern: ');
      //console.log(patternData);

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

  if (this.display && this.el) {
    this.display.setScale(this.el.clientHeight, this.el.clientWidth, this.graph);
  }

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
  var display = this.display;
  var offsetLeft = this.el.offsetLeft;
  var offsetTop = this.el.offsetTop;
  var refresh = this.refresh.bind(this);

  // Need to find a better place to add behaviors...
  var drag = d3.behavior.drag()
    .on('dragstart', function () {
      d3.event.sourceEvent.stopPropagation(); // silence other listeners
    })
    .on('drag', function (data, index) {
      if (data.stop.graphVertex) {
        data.stop.graphVertex.moveTo(
          display.xScale.invert(d3.event.sourceEvent.pageX - offsetLeft),
          display.yScale.invert(d3.event.sourceEvent.pageY - offsetTop)
        );

        refresh();
      }
    });

  // remove all old patterns
  this.display.empty();

  for (var key in this.patterns) {
    var pattern = this.patterns[key];

    pattern.draw(this.display, 10);
    pattern.stopSvgGroups.selectAll('.transitive-stop-circle').call(drag);
  }

  refresh();

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
  for (var key in this.patterns) {
    var pattern = this.patterns[key];

    this.style.render(pattern.svgGroup, this.display);
    pattern.refresh(this.display);
  }

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
  this.display.setScale(el, this.graph);

  return this;
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
