
/**
 * Dependencies
 */

var jsonp = require('jsonp');

var OtpJourneyOption = require('./option');
var styles = require('./styles');
var computed = require('./computed');

/**
 * Expose `OtpProfile`
 */

module.exports = OtpProfile;

/**
 *  
 */

function OtpProfile(data, endpoint, callback, config) {

  console.log(data);

  this.callback = callback;
  this.endpoint = endpoint;
  this.config = config;

  this.options = [];
  this.patterns = {};
  this.stops = {};

  var i =0;
  // construct the list of patterns to load
  data.options.forEach(function(optionData) {
    if(config.maxOptions && i >= config.maxOptions) return;
    var option = new OtpJourneyOption(optionData, this);
    this.options.push(option);

    option.patternIds.forEach(function(patternId) {
      this.patterns[patternId] = null;
    }, this);
    i++;
  }, this);

  // load all the patterns
  this.patternsLoaded = 0;
  for(var patternId in this.patterns) {
    this.loadPattern(patternId);
  }

  this.styles = styles;
  this.computed = computed;
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

  if(this.config.fromLocation) {
    data.stops.push({
      stop_id: 'FROM',
      stop_name: this.config.fromLocation.name,
      stop_lat: this.config.fromLocation.lat,
      stop_lon: this.config.fromLocation.lon
    });
  }

  if(this.config.toLocation) {
    data.stops.push({
      stop_id: 'TO',
      stop_name: this.config.toLocation.name,
      stop_lat: this.config.toLocation.lat,
      stop_lon: this.config.toLocation.lon
    });
  }

  data.journeys = [];

  for(var i = 0; i < this.options.length; i++) {
    var option = this.options[i];
    var journey = option.getJourneyData();
    journey.journey_id = 'option-' + i;
    data.journeys.push(journey);
  }

  console.log('tdata:');
  console.log(data);

  return data;
};