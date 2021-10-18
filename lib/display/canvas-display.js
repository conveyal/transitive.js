import roundedRect from 'rounded-rect'

import Display from './display'

export default class CanvasDisplay extends Display {
  constructor(transitive) {
    super(transitive)

    const { canvas, el } = transitive.options

    // Handle case of externally-provided canvas
    if (canvas) {
      // Set internal dimensions to match those of canvas
      this.setDimensions(canvas.width, canvas.height)
      this.setCanvas(canvas)

      // We have a DOM element; create canvas
    } else if (el) {
      this.setDimensions(el.clientWidth, el.clientHeight)

      const canvas = document.createElement('canvas')
      canvas.width = el.clientWidth
      canvas.height = el.clientHeight
      el.appendChild(canvas)

      // Check for Hi-PPI display
      if (window.devicePixelRatio > 1) makeCanvasHiPPI(canvas)

      this.setCanvas(canvas)
    }
  }

  setCanvas(canvas) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  drawRect(upperLeft, attrs) {
    this.ctx.strokeStyle = attrs.stroke
    this.ctx.lineWidth = attrs['stroke-width']
    this.ctx.fillStyle = attrs.fill

    this.ctx.beginPath()
    if (attrs.rx && attrs.ry && attrs.rx === attrs.ry) {
      roundedRect(
        this.ctx,
        upperLeft.x,
        upperLeft.y,
        attrs.width,
        attrs.height,
        attrs.rx
      )
      // TODO: handle case where rx != ry
    } else {
      // ordinary rectangle
      this.ctx.rect(upperLeft.x, upperLeft.y, attrs.width, attrs.height)
    }
    this.ctx.closePath()

    if (attrs.fill) this.ctx.fill()
    if (attrs.stroke) this.ctx.stroke()
  }

  drawCircle(center, attrs) {
    this.ctx.beginPath()
    this.ctx.arc(center.x, center.y, attrs.r, 0, Math.PI * 2, true)
    this.ctx.closePath()

    if (attrs.fill) {
      this.ctx.fillStyle = attrs.fill
      this.ctx.fill()
    }
    if (attrs.stroke) {
      this.ctx.strokeStyle = attrs.stroke
      this.ctx.lineWidth = attrs['stroke-width'] || 1
      this.ctx.stroke()
    }
  }

  drawEllipse(center, attrs) {
    // TODO: implement
  }

  drawPath(renderData, attrs) {
    if (!renderData || renderData.length === 0) return

    // Apply stroke/width styles
    this.ctx.strokeStyle = attrs.stroke
    this.ctx.lineWidth = attrs['stroke-width']

    // Apply line-dash style, if present
    if (attrs['stroke-dasharray']) {
      const arr = attrs['stroke-dasharray']
        .split(',')
        .map((str) => parseFloat(str.trim()))
      this.ctx.setLineDash(arr)
    }

    // Apply linecap style
    this.ctx.lineCap = attrs['stroke-linecap'] || 'butt'

    // Apply 'round' line join for smooth edge rendering.
    // (The default join is 'miter', which causes jagged edges when zoomed away.)
    this.ctx.lineJoin = 'round'

    // Draw the path
    this.ctx.beginPath()
    this.ctx.moveTo(renderData[0].x, renderData[0].y)
    for (let i = 1; i < renderData.length; i++) {
      const rd = renderData[i]
      if (rd.arc) this.ctx.arcTo(rd.ex, rd.ey, rd.x, rd.y, rd.radius)
      else this.ctx.lineTo(rd.x, rd.y)
    }
    this.ctx.stroke()

    // Revert line-dash style to default
    if (attrs['stroke-dasharray']) this.ctx.setLineDash([])
  }

  drawText(text, anchor, attrs) {
    // For equivalence w/ SVG text rendering
    this.ctx.textBaseline = 'top'

    this.ctx.font = `${attrs['font-size'] || '14px'} ${
      attrs['font-family'] || 'sans-serif'
    }`
    if (attrs['text-anchor']) this.ctx.textAlign = attrs['text-anchor']

    if (attrs.stroke) {
      this.ctx.strokeStyle = attrs.stroke
      if (attrs['stroke-opacity']) {
        this.ctx.globalAlpha = attrs['stroke-opacity']
      }
      this.ctx.lineWidth = attrs['stroke-width'] || 1
      this.ctx.strokeText(text, anchor.x, anchor.y)
    }
    if (attrs.fill) {
      this.ctx.fillStyle = attrs.fill
      if (attrs['fill-opacity']) this.ctx.globalAlpha = attrs['fill-opacity']
      this.ctx.fillText(text, anchor.x, anchor.y)
    }

    this.ctx.textAlign = 'start'
    this.ctx.globalAlpha = 1
  }
}

// Utility function to support HiPPI displays (e.g. Retina)
function makeCanvasHiPPI(canvas) {
  const PIXEL_RATIO = 2
  canvas.style.width = canvas.width + 'px'
  canvas.style.height = canvas.height + 'px'

  canvas.width *= PIXEL_RATIO
  canvas.height *= PIXEL_RATIO

  const context = canvas.getContext('2d')
  context.scale(PIXEL_RATIO, PIXEL_RATIO)
}
