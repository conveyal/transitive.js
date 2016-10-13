var d3 = require('d3')

var RenderedEdge = require('../renderer/renderededge')
var RenderedSegment = require('../renderer/renderedsegment')
var Util = require('../util')
var Stop = require('../point/stop')

/**
 * Expose `Legend`
 */

module.exports = Legend

function Legend (el, display, transitive) {
  this.el = el
  this.display = display
  this.transitive = transitive

  this.height = Util.parsePixelStyle(d3.select(el).style('height'))
}

Legend.prototype.render = function (legendSegments) {
  d3.select(this.el).selectAll(':not(.doNotEmpty)').remove()

  this.x = this.spacing
  this.y = this.height / 2

  var segment

  // iterate through the representative map segments
  for (var legendType in legendSegments) {
    var mapSegment = legendSegments[legendType]

    // create a segment solely for rendering in the legend
    segment = new RenderedSegment()
    segment.type = mapSegment.getType()
    segment.mode = mapSegment.mode
    segment.patterns = mapSegment.patterns

    var canvas = this.createCanvas()

    var renderData = []
    renderData.push({
      x: 0,
      y: canvas.height / 2
    })
    renderData.push({
      x: canvas.width,
      y: canvas.height / 2
    })

    segment.render(canvas)
    segment.refresh(canvas, renderData)

    this.renderText(getDisplayText(legendType))

    this.x += this.spacing * 2
  }

  // create the 'transfer' marker

  var rEdge = new RenderedEdge(null, true, 'TRANSIT')
  rEdge.pattern = {
    pattern_id: 'ptn',
    route: {
      route_type: 1
    }
  }

  var transferStop = new Stop()
  transferStop.isSegmentEndPoint = true
  transferStop.isTransferPoint = true

  this.renderPoint(transferStop, rEdge, 'Transfer')
}

Legend.prototype.renderPoint = function (point, rEdge, text) {
  var canvas = this.createCanvas()

  point.addRenderData({
    owner: point,
    rEdge: rEdge,
    x: canvas.width / 2,
    y: canvas.height / 2,
    offsetX: 0,
    offsetY: 0
  })

  point.render(canvas)

  canvas.styler.stylePoint(canvas, point)
  point.refresh(canvas)

  this.renderText(text)
}

Legend.prototype.renderText = function (text) {
  d3.select(this.el).append('div')
    .attr('class', 'legendLabel')
    .html(text)
}

Legend.prototype.createCanvas = function () {
  var container = d3.select(this.el).append('div')
    .attr('class', 'legendSvg')

  var width = Util.parsePixelStyle(container.style('width'))
  if (!width || width === 0) width = 30

  var height = Util.parsePixelStyle(container.style('height'))
  if (!height || height === 0) height = this.height

  var canvas = {
    xScale: d3.scale.linear(),
    yScale: d3.scale.linear(),
    styler: this.transitive.styler,
    zoom: this.display.zoom,
    width: width,
    height: height,
    svg: container.append('svg')
      .style('width', width)
      .style('height', height)
  }

  return canvas
}

function getDisplayText (type) {
  switch (type) {
    case 'WALK':
      return 'Walk'
    case 'BICYCLE':
      return 'Bike'
    case 'CAR':
      return 'Drive'
    case 'TRANSIT_0':
      return 'Tram'
    case 'TRANSIT_1':
      return 'Metro'
    case 'TRANSIT_2':
      return 'Rail'
    case 'TRANSIT_3':
      return 'Bus'
    case 'TRANSIT_4':
      return 'Ferry'
  }
  return type
}
