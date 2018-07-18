'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = computeStyle;

var _styles = require('./styles');

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function computeStyle(rules, display, data, index) {
  var computed;
  var self = this;
  for (var i in rules) {
    var rule = rules[i];
    var val = typeof rule === 'function' ? rule.call(self, display, data, index, _styles2.default.utils) : rule;
    if (val !== undefined && val !== null) computed = val;
  }
  return computed;
}
module.exports = exports['default'];

//# sourceMappingURL=compute-style.js