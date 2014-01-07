
/**
 * Dependencies
 */

var jsonp = require('jsonp');

var OtpJourneyOption = require('./option');

/**
 * Expose `OtpProfile`
 */

module.exports = OtpProfile;

/**
 *  
 */

function OtpProfile(data, endpoint, callback) {

  this.callback = callback;
  this.endpoint = endpoint;

  this.options = [];
  this.patterns = {};
  this.stops = {};

  // construct the list of patterns to load
  data.options.forEach(function(optionData) {
    var option = new OtpJourneyOption(optionData);
    this.options.push(option);

    option.patterns.forEach(function(patternId) {
      this.patterns[patternId] = null;
    }, this);
  }, this);

  // load all the patterns
  this.patternsLoaded = 0;
  for(var patternId in this.patterns) {
    this.loadPattern(patternId);
  }
}


OtpProfile.prototype.loadPattern = function(patternId) {

  jsonp(this.endpoint + 'index/patterns/'+patternId, {},
    (function(err, data) {
      this.patterns[patternId] = data;
      this.patternsLoaded++;

      if(this.patternsLoaded === Object.keys(this.patterns).length) {
        this.allPatternsLoaded();
      }
    }).bind(this));
};


OtpProfile.prototype.allPatternsLoaded = function() {

  // initialize the stop key/value store
  for(var patternId in this.patterns) {
    var pattern = this.patterns[patternId];
    for(var i = 0; i < pattern.stops.length; i++) {
      var stop = pattern.stops[i];
      if(this.stops.hasOwnProperty(stop.id)) continue;
      this.stops[stop.id] = stop;
    }
  }

  this.callback.call(this, this.getTransitiveData());
};


OtpProfile.prototype.getTransitiveData = function() {

  var data = {};
  data.stops = [];
  for(var stopId in this.stops) {
    var stop = this.stops[stopId];
    data.stops.push({
      stop_id: stopId,
      stop_name: stop.name,
      stop_lat: stop.lat,
      stop_lon: stop.lon
    });
  }

  data.journeys = [];

  for(var i = 0; i < this.options.length; i++) {
    var option = this.options[i];
    var journey = option.getJourneyData();
    journey.pattern_id = 'option-' + i;
    data.journeys.push(journey);
  }

  return data;
};