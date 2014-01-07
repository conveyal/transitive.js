/**
 * Dependencies
 */

var Index = require('./wmata');
var each = require('each');
var select = require('select');
var Sett = require('set');
var Transitive = require('transitive');

//

var DIRECTION = '0';
var ROUTE = null;
var STOPS = new Sett();

// handle selects
var Routes = select()
  .label('Routes');
var Patterns = select()
  .multiple()
  .label('Patterns');

document.getElementById('select-route')
  .appendChild(Routes.el);
document.getElementById('select-pattern')
  .appendChild(Patterns.el);

// transitive instance
var transitive = new Transitive(document.getElementById('canvas'), Index);

// Set up filters
transitive
  .filter('stops', function(stop) {
    return STOPS.has(stop.stop_id);
  })
  .filter('routes', function(route) {
    return ROUTE.route_id === route.route_id;
  })
  .filter('patterns', function(pattern) {
    return Patterns.values()
      .indexOf(pattern.pattern_id) !== -1;
  });

// Direction check box
var $reverse = document.getElementById('reverse-direction');

// on direction change
$reverse.addEventListener('change', function(event) {
  DIRECTION = event.target.checked ? '1' : '0';

  // only show appropriate patterns
  updatePatterns(transitive, Patterns, ROUTE, DIRECTION);
  transitive.render();
});

// On route selection change
Routes.on('select', function(option) {
  localStorage.setItem('selected-route', option.name);

  ROUTE = getRoute(option.name, Index.routes);
  STOPS = getStopIds(ROUTE);

  // only show appropriate patterns
  updatePatterns(transitive, Patterns, ROUTE, DIRECTION);
  transitive.render();
});

// add routes
for (var i in Index.routes) {
  var route = Index.routes[i];
  Routes.add(route.route_id);
}

// Select the first route
Routes.select(localStorage.getItem('selected-route') || Index.routes[0].route_id
  .toLowerCase());

$('form').on('submit', function (event) {
  event.preventDefault();
  var color = $('input[name="pattern-stroke"]').val();
  var width = $('input[name="pattern-stroke-width"]').val();
  transitive.style.load({
    'patterns': {
      'stroke-width': function (display) {
        return width;
      },
      'stroke': function (display) {
        return color;
      }
    }
  });
  transitive.render();
});

/**
 * Update patterns
 */

function updatePatterns(transitive, patterns, route, direction) {
  // unbind all events
  patterns.off('change');
  patterns.empty();

  for (var i in route.patterns) {
    var pattern = route.patterns[i];
    if (pattern.direction_id === direction) {
      patterns.add(pattern.pattern_name + ' ' + pattern.pattern_id, pattern.pattern_id);
      patterns.select(pattern.pattern_name.toLowerCase() + ' ' + pattern.pattern_id);
    }
  }

  patterns.on('change', function() {
    transitive.render();
  });
}

// get a route

function getRoute(id, routes) {
  for (var i in routes) {
    var route = routes[i];
    if (route.route_id.toLowerCase() === id) {
      return route;
    }
  }
}

// get the stops for a route

function getStopIds(route) {
  var stop_ids = new Sett();
  for (var i in route.patterns) {
    var pattern = route.patterns[i];
    for (var j in pattern.stops) {
      stop_ids.add(pattern.stops[j].stop_id);
    }
  }

  return stop_ids;
}
