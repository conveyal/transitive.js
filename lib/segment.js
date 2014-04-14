/**
 * Dependencies
 */

var d3 = require('d3');

var SegmentLabel = require('./labeler/segmentlabel');


var segmentId = 0;

/**
 * Expose `Segment`
 */

module.exports = Segment;

/**
 * 
 */

function Segment(type) {
  this.id = segmentId++;
  this.type = type;
  this.points = [];
  this.graphEdges = [];
  this.edgeFromOffsets = {};
  this.edgeToOffsets = {};
  this.focused = true;

  this.label = new SegmentLabel(this);
  this.renderLabel = true;

  this.sortableType = 'SEGMENT';

}


Segment.prototype.getId = function() {
  return this.id;
};

Segment.prototype.getType = function() {
  return this.type;
};

Segment.prototype.addEdge = function(edge) {
  this.graphEdges.push(edge);
};


Segment.prototype.removeEdge = function(edge) {
  while(this.graphEdges.indexOf(edge) !== -1) {
    this.graphEdges.splice(this.graphEdges.indexOf(edge), 1);
  }
};


Segment.prototype.getEdgeIndex = function(edge) {
  for(var i = 0; i < this.graphEdges.length; i++) {
    if(this.graphEdges[i].edge === edge) return i;
  }
  return -1;
};


Segment.prototype.getAdjacentEdge = function(edge, vertex) {

  // ensure that edge/vertex pair is valid
  if(edge.toVertex !== vertex && edge.fromVertex !== vertex) return null;

  var index = this.getEdgeIndex(edge);
  if(index === -1) return null;

  // check previous edge
  if(index > 0) {
    var prevEdge = this.graphEdges[index-1].edge;
    if(prevEdge.toVertex === vertex || prevEdge.fromVertex === vertex) return prevEdge;
  }

  // check next edge
  if(index < this.graphEdges.length-1) {
    var nextEdge = this.graphEdges[index+1].edge;
    if(nextEdge.toVertex === vertex || nextEdge.fromVertex === vertex) return nextEdge;
  }

  return null;
};


Segment.prototype.setEdgeFromOffset = function(edge, offset) {
  this.edgeFromOffsets[edge] = offset;
};

Segment.prototype.setEdgeToOffset = function(edge, offset) {
  this.edgeToOffsets[edge] = offset;
};

Segment.prototype.clearOffsets = function() {
  this.edgeFromOffsets = {};
  this.edgeToOffsets = {};
};

Segment.prototype.offsetAxis = function(axisId, offset) {
  var axisInfo = axisId.split('_');
  var axisVal = parseFloat(axisInfo[1]);
  this.graphEdges.forEach(function(graphEdge) {
    
    if(axisInfo[0] === 'y') {
      if(axisVal === graphEdge.fromVertex.y && graphEdge.fromVector.y === 0) {
        this.setEdgeFromOffset(graphEdge, offset);
      }
      if(axisVal === graphEdge.toVertex.y && graphEdge.toVector.y === 0) {
        this.setEdgeToOffset(graphEdge, offset);
      }
    }

    if(axisInfo[0] === 'x') {
      if(axisVal === graphEdge.fromVertex.x && graphEdge.fromVector.x === 0) {
        this.setEdgeFromOffset(graphEdge, offset);
      }
      if(axisVal === graphEdge.toVertex.x && graphEdge.toVector.x === 0) {
        this.setEdgeToOffset(graphEdge, offset);
      }
    }

  }, this);
};


/**
 * Draw
 */

Segment.prototype.draw = function(display, capExtension) {
  //var stops = this.points;

  // add the line to the NetworkPath
  this.line = d3.svg.line() // the line translation function
    .x(function (pointInfo, i) {
      var vx = pointInfo.x, x;

      // if first/last element, extend the line slightly
      var edgeIndex = i === 0
        ? 0
        : i - 1;

      /*if (i === 0) {
        x = display.xScale(vx)
          + capExtension * stopInfo.outEdge.vector.x;
      } else if (i === stops.length-1) {
        x = display.xScale(vx)
          - capExtension * stopInfo.inEdge.vector.x;
      } else {
        x = display.xScale(vx);
      }*/
      x = display.xScale(vx);

      if (pointInfo.offsetX) {
        x += pointInfo.offsetX;
      }

      return x;
    })
    .y(function (pointInfo, i) {
      var vy = pointInfo.y, y;

      var edgeIndex = (i === 0) ? 0 : i - 1;

      /*if (i === 0) {
        y = display.yScale(vy)
          - capExtension * stopInfo.outEdge.vector.y;
      } else if (i === stops.length-1) {
        y = display.yScale(vy)
          + capExtension * stopInfo.inEdge.vector.y;
      } else {
        y = display.yScale(vy);
      }*/
      y = display.yScale(vy);

      if (pointInfo.offsetY) {
        y -= pointInfo.offsetY;
      }

      return y;
    })
    .interpolate(display.lineInterpolator.bind(this));

  this.svgGroup = display.svg.append('g');

  this.lineSvg = this.svgGroup.append('g');
  this.labelSvg = this.svgGroup.append('g');

  this.lineGraph = this.lineSvg.append('path')
    //.attr('id', 'transitive-path-' +this.parent.getElementId())
    .attr('class', 'transitive-sortable transitive-line')
    .data([ this ]);

};


Segment.prototype.setFocused = function(focused) {
  this.focused = focused;
};


/**
 * Refresh
 */

Segment.prototype.refresh = function(display) {

  // update the line
  if(!this.renderData || this.renderData.length === 0) return;
  this.lineGraph.attr('d', this.line(this.renderData));
  display.styler.renderSegment(display, this.lineGraph);
  //if(this.focused) this.lineGraph.parentNode.appendChild(this.lineGraph);
};


Segment.prototype.refreshRenderData = function(updatePoints, styler, display) {
  this.renderData = [];

  var pointIndex = 0;

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

  this.graphEdges.forEach(function(edge, edgeIndex) {

    var edgeRenderData = [];

    var pointInfo;

    var fromOffsetX = 0, fromOffsetY = 0, toOffsetX = 0, toOffsetY = 0;

    if(edge in this.edgeFromOffsets) {
      var fromOffset = this.edgeFromOffsets[edge] * this.lineWidth;
      fromOffsetX = fromOffset * edge.fromRightVector.x;
      fromOffsetY = fromOffset * edge.fromRightVector.y;
    }

    if(edge in this.edgeToOffsets) {
      var toOffset = this.edgeToOffsets[edge] * this.lineWidth;
      toOffsetX = toOffset * edge.toRightVector.x;
      toOffsetY = toOffset * edge.toRightVector.y;
    }

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
      path: edge.paths[0],
      x: edge.fromVertex.x,
      y: edge.fromVertex.y,
      point: edge.fromVertex.point,
      inEdge: null,
      outEdge: edge,
      index: pointIndex++,
      offsetX: fromOffsetX,
      offsetY: fromOffsetY
    };

    edgeRenderData.push(pointInfo);

    if(updatePoints) edge.fromVertex.point.addRenderData(pointInfo);


    // the internal points for this edge
    if(edge.curvaturePoints && edge.curvaturePoints.length > 0) {
      var cpoints = edge.getCurvaturePoints(fromOffsetX, fromOffsetY, toOffsetX, toOffsetY);
      edgeRenderData = edgeRenderData.concat(cpoints);
    }

    if(updatePoints) edge.renderInternalPoints(this, fromOffsetX, fromOffsetY, toOffsetX, toOffsetY);


    // the "to" vertex point for this edge.

    pointInfo = {
      segment: this,
      path: edge.paths[0],
      x: edge.toVertex.x,
      y: edge.toVertex.y,
      point: edge.toVertex.point,
      index: pointIndex,
      offsetX: toOffsetX,
      offsetY: toOffsetY
    };

    edgeRenderData.push(pointInfo);

    if(updatePoints) edge.toVertex.point.addRenderData(pointInfo);

    this.renderData = this.renderData.concat(edgeRenderData);
  }, this);

};

Segment.prototype.refreshLabel = function(display) {
  if(!this.renderLabel) return;
  this.label.refresh(display);
};



Segment.prototype.getLabelAnchors = function(display) {

  var labelAnchors = [];
  var x, x1, x2, y, y1, y2;


  if(this.renderData.length === 2) { // basic straight segment
    if(this.renderData[0].x === this.renderData[1].x) { // vertical
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
    }
  }

  if(this.renderData.length === 4) { // basic curved segment

    if(this.renderData[0].x === this.renderData[1].x) { // vertical first
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
    }
  }

  return labelAnchors;

};


Segment.prototype.compareTo = function(other) {
  
  // show transit segments in front of other types
  if(this.type === 'TRANSIT' && other.type !== 'TRANSIT') return 1;
  if(other.type === 'TRANSIT' && this.type !== 'TRANSIT') return -1;

  if(this.type === 'TRANSIT' && other.type === 'TRANSIT') {

    // for two transit segments, try sorting transit mode first
    if(this.pattern.route.route_type !== other.pattern.route.route_type) {
      return (this.pattern.route.route_type < other.pattern.route.route_type);
    }

    // for two transit segments of the same mode, sort by id (for display consistency)
    return (this.getId() < other.getId());
  }
};

function getAveragePointOffsets(point) {
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