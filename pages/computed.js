/**
 * Dependencies
 */

var d3 = require('d3');
var each = require('each');

/**
 * Computed rules
 */

var COMPUTED = [
  dragVertices,
  showLabelsOnHover,
  highlightOptionOnHover
];

/**
 * Show labels on hover
 */

function showLabelsOnHover(transitive) {
  each(transitive.stops, function(k, stop) {
    if (!stop.svgGroup) return;
    stop.svgGroup.selectAll('.transitive-stop-circle')
      .on('mouseenter', function(data) {
        stop.svgGroup.select('#transitive-stop-label-' + data.point.getId())
          .style('visibility', 'visible');
      })
      .on('mouseleave', function(data) {
        stop.svgGroup.select('#transitive-stop-label-' + data.point.getId())
          .style('visibility', 'hidden');
      });
  });
}

/**
 * Highlight option on hover
 */

function highlightOptionOnHover(transitive) {

  //for(var s = 0; s < transitive.renderSegments.length; s++) {
  transitive.renderSegments.forEach(function(segment) {
    //var segment = transitive.renderSegments[s];
    var currentColor = segment.lineGraph.style('stroke');
    segment.lineGraph
      .on('mouseenter', function(data) {
        // highlight the path
        segment.lineGraph.style('stroke', '#5bc0de');
        var edge = segment.graphEdge;
      })
      .on('mouseleave', function(data) {
        segment.lineGraph.style('stroke', currentColor);
      });
  });
}

/**
 * Drag vertices
 */

function dragVertices(transitive) {
  var drag = d3.behavior.drag()
    .on('dragstart', function() {
      d3.event.sourceEvent.stopPropagation(); // silence other listeners
    })
    .on('drag', function(data, index) {
      var point = data.owner;
      if (point.graphVertex) {
        var x = transitive.display.xScale.invert(d3.event.sourceEvent.pageX -
          transitive.el.offsetLeft);
        var y = transitive.display.yScale.invert(d3.event.sourceEvent.pageY -
          transitive.el.offsetTop);

        var dx = Math.abs(point.graphVertex.x - x);
        var dy = Math.abs(point.graphVertex.y - y);
        //console.log('move by ' + dx + ', ' + dy);

        var min = transitive.gridCellSize / 2;
        if (dx >= min || dy >= min) {
          //console.log(data.point);
          point.graphVertex.moveTo(x, y);
          transitive.updateGeometry(true);
          //transitive.display.svg.remove();
          transitive.refresh();
        }
      }
    });

  each(transitive.graph.vertices, function(vertex) {
    if (!vertex.point || !vertex.point.svgGroup) return;
    if (vertex.point.getType() === 'STOP') {
      vertex.point.mergedMarker.call(drag);
      vertex.point.patternMarkers.call(drag);
    } else if (vertex.point.getType() === 'MULTI') {
      vertex.point.svgGroup.selectAll('.transitive-multipoint-marker-merged')
        .call(drag);
    }
  });
}
