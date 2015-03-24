/**
 * Dependencies
 */

var d3 = require('d3');

var Transitive = require('transitive');
var OtpProfiler = require('otp-profiler');

var transitive = new Transitive({
  el: document.getElementById('canvas'),
  legendEl: document.getElementById('legend'),
  data: DATA,
  styles: STYLES,
  drawGrid: false,
  gridCellSize: 300,
  initialBounds: [
    [-77.093507, 38.858710],
    [-76.947266, 38.921104]
  ],
  displayMargins: {
    right: 400,
    bottom: 50
  },
  draggableTypes: ['PLACE']
});

// listen for place drag events
transitive.on('place.from.dragend', function(place) {
  console.log('dragged "from" place to: ' + place.getLat() + ',' + place.getLon());
});
transitive.on('place.to.dragend', function(place) {
  console.log('dragged "to" place to: ' + place.getLat() + ',' + place.getLon());
});

transitive.render();

// set up the journey option list
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


// set up the renderer toggle links (default vs. wireframe)
function setRenderer(renderer) {
  transitive.setRenderer(renderer);
  transitive.render();
}

document.getElementById('default-renderer').onclick = function(event) {
  setRenderer('default')
};

document.getElementById('wireframe-renderer').onclick = function(event) {
  setRenderer('wireframe')
};