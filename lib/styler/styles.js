
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
 * Scales for utility functions to use
 */

var notFocusedColor = '#e0e0e0';

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
    function (display, data, index, utils) {
      if(!data.owner.isFocused()) return notFocusedColor;
    }
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
      return utils.pixels(display.zoom.scale(), 2, 4, 6.5);
    },
    function (display, data, index, utils) {
      if (data.point.isEndPoint) {
        var width = data.point.renderData.length * utils.strokeWidth(display) / 2;
        return 1.75 * width;
      }
    },
    function (display, data, index, utils) {
      var busOnly = true;
      data.point.patterns.forEach(function(pattern) {
        if(pattern.route.route_type !== 3) busOnly = false;
      });
      if(busOnly && !data.point.isSegmentEndPoint) {
        return 0.5 * utils.pixels(display.zoom.scale(), 2, 4, 6.5);
      }
    }
  ],
  stroke: [
    '#000',
    function (display, data) {
      if(!data.point.focused || !data.point.isPatternFocused(data.segment.pattern.getId())) return notFocusedColor;
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
      if(!data.point.focused) return notFocusedColor;
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

exports.multipoints_merged = {
  fill: [
    '#fff',
    function (display, data) {
      var point = data.owner;
      if(point.containsFromPoint()) return '#0f0';
      if(point.containsToPoint()) return '#f00';
    }
  ],
  r: [
    6,
    function (display, data) {
      var point = data.owner;
      if(point.containsFromPoint() || point.containsToPoint()) return 10;
    }
  ],
  stroke: [
    '#000',
    function (display, data) {
      var point = data.owner;
      if(point.containsFromPoint() || point.containsToPoint()) return '#fff';
      if(!point.focused) return notFocusedColor;
    }
  ],
  'stroke-width': [
    4,
    function (display, data) {
      var point = data.owner;
      if(point.containsFromPoint() || point.containsToPoint()) return 3;
    }
  ],
  visibility: [ function(display, data) {
    return 'visible';
  }]
};


exports.multipoints_pattern = {
  fill: [
    '#fff'
  ],
  r: [
    6
  ],
  stroke: [
    '#000'
  ],
  'stroke-width': [
    4
  ],
  visibility: [ function(display, data) {
    return 'hidden';
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
  /*visibility: [
    'hidden',
    function (display, data) {
      if(data.point.getType() === 'STOP' && data.point.isSegmentEndPoint) return 'visible';
      if(data.point.getType() === 'MULTI' || data.point.getType() === 'PLACE') return 'visible';
      /*if (display.zoom.scale() > 1) return 'visible';
      if (display.zoom.scale() >= 0.6 && data.point && data.point.isBranchPoint) return 'visible';
      if (display.zoom.scale() >= 0.4 && data.point && data.point.isSegmentEndPoint) return 'visible';
    }
  ],*/
  /*'text-transform': [
    'capitalize',
    function (display, data) {
      if (data.point && (data.point.isSegmentEndPoint || data.point.containsToPoint() || data.point.containsFromPoint())) return 'uppercase';
    }
  ]*/
};

/**
 * All path segments
 * TODO: update old route-pattern-specific code below
 */

exports.segments = {
  stroke: [
    '#008',
    function (display, data) {
      var segment = data;
      if(!segment.focused) return notFocusedColor;
      if(segment.type === 'TRANSIT') {
        if(segment.pattern && segment.pattern.route) {
          if(segment.pattern.route.route_short_name.toLowerCase().substring(0, 2) === 'dc') return '#f00';
          return segment.pattern.route.getColor();
        }
      }
      else if(segment.type === 'WALK') {
        return '#444';
      }
    }
  ],
  'stroke-dasharray': [
    false,
    function (display, data) {
      var segment = data;
      if (segment.type !== 'TRANSIT') {
        return '5, 5';
      }

      if (segment.frequency && segment.frequency.average < 12) {
        if (segment.frequency.average > 6) return '12px, 12px';
        return '12px, 2px';
      }
    }
  ],
  'stroke-width': [
    '12px',
    function (display, data, index, utils) {
      var segment = data;
      if (segment.type !== 'TRANSIT') {
        return '5px';
      }
      if(segment.pattern.route.route_type === 3) {
        return utils.pixels(display.zoom.scale(), 3, 6, 10) + 'px';
      }
      return utils.pixels(display.zoom.scale(), 5, 12, 19) + 'px';
    }
  ],
  fill: [ 'none' ],
  envelope: [
    function (display, data, index, utils) {
      var segment = data;
      if (segment.type !== 'TRANSIT') {
        return '5px';
      }
      if(segment.pattern && segment.pattern.route.route_type === 3) {
        return utils.pixels(display.zoom.scale(), 9, 18, 30) + 'px';
      }
      return utils.pixels(display.zoom.scale(), 7, 14, 21) + 'px';
    }
  ]
};


exports.segments_front = {
  stroke: [
    '#008'
  ],
  'stroke-width': [
    function(display, data, index, utils) {
      return utils.pixels(display.zoom.scale(), 3, 6, 10)/2 + 'px';
    }
  ],
  fill: [ 'none' ],
  display : [
    'none',
    function(display, data, index, utils) {
      if(data.pattern && data.pattern.route.route_type === 3 &&
         data.pattern.route.route_short_name.toLowerCase().substring(0, 2) === 'dc') {
        return 'inline';
      }
    }
  ]
};


exports.segment_label_containers = {
  fill: [
    '#008',
    function (display, data) {
      if(!data.isFocused()) return notFocusedColor;
    }
  ],
  stroke: [
    '#f00'
  ],
  'stroke-width': [
    function (display, data) {
      if(data.parent.pattern && data.parent.pattern.route.route_short_name.toLowerCase().substring(0, 2) === 'dc') return 1;
      return 0;
    }
  ],
  rx: [
    3
  ],
  ry: [
    3
  ]
};


exports.segment_labels = {
  fill: [
    '#fff'
  ],
  'font-family': [
    '\'Lato\', sans-serif'
  ],
  'font-weight': [
    'bold'
  ],
  'font-size': [
    '13px'
  ],
  'vertical-align': [
    'text-top'
  ]

};
