var Transitive = require('transitive');

// initialize the transitive display

var transitive = new Transitive(document.getElementById('canvas'));

var endpoint = 'http://arlington.dev.conveyal.com/otp/otp-rest-servlet/';

transitive.loadProfile(PROFILE, endpoint, function(data) {
  console.log('loaded profiler data');
  transitive.render();
}, 5);
