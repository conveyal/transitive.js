import d3 from 'd3'

/**
 * Scales for utility functions to use
 */

const zoomScale = d3.scale.linear().domain([0.25, 1, 4])
const strokeScale = d3.scale.linear().domain([0.25, 1, 4]).range([5, 12, 19])
const fontScale = d3.scale.linear().domain([0.25, 1, 4]).range([10, 14, 18])

const notFocusedColor = '#e0e0e0'

/**
 * Expose `utils` for the style functions to use
 */

const utils = {
  defineSegmentCircleMarker: function (display, segment, radius, fillColor) {
    const markerId = 'circleMarker-' + segment.getId()
    display.svg
      .append('defs')
      .append('svg:marker')
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
  },
  fontSize: function (display) {
    return Math.floor(fontScale(display.scale))
  },
  pixels: function (zoom, min, normal, max) {
    return zoomScale.range([min, normal, max])(zoom)
  },
  strokeWidth: function (display) {
    return strokeScale(display.scale)
  }
}

/**
 * Default Wireframe Edge/Vertex Rules
 */

const wireframeVertices = {
  cx: 0,
  cy: 0,
  fill: '#000',
  r: 3
}

const wireframeEdges = {
  fill: 'none',
  stroke: '#444',
  'stroke-dasharray': '3px 2px',
  'stroke-width': 2
}

/**
 * Default Merged Stops Rules
 */

const stopsMerged = {
  fill: function (display, point, index, utils) {
    return '#fff'
  },

  /**
   *  Transitive-specific attribute specifying any additional padding, in pixels,
   *  to apply to main stop marker. A value of zero (default) results in a that
   *  marker is flush to the edges of the pattern segment(s) the point is set against.
   *  A value greater than zero creates a marker that is larger than the width of
   *  the segments(s).
   */
  'marker-padding': 3,

  /**
   *  Transitive-specific attribute specifying the shape of the main stop marker.
   *  Can be 'roundedrect', 'rectangle' or 'circle'
   */
  'marker-type': [
    'circle',
    function (display, data, index, utils) {
      const point = data.owner
      if (
        (point.containsBoardPoint() || point.containsAlightPoint()) &&
        !point.containsTransferPoint()
      )
        return 'circle'
    }
  ],

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

  visibility: (display, data) => {
    if (!data.owner.containsSegmentEndPoint()) return 'hidden'
  }
}

/**
 * Stops Along a Pattern
 */

const stopsPattern = {
  cx: 0,
  cy: 0,
  r: [
    4,
    (display, data, index, utils) => {
      return utils.pixels(display.scale, 1, 2, 4)
    },
    (display, data, index, utils) => {
      const point = data.owner
      let busOnly = true
      point.getPatterns().forEach((pattern) => {
        if (pattern.route && pattern.route.route_type !== 3) busOnly = false
      })
      if (busOnly && !point.containsSegmentEndPoint()) {
        return 0.5 * utils.pixels(display.scale, 2, 4, 6.5)
      }
    }
  ],
  stroke: 'none',
  visibility: (display, data) => {
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
  fill: '#fff',
  r: 14,
  stroke: '#000',
  'stroke-width': '2px'
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
  'font-family': 'sans-serif',
  'font-size': 15,
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

  orientations: [['E', 'W']]
}

const segmentLabels = {
  background: [
    '#008', // Background color falls back on dark blue.
    function (display, segment) {
      if (segment.type === 'TRANSIT') {
        if (segment.patterns) {
          if (patternIsDcCirculatorBusRoute(segment.patterns[0])) return '#f00'
          return segment.patterns[0].route.getColor()
        }
      }
    }
  ],
  color: [
    '#fff', // Text color falls back on white.
    function (display, segment) {
      if (segment.type === 'TRANSIT') {
        if (segment.patterns) {
          if (patternIsDcCirculatorBusRoute(segment.patterns[0])) return '#fff'
          return segment.patterns[0].route.getTextColor()
        }
      }
    }
  ],
  'font-family': 'sans-serif',
  'font-size': 15
}

/**
 * All path segments
 * TODO: update old route-pattern-specific code below
 */

const segments = {
  envelope: [
    function (display, data, index, utils) {
      const segment = data
      if (segment.type !== 'TRANSIT') {
        return '8px'
      }
      if (segment.mode === 3) {
        return utils.pixels(display.scale, 4, 6, 10) + 'px'
      }
      return utils.pixels(display.scale, 6, 10, 14) + 'px'
    }
  ],
  stroke: [
    '#008', // Dark blue
    function (display, segment) {
      if (!segment.focused) return notFocusedColor
      if (segment.type === 'TRANSIT') {
        if (segment.patterns) {
          if (patternIsDcCirculatorBusRoute(segment.patterns[0])) return '#f00'
          return segment.patterns[0].route.getColor()
        }
      } else if (segment.type === 'CAR') {
        return '#888'
      } else if (segment.type.startsWith('BICYCLE')) {
        return '#f00'
      } else if (
        segment.type.startsWith('MICROMOBILITY') ||
        segment.type.startsWith('SCOOTER')
      ) {
        return '#f5a729'
      } else if (segment.type === 'WALK') {
        return '#86cdf9'
      }
    }
  ],
  'stroke-dasharray': [
    false,
    function (display, data) {
      const segment = data
      if (segment.type === 'WALK') return '0, 8'
      if (
        segment.type.startsWith('BICYCLE') ||
        segment.type.startsWith('CAR') ||
        segment.type.startsWith('MICROMOBILITY') ||
        segment.type.startsWith('SCOOTER')
      ) {
        return '8, 3'
      }
      if (segment.frequency && segment.frequency.average < 12) {
        if (segment.frequency.average > 6) return '12, 12'
        return '12, 2'
      }
    }
  ],
  'stroke-linecap': [
    'butt',
    (display, segment) => {
      if (segment.type === 'WALK') return 'round'
    }
  ],
  'stroke-width': [
    10,
    function (display, segment, index, utils) {
      if (segment.type === 'WALK') return 6
      if (segment.type.startsWith('BICYCLE')) return 4
      if (segment.type.startsWith('CAR')) return 4
      if (segment.type.startsWith('MICROMOBILITY')) return 4
      if (segment.type.startsWith('SCOOTER')) return 4
      if (segment.mode === 3) return 6 // Buses
    }
  ]
}

/**
 * Segments Front
 */

const segmentsFront = {
  display: [
    'none',
    function (display, data, index, utils) {
      if (patternIsDcCirculatorBusRoute(data.pattern)) {
        return 'inline'
      }
    }
  ],
  fill: 'none',
  stroke: '#008',
  'stroke-width': function (display, data, index, utils) {
    return utils.pixels(display.scale, 3, 6, 10) / 2 + 'px'
  }
}

/**
 * Segments Halo
 */

const segmentsHalo = {
  fill: 'none',
  stroke: '#fff',
  'stroke-linecap': 'round',
  'stroke-width': function (display, data, index, utils) {
    return data.computeLineWidth(display) + 8
  }
}

/**
 * Label Containers
 */

const segmentLabelContainers = {
  fill: function (display, data) {
    if (!data.isFocused()) return notFocusedColor
  },
  rx: 3,
  ry: 3,
  'stroke-width': function (display, data) {
    if (patternIsDcCirculatorBusRoute(data.parent.pattern)) return 1
    return 0
  }
}

/**
 * Checks that a pattern runs a DC Bus Circulator route. This check dates back
 * to https://github.com/conveyal/transitive.js/commit/b1561dcb6d864fbe6b01de11aa13d06761e1cefd
 * and was likely added to support CarFreeAtoZ (Arlington, VA). However, this may
 * need to be removed because Arlington no longer runs this service. Also, it
 * appears to be hyper-specific to this one implementation.
 */
function patternIsDcCirculatorBusRoute(pattern) {
  if (!pattern) return false
  const { route } = pattern
  const hasShortName = route && route.route_short_name
  const isBus = route && route.route_type === 3
  return (
    hasShortName &&
    isBus &&
    route.route_short_name.toLowerCase().substring(0, 2) === 'dc'
  )
}

export default {
  labels,
  multipoints_merged: multipointsMerged,
  multipoints_pattern: multipointsPattern,
  places,
  segment_label_containers: segmentLabelContainers,
  segment_labels: segmentLabels,
  segments,
  segments_front: segmentsFront,
  segments_halo: segmentsHalo,
  stops_merged: stopsMerged,
  stops_pattern: stopsPattern,
  utils,
  wireframe_edges: wireframeEdges,
  wireframe_vertices: wireframeVertices
}
