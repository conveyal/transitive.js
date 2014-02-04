
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
        stop.svgGroup.select('#transitive-stop-label-' + data.point.getId())
          .style('visibility', 'visible');
      })
      .on('mouseleave', function (data) {
        stop.svgGroup.select('#transitive-stop-label-' + data.point.getId())
          .style('visibility', stop.isSegmentEndPoint ? 'visible' : 'hidden');
      });
  });
}


/**
 * Highlight option on hover
 */

function highlightOptionOnHover(transitive) {
  for(var p = 0; p < transitive.paths.length; p++) {
    var path = transitive.paths[p];
    if (!path.segments) return;
    path.segments.forEach(function(segment) {
      var currentColor = segment.lineGraph.style('stroke');
      segment.lineGraph
        .on('mouseenter', function (data) {

          // highlight the path
          segment.lineGraph.style('stroke', '#5bc0de');

          /*
          // show the transfer stops
          for(var i = 0; i < pattern.stops.length; i++) {
            var stop = pattern.stops[i];
            if(pattern.journey.stops[i].transfer) {
              stop.svgGroup.select('#transitive-stop-label-' + stop.getId())
                .style('visibility', 'visible');
            }
          }*/

          // bring the hovered option to the front
          /*transitive.display.svg.selectAll('path').sort(function (a, b) {
            if (a.id !== pattern.id) return -1;
            return 1;
          });*/
        })
        .on('mouseleave', function (data) {
          segment.lineGraph.style('stroke', currentColor);
          /*pattern.stops.forEach(function(stop) {
            stop.svgGroup.select('#transitive-stop-label-' + stop.getId())
              .style('visibility', stop.isEndPoint ? 'visible' : 'hidden');
          });*/
        });
    });
  }
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
      if (data.point.graphVertex) {
        data.point.graphVertex.moveTo(
          transitive.display.xScale.invert(d3.event.sourceEvent.pageX
            - transitive.el.offsetLeft),
          transitive.display.yScale.invert(d3.event.sourceEvent.pageY
            - transitive.el.offsetTop)
        );

        transitive.refresh();
      }
    });

  each(transitive.stops, function (k, stop) {
    if (!stop.svgGroup) return;
    stop.svgGroup.selectAll('.transitive-stop-circle').call(drag);
  });
}
