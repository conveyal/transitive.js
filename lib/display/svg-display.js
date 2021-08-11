import SVG from 'svg.js'

import { renderDataToSvgPath } from '../util'

import Display from './display'

export default class SvgDisplay extends Display {
  constructor(transitive) {
    super(transitive)

    const { el } = transitive.options
    // TODO: handle case of externally-provided SVG?

    // We have a DOM element
    if (el) {
      this.setDimensions(el.clientWidth, el.clientHeight)
      this.svg = SVG(el)
    }
  }

  clear() {
    this.svg.clear()
  }

  drawRect(upperLeft, attrs) {
    this.svg.rect().move(upperLeft.x, upperLeft.y).attr(attrs)
  }

  drawCircle(center, attrs) {
    this.svg.circle().move(center.x, center.y).attr(attrs)
  }

  drawEllipse(center, attrs) {
    this.svg.ellipse().move(center.x, center.y).attr(attrs)
  }

  drawPath(renderData, attrs) {
    this.svg.path(renderDataToSvgPath(renderData)).attr(attrs)
  }

  drawText(text, anchor, attrs) {
    this.svg.text(text).move(anchor.x, anchor.y).attr(attrs)
  }
}
