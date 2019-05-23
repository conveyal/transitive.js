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

var _point = require('./point');

var _point2 = _interopRequireDefault(_point);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A Point subclass representing a turn point in turn-by-turn directions for a
 * walk/bike/drive segment
 */

var TurnPoint = function (_Point) {
  (0, _inherits3.default)(TurnPoint, _Point);

  function TurnPoint(data, id) {
    (0, _classCallCheck3.default)(this, TurnPoint);

    var _this = (0, _possibleConstructorReturn3.default)(this, (TurnPoint.__proto__ || (0, _getPrototypeOf2.default)(TurnPoint)).call(this, data));

    _this.name = 'Turn @ ' + data.lat + ', ' + data.lon;
    if (!_this.worldX || !_this.worldY) {
      var smCoords = _util.sm.forward([data.lon, data.lat]);
      _this.worldX = smCoords[0];
      _this.worldY = smCoords[1];
      _this.isSegmentEndPoint = false;
    }
    _this.id = id;
    return _this;
  }

  (0, _createClass3.default)(TurnPoint, [{
    key: 'getId',
    value: function getId() {
      return this.id;
    }
  }, {
    key: 'getType',
    value: function getType() {
      return 'TURN';
    }
  }, {
    key: 'getName',
    value: function getName() {
      return this.name;
    }
  }, {
    key: 'containsSegmentEndPoint',
    value: function containsSegmentEndPoint() {
      return this.isSegmentEndPoint;
    }
  }]);
  return TurnPoint;
}(_point2.default);

exports.default = TurnPoint;
module.exports = exports['default'];

//# sourceMappingURL=turn.js