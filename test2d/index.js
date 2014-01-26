var Transitive = require('transitive');
var OtpProfile = require('otp-profiler-tools');

// initialize the transitive display

var endpoint = 'http://arlington.dev.conveyal.com/otp/otp-rest-servlet/';

var config = {
  maxOptions: 1,
  fromLocation: {
    name: 'from',
    lat: 38.895,
    lon: -77.09
  },
  toLocation: {
    name: 'to',
    lat: 38.894,
    lon: -77.01
  }
};


var profile = new OtpProfile(PROFILE, endpoint, (function(data) {

  //console.log('loaded profiler data');
  //console.log(data);

  var transitive = new Transitive(document.getElementById('canvas'), data);

  // apply computed behaviors
  transitive.on('render', function (transitive) {
    each(COMPUTED, function (behavior) {
      behavior(transitive);
    });
  });

  transitive.render();

}).bind(this), config);

