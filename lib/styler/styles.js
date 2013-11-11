
/**
 *
 */

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
  cy: function (display, data) {
    if (data.stop.renderData.length === 2 && data.stop.isEndPoint) {
      return -pixels(display.zoom.scale(), 0.416, 1, 1.45) / 2 + 'em';
    } else if (data.stop.renderData.length === 3 && data.stop.isEndPoint) {
      return -pixels(display.zoom.scale(), 0.416, 1, 1.45) + 'em';
    }
    return 0;
  },
  fill: function (display, data) {
    if (data.stop.isEndPoint) return '#fff';
    return '#fff';
  },
  r: function (display, data) {
    if (data.stop.isEndPoint) {
      var width = 1.75 * pixels(display.zoom.scale(), 0.416, 1, 1.45) / 2;
      return data.stop.renderData.length * width + 'em';
    }
    return pixels(display.zoom.scale(), 2, 4, 6.5);
  },
  stroke: function (display, data) {
    if (data.stop.isEndPoint && data.pattern.route.route_color) {
      return '#' + data.pattern.route.route_color;
    }
    return 'gray';
  },
  'stroke-width': function (display, data) {
    if (data.stop.isEndPoint) {
      return 0.5 * pixels(display.zoom.scale(), 0.416, 1, 1.45) + 'em';
    }
    return pixels(display.zoom.scale(), 0.0416, 0.0833, 0.125) + 'em';
  },
  visibility: function(display, data) {
    if (data.stop.renderData.length > 1) {
      if (data.stop.renderData[0].displayed && data.stop.isEndPoint) return 'hidden';
      data.stop.renderData[0].displayed = true;
    }
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
  visibility: function (display, data) {
    if (display.zoom.scale() >= 1) return 'visible';
    if (display.zoom.scale() >= 0.75 && data.stop.isBranchPoint) return 'visible';
    if (display.zoom.scale() >= 0.5 && data.stop.isEndPoint) return 'visible';
    return 'hidden';
  },
  x: function (display, data) {
    var strokeWidth = pixels(display.zoom.scale(), 0.416, 1, 1.45);
    if (data.stop.isEndPoint) {
      strokeWidth += data.stop.renderData.length / 3;
    }

    return 1.25 * strokeWidth * data.stop.labelPosition + 'em';
  },
  y: function (display, data) {
    var strokeWidth = pixels(display.zoom.scale(), 0.416, 1, 1.45);
    if (data.stop.isEndPoint) {
      strokeWidth += data.stop.renderData.length / 3;
    }

    return 0.5 * strokeWidth * (-data.stop.labelPosition) + 'em';
  },
  'text-transform': function (display, data) {
    if (data.stop.isEndPoint) {
      return 'uppercase';
    } else {
      return 'capitalize';
    }
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
