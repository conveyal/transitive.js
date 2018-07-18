'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

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
 * Label object
 */

var PointLabel = function (_Label) {
  (0, _inherits3.default)(PointLabel, _Label);

  function PointLabel(parent) {
    (0, _classCallCheck3.default)(this, PointLabel);

    var _this = (0, _possibleConstructorReturn3.default)(this, (PointLabel.__proto__ || (0, _getPrototypeOf2.default)(PointLabel)).call(this, parent));

    _this.labelAngle = 0;
    _this.labelPosition = 1;
    return _this;
  }

  (0, _createClass3.default)(PointLabel, [{
    key: 'initText',
    value: function initText() {
      return this.parent.getName();
    }

    /*render (display) {
      this.svgGroup = display.svg.append('g') // this.parent.labelSvg;
      this.svgGroup
        .attr('class', 'transitive-sortable')
        .datum({
          owner: this,
          sortableType: 'POINT_LABEL'
        })
       var typeStr = this.parent.getType().toLowerCase()
       this.mainLabel = this.svgGroup.append('text')
        .datum({
          owner: this
        })
        .attr('id', 'transitive-' + typeStr + '-label-' + this.parent.getId())
        .text(this.getText())
        .attr('font-size', this.fontSize)
        .attr('font-family', this.fontFamily)
        .attr('class', 'transitive-' + typeStr + '-label')
    }
     refresh (display) {
      if (!this.labelAnchor) return
       if (!this.svgGroup) this.render(display)
       this.svgGroup
        .attr('text-anchor', this.labelPosition > 0 ? 'start' : 'end')
        .attr('transform', (d, i) => {
          return 'translate(' + this.labelAnchor.x + ',' + this.labelAnchor
            .y + ')'
        })
       this.mainLabel
        .attr('transform', (d, i) => {
          return 'rotate(' + this.labelAngle + ', 0, 0)'
        })
    }*/

  }, {
    key: 'render',
    value: function render(display) {
      var text = this.getText();
      if (!text || !this.labelAnchor) return;

      var anchor = {
        x: this.labelAnchor.x,
        y: this.labelAnchor.y - this.textHeight / 2
      };

      // define common style attributes for the halo and main text
      var attrs = {
        'fill': '#000',
        'font-size': this.fontSize,
        'text-anchor': this.labelPosition > 0 ? 'start' : 'end'
      };

      // draw the halo
      display.drawText(text, anchor, (0, _assign2.default)({}, attrs, {
        'stroke': '#fff',
        'stroke-width': 3,
        'stroke-opacity': 0.75,
        fill: 'none'
      }));

      // draw the main text
      display.drawText(text, anchor, attrs);
    }
  }, {
    key: 'setOrientation',
    value: function setOrientation(orientation) {
      this.orientation = orientation;

      var markerBBox = this.parent.getMarkerBBox();
      if (!markerBBox) return;

      var x, y;
      var offset = 5;

      if (orientation === 'E') {
        x = markerBBox.x + markerBBox.width + offset;
        y = markerBBox.y + markerBBox.height / 2;
        this.labelPosition = 1;
        this.labelAngle = 0;
      } else if (orientation === 'W') {
        x = markerBBox.x - offset;
        y = markerBBox.y + markerBBox.height / 2;
        this.labelPosition = -1;
        this.labelAngle = 0;
      } else if (orientation === 'NE') {
        x = markerBBox.x + markerBBox.width + offset;
        y = markerBBox.y - offset;
        this.labelPosition = 1;
        this.labelAngle = -45;
      } else if (orientation === 'SE') {
        x = markerBBox.x + markerBBox.width + offset;
        y = markerBBox.y + markerBBox.height + offset;
        this.labelPosition = 1;
        this.labelAngle = 45;
      } else if (orientation === 'NW') {
        x = markerBBox.x - offset;
        y = markerBBox.y - offset;
        this.labelPosition = -1;
        this.labelAngle = 45;
      } else if (orientation === 'SW') {
        x = markerBBox.x - offset;
        y = markerBBox.y + markerBBox.height + offset;
        this.labelPosition = -1;
        this.labelAngle = -45;
      } else if (orientation === 'N') {
        x = markerBBox.x + markerBBox.width / 2;
        y = markerBBox.y - offset;
        this.labelPosition = 1;
        this.labelAngle = -90;
      } else if (orientation === 'S') {
        x = markerBBox.x + markerBBox.width / 2;
        y = markerBBox.y + markerBBox.height + offset;
        this.labelPosition = -1;
        this.labelAngle = -90;
      }

      this.labelAnchor = {
        x: x,
        y: y
      };
    }
  }, {
    key: 'getBBox',
    value: function getBBox() {
      if (this.orientation === 'E') {
        return {
          x: this.labelAnchor.x,
          y: this.labelAnchor.y - this.textHeight,
          width: this.textWidth,
          height: this.textHeight
        };
      }

      if (this.orientation === 'W') {
        return {
          x: this.labelAnchor.x - this.textWidth,
          y: this.labelAnchor.y - this.textHeight,
          width: this.textWidth,
          height: this.textHeight
        };
      }

      if (this.orientation === 'N') {
        return {
          x: this.labelAnchor.x - this.textHeight,
          y: this.labelAnchor.y - this.textWidth,
          width: this.textHeight,
          height: this.textWidth
        };
      }

      if (this.orientation === 'S') {
        return {
          x: this.labelAnchor.x - this.textHeight,
          y: this.labelAnchor.y,
          width: this.textHeight,
          height: this.textWidth
        };
      }

      var bboxSide = this.textWidth * Math.sqrt(2) / 2;

      if (this.orientation === 'NE') {
        return {
          x: this.labelAnchor.x,
          y: this.labelAnchor.y - bboxSide,
          width: bboxSide,
          height: bboxSide
        };
      }

      if (this.orientation === 'SE') {
        return {
          x: this.labelAnchor.x,
          y: this.labelAnchor.y,
          width: bboxSide,
          height: bboxSide
        };
      }

      if (this.orientation === 'NW') {
        return {
          x: this.labelAnchor.x - bboxSide,
          y: this.labelAnchor.y - bboxSide,
          width: bboxSide,
          height: bboxSide
        };
      }

      if (this.orientation === 'SW') {
        return {
          x: this.labelAnchor.x - bboxSide,
          y: this.labelAnchor.y,
          width: bboxSide,
          height: bboxSide
        };
      }
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
  }, {
    key: 'runFocusTransition',
    value: function runFocusTransition(display, callback) {
      if (this.mainLabel) {
        if (this.parent.isFocused()) this.setVisibility(true);
        this.mainLabel.transition().style('opacity', this.parent.isFocused() ? 1 : 0).call(callback);
      }
    }
  }]);
  return PointLabel;
}(_label2.default);

exports.default = PointLabel;
module.exports = exports['default'];

//# sourceMappingURL=pointlabel.js