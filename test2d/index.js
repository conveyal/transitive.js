var Transitive = require('transitive');
//var OtpProfile = require('otp-profiler-tools');

var OtpProfiler = require('otpprofilerjs');

// initialize the transitive display

//var endpoint = 'http://arlington.dev.conveyal.com/otp/otp-rest-servlet/';
var endpoint = 'http://localhost:8001/otp-rest-servlet/';

var config = {
  maxOptions: 4,
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

var profileRequest = new OtpProfiler.models.OtpProfileRequest({
  from : config.fromLocation.lat+','+config.fromLocation.lon,
  to : config.toLocation.lat+','+config.toLocation.lon
});
profileRequest.urlRoot = endpoint + 'profile';

profileRequest.on('success', function(profileResponse) {
  console.log("response:");
  console.log(profileResponse);

  //var profileResponse = new OtpProfiler.models.OtpProfileResponse(PROFILE);

  var TransitiveLoader = new OtpProfiler.transitive.TransitiveLoader(profileResponse, endpoint, function(transiveData) {
    console.log("generated transitive data:");
    console.log(transiveData);

    var transitive = new Transitive(document.getElementById('canvas'), transiveData, STYLES);

    // apply computed behaviors
    transitive.on('render', function (transitive) {
      each(COMPUTED, function (behavior) {
        behavior(transitive);
      });
    });

    transitive.render();
      
  }, config);


});

profileRequest.request()


/*
// hard-coded data example

var profileResponse = new OtpProfiler.models.OtpProfileResponse(PROFILE);

var TransitiveLoader = new OtpProfiler.transitive.TransitiveLoader(profileResponse, endpoint, function(transiveData) {
  console.log("generated transitive data:");
  console.log(transiveData);

  var transitive = new Transitive(document.getElementById('canvas'), transiveData, STYLES);

  // apply computed behaviors
  transitive.on('render', function (transitive) {
    each(COMPUTED, function (behavior) {
      behavior(transitive);
    });
  });

  transitive.render();
    
}, config);
*/

