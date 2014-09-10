/**
 * Line interpolation utility function
 *
 * @param {Array} points
 */

var Util = require('./util');

module.exports = function(points) {
  var newPoints, i, r;

  // determine if we need to resample the path (i.e. place new points at a regular
  // interval for marker-based styling) based on styler settings
  var resampleSpacing = this.display.styler.compute(this.display.styler.segments[
    'marker-spacing'], this.display, this.segment);

  // handle the case of a simple straight line
  if (points.length === 2) {
    if (resampleSpacing) {
      newPoints = [points[0]];
      newPoints = newPoints.concat(resampleLine(points[0], points[1],
        resampleSpacing));
      return newPoints.join(' ');
    }
    return points.join(' ');
  }

  // otherwise, assume a curved segment

  if (resampleSpacing) {
    newPoints = [points[0]];
    for (i = 1; i < points.length; i++) {
      if (this.segment.renderData[i].arc) {
        //console.log(this.renderData[i]);
        //var r = this.renderData[i].radius;
        //var sweep = (this.renderData[i].arc > 0) ? 0 : 1;
        //str += 'A ' + r + ',' + r + ' 0 0 ' + sweep + ' ' + points[i];
        r = this.segment.renderData[i].radius;
        var theta = this.segment.renderData[i].arc * Math.PI / 180;
        newPoints = newPoints.concat(resampleArc(points[i - 1], points[i], r,
          theta, -this.segment.renderData[i].arc, resampleSpacing));

      } else {
        newPoints = newPoints.concat(resampleLine(points[i - 1], points[i],
          resampleSpacing));
      }
    }
    return newPoints.join(' ');
  } else {
    var str = points[0];
    for (i = 1; i < points.length; i++) {
      if (this.segment.renderData[i].arc) {
        r = this.segment.renderData[i].radius;
        var sweep = (this.segment.renderData[i].arc > 0) ? 0 : 1;
        str += 'A ' + r + ',' + r + ' 0 0 ' + sweep + ' ' + points[i];
      } else {
        str += 'L' + points[i];
      }
    }
    return str;
  }
};

function resampleLine(startPt, endPt, spacing) {
  var dx = endPt[0] - startPt[0];
  var dy = endPt[1] - startPt[1];
  var len = Math.sqrt(dx * dx + dy * dy);

  var sampledPts = [startPt];
  for (var l = spacing; l < len; l += spacing) {
    var t = l / len;
    sampledPts.push([startPt[0] + t * dx, startPt[1] + t * dy]);
  }

  sampledPts.push(endPt);

  return sampledPts;
}

function resampleArc(startPt, endPt, r, theta, ccw, spacing) {
  var len = r * Math.abs(theta);

  var sampledPts = [];
  for (var l = spacing; l < len; l += spacing) {
    var t = l / len;
    var pt = Util.pointAlongArc(startPt[0], startPt[1], endPt[0], endPt[1], r,
      Math.abs(theta), ccw, t);
    sampledPts.push([pt.x, pt.y]);
  }

  return sampledPts;

}
