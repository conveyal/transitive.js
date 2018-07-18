'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A transit Route, as defined in the input data.
 * Routes contain one or more Patterns.
 */

var Route = function () {
  function Route(data) {
    (0, _classCallCheck3.default)(this, Route);

    for (var key in data) {
      if (key === 'patterns') continue;
      this[key] = data[key];
    }

    this.patterns = [];
  }

  /**
   * Add Pattern
   *
   * @param {Pattern}
   */

  (0, _createClass3.default)(Route, [{
    key: 'addPattern',
    value: function addPattern(pattern) {
      this.patterns.push(pattern);
      pattern.route = this;
    }
  }, {
    key: 'getColor',
    value: function getColor() {
      if (this.route_color) {
        if (this.route_color.charAt(0) === '#') return this.route_color;
        return '#' + this.route_color;
      }

      // assign a random shade of gray
      /* var c = 128 + Math.floor(64 * Math.random());
      var hex = c.toString(16);
      hex = (hex.length === 1) ? '0' + hex : hex;
       this.route_color = '#' + hex + hex + hex;
       return this.route_color; */
    }
  }]);
  return Route;
}();

exports.default = Route;
module.exports = exports['default'];

//# sourceMappingURL=route.js