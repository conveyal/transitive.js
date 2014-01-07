
/**
 * Dependencies
 */



/**
 * Expose `OtpJourneyOption`
 */

module.exports = OtpJourneyOption;

/**
 *
 */

function OtpJourneyOption(data) {

  for(var key in data) {
    this[key] = data[key];
  }

  this.patterns = [];
  this.segments.forEach(function(segment) {
    this.patterns.push(segment.patterns[0]);
  }, this);
}


OtpJourneyOption.prototype.getJourneyData = function() {
  var journey = {
    name : this.summary,
    stops : []
  };

  var stopIndex = 1;
  this.segments.forEach(function(segment) {
    journey.stops.push({
      stop_id: segment.from,
      stop_index: stopIndex++,
      transfer: true
    });
    journey.stops.push({
      stop_id: segment.to,
      stop_index: stopIndex++,
      transfer: true
    });
  }, this);

  return journey;
};