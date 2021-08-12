// Note: this code is duplicated from @opentripplanner/transitive-overlay package
// with the transitive-js imports replaced with local imports.
// See https://github.com/opentripplanner/otp-ui/blob/master/packages/transitive-overlay/src/index.js

import L from 'leaflet'
import isEqual from 'lodash.isequal'
import { MapLayer, withLeaflet } from 'react-leaflet'

import Transitive from '../lib/transitive'

import transitiveStyles from './transitive-styles'

require('./leaflet-canvas-layer')

// TODO: move to util?
function checkHiPPI(canvas) {
  if (window.devicePixelRatio > 1) {
    const PIXEL_RATIO = 2
    canvas.style.width = `${canvas.width}px`
    canvas.style.height = `${canvas.height}px`

    canvas.width *= PIXEL_RATIO
    canvas.height *= PIXEL_RATIO

    const context = canvas.getContext('2d')
    context.scale(PIXEL_RATIO, PIXEL_RATIO)
  }
}

const DEFAULT_ZOOM_FACTORS = [
  {
    angleConstraint: 5,
    gridCellSize: 0,
    internalVertexFactor: 0,
    mergeVertexThreshold: 0,
    minScale: 0,
    useGeographicRendering: true
  }
]

// By default, only bus segments are labeled.
// (See /lib/util/index.js#otpModeToGtfsType for mode type codes.)
const DEFAULT_LABELED_MODES = [3]

class TransitiveCanvasOverlay extends MapLayer {
  // React Lifecycle Methods

  componentDidMount() {
    const { map } = this.props.leaflet
    L.canvasLayer()
      .delegate(this) // -- if we do not inherit from L.CanvasLayer  we can setup a delegate to receive events from L.CanvasLayer
      .addTo(map)
  }

  componentDidUpdate(prevProps) {
    // Check if we received new transitive data
    if (
      this.transitive &&
      !isEqual(prevProps.transitiveData, this.props.transitiveData)
    ) {
      this.transitive.updateData(this.props.transitiveData)
      if (!this.props.transitiveData) this.transitive.render()
      else this.updateBoundsAndRender()
    }

    if (
      // this block only applies for profile trips where active option changed
      this.props.routingType === 'PROFILE' &&
      prevProps.activeItinerary !== this.props.activeItinerary
    ) {
      if (this.props.activeItinerary == null) {
        // no option selected clear focus
        this.transitive.focusJourney(null)
        this.transitive.render()
      } else if (this.props.transitiveData) {
        this.transitive.focusJourney(
          this.props.transitiveData.journeys[this.props.activeItinerary]
            .journey_id
        )
        this.transitive.render()
      }
    }
  }

  componentWillUnmount() {
    if (this.transitive) {
      this.transitive.updateData(null)
      this.transitive.render()
    }
  }

  // Internal Methods

  initTransitive(canvas) {
    const {
      labeledModes = DEFAULT_LABELED_MODES,
      leaflet,
      styles = transitiveStyles,
      transitiveData,
      zoomFactors = DEFAULT_ZOOM_FACTORS
    } = this.props
    const { map } = leaflet

    // set up the transitive instance
    const mapBounds = map.getBounds()
    this.transitive = new Transitive({
      autoResize: false,
      canvas,
      data: transitiveData,
      display: 'canvas',
      initialBounds: [
        [mapBounds.getWest(), mapBounds.getSouth()],
        [mapBounds.getEast(), mapBounds.getNorth()]
      ],
      labeledModes,
      styles,
      zoomEnabled: false,
      zoomFactors
    })

    checkHiPPI(canvas)

    // the initial map draw
    this.updateBoundsAndRender()
  }

  updateBoundsAndRender() {
    if (!this.transitive) {
      console.log(
        'WARNING: Transitive object not set in transitive-canvas-overlay'
      )
      return
    }

    const mapBounds = this.props.leaflet.map.getBounds()
    this.transitive.setDisplayBounds([
      [mapBounds.getWest(), mapBounds.getSouth()],
      [mapBounds.getEast(), mapBounds.getNorth()]
    ])
    this.transitive.render()
  }

  // Leaflet Layer API Methods

  onDrawLayer(info) {
    if (!this.transitive) this.initTransitive(info.canvas)

    const mapSize = this.props.leaflet.map.getSize()
    if (
      this.lastMapSize &&
      (mapSize.x !== this.lastMapSize.x || mapSize.y !== this.lastMapSize.y)
    ) {
      const canvas = info.canvas
      checkHiPPI(canvas)
      this.transitive.display.setDimensions(mapSize.x, mapSize.y)
      this.transitive.display.setCanvas(canvas)
    }

    this.updateBoundsAndRender()

    this.lastMapSize = this.props.leaflet.map.getSize()
  }

  // the next line might be needed for react-leaflet
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  createTile() {}

  // the next line might be needed for react-leaflet
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  createLeafletElement() {}

  // the next line might be needed for react-leaflet
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateLeafletElement() {}
}

export default withLeaflet(TransitiveCanvasOverlay)
