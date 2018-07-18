'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _display = require('./display');

var _display2 = _interopRequireDefault(_display);

var _svg = require('svg.js');

var _svg2 = _interopRequireDefault(_svg);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SvgDisplay = function (_Display) {
  (0, _inherits3.default)(SvgDisplay, _Display);

  function SvgDisplay(transitive) {
    (0, _classCallCheck3.default)(this, SvgDisplay);

    var _this = (0, _possibleConstructorReturn3.default)(this, (SvgDisplay.__proto__ || (0, _getPrototypeOf2.default)(SvgDisplay)).call(this, transitive));

    var el = transitive.options.el;
    // TODO: handle case of externally-provided SVG?

    // We have a DOM element

    if (el) {
      _this.setDimensions(el.clientWidth, el.clientHeight);
      _this.svg = (0, _svg2.default)(el);
    }
    return _this;
  }

  (0, _createClass3.default)(SvgDisplay, [{
    key: 'clear',
    value: function clear() {
      this.svg.clear();
    }
  }, {
    key: 'drawRect',
    value: function drawRect(upperLeft, attrs) {
      this.svg.rect().move(upperLeft.x, upperLeft.y).attr(attrs);
    }
  }, {
    key: 'drawCircle',
    value: function drawCircle(center, attrs) {
      this.svg.circle().move(center.x, center.y).attr(attrs);
    }
  }, {
    key: 'drawEllipse',
    value: function drawEllipse(center, attrs) {
      this.svg.ellipse().move(center.x, center.y).attr(attrs);
    }
  }, {
    key: 'drawPath',
    value: function drawPath(pathStr, attrs) {
      this.svg.path(pathStr).attr(attrs);
    }
  }, {
    key: 'drawText',
    value: function drawText(text, anchor, attrs) {
      this.svg.text(text).move(anchor.x, anchor.y).attr(attrs);
    }
  }]);
  return SvgDisplay;
}(_display2.default);

exports.default = SvgDisplay;
module.exports = exports['default'];

//# sourceMappingURL=svg-display.js