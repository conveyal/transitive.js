var d3 = require('d3');
var each = require('each');

var interpolateLine = require('../util/interpolate-line');
//var SegmentLabel = require('./labeler/segmentlabel');
var Util = require('../util');

var rEdgeId = 0;

/**
 * Expose `RenderedEdge`
 */

module.exports = RenderedEdge;

/**
 *
 */

function RenderedEdge(edge, type) {
  this.id = rEdgeId++;
  this.graphEdge = edge;
  this.type = type;
  this.points = [];
  this.clearOffsets();
  this.focused = true;

  //this.label = new SegmentLabel(this);
  //this.renderLabel = true;

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
  /*var patternIdArr = [];
  each(this.patterns, function(pattern) { patternIdArr.push(pattern.getId()); });
  patternIdArr.sort();
  this.patternIds = patternIdArr.join(',');*/
  this.patternIds = constuctIdListString(this.patterns);
};

RenderedEdge.prototype.addPathSegment = function(pathSegment) {
  if (!this.pathSegments) this.pathSegments = [];
  if (this.pathSegments.indexOf(pathSegment) !== -1) return;
  this.pathSegments.push(pathSegment);

  // generate the patternIds field
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

/**
 * Render
 */

/*RenderedEdge.prototype.render = function(display, capExtension) {

  // add the line to the NetworkPath

  this.line = d3.svg.line() // the line translation function
  .x(function(data, i) {
    return data.x;
  })
    .y(function(data, i) {
      return data.y;
    })
    .interpolate(interpolateLine.bind({
      segment: this,
      display: display
    }));

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
};*/

RenderedEdge.prototype.setFocused = function(focused) {
  this.focused = focused;
};

/**
 * Refresh
 */

/*RenderedEdge.prototype.refresh = function(display) {
  var lineData = this.line(this.renderData);
  this.lineGraph.attr('d', lineData);
  this.lineGraphFront.attr('d', lineData);
  if(this.lineGraphHalo) this.lineGraphHalo.attr('d', lineData);
  display.styler.renderSegment(display, this);
};*/

RenderedEdge.prototype.refreshRenderData = function(display) {

  this.lineWidth = this.computeLineWidth(display, true);

  var fromOffsetPx = this.fromOffset * this.lineWidth;
  var toOffsetPx = this.toOffset * this.lineWidth;

  if (this.graphEdge.geomCoords) {
    this.renderData = this.graphEdge.getGeometricCoords(display);
  } else {
    this.renderData = this.graphEdge.getRenderCoords(fromOffsetPx, toOffsetPx,
      display);
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

/*RenderedEdge.prototype.refreshLabel = function(display) {
  if (!this.renderLabel) return;
  this.label.refresh(display);
};*/

/*RenderedEdge.prototype.compareTo = function(other) {

  // show transit segments in front of other types
  if (this.type === 'TRANSIT' && other.type !== 'TRANSIT') return -1;
  if (other.type === 'TRANSIT' && this.type !== 'TRANSIT') return 1;

  if (this.type === 'TRANSIT' && other.type === 'TRANSIT') {

    // for two transit segments, try sorting transit mode first
    if (this.mode && other.mode && this.mode !== other.mode) {
      return (this.mode > other.mode);
    }

    // for two transit segments of the same mode, sort by id (for display consistency)
    return (this.getId() < other.getId());
  }
};*/

RenderedEdge.prototype.isFocused = function() {
  return (this.focused === true);
};

RenderedEdge.prototype.getZIndex = function() {
  return 10000;
};

/**
 *  Computes the point of intersection between two adjacent, offset segments (the
 *  segment the function is called on and a second segment passed as a parameter)
 *  by "extending" the adjacent segments and finding the point of intersection. If
 *  such a point exists, the existing renderData arrays for the segments are
 *  adjusted accordingly, as are any associated stops.
 */

RenderedEdge.prototype.intersect = function(segment) {

  var commonVertex = this.graphEdge.commonVertex(segment.graphEdge);
  if (!commonVertex || commonVertex.point.isSegmentEndPoint) return;

  var p1 = (commonVertex === this.graphEdge.fromVertex) ? this.renderData[0] :
    this.renderData[this.renderData.length - 1];
  var v1 = this.graphEdge.getVector(commonVertex);

  var p2 = (commonVertex === segment.graphEdge.fromVertex) ? segment.renderData[
    0] : segment.renderData[segment.renderData.length - 1];
  var v2 = segment.graphEdge.getVector(commonVertex);

  if (p1.x === p2.x && p1.y === p2.y) return;

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

/*
RenderedEdge.prototype.getLabelAnchors = function(display, spacing) {

  var labelAnchors = [];

  var renderLen = this.graphEdge.getRenderLength(display);
  var anchorCount = Math.floor(renderLen/spacing);
  var pctSpacing = spacing/renderLen;

  for(var i = 0; i < anchorCount; i++) {
    var t = (i % 2 === 0) ?
      0.5 + (i/2)* pctSpacing :
      0.5 - ((i+1)/2) * pctSpacing;
    labelAnchors.push(this.graphEdge.coordAlongEdge(t, this.renderData, display));
  }

  return labelAnchors;

};

RenderedEdge.prototype.getLabelTextArray = function() {
  var textArray = [];
  each(this.patterns, function(pattern) {
    var shortName = pattern.route.route_short_name;
    if(textArray.indexOf(shortName) === -1) textArray.push(shortName);
  });
  return textArray;
};*/

RenderedEdge.prototype.toString = function() {
  return 'RenderedEdge ' + this.id + ' type=' + this.type + ' on ' + this.graphEdge
    .toString();
};
