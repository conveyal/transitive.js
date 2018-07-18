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

var _roundedRect = require('rounded-rect');

var _roundedRect2 = _interopRequireDefault(_roundedRect);

var _display = require('./display');

var _display2 = _interopRequireDefault(_display);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CanvasDisplay = function (_Display) {
  (0, _inherits3.default)(CanvasDisplay, _Display);

  function CanvasDisplay(transitive) {
    (0, _classCallCheck3.default)(this, CanvasDisplay);

    var _this = (0, _possibleConstructorReturn3.default)(this, (CanvasDisplay.__proto__ || (0, _getPrototypeOf2.default)(CanvasDisplay)).call(this, transitive));

    var _transitive$options = transitive.options,
        el = _transitive$options.el,
        canvas = _transitive$options.canvas;

    // Handle case of externally-provided canvas

    if (canvas) {
      // Set internal dimensions to match those of canvas
      _this.setDimensions(canvas.width, canvas.height);
      _this.setCanvas(canvas);

      // We have a DOM element; create canvas
    } else if (el) {
      _this.setDimensions(el.clientWidth, el.clientHeight);

      var _canvas = document.createElement('canvas');
      _canvas.width = el.clientWidth;
      _canvas.height = el.clientHeight;
      el.appendChild(_canvas);

      // Check for Hi-PPI display
      if (window.devicePixelRatio > 1) makeCanvasHiPPI(_canvas);

      _this.setCanvas(_canvas);
    }
    return _this;
  }

  (0, _createClass3.default)(CanvasDisplay, [{
    key: 'setCanvas',
    value: function setCanvas(canvas) {
      this.canvas = canvas;
      this.ctx = this.canvas.getContext('2d');
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }, {
    key: 'drawRect',
    value: function drawRect(upperLeft, attrs) {
      this.ctx.strokeStyle = attrs['stroke'];
      this.ctx.lineWidth = attrs['stroke-width'];
      this.ctx.fillStyle = attrs['fill'];

      this.ctx.beginPath();
      if (attrs.rx && attrs.ry && attrs.rx === attrs.ry) {
        (0, _roundedRect2.default)(this.ctx, upperLeft.x, upperLeft.y, attrs.width, attrs.height, attrs.rx);
        // TODO: handle case where rx != ry
      } else {
        // ordinary rectangle
        this.ctx.rect(upperLeft.x, upperLeft.y, attrs.width, attrs.height);
      }
      this.ctx.closePath();

      if (attrs['fill']) this.ctx.fill();
      if (attrs['stroke']) this.ctx.stroke();
    }
  }, {
    key: 'drawCircle',
    value: function drawCircle(center, attrs) {
      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, attrs.r, 0, Math.PI * 2, true);
      this.ctx.closePath();

      if (attrs['fill']) {
        this.ctx.fillStyle = attrs['fill'];
        this.ctx.fill();
      }
      if (attrs['stroke']) {
        this.ctx.strokeStyle = attrs['stroke'];
        this.ctx.lineWidth = attrs['stroke-width'] || 1;
        this.ctx.stroke();
      }
    }
  }, {
    key: 'drawEllipse',
    value: function drawEllipse(center, attrs) {
      // TODO: implement
    }
  }, {
    key: 'drawPath',
    value: function drawPath(pathStr, attrs) {
      var path = new Path2D(pathStr);

      this.ctx.strokeStyle = attrs['stroke'];
      this.ctx.lineWidth = attrs['stroke-width'];

      // dash array
      if (attrs['stroke-dasharray']) {
        var arr = attrs['stroke-dasharray'].split(',').map(function (str) {
          return parseFloat(str.trim());
        });
        this.ctx.setLineDash(arr);
      }
      // linecap
      this.ctx.lineCap = attrs['stroke-linecap'] || 'butt';

      this.ctx.stroke(path);

      if (attrs['stroke-dasharray']) this.ctx.setLineDash([]);
    }
  }, {
    key: 'drawText',
    value: function drawText(text, anchor, attrs) {
      // For equivalence w/ SVG text rendering
      this.ctx.textBaseline = 'top';

      this.ctx.font = (attrs.fontSize || '14px') + ' ' + (attrs.fontFamily || 'sans-serif');
      if (attrs['text-anchor']) this.ctx.textAlign = attrs['text-anchor'];

      if (attrs['stroke']) {
        this.ctx.strokeStyle = attrs['stroke'];
        if (attrs['stroke-opacity']) this.ctx.globalAlpha = attrs['stroke-opacity'];
        this.ctx.lineWidth = attrs['stroke-width'] || 1;
        this.ctx.strokeText(text, anchor.x, anchor.y);
      }
      if (attrs['fill']) {
        this.ctx.fillStyle = attrs['fill'];
        if (attrs['fill-opacity']) this.ctx.globalAlpha = attrs['fill-opacity'];
        this.ctx.fillText(text, anchor.x, anchor.y);
      }

      this.ctx.textAlign = 'start';
      this.ctx.globalAlpha = 1;
    }
  }]);
  return CanvasDisplay;
}(_display2.default);

// Utility function to support HiPPI displays (e.g. Retina)


exports.default = CanvasDisplay;
function makeCanvasHiPPI(canvas) {
  var PIXEL_RATIO = 2;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';

  canvas.width *= PIXEL_RATIO;
  canvas.height *= PIXEL_RATIO;

  var context = canvas.getContext('2d');
  context.scale(PIXEL_RATIO, PIXEL_RATIO);
}
module.exports = exports['default'];

//# sourceMappingURL=canvas-display.js