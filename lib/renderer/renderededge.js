var d3 = require('d3');
var each = require('component-each');

var interpolateLine = require('../util/interpolate-line');
var Util = require('../util');

var rEdgeId = 0;

/**
 * Expose `RenderedEdge`
 */

module.exports = RenderedEdge;

/**
 *
 */

function RenderedEdge(graphEdge, forward, type) {
  this.id = rEdgeId++;
  this.graphEdge = graphEdge;
  this.forward = forward;
  this.type = type;
  this.points = [];
  this.clearOffsets();
  this.focused = true;
  this.sortableType = 'SEGMENT';
}

RenderedEdge.prototype.clearGraphData = function() {
  this.graphEdge = null;
  this.edgeFromOffset = 0;
  this.edgeToOffset = 0;
};

RenderedEdge.prototype.addPattern = function(pattern) {
  if (!this.patterns) this.patterns = [];
  if (this.patterns.indexOf(pattern) !== -1) return;
  this.patterns.push(pattern);

  // generate the patternIds field
  this.patternIds = constuctIdListString(this.patterns);
};

RenderedEdge.prototype.addPathSegment = function(pathSegment) {
  if (!this.pathSegments) this.pathSegments = [];
  if (this.pathSegments.indexOf(pathSegment) !== -1) return;
  this.pathSegments.push(pathSegment);

  // generate the pathSegmentIds field
  this.pathSegmentIds = constuctIdListString(this.pathSegments);
};

function constuctIdListString(items) {
  var idArr = [];
  each(items, function(item) {
    idArr.push(item.getId());
  });
  idArr.sort();
  return idArr.join(',');
}

RenderedEdge.prototype.getId = function() {
  return this.id;
};

RenderedEdge.prototype.getType = function() {
  return this.type;
};

RenderedEdge.prototype.setFromOffset = function(offset) {
  this.fromOffset = offset;
};

RenderedEdge.prototype.setToOffset = function(offset) {
  this.toOffset = offset;
};

RenderedEdge.prototype.clearOffsets = function() {
  this.fromOffset = 0;
  this.toOffset = 0;
};

RenderedEdge.prototype.getAlignmentVector = function(alignmentId) {
  if (this.graphEdge.getFromAlignmentId() === alignmentId) {
    return this.graphEdge.fromVector;
  }
  if (this.graphEdge.getToAlignmentId() === alignmentId) {
    return this.graphEdge.toVector;
  }
  return null;
};

RenderedEdge.prototype.offsetAlignment = function(alignmentId, offset) {

  if (this.graphEdge.getFromAlignmentId() === alignmentId) {
    this.setFromOffset(Util.isOutwardVector(this.graphEdge.fromVector) ? offset :
      -offset);
  }
  if (this.graphEdge.getToAlignmentId() === alignmentId) {
    this.setToOffset(Util.isOutwardVector(this.graphEdge.toVector) ? offset : -
      offset);
  }
};

RenderedEdge.prototype.setFocused = function(focused) {
  this.focused = focused;
};

RenderedEdge.prototype.refreshRenderData = function(display) {
  if (this.graphEdge.fromVertex.x === this.graphEdge.toVertex.x &&
    this.graphEdge.fromVertex.y === this.graphEdge.toVertex.y) {
    this.renderData = [];
    return;
  }

  this.lineWidth = this.computeLineWidth(display, true);

  var fromOffsetPx = this.fromOffset * this.lineWidth;
  var toOffsetPx = this.toOffset * this.lineWidth;

  if (this.graphEdge.geomCoords) {
    this.renderData = this.graphEdge.getGeometricCoords(fromOffsetPx, toOffsetPx, display, this.forward);
  } else {
    this.renderData = this.graphEdge.getRenderCoords(fromOffsetPx, toOffsetPx,
      display, this.forward);
  }

  var firstRenderPoint = this.renderData[0];
  var lastRenderPoint = this.renderData[this.renderData.length - 1];

  if (!this.graphEdge.fromVertex.isInternal) {
    this.graphEdge.fromVertex.point.addRenderData({
      x: this.forward ? firstRenderPoint.x : lastRenderPoint.x,
      y: this.forward ? firstRenderPoint.y : lastRenderPoint.y,
      rEdge: this
    });
  }

  this.graphEdge.toVertex.point.addRenderData({
    x: this.forward ? lastRenderPoint.x : firstRenderPoint.x,
    y: this.forward ? lastRenderPoint.y : firstRenderPoint.y,
    rEdge: this
  });

  each(this.graphEdge.pointArray, function(point, i) {
    if(point.getType() === 'TURN') return;
    var t = (i + 1) / (this.graphEdge.pointArray.length + 1);
    var coord = this.graphEdge.coordAlongEdge(this.forward ? t : (1 - t),
      this.renderData, display);
    if (coord) {
      point.addRenderData({
        x: coord.x,
        y: coord.y,
        rEdge: this
      });
    }
  }, this);

};

RenderedEdge.prototype.computeLineWidth = function(display, includeEnvelope) {
  var styler = display.styler;
  if (styler && display) {
    // compute the line width
    var env = styler.compute(styler.segments.envelope, display, this);
    if (env && includeEnvelope) {
      return parseFloat(env.substring(0, env.length - 2), 10) - 2;
    } else {
      var lw = styler.compute(styler.segments['stroke-width'], display, this);
      return parseFloat(lw.substring(0, lw.length - 2), 10) - 2;
    }
  }
};

RenderedEdge.prototype.isFocused = function() {
  return (this.focused === true);
};

RenderedEdge.prototype.getZIndex = function() {
  return 10000;
};

/**
 *  Computes the point of intersection between two adjacent, offset RenderedEdges (the
 *  edge the function is called on and a second egde passed as a parameter)
 *  by "extending" the adjacent edges and finding the point of intersection. If
 *  such a point exists, the existing renderData arrays for the edges are
 *  adjusted accordingly, as are any associated stops.
 */

RenderedEdge.prototype.intersect = function(rEdge) {

  // do no intersect adjacent edges of unequal bundle size
  if (this.graphEdge.renderedEdges.length !== rEdge.graphEdge.renderedEdges.length) return;

  var commonVertex = this.graphEdge.commonVertex(rEdge.graphEdge);
  if (!commonVertex || commonVertex.point.isSegmentEndPoint) return;

  var thisCheck = (commonVertex === this.graphEdge.fromVertex && this.forward) || (commonVertex === this.graphEdge.toVertex &&
    !this.forward);
  var otherCheck = (commonVertex === rEdge.graphEdge.fromVertex && rEdge.forward) || (commonVertex === rEdge.graphEdge.toVertex &&
    !rEdge.forward);

  var p1 = (thisCheck) ? this.renderData[0] :
    this.renderData[this.renderData.length - 1];
  var v1 = this.graphEdge.getVector(commonVertex);

  var p2 = (otherCheck) ? rEdge.renderData[
    0] : rEdge.renderData[rEdge.renderData.length - 1];
  var v2 = rEdge.graphEdge.getVector(commonVertex);

  if (p1.x === p2.x && p1.y === p2.y) return;

  var isect = Util.lineIntersection(p1.x, p1.y, p1.x + v1.x, p1.y - v1.y, p2.x,
    p2.y, p2.x + v2.x, p2.y - v2.y);

  if (!isect.intersect) return;

  // adjust the endpoint of the first edge
  if (thisCheck) {
    this.renderData[0].x = isect.x;
    this.renderData[0].y = isect.y;
  } else {
    this.renderData[this.renderData.length - 1].x = isect.x;
    this.renderData[this.renderData.length - 1].y = isect.y;
  }

  // adjust the endpoint of the second edge
  if (otherCheck) {
    rEdge.renderData[0].x = isect.x;
    rEdge.renderData[0].y = isect.y;
  } else {
    rEdge.renderData[rEdge.renderData.length - 1].x = isect.x;
    rEdge.renderData[rEdge.renderData.length - 1].y = isect.y;
  }

  // update the point renderData
  commonVertex.point.addRenderData({
    x: isect.x,
    y: isect.y,
    rEdge: this
  });
};

RenderedEdge.prototype.findExtension = function(vertex) {
  var incidentEdges = vertex.incidentEdges(this.graphEdge);
  var bundlerId = this.patternIds || this.pathSegmentIds;
  for (var e = 0; e < incidentEdges.length; e++) {
    var edgeSegments = incidentEdges[e].renderedEdges;
    for (var s = 0; s < edgeSegments.length; s++) {
      var segment = edgeSegments[s];
      var otherId = segment.patternIds || segment.pathSegmentIds;
      if (bundlerId === otherId) {
        return segment;
      }
    }
  }
};

RenderedEdge.prototype.toString = function() {
  return 'RenderedEdge ' + this.id + ' type=' + this.type + ' on ' + this.graphEdge
    .toString() + ' w/ patterns ' + this.patternIds + ' fwd=' + this.forward;
};
