var d3 = require('d3');
var debug = require('debug')('transitive');
var Emitter = require('emitter');
var each = require('each');

var Network = require('./core/network');

var Display = require('./display');
var Legend = require('./display/legend');

var Renderer = require('./renderer');
var Styler = require('./styler');
var Labeler = require('./labeler');

var SphericalMercator = require('./util/spherical-mercator');
var sm = new SphericalMercator();

/**
 * Expose `Transitive`
 */

module.exports = Transitive;

/**
 * Expose `version`
 */

module.exports.version = '0.6.6';

/**
 * Create a new instance of `Transitive`
 *
 * @param {Object} options object
 *   - data {Object} data to render
 *   - drawGrid {Boolean} defaults to false
 *   - el {Element} element to render to
 *   - gridCellSize {Number} size of the grid
 *   - style {Object} styles to apply
 */

function Transitive(options) {

  if (!(this instanceof Transitive)) return new Transitive(options);

  this.options = options;
  if (this.options.useDynamicRendering === undefined) this.options.useDynamicRendering =
    true;
  if (this.options.zoomEnabled === undefined) this.options.zoomEnabled = true;
  if (this.options.autoResize === undefined) this.options.autoResize = true;

  if (options.el) this.setElement(options.el);

  this.data = options.data;

  this.renderer = new Renderer(this);
  this.labeler = new Labeler(this);
  this.styler = new Styler(options.styles);

  this.paths = [];
  if (options.legendEl) this.legend = new Legend(options.legendEl, this);
}

/**
 * Mixin `Emitter`
 */

Emitter(Transitive.prototype);

/**
 * Clear the Network data and redraw the (empty) map
 */

Transitive.prototype.clearData = function() {
  this.network = this.data = null;
  this.labeler.clear();
  this.emit('clear data', this);
};

/**
 * Update the Network data and redraw the map
 */

Transitive.prototype.updateData = function(data) {
  this.network = null;
  this.data = data;
  if (this.display) this.display.scaleSet = false;
  this.labeler.clear();
  this.emit('update data', this);
};

/**
 * Return the collection of default segment styles for a mode.
 *
 * @param {String} an OTP mode string
 */

Transitive.prototype.getModeStyles = function(mode) {
  return this.styler.getModeStyles(mode, this.display || new Display(this));
};

/** Display/Render Methods **/

/**
 * Set the DOM element that serves as the main map canvas
 */

Transitive.prototype.setElement = function(el, legendEl) {
  if (this.el) d3.select(this.el).selectAll('*').remove();

  this.el = el;
  this.display = new Display(this);

  // Emit click events
  var self = this;
  this.display.svg.on('click', function() {
    var x = d3.event.x;
    var y = d3.event.y;
    var geographic = sm.inverse([x, y]);
    self.emit('click', {
      x: x,
      y: y,
      lng: geographic[0],
      lat: geographic[1]
    });
  });

  this.emit('set element', this, this.el);
  return this;
};

/**
 * Render
 */

Transitive.prototype.render = function() {

  if (!this.network) {
    this.network = new Network(this, this.data);
  }

  if (!this.display.scaleSet) {
    this.display.setScale(this.network.graph.bounds(), this.options);
  }

  this.renderer.render();

  this.emit('render', this);
};

/**
 * Render to
 *
 * @param {Element} el
 */

Transitive.prototype.renderTo = function(el) {
  this.setElement(el);
  this.render();

  this.emit('render to', this);
  return this;
};

/**
 * Refresh
 */

Transitive.prototype.refresh = function(panning) {
  this.renderer.refresh();
};

/**
 * focusJourney
 */

Transitive.prototype.focusJourney = function(journeyId) {
  var path = journeyId ? this.network.journeys[journeyId].path : null;
  this.renderer.focusPath(path);
};


/**
 * setBounds
 */

Transitive.prototype.setBounds = function(llBounds) {
  this.display.updateDomains([sm.forward(llBounds[0]), sm.forward(llBounds[1])]);
  this.display.zoomChanged();
};


/**
 * resize
 */

Transitive.prototype.resize = function(width, height) {
  if(!this.display) return;
  d3.select(this.display.el)
    .style("width", width + 'px')
    .style("height", height + 'px');
  this.display.resized();
};
