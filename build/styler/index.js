'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _route = require('../core/route');

var _route2 = _interopRequireDefault(_route);

var _pattern = require('../core/pattern');

var _pattern2 = _interopRequireDefault(_pattern);

var _util = require('../util');

var _styles = require('./styles');

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Element Types
 */

var types = ['labels', 'segments', 'segments_front', 'segments_halo', 'segment_labels', 'segment_label_containers', 'stops_merged', 'stops_pattern', 'places', 'places_icon', 'multipoints_merged', 'multipoints_pattern', 'wireframe_vertices', 'wireframe_edges'];

/**
 * SVG attributes
 */

var svgAttributes = ['height', 'target', 'title', 'width', 'y1', 'y2', 'x1', 'x2', 'cx', 'cy', 'dx', 'dy', 'rx', 'ry', 'd', 'r', 'y', 'x', 'transform'];

/**
 * Styler object
 */

var Styler = function () {
  function Styler(styles) {
    (0, _classCallCheck3.default)(this, Styler);

    if (!(this instanceof Styler)) return new Styler(styles);

    // reset styles
    this.reset();

    // load styles
    if (styles) this.load(styles);
  }

  /**
   * Clear all current styles
   */

  (0, _createClass3.default)(Styler, [{
    key: 'clear',
    value: function clear() {
      for (var i in types) {
        this[types[i]] = {};
      }
    }

    /**
     * Reset to the predefined styles
     */

  }, {
    key: 'reset',
    value: function reset() {
      for (var i in types) {
        var type = types[i];
        this[type] = (0, _assign2.default)({}, _styles2.default[type] || {});
        for (var key in this[type]) {
          if (!Array.isArray(this[type][key])) this[type][key] = [this[type][key]];
        }
      }
    }

    /**
     * Load rules
     *
     * @param {Object} a set of style rules
     */

  }, {
    key: 'load',
    value: function load(styles) {
      for (var i in types) {
        var type = types[i];
        if (styles[type]) {
          for (var key in styles[type]) {
            this[type][key] = (this[type][key] || []).concat(styles[type][key]);
          }
        }
      }
    }

    /**
     * Style a Segment using the rules defined in styles.js or the Transitive options
     *
     * @param {Display} Transitive Display object
     * @param {RenderedSegment} Transitive RenderedSegment object
     */

  }, {
    key: 'styleSegment',
    value: function styleSegment(display, segment) {
      if (segment.lineGraphHalo) {
        this.applyAttrAndStyle(display, segment.lineGraphHalo, this.segments_halo);
      }

      this.applyAttrAndStyle(display, segment.lineGraph, this.segments);

      this.applyAttrAndStyle(display, segment.lineGraphFront, this.segments_front);
    }

    /**
     * Style a WireframeEdge using the rules defined in styles.js or the Transitive options
     *
     * @param {Display} Transitive Display object
     * @param {WireframeEdge} Transitive WireframeEdge object
     */

  }, {
    key: 'styleWireframeEdge',
    value: function styleWireframeEdge(display, wfEdge) {
      this.applyAttrAndStyle(display, wfEdge.svgGroup.selectAll('.transitive-wireframe-edge-line'), this.wireframe_edges);
    }

    /**
     * Style a Point using the rules defined in styles.js or the Transitive options
     *
     * @param {Display} Transitive Display object
     * @param {Point} Transitive Point object
     */

  }, {
    key: 'stylePoint',
    value: function stylePoint(display, point) {
      if (point.getType() === 'STOP') this.styleStop(display, point);
      if (point.getType() === 'PLACE') this.stylePlace(display, point);
      if (point.getType() === 'MULTI') this.styleMultiPoint(display, point);
      if (point.getType() === 'WIREFRAME_VERTEX') this.styleWireframeVertex(display, point);
    }

    /**
     * Style a Stop using the rules defined in styles.js or the Transitive options
     *
     * @param {Display} Transitive Display object
     * @param {Stop} Transitive Stop object
     */

  }, {
    key: 'styleStop',
    value: function styleStop(display, stop) {
      this.applyAttrAndStyle(display, stop.patternMarkers, this.stops_pattern);

      this.applyAttrAndStyle(display, stop.mergedMarker, this.stops_merged);

      this.applyAttrAndStyle(display, stop.svgGroup.selectAll('.transitive-stop-label'), this.labels);
    }

    /**
     * Style a Place using the rules defined in styles.js or the Transitive options
     *
     * @param {Display} Transitive Display object
     * @param {Place} Transitive Place object
     */

  }, {
    key: 'stylePlace',
    value: function stylePlace(display, place) {
      this.applyAttrAndStyle(display, place.svgGroup.selectAll('.transitive-place-circle'), this.places);

      this.applyAttrAndStyle(display, place.svgGroup.selectAll('.transitive-place-icon'), this.places_icon);

      this.applyAttrAndStyle(display, place.svgGroup.selectAll('.transitive-place-label'), this.labels);
    }

    /**
     * Style a MultiPoint using the rules defined in styles.js or the Transitive options
     *
     * @param {Display} Transitive Display object
     * @param {MultiPoint} Transitive MultiPoint object
     */

  }, {
    key: 'styleMultiPoint',
    value: function styleMultiPoint(display, multipoint) {
      this.applyAttrAndStyle(display, multipoint.svgGroup.selectAll('.transitive-multipoint-marker-pattern'), this.multipoints_pattern);

      this.applyAttrAndStyle(display, multipoint.svgGroup.selectAll('.transitive-multipoint-marker-merged'), this.multipoints_merged);

      this.applyAttrAndStyle(display, multipoint.svgGroup.selectAll('.transitive-multi-label'), this.labels);
    }

    /**
     * Style a WireframeVertex using the rules defined in styles.js or the Transitive options
     *
     * @param {Display} Transitive Display object
     * @param {WireframeVertex} Transitive WireframeVertex object
     */

  }, {
    key: 'styleWireframeVertex',
    value: function styleWireframeVertex(display, wfVertex) {
      this.applyAttrAndStyle(display, wfVertex.svgGroup.selectAll('.transitive-wireframe-vertex-circle'), this.wireframe_vertices);
    }

    /**
     * Style a Point label using the rules defined in styles.js or the Transitive options
     *
     * @param {Display} Transitive Display object
     * @param {Point} Transitive Point object
     */

  }, {
    key: 'stylePointLabel',
    value: function stylePointLabel(display, point) {
      var pointType = point.getType().toLowerCase();

      this.applyAttrAndStyle(display, point.svgGroup.selectAll('.transitive-' + pointType + '-label'), this.labels);
    }

    /**
     * Style a Segment label using the rules defined in styles.js or the Transitive options
     *
     * @param {Display} Transitive Display object
     * @param {SegmentLabel} Transitive SegmentLabel object
     */

  }, {
    key: 'styleSegmentLabel',
    value: function styleSegmentLabel(display, label) {
      this.applyAttrAndStyle(display, label.svgGroup.selectAll('.transitive-segment-label-container'), this.segment_label_containers);
      this.applyAttrAndStyle(display, label.svgGroup.selectAll('.transitive-segment-label'), this.segment_labels);
    }

    /**
     * Check if it's an attribute or a style and apply accordingly
     *
     * @param {Display} the Display object
     * @param {Object} a D3 list of elements
     * @param {Object} the list of attributes
     */

  }, {
    key: 'applyAttrAndStyle',
    value: function applyAttrAndStyle(display, elements, attributes) {
      for (var name in attributes) {
        var rules = attributes[name];
        var fn = svgAttributes.indexOf(name) === -1 ? 'style' : 'attr';

        this.applyRules(display, elements, name, rules, fn);
      }
    }

    /**
     * Apply style/attribute rules to a list of elements
     *
     * @param {Display} display object
     * @param {Object} elements
     * @param {String} rule name
     * @param {Array} rules
     * @param {String} style/attr
     */

  }, {
    key: 'applyRules',
    value: function applyRules(display, elements, name, rules, fn) {
      var self = this;
      elements[fn](name, function (data, index) {
        return self.compute(rules, display, data, index);
      });
    }

    /**
     * Compute a style rule based on the current display and data
     *
     * @param {Array} array of rules
     * @param {Object} the Display object
     * @param {Object} data associated with this object
     * @param {Number} index of this object
     */

  }, {
    key: 'compute',
    value: function compute(rules, display, data, index) {
      var computed;
      var self = this;
      for (var i in rules) {
        var rule = rules[i];
        var val = isFunction(rule) ? rule.call(self, display, data, index, _styles2.default.utils) : rule;
        if (val !== undefined && val !== null) computed = val;
      }
      return computed;
    }

    /**
     * Return the collection of default segment styles for a mode.
     *
     * @param {String} an OTP mode string
     */

  }, {
    key: 'getModeStyles',
    value: function getModeStyles(mode, display) {
      var modeStyles = {};

      // simulate a segment w/ the specified style
      var segment = {
        focused: true,
        isFocused: function isFocused() {
          return true;
        }
      };

      if (mode === 'WALK' || mode === 'BICYCLE' || mode === 'BICYCLE_RENT' || mode === 'CAR') {
        segment.type = mode;
      } else {
        // assume a transit mode
        segment.type = 'TRANSIT';
        segment.mode = (0, _util.otpModeToGtfsType)(mode);
        var route = new _route2.default({
          route_type: segment.mode,
          agency_id: '',
          route_id: '',
          route_short_name: '',
          route_long_name: ''
        });
        var pattern = new _pattern2.default({});
        route.addPattern(pattern);
        segment.patterns = [pattern];
      }

      for (var attrName in this.segments) {
        var rules = this.segments[attrName];
        for (var i in rules) {
          var rule = rules[i];
          var val = isFunction(rule) ? rule.call(this, display, segment, 0, _styles2.default.utils) : rule;
          if (val !== undefined && val !== null) {
            modeStyles[attrName] = val;
          }
        }
      }

      return modeStyles;
    }
  }]);
  return Styler;
}();

/**
 * Is function?
 */

exports.default = Styler;
function isFunction(val) {
  return Object.prototype.toString.call(val) === '[object Function]';
}
module.exports = exports['default'];

//# sourceMappingURL=index.js