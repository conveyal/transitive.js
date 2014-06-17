/**
 * Dependencies
 */

var d3 = require('d3');
var clone = require('clone');

/**
 * Scales for utility functions to use
 */

var zoomScale = d3.scale.linear().domain([0.25, 1, 4]);
var strokeScale = d3.scale.linear().domain([0.25, 1, 4]).range([5, 12, 19]);
var fontScale = d3.scale.linear().domain([0.25, 1, 4]).range([10, 14, 18]);

/**
 * Scales for utility functions to use
 */

var notFocusedColor = '#e0e0e0';

/**
 * Expose `utils` for the style functions to use
 */

exports.utils = {
  pixels: function(zoom, min, normal, max) {
    return zoomScale.range([min, normal, max])(zoom);
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

var stops_merged = {

  fill: [
    '#fff',
    function(display, data, index, utils) {
      var point = data.owner;
      if (point.containsBoardPoint() || point.containsAlightPoint())
        return point.focused ? '#000' : notFocusedColor;
    }
  ],

  stroke: [
    '#000',
    function(display, data, index, utils) {
      var point = data.owner;
      if (point.containsBoardPoint() || point.containsAlightPoint())
        return '#fff';
      if (!point.isFocused()) return notFocusedColor;
      if (point.containsTransferPoint()) return '#008';
    }
  ],

  'stroke-width': [
    2,
    function(display, data, index, utils) {
      var point = data.owner;
      if (point.containsTransferPoint()) return 3;
    }
  ],

  /**
   *  Transitive-specific attribute specifying the shape of the main stop marker.
   *  Can be 'roundedrect', 'rectangle' or 'circle'
   */
  'marker-type': [
    'roundedrect',
    function(display, data, index, utils) {
      var point = data.owner;
      if ((point.containsBoardPoint() || point.containsAlightPoint()) && !
        point.containsTransferPoint()) return 'circle';
    }
  ],

  /**
   *  Transitive-specific attribute specifying any additional padding, in pixels,
   *  to apply to main stop marker. A value of zero (default) results in a that
   *  marker is flush to the edges of the pattern segment(s) the point is set against.
   *  A value greater than zero creates a marker that is larger than the width of
   *  the segments(s).
   */
  'marker-padding': [
    3
  ],

  visibility: [

    function(display, data) {
      if (!data.owner.containsSegmentEndPoint()) return 'hidden';
    }
  ]

};

exports.stops_merged = stops_merged;

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
    function(display, data, index, utils) {
      return utils.pixels(display.zoom.scale(), 2, 4, 6.5);
    },
    function(display, data, index, utils) {
      var point = data.owner;
      var busOnly = true;
      point.getPatterns().forEach(function(pattern) {
        if (pattern.route && pattern.route.route_type !== 3) busOnly = false;
      });
      if (busOnly && !point.containsSegmentEndPoint()) {
        return 0.5 * utils.pixels(display.zoom.scale(), 2, 4, 6.5);
      }
    }
  ],
  stroke: [
    /*'#000',
    function (display, data) {
      if(!data.point.focused || !data.point.isPatternFocused(data.segment.pattern.getId())) return notFocusedColor;
    }*/
  ],
  'stroke-width': [
    1,
    function(display, data, index, utils) {
      return utils.pixels(display.zoom.scale(), 0.5, 1, 1.5) + 'px';
    }
  ],
  visibility: [

    function(display, data) {
      if (data.owner.containsSegmentEndPoint()) return 'hidden';
    }
  ]
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
    16
  ],
  stroke: [
    '#000'
  ],
  'stroke-width': [
    3
  ],
  visibility: [

    function(display, data) {
      return true;
    }
  ]
};

/** icons typically defined in implementation-specific styles (see test2d for example) **/

exports.places_icon = {
  visibility: [
    'hidden'
  ]
};

/**
 * Default MultiPoint rules -- based on Stop rules
 */

var multipoints_merged = clone(stops_merged);

multipoints_merged.visibility = [
  true
];

exports.multipoints_merged = multipoints_merged;

exports.multipoints_pattern = exports.stops_pattern;


/**
 * Default label rules
 */

var labels = {
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
  'font-weight': [

    function(display, data, index, utils) {
      var point = data.owner.parent;
      if (point.containsBoardPoint() || point.containsAlightPoint())
        return 'bold';
    }
  ],

};


/**
 * Label halo rules -- based on label rules
 */

var labels_halo = clone(labels);

labels_halo.stroke = [
  '#fff'
];

labels_halo['stroke-width'] = [
  4
];

labels_halo.opacity = [
  0.9
];


exports.labels = labels;
exports.labels_halo = labels_halo;

/**
 * All path segments
 * TODO: update old route-pattern-specific code below
 */

exports.segments = {
  stroke: [
    '#008',
    function(display, data) {
      var segment = data;
      if (!segment.focused) return notFocusedColor;
      if (segment.type === 'TRANSIT') {
        if (segment.pattern && segment.pattern.route) {
          if (segment.pattern.route.route_short_name.toLowerCase().substring(0,
            2) === 'dc') return '#f00';
          return segment.pattern.route.getColor();
        }
      } else if (segment.type === 'WALK') {
        return 'none';
      }
    }
  ],
  'stroke-dasharray': [
    false,
    function(display, data) {
      var segment = data;
      if (segment.frequency && segment.frequency.average < 12) {
        if (segment.frequency.average > 6) return '12px, 12px';
        return '12px, 2px';
      }
    }
  ],
  'stroke-width': [
    '12px',
    function(display, data, index, utils) {
      var segment = data;
      if (segment.type !== 'TRANSIT') {
        return '1px';
      }
      if (segment.pattern && segment.pattern.route && segment.pattern.route.route_type ===
        3) {
        return utils.pixels(display.zoom.scale(), 3, 6, 10) + 'px';
      }
      return utils.pixels(display.zoom.scale(), 5, 12, 19) + 'px';
    }
  ],
  'marker-mid': [

    function(display, data) {
      var segment = data;
      if (segment.type !== 'TRANSIT') {
        var r = 3;
        display.svg.append('defs').append('svg:marker')
          .attr('id', 'WalkCircleMarker-' + segment.getId())
          .attr('refX', r)
          .attr('refY', r)
          .attr('markerWidth', r * 2)
          .attr('markerHeight', r * 2)
          .attr('markerUnits', 'userSpaceOnUse')
          .append('svg:circle')
          .attr('cx', r)
          .attr('cy', r)
          .attr('r', r)
          .attr('fill', segment.focused ? '#5ae3f9' : notFocusedColor);

        return 'url(#WalkCircleMarker-' + segment.getId() + ')';
      }
    }
  ],
  fill: ['none'],
  envelope: [

    function(display, data, index, utils) {
      var segment = data;
      if (segment.type !== 'TRANSIT') {
        return '5px';
      }
      if (segment.pattern && segment.pattern.route && segment.pattern.route.route_type ===
        3) {
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
      return utils.pixels(display.zoom.scale(), 3, 6, 10) / 2 + 'px';
    }
  ],
  fill: ['none'],
  display: [
    'none',
    function(display, data, index, utils) {
      if (data.pattern && data.pattern.route && data.pattern.route.route_type ===
        3 &&
        data.pattern.route.route_short_name.toLowerCase().substring(0, 2) ===
        'dc') {
        return 'inline';
      }
    }
  ]
};

exports.segment_label_containers = {
  fill: [
    '#008',
    function(display, data) {
      if (!data.isFocused()) return notFocusedColor;
    }
  ],
  stroke: [
    '#f00'
  ],
  'stroke-width': [

    function(display, data) {
      if (data.parent.pattern && data.parent.pattern.route.route_short_name.toLowerCase()
        .substring(0, 2) === 'dc') return 1;
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
