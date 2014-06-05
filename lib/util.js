/**
 * General Transitive utilities library
 */

var d3 = require('d3');


module.exports.distance = function(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
};


module.exports.getRadiusFromAngleChord = function(angleR, chordLen) {
  return (chordLen/2) / Math.sin(angleR/2);
};


/*
 * CCW utility function. Accepts 3 coord pairs; result is positive if points
 * have counterclockwise orientation, negative if clockwise, 0 if collinear.
 */

module.exports.ccw = function(ax, ay, bx, by, cx, cy) {
   return (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
};


module.exports.getVectorAngle = function(x, y) {
  var t = Math.atan(y/x);

  if(x < 0 && t <= 0) t += Math.PI;
  else if(x < 0 && t >= 0) t -= Math.PI;

  return t;
};


var tol = 0.000001;

module.exports.rayIntersection = function(ax, ay, avx, avy, bx, by, bvx, bvy) {
  var u = (ay*bvx + bvy*bx - by*bvx - bvy*ax ) / (avx*bvy - avy*bvx);
  var v = (ax + avx * u - bx) / bvx;

  return {
    u: u,
    v: v,
    intersect: (u > -tol && v > -tol)
  };
};


/**
 * Parse a pixel-based style descriptor, returning an number.
 *
 * @param {String/Number}
 */

module.exports.parsePixelStyle = function(descriptor) {
  if(typeof descriptor === 'number') return descriptor;
  return parseFloat(descriptor.substring(0, descriptor.length - 2), 10);
};


module.exports.isOutwardVector = function(vector) {
  if(vector.x !== 0) return (vector.x > 0);
  return (vector.y > 0);
};


module.exports.getTextBBox = function(text, attrs) {
  var container = d3.select('body').append('svg');
  container.append('text')
    .attr({ x: -1000, y: -1000 })
    .attr(attrs)
    .text(text);
  var bbox = container.node().getBBox();
  container.remove();

  return { height: bbox.height, width: bbox.width };
};


/**
 * Convert lat/lon coords to spherical mercator meter x/y coords
 */

module.exports.latLonToSphericalMercator = function(lat, lon) {
  var r = 6378137;
  var x = r * lon * Math.PI/180;
  var y = r * Math.log(Math.tan(Math.PI/4 + lat * Math.PI/360));
  return [x,y];
};


/**
 * vector utilities
 */

module.exports.normalizeVector = function(v) {
  var d = Math.sqrt(v.x * v.x + v.y * v.y);
  return {
    x : v.x / d,
    y : v.y / d
  };
};


module.exports.rotateVector = function(v, theta) {
  return {
    x : v.x * Math.cos(theta) - v.y * Math.sin(theta),
    y : v.x * Math.sin(theta) + v.y * Math.cos(theta)
  };
};


module.exports.negateVector = function(v) {
  return {
    x : -v.x,
    y : -v.y
  };
};


module.exports.addVectors = function(v1, v2) {
  return {
    x : v1.x + v2.x,
    y : v1.y + v2.y
  };
};

