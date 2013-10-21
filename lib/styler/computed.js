
/**
 * Computed rules
 */

module.exports = [
  showLabelsOnHover
];

/**
 * Show labels on hover
 */

function showLabelsOnHover(pattern, display) {
  pattern.selectAll('.transitive-stop-circle')
    .on('mouseenter', function (data) {
      pattern.select('#transitive-stop-label-' + data.stop.getId())
        .style('visibility', 'visible');
    })
    .on('mouseleave', function (data) {
      if (display.zoom.scale() < display.labelZoomThreshold) {
        pattern.select('#transitive-stop-label-' + data.stop.getId())
          .style('visibility', 'hidden');
      }
    });
}
