var augment = require('augment');
var debug = require('debug')('transitive:renderer');
var each = require('component-each');

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

  this.sortElements = function() {};

  /**
   * focusPath
   */

  this.focusPath = function(path) {};

  this.isDraggable = function(point) {
    var draggableTypes = this.transitive.options.draggableTypes;
    if(!draggableTypes) return false;

    var retval = false;
    each(draggableTypes, function(type) {
      if(type === point.getType()) {
        // Return true in ether of the following cases:
        // 1. No ID array is provided for this point type (i.e. entire type is draggable)
        // 2. An ID array is provided and it includes this Point's ID
        retval = !draggableTypes[type] || draggableTypes[type].indexOf(point.getId()) !== -1;
      }
    });
    return retval;
  };

});

/**
 * Expose `Renderer`
 */

module.exports = Renderer;
