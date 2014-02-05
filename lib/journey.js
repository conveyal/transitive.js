var NetworkPath = require('./path');

/**
 * Expose `Journey`
 */

module.exports = Journey;

/**
 * 
 */

function Journey(data, transitive) {

  this.transitive = transitive;

  for(var key in data) {
    //if(key === 'segments') continue;
    this[key] = data[key];
  }
  
  this.path = new NetworkPath(this);

  for(var i = 0; i < this.segments.length; i++) {
    var segmentInfo = this.segments[i];

    var pathSegment = {
      type: segmentInfo.type,
      points: [],
      journeySegment: segmentInfo
    };

    if(segmentInfo.type === 'TRANSIT') {
      var pattern = transitive.patterns[segmentInfo.pattern_id];
      for(var s = segmentInfo.from_stop_index; s <= segmentInfo.to_stop_index; s++) {
        pathSegment.points.push(pattern.stops[s]);
      }
      pathSegment.pattern = pattern;
    }
    else if(segmentInfo.type === 'WALK') {
      if(segmentInfo.from.type === 'PLACE') pathSegment.points.push(transitive.places[segmentInfo.from.place_id]);
      else if(segmentInfo.from.type === 'STOP') pathSegment.points.push(transitive.stops[segmentInfo.from.stop_id]);

      if(segmentInfo.to.type === 'PLACE') pathSegment.points.push(transitive.places[segmentInfo.to.place_id]);
      else if(segmentInfo.to.type === 'STOP') pathSegment.points.push(transitive.stops[segmentInfo.to.stop_id]);
    }

    this.path.segments.push(pathSegment);

  }

}

Journey.prototype.getElementId = function() {
  return 'journey-' + this.journey_id;
};

/*Journey.prototype.addPattern = function(pattern) {
  this.patterns.push(pattern);
  pattern.journey = this;
};*/
