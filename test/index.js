
/**
 * Dependencies
 */

var d3 = require('d3');

var Transitive = require('transitive');
var OtpProfiler = require('otpprofiler.js');

var init = function(profiler, od) {
  profiler.journey(od, function(err, transitiveData) {

    console.log("generated transitive data:");
    console.log(transitiveData);

    var transitive = new Transitive({
      data: transitiveData,
      drawGrid: true,
      el: document.getElementById('canvas'),
      gridCellSize: 600,
      styles: STYLES
    });

    // apply computed behaviors
    transitive.on('render', function (transitive) {
      each(COMPUTED, function (behavior) {
        behavior(transitive);
      });
    });

    transitive.render();

    // set the journey option list
    transitiveData.journeys.forEach(function(journey, index) {
      var div = document.createElement("div");
      div.id = journey.journey_id;
      div.className = 'listItem';
      div.innerHTML = journey.journey_name;

      div.onmouseover=function(event) {
        transitive.focusJourney(event.target.id);
      };
      div.onmouseout=function(event) {
        transitive.focusJourney();
      };
      document.getElementById('list').appendChild(div);
    });

  });
};

// Create new instance
var profiler = new OtpProfiler({
  host: 'http://localhost:8001/otp-rest-servlet',
  limit: 3 // limit the number of options to profile, defaults to 3
});

// O/D points
var od = {
  from: {
    name: '',
    lat: 38.894624,
    lon: -77.074159
  },
  to: {
    name: '',
    lat: 38.89788,
    lon: -77.00597
  }
};

/** dynamically loaded data example **/
init(profiler, od);

