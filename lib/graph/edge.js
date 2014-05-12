var Util = require('../util');


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
  this.paths = [];
  this.pathSegments = [];
  this.renderSegments = [];

  this.curveAngle = 90;

  //this.calculateVectors();
}


/**
 *
 */

Edge.prototype.getLength = function() {
  var dx = this.toVertex.x - this.fromVertex.x, dy = this.toVertex.y - this.fromVertex.y;
  return Math.sqrt(dx * dx + dy * dy);
};


/**
 *
 */

Edge.prototype.isAxial = function() {
  return (this.toVertex.x === this.fromVertex.x) || (this.toVertex.y === this.fromVertex.y);
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
  if(oldVertex === this.fromVertex) this.fromVertex = newVertex;
  if(oldVertex === this.toVertex) this.toVertex = newVertex;
};


/**
 *  Add a path that traverses this edge
 */

Edge.prototype.addPath = function(path) {
  if (this.paths.indexOf(path) === -1) this.paths.push(path);
};


Edge.prototype.addPathSegment = function(segment) {
  for(var i = 0; i < this.pathSegments.length; i++) {
    if(this.pathSegments[i].pattern && segment.pattern
       && this.pathSegments[i].pattern === segment.pattern) {
      return;
    }
  }
  this.pathSegments.push(segment);
};


/**
 *
 */

Edge.prototype.addRenderSegment = function(segment) {
  if(this.renderSegments.indexOf(segment) !== -1) return;
  this.renderSegments.push(segment);
};


/** internal geometry functions **/

Edge.prototype.calculateGeometry = function(cellSize) {

  this.elbow = this.getCurveElbow(cellSize);

  this.calculateVectors();

  this.curvaturePoints = [];
  if(this.elbow !== null) this.calculateCurvaturePoints();

};


Edge.prototype.calculateCurvaturePoints = function() {

  // construct the curvature points
  var x1 = this.fromVertex.x, y1 = this.fromVertex.y;
  var x2 = this.toVertex.x, y2 = this.toVertex.y;
  var dx = x2 - x1, dy = y2 - y1;
  
  var dex1 = x1 - this.elbow.x, dex2 = x2 - this.elbow.x, dey1 = y1 - this.elbow.y, dey2 = y2 - this.elbow.y;
  var e1len = Math.sqrt(dex1 * dex1 + dey1 * dey1);
  var e2len = Math.sqrt(dex2 * dex2 + dey2 * dey2);

  // unit vector from elbow to 'from' point
  var e1Vector = {
    x: dex1 / e1len,
    y: dey1 / e1len
  };

  // unit vector from elbow to 'to' point
  var e2Vector = {
    x: dex2 / e2len,
    y: dey2 / e2len
  };

  this.radius = Math.min(250, Math.min(Math.abs(dx), Math.abs(dy)));


  this.curvaturePoints.push({
    x : this.elbow.x + e1Vector.x * this.radius,
    y : this.elbow.y + e1Vector.y * this.radius
  });
  this.curvaturePoints.push({
    x : this.elbow.x + e2Vector.x * this.radius,
    y : this.elbow.y + e2Vector.y * this.radius,
    arc: this.curveAngle
  });
};


Edge.prototype.getCurveElbow = function(cellSize) {
  return this.getCurveElbowFromCoords(this.fromVertex.x, this.fromVertex.y, this.toVertex.x, this.toVertex.y, cellSize);
};


Edge.prototype.getCurveElbowFromCoords = function(x1, y1, x2, y2, cellSize) {
  var dx = x2 - x1, dy = y2 - y1;

  // keep diagonal edges that traverse a single grid cell straight
  if(Math.abs(dx) === cellSize && Math.abs(dy) === cellSize && !this.hasTransit()) return null;

  var inQ1 = (dx > 0 && dy > 0);
  var inQ2 = (dx < 0 && dy > 0);
  var inQ3 = (dx < 0 && dy < 0);
  var inQ4 = (dx > 0 && dy < 0);

  if(this.curveAngle === 90 && (inQ1 || inQ3)) return { x: x2, y: y1 };
  if(this.curveAngle === 90 && (inQ2 || inQ4)) return { x: x1, y: y2 };
  if(this.curveAngle === -90 && (inQ1 || inQ3)) return { x: x1, y: y2 };
  if(this.curveAngle === -90 && (inQ2 || inQ4)) return { x: x2, y: y1 };

  return null;
};


Edge.prototype.hasTransit = function(cellSize) {
  for(var i = 0; i < this.renderSegments.length; i++) {
    if(this.renderSegments[i].getType() === 'TRANSIT') {
      return true;
    }
  }
  return false;
};

Edge.prototype.calculateVectors = function(cellSize) {

  var dx = this.elbow ? (this.elbow.x - this.fromVertex.x) : (this.toVertex.x - this.fromVertex.x);
  var dy = this.elbow ? (this.elbow.y - this.fromVertex.y) : (this.toVertex.y - this.fromVertex.y);
  var l = Math.sqrt(dx * dx + dy * dy);

  this.fromVector = {
    x: dx / l,
    y: dy / l
  };

  this.fromleftVector = {
    x : -this.fromVector.y,
    y : this.fromVector.x
  };

  this.fromRightVector = {
    x : this.fromVector.y,
    y : -this.fromVector.x
  };


  dx = this.elbow ? (this.toVertex.x - this.elbow.x) : (this.toVertex.x - this.fromVertex.x);
  dy = this.elbow ? (this.toVertex.y - this.elbow.y) : (this.toVertex.y - this.fromVertex.y);
  l = Math.sqrt(dx * dx + dy * dy);

  this.toVector = {
    x: dx / l,
    y: dy / l
  };

  this.toleftVector = {
    x : -this.toVector.y,
    y : this.toVector.x
  };

  this.toRightVector = {
    x : this.toVector.y,
    y : -this.toVector.x
  };

};


Edge.prototype.getFromAlignmentId = function() {
  if(this.fromVector.x === 0) return 'x_' + this.fromVertex.x;
  if(this.fromVector.y === 0) return 'y_' + this.fromVertex.y;
};


Edge.prototype.getToAlignmentId = function() {
  if(this.toVector.x === 0) return 'x_' + this.toVertex.x;
  if(this.toVector.y === 0) return 'y_' + this.toVertex.y;
};


Edge.prototype.getGridPoints = function(cellSize) {
  return this.getGridPointsFromCoords(this.fromVertex.x, this.fromVertex.y, this.toVertex.x, this.toVertex.y, cellSize);
  /*var gridPoints = [];

  var elbow = this.elbow;
  
  gridPoints.push([ this.fromVertex.x, this.fromVertex.y ]);

  //console.log(this);

  if(elbow && elbow.x === this.fromVertex.x) { // follows y-axis first
    gridPoints = gridPoints.concat(this.getYAxisGridPoints(cellSize, this.fromVertex.x));
    gridPoints.push([ elbow.x, elbow.y ]);
    gridPoints = gridPoints.concat(this.getXAxisGridPoints(cellSize, this.toVertex.y));
  }
  else if(elbow && elbow.y == this.fromVertex.y) { // follows x-axis first
    gridPoints = gridPoints.concat(this.getXAxisGridPoints(cellSize, this.fromVertex.y));
    gridPoints.push([ elbow.x, elbow.y ]);
    gridPoints = gridPoints.concat(this.getYAxisGridPoints(cellSize, this.toVertex.x));
  }
  else if(this.fromVertex.x === this.toVertex.x) { // vertical edge
    gridPoints = gridPoints.concat(this.getYAxisGridPoints(cellSize, this.fromVertex.x));
  }
  else if(this.fromVertex.y === this.toVertex.y) { // horizontal edge
    gridPoints = gridPoints.concat(this.getXAxisGridPoints(cellSize, this.fromVertex.y));
  }

  gridPoints.push([ this.toVertex.x, this.toVertex.y ]);

  //console.log(gridPoints);
  return gridPoints;*/
};


Edge.prototype.getGridPointsFromCoords = function(fx, fy, tx, ty, cellSize) {
  var gridPoints = [];

  var elbow = this.elbow ? this.elbow : this.getCurveElbowFromCoords(fx, fy, tx, ty, cellSize);
  gridPoints.push([ fx, fy ]);

  if(elbow && elbow.x === fx) { // follows y-axis first
    gridPoints = gridPoints.concat(this.getYAxisGridPoints(fy, ty, fx, cellSize));
    gridPoints.push([ elbow.x, elbow.y ]);
    gridPoints = gridPoints.concat(this.getXAxisGridPoints(fx, tx, ty, cellSize));
  }
  else if(elbow && elbow.y === fy) { // follows x-axis first
    gridPoints = gridPoints.concat(this.getXAxisGridPoints(fx, tx, fy, cellSize));
    gridPoints.push([ elbow.x, elbow.y ]);
    gridPoints = gridPoints.concat(this.getYAxisGridPoints(fy, ty, tx, cellSize));
  }
  else if(fx === tx) { // vertical edge
    gridPoints = gridPoints.concat(this.getYAxisGridPoints(fy, ty, fx, cellSize));
  }
  else if(fy === ty) { // horizontal edge
    gridPoints = gridPoints.concat(this.getXAxisGridPoints(fx, tx, fy, cellSize));
  }

  gridPoints.push([ tx, ty ]);

  return gridPoints;
};

Edge.prototype.getXAxisGridPoints = function(fx, tx, y, cellSize) {
  var gridPoints = [];
  var dx = tx - fx;
  var xCellCount = Math.abs(dx) / cellSize;

  for(var xc = 1; xc < xCellCount; xc++) {
    gridPoints.push([
      fx + xc * cellSize * (dx / Math.abs(dx)),
      y
    ]);
  }

  return gridPoints;
};

Edge.prototype.getYAxisGridPoints = function(fy, ty, x, cellSize) {
  var gridPoints = [];
  var dy = ty - fy;
  var yCellCount = Math.abs(dy) / cellSize;

  for(var yc = 1; yc < yCellCount; yc++) {
    gridPoints.push([
      x,
      fy + yc * cellSize * (dy / Math.abs(dy))
    ]);
  }
  return gridPoints;
};

Edge.prototype.calculateGridEdges = function(cellSize) {
  this.gridEdges = [];
  this.gridPoints = this.getGridPoints(cellSize);
  for(var i=0; i < this.gridPoints.length-1; i++) {
    var x1 = this.gridPoints[i][0], y1 = this.gridPoints[i][1];
    var x2 = this.gridPoints[i+1][0], y2 = this.gridPoints[i+1][1];
    var id = Math.min(x1, x2) + '_' + Math.min(y1, y2) + '_' + Math.max(x1, x2) + '_' + Math.max(y1, y2);
    this.gridEdges.push(id);
  }

};


Edge.prototype.align = function(vertex, vector) {
  if(this.aligned || !this.hasCurvature()) return;
  var currentVector = this.getVector(vertex);
  if(Math.abs(currentVector.x) !== Math.abs(vector.x) || Math.abs(currentVector.y) !== Math.abs(vector.y)) {
    this.curveAngle = -this.curveAngle;
    this.calculateGeometry();
  }
  this.aligned = true;
};


Edge.prototype.getRenderCoords = function(fromOffsetPx, toOffsetPx, display) {

  var fromOffsetX = fromOffsetPx * this.fromRightVector.x;
  var fromOffsetY = fromOffsetPx * this.fromRightVector.y;

  var toOffsetX = toOffsetPx * this.toRightVector.x;
  var toOffsetY = toOffsetPx * this.toRightVector.y;

  var fx = display.xScale(this.fromVertex.x) + fromOffsetX;
  var fy = display.yScale(this.fromVertex.y) - fromOffsetY;
  var fvx = this.fromVector.x, fvy = this.fromVector.y;

  var tx = display.xScale(this.toVertex.x) + toOffsetX;
  var ty = display.yScale(this.toVertex.y) - toOffsetY;
  var tvx = this.toVector.x, tvy = this.toVector.y;


  var coords = [];

  coords.push({ x: fx, y : fy});
  var len = null;
  
  if(!this.isStraight()) {
    var u = (fy*tvx + tvy*tx - ty*tvx - tvy*fx ) / (fvx*tvy - fvy*tvx);
    //console.log('u=' + u);
    //console.log(this.toString());
    if(!isNaN(u)) {
      var ex = fx + fvx * u;
      var ey = fy + fvy * u;

      var rPx = this.getBaseRadiusPx() + (fromOffsetPx + toOffsetPx) / 2;
      var x1 = ex - this.fromVector.x * rPx;
      var y1 = ey + this.fromVector.y * rPx;
      coords.push({ 
        x: x1,
        y: y1,
        len: Util.distance(fx, fy, x1, y1)
      });

      var x2 = ex + this.toVector.x * rPx; 
      var y2 = ey - this.toVector.y * rPx;

      var angleR = this.getElbowAngle();
      var radius = Util.getRadiusFromAngleChord(angleR, Util.distance(x1, y1, x2, y2));
      var ccw = Util.ccw(fx, fy, ex, ey, tx, ty);
      var arc = angleR * (180/Math.PI) * (ccw < 0 ? 1 : -1);
      coords.push({ 
        x: x2, 
        y: y2,
        len: angleR * radius,
        arc: arc
      });

      len = Util.distance(x2, y2, tx, ty);
    }
  }
  
  if(!len) len = Util.distance(fx, fy, tx, ty);

  coords.push({
    x: tx,
    y: ty,
    len: len
  });

  return coords;
};


Edge.prototype.isStraight = function() {
  return (this.fromVector.x === this.toVector.x && this.fromVector.y === this.toVector.y);
};


Edge.prototype.getBaseRadiusPx = function() {
  return 15;
};


Edge.prototype.getElbowAngle = function() {
  var cx = this.fromVector.x - this.toVector.x;
  var cy = this.fromVector.y - this.toVector.y;

  var c = Math.sqrt(cx*cx + cy*cy) / 2;
  
  var theta = Math.asin(c);

  return theta * 2;
  //var deg = theta * (180/Math.PI);
  //return deg * 2;
};


Edge.prototype.coordAlongEdge = function(t, coords, display) {

  if(!this.baseCoords) {
    this.baseCoords = this.getRenderCoords(0, 0, display);
  }

  var len = 0;
  for(var i = 1; i < this.baseCoords.length; i++) {
    len += this.baseCoords[i].len;
  }

  var loc = t * len;
  var cur = 0;
  for(i = 1; i < this.baseCoords.length; i++) {
    if(loc < cur + this.baseCoords[i].len) {
      var t2 = (loc - cur) / this.baseCoords[i].len;

      if(coords[i].arc) {

        // vector from the elbow point to the arc center
        var vx = this.toVector.x - this.fromVector.x;
        var vy = -this.toVector.y + this.fromVector.y;

        // normalize the vector 
        var d = Math.sqrt(vx * vx + vy * vy);
        vx = vx / d;
        vy = vy / d;        

        var theta = Math.PI * coords[i].arc / 180;
        var chordLen = Util.distance(coords[i].x, coords[i].y, coords[i -1].x, coords[i -1].y);
        var r = Util.getRadiusFromAngleChord(theta, chordLen);

        var mx = (coords[i].x + coords[i -1].x) / 2;
        var my = (coords[i].y + coords[i -1].y) / 2;
        var h = r * Math.cos(theta/2);

        var cx = mx + vx * h;
        var cy = my + vy * h;

        /*console.log(coords);
        console.log(this.fromVector);
        console.log(this.toVector);
        console.log('v: ' + vx + ', ' + vy);
        console.log('theta=' + theta + ', cl='+chordLen);
        console.log('h= ' + h + ', r=' + r);
        console.log('mxy: ' + mx + ', ' + my);
        console.log('center: ' + cx + ', ' + cy);*/
        var th1 = Util.getVectorAngle(coords[i -1].x - cx, coords[i -1].y - cy);
        var th2 = Util.getVectorAngle(coords[i].x - cx, coords[i].y - cy);
        var th = th1 + (th2 - th1) * t2;

        //if(th2 < th1) th1 += 2*Math.PI;
        //console.log('th range: ' + th1 + ' to ' + th2);
        //console.log('t2=' + t2 + ', th=' + th);

        return {
          x : cx + r * Math.cos(th),
          y : cy + r * Math.sin(th)
        };

      }
      else {
        var dx = coords[i].x - coords[i-1].x;
        var dy = coords[i].y - coords[i-1].y;

        return {
          x : coords[i-1].x + dx * t2,
          y : coords[i-1].y + dy * t2
        };
      }
    }
    cur += this.baseCoords[i].len;
  }

};


Edge.prototype.clearRenderData = function() {
  this.baseCoords = null;
};





Edge.prototype.getCurvaturePoints = function(fromOffsetX, fromOffsetY, toOffsetX, toOffsetY) {

  var offsetPoints = [];

  var offsets = this.getCurveOffsets(fromOffsetX, fromOffsetY, toOffsetX, toOffsetY);

  offsetPoints.push({
    x: this.curvaturePoints[0].x,
    y: this.curvaturePoints[0].y,
    offsetX: fromOffsetX + toOffsetX, //offsets.x,
    offsetY: fromOffsetY + toOffsetY //offsets.y
  });

  offsetPoints.push({
    x: this.curvaturePoints[1].x,
    y: this.curvaturePoints[1].y,
    arc: this.curvaturePoints[1].arc,
    offsetX: fromOffsetX + toOffsetX, //offsets.x,
    offsetY: fromOffsetY + toOffsetY //offsets.y
  });

  return offsetPoints;
};

Edge.prototype.renderInternalPoints = function(segment, fromOffsetX, fromOffsetY, toOffsetX, toOffsetY) {

  var pointInfo, pointIndex = 1;

  this.pointArray.forEach(function (point, i) {
    var t = (i + 1) / (this.pointArray.length + 1);
    //console.log(point);
    if(this.curvaturePoints.length > 0) {
      pointInfo = this.pointAlongEdgeCurve(t, fromOffsetX, fromOffsetY, toOffsetX, toOffsetY, point.getId() === '8040');
    }
    else {
      pointInfo = this.pointAlongEdge(t);
      pointInfo.offsetX = fromOffsetX;
      pointInfo.offsetY = fromOffsetY;
    }
    pointInfo.segment = segment;
    pointInfo.path = this.paths[0];
    pointInfo.point = point;
    pointInfo.inEdge = pointInfo.outEdge = this;
    pointInfo.index = pointIndex++;

    point.addRenderData(pointInfo);
  }, this);
};


/**
 *
 */

Edge.prototype.pointAlongEdge = function(t) {
  var x = this.fromVertex.x + t * (this.toVertex.x - this.fromVertex.x);
  var y = this.fromVertex.y + t * (this.toVertex.y - this.fromVertex.y);
  return {
    x: x,
    y: y
  };
};


Edge.prototype.pointAlongEdgeCurve = function(t, fromOffsetX, fromOffsetY, toOffsetX, toOffsetY, debug) {
  var fx = this.fromVertex.x, fy = this.fromVertex.y;
  var tx = this.toVertex.x, ty = this.toVertex.y;
  var dx = tx - fx, dy = ty - fy;
  var c0x = this.curvaturePoints[0].x, c0y = this.curvaturePoints[0].y;
  var c1x = this.curvaturePoints[1].x, c1y = this.curvaturePoints[1].y;
  var elbow = this.getCurveElbow();
  var leg0len = Math.sqrt((c0x - fx) * (c0x - fx) + (c0y - fy) * (c0y - fy));
  var leg1len = Math.sqrt((tx - c1x) * (tx - c1x) + (ty - c1y) * (ty - c1y));

  var r = this.radius;

  var curvelen = Math.PI * r / 2;
  var len = leg0len + leg1len + curvelen;

  var pos = t * len;

  if(pos <= leg0len) {
    return {
      x: fx + (c0x - fx) * (pos / leg0len),
      y: fy + (c0y - fy) * (pos / leg0len),
      offsetX: fromOffsetX,
      offsetY: fromOffsetY
    };
  }

  if(pos >= len - leg1len) {
    return {
      x: c1x + (tx - c1x) * ((pos - leg0len - curvelen) / leg1len),
      y: c1y + (ty - c1y) * ((pos - leg0len - curvelen) / leg1len),
      offsetX: toOffsetX,
      offsetY: toOffsetY
    };
  }

  var ct = (pos - leg0len) / curvelen;

  var cx = (this.fromVector.x !== 0) ? c0x : c1x;
  var cy = (this.fromVector.x !== 0) ? c1y : c0y;

  var theta = this.getCurveTheta(ct);

  var offsets = this.getCurveOffsets(fromOffsetX, fromOffsetY, toOffsetX, toOffsetY);

  var p = {
    x: cx + r * Math.cos(theta),
    y: cy + r * Math.sin(theta),
    offsetX: offsets.x,
    offsetY: offsets.y
  };

  return p;
};


Edge.prototype.getCurveTheta = function(ct) {
  if(this.fromVector.x > 0 && this.curveAngle < 0) return (1 - ct) * Math.PI/2;
  if(this.fromVector.x > 0 && this.curveAngle > 0) return (3 + ct) * Math.PI/2;

  if(this.fromVector.y > 0 && this.curveAngle < 0) return (2 - ct) * Math.PI/2;
  if(this.fromVector.y > 0 && this.curveAngle > 0) return ct * Math.PI/2;

  if(this.fromVector.x < 0 && this.curveAngle < 0) return (3 - ct) * Math.PI/2;
  if(this.fromVector.x < 0 && this.curveAngle > 0) return (1 + ct) * Math.PI/2;

  if(this.fromVector.y < 0 && this.curveAngle < 0) return (4 - ct) * Math.PI/2;
  if(this.fromVector.y < 0 && this.curveAngle > 0) return (2 + ct) * Math.PI/2;
};

Edge.prototype.getCurveOffsets = function(fromOffsetX, fromOffsetY, toOffsetX, toOffsetY) {
  var elbow = this.getCurveElbow();
  var xOffset = 0, yOffset = 0;

  if(elbow && elbow.y === this.fromVertex.y) {
    yOffset = fromOffsetY;
    xOffset = toOffsetX;
  }
  else if(elbow && elbow.x === this.fromVertex.x) {
    yOffset = toOffsetY;
    xOffset = fromOffsetX;
  }

  return {
    x: xOffset,
    y: yOffset
  };
};


Edge.prototype.pointAlongEdgeCurveX = function(t, r) {
  var dx = this.toVertex.x - this.fromVertex.x;
  var dy = this.toVertex.y - this.fromVertex.y;
  var len = Math.abs(dx) + Math.abs(dy) - 2 * r + Math.PI * r / 2;

  var pos = t * len;
  var curveStartPos = Math.abs(dx) - r, curveEndPos = len - (Math.abs(dy) - r);
  if(pos <= curveStartPos) {
    return {
      x: this.fromVertex.x + (dx / Math.abs(dx)) * pos,
      y: this.fromVertex.y
    };
  }
  if(pos >= curveEndPos) {
    return {
      x: this.toVertex.x,
      y: this.toVertex.y - (dy / Math.abs(dy)) * (len - pos)
    };
  }

  var ct = (pos - curveStartPos) / (curveEndPos - curveStartPos);

  var cx = this.toVertex.x - r * (dx / Math.abs(dx));
  var cy = this.fromVertex.y + r * (dy / Math.abs(dy));
  var theta = 0;

  if(dx > 0 && dy > 0) theta = (3 + ct) * (Math.PI / 2);
  if(dx > 0 && dy < 0) theta = (1 - ct) * (Math.PI / 2);
  if(dx < 0 && dy > 0) theta = (3 - ct) * (Math.PI / 2);
  if(dx < 0 && dy < 0) theta = (1 + ct) * (Math.PI / 2);

  return {
    x: cx + r * Math.cos(theta),
    y: cy + r * Math.sin(theta)
  };

};


Edge.prototype.getVector = function(vertex) {
  if(vertex === this.fromVertex) return this.fromVector;
  if(vertex === this.toVertex) return this.toVector;
};


/**
 *  Gets the vertex opposite another vertex on an edge
 */

Edge.prototype.oppositeVertex = function(vertex) {
  if (vertex === this.toVertex) return this.fromVertex;
  if (vertex === this.fromVertex) return this.toVertex;
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
  return this.fromVertex.point.getName() + '_' + this.toVertex.point.getName();
};
