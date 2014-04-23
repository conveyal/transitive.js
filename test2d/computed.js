
/**
 * Dependencies
 */

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
  each(transitive.stops, function (k, stop) {
    if (!stop.svgGroup) return;
    stop.svgGroup.selectAll('.transitive-stop-circle')
      .on('mouseenter', function (data) {
        //console.log(data.point.graphVertex.x + ', ' + data.point.graphVertex.y);
        stop.svgGroup.select('#transitive-stop-label-' + data.point.getId())
          .style('visibility', 'visible');
      })
      .on('mouseleave', function (data) {
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
      .on('mouseenter', function (data) {
        // highlight the path
        segment.lineGraph.style('stroke', '#5bc0de');
        var edge = segment.graphEdges[0];
        /*console.log('(' + edge.fromVertex.x + ', '+ edge.fromVertex.y+ ') to (' + edge.toVertex.x + ', ' + edge.toVertex.y+ ')');
        console.log(segment);
        if(segment.pattern) {
          console.log(segment.pattern.pattern_name + ' (' + segment.pattern.getId() + ')');
        }*/
      })
      .on('mouseleave', function (data) {
        segment.lineGraph.style('stroke', currentColor);
      });
  });
}

/**
 * Drag vertices
 */

function dragVertices(transitive) {
  var d3 = transitive.d3;
  var drag = d3.behavior.drag()
    .on('dragstart', function () {
      d3.event.sourceEvent.stopPropagation(); // silence other listeners
    })
    .on('drag', function (data, index) {
      //console.log(data.point);
      if (data.point.graphVertex) {
        var x = transitive.display.xScale.invert(d3.event.sourceEvent.pageX - transitive.el.offsetLeft);
        var y = transitive.display.yScale.invert(d3.event.sourceEvent.pageY - transitive.el.offsetTop);

        var dx = Math.abs(data.point.graphVertex.x - x);
        var dy = Math.abs(data.point.graphVertex.y - y);
        //console.log('move by ' + dx + ', ' + dy);

        if(dx >= 400 || dy >= 400) {
          //console.log(data.point);
          data.point.graphVertex.moveTo(x, y);
          transitive.updateGeometry(true);
          //transitive.display.svg.remove();
          transitive.refresh();
        }
      }
    });

  each(transitive.graph.vertices, function (vertex) {
    if (!vertex.point || !vertex.point.svgGroup) return;
    if(vertex.point.getType() === 'STOP') {
      vertex.point.svgGroup.selectAll('.transitive-stop-marker-merged').call(drag);
      vertex.point.svgGroup.selectAll('.transitive-stop-marker-pattern').call(drag);
    }
    else if(vertex.point.getType() === 'MULTI') {
      vertex.point.svgGroup.selectAll('.transitive-multipoint-marker-merged').call(drag);
    }
  });
}
