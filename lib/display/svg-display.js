import Display from './display2'
import SVG from 'svg.js'

export default class SvgDisplay extends Display {
  constructor (transitive) {
    super(transitive)

    const { el } = transitive.options
    // TODO: handle case of externally-provided SVG?

    // We have a DOM element
    if (el) {
      console.log('--> setting el in SvgDisplay');

      this.setDimensions(el.clientWidth, el.clientHeight)
      this.svg = SVG(el)
    }
  }

  clear () {
    this.svg.clear()
  }

  drawRect (upperLeft, attrs) {
    this.svg.rect().move(upperLeft.x, upperLeft.y).attr(attrs)
  }

  drawCircle (center, attrs) {
    this.svg.circle().move(center.x, center.y).attr(attrs)
  }

  drawEllipse (center, attrs) {
    this.svg.ellipse().move(center.x, center.y).attr(attrs)
  }

  drawPath (pathStr, attrs) {
    this.svg.path(pathStr).attr(attrs)
  }

  drawText (text, anchor, attrs) {
    this.svg.text(text).move(anchor.x, anchor.y).attr(attrs)
  }
}
