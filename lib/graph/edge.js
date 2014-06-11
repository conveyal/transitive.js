var each = require('each');

var Util = require('../util');

var debug = require('debug')('transitive:edge');

/**
 * Expose `Edge`
 */

module.exports = Edge;

/**
 * Initialize a new edge
 *
 * @param {Array}
 * @param {Vertex}
 * @param {Vertex}
 */

var edgeId = 0;

function Edge(pointArray, fromVertex, toVertex) {
  this.id = edgeId++;
  this.pointArray = pointArray;
  this.fromVertex = fromVertex;
  this.toVertex = toVertex;
  this.pathSegments = [];
  this.renderSegments = [];
}

Edge.prototype.getId = function() {
  return this.id;
};

/**
 *
 */

Edge.prototype.getLength = function() {
  var dx = this.toVertex.x - this.fromVertex.x,
    dy = this.toVertex.y - this.fromVertex.y;
  return Math.sqrt(dx * dx + dy * dy);
};

Edge.prototype.getWorldLength = function() {
  var x1 = this.fromVertex.point.worldX;
  var y1 = this.fromVertex.point.worldY;
  var x2, y2;

  var len = 0;
  each(this.pointArray, function(point) {
    x2 = point.worldX;
    y2 = point.worldY;

    len += Util.distance(x1, y1, x2, y2);

    x1 = x2;
    y1 = y2;
  });

  x2 = this.toVertex.point.worldX;
  y2 = this.toVertex.point.worldY;
  len += Util.distance(x1, y1, x2, y2);

  return len;
};

/**
 *
 */

Edge.prototype.isAxial = function() {
  return (this.toVertex.x === this.fromVertex.x) || (this.toVertex.y === this.fromVertex
    .y);
};

/**
 *
 */

Edge.prototype.hasCurvature = function() {
  return this.elbow !== null;
};

/**
 *
 */

Edge.prototype.replaceVertex = function(oldVertex, newVertex) {
  if (oldVertex === this.fromVertex) this.fromVertex = newVertex;
  if (oldVertex === this.toVertex) this.toVertex = newVertex;
};

/**
 *  Add a path segment that traverses this edge
 */

Edge.prototype.addPathSegment = function(segment) {
  this.pathSegments.push(segment);
};

/**
 *
 */

Edge.prototype.addRenderSegment = function(segment) {
  if (this.renderSegments.indexOf(segment) !== -1) return;
  this.renderSegments.push(segment);
};

/** internal geometry functions **/

Edge.prototype.calculateGeometry = function(cellSize, angleConstraint) {

  angleConstraint = angleConstraint || 45;

  var angleConstraintR = angleConstraint * Math.PI / 180;

  var fx = this.fromVertex.point.worldX,
    fy = this.fromVertex.point.worldY;
  var tx = this.toVertex.point.worldX,
    ty = this.toVertex.point.worldY;

  var fromAdjPoint = this.getAdjPoint(this.fromVertex.point); // this.pointArray.length > 0 ? this.pointArray[0] : this.toVertex.point;

  var dx = fromAdjPoint.worldX - fx;
  var dy = fromAdjPoint.worldY - fy;

  var fromAngle = Util.getVectorAngle(dx, dy); // * 180 / Math.PI;
  var constrainedFromAngle = Math.round(fromAngle / angleConstraintR) *
    angleConstraintR;
  var fvx = Math.cos(constrainedFromAngle),
    fvy = Math.sin(constrainedFromAngle);

  var toAdjPoint = this.getAdjPoint(this.toVertex.point); //this.pointArray.length > 0 ? this.pointArray[this.pointArray.length-1] : this.fromVertex.point;

  dx = toAdjPoint.worldX - tx;
  dy = toAdjPoint.worldY - ty;

  var toAngle = Util.getVectorAngle(dx, dy); // * 180 / Math.PI;
  var constrainedToAngle = Math.round(toAngle / angleConstraintR) *
    angleConstraintR;
  var tvx = Math.cos(constrainedToAngle),
    tvy = Math.sin(constrainedToAngle);

  var tol = 0.00001;
  var s1 = (this.toVertex.y - this.fromVertex.y) / (this.toVertex.x - this.fromVertex
    .x);
  var s2 = fvy / fvx;

  var isect = Util.rayIntersection(fx, fy, fvx, fvy, tx, ty, tvx, tvy);
  if (equalVectors(fvx, fvy, -tvx, -tvy, tol) && Math.abs(s1 - s2) < tol) {
    //console.log('STRAIGHT');
  } else if (!isect.intersect) {
    var i = 0;

    while (i++ < 10) {

      // adjust from
      var ccw = Util.ccw(fx, fy, (fx + fvx), (fy + fvy), tx, ty);
      constrainedFromAngle += (ccw > 0) ? angleConstraintR : -angleConstraintR;
      fvx = Math.cos(constrainedFromAngle);
      fvy = Math.sin(constrainedFromAngle);
      isect = Util.rayIntersection(fx, fy, fvx, fvy, tx, ty, tvx, tvy);
      if (isect.intersect) break;

      // adjust to
      ccw = Util.ccw(tx, ty, (tx + tvx), (ty + tvy), fx, fy);
      constrainedToAngle += (ccw > 0) ? angleConstraintR : -angleConstraintR;
      tvx = Math.cos(constrainedToAngle);
      tvy = Math.sin(constrainedToAngle);
      isect = Util.rayIntersection(fx, fy, fvx, fvy, tx, ty, tvx, tvy);
      if (isect.intersect) break;

    }
  }

  this.fromAngle = constrainedFromAngle;
  this.toAngle = constrainedToAngle;

  this.calculateVectors();
  this.calculateAlignmentIds();
};

Edge.prototype.getAdjPoint = function(point) {
  if (point === this.fromVertex.point) return this.pointArray.length > 0 ? this
    .pointArray[0] : this.toVertex.point;
  if (point === this.toVertex.point) return this.pointArray.length > 0 ? this.pointArray[
    this.pointArray.length - 1] : this.fromVertex.point;
};

function equalVectors(x1, y1, x2, y2, tol) {
  tol = tol || 0;
  return Math.abs(x1 - x2) < tol && Math.abs(y1 - y2) < tol;
}

Edge.prototype.calculateVectors = function(fromAngle, toAngle) {

  this.fromVector = {
    x: Math.cos(this.fromAngle),
    y: Math.sin(this.fromAngle)
  };

  this.fromleftVector = {
    x: -this.fromVector.y,
    y: this.fromVector.x
  };

  this.fromRightVector = {
    x: this.fromVector.y,
    y: -this.fromVector.x
  };

  this.toVector = {
    x: Math.cos(this.toAngle + Math.PI),
    y: Math.sin(this.toAngle + Math.PI)
  };

  this.toleftVector = {
    x: -this.toVector.y,
    y: this.toVector.x
  };

  this.toRightVector = {
    x: this.toVector.y,
    y: -this.toVector.x
  };
};

/**
 *  Compute the 'alignment id', a string that uniquely identifies a line in
 *  2D space given a point and angle relative to the x-axis.
 */

Edge.prototype.calculateAlignmentId = function(x, y, angle) {
  var angleD = Math.round(angle * 180 / Math.PI);
  if (angleD > 90) angleD -= 180;
  if (angleD <= -90) angleD += 180;

  if (angleD === 90) {
    return '90_x' + x;
  }

  // calculate the y-axis crossing
  var ya = Math.round(y - x * Math.tan(angle));
  return angleD + '_y' + ya;
};

Edge.prototype.calculateAlignmentIds = function() {
  this.fromAlignmentId = this.calculateAlignmentId(this.fromVertex.x, this.fromVertex
    .y, this.fromAngle);
  this.toAlignmentId = this.calculateAlignmentId(this.toVertex.x, this.toVertex
    .y, this.toAngle);
};

Edge.prototype.hasTransit = function(cellSize) {
  for (var i = 0; i < this.renderSegments.length; i++) {
    if (this.renderSegments[i].getType() === 'TRANSIT') {
      return true;
    }
  }
  return false;
};

Edge.prototype.getFromAlignmentId = function() {
  return this.fromAlignmentId;
};

Edge.prototype.getToAlignmentId = function() {
  return this.toAlignmentId;
};

Edge.prototype.align = function(vertex, vector) {
  if (this.aligned || !this.hasCurvature()) return;
  var currentVector = this.getVector(vertex);
  if (Math.abs(currentVector.x) !== Math.abs(vector.x) || Math.abs(
    currentVector.y) !== Math.abs(vector.y)) {
    this.curveAngle = -this.curveAngle;
    this.calculateGeometry();
  }
  this.aligned = true;
};

Edge.prototype.getRenderCoords = function(fromOffsetPx, toOffsetPx, display) {

  var isBase = (fromOffsetPx === 0 && toOffsetPx === 0);

  if (!this.baseRenderCoords && !isBase) {
    this.calculateBaseRenderCoords(display);
  }

  var fromOffsetX = fromOffsetPx * this.fromRightVector.x;
  var fromOffsetY = fromOffsetPx * this.fromRightVector.y;

  var toOffsetX = toOffsetPx * this.toRightVector.x;
  var toOffsetY = toOffsetPx * this.toRightVector.y;

  var fx = display.xScale(this.fromVertex.x) + fromOffsetX;
  var fy = display.yScale(this.fromVertex.y) - fromOffsetY;
  var fvx = this.fromVector.x,
    fvy = -this.fromVector.y;

  var tx = display.xScale(this.toVertex.x) + toOffsetX;
  var ty = display.yScale(this.toVertex.y) - toOffsetY;
  var tvx = -this.toVector.x,
    tvy = this.toVector.y;

  var coords = [];

  coords.push({
    x: fx,
    y: fy
  });
  var len = null,
    x1, y1, x2, y2;

  if ((isBase && !this.isStraight()) || (!isBase && this.baseRenderCoords.length ===
    4)) {

    var isect = Util.rayIntersection(fx, fy, fvx, fvy, tx, ty, tvx, tvy);
    if (isect.intersect) {
      var u = isect.u;
      var ex = fx + fvx * u;
      var ey = fy + fvy * u;

      // calculate the angle of the arc
      var angleR = this.getElbowAngle();

      // calculate the radius of the arc in pixels, taking offsets into consideration
      var rPx = this.getBaseRadiusPx() - (fromOffsetPx + toOffsetPx) / 2;

      // calculate the distance from the elbow to place the arc endpoints in each direction
      var d = rPx * Math.tan(angleR / 2);

      // make sure the arc endpoint placement distance is not longer than the either of the
      // elbow-to-edge-endpoint distances
      var l1 = Util.distance(fx, fy, ex, ey),
        l2 = Util.distance(tx, ty, ex, ey);
      d = Math.min(Math.min(l1, l2), d);

      x1 = ex - this.fromVector.x * d;
      y1 = ey + this.fromVector.y * d;
      coords.push({
        x: x1,
        y: y1,
        len: Util.distance(fx, fy, x1, y1)
      });

      x2 = ex + this.toVector.x * d;
      y2 = ey - this.toVector.y * d;

      var radius = Util.getRadiusFromAngleChord(angleR, Util.distance(x1, y1,
        x2, y2));
      this.ccw = Util.ccw(fx, fy, ex, ey, tx, ty);
      var arc = angleR * (180 / Math.PI) * (this.ccw < 0 ? 1 : -1);
      coords.push({
        x: x2,
        y: y2,
        len: angleR * radius,
        arc: arc,
        radius: radius
      });

      len = Util.distance(x2, y2, tx, ty);
    } else if (!isBase) {

      var flen = this.baseRenderCoords[1].len;
      var tlen = this.baseRenderCoords[3].len;

      if (flen === 0 || tlen === 0) {
        x1 = fx + fvx * flen;
        y1 = fy + fvy * flen;
        x2 = tx + tvx * tlen;
        y2 = ty + tvy * tlen;

        coords.push({
          x: x1,
          y: y1,
          len: flen
        });

        coords.push({
          x: x2,
          y: y2,
          len: Util.distance(x1, y1, x2, y2)
        });

        len = tlen;
      }
    }
  }

  if (!len) len = Util.distance(fx, fy, tx, ty);

  coords.push({
    x: tx,
    y: ty,
    len: len
  });

  return coords;
};

Edge.prototype.calculateBaseRenderCoords = function(display) {
  this.baseRenderCoords = this.getRenderCoords(0, 0, display);
};

Edge.prototype.isStraight = function() {
  var tol = 0.00001;
  return (Math.abs(this.fromVector.x - this.toVector.x) < tol &&
    Math.abs(this.fromVector.y - this.toVector.y) < tol);
};

Edge.prototype.getBaseRadiusPx = function() {
  return 15;
};

Edge.prototype.getElbowAngle = function() {
  var cx = this.fromVector.x - this.toVector.x;
  var cy = this.fromVector.y - this.toVector.y;

  var c = Math.sqrt(cx * cx + cy * cy) / 2;

  var theta = Math.asin(c);

  return theta * 2;
};

Edge.prototype.coordAlongEdge = function(t, coords, display) {

  if (!this.baseRenderCoords) this.calculateBaseRenderCoords(display);

  if (coords.length === 2 && this.baseRenderCoords.length === 4) {
    return {
      x: coords[0].x + t * (coords[1].x - coords[0].x),
      y: coords[0].y + t * (coords[1].y - coords[0].y)
    };
  }

  var len = 0;
  for (var i = 1; i < this.baseRenderCoords.length; i++) {
    len += this.baseRenderCoords[i].len;
  }

  var loc = t * len;
  var cur = 0;
  for (i = 1; i < this.baseRenderCoords.length; i++) {
    if (loc < cur + this.baseRenderCoords[i].len) {
      var t2 = (loc - cur) / this.baseRenderCoords[i].len;

      if (coords[i].arc) {

        var ccw = Util.ccw(coords[0].x, coords[0].y, coords[1].x, coords[1].y,
          coords[2].x, coords[2].y);
        ccw = Math.abs(ccw) / ccw; // convert to 1 or -1

        var vectToCenter = Util.normalizeVector(Util.rotateVector({
          x: coords[1].x - coords[0].x,
          y: coords[1].y - coords[0].y
        }, ccw * Math.PI / 2));
        var r = coords[i].radius;
        var theta = Math.PI * coords[i].arc / 180;

        // calculate the center of the arc circle
        var cx = coords[1].x + r * vectToCenter.x;
        var cy = coords[1].y + r * vectToCenter.y;

        var vectFromCenter = Util.negateVector(vectToCenter);
        var rot = Math.abs(theta) * t2 * ccw;
        vectFromCenter = Util.normalizeVector(Util.rotateVector(vectFromCenter,
          rot));

        return {
          x: cx + r * vectFromCenter.x,
          y: cy + r * vectFromCenter.y
        };

      } else {
        var dx = coords[i].x - coords[i - 1].x;
        var dy = coords[i].y - coords[i - 1].y;

        return {
          x: coords[i - 1].x + dx * t2,
          y: coords[i - 1].y + dy * t2
        };
      }
    }
    cur += this.baseRenderCoords[i].len;
  }

};

Edge.prototype.clearRenderData = function() {
  this.baseRenderCoords = null;
};

Edge.prototype.getVector = function(vertex) {
  if (vertex === this.fromVertex) return this.fromVector;
  if (vertex === this.toVertex) return this.toVector;
};

/**
 *  Gets the vertex opposite another vertex on an edge
 */

Edge.prototype.oppositeVertex = function(vertex) {
  if (vertex === this.toVertex) return this.fromVertex;
  if (vertex === this.fromVertex) return this.toVertex;
  return null;
};

Edge.prototype.commonVertex = function(edge) {
  if (this.fromVertex === edge.fromVertex || this.fromVertex === edge.toVertex)
    return this.fromVertex;
  if (this.toVertex === edge.fromVertex || this.toVertex === edge.toVertex)
    return this.toVertex;
  return null;
};

/**
 *
 */

Edge.prototype.setPointLabelPosition = function(pos, skip) {
  if (this.fromVertex.point !== skip) this.fromVertex.point.labelPosition = pos;
  if (this.toVertex.point !== skip) this.toVertex.point.labelPosition = pos;

  this.pointArray.forEach(function(point) {
    if (point !== skip) point.labelPosition = pos;
  });
};

/**
 *
 */

Edge.prototype.toString = function() {
  return 'Edge ' + this.getId() + ' (' + this.fromVertex.toString() + ' to ' +
    this.toVertex.toString() + ')';
};
