/**
 * Line interpolation utility function
 *
 * @param {Array} points
 */

module.exports = function(points) {
  var dx, dy;

  if (points.length === 2) { // a simple straight line
    if (this.getType() === 'WALK') { // resample walk segments for marker placement

      var newPoints = [points[0]];
      dx = points[1][0] - points[0][0];
      dy = points[1][1] - points[0][1];
      var len = Math.sqrt(dx * dx + dy * dy);
      var spacing = 10;

      for (var l = spacing; l < len; l += spacing) {
        var t = l / len;
        newPoints.push([points[0][0] + t * dx, points[0][1] + t * dy]);
      }

      newPoints.push(points[1]);
      return newPoints.join(' ');
    }

    return points.join(' ');
  }

  var str = points[0];
  for (var i = 1; i < points.length; i++) {
    if (this.renderData[i].arc) {
      var r = this.renderData[i].radius;
      var sweep = (this.renderData[i].arc > 0) ? 0 : 1;
      str += 'A ' + r + ',' + r + ' 0 0 ' + sweep + ' ' + points[i];
    } else {
      str += 'L' + points[i];
    }
  }
  return str;
};
