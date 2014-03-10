
/**
 * Dependencies
 */

var each = require('each');
var merge = require('merge-util');
var styles = require('./styles');
var StyleSheet = require('stylesheet');
var svgAttributes = require('svg-attributes');

/**
 * Element Types
 */

var types = [ 'labels', 'segments', 'stops_merged', 'stops_pattern', 'places', 'multipoints_merged', 'multipoints_pattern' ];

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

Styler.prototype.clear = function () {
  types.forEach(function (type) {
    this[type] = {};
  }, this);
};

/**
 * Reset to the predefined styles
 */

Styler.prototype.reset = function () {
  types.forEach(function (type) {
    this[type] = merge({}, styles[type]);
  }, this);
};

/**
 * Load rules
 *
 * @param {Object} a set of style rules
 */

Styler.prototype.load = function(styles) {
  var self = this;
  each(types, function(type) {
    if (styles[type]) {
      each(styles[type], function (key, val) {
        self[type][key] = (self[type][key] || []).concat(val);
      });
    }
  });
};

/**
 * Render pattern
 *
 * @param {Display} display
 * @param {Pattern} pattern
 */

Styler.prototype.renderSegment = function(display, segment) {
  this.applyAttrAndStyle(
    display,
    segment,
    this.segments
  );
};



/**
 * Render elements against these rules
 *
 * @param {Display} a D3 list of elements
 * @param {Point} Transitive Point object
 */

Styler.prototype.renderPoint = function(display, point) {
  if(point.getType() === 'STOP') this.renderStop(display, point);
  if(point.getType() === 'PLACE') this.renderPlace(display, point);
  if(point.getType() === 'MULTI') this.renderMultiPoint(display, point);
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
    stop.svgGroup.selectAll('.transitive-stop-marker-pattern'),
    this.stops_pattern
  );

  this.applyAttrAndStyle(
    display,
    stop.svgGroup.selectAll('.transitive-stop-marker-merged'),
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

  /*this.applyAttrAndStyle(
    display,
    place.svgGroup.selectAll('.transitive-multipoint-circle'),
    this.multipoints
  );*/

  this.applyAttrAndStyle(
    display,
    multipoint.svgGroup.selectAll('.transitive-multipoint-label'),
    this.labels
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
  var self = this;
  each(attributes, function(name, rules) {
    var fn = svgAttributes.indexOf(name) === -1
      ? 'style'
      : 'attr';

    elements[fn](name, function(data, index) {
      return self.compute(rules, display, data, index);
    });
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
  each(rules, function(rule) {
    var val = isFunction(rule)
      ? rule.call(self, display, data, index, styles.utils)
      : rule;
    if (val !== undefined && val !== null) computed = val;
  });
  return computed;
};

/**
 * Is function?
 */

function isFunction(val) {
  return Object.prototype.toString.call(val) === '[object Function]';
}
