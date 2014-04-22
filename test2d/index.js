
/**
 * Dependencies
 */

var d3 = require('d3');

var Transitive = require('transitive');
var OtpProfiler = require('otpprofiler.js');


var init = function(profiler, od) {

  var loader = new Transitive.ProfilerLoader(profiler, od, function(transitiveData) { 

    console.log("generated transitive data:");
    console.log(transitiveData);

    var transitive = new Transitive(document.getElementById('canvas'), transitiveData, STYLES, {
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
    transitiveData.journeys.forEach(function(journey, index) {
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
    name: 'Start: ATP Office',
    lat: 38.894624, // 38.890519,
    lon: -77.074159 //-77.086252
  },
  to: {
    name: 'End: Union Station',
    lat: 38.89788,
    lon: -77.00597
  }
};


/** dynamically loaded data example **/
init(profiler, od);


/** hard-coded data example **/

//init(new OtpProfiler.models.OtpProfileResponse(P2));
