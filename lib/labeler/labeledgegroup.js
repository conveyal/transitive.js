/**
 * Dependencies
 */

var each = require('each');

/**
 * Expose `LabelEdgeGroup`
 */

module.exports = LabelEdgeGroup;

/**
 *
 */

function LabelEdgeGroup(renderedSegment) {
  this.renderedSegment = renderedSegment;
  this.renderedEdges = [];
}

LabelEdgeGroup.prototype.addEdge = function(rEdge) {
  this.renderedEdges.push(rEdge);
  this.edgeIds = !this.edgeIds ? rEdge.getId() : this.edgeIds + ',' + rEdge.getId();
};

LabelEdgeGroup.prototype.getLabelTextArray = function() {
  var textArray = [];
  each(this.renderedSegment.pathSegment.getPatterns(), function(pattern) {
    var shortName = pattern.route.route_short_name;
    if (textArray.indexOf(shortName) === -1) textArray.push(shortName);
  });
  return textArray;
};

LabelEdgeGroup.prototype.getLabelAnchors = function(display, spacing) {

  var labelAnchors = [];
  var renderLen = this.getRenderLength(display);
  var anchorCount = Math.floor(renderLen / spacing);
  var pctSpacing = spacing / renderLen;

  for (var i = 0; i < anchorCount; i++) {
    var t = (i % 2 === 0) ?
      0.5 + (i / 2) * pctSpacing :
      0.5 - ((i + 1) / 2) * pctSpacing;
    var coord = this.coordAlongRenderedPath(t, display);
    if (coord) labelAnchors.push(coord);
  }

  return labelAnchors;
};

LabelEdgeGroup.prototype.coordAlongRenderedPath = function(t, display) {
  var renderLen = this.getRenderLength(display);
  var loc = t * renderLen;

  var cur = 0;
  for (var i = 0; i < this.renderedEdges.length; i++) {
    var rEdge = this.renderedEdges[i];
    var edgeRenderLen = rEdge.graphEdge.getRenderLength(display);
    if (loc <= cur + edgeRenderLen) {
      var t2 = (loc - cur) / edgeRenderLen;
      return rEdge.graphEdge.coordAlongEdge(t2, rEdge.renderData, display);
    }
    cur += edgeRenderLen;
  }

};

LabelEdgeGroup.prototype.getRenderLength = function(display) {
  if (!this.renderLength) {
    this.renderLength = 0;
    each(this.renderedEdges, function(rEdge) {
      this.renderLength += rEdge.graphEdge.getRenderLength(display);
    }, this);
  }
  return this.renderLength;
};
