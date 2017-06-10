import d3 from 'd3'

/**
 * Scales for utility functions to use
 */

const zoomScale = d3.scale.linear().domain([0.25, 1, 4])
const strokeScale = d3.scale.linear().domain([0.25, 1, 4]).range([5, 12, 19])
const fontScale = d3.scale.linear().domain([0.25, 1, 4]).range([10, 14, 18])

var notFocusedColor = '#e0e0e0'

/**
 * Expose `utils` for the style functions to use
 */

const utils = {
  pixels: function (zoom, min, normal, max) {
    return zoomScale.range([min, normal, max])(zoom)
  },
  strokeWidth: function (display) {
    return strokeScale(display.zoom.scale())
  },
  fontSize: function (display, data) {
    return Math.floor(fontScale(display.zoom.scale()))
  },
  defineSegmentCircleMarker: function (display, segment, radius, fillColor) {
    var markerId = 'circleMarker-' + segment.getId()
    display.svg.append('defs').append('svg:marker')
      .attr('id', markerId)
      .attr('refX', radius)
      .attr('refY', radius)
      .attr('markerWidth', radius * 2)
      .attr('markerHeight', radius * 2)
      .attr('markerUnits', 'userSpaceOnUse')
      .append('svg:circle')
      .attr('cx', radius)
      .attr('cy', radius)
      .attr('r', radius)
      .attr('fill', segment.focused ? fillColor : notFocusedColor)

    return 'url(#' + markerId + ')'
  }
}

/**
 * Default Wireframe Edge/Vertex Rules
 */

const wireframeVertices = {
  cx: 0,
  cy: 0,
  r: 3,
  fill: '#000'
}

const wireframeEdges = {
  stroke: '#444',
  'stroke-width': 2,
  'stroke-dasharray': '3px 2px',
  fill: 'none'
}

/**
 * Default Merged Stops Rules
 */

const stopsMerged = {
  fill: function (display, data, index, utils) {
    return '#fff'
  },
  r: function (display, data, index, utils) {
    return utils.pixels(display.zoom.scale(), 8, 12, 16)
  },
  stroke: function (display, data, index, utils) {
    var point = data.owner
    if (!point.isFocused()) return notFocusedColor
    return '#000'
  },
  'stroke-width': function (display, data, index, utils) {
    return 2
  },

  /**
   *  Transitive-specific attribute specifying the shape of the main stop marker.
   *  Can be 'roundedrect', 'rectangle' or 'circle'
   */

  'marker-type': [
    'circle',
    function (display, data, index, utils) {
      var point = data.owner
      if ((point.containsBoardPoint() || point.containsAlightPoint()) && !point.containsTransferPoint()) return 'circle'
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

  visibility: function (display, data) {
    if (!data.owner.containsSegmentEndPoint()) return 'hidden'
  }
}

/**
 * Stops Along a Pattern
 */

const stopsPattern = exports.stops_pattern = {
  cx: 0,
  cy: 0,
  r: [
    4,
    function (display, data, index, utils) {
      return utils.pixels(display.zoom.scale(), 1, 2, 4)
    },
    function (display, data, index, utils) {
      var point = data.owner
      var busOnly = true
      point.getPatterns().forEach(function (pattern) {
        if (pattern.route && pattern.route.route_type !== 3) busOnly = false
      })
      if (busOnly && !point.containsSegmentEndPoint()) {
        return 0.5 * utils.pixels(display.zoom.scale(), 2, 4, 6.5)
      }
    }
  ],
  stroke: 'none',
  visibility: function (display, data) {
    if (display.zoom.scale() < 1.5) return 'hidden'
    if (data.owner.containsSegmentEndPoint()) return 'hidden'
  }
}

/**
 * Default place rules
 */

const places = {
  cx: 0,
  cy: 0,
  r: 14,
  stroke: '0px',
  fill: '#fff'
}

/**
 * Default MultiPoint rules -- based on Stop rules
 */

const multipointsMerged = Object.assign({}, stopsMerged)

multipointsMerged.visibility = true

/**
 * Default Multipoint Stops along a pattern
 */

const multipointsPattern = Object.assign({}, stopsPattern)

/**
 * Default label rules
 */

const labels = {
  'font-size': function (display, data, index, utils) {
    return utils.fontSize(display, data) + 'px'
  },
  'font-weight': function (display, data, index, utils) {
    var point = data.owner.parent
    if (point.containsBoardPoint() || point.containsAlightPoint()) return 'bold'
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
}

/**
 * All path segments
 * TODO: update old route-pattern-specific code below
 */

const segments = {
  stroke: [
    '#008',
    function (display, data) {
      var segment = data
      if (!segment.focused) return notFocusedColor
      if (segment.type === 'TRANSIT') {
        if (segment.patterns) {
          if (segment.patterns[0].route.route_short_name.toLowerCase().substring(
            0,
            2) === 'dc') return '#f00'
          return segment.patterns[0].route.getColor()
        }
      } else if (segment.type === 'CAR') {
        return '#888'
      }
    }
  ],
  'stroke-dasharray': [
    false,
    function (display, data) {
      var segment = data
      if (segment.frequency && segment.frequency.average < 12) {
        if (segment.frequency.average > 6) return '12px, 12px'
        return '12px, 2px'
      }
    }
  ],
  'stroke-width': [
    '12px',
    function (display, data, index, utils) {
      var segment = data

      if (segment.mode === 3) {
        return utils.pixels(display.zoom.scale(), 2, 4, 8) + 'px'
      }
      return utils.pixels(display.zoom.scale(), 4, 8, 12) + 'px'
    }
  ],
  envelope: [

    function (display, data, index, utils) {
      var segment = data
      if (segment.type !== 'TRANSIT') {
        return '8px'
      }
      if (segment.mode === 3) {
        return utils.pixels(display.zoom.scale(), 4, 6, 10) + 'px'
      }
      return utils.pixels(display.zoom.scale(), 6, 10, 14) + 'px'
    }
  ]
}

/**
 * Segments Front
 */

const segmentsFront = {
  stroke: '#008',
  'stroke-width': function (display, data, index, utils) {
    return utils.pixels(display.zoom.scale(), 3, 6, 10) / 2 + 'px'
  },
  fill: 'none',
  display: [
    'none',
    function (display, data, index, utils) {
      if (data.pattern && data.pattern.route && data.pattern.route.route_type ===
        3 &&
        data.pattern.route.route_short_name.toLowerCase().substring(0, 2) ===
        'dc') {
        return 'inline'
      }
    }
  ]
}

/**
 * Segments Halo
 */

const segmentsHalo = {
  stroke: '#fff',
  'stroke-width': function (display, data, index, utils) {
    return data.computeLineWidth(display) + 8
  },
  'stroke-linecap': 'round',
  fill: 'none'
}

/**
 * Label Containers
 */

const segmentLabelContainers = {
  fill: function (display, data) {
    if (!data.isFocused()) return notFocusedColor
  },
  'stroke-width': function (display, data) {
    if (data.parent.pattern && data.parent.pattern.route.route_short_name.toLowerCase()
      .substring(0, 2) === 'dc') return 1
    return 0
  },
  rx: 3,
  ry: 3
}

export default {
  utils,
  wireframe_edges: wireframeEdges,
  wireframe_vertices: wireframeVertices,
  stops_merged: stopsMerged,
  stops_pattern: stopsPattern,
  places,
  multipoints_merged: multipointsMerged,
  multipoints_pattern: multipointsPattern,
  labels,
  segments,
  segments_front: segmentsFront,
  segments_halo: segmentsHalo,
  segment_label_containers: segmentLabelContainers
}
