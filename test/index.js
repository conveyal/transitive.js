/**
 * Dependencies
 */

var d3 = require('d3');

var Transitive = require('transitive');
var OtpProfiler = require('otpprofiler.js');

var transitive = new Transitive({
  el: document.getElementById('canvas'),
  legendEl: document.getElementById('legend'),
  data: DATA,
  styles: STYLES,
  gridCellSize: 300,
  useDynamicRendering: true,
  drawGrid: false,
  mapboxId: 'conveyal.ie3o67m0'
});

// apply computed behaviors
transitive.on('render', function(transitive) {
  each(COMPUTED, function(behavior) {
    behavior(transitive);
  });
});

transitive.render();

// set the journey option list
DATA.journeys.forEach(function(journey, index) {
  var div = document.createElement("div");
  div.id = journey.journey_id;
  div.className = 'listItem';
  div.innerHTML = journey.journey_name;

  div.onmouseover = function(event) {
    transitive.focusJourney(event.target.id);
  };
  div.onmouseout = function(event) {
    transitive.focusJourney();

  };
  document.getElementById('list').appendChild(div);
});
