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
 * Default Merged Stops Rules
 */

var stops_merged = exports.stops_merged = {
  fill: function(display, data, index, utils) {
    return '#fff';
  },
  r: function(display, data, index, utils) {
    return utils.pixels(display.zoom.scale(), 8, 12, 16);
  },
  stroke: function(display, data, index, utils) {
    var point = data.owner;
    if (!point.isFocused()) return notFocusedColor;
    return '#000';
  },
  'stroke-width': function(display, data, index, utils) {
    return 2;
  },

  /**
   *  Transitive-specific attribute specifying the shape of the main stop marker.
   *  Can be 'roundedrect', 'rectangle' or 'circle'
   */

  'marker-type': [
    'circle',
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

  'marker-padding': 3,

  visibility: function(display, data) {
    if (!data.owner.containsSegmentEndPoint()) return 'hidden';
  }
};

/**
 * Stops Along a Pattern
 */

var stops_pattern = exports.stops_pattern = {
  cx: 0,
  cy: 0,
  r: [
    4,
    function(display, data, index, utils) {
      return utils.pixels(display.zoom.scale(), 1, 2, 4);
    },
    function(display, data, index, utils) {
      var point = data.owner;
      var busOnly = true;
      point.getPatterns().forEach(function(pattern) {
        if (pattern.route && pattern.route.route_type !== 3) busOnly =
          false;
      });
      if (busOnly && !point.containsSegmentEndPoint()) {
        return 0.5 * utils.pixels(display.zoom.scale(), 2, 4, 6.5);
      }
    }
  ],
  stroke: [
    function(display, data, index, utils) {
      if(data.segment) return data.segment.isFocused();
      var point = data.owner;
      if (!point.isFocused()) return notFocusedColor;
    }
  ],
  'stroke-width': function(display, data, index, utils) {
    return utils.pixels(display.zoom.scale(), 0.5, 1, 1.5) + 'px';
  },
  visibility: function(display, data) {
    if(display.zoom.scale() < 1.5) return 'hidden';
    if (data.owner.containsSegmentEndPoint()) return 'hidden';
  }
};

/**
 * Default place rules
 */

exports.places = {
  cx: 0,
  cy: 0,
  r: 14,
  stroke : '0px',
  fill: '#fff'
};

/**
 * Default MultiPoint rules -- based on Stop rules
 */

var multipoints_merged = exports.multipoints_merged = clone(stops_merged);

multipoints_merged.visibility = true;

/**
 * Default Multipoint Stops along a pattern
 */

exports.multipoints_pattern = clone(stops_pattern);

/**
 * Default label rules
 */

var labels = exports.labels = {
  'font-size': function(display, data, index, utils) {
    return utils.fontSize(display, data) + 'px';
  },
  'font-weight': function(display, data, index, utils) {
    var point = data.owner.parent;
    if (point.containsBoardPoint() || point.containsAlightPoint())
      return 'bold';
  },

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

  orientations: [
    ['E', 'W']
  ]
};

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
        if (segment.patterns) {
          if (segment.patterns[0].route.route_short_name.toLowerCase().substring(0,
            2) === 'dc') return '#f00';
          return segment.patterns[0].route.getColor();
        }
      } else if (segment.type === 'CAR') {
        return '#888';
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

      if (segment.type === 'CAR') {
        return utils.pixels(display.zoom.scale(), 2, 4, 6) + 'px';
      } else if (segment.type === 'WALK' || segment.type === 'BICYCLE') {
        return '0px';
      }

      if (segment.mode === 3) {
        return utils.pixels(display.zoom.scale(), 2, 4, 8) + 'px';
      }
      return utils.pixels(display.zoom.scale(), 4, 8, 12) + 'px';
    }
  ],
  'marker-spacing': [
    function(display, data) {
      if (data.type === 'WALK') return 8;
      if (data.type === 'BICYCLE') return 6;
    }
  ],
  'marker-mid': [

    function(display, data) {
      var segment = data;
      if (segment.type === 'WALK' || segment.type === 'BICYCLE') {
        var r = 3;
        var fillColor = '#5ae3f9';
        if(segment.type === 'BICYCLE') {
          r = 2;
          fillColor = '#f00';
        }

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
          .attr('fill', segment.focused ? fillColor : notFocusedColor);

        return 'url(#WalkCircleMarker-' + segment.getId() + ')';
      }
    }
  ],
  envelope: [

    function(display, data, index, utils) {
      var segment = data;
      if (segment.type !== 'TRANSIT') {
        return '8px';
      }
      if (segment.mode === 3) {
        return utils.pixels(display.zoom.scale(), 4, 6, 10) + 'px';
      }
      return utils.pixels(display.zoom.scale(), 6, 10, 14) + 'px';
    }
  ]
};

/*function defineCircleMarker(r, fillColor, display) {
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
    .attr('fill', segment.focused ? fillColor : notFocusedColor);
}*/

/**
 * Segments Front
 */

exports.segments_front = {
  stroke: '#008',
  'stroke-width': function(display, data, index, utils) {
    return utils.pixels(display.zoom.scale(), 3, 6, 10) / 2 + 'px';
  },
  fill: 'none',
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


/**
 * Segments Halo
 */

exports.segments_halo = {
  stroke: '#fff',
  'stroke-width': function(display, data, index, utils) {
    return data.computeLineWidth(display) + 8;
  },
  'stroke-linecap' : 'round',
  fill: 'none'
};

/**
 * Label Containers
 */

exports.segment_label_containers = {
  fill: function(display, data) {
    if (!data.isFocused()) return notFocusedColor;
  },
  'stroke-width': function(display, data) {
    if (data.parent.pattern && data.parent.pattern.route.route_short_name.toLowerCase()
      .substring(0, 2) === 'dc') return 1;
    return 0;
  },
  rx: 3,
  ry: 3
};
