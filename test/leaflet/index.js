var Transitive = require('transitive');
var Profiler = require('otpprofiler.js');

/**
 * O/D Points
 */

var od = {
  from: {
    name: 'Start',
    lat: 38.894624,
    lon: -77.074159
  },
  to: {
    name: 'End',
    lat: 38.89788,
    lon: -77.00597
  }
};

/**
 * Profiler
 */

var profiler = new Profiler({
  host: 'http://localhost:8080/otp-rest-servlet',
  limit: 3 // limit the number of options to profile, defaults to 3
});

/**
 * Leaflet
 */

var map = L.map('map')
  .setView(od.from, 13);

// Add Tile Layer
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
 .addTo(map);

/**
 * Create Transitive Instance
 */

var transitive = new Transitive({
  drawGrid: true,
  el: map.getPanes().overlayPane,
  gridCellSize: 600,
  styles: STYLES
});

/**
 * Apply computed behaviors on render
 */

transitive.on('render', function(transitive) {
  each(COMPUTED, function(behavior) {
    behavior(transitive);
  });
});

/**
 * Profile
 */

profiler.journey(od, processJourney);

/**
 * Process journey results
 */

function processJourney(err, data) {
  transitive
    .load(data)
    .render();
}
