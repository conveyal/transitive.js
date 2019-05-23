'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

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
  function Styler(styles, transitive) {
    (0, _classCallCheck3.default)(this, Styler);

    //if (!(this instanceof Styler)) return new Styler(styles)
    this.transitive = transitive;

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
        var val = typeof rule === 'function' ? rule.call(self, display, data, index, _styles2.default.utils) : rule;
        if (val !== undefined && val !== null) computed = val;
      }
      return computed;
    }
  }, {
    key: 'compute2',
    value: function compute2(type, attr, data, index) {
      var computed = void 0;
      var rules = this[type][attr];
      if (!rules) return null;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(rules), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var rule = _step.value;

          var val = typeof rule === 'function' ? rule.call(this, this.transitive.display, data, index, _styles2.default.utils) : rule;
          if (val !== undefined && val !== null) computed = val;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
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

      if (mode === 'WALK' || mode === 'BICYCLE' || mode === 'BICYCLE_RENT' || mode === 'CAR' || mode === 'CAR_RENT' || mode === 'MICROMOBILITY' || mode === 'MICROMOBILITY_RENT') {
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

//# sourceMappingURL=styler.js