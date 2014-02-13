
/**
 * Dependencies
 */

var d3 = require('d3');

var Transitive = require('transitive');
var OtpProfiler = require('otpprofilerjs');

// initialize the transitive display

//var endpoint = 'http://arlington.dev.conveyal.com/otp/otp-rest-servlet/';
var endpoint = 'http://localhost:8001/otp-rest-servlet/';

var config = {
  maxOptions: 3,
  fromLocation: {
    name: 'from',
    lat: 38.890519, // 38.895,
    lon: -77.086252 //-77.09
  },
  toLocation: {
    name: 'to',
    lat: 38.896813, // 38.894,
    lon: -77.006262 //-77.01
  }
};


var init = function(profileResponse) {

  var TransitiveLoader = new OtpProfiler.transitive.TransitiveLoader(profileResponse, endpoint, function(transitiveData) { 

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
        d3.selectAll('.transitive-path-highlight').style('visibility', 'hidden');
        d3.select('#transitive-path-highlight-journey-' + event.target.id).style('visibility', 'visible');
        d3.selectAll('.transitive-transfer-stops-journey-' + event.target.id).style('visibility', 'visible');
      };
      div.onmouseout=function(event) {
        d3.selectAll('.transitive-path-highlight').style('visibility', 'hidden');
        d3.selectAll('.transitive-transfer-stops-journey-' + event.target.id).style('visibility', 'hidden');
      };      
      document.getElementById('list').appendChild(div);
    });

  }, config);

};



/** dynamically loaded data example **/
/*
var profileRequest = new OtpProfiler.models.OtpProfileRequest({
  from : config.fromLocation.lat+','+config.fromLocation.lon,
  to : config.toLocation.lat+','+config.toLocation.lon
});
profileRequest.urlRoot = endpoint + 'profile';
profileRequest.on('success', init);
profileRequest.request();
*/


/** hard-coded data example **/

init(new OtpProfiler.models.OtpProfileResponse(PROFILE));


// slider