var clone = require('clone');
var each = require('each');
var svgAttributes = require('svg-attributes');

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
  'multipoints_pattern'
];

/**
 * Add transform
 */

svgAttributes.push('transform');

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
    this[type] = clone(styles[type] || {});
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
 * Render pattern
 *
 * @param {Display} display
 * @param {Pattern} pattern
 */

Styler.prototype.renderSegment = function(display, segment) {

  if(segment.lineGraphHalo) {

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
 * Render elements against these rules
 *
 * @param {Display} a D3 list of elements
 * @param {Point} Transitive Point object
 */

Styler.prototype.renderPoint = function(display, point) {
  if (point.getType() === 'STOP') this.renderStop(display, point);
  if (point.getType() === 'PLACE') this.renderPlace(display, point);
  if (point.getType() === 'MULTI') this.renderMultiPoint(display, point);
};

/**
 * Render elements against these rules
 *
 * @param {Display} a D3 list of elements
 * @param {Stop} Transitive Stop object
 */

Styler.prototype.renderStop = function(display, stop) {
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
 * Render elements against these rules
 *
 * @param {Display} a D3 list of elements
 * @param {Place} Transitive Place object
 */

Styler.prototype.renderPlace = function(display, place) {
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
 * Render elements against these rules
 *
 * @param {Display} a D3 list of elements
 * @param {MultiPoint} Transitive MultiPoint object
 */

Styler.prototype.renderMultiPoint = function(display, multipoint) {
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
 * Render elements against these rules
 *
 * @param {Display} a D3 list of elements
 * @param {Point} Transitive Point object
 */

Styler.prototype.renderPointLabel = function(display, point) {
  var pointType = point.getType().toLowerCase();

  this.applyAttrAndStyle(
    display,
    point.svgGroup.selectAll('.transitive-' + pointType + '-label'),
    this.labels
  );
};

Styler.prototype.renderSegmentLabel = function(display, label) {
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
 * Is function?
 */

function isFunction(val) {
  return Object.prototype.toString.call(val) === '[object Function]';
}
