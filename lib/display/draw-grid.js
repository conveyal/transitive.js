var d3 = require('d3');

/**
 * Draw the snapping grid
 *
 * @param {Display} display object
 * @param {Number} cell size
 */

module.exports = function drawGrid(display, cellSize) {
  var svg = display.svg;
  var xScale = display.xScale;
  var yScale = display.yScale;

  // Remove all current gridlines
  svg.selectAll('.gridline').remove();

  // Add a grid group "behind" everything else
  var grid = svg.insert('g', ':first-child');

  var xRange = xScale.range();
  var yRange = yScale.range();
  var xDomain = xScale.domain();
  var yDomain = yScale.domain();

  var xMin = Math.round(xDomain[0] / cellSize) * cellSize;
  var xMax = Math.round(xDomain[1] / cellSize) * cellSize;
  for (var x = xMin; x <= xMax; x += cellSize)
    appendLine(xScale(x), xScale(x), yRange[0], yRange[1]);

  var yMin = Math.round(yDomain[0] / cellSize) * cellSize;
  var yMax = Math.round(yDomain[1] / cellSize) * cellSize;
  for (var y = yMin; y <= yMax; y += cellSize)
    appendLine(xRange[0], xRange[1], yScale(y), yScale(y));

  function appendLine(x1, x2, y1, y2) {
    grid.append('line')
      .attr({
        'class': 'gridline',
        'x1': x1,
        'x2': x2,
        'y1': y1,
        'y2': y2
      });
  }
};
