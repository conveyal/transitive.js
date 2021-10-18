import LinearScale from '../util/linear-scale.js'

export default class Display {
  constructor(transitive) {
    this.transitive = transitive

    this.zoomFactors =
      transitive.options.zoomFactors || this.getDefaultZoomFactors()

    this.updateActiveZoomFactors(1)
  }

  setDimensions(width, height) {
    this.width = width
    this.height = height
  }

  setXDomain(domain) {
    // [minX , maxX]
    this.xDomain = domain
    this.xScale = new LinearScale(domain, [0, this.width])
    if (!this.initialXDomain) {
      this.initialXDomain = domain
      this.initialXRes = (domain[1] - domain[0]) / this.width
    }
  }

  setYDomain(domain) {
    // [minY , maxY]
    this.yDomain = domain
    this.yScale = new LinearScale(domain, [this.height, 0])
    if (!this.initialYDomain) this.initialYDomain = domain
  }

  fitToWorldBounds(bounds) {
    const domains = this.computeDomainsFromBounds(bounds)
    this.setXDomain(domains[0])
    this.setYDomain(domains[1])
    this.computeScale()
  }

  reset() {
    this.initialXDomain = null
    this.initialYDomain = null
    this.scaleSet = false
    this.lastScale = undefined
  }

  /**
   * Apply a transformation {x, y, k} to the *initial* state of the map, where
   * (x, y) is the pixel offset and k is a scale factor relative to an initial
   * zoom level of 1.0. Intended primarily to support D3-style panning/zooming.
   */

  applyTransform(transform) {
    const { k, x, y } = transform

    let xMin = this.initialXDomain[0]
    let xMax = this.initialXDomain[1]
    let yMin = this.initialYDomain[0]
    let yMax = this.initialYDomain[1]

    // Apply the scale factor
    xMax = xMin + (xMax - xMin) / k
    yMin = yMax - (yMax - yMin) / k

    // Apply the translation
    const xOffset = (-x * (xMax - xMin)) / this.width
    xMin += xOffset
    xMax += xOffset
    const yOffset = (y * (yMax - yMin)) / this.height
    yMin += yOffset
    yMax += yOffset

    // Update the scale functions and recompute the internal scale factor
    this.setXDomain([xMin, xMax])
    this.setYDomain([yMin, yMax])
    this.computeScale()
  }

  getDefaultZoomFactors(data) {
    return [
      {
        angleConstraint: 45,
        gridCellSize: 25,
        internalVertexFactor: 1000000,
        mergeVertexThreshold: 200,
        minScale: 0
      },
      {
        angleConstraint: 5,
        gridCellSize: 0,
        internalVertexFactor: 0,
        mergeVertexThreshold: 0,
        minScale: 1.5
      }
    ]
  }

  updateActiveZoomFactors(scale) {
    let updated = false
    for (let i = 0; i < this.zoomFactors.length; i++) {
      const min = this.zoomFactors[i].minScale
      const max =
        i < this.zoomFactors.length - 1
          ? this.zoomFactors[i + 1].minScale
          : Number.MAX_VALUE

      // check if we've crossed into a new zoomFactor partition
      if (
        (!this.lastScale || this.lastScale < min || this.lastScale >= max) &&
        scale >= min &&
        scale < max
      ) {
        this.activeZoomFactors = this.zoomFactors[i]
        updated = true
      }
    }
    return updated
  }

  computeScale() {
    this.lastScale = this.scale
    this.scaleSet = true
    const newXRes = (this.xDomain[1] - this.xDomain[0]) / this.width
    this.scale = this.initialXRes / newXRes
    if (this.lastScale !== this.scale) this.scaleChanged()
  }

  scaleChanged() {
    const zoomFactorsChanged = this.updateActiveZoomFactors(this.scale)
    if (zoomFactorsChanged) {
      this.transitive.network = null
      this.transitive.render()
    }
  }

  /**
   * Compute the x/y coordinate space domains to fit the graph.
   */

  computeDomainsFromBounds(bounds) {
    const xmin = bounds[0][0]
    const xmax = bounds[1][0]
    const ymin = bounds[0][1]
    const ymax = bounds[1][1]
    const xRange = xmax - xmin
    const yRange = ymax - ymin

    const { options } = this.transitive

    const paddingFactor =
      options && options.paddingFactor ? options.paddingFactor : 0.1

    const margins = this.getMargins()

    const usableHeight = this.height - margins.top - margins.bottom
    const usableWidth = this.width - margins.left - margins.right
    const displayAspect = this.width / this.height
    const usableDisplayAspect = usableWidth / usableHeight
    const graphAspect = xRange / (yRange === 0 ? -Infinity : yRange)

    let padding
    let dispX1, dispX2, dispY1, dispY2
    let dispXRange, dispYRange

    if (usableDisplayAspect > graphAspect) {
      // y-axis is limiting
      padding = paddingFactor * yRange
      dispY1 = ymin - padding
      dispY2 = ymax + padding
      dispYRange = yRange + 2 * padding
      const addedYRange = (this.height / usableHeight) * dispYRange - dispYRange
      if (margins.top > 0 || margins.bottom > 0) {
        dispY1 -=
          (margins.bottom / (margins.bottom + margins.top)) * addedYRange
        dispY2 += (margins.top / (margins.bottom + margins.top)) * addedYRange
      }
      dispXRange = (dispY2 - dispY1) * displayAspect
      const xOffset = (margins.left - margins.right) / this.width
      const xMidpoint = (xmax + xmin - dispXRange * xOffset) / 2
      dispX1 = xMidpoint - dispXRange / 2
      dispX2 = xMidpoint + dispXRange / 2
    } else {
      // x-axis limiting
      padding = paddingFactor * xRange
      dispX1 = xmin - padding
      dispX2 = xmax + padding
      dispXRange = xRange + 2 * padding
      const addedXRange = (this.width / usableWidth) * dispXRange - dispXRange
      if (margins.left > 0 || margins.right > 0) {
        dispX1 -= (margins.left / (margins.left + margins.right)) * addedXRange
        dispX2 += (margins.right / (margins.left + margins.right)) * addedXRange
      }

      dispYRange = (dispX2 - dispX1) / displayAspect
      const yOffset = (margins.bottom - margins.top) / this.height
      const yMidpoint = (ymax + ymin - dispYRange * yOffset) / 2
      dispY1 = yMidpoint - dispYRange / 2
      dispY2 = yMidpoint + dispYRange / 2
    }

    return [
      [dispX1, dispX2],
      [dispY1, dispY2]
    ]
  }

  getMargins() {
    return Object.assign(
      {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0
      },
      this.transitive.options.displayMargins
    )
  }

  isInRange(x, y) {
    return x >= 0 && x <= this.width && y >= 0 && y <= this.height
  }

  /** Methods to be defined by subclasses **/

  clear() {
    throw new Error('method not implemented by subclass!')
  }

  drawCircle(coord, attrs) {
    throw new Error('method not implemented by subclass!')
  }

  drawEllipse(coord, attrs) {
    throw new Error('method not implemented by subclass!')
  }

  drawRect(upperLeft, attrs) {
    throw new Error('method not implemented by subclass!')
  }

  drawText(text, anchor, attrs) {
    throw new Error('method not implemented by subclass!')
  }

  drawPath(renderData, attrs) {
    throw new Error('method not implemented by subclass!')
  }
}
