
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

  this.calculateVectors();
}

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
  var r = null;
  if(Math.abs(dx) > tol && Math.abs(dy) > tol && Math.abs(Math.abs(dx) - Math.abs(dy)) > tol) {
    r = Math.min(0.005, Math.min(Math.abs(dx), Math.abs(dy)));
    this.curvaturePoints.push({
      x : x2 - r * (dx/Math.abs(dx)),
      y : y1
    });
    this.curvaturePoints.push({
      x : x2,
      y : y1 + r * (dy/Math.abs(dy)),
      arc: 90
    });
  }

  var pointInfo, pointIndex = 1;
  // the internal points for this edge
  this.pointArray.forEach(function (point, i) {
    var t = (i + 1) / (this.pointArray.length + 1);
    if(r) pointInfo = this.pointAlongEdgeCurveX(t, r);
    else pointInfo = this.pointAlongEdge(t);
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
    pointInfo.offsetX = pointInfo.offsetY = 0;
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


/**
 *
 */

Edge.prototype.calculateVectors = function() {
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
};

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
