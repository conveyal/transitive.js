/**
 * Dependencies
 */

var d3 = require('d3');
var each = require('each');

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
  if(this.type === 'TRANSIT' && this.pattern && this.pattern.route) {
    return this.type + '_' + this.pattern.route.route_type;
  }
  return this.type;
};


RenderSegment.prototype.setFromOffset = function(offset) {
  this.fromOffset = offset;
};

RenderSegment.prototype.setToOffset = function(offset) {
  this.toOffset  = offset;
};

RenderSegment.prototype.clearOffsets = function() {
  this.fromOffset = 0;
  this.toOffset = 0;
};

/*RenderSegment.prototype.offsetAxis = function(axisId, offset) {
  var axisInfo = axisId.split('_');
  var axisVal = parseFloat(axisInfo[1]);

  if(axisInfo[0] === 'y') {
    if(axisVal === this.graphEdge.fromVertex.y && this.graphEdge.fromVector.y === 0) {
      this.setFromOffset(offset);
    }
    if(axisVal === this.graphEdge.toVertex.y && this.graphEdge.toVector.y === 0) {
      this.setToOffset(offset);
    }
  }

  if(axisInfo[0] === 'x') {
    if(axisVal === this.graphEdge.fromVertex.x && this.graphEdge.fromVector.x === 0) {
      this.setFromOffset(offset);
    }
    if(axisVal === this.graphEdge.toVertex.x && this.graphEdge.toVector.x === 0) {
      this.setToOffset(offset);
    }
  }
};*/

RenderSegment.prototype.offsetAlignment = function(alignmentId, offset) {

  if(this.graphEdge.getFromAlignmentId() === alignmentId) {
    this.setFromOffset(Util.isOutwardVector(this.graphEdge.fromVector) ? offset : -offset);
  }
  if(this.graphEdge.getToAlignmentId() === alignmentId) {
    this.setToOffset(Util.isOutwardVector(this.graphEdge.toVector) ? offset : -offset);
  }
};


/**
 * Render
 */

RenderSegment.prototype.render = function(display, capExtension) {
  //var stops = this.points;

  // add the line to the NetworkPath
  this.line = d3.svg.line() // the line translation function
    /*.x(function (pointInfo, i) {
      var vx = pointInfo.x, x;

      x = display.xScale(vx);

      if (pointInfo.offsetX) {
        x += pointInfo.offsetX;
      }

      return x;
    })
    .y(function (pointInfo, i) {
      var vy = pointInfo.y, y;

      y = display.yScale(vy);

      if (pointInfo.offsetY) {
        y -= pointInfo.offsetY;
      }

      return y;
    })*/
    .x(function (data, i) {
      return data.x;
    })
    .y(function (data, i) {
      return data.y;
    })
    .interpolate(display.lineInterpolator.bind(this));

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
    //.attr('id', 'transitive-path-' +this.parent.getElementId())
    .attr('class', 'transitive-line')
    .data([this]);
    //.data([{ owner: this, element : this.lineGraph }]);

  this.lineGraphFront = this.lineSvg.append('path');

  this.lineGraphFront
    .attr('class', 'transitive-line-front')
    .data([this]);
    //.data([{ owner: this, element: this.lineGraphFront }]);
};


RenderSegment.prototype.setFocused = function(focused) {
  this.focused = focused;
};


/**
 * Refresh
 */

RenderSegment.prototype.refresh = function(display) {

  this.lineGraph.attr('d', this.line(this.renderData)); //this.renderData));
  this.lineGraphFront.attr('d', this.line(this.renderData)); //this.renderData));
  display.styler.renderSegment(display, this);
};


RenderSegment.prototype.refreshRenderData = function(display) {


  if(this.getType() === 'WALK') {

    this.renderData = [];    
    
    var fromPt = this.graphEdge.fromVertex.point;
    var toPt = this.graphEdge.toVertex.point;

    if(fromPt.hasRenderData()) {
      this.renderData.push(fromPt.getAverageCoord());
    }
    else {
      this.renderData.push({
        x : display.xScale(this.graphEdge.fromVertex.x),
        y : display.yScale(this.graphEdge.fromVertex.y)
      });
    }

    if(toPt.hasRenderData()) {
      this.renderData.push(toPt.getAverageCoord());
    }
    else {
      this.renderData.push({
        x : display.xScale(this.graphEdge.toVertex.x),
        y : display.yScale(this.graphEdge.toVertex.y)
      });
    }

  }
  
  else {
    this.computeLineWidth(display);

    var fromOffsetPx = this.fromOffset * this.lineWidth;
    var toOffsetPx = this.toOffset * this.lineWidth;


    this.renderData = this.graphEdge.getRenderCoords(fromOffsetPx, toOffsetPx, display);
    //console.log(this.renderData);
  }

  this.graphEdge.fromVertex.point.addRenderData({
    x: this.renderData[0].x,
    y: this.renderData[0].y,
    segment: this
  });

  this.graphEdge.toVertex.point.addRenderData({
    x: this.renderData[this.renderData.length-1].x,
    y: this.renderData[this.renderData.length-1].y,
    segment: this
  });

  each(this.graphEdge.pointArray, function(point, i) {
    var t = (i + 1) / (this.graphEdge.pointArray.length + 1);
    var coord = this.graphEdge.coordAlongEdge(t, this.renderData, display);
    if(coord) {
      point.addRenderData({
        x: coord.x,
        y: coord.y,
        segment: this
      });
    }
  }, this);

};

/*RenderSegment.prototype.refreshRenderData = function(updatePoints, styler, display) {
  
  this.computeLineWidth(styler, display);

  this.renderData = [];
  var pointIndex = 0;

  var edgeRenderData = [];

  var pointInfo;

  //var fromOffsetX = 0, fromOffsetY = 0, toOffsetX = 0, toOffsetY = 0;

  var fromOffset = this.fromOffset * this.lineWidth;
  var fromOffsetX = fromOffset * this.graphEdge.fromRightVector.x;
  var fromOffsetY = fromOffset * this.graphEdge.fromRightVector.y;

  var toOffset = this.toOffset * this.lineWidth;
  var toOffsetX = toOffset * this.graphEdge.toRightVector.x;
  var toOffsetY = toOffset * this.graphEdge.toRightVector.y;

  if(this.getType() === 'WALK') {

    var fromOffsets = getAveragePointOffsets(this.points[0]);
    if(fromOffsets) {
      fromOffsetX = fromOffsets.x;
      fromOffsetY = fromOffsets.y;
    }

    var toOffsets = getAveragePointOffsets(this.points[this.points.length - 1]);
    if(toOffsets) {
      toOffsetX = toOffsets.x;
      toOffsetY = toOffsets.y;
    }
  }

  // the "from" vertex point for this edge
  pointInfo = {
    segment: this,
    path: this.graphEdge.paths[0],
    x: this.graphEdge.fromVertex.x,
    y: this.graphEdge.fromVertex.y,
    point: this.graphEdge.fromVertex.point,
    inEdge: null,
    outEdge: this.graphEdge,
    index: pointIndex++,
    offsetX: fromOffsetX,
    offsetY: fromOffsetY
  };

  edgeRenderData.push(pointInfo);

  if(updatePoints) this.graphEdge.fromVertex.point.addRenderData(pointInfo);


  // the internal points for this edge
  if(this.getType() !== 'WALK' && this.graphEdge.curvaturePoints && this.graphEdge.curvaturePoints.length > 0) {
    var cpoints = this.graphEdge.getCurvaturePoints(fromOffsetX, fromOffsetY, toOffsetX, toOffsetY);
    edgeRenderData = edgeRenderData.concat(cpoints);
  }

  if(updatePoints) this.graphEdge.renderInternalPoints(this, fromOffsetX, fromOffsetY, toOffsetX, toOffsetY);


  // the "to" vertex point for this edge.

  pointInfo = {
    segment: this,
    path: this.graphEdge.paths[0],
    x: this.graphEdge.toVertex.x,
    y: this.graphEdge.toVertex.y,
    point: this.graphEdge.toVertex.point,
    index: pointIndex,
    offsetX: toOffsetX,
    offsetY: toOffsetY
  };

  edgeRenderData.push(pointInfo);

  if(updatePoints) this.graphEdge.toVertex.point.addRenderData(pointInfo);

  this.renderData = this.renderData.concat(edgeRenderData);

};*/


RenderSegment.prototype.computeLineWidth = function(display) {
  var styler = display.styler;
  if(styler && display) {
    // compute the line width
    var env = styler.compute(styler.segments.envelope, display, this);
    if(env) {
      this.lineWidth = parseFloat(env.substring(0, env.length - 2), 10) - 2;
    }
    else {
      var lw = styler.compute(styler.segments['stroke-width'], display, this);
      this.lineWidth = parseFloat(lw.substring(0, lw.length - 2), 10) - 2;
    }
  }
};


RenderSegment.prototype.refreshLabel = function(display) {
  if(!this.renderLabel) return;
  this.label.refresh(display);
};



RenderSegment.prototype.getLabelAnchors = function(display) {

  var labelAnchors = [];
  var x, x1, x2, y, y1, y2;


  if(this.renderData.length === 2) { // basic straight segment
    labelAnchors.push({ 
      x: (this.renderData[0].x + this.renderData[1].x) / 2, 
      y: (this.renderData[0].y + this.renderData[1].y) / 2
    });
    /*if(this.renderData[0].x === this.renderData[1].x) { // vertical
      x = display.xScale(this.renderData[0].x) + this.renderData[0].offsetX;
      y1 = display.yScale(this.renderData[0].y);
      y2 = display.yScale(this.renderData[1].y);
      labelAnchors.push({ x : x, y: (y1 + y2) / 2 });
    }
    else if(this.renderData[0].y === this.renderData[1].y) { // horizontal
      x1 = display.xScale(this.renderData[0].x);
      x2 = display.xScale(this.renderData[1].x);
      y = display.yScale(this.renderData[0].y) - this.renderData[0].offsetY;
      labelAnchors.push({ x : (x1 + x2) / 2, y: y });
    }*/
  }

  if(this.renderData.length === 4) { // basic curved segment

    if(this.renderData[1].len > this.renderData[3].len) {
      labelAnchors.push({ 
        x: (this.renderData[0].x + this.renderData[1].x) / 2, 
        y: (this.renderData[0].y + this.renderData[1].y) / 2
      });      
    }    
    else {
      labelAnchors.push({ 
        x: (this.renderData[2].x + this.renderData[3].x) / 2, 
        y: (this.renderData[2].y + this.renderData[3].y) / 2
      });
    }

    /*if(this.renderData[0].x === this.renderData[1].x) { // vertical first
      x = display.xScale(this.renderData[0].x) + this.renderData[0].offsetX;
      y1 = display.yScale(this.renderData[0].y);
      y2 = display.yScale(this.renderData[3].y);
      labelAnchors.push({ x : x, y: (y1 + y2) / 2 });

    }
    else if(this.renderData[0].y === this.renderData[1].y) { // horiz first
      x1 = display.xScale(this.renderData[0].x);
      x2 = display.xScale(this.renderData[3].x);
      y = display.yScale(this.renderData[0].y) - this.renderData[0].offsetY;
      labelAnchors.push({ x : (x1 + x2) / 2, y: y });
    }*/
  }

  return labelAnchors;

};


RenderSegment.prototype.compareTo = function(other) {

  // if segments are equal, then we are comparing the main and foreground elements
  if(this === other) {
    console.log('eq seg');
  }
  
  // show transit segments in front of other types
  if(this.type === 'TRANSIT' && other.type !== 'TRANSIT') return 1;
  if(other.type === 'TRANSIT' && this.type !== 'TRANSIT') return -1;

  if(this.type === 'TRANSIT' && other.type === 'TRANSIT') {

    // for two transit segments, try sorting transit mode first
    if(this.pattern.route && other.pattern.route && this.pattern.route.route_type !== other.pattern.route.route_type) {
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


function getAveragePointOffsets(point) {
  console.log('foo');
  var count = 0;
  var offsetXTotal = 0, offsetYTotal = 0;

  if(point.patternRenderData) {
    for(var pattern in point.patternRenderData) {
      var patternRenderInfo = point.patternRenderData[pattern];
      offsetXTotal += patternRenderInfo.offsetX;
      offsetYTotal += patternRenderInfo.offsetY;
      count++;
    }
  }
  else if(point.renderData) {
    point.renderData.forEach(function(renderData) {
      offsetXTotal += renderData.offsetX;
      offsetYTotal += renderData.offsetY;
      count++;
    });
  }

  if(count > 0) {
    return {
      x: offsetXTotal / count,
      y: offsetYTotal / count
    };
  }

  return null;
}