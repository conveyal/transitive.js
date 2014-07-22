var PathSegment = require('./pathsegment');
var NetworkPath = require('./path');
var TurnPoint = require('./point/turn');

var each = require('each');
/**
 * Expose `Journey`
 */

module.exports = Journey;

/**
 *
 */

function Journey(data, transitive) {

  this.transitive = transitive;

  for (var key in data) {
    this[key] = data[key];
  }

  this.path = new NetworkPath(this);

  //for (var i = 0; i < this.segments.length; i++) {
  //  var segmentInfo = this.segments[i];
  each(this.segments, function(segmentInfo) {

    var pathSegment = new PathSegment(segmentInfo.type);
    pathSegment.journeySegment = segmentInfo;

    if (segmentInfo.type === 'TRANSIT') {
      var pattern = transitive.patterns[segmentInfo.pattern_id];
      for (var s = segmentInfo.from_stop_index; s <= segmentInfo.to_stop_index; s++) {
        pathSegment.points.push(pattern.stops[s]);
      }
      pathSegment.pattern = pattern;
    } else if (segmentInfo.type === 'WALK' || segmentInfo.type === 'BICYCLE') {
      pathSegment.points.push(getEndPoint(segmentInfo.from, transitive));
      each(segmentInfo.turnPoints, function(turnPointInfo) {
        var tp = new TurnPoint(turnPointInfo);
        pathSegment.points.push(tp);
      }, this);
      pathSegment.points.push(getEndPoint(segmentInfo.to, transitive));
    }

    this.path.addSegment(pathSegment);
  }, this);
}

function getEndPoint(pointInfo, transitive) {
  if (pointInfo.type === 'PLACE') {
    return transitive.places[pointInfo.place_id];
  } else if (pointInfo.type === 'STOP') {
    return transitive.stops[pointInfo.stop_id];
  }
}

Journey.prototype.getElementId = function() {
  return 'journey-' + this.journey_id;
};
