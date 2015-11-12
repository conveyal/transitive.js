var each = require('component-each');

var Route = require('../core/route');
var RoutePattern = require('../core/pattern');
var Util = require('../util');

var styles = require('./styles');

/**
 * Element Types
 */

var types = [
  'labels',
  'segments',
  'segments_front',
  'segments_halo',
  'segment_labels',
  'segment_label_containers',
  'stops_merged',
  'stops_pattern',
  'places',
  'places_icon',
  'multipoints_merged',
  'multipoints_pattern',
  'wireframe_vertices',
  'wireframe_edges'
];

/**
 * SVG attributes
 */

var svgAttributes = [
  'height',
  'target',
  'title',
  'width',
  'y1',
  'y2',
  'x1',
  'x2',
  'cx',
  'cy',
  'dx',
  'dy',
  'rx',
  'ry',
  'd',
  'r',
  'y',
  'x',
  'transform'
];

/**
 * Expose `Styler`
 */

module.exports = Styler;

/**
 * Styler object
 */

function Styler(styles) {
  if (!(this instanceof Styler)) return new Styler(styles);

  // reset styles
  this.reset();

  // load styles
  if (styles) this.load(styles);
}

/**
 * Clear all current styles
 */

Styler.prototype.clear = function() {
  for (var i in types) {
    this[types[i]] = {};
  }
};

/**
 * Reset to the predefined styles
 */

Styler.prototype.reset = function() {
  for (var i in types) {
    var type = types[i];
    this[type] = Object.assign({}, styles[type] || {});
    for (var key in this[type]) {
      if (!Array.isArray(this[type][key])) this[type][key] = [this[type][key]];
    }
  }
};

/**
 * Load rules
 *
 * @param {Object} a set of style rules
 */

Styler.prototype.load = function(styles) {
  var self = this;
  for (var i in types) {
    var type = types[i];
    if (styles[type]) {
      for (var key in styles[type]) {
        this[type][key] = (this[type][key] || []).concat(styles[type][key]);
      }
    }
  }
};

/**
 * Style a Segment using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {RenderedSegment} Transitive RenderedSegment object
 */

Styler.prototype.styleSegment = function(display, segment) {

  if (segment.lineGraphHalo) {

    this.applyAttrAndStyle(
      display,
      segment.lineGraphHalo,
      this.segments_halo
    );
  }

  this.applyAttrAndStyle(
    display,
    segment.lineGraph,
    this.segments
  );

  this.applyAttrAndStyle(
    display,
    segment.lineGraphFront,
    this.segments_front
  );
};

/**
 * Style a WireframeEdge using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {WireframeEdge} Transitive WireframeEdge object
 */

Styler.prototype.styleWireframeEdge = function(display, wfEdge) {
  this.applyAttrAndStyle(
    display,
    wfEdge.svgGroup.selectAll('.transitive-wireframe-edge-line'),
    this.wireframe_edges
  );
};

/**
 * Style a Point using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {Point} Transitive Point object
 */

Styler.prototype.stylePoint = function(display, point) {
  if (point.getType() === 'STOP') this.styleStop(display, point);
  if (point.getType() === 'PLACE') this.stylePlace(display, point);
  if (point.getType() === 'MULTI') this.styleMultiPoint(display, point);
  if (point.getType() === 'WIREFRAME_VERTEX') this.styleWireframeVertex(display, point);
};

/**
 * Style a Stop using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {Stop} Transitive Stop object
 */

Styler.prototype.styleStop = function(display, stop) {
  this.applyAttrAndStyle(
    display,
    stop.patternMarkers,
    this.stops_pattern
  );

  this.applyAttrAndStyle(
    display,
    stop.mergedMarker,
    this.stops_merged
  );

  this.applyAttrAndStyle(
    display,
    stop.svgGroup.selectAll('.transitive-stop-label'),
    this.labels
  );
};

/**
 * Style a Place using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {Place} Transitive Place object
 */

Styler.prototype.stylePlace = function(display, place) {
  this.applyAttrAndStyle(
    display,
    place.svgGroup.selectAll('.transitive-place-circle'),
    this.places
  );

  this.applyAttrAndStyle(
    display,
    place.svgGroup.selectAll('.transitive-place-icon'),
    this.places_icon
  );

  this.applyAttrAndStyle(
    display,
    place.svgGroup.selectAll('.transitive-place-label'),
    this.labels
  );
};

/**
 * Style a MultiPoint using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {MultiPoint} Transitive MultiPoint object
 */

Styler.prototype.styleMultiPoint = function(display, multipoint) {
  this.applyAttrAndStyle(
    display,
    multipoint.svgGroup.selectAll('.transitive-multipoint-marker-pattern'),
    this.multipoints_pattern
  );

  this.applyAttrAndStyle(
    display,
    multipoint.svgGroup.selectAll('.transitive-multipoint-marker-merged'),
    this.multipoints_merged
  );

  this.applyAttrAndStyle(
    display,
    multipoint.svgGroup.selectAll('.transitive-multi-label'),
    this.labels
  );
};

/**
 * Style a WireframeVertex using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {WireframeVertex} Transitive WireframeVertex object
 */

Styler.prototype.styleWireframeVertex = function(display, wfVertex) {
  this.applyAttrAndStyle(
    display,
    wfVertex.svgGroup.selectAll('.transitive-wireframe-vertex-circle'),
    this.wireframe_vertices
  );
};

/**
 * Style a Point label using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {Point} Transitive Point object
 */

Styler.prototype.stylePointLabel = function(display, point) {
  var pointType = point.getType().toLowerCase();

  this.applyAttrAndStyle(
    display,
    point.svgGroup.selectAll('.transitive-' + pointType + '-label'),
    this.labels
  );
};

/**
 * Style a Segment label using the rules defined in styles.js or the Transitive options
 *
 * @param {Display} Transitive Display object
 * @param {SegmentLabel} Transitive SegmentLabel object
 */

Styler.prototype.styleSegmentLabel = function(display, label) {
  this.applyAttrAndStyle(
    display,
    label.svgGroup.selectAll('.transitive-segment-label-container'),
    this.segment_label_containers
  );
  this.applyAttrAndStyle(
    display,
    label.svgGroup.selectAll('.transitive-segment-label'),
    this.segment_labels
  );
};

/**
 * Check if it's an attribute or a style and apply accordingly
 *
 * @param {Display} the Display object
 * @param {Object} a D3 list of elements
 * @param {Object} the list of attributes
 */

Styler.prototype.applyAttrAndStyle = function(display, elements, attributes) {
  for (var name in attributes) {
    var rules = attributes[name];
    var fn = svgAttributes.indexOf(name) === -1 ? 'style' : 'attr';

    this.applyRules(display, elements, name, rules, fn);
  }
};

/**
 * Apply style/attribute rules to a list of elements
 *
 * @param {Display} display object
 * @param {Object} elements
 * @param {String} rule name
 * @param {Array} rules
 * @param {String} style/attr
 */

Styler.prototype.applyRules = function(display, elements, name, rules, fn) {
  var self = this;
  elements[fn](name, function(data, index) {
    return self.compute(rules, display, data, index);
  });
};

/**
 * Compute a style rule based on the current display and data
 *
 * @param {Array} array of rules
 * @param {Object} the Display object
 * @param {Object} data associated with this object
 * @param {Number} index of this object
 */

Styler.prototype.compute = function(rules, display, data, index) {
  var computed, self = this;
  for (var i in rules) {
    var rule = rules[i];
    var val = isFunction(rule) ? rule.call(self, display, data, index, styles.utils) :
      rule;
    if (val !== undefined && val !== null) computed = val;
  }
  return computed;
};

/**
 * Return the collection of default segment styles for a mode.
 *
 * @param {String} an OTP mode string
 */

Styler.prototype.getModeStyles = function(mode, display) {
  var modeStyles = {};

  // simulate a segment w/ the specified style
  var segment = {
    focused: true,
    isFocused: function() {
      return true;
    }
  };

  if (mode === "WALK" || mode === "BICYCLE" ||  mode === "BICYCLE_RENT" || mode === "CAR") {
    segment.type = mode;
  } else { // assume a transit mode
    segment.type = "TRANSIT";
    segment.mode = Util.otpModeToGtfsType(mode);
    var route = new Route({
      route_type: segment.mode,
      agency_id: "",
      route_id: "",
      route_short_name: "",
      route_long_name: ""
    });
    var pattern = new RoutePattern({});
    route.addPattern(pattern);
    segment.patterns = [pattern];
  }

  for (var attrName in this.segments) {
    var rules = this.segments[attrName];
    for (var i in rules) {
      var rule = rules[i];
      var val = isFunction(rule) ? rule.call(this, display, segment, 0, styles.utils) :
        rule;
      if (val !== undefined && val !== null) {
        modeStyles[attrName] = val;
      }
    }
  }

  return modeStyles;
};

/**
 * Is function?
 */

function isFunction(val) {
  return Object.prototype.toString.call(val) === '[object Function]';
}
