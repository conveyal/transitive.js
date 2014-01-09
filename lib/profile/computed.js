
/**
 * Dependencies
 */

var each = require('each');

/**
 * Computed rules
 */

module.exports = [
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
        stop.svgGroup.select('#transitive-stop-label-' + data.stop.getId())
          .style('visibility', 'visible');
      })
      .on('mouseleave', function (data) {
        stop.svgGroup.select('#transitive-stop-label-' + data.stop.getId())
          .style('visibility', 'hidden');
      });
  });
}


/**
 * Highlight option on hover
 */

function highlightOptionOnHover(transitive) {
  each(transitive.patterns, function (k, pattern) {
    if (!pattern.lineGraph) return;
    pattern.lineGraph
      .on('mouseenter', function (data) {

        // highlight the path
        pattern.lineGraph.style('stroke', '#00FFFF');

        // show the transfer stops
        for(var i = 0; i < pattern.stops.length; i++) {
          var stop = pattern.stops[i];
          if(pattern.journey.stops[i].transfer) {
            stop.svgGroup.select('#transitive-stop-label-' + stop.getId())
              .style('visibility', 'visible');
          }
        }

        // bring the hovered option to the front
        transitive.display.svg.selectAll('path').sort(function (a, b) {
          if (a.id !== pattern.id) return -1;
          return 1;
        });
      })
      .on('mouseleave', function (data) {
        pattern.lineGraph.style('stroke', '#2EB1E6');
        pattern.stops.forEach(function(stop) {
          stop.svgGroup.select('#transitive-stop-label-' + stop.getId())
            .style('visibility', 'hidden');
        });
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
      if (data.stop.graphVertex) {
        data.stop.graphVertex.moveTo(
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
