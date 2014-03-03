
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

function Edge(pointArray, fromVertex, toVertex) {
  this.pointArray = pointArray;
  this.fromVertex = fromVertex;
  this.toVertex = toVertex;
  this.paths = [];
  this.pathSegments = [];

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

Edge.prototype.replaceVertex = function(oldVertex, newVertex) {
  if(oldVertex === this.fromVertex) this.fromVertex = newVertex;
  if(oldVertex === this.toVertex) this.toVertex = newVertex;
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


Edge.prototype.getCurveElbow = function() {
  var x1 = this.fromVertex.x, y1 = this.fromVertex.y;
  var x2 = this.toVertex.x, y2 = this.toVertex.y;
  var dx = x2 - x1, dy = y2 - y1;
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

Edge.prototype.initCurvature = function() {

  this.curvaturePoints = [];

  var elbow = this.getCurveElbow();
  if(elbow === null) return;
  //this.curvaturePoints.push(elbow);

  // construct the curvature points
  var x1 = this.fromVertex.x, y1 = this.fromVertex.y;
  var x2 = this.toVertex.x, y2 = this.toVertex.y;
  var dx = x2 - x1, dy = y2 - y1;
  
  var dex1 = x1- elbow.x, dex2 = x2 - elbow.x, dey1 = y1 - elbow.y, dey2 = y2 - elbow.y;
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
    x : elbow.x + e1Vector.x * this.radius,
    y : elbow.y + e1Vector.y * this.radius
  });
  this.curvaturePoints.push({
    x : elbow.x + e2Vector.x * this.radius,
    y : elbow.y + e2Vector.y * this.radius,
    arc: this.curveAngle
  });
};

Edge.prototype.getCurvaturePoints = function(fromOffsetX, fromOffsetY, toOffsetX, toOffsetY) {
  var offsetPoints = [];

  var offsets = this.getCurveOffsets(fromOffsetX, fromOffsetY, toOffsetX, toOffsetY);

  offsetPoints.push({
    x: this.curvaturePoints[0].x,
    y: this.curvaturePoints[0].y,
    offsetX: offsets.x,
    offsetY: offsets.y
  });

  offsetPoints.push({
    x: this.curvaturePoints[1].x,
    y: this.curvaturePoints[1].y,
    arc: this.curvaturePoints[1].arc,
    offsetX: offsets.x,
    offsetY: offsets.y
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

Edge.prototype.getGridPoints = function(cellSize) {
  var gridPoints = [];

  var elbow = this.getCurveElbow();
  
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
  return gridPoints;
};

Edge.prototype.getXAxisGridPoints = function(cellSize, yValue) {
  var gridPoints = [];
  var dx = this.toVertex.x - this.fromVertex.x;
  var xCellCount = Math.abs(dx) / cellSize;

  for(var xc = 1; xc < xCellCount; xc++) {
    gridPoints.push([
      this.fromVertex.x + xc * cellSize * (dx / Math.abs(dx)),
      yValue
    ]);
  }

  return gridPoints;
};

Edge.prototype.getYAxisGridPoints = function(cellSize, xValue) {
  var gridPoints = [];
  var dy = this.toVertex.y - this.fromVertex.y;
  var yCellCount = Math.abs(dy) / cellSize;

  for(var yc = 1; yc < yCellCount; yc++) {
    gridPoints.push([
      xValue,
      this.fromVertex.y + yc * cellSize * (dy / Math.abs(dy))
    ]);
  }

  return gridPoints;
};

Edge.prototype.calculateGridEdges = function(cellSize) {
  this.gridEdges = [];
  var gridPoints = this.getGridPoints(cellSize);
  for(var i=0; i < gridPoints.length-1; i++) {
    var x1 = gridPoints[i][0], y1 = gridPoints[i][1];
    var x2 = gridPoints[i+1][0], y2 = gridPoints[i+1][1];
    var id = Math.min(x1, x2) + '_' + Math.min(y1, y2) + '_' + Math.max(x1, x2) + '_' + Math.max(y1, y2);
    this.gridEdges.push(id);
  }

  var dx = gridPoints[1][0] - gridPoints[0][0];
  var dy = gridPoints[1][1] - gridPoints[0][1];
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


  var gpLen = gridPoints.length;
  dx = gridPoints[gpLen-1][0] - gridPoints[gpLen-2][0];
  dy = gridPoints[gpLen-1][1] - gridPoints[gpLen-2][1];
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


/**
 *
 */

/*Edge.prototype.calculateVectors = function() {
  var dx = this.fromVertex.x - this.toVertex.x;
  var dy = this.fromVertex.y - this.toVertex.y;
  var l = Math.sqrt(dx * dx + dy * dy);

  this.vector = {
    x: dx / l,
    y : dy / l
  };

  this.leftVector = {
    x : -this.vector.y,
    y : this.vector.x
  };

  this.rightVector = {
    x : this.vector.y,
    y : -this.vector.x
  };
};*/

/**
 *  Add a path that traverses this edge
 */

Edge.prototype.addPath = function(path) {
  if (this.paths.indexOf(path) === -1) this.paths.push(path);
};


Edge.prototype.addPathSegment = function(segment) {
  this.pathSegments.push(segment);
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
  return this.fromVertex.point.getId() + '_' + this.toVertex.point.getId();
};
