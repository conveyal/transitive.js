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

  each(this.segments, function(segmentInfo) {

    var pathSegment = new PathSegment(segmentInfo.type, this.path);
    pathSegment.journeySegment = segmentInfo;


    if (segmentInfo.type === 'TRANSIT') {
      if(segmentInfo.patterns) {
        each(segmentInfo.patterns, function(patternInfo) {
          pathSegment.addPattern(transitive.patterns[patternInfo.pattern_id],
            patternInfo.from_stop_index, patternInfo.to_stop_index);
        });
      }
      else if(segmentInfo.pattern_id) { // legacy support for single-pattern journey segments
        pathSegment.addPattern(transitive.patterns[segmentInfo.pattern_id],
          segmentInfo.from_stop_index, segmentInfo.to_stop_index);
      }
    } else {
      // screen out degenerate transfer segments
      if(segmentInfo.from.type === 'STOP' && segmentInfo.to.type === 'STOP'
        && segmentInfo.from.stop_id === segmentInfo.to.stop_id) return;

      pathSegment.points.push(getEndPoint(segmentInfo.from, transitive));
      each(segmentInfo.turnPoints, function(turnPointInfo) {
        pathSegment.points.push(getTurnPoint(turnPointInfo, transitive));
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


/* utility function for creating non-duplicative TurnPoints */

function getTurnPoint(turnPointInfo, transitive) {
  var key = turnPointInfo.lat + '_' + turnPointInfo.lon;
  if(key in transitive.turnPoints) return transitive.turnPoints[key];
  var turnPoint = new TurnPoint(turnPointInfo);
  transitive.turnPoints[key] = turnPoint;
  return turnPoint;
}