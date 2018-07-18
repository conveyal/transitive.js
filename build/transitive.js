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

var _componentEmitter = require('component-emitter');

var _componentEmitter2 = _interopRequireDefault(_componentEmitter);

var _network = require('./core/network');

var _network2 = _interopRequireDefault(_network);

var _svgDisplay = require('./display/svg-display');

var _svgDisplay2 = _interopRequireDefault(_svgDisplay);

var _canvasDisplay = require('./display/canvas-display');

var _canvasDisplay2 = _interopRequireDefault(_canvasDisplay);

var _defaultRenderer = require('./renderer/default-renderer');

var _defaultRenderer2 = _interopRequireDefault(_defaultRenderer);

var _wireframeRenderer = require('./renderer/wireframe-renderer');

var _wireframeRenderer2 = _interopRequireDefault(_wireframeRenderer);

var _styler = require('./styler/styler');

var _styler2 = _interopRequireDefault(_styler);

var _labeler = require('./labeler/labeler');

var _labeler2 = _interopRequireDefault(_labeler);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Expose `Transitive`
 */

// module.exports = Transitive

/**
 * Create a new instance of `Transitive`
 *
 * @param {Object} options object
 *   - data {Object} data to render
 *   - styles {Object} styles to apply
 *   - el {Element} the DOM element to render the main display to
 *   - legendEl {Element} the DOM element to render the legend to
 *   - drawGrid {Boolean} whether to draw a background grid (defaults to false)
 *   - gridCellSize {Number} resolution of the grid in SphericalMercator meters
 *   - draggableTypes {Array} a list of network element types to enable dragging for
 *   - initialBounds {Array} initial lon/lat bounds for the display expressed as [[west, south], [east, north]]
 *   - displayMargins {Object} padding to apply to the initial rendered network within the display. Expressed in pixels for top/bottom/left/right
 *   - mapboxId {String} an Mapbox tileset id for rendering background tiles (Deprecated -- use Leaflet with Leaflet.TransitiveLayer)
 *   - zoomEnabled {Boolean} whether to enable the display's built-in zoom/pan functionality (defaults to true)
 *   - autoResize {Boolean} whether the display should listen for window resize events and update automatically (defaults to true)
 *   - groupEdges {Boolean} whether to consider edges with the same origin/destination equivalent for rendering, even if intermediate stop sequence is different (defaults to true)
 */

var Transitive = function () {
  function Transitive(options) {
    (0, _classCallCheck3.default)(this, Transitive);

    if (!(this instanceof Transitive)) return new Transitive(options);

    this.options = options;
    if (this.options.zoomEnabled === undefined) this.options.zoomEnabled = true;
    if (this.options.autoResize === undefined) this.options.autoResize = true;
    if (this.options.groupEdges === undefined) this.options.groupEdges = true;

    if (options.el) this.el = options.el;

    this.display = this.options.display === 'canvas' ? new _canvasDisplay2.default(this) : new _svgDisplay2.default(this);

    this.data = options.data;

    this.setRenderer(this.options.initialRenderer || 'default');

    this.labeler = new _labeler2.default(this);
    this.styler = new _styler2.default(options.styles, this);
  }

  /**
   * Clear the Network data and redraw the (empty) map
   */

  (0, _createClass3.default)(Transitive, [{
    key: 'clearData',
    value: function clearData() {
      this.network = this.data = null;
      this.labeler.clear();
      this.emit('clear data', this);
    }

    /**
     * Update the Network data and redraw the map
     */

  }, {
    key: 'updateData',
    value: function updateData(data, resetDisplay) {
      this.network = null;
      this.data = data;
      if (resetDisplay) this.display.reset();else if (this.data) this.display.scaleSet = false;
      this.labeler.clear();
      this.emit('update data', this);
    }

    /**
     * Return the collection of default segment styles for a mode.
     *
     * @param {String} an OTP mode string
     */

  }, {
    key: 'getModeStyles',
    value: function getModeStyles(mode) {
      return this.styler.getModeStyles(mode, this.display || new Display(this));
    }

    /** Display/Render Methods **/

    /**
     * Set the DOM element that serves as the main map canvas
     */

  }, {
    key: 'setElement',
    value: function setElement(el, legendEl) {
      if (this.el) _d2.default.select(this.el).selectAll('*').remove();

      this.el = el;

      this.emit('set element', this, this.el);
      return this;
    }

    /**
     * Set the DOM element that serves as the main map canvas
     */

  }, {
    key: 'setRenderer',
    value: function setRenderer(type) {
      switch (type) {
        case 'wireframe':
          this.renderer = new _wireframeRenderer2.default(this);
          break;
        case 'default':
          this.renderer = new _defaultRenderer2.default(this);
          break;
      }
    }

    /**
     * Render
     */

  }, {
    key: 'render',
    value: function render() {
      if (!this.network) {
        this.network = new _network2.default(this, this.data);
      }

      if (!this.display.scaleSet) {
        this.display.fitToWorldBounds(this.network.graph.bounds());
      }

      this.renderer.render();

      this.emit('render', this);
    }

    /**
     * Render to
     *
     * @param {Element} el
     */

  }, {
    key: 'renderTo',
    value: function renderTo(el) {
      this.setElement(el);
      this.render();

      this.emit('render to', this);
      return this;
    }

    /**
     * focusJourney
     */

  }, {
    key: 'focusJourney',
    value: function focusJourney(journeyId) {
      var path = journeyId ? this.network.journeys[journeyId].path : null;
      this.renderer.focusPath(path);
    }

    /**
     * Sets the Display bounds
     * @param {Array} lon/lat bounds expressed as [[west, south], [east, north]]
     */

  }, {
    key: 'setDisplayBounds',
    value: function setDisplayBounds(llBounds) {
      if (!this.display) return;
      var smWestSouth = _util.sm.forward(llBounds[0]);
      var smEastNorth = _util.sm.forward(llBounds[1]);
      this.display.setXDomain([smWestSouth[0], smEastNorth[0]]);
      this.display.setYDomain([smWestSouth[1], smEastNorth[1]]);
      this.display.computeScale();
    }

    /**
     * Gets the Network bounds
     * @returns {Array} lon/lat bounds expressed as [[west, south], [east, north]]
     */

  }, {
    key: 'getNetworkBounds',
    value: function getNetworkBounds() {
      if (!this.network || !this.network.graph) return null;
      var graphBounds = this.network.graph.bounds();
      var ll1 = _util.sm.inverse(graphBounds[0]);
      var ll2 = _util.sm.inverse(graphBounds[1]);
      return [[Math.min(ll1[0], ll2[0]), Math.min(ll1[1], ll2[1])], [Math.max(ll1[0], ll2[0]), Math.max(ll1[1], ll2[1])]];
    }

    /**
     * resize
     */

  }, {
    key: 'resize',
    value: function resize(width, height) {
      if (!this.display) return;
      _d2.default.select(this.display.el).style('width', width + 'px').style('height', height + 'px');
      this.display.resized();
    }

    /**
     * trigger a display resize action (for externally-managed SVG containers)
     */

  }, {
    key: 'resized',
    value: function resized(width, height) {
      this.display.resized(width, height);
    }
  }, {
    key: 'setTransform',
    value: function setTransform(transform) {
      this.display.applyTransform(transform);
      this.render();
    }
  }]);
  return Transitive;
}();

/**
 * Mixin `Emitter`
 */

exports.default = Transitive;
(0, _componentEmitter2.default)(Transitive.prototype);
module.exports = exports['default'];

//# sourceMappingURL=transitive.js