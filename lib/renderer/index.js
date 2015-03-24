var augment = require('augment');
var debug = require('debug')('transitive:renderer');
var each = require('each');

var drawGrid = require('../display/draw-grid');

/**
 * A superclass for a Transitive network rendering engine.
 *
 * @param {Object} the main Transitive object
 */

var Renderer = augment(Object, function() {

  this.constructor = function(transitive) {
    this.transitive = transitive;
  };

  this.render = function() {

    var display = this.transitive.display;
    display.styler = this.transitive.styler;

    // remove all old svg elements
    display.empty();
  };

  /**
   * Refresh
   */

  this.refresh = function(panning) {

    var display = this.transitive.display;
    var network = this.transitive.network;

    if (display.tileLayer) display.tileLayer.zoomed();

    network.graph.vertices.forEach(function(vertex) {
      vertex.point.clearRenderData();
    });
    network.graph.edges.forEach(function(edge) {
      edge.clearRenderData();
    });

    // draw the grid, if necessary
    if (this.transitive.options.drawGrid) drawGrid(display, this.gridCellSize);
  };

  /**
   * sortElements
   */

  this.sortElements = function() {
  };

  /**
   * focusPath
   */

  this.focusPath = function(path) {
  };

});


/**
 * Expose `Renderer`
 */

module.exports = Renderer;
