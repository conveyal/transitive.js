/**
 * Dependencies
 */

var d3 = require('d3');


/**
 * Expose `Segment`
 */

module.exports = Segment;

/**
 * 
 */

function Segment(type) {
  this.type = type;
  this.points = [];
  this.graphEdges = [];
}


Segment.prototype.addEdge = function(edge) {
  this.graphEdges.push(edge);
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


Segment.prototype.refreshRenderData = function() {
  this.renderData = [];

  var pointIndex = 0; //, edgeIndex = 0;

  /*if(this.graphEdges.length > 1) {
    console.log('skipping multi-edge segment');
    console.log(this);
    return;
  }*/
  //var edge = this.graphEdges[0]; // edgeInfo.edge;

  this.graphEdges.forEach(function(edge, edgeIndex) {
    var edgeRenderData = [];

    /*var nextEdgeInfo = i < this.graphEdges.length - 1
      ? this.graphEdges[i + 1]
      : null;*/

    var pointInfo;

    // the "from" vertex point for this edge (first edge only)
    //if (i === 0) {
    pointInfo = {
      path: edge.paths[0],
      x: edge.fromVertex.x,
      y: edge.fromVertex.y,
      point: edge.fromVertex.point,
      inEdge: null,
      outEdge: edge,
      index: pointIndex++
    };

    /*pointInfo.offsetX = edgeInfo.offset
      ? edge.rightVector.x * this.lineWidth * edgeInfo.offset
      : 0;

    pointInfo.offsetY = edgeInfo.offset
      ? edge.rightVector.y * this.lineWidth * edgeInfo.offset
      : 0;*/
    pointInfo.offsetX = pointInfo.offsetY = 0;

    edgeRenderData.push(pointInfo);
    edge.fromVertex.point.addRenderData(pointInfo);

    if(edge.curvaturePoints && edge.curvaturePoints.length > 0) {
      edgeRenderData = edgeRenderData.concat(edge.curvaturePoints);
    }

    // the "to" vertex point for this edge. handles the 'corner' case between adjacent edges
    //pointInfo = this.constructCornerPointInfo(edgeInfo, edge.toVertex, nextEdgeInfo);
    //pointInfo.index = pointIndex;

    // temp: disregard offsetting
    pointInfo = {
      path: edge.paths[0],
      x: edge.toVertex.x,
      y: edge.toVertex.y,
      point: edge.toVertex.point,
      index: pointIndex,
      offsetX: 0,
      offsetY: 0
    };

    edgeRenderData.push(pointInfo);

    edge.toVertex.point.addRenderData(pointInfo);

    this.renderData = this.renderData.concat(edgeRenderData);
  }, this);

};