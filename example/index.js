
// dependencies

var d3 = require('d3');
var select = require('select');
var Transitive = require('transitive');

// create transitive

var transitive = new Transitive(document.getElementById('canvas'), DEFAULT_DATA);

// create and handle route/pattern selection

var $canvas = document.getElementById('canvas');
var $form = document.getElementById('form');

var Routes = select().label('Routes');
var Patterns = select().multiple().label('Patterns');

document.getElementById('select-route').appendChild(Routes.el);
document.getElementById('select-pattern').appendChild(Patterns.el);

Routes.on('select', function (option) {
  Patterns.empty();
  var route = getRoute(INDEX.routes, option.value);
  for (var i in route.patterns) {
    var pattern = route.patterns[i];
    Patterns.add(pattern.pattern_name, pattern.pattern_id);
    Patterns.select(pattern.pattern_name.toLowerCase());
  }

  // load the route data & render
  transitive.load(route).render();
});

for (var i in INDEX.routes) {
  var route = INDEX.routes[i];
  Routes.add(route.route_short_name || route.route_id, route.route_id);
}

function getRoute(routes, id) {
  for (var i in routes) {
    var route = routes[i];
    if (route.route_id.toLowerCase() === id) {
      return route;
    }
  }
}

