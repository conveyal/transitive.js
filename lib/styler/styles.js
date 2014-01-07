
/**
 *
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

function fontSize(display, data) {
  return pixels(display.zoom.scale(), 10, 14, 18);
}

/**
 * Default stop rules
 */

exports.stops = {
  cx: 0,
  cy: function (display, data) {
    if (data.stop.renderData.length === 2 && data.stop.isEndPoint) {
      return -strokeWidth(display) / 2 + 'px';
    } else if (data.stop.renderData.length === 3 && data.stop.isEndPoint) {
      return -strokeWidth(display) + 'px';
    }
    return 0;
  },
  fill: function (display, data) {
    return '#fff';
  },
  r: function (display, data) {
    if (data.stop.isEndPoint) {
      var width = data.stop.renderData.length * strokeWidth(display) / 2;
      return 1.75 * width + 'px';
    }
    return pixels(display.zoom.scale(), 2, 4, 6.5) + 'px';
  },
  stroke: function (display, data) {
    if (data.stop.isEndPoint && data.pattern.route && data.pattern.route.route_color) {
      return '#' + data.pattern.route.route_color;
    } else if (data.pattern.route && data.pattern.route.route_color) {
      return 'gray';
    }
    return '#2EB1E6';
  },
  'stroke-width': function (display, data) {
    if (data.stop.isEndPoint) {
      return data.stop.renderData.length * strokeWidth(display) / 2 + 'px';
    }
    return pixels(display.zoom.scale(), 0.5, 1, 1.5) + 'px';
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
  color: '#1a1a1a',
  'font-family': '\'Lato\', sans-serif',
  'font-size': function(display, data) {
    return fontSize(display, data) + 'px';
  },
  visibility: function (display, data) {
    if (display.zoom.scale() >= 0.8) return 'visible';
    if (display.zoom.scale() >= 0.6 && data.stop.isBranchPoint) return 'visible';
    if (display.zoom.scale() >= 0.4 && data.stop.isEndPoint) return 'visible';
    return 'hidden';
  },
  x: function (display, data) {
    var width = strokeWidth(display);
    if (data.stop.isEndPoint) {
      width *= data.stop.renderData.length;
    }

    return Math.sqrt(width * width * 2) * data.stop.labelPosition + 'px';
  },
  y: function (display, data) {
    return fontSize(display, data)  / 2 * -data.stop.labelPosition + 'px';
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
    if (data.route && data.route.route_color) return '#' + data.route.route_color;
    return '#2EB1E6';
  },
  'stroke-dasharray': function (display, data) {
    if (!data.frequency || data.frequency.average > 12) return false;
    if (data.frequency.average > 6) return '12px, 12px';
    return '12px, 2px';
  },
  'stroke-width': function (display) {
    return pixels(display.zoom.scale(), 5, 12, 19) + 'px';
  },
  fill: function (display, data, index) {
    return 'none';
  }
};
