
/**
 * Dependencies
 */

var each = require('each');

/**
 * Expose `RenderSegmentGroup`
 */

module.exports = RenderSegmentSequence;

/**
 *
 */

function RenderSegmentSequence() {
  this.renderSegments = [];
}


RenderSegmentSequence.prototype.addSegment = function(segment) {
  this.renderSegments.push(segment);
};


RenderSegmentSequence.prototype.getLabelAnchors = function(display, spacing) {

  var labelAnchors = [];
  var renderLen = this.getRenderLength(display);
  var anchorCount = Math.floor(renderLen/spacing);
  var pctSpacing = spacing/renderLen;

  for(var i = 0; i < anchorCount; i++) {
    var t = (i % 2 === 0) ?
      0.5 + (i/2)* pctSpacing :
      0.5 - ((i+1)/2) * pctSpacing;
    labelAnchors.push(this.coordAlongRenderedPath(t, display));
  }

  return labelAnchors;
};

RenderSegmentSequence.prototype.coordAlongRenderedPath = function(t, display) {
  var renderLen = this.getRenderLength(display);
  var loc = t * renderLen;

  var cur = 0;
  for (var i = 0; i < this.renderSegments.length; i++) {
    var segment = this.renderSegments[i];
    var edgeRenderLen = segment.graphEdge.getRenderLength(display);
    if (loc <= cur + edgeRenderLen) {
      var t2 = (loc - cur) / edgeRenderLen;
      return segment.graphEdge.coordAlongEdge(t2, segment.renderData, display);
    }
    cur += edgeRenderLen;
  }

};

RenderSegmentSequence.prototype.getRenderLength = function(display) {
  if(!this.renderLength) {
    this.renderLength = 0;
    each(this.renderSegments, function(segment) {
      this.renderLength += segment.graphEdge.getRenderLength(display);
    }, this);
  }
  return this.renderLength;
};