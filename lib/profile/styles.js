/**
 * Profile display label rules
 */

var zoom_min = 0.25, zoom_max = 4, zoom_mid = 1;
function pixels(current_z, min, normal, max) {
  if (current_z === zoom_mid) return normal;
  if (current_z < zoom_mid) return min + (current_z - zoom_min) / (zoom_mid - zoom_min) * (normal - min);
  return normal + (current_z - zoom_mid) / (zoom_max - zoom_mid) * (max - normal);
}

function strokeWidth(display) {
  return pixels(display.zoom.scale(), 5, 12, 19);
}

exports.labels = {
  color: '#1a1a1a',
  'font-family': '\'Lato\', sans-serif',
  'font-size': 14,

  visibility: function (display, data) {
    //if(data.stop.isJourneyTransfer) return 'visible';
    return 'hidden';
  },
  'text-transform': function (display, data) {
    if (data.stop.isEndPoint) {
      return 'uppercase';
    } else {
      return 'capitalize';
    }
  }
};


exports.stops = {
  fill: function (display, data) {
    return '#fff';
  },
  r: function (display, data) {
    if (data.stop.isJourneyTransfer) {
      //var width = data.stop.renderData.length * strokeWidth(display) / 2;
      //return 1.75 * width + 'px';
      return strokeWidth(display) * 0.6;
    }
    return strokeWidth(display) * 0.3;
  }
};