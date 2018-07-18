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
 * Label object
 */

var Label = function () {
  function Label(parent) {
    (0, _classCallCheck3.default)(this, Label);

    this.parent = parent;
    this.sortableType = 'LABEL';
  }

  (0, _createClass3.default)(Label, [{
    key: 'getText',
    value: function getText() {
      if (!this.labelText) this.labelText = this.initText();
      return this.labelText;
    }
  }, {
    key: 'initText',
    value: function initText() {
      return this.parent.getName();
    }
  }, {
    key: 'render',
    value: function render(display) {}
  }, {
    key: 'refresh',
    value: function refresh(display) {}
  }, {
    key: 'setVisibility',
    value: function setVisibility(visibility) {
      if (this.svgGroup) this.svgGroup.attr('display', visibility ? 'initial' : 'none');
    }
  }, {
    key: 'getBBox',
    value: function getBBox() {
      return null;
    }
  }, {
    key: 'intersects',
    value: function intersects(obj) {
      return null;
    }
  }, {
    key: 'intersectsBBox',
    value: function intersectsBBox(bbox) {
      var thisBBox = this.getBBox(this.orientation);
      var r = thisBBox.x <= bbox.x + bbox.width && bbox.x <= thisBBox.x + thisBBox.width && thisBBox.y <= bbox.y + bbox.height && bbox.y <= thisBBox.y + thisBBox.height;
      return r;
    }
  }, {
    key: 'isFocused',
    value: function isFocused() {
      return this.parent.isFocused();
    }
  }, {
    key: 'getZIndex',
    value: function getZIndex() {
      return 1000000;
    }
  }]);
  return Label;
}();

exports.default = Label;
module.exports = exports['default'];

//# sourceMappingURL=label.js