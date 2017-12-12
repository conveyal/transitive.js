/**
 * General Transitive utilities library
 */

import d3 from 'd3'
import SphericalMercator from 'sphericalmercator'

var tolerance = 0.000001

function fuzzyEquals (a, b, tol) {
  tol = tol || tolerance
  return Math.abs(a - b) < tol
}

function distance (x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
}

function getRadiusFromAngleChord (angleR, chordLen) {
  return (chordLen / 2) / Math.sin(angleR / 2)
}

/*
 * CCW utility function. Accepts 3 coord pairs; result is positive if points
 * have counterclockwise orientation, negative if clockwise, 0 if collinear.
 */

function ccw (ax, ay, bx, by, cx, cy) {
  var raw = ccwRaw(ax, ay, bx, by, cx, cy)
  return (raw === 0) ? 0 : raw / Math.abs(raw)
}

function ccwRaw (ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
}

/*
 * Compute angle formed by three points in cartesian plane using law of cosines
 */

function angleFromThreePoints (ax, ay, bx, by, cx, cy) {
  var c = distance(ax, ay, bx, by)
  var a = distance(bx, by, cx, cy)
  var b = distance(ax, ay, cx, cy)
  return Math.acos((a * a + c * c - b * b) / (2 * a * c))
}

function pointAlongArc (x1, y1, x2, y2, r, theta, ccw, t) {
  ccw = Math.abs(ccw) / ccw // convert to 1 or -1

  var rot = Math.PI / 2 - Math.abs(theta) / 2
  var vectToCenter = normalizeVector(rotateVector({
    x: x2 - x1,
    y: y2 - y1
  }, ccw * rot))

  // calculate the center of the arc circle
  var cx = x1 + r * vectToCenter.x
  var cy = y1 + r * vectToCenter.y

  var vectFromCenter = negateVector(vectToCenter)
  rot = Math.abs(theta) * t * ccw
  vectFromCenter = normalizeVector(rotateVector(
    vectFromCenter, rot))

  return {
    x: cx + r * vectFromCenter.x,
    y: cy + r * vectFromCenter.y
  }
}

function getVectorAngle (x, y) {
  var t = Math.atan(y / x)

  if (x < 0 && t <= 0) t += Math.PI
  else if (x < 0 && t >= 0) t -= Math.PI

  return t
}

function rayIntersection (ax, ay, avx, avy, bx, by, bvx, bvy) {
  var u = ((by - ay) * bvx - (bx - ax) * bvy) / (bvx * avy - bvy * avx)
  var v = ((by - ay) * avx - (bx - ax) * avy) / (bvx * avy - bvy * avx)

  return {
    u: u,
    v: v,
    intersect: (u > -tolerance && v > -tolerance)
  }
}

function lineIntersection (x1, y1, x2, y2, x3, y3, x4, y4) {
  var d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

  if (d === 0) { // lines are parallel
    return {
      intersect: false
    }
  }

  return {
    x: ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d,
    y: ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d,
    intersect: true
  }
}

/**
 * Parse a pixel-based style descriptor, returning an number.
 *
 * @param {String/Number}
 */

function parsePixelStyle (descriptor) {
  if (typeof descriptor === 'number') return descriptor
  return parseFloat(descriptor.substring(0, descriptor.length - 2), 10)
}

function isOutwardVector (vector) {
  if (!fuzzyEquals(vector.x, 0)) return (vector.x > 0)
  return (vector.y > 0)
}

function getTextBBox (text, attrs) {
  var container = d3.select('body').append('svg')
  container.append('text')
    .attr('x', -1000)
    .attr('y', -1000)
    .text(text)
  for (const key in attrs) container.attr(key, attrs[key])

  var bbox = container.node().getBBox()
  container.remove()

  return {
    height: bbox.height,
    width: bbox.width
  }
}

/**
 * vector utilities
 */

function normalizeVector (v) {
  var d = Math.sqrt(v.x * v.x + v.y * v.y)
  return {
    x: v.x / d,
    y: v.y / d
  }
}

function rotateVector (v, theta) {
  return {
    x: v.x * Math.cos(theta) - v.y * Math.sin(theta),
    y: v.x * Math.sin(theta) + v.y * Math.cos(theta)
  }
}

function negateVector (v) {
  return {
    x: -v.x,
    y: -v.y
  }
}

function addVectors (v1, v2) {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y
  }
}

/**
 * GTFS utilities
 */

function otpModeToGtfsType (otpMode) {
  switch (otpMode) {
    case 'TRAM':
      return 0
    case 'SUBWAY':
      return 1
    case 'RAIL':
      return 2
    case 'BUS':
      return 3
    case 'FERRY':
      return 4
    case 'CABLE_CAR':
      return 5
    case 'GONDOLA':
      return 6
    case 'FUNICULAR':
      return 7
  }
}

const sm = new SphericalMercator()

export {
  fuzzyEquals,
  distance,
  getRadiusFromAngleChord,
  ccw,
  ccwRaw,
  angleFromThreePoints,
  pointAlongArc,
  getVectorAngle,
  rayIntersection,
  lineIntersection,
  parsePixelStyle,
  isOutwardVector,
  getTextBBox,
  normalizeVector,
  rotateVector,
  negateVector,
  addVectors,
  otpModeToGtfsType,
  sm
}
