
//

var zoom_min = 0.25, zoom_max = 4, zoom_mid = 1;
function pixels(current_z, min, normal, max) {
  if (current_z === zoom_mid) return normal;
  if (current_z < zoom_mid) return min + (current_z - zoom_min) / (zoom_mid - zoom_min) * (normal - min);
  return normal + (current_z - zoom_mid) / (zoom_max - zoom_mid) * (max - normal);
}

/**
 * Default stop rules
 */

exports.stops = {
  cx: 0,
  cy: 0,
  fill: 'white',
  r: function (display) {
    return pixels(display.zoom.scale(), 2, 4, 6.5);
  },
  stroke: '#333',
  'stroke-width': function (display, data) {
    return pixels(display.zoom.scale(), 0.0416, 0.0833, 0.125) + 'em';
  }
};

/**
 * Default label rules
 */

exports.labels = {
  color: '#333',
  'font-family': '\'Lato\', sans-serif',
  'font-size': function(display) {
    return pixels(display.zoom.scale(), 1, 1.2, 1.4) + 'em';
  },
  transform: function (display) {
    return 'rotate(-45,' + this.x + ',' + this.y(display).substr(0, 2) + ')';
  },
  visibility: function (display, data) {
    if (display.zoom.scale() < 0.75) return 'hidden';
    return 'visible';
  },
  x: 0,
  y: function (display) {
    return -pixels(display.zoom.scale(), 1, 1.2, 1.4) + 'em';
  }
};

/**
 * All patterns
 */

exports.patterns = {
  stroke: function (display, data) {
    if (data.route.route_color) {
      return '#' + data.route.route_color;
    } else {
      return 'grey';
    }
  },
  'stroke-dasharray': function (display, data) {
    if (data.frequency.average > 12) return false;
    if (data.frequency.average > 6) return '1em, 1em';
    return '1em, 0.166em';
  },
  'stroke-width': function (display) {
    return pixels(display.zoom.scale(), 0.416, 1, 1.45) + 'em';
  },
  fill: function (display, data, index) {
    return 'none';
  }
};
