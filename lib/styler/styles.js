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
    return strokeScale(display.scale)
  },
  fontSize: function (display, data) {
    return Math.floor(fontScale(display.scale))
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
  fill: function (display, point, index, utils) {
    return '#fff'
  },
  r: function (display, point, index, utils) {
    return utils.pixels(display.scale, 8, 12, 16)
  },
  stroke: function (display, point, index, utils) {
    if (!point.isFocused()) return notFocusedColor
    return '#000'
  },
  'stroke-width': function (display, point, index, utils) {
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
      return utils.pixels(display.scale, 1, 2, 4)
    },
    function (display, data, index, utils) {
      var point = data.owner
      var busOnly = true
      point.getPatterns().forEach(function (pattern) {
        if (pattern.route && pattern.route.route_type !== 3) busOnly = false
      })
      if (busOnly && !point.containsSegmentEndPoint()) {
        return 0.5 * utils.pixels(display.scale, 2, 4, 6.5)
      }
    }
  ],
  stroke: 'none',
  visibility: function (display, data) {
    if (display.scale < 1.5) return 'hidden'
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
  'stroke-width': '2px',
  stroke: '#000',
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
  'font-size': 15,
  'font-family': 'sans-serif',
  /* 'font-weight': function (display, data, index, utils) {
    var point = data.owner.parent
    if (point.containsBoardPoint() || point.containsAlightPoint()) return 'bold'
  }, */

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

const segmentLabels = {
  'font-size': 15,
  'font-family': 'sans-serif',
  color: '#fff',
  background: '#008'
}

/**
 * All path segments
 * TODO: update old route-pattern-specific code below
 */

const segments = {
  stroke: [
    '#008',
    function (display, segment) {
      if (!segment.focused) return notFocusedColor
      if (segment.type === 'TRANSIT') {
        if (segment.patterns) {
          if (patternIsDcBusRoute(segment.patterns[0])) return '#f00'
          return segment.patterns[0].route.getColor()
        }
      } else if (segment.type === 'CAR') {
        return '#888'
      } else if (segment.type.startsWith('BICYCLE')) {
        return '#f00'
      } else if (segment.type.startsWith('MICROMOBILITY')) {
        return '#f5a729'
      } else if (segment.type === 'WALK') {
        return '#86cdf9'
      }
    }
  ],
  'stroke-linecap': [
    'butt',
    (display, segment) => {
      if (segment.type === 'WALK') return 'round'
    }
  ],
  'stroke-dasharray': [
    false,
    function (display, data) {
      var segment = data
      if (segment.type === 'WALK') return '0, 8'
      if (
        segment.type.startsWith('BICYCLE') ||
        segment.type.startsWith('CAR') ||
        segment.type.startsWith('MICROMOBILITY')
      ) {
        return '8, 3'
      }
      if (segment.frequency && segment.frequency.average < 12) {
        if (segment.frequency.average > 6) return '12, 12'
        return '12, 2'
      }
    }
  ],
  'stroke-width': [
    10,
    function (display, segment, index, utils) {
      if (segment.type === 'WALK') return 6
      if (segment.type.startsWith('BICYCLE')) return 4
      if (segment.type.startsWith('CAR')) return 4
      if (segment.type.startsWith('MICROMOBILITY')) return 4
      if (segment.mode === 3) return 6 // Buses
    }
  ],
  envelope: [

    function (display, data, index, utils) {
      var segment = data
      if (segment.type !== 'TRANSIT') {
        return '8px'
      }
      if (segment.mode === 3) {
        return utils.pixels(display.scale, 4, 6, 10) + 'px'
      }
      return utils.pixels(display.scale, 6, 10, 14) + 'px'
    }
  ]
}

/**
 * Segments Front
 */

const segmentsFront = {
  stroke: '#008',
  'stroke-width': function (display, data, index, utils) {
    return utils.pixels(display.scale, 3, 6, 10) / 2 + 'px'
  },
  fill: 'none',
  display: [
    'none',
    function (display, data, index, utils) {
      if (patternIsDcBusRoute(data.pattern)) {
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
    if (patternIsDcBusRoute(data.parent.pattern)) return 1
    return 0
  },
  rx: 3,
  ry: 3
}

/**
 * Checks that a pattern runs a DC Bus Circulator route. This check dates back
 * to https://github.com/conveyal/transitive.js/commit/b1561dcb6d864fbe6b01de11aa13d06761e1cefd
 * and was likely added to support CarFreeAtoZ (Arlington, VA). However, this may
 * need to be removed because Arlington no longer runs this service. Also, it
 * appears to be hyper-specific to this one implementation.
 */
function patternIsDcCirculatorBusRoute (pattern) {
  if (!pattern) return false
  const {route} = pattern
  const hasShortName = route && route.route_short_name
  const isBus = route && route.route_type === 3
  return hasShortName && isBus && route.route_short_name.toLowerCase().substring(0, 2) === 'dc'
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
  segment_labels: segmentLabels,
  segment_label_containers: segmentLabelContainers
}
