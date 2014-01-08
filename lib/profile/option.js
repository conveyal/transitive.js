
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

function OtpJourneyOption(data, profile) {

  this.profile = profile;

  for(var key in data) {
    this[key] = data[key];
  }

  this.patternIds = [];
  this.segments.forEach(function(segment) {
    this.patternIds.push(segment.segmentPatterns[0].patternId);
  }, this);
}


OtpJourneyOption.prototype.getJourneyData = function() {
  var journey = {
    name : this.summary,
    stops : []
  };

  var stopIndex = 1;
  this.segments.forEach(function(segment) {
    var patternInfo = segment.segmentPatterns[0];
    var pattern = this.profile.patterns[patternInfo.patternId];

    for(var i = patternInfo.fromIndex; i <= patternInfo.toIndex; i++) {
      journey.stops.push({
        stop_id: pattern.stops[i].id,
        stop_index: stopIndex++,
        transfer: (i === patternInfo.fromIndex || i === patternInfo.toIndex)
      });
    }
  }, this);

  return journey;
};