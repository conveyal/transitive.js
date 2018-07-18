'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _d = require('d3');

var _d2 = _interopRequireDefault(_d);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Scales for utility functions to use
 */

var zoomScale = _d2.default.scale.linear().domain([0.25, 1, 4]);
var strokeScale = _d2.default.scale.linear().domain([0.25, 1, 4]).range([5, 12, 19]);
var fontScale = _d2.default.scale.linear().domain([0.25, 1, 4]).range([10, 14, 18]);

var notFocusedColor = '#e0e0e0';

/**
 * Expose `utils` for the style functions to use
 */

var utils = {
  pixels: function pixels(zoom, min, normal, max) {
    return zoomScale.range([min, normal, max])(zoom);
  },
  strokeWidth: function strokeWidth(display) {
    return strokeScale(display.scale);
  },
  fontSize: function fontSize(display, data) {
    return Math.floor(fontScale(display.scale));
  },
  defineSegmentCircleMarker: function defineSegmentCircleMarker(display, segment, radius, fillColor) {
    var markerId = 'circleMarker-' + segment.getId();
    display.svg.append('defs').append('svg:marker').attr('id', markerId).attr('refX', radius).attr('refY', radius).attr('markerWidth', radius * 2).attr('markerHeight', radius * 2).attr('markerUnits', 'userSpaceOnUse').append('svg:circle').attr('cx', radius).attr('cy', radius).attr('r', radius).attr('fill', segment.focused ? fillColor : notFocusedColor);

    return 'url(#' + markerId + ')';
  }
};

/**
 * Default Wireframe Edge/Vertex Rules
 */

var wireframeVertices = {
  cx: 0,
  cy: 0,
  r: 3,
  fill: '#000'
};

var wireframeEdges = {
  stroke: '#444',
  'stroke-width': 2,
  'stroke-dasharray': '3px 2px',
  fill: 'none'
};

/**
 * Default Merged Stops Rules
 */

var stopsMerged = {
  fill: function fill(display, point, index, utils) {
    return '#fff';
  },
  r: function r(display, point, index, utils) {
    return utils.pixels(display.scale, 8, 12, 16);
  },
  stroke: function stroke(display, point, index, utils) {
    if (!point.isFocused()) return notFocusedColor;
    return '#000';
  },
  'stroke-width': function strokeWidth(display, point, index, utils) {
    return 2;
  },

  /**
   *  Transitive-specific attribute specifying the shape of the main stop marker.
   *  Can be 'roundedrect', 'rectangle' or 'circle'
   */

  'marker-type': ['circle', function (display, data, index, utils) {
    var point = data.owner;
    if ((point.containsBoardPoint() || point.containsAlightPoint()) && !point.containsTransferPoint()) return 'circle';
  }],

  /**
   *  Transitive-specific attribute specifying any additional padding, in pixels,
   *  to apply to main stop marker. A value of zero (default) results in a that
   *  marker is flush to the edges of the pattern segment(s) the point is set against.
   *  A value greater than zero creates a marker that is larger than the width of
   *  the segments(s).
   */

  'marker-padding': 3,

  visibility: function visibility(display, data) {
    if (!data.owner.containsSegmentEndPoint()) return 'hidden';
  }
};

/**
 * Stops Along a Pattern
 */

var stopsPattern = exports.stops_pattern = {
  cx: 0,
  cy: 0,
  r: [4, function (display, data, index, utils) {
    return utils.pixels(display.scale, 1, 2, 4);
  }, function (display, data, index, utils) {
    var point = data.owner;
    var busOnly = true;
    point.getPatterns().forEach(function (pattern) {
      if (pattern.route && pattern.route.route_type !== 3) busOnly = false;
    });
    if (busOnly && !point.containsSegmentEndPoint()) {
      return 0.5 * utils.pixels(display.scale, 2, 4, 6.5);
    }
  }],
  stroke: 'none',
  visibility: function visibility(display, data) {
    if (display.scale < 1.5) return 'hidden';
    if (data.owner.containsSegmentEndPoint()) return 'hidden';
  }
};

/**
 * Default place rules
 */

var places = {
  cx: 0,
  cy: 0,
  r: 14,
  'stroke-width': '2px',
  stroke: '#000',
  fill: '#fff'
};

/**
 * Default MultiPoint rules -- based on Stop rules
 */

var multipointsMerged = (0, _assign2.default)({}, stopsMerged);

multipointsMerged.visibility = true;

/**
 * Default Multipoint Stops along a pattern
 */

var multipointsPattern = (0, _assign2.default)({}, stopsPattern);

/**
 * Default label rules
 */

var labels = {
  'font-size': 15,
  'font-family': 'sans-serif',
  /*'font-weight': function (display, data, index, utils) {
    var point = data.owner.parent
    if (point.containsBoardPoint() || point.containsAlightPoint()) return 'bold'
  },*/

  /**
   * 'orientations' is a transitive-specific attribute used to specify allowable
   * label placement orientations expressed as one of eight compass directions
   * relative to the point being labeled:
   *
   *        'N'
   *    'NW' |  'NE'
   *       \ | /
   *  'W' -- O -- 'E'
   *       / | \
   *    'SW' | 'SE'
   *        'S
   *
   * Labels oriented 'E' or 'W' are rendered horizontally, 'N' and 'S' vertically,
   * and all others at a 45-degree angle.
   *
   * Returns an array of allowed orientation codes in the order that they will be
   * tried by the labeler.
   */

  orientations: [['E', 'W']]
};

var segmentLabels = {
  'font-size': 15,
  'font-family': 'sans-serif',
  color: '#fff',
  background: '#008'
};

/**
 * All path segments
 * TODO: update old route-pattern-specific code below
 */

var segments = {
  stroke: ['#008', function (display, segment) {
    if (!segment.focused) return notFocusedColor;
    if (segment.type === 'TRANSIT') {
      if (segment.patterns) {
        if (segment.patterns[0].route.route_short_name.toLowerCase().substring(0, 2) === 'dc') return '#f00';
        return segment.patterns[0].route.getColor();
      }
    } else if (segment.type === 'CAR') {
      return '#888';
    } else if (segment.type.startsWith('BICYCLE')) {
      return '#f00';
    } else if (segment.type === 'WALK') {
      return '#86cdf9';
    }
  }],
  'stroke-linecap': ['butt', function (display, segment) {
    if (segment.type === 'WALK') return 'round';
  }],
  'stroke-dasharray': [false, function (display, data) {
    var segment = data;
    if (segment.type === 'WALK') return '0, 8';
    if (segment.type.startsWith('BICYCLE') || segment.type.startsWith('CAR')) return '8, 3';
    if (segment.frequency && segment.frequency.average < 12) {
      if (segment.frequency.average > 6) return '12, 12';
      return '12, 2';
    }
  }],
  'stroke-width': [10, function (display, segment, index, utils) {
    if (segment.type === 'WALK') return 6;
    if (segment.type.startsWith('BICYCLE')) return 4;
    if (segment.type.startsWith('CAR')) return 4;
    if (segment.mode === 3) return 6; // Buses
  }],
  envelope: [function (display, data, index, utils) {
    var segment = data;
    if (segment.type !== 'TRANSIT') {
      return '8px';
    }
    if (segment.mode === 3) {
      return utils.pixels(display.scale, 4, 6, 10) + 'px';
    }
    return utils.pixels(display.scale, 6, 10, 14) + 'px';
  }]
};

/**
 * Segments Front
 */

var segmentsFront = {
  stroke: '#008',
  'stroke-width': function strokeWidth(display, data, index, utils) {
    return utils.pixels(display.scale, 3, 6, 10) / 2 + 'px';
  },
  fill: 'none',
  display: ['none', function (display, data, index, utils) {
    if (data.pattern && data.pattern.route && data.pattern.route.route_type === 3 && data.pattern.route.route_short_name.toLowerCase().substring(0, 2) === 'dc') {
      return 'inline';
    }
  }]
};

/**
 * Segments Halo
 */

var segmentsHalo = {
  stroke: '#fff',
  'stroke-width': function strokeWidth(display, data, index, utils) {
    return data.computeLineWidth(display) + 8;
  },
  'stroke-linecap': 'round',
  fill: 'none'
};

/**
 * Label Containers
 */

var segmentLabelContainers = {
  fill: function fill(display, data) {
    if (!data.isFocused()) return notFocusedColor;
  },
  'stroke-width': function strokeWidth(display, data) {
    if (data.parent.pattern && data.parent.pattern.route.route_short_name.toLowerCase().substring(0, 2) === 'dc') return 1;
    return 0;
  },
  rx: 3,
  ry: 3
};

exports.default = {
  utils: utils,
  wireframe_edges: wireframeEdges,
  wireframe_vertices: wireframeVertices,
  stops_merged: stopsMerged,
  stops_pattern: stopsPattern,
  places: places,
  multipoints_merged: multipointsMerged,
  multipoints_pattern: multipointsPattern,
  labels: labels,
  segments: segments,
  segments_front: segmentsFront,
  segments_halo: segmentsHalo,
  segment_labels: segmentLabels,
  segment_label_containers: segmentLabelContainers
};
module.exports = exports['default'];

//# sourceMappingURL=styles.js