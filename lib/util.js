/**
 * General Transitive utilities library
 */

var d3 = require('d3');

var tolerance = 0.000001;

module.exports.fuzzyEquals = function(a, b, tol) {
  tol = tol || tolerance;
  return Math.abs(a - b) < tol;
};

module.exports.distance = function(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
};

module.exports.getRadiusFromAngleChord = function(angleR, chordLen) {
  return (chordLen / 2) / Math.sin(angleR / 2);
};

/*
 * CCW utility function. Accepts 3 coord pairs; result is positive if points
 * have counterclockwise orientation, negative if clockwise, 0 if collinear.
 */

module.exports.ccw = function(ax, ay, bx, by, cx, cy) {
  var raw = module.exports.ccwRaw(ax, ay, bx, by, cx, cy);
  return (raw === 0) ? 0 : raw / Math.abs(raw);
};

module.exports.ccwRaw = function(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
};

/*
 * Compute angle formed by three points in cartesian plane using law of cosines
 */

module.exports.angleFromThreePoints = function(ax, ay, bx, by, cx, cy) {
  var c = module.exports.distance(ax, ay, bx, by);
  var a = module.exports.distance(bx, by, cx, cy);
  var b = module.exports.distance(ax, ay, cx, cy);
  return Math.acos((a * a + c * c - b * b) / (2 * a * c));
};

module.exports.pointAlongArc = function(x1, y1, x2, y2, r, theta, ccw, t) {
  ccw = Math.abs(ccw) / ccw; // convert to 1 or -1

  var rot = Math.PI / 2 - Math.abs(theta) / 2;
  var vectToCenter = module.exports.normalizeVector(module.exports.rotateVector({
    x: x2 - x1,
    y: y2 - y1
  }, ccw * rot));

  // calculate the center of the arc circle
  var cx = x1 + r * vectToCenter.x;
  var cy = y1 + r * vectToCenter.y;

  var vectFromCenter = module.exports.negateVector(vectToCenter);
  rot = Math.abs(theta) * t * ccw;
  vectFromCenter = module.exports.normalizeVector(module.exports.rotateVector(
    vectFromCenter, rot));

  return {
    x: cx + r * vectFromCenter.x,
    y: cy + r * vectFromCenter.y
  };

};

module.exports.getVectorAngle = function(x, y) {
  var t = Math.atan(y / x);

  if (x < 0 && t <= 0) t += Math.PI;
  else if (x < 0 && t >= 0) t -= Math.PI;

  return t;
};

module.exports.rayIntersection = function(ax, ay, avx, avy, bx, by, bvx, bvy) {
  var u = ((by - ay) * bvx - (bx - ax) * bvy) / (bvx * avy - bvy * avx);
  var v = ((by - ay) * avx - (bx - ax) * avy) / (bvx * avy - bvy * avx);

  return {
    u: u,
    v: v,
    intersect: (u > -tolerance && v > -tolerance)
  };
};

module.exports.lineIntersection = function(x1, y1, x2, y2, x3, y3, x4, y4) {

  var d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (d === 0) { // lines are parallel
    return {
      intersect: false
    };
  }

  return {
    x: ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d,
    y: ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d,
    intersect: true
  };
};

/**
 * Parse a pixel-based style descriptor, returning an number.
 *
 * @param {String/Number}
 */

module.exports.parsePixelStyle = function(descriptor) {
  if (typeof descriptor === 'number') return descriptor;
  return parseFloat(descriptor.substring(0, descriptor.length - 2), 10);
};

module.exports.isOutwardVector = function(vector) {
  if (!module.exports.fuzzyEquals(vector.x, 0)) return (vector.x > 0);
  return (vector.y > 0);
};

module.exports.getTextBBox = function(text, attrs) {
  var container = d3.select('body').append('svg');
  container.append('text')
    .attr({
      x: -1000,
      y: -1000
    })
    .attr(attrs)
    .text(text);
  var bbox = container.node().getBBox();
  container.remove();

  return {
    height: bbox.height,
    width: bbox.width
  };
};

/**
 * Convert lat/lon coords to spherical mercator meter x/y coords
 */

module.exports.latLonToSphericalMercator = function(lat, lon) {
  var r = 6378137;
  var x = r * lon * Math.PI / 180;
  var y = r * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
  return [x, y];
};

/**
 * vector utilities
 */

module.exports.normalizeVector = function(v) {
  var d = Math.sqrt(v.x * v.x + v.y * v.y);
  return {
    x: v.x / d,
    y: v.y / d
  };
};

module.exports.rotateVector = function(v, theta) {
  return {
    x: v.x * Math.cos(theta) - v.y * Math.sin(theta),
    y: v.x * Math.sin(theta) + v.y * Math.cos(theta)
  };
};

module.exports.negateVector = function(v) {
  return {
    x: -v.x,
    y: -v.y
  };
};

module.exports.addVectors = function(v1, v2) {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y
  };
};



/**
 * GTFS utilities
 */

module.exports.otpModeToGtfsType = function(otpMode) {
  switch(otpMode) {
    case "TRAM": return 0;
    case "SUBWAY": return 1;
    case "RAIL": return 2;
    case "BUS": return 3;
    case "FERRY": return 4;
    case "CABLE_CAR": return 5;
    case "GONDOLA": return 6;
    case "FUNICULAR": return 7;
  }
};