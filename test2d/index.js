var Transitive = require('transitive');

// initialize the transitive display

var transitive = new Transitive(document.getElementById('canvas'));

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


transitive.loadProfile(PROFILE, endpoint, function(data) {
  console.log('loaded profiler data');
  transitive.render();
}, config);
