'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _d = require('d3');

var _d2 = _interopRequireDefault(_d);

var _renderededge = require('../renderer/renderededge');

var _renderededge2 = _interopRequireDefault(_renderededge);

var _renderedsegment = require('../renderer/renderedsegment');

var _renderedsegment2 = _interopRequireDefault(_renderedsegment);

var _stop = require('../point/stop');

var _stop2 = _interopRequireDefault(_stop);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Legend
 */

var Legend = function () {
  function Legend(el, display, transitive) {
    (0, _classCallCheck3.default)(this, Legend);

    this.el = el;
    this.display = display;
    this.transitive = transitive;

    this.height = (0, _util.parsePixelStyle)(_d2.default.select(el).style('height'));
  }

  (0, _createClass3.default)(Legend, [{
    key: 'render',
    value: function render(legendSegments) {
      _d2.default.select(this.el).selectAll(':not(.doNotEmpty)').remove();

      this.x = this.spacing;
      this.y = this.height / 2;

      var segment;

      // iterate through the representative map segments
      for (var legendType in legendSegments) {
        var mapSegment = legendSegments[legendType];

        // create a segment solely for rendering in the legend
        segment = new _renderedsegment2.default();
        segment.type = mapSegment.getType();
        segment.mode = mapSegment.mode;
        segment.patterns = mapSegment.patterns;

        var canvas = this.createCanvas();

        var renderData = [];
        renderData.push({
          x: 0,
          y: canvas.height / 2
        });
        renderData.push({
          x: canvas.width,
          y: canvas.height / 2
        });

        segment.render(canvas);
        segment.refresh(canvas, renderData);

        this.renderText(getDisplayText(legendType));

        this.x += this.spacing * 2;
      }

      // create the 'transfer' marker

      var rEdge = new _renderededge2.default(null, true, 'TRANSIT');
      rEdge.pattern = {
        pattern_id: 'ptn',
        route: {
          route_type: 1
        }
      };

      var transferStop = new _stop2.default();
      transferStop.isSegmentEndPoint = true;
      transferStop.isTransferPoint = true;

      this.renderPoint(transferStop, rEdge, 'Transfer');
    }
  }, {
    key: 'renderPoint',
    value: function renderPoint(point, rEdge, text) {
      var canvas = this.createCanvas();

      point.addRenderData({
        owner: point,
        rEdge: rEdge,
        x: canvas.width / 2,
        y: canvas.height / 2,
        offsetX: 0,
        offsetY: 0
      });

      point.render(canvas);

      canvas.styler.stylePoint(canvas, point);
      point.refresh(canvas);

      this.renderText(text);
    }
  }, {
    key: 'renderText',
    value: function renderText(text) {
      _d2.default.select(this.el).append('div').attr('class', 'legendLabel').html(text);
    }
  }, {
    key: 'createCanvas',
    value: function createCanvas() {
      var container = _d2.default.select(this.el).append('div').attr('class', 'legendSvg');

      var width = (0, _util.parsePixelStyle)(container.style('width'));
      if (!width || width === 0) width = 30;

      var height = (0, _util.parsePixelStyle)(container.style('height'));
      if (!height || height === 0) height = this.height;

      var canvas = {
        xScale: _d2.default.scale.linear(),
        yScale: _d2.default.scale.linear(),
        styler: this.transitive.styler,
        zoom: this.display.zoom,
        width: width,
        height: height,
        svg: container.append('svg').style('width', width).style('height', height)
      };

      return canvas;
    }
  }]);
  return Legend;
}();

exports.default = Legend;


function getDisplayText(type) {
  switch (type) {
    case 'WALK':
      return 'Walk';
    case 'BICYCLE':
      return 'Bike';
    case 'CAR':
      return 'Drive';
    case 'TRANSIT_0':
      return 'Tram';
    case 'TRANSIT_1':
      return 'Metro';
    case 'TRANSIT_2':
      return 'Rail';
    case 'TRANSIT_3':
      return 'Bus';
    case 'TRANSIT_4':
      return 'Ferry';
  }
  return type;
}
module.exports = exports['default'];

//# sourceMappingURL=legend.js