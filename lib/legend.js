var d3 = require('d3');

var RenderSegment = require('./rendersegment');
var Util = require('./util');
var Stop = require('./point/stop');

/**
 * Expose `Legend`
 */

module.exports = Legend;

function Legend(el, transitive) {
  this.el = el;
  this.transitive = transitive;

  // set up the svg container
  this.svg = d3.select(el)
    .append('svg')
    .append('g');

  // set up the scales
  this.xScale = d3.scale.linear();
  this.yScale = d3.scale.linear();
  this.styler = transitive.style;
  this.zoom = transitive.display.zoom;

  this.fontAttrs = {
    'font-family': 'sans-serif',
    'font-size': '12px',
    'font-weight': 'bold'
  };

  this.height = Util.parsePixelStyle(d3.select(el).style('height'));

  this.spacing = 10;
  this.swatchLength = 30;

}

Legend.prototype.render = function(legendSegments) {

  this.svg.selectAll(':not(.doNotEmpty)').remove();

  this.x = this.spacing;
  this.y = this.height / 2;

  var segment;

  // iterate through the representative map segments
  for (var legendType in legendSegments) {
    var mapSegment = legendSegments[legendType];

    // create a segment solely for rendering in the legend
    segment = new RenderSegment(null, mapSegment.getType());
    segment.pattern = mapSegment.pattern;

    segment.renderData = [];
    segment.renderData.push({
      x: this.x,
      y: this.y
    });
    segment.renderData.push({
      x: this.x + this.swatchLength,
      y: this.y
    });

    this.x += this.swatchLength + this.spacing;

    segment.render(this);
    segment.refresh(this);

    this.renderText(getDisplayText(legendType));

    this.x += this.spacing * 2;
  }

  // create the 'board/alight' marker

  segment = new RenderSegment(null, 'TRANSIT');
  segment.pattern = {
    pattern_id: 'ptn',
    route: {
      route_type: 1
    }
  };

  var boardAlightStop = new Stop();
  boardAlightStop.isSegmentEndPoint = true;
  boardAlightStop.isBoardPoint = true;

  this.renderPoint(boardAlightStop, segment, 'Board/Alight');

  var transferStop = new Stop();
  transferStop.isSegmentEndPoint = true;
  transferStop.isTransferPoint = true;

  this.renderPoint(transferStop, segment, 'Transfer');

  d3.select(this.el).style('width', this.x + 'px');
};

Legend.prototype.renderPoint = function(point, segment, text) {
  point.addRenderData({
    owner: point,
    segment: segment,
    x: this.x,
    y: this.y,
    offsetX: 0,
    offsetY: 0
  });
  point.render(this);

  var markerWidth = point.constructMergedMarker(this, 'stops_pattern').width;
  this.x += markerWidth / 2;
  point.patternRenderData[segment.pattern.pattern_id][segment.getId()].x = this
    .x;
  this.styler.renderPoint(this, point);
  point.refresh(this);

  this.x += markerWidth / 2 + this.spacing;

  this.renderText(text);

  this.x += this.spacing * 2;
};

Legend.prototype.renderText = function(text) {
  var textBBox = Util.getTextBBox(text, this.fontAttrs);

  this.svg.append('text')
    .text(text)
    .attr(this.fontAttrs)
    .attr({
      x: this.x,
      y: this.y + textBBox.height * 0.3,
    });

  this.x += textBBox.width;
};

function getDisplayText(type) {
  if (type === 'WALK') return 'Walk';
  if (type === 'TRANSIT_1') return 'Metro';
  if (type === 'TRANSIT_3') return 'Bus';
  return type;
}
