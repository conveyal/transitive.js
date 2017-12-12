const debug = require('debug')('transitive:display')

import d3 from 'd3'

import Legend from './legend'
import TileLayer from './tile-layer'
import { sm } from '../util'

/**
 * The D3-based SVG display.
 */

export default class Display {
  /**
   * Display constructor
   *
   * @param {Object} options
   */

  constructor (transitive) {
    this.transitive = transitive
    var el = this.el = transitive.el
    this.width = el.clientWidth
    this.height = el.clientHeight

    // Set up the pan/zoom behavior
    var zoom = this.zoom = d3.behavior.zoom().scaleExtent([0.25, 4])

    const zoomBehavior = () => {
      this.computeScale()
      if (this.scale !== this.lastScale) { // zoom action
        this.zoomChanged()
      } else { // pan action
        setTimeout(transitive.refresh.bind(transitive, true), 0)
      }

      var llb = this.llBounds()
      debug(`ll bounds: ${llb[0][0]}, ${llb[0][1]} to ${llb[1][0]}, ${llb[1][1]}`)
    }

    this.zoom.on('zoom.transitive', zoomBehavior)

    this.zoomFactors = transitive.options.zoomFactors || this.getDefaultZoomFactors()

    // set up the svg display
    var div = d3.select(el)
      .attr('class', 'Transitive')

    if (transitive.options.zoomEnabled) {
      div.call(zoom)
    }

    this.svg = div
      .append('svg')
      .attr('class', 'schematic-map')

    // initialize the x/y scale objects
    this.xScale = d3.scale.linear()
    this.yScale = d3.scale.linear()

    // set up the resize event handler
    if (transitive.options.autoResize) {
      d3.select(window).on('resize.display', () => {
        this.resized()
        transitive.refresh()
      })
    }

    // set the scale
    var bounds
    if (transitive.options.initialBounds) {
      bounds = [sm.forward(transitive.options.initialBounds[0]),
        sm.forward(transitive.options.initialBounds[1])
      ]
    } else if (transitive.network && transitive.network.graph) {
      bounds = transitive.network.graph.bounds()
    }

    if (bounds) {
      this.setScale(bounds, transitive.options)
      this.updateActiveZoomFactors(this.scale)
      this.lastScale = this.scale
    } else {
      this.updateActiveZoomFactors(1)
    }

    // set up the map layer
    if (transitive.options.mapboxId) {
      this.tileLayer = new TileLayer({
        el: this.el,
        display: this,
        graph: transitive.graph,
        mapboxId: transitive.options.mapboxId
      })
    }

    // set up the legend
    if (transitive.options.legendEl) {
      this.legend = new Legend(transitive.options.legendEl, this, transitive)
    }

    transitive.emit('initialize display', transitive, this)
    return this
  }

  /**
   * zoomChanged -- called when the zoom level changes, either by through the native
   * zoom support or the setBounds() API call. Updates zoom factors as needed and
   * performs appropriate update action (render or refresh)
   */

  zoomChanged () {
    if (this.updateActiveZoomFactors(this.scale)) {
      this.transitive.network = null
      this.transitive.render()
    } else this.transitive.refresh()
    this.lastScale = this.scale
  }

  updateActiveZoomFactors (scale) {
    var updated = false
    for (var i = 0; i < this.zoomFactors.length; i++) {
      var min = this.zoomFactors[i].minScale
      var max = (i < this.zoomFactors.length - 1)
        ? this.zoomFactors[i + 1].minScale
        : Number.MAX_VALUE

      // check if we've crossed into a new zoomFactor partition
      if ((!this.lastScale || this.lastScale < min || this.lastScale >= max) &&
        scale >= min && scale < max) {
        this.activeZoomFactors = this.zoomFactors[i]
        updated = true
      }
    }
    return updated
  }

  /**
   * Return default zoom factors
   */

  getDefaultZoomFactors (data) {
    return [{
      minScale: 0,
      gridCellSize: 25,
      internalVertexFactor: 1000000,
      angleConstraint: 45,
      mergeVertexThreshold: 200
    }, {
      minScale: 1.5,
      gridCellSize: 0,
      internalVertexFactor: 0,
      angleConstraint: 5,
      mergeVertexThreshold: 0
    }]
  }

  /**
   * Empty the display
   */

  empty () {
    debug('emptying svg')
    this.svg.selectAll('*').remove()

    this.haloLayer = this.svg.insert('g', ':first-child')
  }

  /**
   * Set the scale
   */

  setScale (bounds, options) {
    this.height = this.el.clientHeight
    this.width = this.el.clientWidth

    var domains = getDomains(this, this.height, this.width, bounds, options)
    this.xScale.domain(domains[0])
    this.yScale.domain(domains[1])

    this.xScale.range([0, this.width])
    this.yScale.range([this.height, 0])

    debug('x scale %j -> %j', this.xScale.domain(), this.xScale.range())
    debug('y scale %j -> %j', this.yScale.domain(), this.yScale.range())

    this.zoom
      .x(this.xScale)
      .y(this.yScale)

    this.initXRes = (domains[0][1] - domains[0][0]) / this.width
    this.scale = 1

    this.scaleSet = true
  }

  computeScale () {
    var newXRes = (this.xScale.domain()[1] - this.xScale.domain()[0]) / this.width
    this.scale = this.initXRes / newXRes
  }

  /**
   * updateDomains -- set x/y domains of geographic (spherical mercator) coordinate
   * system. Does *not* check/adjust aspect ratio.
   */

  updateDomains (bounds) {
    this.xScale.domain([bounds[0][0], bounds[1][0]])
    this.yScale.domain([bounds[0][1], bounds[1][1]])

    this.zoom
      .x(this.xScale)
      .y(this.yScale)

    this.computeScale()
  }

  resized () {
    var newWidth = this.el.clientWidth
    var newHeight = this.el.clientHeight

    var xDomain = this.xScale.domain()
    var xFactor = newWidth / this.width
    var xDomainAdj = (xDomain[1] - xDomain[0]) * (xFactor - 1) / 2
    this.xScale.domain([xDomain[0] - xDomainAdj, xDomain[1] + xDomainAdj])

    var yDomain = this.yScale.domain()
    var yFactor = newHeight / this.height
    var yDomainAdj = (yDomain[1] - yDomain[0]) * (yFactor - 1) / 2
    this.yScale.domain([yDomain[0] - yDomainAdj, yDomain[1] + yDomainAdj])

    this.xScale.range([0, newWidth])
    this.yScale.range([newHeight, 0])

    this.height = newHeight
    this.width = newWidth

    this.zoom
      .x(this.xScale)
      .y(this.yScale)
  }

  xyBounds () {
    var x = this.xScale.domain()
    var y = this.yScale.domain()
    return [
      [x[0], y[0]],
      [x[1], y[1]]
    ]
  }

  /**
   * Lat/lon bounds
   */

  llBounds () {
    var x = this.xScale.domain()
    var y = this.yScale.domain()

    return [
      sm.inverse([x[0], y[0]]),
      sm.inverse([x[1], y[1]])
    ]
  }

  isInRange (x, y) {
    var xRange = this.xScale.range()
    var yRange = this.yScale.range()

    return x >= xRange[0] && x <= xRange[1] && y >= yRange[1] && y <= yRange[0]
  }
}

/**
 * Compute the x/y coordinate space domains to fit the graph.
 */

function getDomains (display, height, width, bounds, options) {
  var xmin = bounds[0][0]
  var xmax = bounds[1][0]
  var ymin = bounds[0][1]
  var ymax = bounds[1][1]
  var xRange = xmax - xmin
  var yRange = ymax - ymin

  var paddingFactor = (options && options.paddingFactor)
    ? options.paddingFactor
    : 0.1

  var margins = getMargins(options)

  var usableHeight = height - margins.top - margins.bottom
  var usableWidth = width - margins.left - margins.right
  var displayAspect = width / height
  var usableDisplayAspect = usableWidth / usableHeight
  var graphAspect = xRange / (yRange === 0 ? -Infinity : yRange)

  var padding
  var dispX1, dispX2, dispY1, dispY2
  var dispXRange, dispYRange

  if (usableDisplayAspect > graphAspect) { // y-axis is limiting
    padding = paddingFactor * yRange
    dispY1 = ymin - padding
    dispY2 = ymax + padding
    dispYRange = yRange + 2 * padding
    var addedYRange = (height / usableHeight * dispYRange) - dispYRange
    if (margins.top > 0 || margins.bottom > 0) {
      dispY1 -= margins.bottom / (margins.bottom + margins.top) * addedYRange
      dispY2 += margins.top / (margins.bottom + margins.top) * addedYRange
    }
    dispXRange = (dispY2 - dispY1) * displayAspect
    var xOffset = (margins.left - margins.right) / width
    var xMidpoint = (xmax + xmin - dispXRange * xOffset) / 2
    dispX1 = xMidpoint - dispXRange / 2
    dispX2 = xMidpoint + dispXRange / 2
  } else { // x-axis limiting
    padding = paddingFactor * xRange
    dispX1 = xmin - padding
    dispX2 = xmax + padding
    dispXRange = xRange + 2 * padding
    var addedXRange = (width / usableWidth * dispXRange) - dispXRange
    if (margins.left > 0 || margins.right > 0) {
      dispX1 -= margins.left / (margins.left + margins.right) * addedXRange
      dispX2 += margins.right / (margins.left + margins.right) * addedXRange
    }

    dispYRange = (dispX2 - dispX1) / displayAspect
    var yOffset = (margins.bottom - margins.top) / height
    var yMidpoint = (ymax + ymin - dispYRange * yOffset) / 2
    dispY1 = yMidpoint - dispYRange / 2
    dispY2 = yMidpoint + dispYRange / 2
  }

  return [
    [dispX1, dispX2],
    [dispY1, dispY2]
  ]
}

function getMargins (options) {
  var margins = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }

  if (options && options.displayMargins) {
    if (options.displayMargins.top) margins.top = options.displayMargins.top
    if (options.displayMargins.bottom) margins.bottom = options.displayMargins.bottom
    if (options.displayMargins.left) margins.left = options.displayMargins.left
    if (options.displayMargins.right) margins.right = options.displayMargins.right
  }

  return margins
}
