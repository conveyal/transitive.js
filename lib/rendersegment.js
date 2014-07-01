var d3 = require('d3');
var each = require('each');

var interpolateLine = require('./interpolate-line');
var SegmentLabel = require('./labeler/segmentlabel');
var Util = require('./util');

var segmentId = 0;

/**
 * Expose `RenderSegment`
 */

module.exports = RenderSegment;

/**
 *
 */

function RenderSegment(edge, type) {
  this.id = segmentId++;
  this.graphEdge = edge;
  this.type = type;
  this.points = [];
  this.clearOffsets();
  this.focused = true;

  this.label = new SegmentLabel(this);
  this.renderLabel = true;

  this.sortableType = 'SEGMENT';

}

RenderSegment.prototype.clearGraphData = function() {
  this.graphEdge = null;
  this.edgeFromOffset = 0;
  this.edgeToOffset = 0;
};

RenderSegment.prototype.getId = function() {
  return this.id;
};

RenderSegment.prototype.getType = function() {
  return this.type;
};

RenderSegment.prototype.getLegendType = function() {
  if (this.type === 'TRANSIT' && this.pattern && this.pattern.route) {
    return this.type + '_' + this.pattern.route.route_type;
  }
  return this.type;
};

RenderSegment.prototype.setFromOffset = function(offset) {
  this.fromOffset = offset;
};

RenderSegment.prototype.setToOffset = function(offset) {
  this.toOffset = offset;
};

RenderSegment.prototype.clearOffsets = function() {
  this.fromOffset = 0;
  this.toOffset = 0;
};

RenderSegment.prototype.offsetAlignment = function(alignmentId, offset) {

  if (this.graphEdge.getFromAlignmentId() === alignmentId) {
    this.setFromOffset(Util.isOutwardVector(this.graphEdge.fromVector) ? offset :
      -offset);
  }
  if (this.graphEdge.getToAlignmentId() === alignmentId) {
    this.setToOffset(Util.isOutwardVector(this.graphEdge.toVector) ? offset : -
      offset);
  }
};

/**
 * Render
 */

RenderSegment.prototype.render = function(display, capExtension) {

  // add the line to the NetworkPath

  this.line = d3.svg.line() // the line translation function
  .x(function(data, i) {
    return data.x;
  })
    .y(function(data, i) {
      return data.y;
    })
    .interpolate(interpolateLine.bind(this));

  this.svgGroup = display.svg.append('g');

  this.lineSvg = this.svgGroup.append('g')
    .attr('class', 'transitive-sortable')
    .datum({
      owner: this,
      sortableType: 'SEGMENT'
    });

  this.labelSvg = this.svgGroup.append('g');

  this.lineGraph = this.lineSvg.append('path');

  this.lineGraph
    .attr('class', 'transitive-line')
    .data([this]);

  this.lineGraphFront = this.lineSvg.append('path');

  this.lineGraphFront
    .attr('class', 'transitive-line-front')
    .data([this]);


  if(display.haloLayer) {
    this.lineGraphHalo = display.haloLayer.append('path');

    this.lineGraphHalo
      .attr('class', 'transitive-line-halo')
      .data([this]);
  }
};

RenderSegment.prototype.setFocused = function(focused) {
  this.focused = focused;
};

/**
 * Refresh
 */

RenderSegment.prototype.refresh = function(display) {

  this.lineGraph.attr('d', this.line(this.renderData));
  this.lineGraphFront.attr('d', this.line(this.renderData));
  if(this.lineGraphHalo) this.lineGraphHalo.attr('d', this.line(this.renderData));
  display.styler.renderSegment(display, this);
};

RenderSegment.prototype.refreshRenderData = function(display) {

  if (this.getType() === 'WALK') {

    this.renderData = [];

    var fromPt = this.graphEdge.fromVertex.point;
    var toPt = this.graphEdge.toVertex.point;

    if (fromPt.hasRenderData()) {
      this.renderData.push(fromPt.getAverageCoord());
    } else {
      this.renderData.push({
        x: this.graphEdge.fromVertex.getRenderX(display),
        y: this.graphEdge.fromVertex.getRenderY(display)
      });
    }

    if (toPt.hasRenderData()) {
      this.renderData.push(toPt.getAverageCoord());
    } else {
      this.renderData.push({
        x: this.graphEdge.toVertex.getRenderX(display),
        y: this.graphEdge.toVertex.getRenderY(display)
      });
    }

  } else {
    this.lineWidth = this.computeLineWidth(display, true);

    var fromOffsetPx = this.fromOffset * this.lineWidth;
    var toOffsetPx = this.toOffset * this.lineWidth;

    this.renderData = this.graphEdge.getRenderCoords(fromOffsetPx, toOffsetPx,
      display, (this.id === 1));
  }

  if (!this.graphEdge.fromVertex.isInternal) {
    this.graphEdge.fromVertex.point.addRenderData({
      x: this.renderData[0].x,
      y: this.renderData[0].y,
      segment: this
    });
  }

  this.graphEdge.toVertex.point.addRenderData({
    x: this.renderData[this.renderData.length - 1].x,
    y: this.renderData[this.renderData.length - 1].y,
    segment: this
  });

  each(this.graphEdge.pointArray, function(point, i) {
    var t = (i + 1) / (this.graphEdge.pointArray.length + 1);
    var coord = this.graphEdge.coordAlongEdge(t, this.renderData, display);
    if (coord) {
      point.addRenderData({
        x: coord.x,
        y: coord.y,
        segment: this
      });
    }
  }, this);

};

RenderSegment.prototype.computeLineWidth = function(display, includeEnvelope) {
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

RenderSegment.prototype.refreshLabel = function(display) {
  if (!this.renderLabel) return;
  this.label.refresh(display);
};

RenderSegment.prototype.getLabelAnchors = function(display) {

  var labelAnchors = [];
  var x, x1, x2, y, y1, y2;

  if (this.renderData.length === 2) { // basic straight segment
    labelAnchors.push({
      x: (this.renderData[0].x + this.renderData[1].x) / 2,
      y: (this.renderData[0].y + this.renderData[1].y) / 2
    });
  }

  if (this.renderData.length === 4) { // basic curved segment

    if (this.renderData[1].len > this.renderData[3].len) {
      labelAnchors.push({
        x: (this.renderData[0].x + this.renderData[1].x) / 2,
        y: (this.renderData[0].y + this.renderData[1].y) / 2
      });
    } else {
      labelAnchors.push({
        x: (this.renderData[2].x + this.renderData[3].x) / 2,
        y: (this.renderData[2].y + this.renderData[3].y) / 2
      });
    }

  }

  return labelAnchors;

};

RenderSegment.prototype.compareTo = function(other) {

  // if segments are equal, then we are comparing the main and foreground elements
  if (this === other) {
    console.log('eq seg');
  }

  // show transit segments in front of other types
  if (this.type === 'TRANSIT' && other.type !== 'TRANSIT') return 1;
  if (other.type === 'TRANSIT' && this.type !== 'TRANSIT') return -1;

  if (this.type === 'TRANSIT' && other.type === 'TRANSIT') {

    // for two transit segments, try sorting transit mode first
    if (this.pattern.route && other.pattern.route && this.pattern.route.route_type !==
      other.pattern.route.route_type) {
      return (this.pattern.route.route_type < other.pattern.route.route_type);
    }

    // for two transit segments of the same mode, sort by id (for display consistency)
    return (this.getId() < other.getId());
  }
};

RenderSegment.prototype.isFocused = function() {
  return (this.focused === true);
};

RenderSegment.prototype.getZIndex = function() {
  return this.zIndex;
};

/**
 *  Computes the point of intersection between two adjacent, offset segments (the
 *  segment the function is called on and a second segment passed as a parameter)
 *  by "extending" the adjacent segments and finding the point of intersection. If
 *  such a point exists, the existing renderData arrays for the segments are
 *  adjusted accordingly, as are any associated stops.
 */

RenderSegment.prototype.intersect = function(segment) {

  var commonVertex = this.graphEdge.commonVertex(segment.graphEdge);
  if (!commonVertex || commonVertex.point.isSegmentEndPoint) return;

  var p1 = (commonVertex === this.graphEdge.fromVertex) ? this.renderData[0] :
    this.renderData[this.renderData.length - 1];
  var v1 = this.graphEdge.getVector(commonVertex);

  var p2 = (commonVertex === segment.graphEdge.fromVertex) ? segment.renderData[
    0] : segment.renderData[segment.renderData.length - 1];
  var v2 = segment.graphEdge.getVector(commonVertex);

  var isect = Util.lineIntersection(p1.x, p1.y, p1.x + v1.x, p1.y - v1.y, p2.x,
    p2.y, p2.x + v2.x, p2.y - v2.y);

  if (!isect.intersect) return;

  // adjust the endpoint of the first edge
  if (commonVertex === this.graphEdge.fromVertex) {
    this.renderData[0].x = isect.x;
    this.renderData[0].y = isect.y;
  } else {
    this.renderData[this.renderData.length - 1].x = isect.x;
    this.renderData[this.renderData.length - 1].y = isect.y;
  }

  // adjust the endpoint of the second edge
  if (commonVertex === segment.graphEdge.fromVertex) {
    segment.renderData[0].x = isect.x;
    segment.renderData[0].y = isect.y;
  } else {
    segment.renderData[segment.renderData.length - 1].x = isect.x;
    segment.renderData[segment.renderData.length - 1].y = isect.y;
  }

  // update the point renderData
  commonVertex.point.addRenderData({
    x: isect.x,
    y: isect.y,
    segment: this
  });

};
