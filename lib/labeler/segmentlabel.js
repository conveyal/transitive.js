import Label from './label'

/**
 * SegmentLabel object
 */

export default class SegmentLabel extends Label {
  constructor (parent, text) {
    super(parent)
    this.labelText = text
  }

  render (display) {
    display.drawRect({
      x: this.labelAnchor.x - this.containerWidth / 2,
      y: this.labelAnchor.y - this.containerHeight / 2
    }, {
      fill: display.styler.compute2('segment_labels', 'background', this.parent),
      width: this.containerWidth,
      height: this.containerHeight,
      rx: this.containerHeight / 2,
      ry: this.containerHeight / 2
    })

    display.drawText(this.getText(), {
      x: this.labelAnchor.x - this.containerWidth / 2 + this.getPadding(),
      y: this.labelAnchor.y - this.containerHeight / 2 + this.getPadding()
    }, {
      fill: display.styler.compute2('segment_labels', 'color', this.parent),
      'font-size': this.fontSize
    })
  }

  refresh (display) {
    /*if (!this.labelAnchor) return

    if (!this.svgGroup) this.render(display)

    this.svgGroup
      .attr('transform', (d, i) => {
        var tx = (this.labelAnchor.x - this.containerWidth / 2)
        var ty = (this.labelAnchor.y - this.containerHeight / 2)
        return 'translate(' + tx + ',' + ty + ')'
      })*/
  }

  getPadding () {
    return this.textHeight * 0.3
  }

  computeContainerDimensions () {
    this.containerWidth = this.textWidth + this.getPadding() * 2
    this.containerHeight = this.textHeight + this.getPadding() * 2
  }

  getBBox () {
    return {
      x: this.labelAnchor.x - this.containerWidth / 2,
      y: this.labelAnchor.y - this.containerHeight / 2,
      width: this.containerWidth,
      height: this.containerHeight
    }
  }

  intersects (obj) {
    if (obj instanceof Label) {
      // todo: handle label-label intersection for diagonally placed labels separately
      return this.intersectsBBox(obj.getBBox())
    } else if (obj.x && obj.y && obj.width && obj.height) {
      return this.intersectsBBox(obj)
    }

    return false
  }

  /*clear () {
    this.labelAnchor = null
    if (this.svgGroup) {
      this.svgGroup.remove()
      this.svgGroup = null
    }
  }*/
}
