import { getFontSizeWithUnit } from '../util'

import Label from './label'

/**
 * Label object
 */

export default class PointLabel extends Label {
  constructor(parent) {
    super(parent)

    this.labelAngle = 0
    this.labelPosition = 1
  }

  initText() {
    return this.parent.getName()
  }

  /* render (display) {
    this.svgGroup = display.svg.append('g') // this.parent.labelSvg;
    this.svgGroup
      .attr('class', 'transitive-sortable')
      .datum({
        owner: this,
        sortableType: 'POINT_LABEL'
      })

    var typeStr = this.parent.getType().toLowerCase()

    this.mainLabel = this.svgGroup.append('text')
      .datum({
        owner: this
      })
      .attr('id', 'transitive-' + typeStr + '-label-' + this.parent.getId())
      .text(this.getText())
      .attr('font-size', this.fontSize)
      .attr('font-family', this.fontFamily)
      .attr('class', 'transitive-' + typeStr + '-label')
  }

  refresh (display) {
    if (!this.labelAnchor) return

    if (!this.svgGroup) this.render(display)

    this.svgGroup
      .attr('text-anchor', this.labelPosition > 0 ? 'start' : 'end')
      .attr('transform', (d, i) => {
        return 'translate(' + this.labelAnchor.x + ',' + this.labelAnchor
          .y + ')'
      })

    this.mainLabel
      .attr('transform', (d, i) => {
        return 'rotate(' + this.labelAngle + ', 0, 0)'
      })
  } */

  render(display) {
    const text = this.getText()
    if (!text || !this.labelAnchor) return

    const anchor = {
      x: this.labelAnchor.x,
      y: this.labelAnchor.y - this.textHeight / 2
    }

    // define common style attributes for the halo and main text
    const attrs = {
      fill: '#000',
      'font-family': display.styler.compute2(
        'labels',
        'font-family',
        this.parent
      ),
      'font-size': getFontSizeWithUnit(this.fontSize),
      'text-anchor': this.labelPosition > 0 ? 'start' : 'end'
    }

    // draw the halo
    display.drawText(
      text,
      anchor,
      Object.assign({}, attrs, {
        fill: 'none',
        stroke: '#fff',
        'stroke-opacity': 0.75,
        'stroke-width': 3
      })
    )

    // draw the main text
    display.drawText(text, anchor, attrs)
  }

  setOrientation(orientation) {
    this.orientation = orientation

    const markerBBox = this.parent.getMarkerBBox()
    if (!markerBBox) return

    let x, y
    const offset = 5

    if (orientation === 'E') {
      x = markerBBox.x + markerBBox.width + offset
      y = markerBBox.y + markerBBox.height / 2
      this.labelPosition = 1
      this.labelAngle = 0
    } else if (orientation === 'W') {
      x = markerBBox.x - offset
      y = markerBBox.y + markerBBox.height / 2
      this.labelPosition = -1
      this.labelAngle = 0
    } else if (orientation === 'NE') {
      x = markerBBox.x + markerBBox.width + offset
      y = markerBBox.y - offset
      this.labelPosition = 1
      this.labelAngle = -45
    } else if (orientation === 'SE') {
      x = markerBBox.x + markerBBox.width + offset
      y = markerBBox.y + markerBBox.height + offset
      this.labelPosition = 1
      this.labelAngle = 45
    } else if (orientation === 'NW') {
      x = markerBBox.x - offset
      y = markerBBox.y - offset
      this.labelPosition = -1
      this.labelAngle = 45
    } else if (orientation === 'SW') {
      x = markerBBox.x - offset
      y = markerBBox.y + markerBBox.height + offset
      this.labelPosition = -1
      this.labelAngle = -45
    } else if (orientation === 'N') {
      x = markerBBox.x + markerBBox.width / 2
      y = markerBBox.y - offset
      this.labelPosition = 1
      this.labelAngle = -90
    } else if (orientation === 'S') {
      x = markerBBox.x + markerBBox.width / 2
      y = markerBBox.y + markerBBox.height + offset
      this.labelPosition = -1
      this.labelAngle = -90
    }

    this.labelAnchor = {
      x: x,
      y: y
    }
  }

  getBBox() {
    if (this.orientation === 'E') {
      return {
        height: this.textHeight,
        width: this.textWidth,
        x: this.labelAnchor.x,
        y: this.labelAnchor.y - this.textHeight
      }
    }

    if (this.orientation === 'W') {
      return {
        height: this.textHeight,
        width: this.textWidth,
        x: this.labelAnchor.x - this.textWidth,
        y: this.labelAnchor.y - this.textHeight
      }
    }

    if (this.orientation === 'N') {
      return {
        height: this.textWidth,
        width: this.textHeight,
        x: this.labelAnchor.x - this.textHeight,
        y: this.labelAnchor.y - this.textWidth
      }
    }

    if (this.orientation === 'S') {
      return {
        height: this.textWidth,
        width: this.textHeight,
        x: this.labelAnchor.x - this.textHeight,
        y: this.labelAnchor.y
      }
    }

    const bboxSide = (this.textWidth * Math.sqrt(2)) / 2

    if (this.orientation === 'NE') {
      return {
        height: bboxSide,
        width: bboxSide,
        x: this.labelAnchor.x,
        y: this.labelAnchor.y - bboxSide
      }
    }

    if (this.orientation === 'SE') {
      return {
        height: bboxSide,
        width: bboxSide,
        x: this.labelAnchor.x,
        y: this.labelAnchor.y
      }
    }

    if (this.orientation === 'NW') {
      return {
        height: bboxSide,
        width: bboxSide,
        x: this.labelAnchor.x - bboxSide,
        y: this.labelAnchor.y - bboxSide
      }
    }

    if (this.orientation === 'SW') {
      return {
        height: bboxSide,
        width: bboxSide,
        x: this.labelAnchor.x - bboxSide,
        y: this.labelAnchor.y
      }
    }
  }

  intersects(obj) {
    if (obj instanceof Label) {
      // todo: handle label-label intersection for diagonally placed labels separately
      return this.intersectsBBox(obj.getBBox())
    } else if (obj.x && obj.y && obj.width && obj.height) {
      return this.intersectsBBox(obj)
    }

    return false
  }

  runFocusTransition(display, callback) {
    if (this.mainLabel) {
      if (this.parent.isFocused()) this.setVisibility(true)
      this.mainLabel
        .transition()
        .style('opacity', this.parent.isFocused() ? 1 : 0)
        .call(callback)
    }
  }
}
