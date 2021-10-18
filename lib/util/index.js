/**
 * General Transitive utilities library
 */

import SphericalMercator from 'sphericalmercator'

const TOLERANCE = 0.000001

function fuzzyEquals(a, b, tolerance = TOLERANCE) {
  return Math.abs(a - b) < tolerance
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
}

function getRadiusFromAngleChord(angleR, chordLen) {
  return chordLen / 2 / Math.sin(angleR / 2)
}

/*
 * CCW utility function. Accepts 3 coord pairs; result is positive if points
 * have counterclockwise orientation, negative if clockwise, 0 if collinear.
 */

function ccw(ax, ay, bx, by, cx, cy) {
  const raw = ccwRaw(ax, ay, bx, by, cx, cy)
  return raw === 0 ? 0 : raw / Math.abs(raw)
}

function ccwRaw(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
}

/*
 * Compute angle formed by three points in cartesian plane using law of cosines
 */

function angleFromThreePoints(ax, ay, bx, by, cx, cy) {
  const c = distance(ax, ay, bx, by)
  const a = distance(bx, by, cx, cy)
  const b = distance(ax, ay, cx, cy)
  return Math.acos((a * a + c * c - b * b) / (2 * a * c))
}

function pointAlongArc(x1, y1, x2, y2, r, theta, ccw, t) {
  ccw = Math.abs(ccw) / ccw // convert to 1 or -1

  let rot = Math.PI / 2 - Math.abs(theta) / 2
  const vectToCenter = normalizeVector(
    rotateVector(
      {
        x: x2 - x1,
        y: y2 - y1
      },
      ccw * rot
    )
  )

  // calculate the center of the arc circle
  const cx = x1 + r * vectToCenter.x
  const cy = y1 + r * vectToCenter.y

  let vectFromCenter = negateVector(vectToCenter)
  rot = Math.abs(theta) * t * ccw
  vectFromCenter = normalizeVector(rotateVector(vectFromCenter, rot))

  return {
    x: cx + r * vectFromCenter.x,
    y: cy + r * vectFromCenter.y
  }
}

function getVectorAngle(x, y) {
  let t = Math.atan(y / x)

  if (x < 0 && t <= 0) t += Math.PI
  else if (x < 0 && t >= 0) t -= Math.PI

  return t
}

function rayIntersection(ax, ay, avx, avy, bx, by, bvx, bvy) {
  const u = ((by - ay) * bvx - (bx - ax) * bvy) / (bvx * avy - bvy * avx)
  const v = ((by - ay) * avx - (bx - ax) * avy) / (bvx * avy - bvy * avx)

  return {
    intersect: u > -TOLERANCE && v > -TOLERANCE,
    u: u,
    v: v
  }
}

function lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

  if (d === 0) {
    // lines are parallel
    return {
      intersect: false
    }
  }

  return {
    intersect: true,
    x: ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d,
    y: ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d
  }
}

/**
 * Parse a pixel-based style descriptor, returning an number.
 *
 * @param {String/Number}
 */
function parsePixelStyle(descriptor) {
  if (typeof descriptor === 'number') return descriptor
  return parseFloat(descriptor.substring(0, descriptor.length - 2), 10)
}

/**
 * Whether vector is projected into positive xy quadrant.
 */
function isOutwardVector(vector) {
  return !fuzzyEquals(vector.x, 0) ? vector.x > 0 : vector.y > 0
}

/**
 * vector utilities
 */

function normalizeVector(v) {
  const d = Math.sqrt(v.x * v.x + v.y * v.y)
  return {
    x: v.x / d,
    y: v.y / d
  }
}

function rotateVector(v, theta) {
  return {
    x: v.x * Math.cos(theta) - v.y * Math.sin(theta),
    y: v.x * Math.sin(theta) + v.y * Math.cos(theta)
  }
}

function negateVector(v) {
  return {
    x: -v.x,
    y: -v.y
  }
}

function addVectors(v1, v2) {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y
  }
}

/**
 * GTFS utilities
 */

function otpModeToGtfsType(otpMode) {
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

// Rendering utilities

function renderDataToSvgPath(renderData) {
  return renderData
    .map((d, k) => {
      if (k === 0) return `M${d.x} ${d.y}`
      if (d.arc) {
        return `A${d.radius} ${d.radius} ${d.arc} 0 ${d.arc > 0 ? 0 : 1} ${
          d.x
        } ${d.y}`
      }
      return `L${d.x} ${d.y}`
    })
    .join(' ')
}

// An instance of the SphericalMercator converter
const sm = new SphericalMercator()

/**
 * @param {*} fontSize A CSS font size or a numerical (pixel) font size.
 * @returns A CSS font size ending with the provided CSS unit or 'px' if none provided.
 */
function getFontSizeWithUnit(fontSize) {
  return fontSize + (isFinite(fontSize) ? 'px' : '')
}

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
  normalizeVector,
  rotateVector,
  negateVector,
  addVectors,
  otpModeToGtfsType,
  renderDataToSvgPath,
  sm,
  getFontSizeWithUnit
}
