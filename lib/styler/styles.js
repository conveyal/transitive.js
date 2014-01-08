
/**
 * Default stop rules
 */

exports.stops = {
  cx: [
    0
  ],
  cy: [
    0,
    function (display, data) {
      if (data.stop.renderData.length === 2 && data.stop.isEndPoint) {
        return -this.utils.strokeWidth(display) / 2 + 'px';
      } else if (data.stop.renderData.length === 3 && data.stop.isEndPoint) {
        return -this.utils.strokeWidth(display) + 'px';
      }
    }
  ],
  fill: [
    '#fff'
  ],
  r: [
    4,
    function (display) {
      return this.utils.pixels(display.zoom.scale(), 2, 4, 6.5) + 'px';
    },
    function (display, data) {
      if (data.stop.isEndPoint) {
        var width = data.stop.renderData.length * this.utils.strokeWidth(display) / 2;
        return 1.75 * width + 'px';
      }
    }
  ],
  stroke: [
    '#2EB1E6',
    function (display, data) {
      if (data.stop.isEndPoint && data.pattern.route && data.pattern.route.route_color) {
        return '#' + data.pattern.route.route_color;
      } else if (data.pattern.route && data.pattern.route.route_color) {
        return 'gray';
      }
    }
  ],
  'stroke-width': [
    1,
    function (display) {
      return this.utils.pixels(display.zoom.scale(), 0.5, 1, 1.5) + 'px';
    },
    function (display, data) {
      if (data.stop.isEndPoint) {
        return data.stop.renderData.length * this.utils.strokeWidth(display) / 2 + 'px';
      }
    }
  ],
  visibility: [ function(display, data) {
    if (data.stop.renderData.length > 1) {
      if (data.stop.renderData[0].displayed && data.stop.isEndPoint) return 'hidden';
      data.stop.renderData[0].displayed = true;
    }
  }]
};

/**
 * Default label rules
 */

exports.labels = {
  color: [
    '#1a1a1a'
  ],
  'font-family': [
    '\'Lato\', sans-serif'
  ],
  'font-size': [
    14,
    function(display, data) {
      return this.utils.fontSize(display, data) + 'px';
    }
  ],
  visibility: [
    'hidden',
    function (display, data) {
      if (display.zoom.scale() >= 0.8) return 'visible';
      if (display.zoom.scale() >= 0.6 && data.stop.isBranchPoint) return 'visible';
      if (display.zoom.scale() >= 0.4 && data.stop.isEndPoint) return 'visible';
    }
  ],
  x: [ function (display, data) {
    var width = this.utils.strokeWidth(display);
    if (data.stop.isEndPoint) {
      width *= data.stop.renderData.length;
    }

    return Math.sqrt(width * width * 2) * data.stop.labelPosition + 'px';
  }],
  y: [ function (display, data) {
    return this.utils.fontSize(display, data) / 2 * -data.stop.labelPosition + 'px';
  }],
  'text-transform': [
    'capitalize',
    function (display, data) {
      if (data.stop.isEndPoint) return 'uppercase';
    }
  ]
};

/**
 * All patterns
 */

exports.patterns = {
  stroke: [
    '#2EB1E6',
    function (display, data) {
      if (data.route && data.route.route_color) return '#' + data.route.route_color;
    }
  ],
  'stroke-dasharray': [
    false,
    function (display, data) {
      if (data.frequency && data.frequency.average < 12) {
        if (data.frequency.average > 6) return '12px, 12px';
        return '12px, 2px';
      }
    }
  ],
  'stroke-width': [
    '12px',
    function (display) {
      return this.utils.pixels(display.zoom.scale(), 5, 12, 19) + 'px';
    }
  ],
  fill: [ 'none' ]
};
