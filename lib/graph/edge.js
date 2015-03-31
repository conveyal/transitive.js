var each = require('each');
var PriorityQueue = require('priorityqueuejs');

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
  this.renderedEdges = [];
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
  if (!this.worldLength) this.calculateWorldLengthAndMidpoint();
  return this.worldLength;
};

Edge.prototype.getWorldMidpoint = function() {
  if (!this.worldMidpoint) this.calculateWorldLengthAndMidpoint();
  return this.worldMidpoint;
};

Edge.prototype.calculateWorldLengthAndMidpoint = function() {
  var allPoints = [this.fromVertex.point].concat(this.pointArray, [this.toVertex
    .point
  ]);
  this.worldLength = 0;
  for (var i = 0; i < allPoints.length - 1; i++) {
    this.worldLength += Util.distance(allPoints[i].worldX, allPoints[i].worldY,
      allPoints[i + 1].worldX, allPoints[i + 1].worldY);
  }

  if (this.worldLength === 0) {
    this.worldMidpoint = {
      x: this.fromVertex.point.worldX,
      y: this.fromVertex.point.worldY
    };
  } else {
    var distTraversed = 0;
    for (i = 0; i < allPoints.length - 1; i++) {
      var dist = Util.distance(allPoints[i].worldX, allPoints[i].worldY,
        allPoints[i + 1].worldX, allPoints[i + 1].worldY);
      if ((distTraversed + dist) / this.worldLength >= 0.5) {
        // find the position along this segment (0 <= t <= 1) where the edge midpoint lies
        var t = (0.5 - distTraversed / this.worldLength) / (dist / this.worldLength);
        this.worldMidpoint = {
          x: allPoints[i].worldX + t * (allPoints[i + 1].worldX - allPoints[i].worldX),
          y: allPoints[i].worldY + t * (allPoints[i + 1].worldY - allPoints[i].worldY)
        };
        this.pointsBeforeMidpoint = i;
        this.pointsAfterMidpoint = this.pointArray.length - i;
        break;
      }
      distTraversed += dist;
    }
  }
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

Edge.prototype.copyPathSegments = function(baseEdge) {
  each(baseEdge.pathSegments, function(pathSegment) {
    this.addPathSegment(pathSegment);
  }, this);
};

Edge.prototype.getPathSegmentIds = function(baseEdge) {
  var pathSegIds = [];
  each(this.pathSegments, function(segment) {
    pathSegIds.push(segment.id);
  });
  pathSegIds.sort();
  return pathSegIds.join(',');
};

/**
 *
 */

Edge.prototype.addRenderedEdge = function(rEdge) {
  if (this.renderedEdges.indexOf(rEdge) !== -1) return;
  this.renderedEdges.push(rEdge);
};

/** internal geometry functions **/

Edge.prototype.calculateGeometry = function(cellSize, angleConstraint) {
  //if(!this.hasTransit()) angleConstraint = 5;
  angleConstraint = angleConstraint || 45;

  this.angleConstraintR = angleConstraint * Math.PI / 180;

  this.fx = this.fromVertex.point.worldX;
  this.fy = this.fromVertex.point.worldY;
  this.tx = this.toVertex.point.worldX;
  this.ty = this.toVertex.point.worldY;

  var midpoint = this.getWorldMidpoint();

  var targetFromAngle = Util.getVectorAngle(midpoint.x - this.fx, midpoint.y -
    this.fy);
  this.constrainedFromAngle = Math.round(targetFromAngle / this.angleConstraintR) *
    this.angleConstraintR;

  var fromAngleDelta = Math.abs(this.constrainedFromAngle - targetFromAngle);
  this.fvx = Math.cos(this.constrainedFromAngle);
  this.fvy = Math.sin(this.constrainedFromAngle);

  var targetToAngle = Util.getVectorAngle(midpoint.x - this.tx, midpoint.y -
    this.ty);

  this.constrainedToAngle = Math.round(targetToAngle / this.angleConstraintR) *
    this.angleConstraintR;

  var toAngleDelta = Math.abs(this.constrainedToAngle - targetToAngle);
  this.tvx = Math.cos(this.constrainedToAngle);
  this.tvy = Math.sin(this.constrainedToAngle);

  var tol = 0.01;
  var v = Util.normalizeVector({
    x: (this.toVertex.x - this.fromVertex.x),
    y: (this.toVertex.y - this.fromVertex.y)
  });

  // check if we need to add curvature
  if (!equalVectors(this.fvx, this.fvy, -this.tvx, -this.tvy, tol) || !
    equalVectors(this.fvx, this.fvy, v.x, v.y, tol)) {

    // see if the default endpoint angles produce a valid intersection
    var isect = this.computeEndpointIntersection();

    if (isect.intersect) { // if so, compute the elbow and we're done
      this.elbow = {
        x: this.fx + isect.u * this.fvx,
        y: this.fy + isect.u * this.fvy,
      };
    } else { // if not, adjust the two endpoint angles until they properly intersect

      // default test: compare angle adjustments (if significant difference)
      if (Math.abs(fromAngleDelta - toAngleDelta) > 0.087) {
        if (fromAngleDelta < toAngleDelta) {
          this.adjustToAngle();
        } else {
          this.adjustFromAngle();
        }
      } else { // secondary test: look at distribution of shapepoints
        if (this.pointsAfterMidpoint < this.pointsBeforeMidpoint) {
          this.adjustToAngle();
        } else {
          this.adjustFromAngle();
        }
      }
    }
  }

  this.fromAngle = this.constrainedFromAngle;
  this.toAngle = this.constrainedToAngle;

  this.calculateVectors();
  this.calculateAlignmentIds();
};

/**
 *  Adjust the 'to' endpoint angle by rotating it increments of angleConstraintR
 *  until a valid intersection between the from and to endpoint rays is achieved.
 */

Edge.prototype.adjustToAngle = function() {
  var ccw = Util.ccw(this.fx, this.fy, (this.fx + this.fvx), (this.fy + this.fvy),
    this.tx, this.ty);
  var delta = (ccw > 0) ? this.angleConstraintR : -this.angleConstraintR;
  var i = 0,
    isect;
  while (i++ < 100) {
    this.constrainedToAngle += delta;
    this.tvx = Math.cos(this.constrainedToAngle);
    this.tvy = Math.sin(this.constrainedToAngle);
    isect = this.computeEndpointIntersection();
    if (isect.intersect) break;
  }
  this.elbow = {
    x: this.fx + isect.u * this.fvx,
    y: this.fy + isect.u * this.fvy,
  };
};

/**
 *  Adjust the 'from' endpoint angle by rotating it increments of angleConstraintR
 *  until a valid intersection between the from and to endpoint rays is achieved.
 */

Edge.prototype.adjustFromAngle = function() {
  var ccw = Util.ccw(this.tx, this.ty, (this.tx + this.tvx), (this.ty + this.tvy),
    this.fx, this.fy);
  var delta = (ccw > 0) ? this.angleConstraintR : -this.angleConstraintR;
  var i = 0,
    isect;
  while (i++ < 100) {
    this.constrainedFromAngle += delta;
    this.fvx = Math.cos(this.constrainedFromAngle);
    this.fvy = Math.sin(this.constrainedFromAngle);
    isect = this.computeEndpointIntersection();
    if (isect.intersect) break;
  }
  this.elbow = {
    x: this.fx + isect.u * this.fvx,
    y: this.fy + isect.u * this.fvy,
  };
};

Edge.prototype.computeEndpointIntersection = function() {
  return Util.rayIntersection(this.fx, this.fy, this.fvx, this.fvy,
    this.tx, this.ty, this.tvx, this.tvy);
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
  //debug(this);
  for (var i = 0; i < this.pathSegments.length; i++) {
    if (this.pathSegments[i].getType() === 'TRANSIT') {
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

Edge.prototype.getAlignmentRange = function(alignmentId) {

  var p1, p2;
  if (alignmentId === this.fromAlignmentId) {
    p1 = this.fromVertex;
    p2 = this.elbow || this.toVertex;
  } else if (alignmentId === this.toAlignmentId) {
    p1 = this.toVertex;
    p2 = this.elbow || this.fromVertex;
  } else {
    return null;
  }

  var min, max;
  if (alignmentId.substring(0, 2) === '90') {
    min = Math.min(p1.y, p2.y);
    max = Math.max(p1.y, p2.y);
  } else {
    min = Math.min(p1.x, p2.x);
    max = Math.max(p1.x, p2.x);
  }

  return {
    min: min,
    max: max
  };

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

Edge.prototype.getGeometricCoords = function(fromOffsetPx, toOffsetPx, display, forward) {
  var coords = [], lastX = null, lastY = null;

  // reverse the coords array if needed
  var geomCoords = forward ? this.geomCoords : this.geomCoords.concat().reverse();

  each(geomCoords, function(coord, i) {

    var fromVector = null, toVector = null, rightVector;
    var xOffset, yOffset;
    var x1 = display.xScale(coord[0]);
    var y1 = display.yScale(coord[1]);

    // calculate the vector leading in to this coordinate
    if (i > 0) {
      var prevCoord = geomCoords[i - 1];
      var x0 = display.xScale(prevCoord[0]);
      var y0 = display.yScale(prevCoord[1]);
      if (x1 === x0 && y1 === y0) return;

      toVector = {
        x: x1 - x0,
        y: y1 - y0
      };
    }

    // calculate the vector leading out from this coordinate
    if (i < geomCoords.length - 1) {
      var nextCoord = geomCoords[i + 1];
      var x2 = display.xScale(nextCoord[0]);
      var y2 = display.yScale(nextCoord[1]);
      if(x2 === x1 && y2 === y1) return;

      fromVector = {
        x: x2 - x1,
        y: y2 - y1
      };
    }

    if(fromVector && !toVector) { // the first point in the geomCoords sequence
      rightVector = Util.normalizeVector({
        x: fromVector.y,
        y: -fromVector.x
      });
      xOffset = fromOffsetPx * rightVector.x;
      yOffset = fromOffsetPx * rightVector.y;
    }
    else if(!fromVector && toVector) { // the last point in the geomCoords sequence
      rightVector = Util.normalizeVector({
        x: toVector.y,
        y: -toVector.x
      });
      xOffset = fromOffsetPx * rightVector.x;
      yOffset = fromOffsetPx * rightVector.y;

    }
    else { // an internal point
      rightVector = Util.normalizeVector({
        x: fromVector.y,
        y: -fromVector.x
      });
      xOffset = fromOffsetPx * rightVector.x;
      yOffset = fromOffsetPx * rightVector.y;

      // TODO: properly compute the offsets based on both vectors
    }

    coords.push({
      x: x1 + xOffset,
      y: y1 + yOffset
    });
  }, this);
  return coords;
};

Edge.prototype.getRenderCoords = function(fromOffsetPx, toOffsetPx, display, forward) {
  var fromOffsetX, fromOffsetY;
  var isBase = (fromOffsetPx === 0 && toOffsetPx === 0);

  if (!this.baseRenderCoords && !isBase) {
    this.calculateBaseRenderCoords(display);
  }

  // TODO: This can't be right...
  try {
    fromOffsetX = fromOffsetPx * this.fromRightVector.x;
    fromOffsetY = fromOffsetPx * this.fromRightVector.y;
  } catch (err) {
    debug('edge err');
    debug(this);
  }
  var toOffsetX = toOffsetPx * this.toRightVector.x;
  var toOffsetY = toOffsetPx * this.toRightVector.y;

  var fx = this.fromVertex.getRenderX(display) + fromOffsetX;
  var fy = this.fromVertex.getRenderY(display) - fromOffsetY;
  var fvx = this.fromVector.x,
    fvy = -this.fromVector.y;

  var tx = this.toVertex.getRenderX(display) + toOffsetX;
  var ty = this.toVertex.getRenderY(display) - toOffsetY;
  var tvx = -this.toVector.x,
    tvy = this.toVector.y;

  var coords = [];

  // append the first ('from') coordinate
  coords.push({
    x: forward ? fx : tx,
    y: forward ? fy : ty
  });

  var len = null,
    x1, y1, x2, y2;

  // determine if this edge has an elbow, i.e. a bend in the middle
  if ((isBase && !this.isStraight()) || (!isBase && this.baseRenderCoords.length ===
    4)) {

    var isect = Util.rayIntersection(fx, fy, fvx, fvy, tx, ty, tvx, tvy);
    if (isect.intersect) {
      var u = isect.u;
      var ex = fx + fvx * u;
      var ey = fy + fvy * u;

      this.ccw = Util.ccw(fx, fy, ex, ey, tx, ty);

      // calculate the angle of the arc
      var angleR = this.getElbowAngle();

      // calculate the radius of the arc in pixels, taking offsets into consideration
      var rPx = this.getBaseRadiusPx() - this.ccw * (fromOffsetPx + toOffsetPx) /
        2;

      // calculate the distance from the elbow to place the arc endpoints in each direction
      var d = rPx * Math.tan(angleR / 2);

      // make sure the arc endpoint placement distance is not longer than the either of the
      // elbow-to-edge-endpoint distances
      var l1 = Util.distance(fx, fy, ex, ey),
        l2 = Util.distance(tx, ty, ex, ey);
      d = Math.min(Math.min(l1, l2), d);

      x1 = ex - this.fromVector.x * d;
      y1 = ey + this.fromVector.y * d;

      x2 = ex + this.toVector.x * d;
      y2 = ey - this.toVector.y * d;

      var radius = Util.getRadiusFromAngleChord(angleR, Util.distance(x1, y1,
        x2, y2));
      var arc = angleR * (180 / Math.PI) * (this.ccw < 0 ? 1 : -1);

      if (forward) {
        coords.push({
          x: x1,
          y: y1,
          len: Util.distance(fx, fy, x1, y1)
        });

        coords.push({
          x: x2,
          y: y2,
          len: angleR * radius,
          arc: arc,
          radius: radius
        });

        len = Util.distance(x2, y2, tx, ty);
      } else {
        coords.push({
          x: x2,
          y: y2,
          len: Util.distance(tx, ty, x2, y2)
        });

        coords.push({
          x: x1,
          y: y1,
          len: angleR * radius,
          arc: -arc,
          radius: radius
        });

        len = Util.distance(x1, y1, fx, fy);
      }

    } else if (!isBase) {
      var flen = this.baseRenderCoords[1].len;
      var tlen = this.baseRenderCoords[3].len;

      if (flen === 0 || tlen === 0) {
        x1 = fx + fvx * flen;
        y1 = fy + fvy * flen;
        x2 = tx + tvx * tlen;
        y2 = ty + tvy * tlen;

        coords.push({
          x: forward ? x1 : x2,
          y: forward ? y1 : y2,
          len: flen
        });

        coords.push({
          x: forward ? x2 : x1,
          y: forward ? y2 : y1,
          len: Util.distance(x1, y1, x2, y2)
        });

        len = forward ? tlen : flen;
      }
    }
  }

  // if the length wasn't calculated during elbow-creation, do it now
  if (len === null) len = Util.distance(fx, fy, tx, ty);

  // append the final ('to') coordinate
  coords.push({
    x: forward ? tx : fx,
    y: forward ? ty : fy,
    len: len
  });

  return coords;
};

Edge.prototype.calculateBaseRenderCoords = function(display, forward) {
  this.baseRenderCoords = this.getRenderCoords(0, 0, display, forward);
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

Edge.prototype.getRenderLength = function(display) {

  if (!this.baseRenderCoords) this.calculateBaseRenderCoords(display);

  if (!this.renderLength) {
    this.renderLength = 0;
    for (var i = 1; i < this.baseRenderCoords.length; i++) {
      this.renderLength += this.baseRenderCoords[i].len;
    }
  }
  return this.renderLength;
};

Edge.prototype.coordAlongEdge = function(t, coords, display) {

  if (!this.baseRenderCoords) this.calculateBaseRenderCoords(display);

  if (coords.length === 2 && this.baseRenderCoords.length === 4) {
    return {
      x: coords[0].x + t * (coords[1].x - coords[0].x),
      y: coords[0].y + t * (coords[1].y - coords[0].y)
    };
  }

  /*var len = 0;
  for (var i = 1; i < this.baseRenderCoords.length; i++) {
    len += this.baseRenderCoords[i].len;
  }*/
  var len = this.getRenderLength();

  var loc = t * len;
  var cur = 0;
  for (var i = 1; i < this.baseRenderCoords.length; i++) {
    if (loc < cur + this.baseRenderCoords[i].len) {
      var t2 = (loc - cur) / this.baseRenderCoords[i].len;

      if (coords[i].arc) {

        var r = coords[i].radius;
        var theta = Math.PI * coords[i].arc / 180;
        var ccw = Util.ccw(coords[0].x, coords[0].y, coords[1].x, coords[1].y,
          coords[2].x, coords[2].y);

        return Util.pointAlongArc(coords[1].x, coords[1].y, coords[2].x, coords[
          2].y, r, theta, ccw, t2);

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
  this.renderLength = null;
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
 *  Determines if this edge is part of a standalone, non-transit path
 *  (e.g. a walk/bike/drive-only journey)
 */

Edge.prototype.isNonTransitPath = function() {
  return this.pathSegments.length === 1 && this.pathSegments[0] !== 'TRANSIT' &&
    this.pathSegments[0].path.segments.length === 1;
};

/**
 *
 */

Edge.prototype.toString = function() {
  return 'Edge ' + this.getId() + ' (' + this.fromVertex.toString() + ' to ' +
    this.toVertex.toString() + ')';
};
