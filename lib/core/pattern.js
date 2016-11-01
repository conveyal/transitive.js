var each = require('component-each')

var NetworkPath = require('./path')
var PathSegment = require('./pathsegment')

var Polyline = require('../util/polyline.js')
var SphericalMercator = require('../util/spherical-mercator')
var sm = new SphericalMercator()

/**
 * Expose `RoutePattern`
 */

module.exports = RoutePattern

/**
 * A RoutePattern
 *
 * @param {Object} RoutePattern data object from the transitive.js input
 */

function RoutePattern (data, transitive) {
  for (var key in data) {
    if (key === 'stops') continue
    this[key] = data[key]
  }

  // the array of Stops that make up this pattern
  this.stops = []

  // the inter-stop geometry, an array of point sequences (themselves arrays)
  // that represent the geometry beween stops i and i+1. This array should be
  // exactly one item shorter than the stops array.
  this.interStopGeometry = []

  if (transitive) {
    each(data.stops, function (stop) {
      // look up the Stop in the master collection and add to the stops array
      this.stops.push(transitive.stops[stop.stop_id])

      // if inter-stop geometry is provided: decode polyline, convert points
      // to SphericalMercator, and add to the interStopGeometry array
      if (stop.geometry) {
        var latLons = Polyline.decode(stop.geometry)
        var coords = []
        each(latLons, function (latLon) {
          coords.push(sm.forward([latLon[1], latLon[0]]))
        })
        this.interStopGeometry.push(coords)
      }
    }, this)
  }

  this.renderedEdges = []
}

RoutePattern.prototype.getId = function () {
  return this.pattern_id
}

RoutePattern.prototype.getElementId = function () {
  return 'pattern-' + this.pattern_id
}

RoutePattern.prototype.getName = function () {
  return this.pattern_name
}

RoutePattern.prototype.addRenderedEdge = function (rEdge) {
  if (this.renderedEdges.indexOf(rEdge) === -1) this.renderedEdges.push(rEdge)
}

RoutePattern.prototype.offsetAlignment = function (alignmentId, offset) {
  each(this.renderedEdges, function (rEdge) {
    rEdge.offsetAlignment(alignmentId, offset)
  })
}

RoutePattern.prototype.createPath = function () {
  var path = new NetworkPath(this)
  var pathSegment = new PathSegment('TRANSIT', path)
  pathSegment.addPattern(this, 0, this.stops.length - 1)
  path.addSegment(pathSegment)
  return path
}
