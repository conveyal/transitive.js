
// dependencies

var d3 = require('d3');
var select = require('select');
var Set = require('set');
var Transitive = require('transitive');

// create and handle route/pattern selection

var $canvas = document.getElementById('canvas');
var $form = document.getElementById('form');
var $reverse = document.getElementById('reverse-direction');

// transitive instance

var transitive = new Transitive($canvas);

// handle selects

var Routes = select().label('Routes');
var Patterns = select().multiple().label('Patterns');

document.getElementById('select-route').appendChild(Routes.el);
document.getElementById('select-pattern').appendChild(Patterns.el);

// current_route

var ROUTE = null;

// On check

$reverse.addEventListener('change', showRoute);

// On route selection change

Routes.on('select', function (option) {
  localStorage.setItem('selected-route', option.name);

  ROUTE = getRoute(INDEX_FULL.routes, option.value) || getRoute(INDEX_FULL.routes, option.name);
  console.log('selected route:', ROUTE);

  showRoute();
});

// add routes

for (var i in INDEX.routes) {
  var route = INDEX.routes[i];
  Routes.add(route.route_short_name || route.route_id, route.route_id);
}

// Select the first route

Routes.select(localStorage.getItem('selected-route') || INDEX.routes[0].route_short_name.toLowerCase());

// show a route

function showRoute() {
  transitive.direction = $reverse.checked
    ? 1
    : 0;

  console.log(transitive.direction);

  Patterns.empty();
  for (var i in ROUTE.patterns) {
    var pattern = ROUTE.patterns[i];
    if (parseInt(pattern.direction_id, 10) === transitive.direction) {
      Patterns.add(pattern.pattern_name, pattern.pattern_id);
      Patterns.select(pattern.pattern_name.toLowerCase());
    }
  }

  var data = {
    routes: [ ROUTE ],
    stops: getStops(INDEX_FULL.stops, ROUTE)
  };

  // load the route data & render
  transitive.load(data).render();
}

// get a route

function getRoute(routes, id) {
  for (var i in routes) {
    var route = routes[i];
    if (route.route_id.toLowerCase() === id) {
      return route;
    }
  }
}

// get the stops for a route

function getStops(stops, route) {
  var stop_ids = new Set();
  for (var i in route.patterns) {
    var pattern = route.patterns[i];
    for (var j in pattern.stops) {
      stop_ids.add(pattern.stops[j].stop_id);
    }
  }

  return stops.filter(function (stop) {
    return stop_ids.has(stop.stop_id);
  });
}
