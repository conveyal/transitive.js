/**
 * Line interpolation utility function
 *
 * @param {Array} points
 */

var Util = require('./util');


module.exports = function(points) {
  var newPoints, i, r;

  //console.log(this);
  var resample = (this.getType() === 'WALK' || this.getType() === 'BICYCLE');
  if (points.length === 2) { // a simple straight line
    if (resample) { // resample walk segments for marker placement

      newPoints = [points[0]];
      newPoints = newPoints.concat(resampleLine(points[0], points[1], 9));
      return newPoints.join(' ');
    }

    return points.join(' ');
  }


  if(resample) {
    newPoints = [points[0]];
    for (i = 1; i < points.length; i++) {
      if (this.renderData[i].arc) {
        //console.log(this.renderData[i]);
        //var r = this.renderData[i].radius;
        //var sweep = (this.renderData[i].arc > 0) ? 0 : 1;
        //str += 'A ' + r + ',' + r + ' 0 0 ' + sweep + ' ' + points[i];
        r = this.renderData[i].radius;
        var theta = this.renderData[i].arc * Math.PI / 180;
        newPoints = newPoints.concat(resampleArc(points[i-1], points[i], r, theta, -this.renderData[i].arc, 6));

      } else {
        newPoints = newPoints.concat(resampleLine(points[i-1], points[i], 6));
      }
    }
    return newPoints.join(' ');
  }
  else {
    var str = points[0];
    for (i = 1; i < points.length; i++) {
      if (this.renderData[i].arc) {
        r = this.renderData[i].radius;
        var sweep = (this.renderData[i].arc > 0) ? 0 : 1;
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
  //var spacing = 10;

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
    var pt = Util.pointAlongArc(startPt[0], startPt[1], endPt[0], endPt[1], r, Math.abs(theta), ccw, t);
    sampledPts.push([pt.x, pt.y]);
  }

  return sampledPts;

}
