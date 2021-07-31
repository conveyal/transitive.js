/* globals Display */

import d3 from 'd3'
import Emitter from 'component-emitter'

import Network from './core/network'
import SvgDisplay from './display/svg-display'
import CanvasDisplay from './display/canvas-display'
import DefaultRenderer from './renderer/default-renderer'
import WireframeRenderer from './renderer/wireframe-renderer'
import Styler from './styler/styler'
import Labeler from './labeler/labeler'
import Point from './point/point'
import { sm } from './util'

type TransitiveData = {}

type TransitiveStyles = {}

type Bounds = [
  [
    /**
     * west
     */
    number,
    /**
     * south
     */
    number
  ],
  [
    /**
     * east
     */
    number,
    /**
     * north
     */
    number
  ]
]

type RendererType = 'wireframe' | 'default'

type TransitiveOptions = {
  /**
   * whether the display should listen for window resize events and update
   * automatically (defaults to true)
   */
  autoResize?: boolean
  /**
   * Transitive Data to Render
   */
  data: TransitiveData
  /**
   * Set to 'canvas' to use CanvasDisplay. Otherwise SvgDisplay is used.
   */
  display?: string
  /**
   * padding to apply to the initial rendered network within the display.
   * Expressed in pixels for top/bottom/left/right
   */
  displayMargins?: {
    bottom: number
    left: number
    right: number
    top: number
  }
  /**
   * a list of network element types to enable dragging for
   */
  draggableTypes?: Array<string>
   /**
   * An optional HTMLElement to render the Transitve display to
   */
  el?: HTMLElement
  /**
   * resolution of the grid in SphericalMercator meters
   */
  gridCellSize?: number
  /**
   * whether to consider edges with the same origin/destination equivalent for
   * rendering, even if intermediate stop sequence is different (defaults to
   * true)
   */
  groupEdges?: boolean
  /**
   * initial lon/lat bounds for the display
   */
  initialBounds?: Bounds
  /**
   * FIXME
   */
  initialRenderer?: RendererType
  /**
   * Custom styling rules that affect rendering behavior
   */
  styles: TransitiveStyles
  /**
   * whether to enable the display's built-in zoom/pan functionality (defaults
   * to true)
   */
  zoomEnabled?: boolean
}

/**
 * No clue what this global Display thing is. :(
 */
declare class Display {
  constructor(arg0: TransitiveData)
}

/**
 * A transformation {x, y, k} to the *initial* state of the map., where
 * (x, y) is the pixel offset and k is a scale factor relative to an initial
 * zoom level of 1.0. Intended primarily to support D3-style panning/zooming.
 */
type DisplayTransform = {
  k: number
  x: number
  y: number
}

export default class Transitive {
  data: TransitiveData | null | undefined
  display!: CanvasDisplay | SvgDisplay
  el?: HTMLElement
  emit!: (message: string, transitiveInstance: this, el?: HTMLElement) => void
  labeler!: Labeler
  options?: TransitiveOptions
  network: Network | null | undefined
  renderer!: DefaultRenderer | WireframeRenderer
  styler!: Styler

  constructor (options: TransitiveOptions) {
    if (!(this instanceof Transitive)) return new Transitive(options)

    this.options = options
    if (this.options.zoomEnabled === undefined) this.options.zoomEnabled = true
    if (this.options.autoResize === undefined) this.options.autoResize = true
    if (this.options.groupEdges === undefined) this.options.groupEdges = true

    if (options.el) this.el = options.el

    this.display = this.options.display === 'canvas'
      ? new CanvasDisplay(this)
      : new SvgDisplay(this)

    this.data = options.data

    this.setRenderer(this.options.initialRenderer || 'default')

    this.labeler = new Labeler(this)
    this.styler = new Styler(options.styles, this)

    if (options.initialBounds) {
      this.display.fitToWorldBounds([
        sm.forward(options.initialBounds[0]),
        sm.forward(options.initialBounds[1])
      ])
    }
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

  updateData (data: TransitiveData, resetDisplay?: boolean) {
    this.network = null
    this.data = data
    if (resetDisplay) this.display.reset()
    else if (this.data) this.display.scaleSet = false
    this.labeler.clear()
    this.emit('update data', this)
  }

  /**
   * Return the collection of default segment styles for a mode.
   *
   * @param {String} an OTP mode string
   */

  getModeStyles (mode: string) {
    return this.styler.getModeStyles(mode, this.display || new Display(this))
  }

  /** Display/Render Methods **/

  /**
   * Set the DOM element that serves as the main map canvas
   */

  setElement (el?: HTMLElement) {
    if (this.el) d3.select(this.el).selectAll('*').remove()

    this.el = el

    this.emit('set element', this, this.el)
    return this
  }

  /**
   * Set the DOM element that serves as the main map canvas
   */

  setRenderer (type: RendererType) {
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
      this.display.fitToWorldBounds(this.network.graph.bounds())
    }

    this.renderer.render()

    this.emit('render', this)
  }

  /**
   * Render to
   *
   * @param {Element} el
   */

  renderTo (el: HTMLElement) {
    this.setElement(el)
    this.render()

    this.emit('render to', this)
    return this
  }

  /**
   * focusJourney
   */

  focusJourney (journeyId: string) {
    if (!this.network) {
      console.warn('Transitive network is not defined! Cannot focus journey!');
      return
    }
    const journey = (this.network.journeys as { [id: string]: { path: {} }})[journeyId]
    var path = journey?.path || null
    this.renderer.focusPath(path)
  }

  /**
   * Sets the Display bounds
   * @param {Array} lon/lat bounds expressed as [[west, south], [east, north]]
   */

  setDisplayBounds (llBounds: Bounds) {
    if (!this.display) return
    const smWestSouth = sm.forward(llBounds[0])
    const smEastNorth = sm.forward(llBounds[1])
    // reset the display to make sure the correct display scale is recomputed
    // see https://github.com/conveyal/transitive.js/pull/50
    this.display.reset()
    this.display.setXDomain([smWestSouth[0], smEastNorth[0]])
    this.display.setYDomain([smWestSouth[1], smEastNorth[1]])
    this.display.computeScale()
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

  resize (width: number, height: number) {
    if (!this.display) return
    // @ts-expect-error I have no idea what magic this display object uses to
    // get an el property. - Evan :(
    d3.select(this.display.el)
      .style('width', width + 'px')
      .style('height', height + 'px')
    // @ts-expect-error I have no idea what magic this display object uses to
    // get a resized method. - Evan :(
    this.display.resized()
  }

  /**
   * trigger a display resize action (for externally-managed SVG containers)
   */

  resized (width: number, height: number) {
    // @ts-expect-error I have no idea what magic this display object uses to
    // get a resized method. - Evan :(
    this.display.resized(width, height)
  }

  setTransform (transform: DisplayTransform) {
    this.display.applyTransform(transform)
    this.render()
  }

  /** editor functions **/

  createVertex (wx?: number, wy?: number) {
    if (!this.network) {
      console.warn('Transitive network is not defined! Cannot create vertex!');
      return
    }
    this.network.graph.addVertex(new Point(), wx, wy)
  }
}

/**
 * Mixin `Emitter`
 */

Emitter(Transitive.prototype)
