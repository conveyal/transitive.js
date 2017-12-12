import { forEach } from 'lodash'

import PathSegment from './pathsegment'
import NetworkPath from './path'
import TurnPoint from '../point/turn'

/**
 * Journey
 */
export default class Journey {
  constructor (data, network) {
    this.network = network

    for (var key in data) {
      this[key] = data[key]
    }

    this.path = new NetworkPath(this)

    forEach(this.segments, (segmentInfo) => {
      var pathSegment = new PathSegment(segmentInfo.type, this.path)
      pathSegment.journeySegment = segmentInfo

      if (segmentInfo.type === 'TRANSIT') {
        if (segmentInfo.patterns) {
          forEach(segmentInfo.patterns, (patternInfo) => {
            pathSegment.addPattern(network.patterns[patternInfo.pattern_id],
              patternInfo.from_stop_index, patternInfo.to_stop_index)
          })
        } else if (segmentInfo.pattern_id) { // legacy support for single-pattern journey segments
          pathSegment.addPattern(network.patterns[segmentInfo.pattern_id],
            segmentInfo.from_stop_index, segmentInfo.to_stop_index)
        }
      } else { // non-transit segment
        var streetEdges = []
        // screen out degenerate transfer segments
        if (segmentInfo.from.type === 'STOP' && segmentInfo.to.type === 'STOP' &&
          segmentInfo.from.stop_id === segmentInfo.to.stop_id) return

        pathSegment.points.push(getEndPoint(segmentInfo.from, network))
        if (segmentInfo.streetEdges && segmentInfo.streetEdges.length > 0) {
          var lastTurnPoint = null

          for (var i = 0; i < segmentInfo.streetEdges.length; i++) {
            var streetEdgeId = segmentInfo.streetEdges[i]
            var streetEdge = network.streetEdges[streetEdgeId]
            streetEdge.id = streetEdgeId
            streetEdges.push(streetEdge)
            if (i >= segmentInfo.streetEdges.length - 1) continue

            if (lastTurnPoint) streetEdge.fromTurnPoint = lastTurnPoint
            var lastIndex = streetEdge.length - 1

            // screen out degenerate edges
            if (streetEdge.latLons[0][0] === streetEdge.latLons[lastIndex][0] &&
              streetEdge.latLons[0][1] === streetEdge.latLons[lastIndex][1]) {
              continue
            }

            // create a TurnPoint for the 'from' point of this edge
            var turnPoint = getTurnPoint({
              lat: streetEdge.latLons[lastIndex][0],
              lon: streetEdge.latLons[lastIndex][1],
              worldX: streetEdge.worldCoords[lastIndex][0],
              worldY: streetEdge.worldCoords[lastIndex][1]
            }, network)

            // compute the angle represented by this turn point
            /* turnPoint.turnAngle = Util.angleFromThreePoints(
              streetEdge.worldCoords[0][0],
              streetEdge.worldCoords[0][1],
              streetEdge.worldCoords[lastIndex][0],
              streetEdge.worldCoords[lastIndex][1],
              nextEdge.worldCoords[nextEdge.length-1][0],
              nextEdge.worldCoords[nextEdge.length-1][1]
            ); */

            pathSegment.points.push(turnPoint)
            lastTurnPoint = streetEdge.toTurnPoint = turnPoint
          }
          pathSegment.streetEdges = streetEdges
        }
        pathSegment.points.push(getEndPoint(segmentInfo.to, network))
      }
      this.path.addSegment(pathSegment)
    })
  }

  getElementId () {
    return 'journey-' + this.journey_id
  }
}

function getEndPoint (pointInfo, network) {
  if (pointInfo.type === 'PLACE') {
    return network.places[pointInfo.place_id]
  } else if (pointInfo.type === 'STOP') {
    return network.stops[pointInfo.stop_id]
  }
}

/* utility function for creating non-duplicative TurnPoints */

function getTurnPoint (turnPointInfo, network) {
  var key = turnPointInfo.lat + '_' + turnPointInfo.lon
  if (key in network.turnPoints) return network.turnPoints[key]
  var turnPoint = new TurnPoint(turnPointInfo, key)
  network.turnPoints[key] = turnPoint
  // network.addVertexPoint(turnPoint);
  return turnPoint
}
