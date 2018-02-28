import d3 from 'd3'
import Emitter from 'component-emitter'

import Network from './core/network'
import Display from './display/display'
import DefaultRenderer from './renderer/default-renderer'
import WireframeRenderer from './renderer/wireframe-renderer'
import Styler from './styler/styler'
import Labeler from './labeler/labeler'
import { sm } from './util'

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

export default class Transitive {
  constructor (options) {
    if (!(this instanceof Transitive)) return new Transitive(options)

    this.options = options
    if (this.options.zoomEnabled === undefined) this.options.zoomEnabled = true
    if (this.options.autoResize === undefined) this.options.autoResize = true
    if (this.options.groupEdges === undefined) this.options.groupEdges = true

    if (options.el) this.setElement(options.el)
    else if (options.svg && options.svgContainer) {
      this.setElement()
    }

    this.data = options.data

    this.setRenderer(this.options.initialRenderer || 'default')

    this.labeler = new Labeler(this)
    this.styler = new Styler(options.styles)
  }

  /**
   * Clear the Network data and redraw the (empty) map
   */

  clearData () {
    this.network = this.data = null
    this.labeler.clear()
    this.emit('clear data', this)
  }

  /**
   * Update the Network data and redraw the map
   */

  updateData (data) {
    this.network = null
    this.data = data
    if (this.display) this.display.scaleSet = false
    this.labeler.clear()
    this.emit('update data', this)
  }

  /**
   * Return the collection of default segment styles for a mode.
   *
   * @param {String} an OTP mode string
   */

  getModeStyles (mode) {
    return this.styler.getModeStyles(mode, this.display || new Display(this))
  }

  /** Display/Render Methods **/

  /**
   * Set the DOM element that serves as the main map canvas
   */

  setElement (el, legendEl) {
    if (this.el) d3.select(this.el).selectAll('*').remove()

    this.el = el
    this.display = new Display(this)

    // Emit click events
    var self = this
    this.display.svg.on('click', function () {
      var x = d3.event.x
      var y = d3.event.y
      var geographic = sm.inverse([x, y])
      self.emit('click', {
        x: x,
        y: y,
        lng: geographic[0],
        lat: geographic[1]
      })
    })

    this.emit('set element', this, this.el)
    return this
  }

  /**
   * Set the DOM element that serves as the main map canvas
   */

  setRenderer (type) {
    switch (type) {
      case 'wireframe':
        this.renderer = new WireframeRenderer(this)
        break
      case 'default':
        this.renderer = new DefaultRenderer(this)
        break
    }
  }

  /**
   * Render
   */

  render () {
    if (!this.network) {
      this.network = new Network(this, this.data)
    }

    if (!this.display.scaleSet) {
      this.display.setScale(this.network.graph.bounds(), this.options)
    }

    this.renderer.render()

    this.emit('render', this)
  }

  /**
   * Render to
   *
   * @param {Element} el
   */

  renderTo (el) {
    this.setElement(el)
    this.render()

    this.emit('render to', this)
    return this
  }

  /**
   * Refresh
   */

  refresh (panning) {
    if (!this.network) {
      this.render()
    }

    this.renderer.refresh()
  }

  /**
   * focusJourney
   */

  focusJourney (journeyId) {
    var path = journeyId ? this.network.journeys[journeyId].path : null
    this.renderer.focusPath(path)
  }

  /**
   * Sets the Display bounds
   * @param {Array} lon/lat bounds expressed as [[west, south], [east, north]]
   */

  setDisplayBounds (llBounds) {
    this.display.updateDomains([sm.forward(llBounds[0]), sm.forward(llBounds[1])])
    this.display.zoomChanged()
  }

  /**
   * Gets the Network bounds
   * @returns {Array} lon/lat bounds expressed as [[west, south], [east, north]]
   */

  getNetworkBounds () {
    if (!this.network || !this.network.graph) return null
    var graphBounds = this.network.graph.bounds()
    var ll1 = sm.inverse(graphBounds[0])
    var ll2 = sm.inverse(graphBounds[1])
    return [
      [Math.min(ll1[0], ll2[0]), Math.min(ll1[1], ll2[1])],
      [Math.max(ll1[0], ll2[0]), Math.max(ll1[1], ll2[1])]
    ]
  }

  /**
   * resize
   */

  resize (width, height) {
    if (!this.display) return
    d3.select(this.display.el)
      .style('width', width + 'px')
      .style('height', height + 'px')
    this.display.resized()
  }

  /**
   * trigger a display resize action (for externally-managed SVG containers)
   */

  resized () {
    this.display.resized()
  }
}

/**
 * Mixin `Emitter`
 */

Emitter(Transitive.prototype)
