var augment = require('augment');
var debug = require('debug')('transitive:renderer');
var each = require('each');

var Renderer = require('./index');
var RenderedEdge = require('./renderededge');
var PathSegment = require('../core/pathsegment');
var RenderedSegment = require('./renderedsegment');
var Point = require('../point/index');

var interpolateLine = require('../util/interpolate-line');



/**
 * The network rendering engine.
 *
 * @param {Object} the main Transitive object
 */

var WireframeRenderer = augment(Renderer, function(base) {

  this.constructor = function(transitive) {
    base.constructor.call(this, transitive);
  };

  this.render = function() {
    base.render.call(this);

    var graph = this.transitive.network.graph;

    var self = this;

    /*each(graph.edges, function(edge) {
      var segment = new RenderedSegment(new PathSegment('WIREFRAME'));
      var rEdge = new RenderedEdge(edge, true);
      rEdge.refreshRenderData(self.transitive.display);
      segment.addRenderedEdge(rEdge);
      segment.render(self.transitive.display);
      self.renderedSegments.push(segment);
    });*/

    this.wireframeEdges = [];
    each(graph.edges, function(edge) {
      var wfEdge = new WireframeEdge(edge);
      wfEdge.render(self.transitive.display);
      self.wireframeEdges.push(wfEdge);
    });

    this.wireframeVertices = [];
    each(graph.vertices, function(vertex) {
      var wfVertex = new WireframeVertex(vertex);
      wfVertex.render(self.transitive.display);
      self.wireframeVertices.push(wfVertex);
    });

    this.transitive.refresh();
  };

  /**if (segment.mode === 3) {
   * Refresh
   */

  this.refresh = function(panning) {
    base.refresh.call(this, panning);

    /*each(this.renderedSegments, function(segment) {
      segment.renderedEdges[0].refreshRenderData(self.transitive.display);
      segment.refresh(self.transitive.display);
    });*/

    each(this.wireframeEdges, function(wfEdge) {
      wfEdge.refresh(self.transitive.display);
    });

    each(this.wireframeVertices, function(wfVertex) {
      wfVertex.refresh(self.transitive.display);
    });
  };

  /**
   * sortElements
   */

  this.sortElements = function() {
  };

});

/**
 * Expose `WireframeRenderer`
 */

module.exports = WireframeRenderer;


/**
 * WireframeVertex helper class
 */


var WireframeVertex = augment(Point, function(base) {

  this.constructor = function(vertex) {
    base.constructor.call(this, { vertex: vertex });
  };

  this.getType = function() {
    return "WIREFRAME_VERTEX";
  };

  /**
   * Draw the vertex
   *
   * @param {Display} display
   */

  this.render = function(display) {
    base.render.call(this, display);

    this.initSvg(display);
    this.svgGroup
      .attr('class', 'transitive-sortable')
      .datum({
        owner: this,
        sortableType: 'POINT_WIREFRAME_VERTEX'
      });

    // set up the marker
    this.marker = this.markerSvg.append('circle')
      .datum({ owner: this })
      .attr('class', 'transitive-wireframe-vertex-circle');
  };

  /**
   * Refresh the vertex
   *
   * @param {Display} display
   */

  this.refresh = function(display) {
    var x = display.xScale(this.vertex.x);
    var y = display.yScale(this.vertex.y);
    var translate = 'translate(' + x + ', ' + y + ')';
    this.marker.attr('transform', translate);
    display.styler.styleWireframeVertex(display, this);
  };

});


/**
 * WireframeEdge helper class
 */


var WireframeEdge = augment(Object, function() {

  this.constructor = function(edge) {
    this.edge = edge;
  };

  this.render = function(display) {
    this.line = d3.svg.line() // the line translation function
      .x(function(data, i) { return data.x; })
      .y(function(data, i) { return data.y; })
      .interpolate(interpolateLine.bind({
        segment: this,
        display: display
      }));

    this.svgGroup = display.svg.append('g');

    this.lineSvg = this.svgGroup.append('g')
      .attr('class', 'transitive-sortable')
      .datum({
        owner: this,
        sortableType: 'WIREFRAME_EDGE'
      });

    this.lineGraph = this.lineSvg.append('path')
      .attr('class', 'transitive-wireframe-edge-line');
  };

  this.refresh = function(display) {
    this.renderData = this.edge.getRenderCoords(0, 0, display, true);
    var lineData = this.line(this.renderData);
    this.lineGraph.attr('d', lineData);
    display.styler.styleWireframeEdge(display, this);
  };
});

