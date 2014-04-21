
/**
 * Dependencies
 */

var d3 = require('d3');

var Transitive = require('transitive');
var OtpProfiler = require('otpprofiler.js');

// initialize the transitive display

var transitive = new Transitive(document.getElementById('canvas'), DATA, STYLES, {
  gridCellSize : 800,
  drawGrid: true 
});

// apply computed behaviors
transitive.on('render', function (transitive) {
  each(COMPUTED, function (behavior) {
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

  div.onmouseover=function(event) {
    //d3.selectAll('.transitive-path-highlight').style('visibility', 'hidden');
    //d3.select('#transitive-path-highlight-journey-' + event.target.id).style('visibility', 'visible');
    //d3.selectAll('.transitive-transfer-stops-journey-' + event.target.id).style('visibility', 'visible');
    transitive.focusJourney(event.target.id);
  };
  div.onmouseout=function(event) {
    //d3.selectAll('.transitive-path-highlight').style('visibility', 'hidden');
    //d3.selectAll('.transitive-transfer-stops-journey-' + event.target.id).style('visibility', 'hidden');
    transitive.focusJourney();

  };      
  document.getElementById('list').appendChild(div);
});

