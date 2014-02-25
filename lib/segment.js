/**
 * Dependencies
 */

var d3 = require('d3');

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

  this.lineGraph = display.svg.append('path')
    //.attr('id', 'transitive-path-' +this.parent.getElementId())
    .attr('class', 'transitive-line')
    .data([ this ]);
};

/**
 * Refresh
 */

Segment.prototype.refresh = function(display, styler) {
  // compute the line width
  var lw = styler.compute(styler.segments['stroke-width'], display, this);
  this.lineWidth = parseFloat(lw.substring(0, lw.length - 2), 10) - 2;

  // update the line
  if(!this.renderData || this.renderData.length === 0) return;
  this.lineGraph.attr('d', this.line(this.renderData));
};


Segment.prototype.refreshRenderData = function(updatePoints) {
  this.renderData = [];

  var pointIndex = 0;

  this.graphEdges.forEach(function(edge, edgeIndex) {

    var edgeRenderData = [];

    var pointInfo;

    var fromOffsetX = 0, fromOffsetY = 0, toOffsetX = 0, toOffsetY = 0;

    if(edge in this.edgeFromOffsets) {
      var fromOffset = this.edgeFromOffsets[edge];
      fromOffsetX = fromOffset * edge.fromRightVector.x;
      fromOffsetY = fromOffset * edge.fromRightVector.y;
    }

    if(edge in this.edgeToOffsets) {
      var toOffset = this.edgeToOffsets[edge];
      toOffsetX = toOffset * edge.toRightVector.x;
      toOffsetY = toOffset * edge.toRightVector.y;
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