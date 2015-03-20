var PathSegment = require('./pathsegment');
var NetworkPath = require('./path');
var TurnPoint = require('../point/turn');
var Polyline = require('../util/polyline.js');
var SphericalMercator = require('../util/spherical-mercator');
var sm = new SphericalMercator();

var each = require('each');
/**
 * Expose `Journey`
 */

module.exports = Journey;

/**
 *
 */

function Journey(data, network) {

  this.network = network;

  for (var key in data) {
    this[key] = data[key];
  }

  this.path = new NetworkPath(this);

  each(this.segments, function(segmentInfo) {
    var pathSegment = new PathSegment(segmentInfo.type, this.path);
    pathSegment.journeySegment = segmentInfo;

    // decode and store the leg geometry, if provided
    if (segmentInfo.geometry) {
      var latLons = Polyline.decode(segmentInfo.geometry.points);
      var coords = [];
      each(latLons, function(latLon) {
        coords.push(sm.forward([latLon[1], latLon[0]]));
      });
      pathSegment.geomCoords = coords;
    }

    if (segmentInfo.type === 'TRANSIT') {
      if (segmentInfo.patterns) {
        each(segmentInfo.patterns, function(patternInfo) {
          pathSegment.addPattern(network.patterns[patternInfo.pattern_id],
            patternInfo.from_stop_index, patternInfo.to_stop_index);
        });
      } else if (segmentInfo.pattern_id) { // legacy support for single-pattern journey segments
        pathSegment.addPattern(network.patterns[segmentInfo.pattern_id],
          segmentInfo.from_stop_index, segmentInfo.to_stop_index);
      }
    } else {
      // screen out degenerate transfer segments
      if (segmentInfo.from.type === 'STOP' && segmentInfo.to.type === 'STOP' &&
        segmentInfo.from.stop_id === segmentInfo.to.stop_id) return;

      pathSegment.points.push(getEndPoint(segmentInfo.from, network));
      if(segmentInfo.streetEdges && segmentInfo.streetEdges.length > 0) {
        each(segmentInfo.streetEdges.slice(0, segmentInfo.streetEdges.length-1), function(streetEdgeId) {
          var streetEdge = network.streetEdges[streetEdgeId];
          var lastIndex = streetEdge.length-1;

          // screen out degenerate edges
          if(streetEdge.latLons[0][0] === streetEdge.latLons[lastIndex][0] &&
             streetEdge.latLons[0][1] === streetEdge.latLons[lastIndex][1]) {
            return;
          }

          pathSegment.points.push(getTurnPoint({
            lat: streetEdge.latLons[streetEdge.length-1][0],
            lon: streetEdge.latLons[streetEdge.length-1][1],
            worldX: streetEdge.worldCoords[streetEdge.length-1][0],
            worldY: streetEdge.worldCoords[streetEdge.length-1][1]
          }, network));
        });
      }
      else { // legacy support
        each(segmentInfo.turnPoints, function(turnPointInfo) {
          pathSegment.points.push(getTurnPoint(turnPointInfo, network));
        }, this);
      }
      pathSegment.points.push(getEndPoint(segmentInfo.to, network));
    }
    this.path.addSegment(pathSegment);
  }, this);
}

function getEndPoint(pointInfo, network) {
  if (pointInfo.type === 'PLACE') {
    return network.places[pointInfo.place_id];
  } else if (pointInfo.type === 'STOP') {
    return network.stops[pointInfo.stop_id];
  }
}

Journey.prototype.getElementId = function() {
  return 'journey-' + this.journey_id;
};

/* utility function for creating non-duplicative TurnPoints */

function getTurnPoint(turnPointInfo, network) {
  var key = turnPointInfo.lat + '_' + turnPointInfo.lon;
  if (key in network.turnPoints) return network.turnPoints[key];
  var turnPoint = new TurnPoint(turnPointInfo);
  network.turnPoints[key] = turnPoint;
  return turnPoint;
}
