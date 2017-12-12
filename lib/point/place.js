import d3 from 'd3'

import Point from './point'
import { sm } from '../util'

/**
 *  Place: a Point subclass representing a 'place' that can be rendered on the
 *  map. A place is a point *other* than a transit stop/station, e.g. a home/work
 *  location, a point of interest, etc.
 */

export default class Place extends Point {
  /**
   *  the constructor
   */

  constructor (data) {
    super(data)

    if (data && data.place_lat && data.place_lon) {
      var xy = sm.forward([data.place_lon, data.place_lat])
      this.worldX = xy[0]
      this.worldY = xy[1]
    }

    this.zIndex = 100000
  }

  /**
   * Get Type
   */

  getType () {
    return 'PLACE'
  }

  /**
   * Get ID
   */

  getId () {
    return this.place_id
  }

  /**
   * Get Name
   */

  getName () {
    return this.place_name
  }

  /**
   * Get lat
   */

  getLat () {
    return this.place_lat
  }

  /**
   * Get lon
   */

  getLon () {
    return this.place_lon
  }

  containsSegmentEndPoint () {
    return true
  }

  containsFromPoint () {
    return (this.getId() === 'from')
  }

  containsToPoint () {
    return (this.getId() === 'to')
  }

  addRenderData (pointInfo) {
    this.renderData.push(pointInfo)
  }

  getRenderDataArray () {
    return this.renderData
  }

  clearRenderData () {
    this.renderData = []
  }

  /**
   * Draw a place
   *
   * @param {Display} display
   */

  render (display) {
    super.render(display)
    if (!this.renderData) return

    this.initSvg(display)
    this.svgGroup
      .attr('class', 'transitive-sortable')
      .datum({
        owner: this,
        sortableType: 'POINT_PLACE'
      })

    // set up the markers
    this.marker = this.markerSvg.append('circle')
      .datum({
        owner: this
      })
      .attr('class', 'transitive-place-circle')

    var iconUrl = display.styler.compute(display.styler.places_icon['xlink:href'], display, {
      owner: this
    })
    if (iconUrl) {
      this.icon = this.markerSvg.append('image')
        .datum({
          owner: this
        })
        .attr('class', 'transitive-place-icon')
        .attr('xlink:href', iconUrl)
    }
  }

  /**
   * Refresh the place
   *
   * @param {Display} display
   */

  refresh (display) {
    if (!this.renderData) return

    // compute the x/y location -- use the real-world coordinates if
    // geographic rendering is enabled, otherwise use snapped vertex coords
    var x = display.xScale(
      display.activeZoomFactors.useGeographicRendering
        ? this.worldX
        : this.graphVertex.x
    )
    var y = display.yScale(
      display.activeZoomFactors.useGeographicRendering
        ? this.worldY
        : this.graphVertex.y
    )
    const translate = 'translate(' + x + ', ' + y + ')'

    // update the marker/icon translations
    this.marker.attr('transform', translate)
    if (this.icon) this.icon.attr('transform', translate)
  }

  makeDraggable (transitive) {
    var place = this
    var display = transitive.display
    var drag = d3.behavior.drag()
      .on('dragstart', function () {
        d3.event.sourceEvent.stopPropagation() // silence other listeners
      })
      .on('drag', function () {
        if (place.graphVertex) {
          var boundingRect = display.el.getBoundingClientRect()
          var x = display.xScale.invert(d3.event.sourceEvent.pageX -
            boundingRect.left)
          var y = display.yScale.invert(d3.event.sourceEvent.pageY -
            boundingRect.top)

          place.worldX = x
          place.worldY = y
          var ll = sm.inverse([x, y])
          place.place_lon = ll[0]
          place.place_lat = ll[1]

          place.refresh(display)
        }
      })
      .on('dragend', function () {
        transitive.emit('place.' + place.getId() + '.dragend', place)
      })
    this.markerSvg.call(drag)
  }
}
