"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * PatternGroup -- a collection of one or more RoutePatterns associated with
 * a PathSegment
 */
var PatternGroup = function () {
  function PatternGroup() {
    (0, _classCallCheck3.default)(this, PatternGroup);

    this.patterns = [];

    // lookup tables mapping pattern IDs to their from/to indices in the containing PathSegment
    this.fromIndexLookup = {};
    this.toIndexLookup = {};
  }

  (0, _createClass3.default)(PatternGroup, [{
    key: "addPattern",
    value: function addPattern(pattern, fromIndex, toIndex) {
      if (this.patterns.indexOf(pattern) === -1) {
        this.patterns.push(pattern);
        this.fromIndexLookup[pattern.pattern_id] = fromIndex;
        this.toIndexLookup[pattern.pattern_id] = toIndex;
      }
    }
  }, {
    key: "getFromIndex",
    value: function getFromIndex(pattern) {
      return this.fromIndexLookup[pattern.pattern_id];
    }
  }, {
    key: "getToIndex",
    value: function getToIndex(pattern) {
      return this.toIndexLookup[pattern.pattern_id];
    }
  }]);
  return PatternGroup;
}();

exports.default = PatternGroup;
module.exports = exports["default"];

//# sourceMappingURL=patterngroup.js