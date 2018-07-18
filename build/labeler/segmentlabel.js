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

var _label = require('./label');

var _label2 = _interopRequireDefault(_label);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * SegmentLabel object
 */

var SegmentLabel = function (_Label) {
  (0, _inherits3.default)(SegmentLabel, _Label);

  function SegmentLabel(parent, text) {
    (0, _classCallCheck3.default)(this, SegmentLabel);

    var _this = (0, _possibleConstructorReturn3.default)(this, (SegmentLabel.__proto__ || (0, _getPrototypeOf2.default)(SegmentLabel)).call(this, parent));

    _this.labelText = text;
    return _this;
  }

  (0, _createClass3.default)(SegmentLabel, [{
    key: 'render',
    value: function render(display) {
      display.drawRect({
        x: this.labelAnchor.x - this.containerWidth / 2,
        y: this.labelAnchor.y - this.containerHeight / 2
      }, {
        fill: display.styler.compute2('segment_labels', 'background', this.parent),
        width: this.containerWidth,
        height: this.containerHeight,
        rx: this.containerHeight / 2,
        ry: this.containerHeight / 2
      });

      display.drawText(this.getText(), {
        x: this.labelAnchor.x - this.containerWidth / 2 + this.getPadding(),
        y: this.labelAnchor.y - this.containerHeight / 2 + this.getPadding()
      }, {
        fill: display.styler.compute2('segment_labels', 'color', this.parent),
        'font-size': this.fontSize
      });
    }
  }, {
    key: 'refresh',
    value: function refresh(display) {
      /*if (!this.labelAnchor) return
       if (!this.svgGroup) this.render(display)
       this.svgGroup
        .attr('transform', (d, i) => {
          var tx = (this.labelAnchor.x - this.containerWidth / 2)
          var ty = (this.labelAnchor.y - this.containerHeight / 2)
          return 'translate(' + tx + ',' + ty + ')'
        })*/
    }
  }, {
    key: 'getPadding',
    value: function getPadding() {
      return this.textHeight * 0.3;
    }
  }, {
    key: 'computeContainerDimensions',
    value: function computeContainerDimensions() {
      this.containerWidth = this.textWidth + this.getPadding() * 2;
      this.containerHeight = this.textHeight + this.getPadding() * 2;
    }
  }, {
    key: 'getBBox',
    value: function getBBox() {
      return {
        x: this.labelAnchor.x - this.containerWidth / 2,
        y: this.labelAnchor.y - this.containerHeight / 2,
        width: this.containerWidth,
        height: this.containerHeight
      };
    }
  }, {
    key: 'intersects',
    value: function intersects(obj) {
      if (obj instanceof _label2.default) {
        // todo: handle label-label intersection for diagonally placed labels separately
        return this.intersectsBBox(obj.getBBox());
      } else if (obj.x && obj.y && obj.width && obj.height) {
        return this.intersectsBBox(obj);
      }

      return false;
    }

    /*clear () {
      this.labelAnchor = null
      if (this.svgGroup) {
        this.svgGroup.remove()
        this.svgGroup = null
      }
    }*/

  }]);
  return SegmentLabel;
}(_label2.default);

exports.default = SegmentLabel;
module.exports = exports['default'];

//# sourceMappingURL=segmentlabel.js