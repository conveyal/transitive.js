
/**
 * Dependencies
 */

var d3 = require('d3');

/**
 * Scales for utility functions to use
 */

var zoomScale = d3.scale.linear().domain([ 0.25, 1, 4 ]);
var strokeScale = d3.scale.linear().domain([ 0.25, 1, 4 ]).range([ 5, 12, 19 ]);
var fontScale = d3.scale.linear().domain([ 0.25, 1, 4 ]).range([ 10, 14, 18 ]);

/**
 * Expose `utils` for the style functions to use
 */

exports.utils = {
  pixels: function(zoom, min, normal, max) {
    return zoomScale.range([ min, normal, max ])(zoom);
  },
  strokeWidth: function(display) {
    return strokeScale(display.zoom.scale());
  },
  fontSize: function(display, data) {
    return fontScale(display.zoom.scale());
  }
};

/**
 * Default stop rules
 */

exports.stops = {
  cx: [
    0
  ],
  cy: [
    0,
    function (display, data, index, utils) {
      var stop = data.point;
      if (stop.renderData.length === 2 && stop.isEndPoint) {
        return -utils.strokeWidth(display) / 2 + 'px';
      } else if (stop.renderData.length === 3 && stop.isEndPoint) {
        return -utils.strokeWidth(display) + 'px';
      }
    }
  ],
  fill: [
    '#fff'
  ],
  r: [
    4,
    function (display, data, index, utils) {
      return utils.pixels(display.zoom.scale(), 2, 4, 6.5) + 'px';
    },
    function (display, data, index, utils) {
      if (data.point.isEndPoint) {
        var width = data.point.renderData.length * utils.strokeWidth(display) / 2;
        return 1.75 * width + 'px';
      }
    }
  ],
  stroke: [
    '#2EB1E6',
    function (display, data) {
      if (data.point.isEndPoint && data.path.parent.route && data.path.parent.route.route_color) {
        return '#' + data.pattern.route.route_color;
      } else if (data.path.parent.route && data.path.parent.route.route_color) {
        return 'gray';
      }
    }
  ],
  'stroke-width': [
    1,
    function (display, data, index, utils) {
      return utils.pixels(display.zoom.scale(), 0.5, 1, 1.5) + 'px';
    },
    function (display, data, index, utils) {
      if (data.point.isEndPoint) {
        return data.point.renderData.length * utils.strokeWidth(display) / 2 + 'px';
      }
    }
  ],
  visibility: [ function(display, data) {
    if (data.point.renderData.length > 1) {
      if (data.point.renderData[0].displayed && data.point.isEndPoint) return 'hidden';
      data.point.renderData[0].displayed = true;
    }
  }]
};



/**
 * Default place rules
 */

exports.places = {
  cx: [
    0
  ],
  cy: [
    0,
  ],
  fill: [
    '#fff'
  ],
  r: [
    8
  ],
  stroke: [
    '#2EB1E6',
  ],
  'stroke-width': [
    3
  ],
  visibility: [ function(display, data) {
    return true;
  }]
};


/**
 * Default MultiPoint rules
 */

exports.multipoints = {
  cx: [
    0
  ],
  cy: [
    0,
  ],
  fill: [
    '#fff'
  ],
  r: [
    6
  ],
  stroke: [
    '#000',
  ],
  'stroke-width': [
    4
  ],
  visibility: [ function(display, data) {
    return true;
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
    function(display, data, index, utils) {
      return utils.fontSize(display, data) + 'px';
    }
  ],
  visibility: [
    'hidden',
    function (display, data) {
      if (display.zoom.scale() > 1) return 'visible';
      if (display.zoom.scale() >= 0.6 && data.point && data.point.isBranchPoint) return 'visible';
      if (display.zoom.scale() >= 0.4 && data.point && data.point.isSegmentEndPoint) return 'visible';
    }
  ],
  x: [ function (display, data, index, utils) {
    var width = utils.strokeWidth(display);
    if (data.point && data.point.isEndPoint) {
      width *= data.point.renderData.length;
    }

    return Math.sqrt(width * width * 2) * (data.point ? data.point.labelPosition : 1) + 'px';
  }],
  y: [ function (display, data, index, utils) {
    return utils.fontSize(display, data) / 2 * -(data.point ? data.point.labelPosition : 1) + 'px';
  }],
  'text-transform': [
    'capitalize',
    function (display, data) {
      if (data.point && data.point.isSegmentEndPoint) return 'uppercase';
    }
  ]
};

/**
 * All path segments
 * TODO: update old route-pattern-specific code below
 */

exports.segments = {
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
    function (display, data, index, utils) {
      return utils.pixels(display.zoom.scale(), 5, 12, 19) + 'px';
    }
  ],
  fill: [ 'none' ]
};
