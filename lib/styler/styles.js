
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

exports.stops_merged = {
  fill: [
    '#fff'
  ],
  stroke: [
    '#000',
  ],
  'stroke-width': [
    2,
  ]
};

exports.stops_pattern = {
  cx: [
    0
  ],
  cy: [
    0
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
    },
    function (display, data, index, utils) {
      var busOnly = true;
      data.point.patterns.forEach(function(pattern) {
        if(pattern.route.route_type !== 3) busOnly = false;
      });
      if(busOnly && !data.point.isSegmentEndPoint) {
        return 0.5 * utils.pixels(display.zoom.scale(), 2, 4, 6.5) + 'px';
      }
    }
  ],
  stroke: [
    '#000',
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
      if (data.point.isSegmentEndPoint) {
        return '2px';
      }
    }
  ],
  visibility: [ function(display, data) {
    if(data.point.isSegmentEndPoint && data.point.patternCount > 1) return 'hidden';
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
    '#fff',
    function (display, data) {
      if(data.point.getId() === 'from') return '#0f0';
      if(data.point.getId() === 'to') return '#f00';
    }
  ],
  r: [
    10
  ],
  stroke: [
    '#2EB1E6',
    function (display, data) {
      if(data.point.getId() === 'from' || data.point.getId() === 'to') return '#fff';
    }
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
    0
  ],
  fill: [
    '#fff',
    function (display, data) {
      if(data.point.containsFromPlace) return '#0f0';
      if(data.point.containsToPlace) return '#f00';
    }
  ],
  r: [
    6,
    function (display, data) {
      if(data.point.containsFromPlace || data.point.containsToPlace) return 10;
    }
  ],
  stroke: [
    '#000',
    function (display, data) {
      if(data.point.containsFromPlace || data.point.containsToPlace) return '#fff';
    }
  ],
  'stroke-width': [
    4,
    function (display, data) {
      if(data.point.containsFromPlace || data.point.containsToPlace) return 3;
    }
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
      //console.log(data);
      if(data.type === 'TRANSIT') {
        if(data.pattern && data.pattern.route) return data.pattern.route.getColor();
      }
      else if(data.type === 'WALK') {
        return '#444';
      }
    }
  ],
  'stroke-dasharray': [
    false,
    function (display, data) {

      if (data.type !== 'TRANSIT') {
        return '5, 5';
      }

      if (data.frequency && data.frequency.average < 12) {
        if (data.frequency.average > 6) return '12px, 12px';
        return '12px, 2px';
      }
    }
  ],
  'stroke-width': [
    '12px',
    function (display, data, index, utils) {
      if (data.type !== 'TRANSIT') {
        return '5px';
      }
      return utils.pixels(display.zoom.scale(), 5, 12, 19) + 'px';
    }
  ],
  fill: [ 'none' ]
};
