/* eslint-disable camelcase */ // FIXME remove camel case
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

// Transitive Data Model

/**
 * A description of the transit pattern that a segment of a journey is using.
 *
 * TODO: move to core/journey.js when adding static typing to that file
 */
type SegmentPattern = {
  /**
   * The from stop index within the pattern referenced by the pattern_id
   */
  from_stop_index: number
  /**
   * The ID of the pattern
   */
  pattern_id: string
  /**
   * The to stop index within the pattern referenced by the pattern_id
   */
  to_stop_index: number
}

/**
 * A point where a segment starts or ends. This must be either a place or a stop
 * and must have a proper reference to a defined place or stop that is defined
 * in the list of places or stops in the root transitive data object.
 *
 * TODO: move to core/journey.js when adding static typing to that file
 */
type SegmentPoint = {
  /**
   * The place_id of this point if it is a place. This MUST be set if the "type"
   * value is "PLACE"
   */
  place_id?: string
  /**
   * The place_id of this point if it is a place. This MUST be set if the "type"
   * value is "STOP"
   */
  stop_id?: string
  /**
   * The type of place that this is.
   */
  type: 'PLACE' | 'STOP'
}

/**
 * Information about a particular segment of a journey.
 *
 * TODO: move to core/journey.js when adding static typing to that file
 */
type Segment = {
  /**
   * If set to true, instructs the renderer to ignore all other geometry data
   * and instead draw an arc between the from and to points.
   */
  arc?: boolean
  /**
   * The starting point of this segment
   */
  from: SegmentPoint
  /**
   * A list of pattern segments identifying how this segment uses certain parts
   * of the transit network. This should be set when the type of this segment is
   * "TRANSIT".
   */
  patterns?: SegmentPattern[]
  /**
   * A list of strings representing street edge IDs that this journey uses. This
   * should be set when the type of this segment is not "TRANSIT".
   */
  streetEdges?: string[]
  /**
   * The ending point of this segment
   */
  to: SegmentPoint
  /**
   * The type of segment. This should be set to "TRANSIT" for transit segments
   * or the on-street leg mode otherwise.
   */
  type: string
}

/**
 * An object describing how a journey uses various parts of the transportation
 * network.
 *
 * This object can additionally have other key/value items added onto the data
 * model that may or may not be processed with custom styler rules. However,
 * a few keys might be overwritten by transitive internals, so choose carefully.
 *
 * TODO: move to core/journey.js when adding static typing to that file
 */
type Journey = {
  /**
   * The ID of the journey
   */
  journey_id: string
  /**
   * The name of the journey
   */
  journey_name: string
  /**
   * The segments of a journey
   */
  segments: Segment[]
}

/**
 * Information about a sequence of stops that make up a directional segment of
 * travel that a transit trip or part of a transit trip takes.
 *
 * This object can additionally have other key/value items added onto the data
 * model that may or may not be processed with custom styler rules. However,
 * a few keys might be overwritten by transitive internals, so choose carefully.
 *
 * TODO: move to core/pattern.js when adding static typing to that file
 */
type Pattern = {
  /**
   * The ID of the pattern
   */
  pattern_id: string
  /**
   * The name of the pattern
   */
  pattern_name: string
  /**
   * If true, unconditionally render the entire pattern.
   */
  render?: boolean
  /**
   * The ID of the transit route associated with this pattern
   */
  route_id: string
  /**
   * A list of stops in order of the direction of travel and the associated
   * geometry to that particular stop. The first stop omits the geometry, but
   * all further stops should include the geometry. It is possible to include
   * intermediate stops within the pattern or just the final stop.
   */
  stops: Array<{
    /**
     * An encoded polyline string representing the path that the transit trip
     * took from the previous stop in this list to this current stop. This is
     * omitted for the first stop, but should be included for all further stops.
     */
    geometry?: string
    /**
     * The ID of the stop
     */
    stop_id: string
  }>
}

/**
 * A place is a point *other* than a transit stop/station, e.g. a home/work
 * location, a point of interest, etc.
 *
 * This object can additionally have other key/value items added onto the data
 * model that may or may not be processed with custom styler rules. However,
 * a few keys might be overwritten by transitive internals, so choose carefully.
 *
 * TODO: move to point/place.js when adding static typing to that file
 */
type Place = {
  /**
   * The ID of the place
   */
  place_id: string
  /**
   * The latitude of the place
   */
  place_lat: number
  /**
   * The longitude of the place
   */
  place_lon: number
  /**
   * The name of the place
   */
  place_name: string
}

/**
 * Information about a particular transit route.
 *
 * This object can additionally have other key/value items added onto the data
 * model that may or may not be processed with custom styler rules. However,
 * a few keys might be overwritten by transitive internals, so choose carefully.
 *
 * TODO: move to core/route.js when adding static typing to that file
 */
type Route = {
  /**
   * A string describing the route color in hex color format. If this value is
   * provided and the first character is not a '#' character, that character
   * will be added to the front of the string.
   */
  route_color?: string
  /**
   * The route's ID
   */
  route_id: string
  /**
   * The short name of the route
   */
  route_short_name?: string
  /**
   * The GTFS route type number.
   */
  route_type: number
}

/**
 * A transit stop.
 *
 * This object can additionally have other key/value items added onto the data
 * model that may or may not be processed with custom styler rules. However,
 * a few keys might be overwritten by transitive internals, so choose carefully.
 *
 * TODO: move to point/stop.js when adding static typing to that file
 */
type Stop = {
  /**
   * The ID of the stop
   */
  stop_id: string
  /**
   * The latitude of the stop
   */
  stop_lat: number
  /**
   * The longitude of the stop
   */
  stop_lon: number
  /**
   * The name of the stop
   */
  stop_name?: string
}

/**
 * Edges describing a section of the street network.
 *
 * TODO: move to core/network.js when adding static typing to that file
 */
type StreetEdge = {
  /**
   * A unique edge ID
   */
  edge_id: number | string
  /**
   * A geometry object, typically from the leg response in an OpenTripPlanner
   * itinerary
   */
  geometry: {
    /**
     * An encoded polyline string
     */
    points: string
  }
}

/**
 * An object with various pieces of data that should be rendered.
 */
type TransitiveData = {
  /**
   * A list of journeys that describing how the transit network is used in
   * specific journeys (typically OTP itineraries).
   */
  journeys?: Journey[]
  /**
   * A list of transit trips that should be rendered or are referenced by
   * individual journeys
   */
  patterns: Pattern[]
  /**
   * A list of places in the transportation network
   */
  places: Place[]
  /**
   * A list of transit routes in the transportation network
   */
  routes: Route[]
  /**
   * A list of transit stops in the transportation network
   */
  stops: Stop[]
  /**
   * A list of street edges in the transportation network that are referenced by
   * individual journeys.
   */
  streetEdges: StreetEdge[]
}

// Transitive Style data model

/**
 * A function for calculating the style of a particular feature.
 */
type TransitiveStyleComputeFn = (
  /**
   * The transtiive display instance currently being used.
   */
  display?: CanvasDisplay | SvgDisplay,
  /**
   * The entity instance which the style result will be applied to.
   *
   * FIXME add better typing
   */
  entity?: unknown,
  /**
   * The index of the entity within some collection. This argument's value may
   * not always be included when calling this function.
   */
  index?: number,
  /**
   * Some util functions for calculating certain styles.
   * See code: https://github.com/conveyal/transitive.js/blob/6a8932930de003788b9034609697421731e7f812/lib/styler/styles.js#L17-L44
   * FIXME add better typing once other files are typed
   */
  styleUtils?: {
    /**
     * Creates a svg definition for a marker and returns the string url for the
     * defined marker
     */
    defineSegmentCircleMarker: (
      /**
       * The display being used to render transitive
       */
      display: unknown,
      /**
       * The segment to create a marker for
       */
      segment: unknown,
      /**
       * The size of the radius that the marker should have
       */
      radius: number,
      /**
       * The fill color of the marker
       */
      fillColor: string
    ) => string
    /**
     * Calculates the font size based on the display's scale
     */
    fontSize: (display: unknown) => number
    /**
     * Calculates something as it relates to the zoom in relation to zoom
     */
    pixels: (
      zoom: unknown,
      min: unknown,
      normal: unknown,
      max: unknown
    ) => unknown
    /**
     * Calculates a stroke width depending on the display scale
     */
    strokeWidth: (display: unknown) => unknown
  }
) => number | string

/**
 * A map describing a styling override applied to a particular styling value
 * noted with the key value. The value for this style can be either a number,
 * string or result of a custom function.
 *
 * The applicability of each key differs between different styling entities.
 * Example values for the key value include:
 * - "background" - // background of text
 * - "border-color" - // used for borders around text
 * - "border-radius" - // used for borders around text
 * - "border-width" - // used for borders around text
 * - "color" - // text color
 * - "display" - // whether or not to display the entity. Set value or make
 *                  function return "none" to not display an entity.
 * - "envelope" - // used in calculating line width
 * - "fill" - // fill color
 * - "font-family" - // font family used when rendering text
 * - "font-size" - // font size used when rendering text
 * - "marker-padding" - // Amount of padding to give a marker beyond its radius
 * - "marker-type" - // for styling stops and maybe places. Valid values
 *                      include: "circle", "rectangle" or "roundedrect"
 * - "orientations" - // a list of possible orientations to try to apply to
 *                      labels. Valid values include: "N", "S", "E", "W", "NE",
 *                       "NW", "SE", "SW"
 * - "r" - // a radius in pixels to apply to certain stops or places
 * - "stroke" - // stroke color
 * - "stroke-dasharray" - // stroke dasharray
 * - "stroke-linecap" - // stroke linecap
 * - "stroke-width" - // stroke width
 */
type TransitiveStyleConfig = Record<
  string,
  number | string | TransitiveStyleComputeFn
>

/**
 * A map of transitive features and the associated map of config records that
 * override transitive default style calculations.
 */
type TransitiveStyles = {
  labels?: TransitiveStyleConfig
  multipoints_merged?: TransitiveStyleConfig
  multipoints_pattern?: TransitiveStyleConfig
  places?: TransitiveStyleConfig
  places_icon?: TransitiveStyleConfig
  segment_label_containers?: TransitiveStyleConfig
  segment_labels?: TransitiveStyleConfig
  segments?: TransitiveStyleConfig
  segments_front?: TransitiveStyleConfig
  segments_halo?: TransitiveStyleConfig
  stops_merged?: TransitiveStyleConfig
  stops_pattern?: TransitiveStyleConfig
  wireframe_edges?: TransitiveStyleConfig
  wireframe_vertices?: TransitiveStyleConfig
}

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

/**
 * An object describing various styling actions that may be taken at a
 * particular zoom level between the value of the key "minScale" and whatever
 * value "minScale" is in the next ZoomFactor object in the zoomFactors config
 * of the TransitiveOptions.
 */
type ZoomFactor = {
  /**
   * The minimum angle degree to use to render curves at this current zoom
   * level.
   */
  angleConstraint: number
  /**
   * The grid cell size to use for snapping purposes at this current zoom level.
   */
  gridCellSize: number
  /**
   * A factor used to determine how many vertices should be displayed at this
   * current zoom level.
   */
  internalVertexFactor: number
  /**
   * If above 0, this will result in a point cluster map being used.
   */
  mergeVertexThreshold: number
  /**
   * The minimum scale at which to show this zoom factor
   */
  minScale: number
  /**
   * Whether or not to use geographic rendering
   */
  useGeographicRendering?: boolean
}

type TransitiveOptions = {
  /**
   * whether the display should listen for window resize events and update
   * automatically (defaults to true)
   */
  autoResize?: boolean
  /**
   * An optional HTMLCanvasElement to render the Transitve display to
   */
  canvas?: HTMLCanvasElement
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
   * Whether to render as a wireframe or default.
   */
  initialRenderer?: RendererType
  /**
   * A list of transit mode types that should have labels created on them
   */
  labeledModes?: number[]
  /**
   * Custom styling rules that affect rendering behavior
   */
  styles: TransitiveStyles
  /**
   * Whether to enable the display's built-in zoom/pan functionality (defaults
   * to true)
   */
  zoomEnabled?: boolean
  /**
   * A list of different styling configurations to show at various zoom levels.
   * This list of Zoomfactors must be ordered by each object's "minScale" key
   * with the lowest "minScale" value appearing first and the largest one
   * appearing last. There must be a "minScale" value below 1 in the list of
   * definitions.
   *
   * Default values for this config item are used, unless overridden by adding
   * this key and value. The default values can be found here:
   * https://github.com/conveyal/transitive.js/blob/6a8932930de003788b9034609697421731e7f812/lib/display/display.js#L78-L92
   */
  zoomFactors?: ZoomFactor[]
}

/**
 * No clue what this global Display thing is. :(
 */
declare class Display {
  constructor(arg0: Transitive)
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

// FIXME add better typing once more files are typed
type Journeys = { [id: string]: { path: Record<string, unknown> } }

export default class Transitive {
  data: TransitiveData | null | undefined
  display!: CanvasDisplay | SvgDisplay
  el?: HTMLElement
  // FIXME: somehow typing the emit method (which is injected at the end of this
  // file by component-emitter) causes the emit method to not work.
  // emit!: (message: string, transitiveInstance: this, el?: HTMLElement) => void
  labeler!: Labeler
  options?: TransitiveOptions
  network: Network | null | undefined
  renderer!: DefaultRenderer | WireframeRenderer
  styler!: Styler

  constructor(options: TransitiveOptions) {
    if (!(this instanceof Transitive)) return new Transitive(options)

    this.options = options
    if (this.options.zoomEnabled === undefined) this.options.zoomEnabled = true
    if (this.options.autoResize === undefined) this.options.autoResize = true
    if (this.options.groupEdges === undefined) this.options.groupEdges = true

    if (options.el) this.el = options.el

    this.display =
      this.options.display === 'canvas'
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
  clearData() {
    this.network = this.data = null
    this.labeler.clear()
    // @ts-expect-error See notes in constructor about emit method.
    this.emit('clear data', this)
  }

  /**
   * Update the Network data and redraw the map
   */
  updateData(data: TransitiveData, resetDisplay?: boolean) {
    this.network = null
    this.data = data
    if (resetDisplay) this.display.reset()
    else if (this.data) this.display.scaleSet = false
    this.labeler.clear()
    // @ts-expect-error See notes in constructor about emit method.
    this.emit('update data', this)
  }

  /**
   * Return the collection of default segment styles for a mode.
   *
   * @param {String} an OTP mode string
   */
  getModeStyles(mode: string) {
    return this.styler.getModeStyles(mode, this.display || new Display(this))
  }

  /** Display/Render Methods **/

  /**
   * Set the DOM element that serves as the main map canvas
   */
  setElement(el?: HTMLElement) {
    if (this.el) d3.select(this.el).selectAll('*').remove()

    this.el = el

    // @ts-expect-error See notes in constructor about emit method.
    this.emit('set element', this, this.el)
    return this
  }

  /**
   * Set the DOM element that serves as the main map canvas
   */
  setRenderer(type: RendererType) {
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
  render() {
    if (!this.network) {
      this.network = new Network(this, this.data)
    }

    if (!this.display.scaleSet) {
      this.display.fitToWorldBounds(this.network.graph.bounds())
    }

    this.renderer.render()

    // @ts-expect-error See notes in constructor about emit method.
    this.emit('render', this)
  }

  /**
   * Render to
   *
   * @param {Element} el
   */
  renderTo(el: HTMLElement) {
    this.setElement(el)
    this.render()

    // @ts-expect-error See notes in constructor about emit method.
    this.emit('render to', this)
    return this
  }

  /**
   * focusJourney
   */
  focusJourney(journeyId: string) {
    if (!this.network) {
      console.warn('Transitive network is not defined! Cannot focus journey!')
      return
    }
    const journey = (this.network.journeys as Journeys)[journeyId]
    const path = journey?.path || null
    this.renderer.focusPath(path)
  }

  /**
   * Sets the Display bounds
   * @param {Array} lon/lat bounds expressed as [[west, south], [east, north]]
   */
  setDisplayBounds(llBounds: Bounds) {
    if (!this.display) return
    const smWestSouth = sm.forward(llBounds[0])
    const smEastNorth = sm.forward(llBounds[1])
    // reset the display to make sure the correct display scale is recomputed
    // see https://github.com/conveyal/transitive.js/pull/50
    // FIXME this is a work-around for some other problem that occurs somewhere
    //   else. To investigate further, uncomment this line and compare the
    //   differences near the Putnam Plaza place in the Putnam Bug story.
    this.display.reset()
    this.display.setXDomain([smWestSouth[0], smEastNorth[0]])
    this.display.setYDomain([smWestSouth[1], smEastNorth[1]])
    this.display.computeScale()
  }

  /**
   * Gets the Network bounds
   * @returns {Array} lon/lat bounds expressed as [[west, south], [east, north]]
   */
  getNetworkBounds() {
    if (!this.network || !this.network.graph) return null
    const graphBounds = this.network.graph.bounds()
    const ll1 = sm.inverse(graphBounds[0])
    const ll2 = sm.inverse(graphBounds[1])
    return [
      [Math.min(ll1[0], ll2[0]), Math.min(ll1[1], ll2[1])],
      [Math.max(ll1[0], ll2[0]), Math.max(ll1[1], ll2[1])]
    ]
  }

  /**
   * resize
   */
  resize(width: number, height: number) {
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
  resized(width: number, height: number) {
    // @ts-expect-error I have no idea what magic this display object uses to
    // get a resized method. - Evan :(
    this.display.resized(width, height)
  }

  setTransform(transform: DisplayTransform) {
    this.display.applyTransform(transform)
    this.render()
  }

  /** editor functions **/

  createVertex(wx?: number, wy?: number) {
    if (!this.network) {
      console.warn('Transitive network is not defined! Cannot create vertex!')
      return
    }
    this.network.graph.addVertex(new Point(), wx, wy)
  }
}

/**
 * Mixin `Emitter`
 */

Emitter(Transitive.prototype)
