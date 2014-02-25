
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


Edge.prototype.initCurvature = function() {

  this.curvaturePoints = [];

  // construct the curvature points
  var x1 = this.fromVertex.x, y1 = this.fromVertex.y;
  var x2 = this.toVertex.x, y2 = this.toVertex.y;
  var tol = 0.001;
  var dx = x2 - x1, dy = y2 - y1;
  this.radius = null;
  if(Math.abs(dx) > tol && Math.abs(dy) > tol && Math.abs(Math.abs(dx) - Math.abs(dy)) > tol) {
    this.radius = Math.min(250, Math.min(Math.abs(dx), Math.abs(dy)));
    this.curvaturePoints.push({
      x : x2 - this.radius * (dx/Math.abs(dx)),
      y : y1
    });
    this.curvaturePoints.push({
      x : x2,
      y : y1 + this.radius * (dy/Math.abs(dy)),
      arc: 90
    });
  }



};

Edge.prototype.getCurvaturePoints = function(fromOffsetX, fromOffsetY, toOffsetX, toOffsetY) {
  var offsetPoints = [];

  offsetPoints.push({
    x: this.curvaturePoints[0].x,
    y: this.curvaturePoints[0].y,
    offsetX: 0,
    offsetY: fromOffsetY
  });

  offsetPoints.push({
    x: this.curvaturePoints[1].x,
    y: this.curvaturePoints[1].y,
    arc: this.curvaturePoints[1].arc,
    offsetX: toOffsetX,
    offsetY: fromOffsetY
  });

  return offsetPoints;
};

Edge.prototype.renderInternalPoints = function(segment, fromOffsetX, fromOffsetY, toOffsetX, toOffsetY) {

  var pointInfo, pointIndex = 1;
  // the internal points for this edge
  this.pointArray.forEach(function (point, i) {
    var t = (i + 1) / (this.pointArray.length + 1);
    if(this.radius) pointInfo = this.pointAlongEdgeCurveX(t, this.radius);
    else pointInfo = this.pointAlongEdge(t);
    pointInfo.segment = segment;
    pointInfo.path = this.paths[0];
    pointInfo.point = point;
    pointInfo.inEdge = pointInfo.outEdge = this;
    /*if (edgeInfo.offset) {
      pointInfo.offsetX = edge.rightVector.x * this.lineWidth * edgeInfo.offset;
      pointInfo.offsetY = edge.rightVector.y * this.lineWidth * edgeInfo.offset;
    } else {
      pointInfo.offsetX = pointInfo.offsetY = 0;
    }
    if (edgeInfo.bundleIndex === 0) pointInfo.showLabel = true;*/

    pointInfo.offsetX = fromOffsetX;
    pointInfo.offsetY = fromOffsetY;
    pointInfo.index = pointIndex++;

    //edgeRenderData.push(pointInfo);
    point.addRenderData(pointInfo);
  }, this);
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
  var dx = this.toVertex.x - this.fromVertex.x;
  var dy = this.toVertex.y - this.fromVertex.y;
  var xCellCount = Math.abs(dx) / cellSize;
  var yCellCount = Math.abs(dy) / cellSize;
  
  gridPoints.push([ this.fromVertex.x, this.fromVertex.y ]);

  if(xCellCount !== yCellCount) {

    for(var xc = 1; xc < xCellCount; xc++) {
      gridPoints.push([
        this.fromVertex.x + xc * cellSize * (dx / Math.abs(dx)),
        this.fromVertex.y
      ]);
    }

    if(xCellCount > 0 && yCellCount > 0) {
      gridPoints.push([ this.toVertex.x, this.fromVertex.y ]);
    }

    for(var yc = 1; yc < yCellCount; yc++) {
      gridPoints.push([
        this.toVertex.x,
        this.fromVertex.y + yc * cellSize * (dy / Math.abs(dy)),
      ]);
    }
  }

  gridPoints.push([ this.toVertex.x, this.toVertex.y ]);

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
