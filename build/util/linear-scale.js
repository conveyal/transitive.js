"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LinearScale = function () {
  function LinearScale(domain, range) {
    (0, _classCallCheck3.default)(this, LinearScale);

    this.domain = domain;
    this.range = range;
  }

  (0, _createClass3.default)(LinearScale, [{
    key: "compute",
    value: function compute(val) {
      var d = this.domain,
          r = this.range;

      return (val - d[0]) / (d[1] - d[0]) * (r[1] - r[0]) + r[0];
    }
  }, {
    key: "invert",
    value: function invert(val) {
      var d = this.domain,
          r = this.range;

      return (val - r[0]) / (r[1] - r[0]) * (d[1] - d[0]) + d[0];
    }
  }]);
  return LinearScale;
}();

exports.default = LinearScale;
module.exports = exports["default"];

//# sourceMappingURL=linear-scale.js