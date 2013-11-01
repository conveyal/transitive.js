
// dependencies

var d3 = require('d3');
var select = require('select');
var Set = require('set');
var Transitive = require('transitive');

// create and handle route/pattern selection

var $canvas = document.getElementById('canvas');
var $form = document.getElementById('form');

// transitive instance

var transitive;

// handle selects

var Routes = select().label('Routes');
var Patterns = select().multiple().label('Patterns');

document.getElementById('select-route').appendChild(Routes.el);
document.getElementById('select-pattern').appendChild(Patterns.el);

Routes.on('select', function (option) {
  localStorage.setItem('selected-route', option.name);

  Patterns.empty();
  var route = getRoute(INDEX_FULL.routes, option.value) || getRoute(INDEX_FULL.routes, option.name);
  for (var i in route.patterns) {
    var pattern = route.patterns[i];
    Patterns.add(pattern.pattern_name, pattern.pattern_id);
    Patterns.select(pattern.pattern_name.toLowerCase());
  }

  var data = {
    routes: [ route ],
    stops: getStops(INDEX_FULL.stops, route)
  };

  /* load the route data & render */
  if (!transitive) {
    transitive = new Transitive($canvas, data);
  } else {
    transitive.load(data).render();
  }
});

// add routes

for (var i in INDEX.routes) {
  var route = INDEX.routes[i];
  Routes.add(route.route_short_name || route.route_id, route.route_id);
}

// Select the first route

Routes.select(localStorage.getItem('selected-route') || INDEX.routes[0].route_short_name.toLowerCase());

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
  })
}
