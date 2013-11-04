
// dependencies

var select = require('select');
var Set = require('set');
var Transitive = require('transitive');

// Globals

var DIRECTION = '0';
var ROUTE = null;
var STOPS = new Set();

// handle selects

var Routes = select()
  .label('Routes');

var Patterns = select()
  .multiple()
  .label('Patterns');

document.getElementById('select-route').appendChild(Routes.el);
document.getElementById('select-pattern').appendChild(Patterns.el);

// transitive instance

var transitive = new Transitive(document.getElementById('canvas'), INDEX_FULL);

// Set up filters

transitive
  .filter('stops', function (stop) {
    return STOPS.has(stop.stop_id);
  })
  .filter('routes', function (route) {
    return ROUTE.route_id === route.route_id;
  })
  .filter('patterns', function (pattern) {
    return Patterns.values().indexOf(pattern.pattern_id) !== -1;
  });

// Direction check box

var $reverse = document.getElementById('reverse-direction');

// on direction change

$reverse.addEventListener('change', function (event) {
  DIRECTION = event.target.checked
    ? '1'
    : '0';

  // only show appropriate patterns
  updatePatterns(ROUTE, DIRECTION);

  // render
  transitive.render();
});

// On route selection change

Routes.on('select', function (option) {
  localStorage.setItem('selected-route', option.name);

  ROUTE = getRoute(option.name);
  STOPS = getStopIds(ROUTE);

  // only show appropriate patterns
  updatePatterns(ROUTE, DIRECTION);

  // render
  transitive.render();
});

// add routes

for (var i in INDEX.routes) {
  var route = INDEX.routes[i];
  Routes.add(route.route_id);
}

// Select the first route

Routes.select(localStorage.getItem('selected-route') || INDEX.routes[0].route_id.toLowerCase());

// update patterns

function updatePatterns(route, direction) {
  // unbind all events
  Patterns.off('change');

  // empty the select
  Patterns.empty();

  for (var i in route.patterns) {
    var pattern = route.patterns[i];
    if (pattern.direction_id === direction) {
      Patterns.add(pattern.pattern_name, pattern.pattern_id);
      Patterns.select(pattern.pattern_name.toLowerCase());
    }
  }

  Patterns.on('change', function() {
    transitive.render();
  });
}

// get a route

function getRoute(id) {
  for (var i in INDEX_FULL.routes) {
    var route = INDEX_FULL.routes[i];
    if (route.route_id.toLowerCase() === id) {
      return route;
    }
  }
}

// get the stops for a route

function getStopIds(route) {
  var stop_ids = new Set();
  for (var i in route.patterns) {
    var pattern = route.patterns[i];
    for (var j in pattern.stops) {
      stop_ids.add(pattern.stops[j].stop_id);
    }
  }

  return stop_ids;
}
