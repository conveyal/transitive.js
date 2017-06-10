import Label from './label'

/**
 * Label object
 */

export default class PointLabel extends Label {
  constructor (parent) {
    super(parent)

    this.labelAngle = 0
    this.labelPosition = 1
  }

  initText () {
    return this.parent.getName()
  }

  render (display) {
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
  }

  setOrientation (orientation) {
    this.orientation = orientation

    var markerBBox = this.parent.getMarkerBBox()
    if (!markerBBox) return

    var x, y
    var offset = 5

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

  getBBox () {
    if (this.orientation === 'E') {
      return {
        x: this.labelAnchor.x,
        y: this.labelAnchor.y - this.textHeight,
        width: this.textWidth,
        height: this.textHeight
      }
    }

    if (this.orientation === 'W') {
      return {
        x: this.labelAnchor.x - this.textWidth,
        y: this.labelAnchor.y - this.textHeight,
        width: this.textWidth,
        height: this.textHeight
      }
    }

    if (this.orientation === 'N') {
      return {
        x: this.labelAnchor.x - this.textHeight,
        y: this.labelAnchor.y - this.textWidth,
        width: this.textHeight,
        height: this.textWidth
      }
    }

    if (this.orientation === 'S') {
      return {
        x: this.labelAnchor.x - this.textHeight,
        y: this.labelAnchor.y,
        width: this.textHeight,
        height: this.textWidth
      }
    }

    var bboxSide = this.textWidth * Math.sqrt(2) / 2

    if (this.orientation === 'NE') {
      return {
        x: this.labelAnchor.x,
        y: this.labelAnchor.y - bboxSide,
        width: bboxSide,
        height: bboxSide
      }
    }

    if (this.orientation === 'SE') {
      return {
        x: this.labelAnchor.x,
        y: this.labelAnchor.y,
        width: bboxSide,
        height: bboxSide
      }
    }

    if (this.orientation === 'NW') {
      return {
        x: this.labelAnchor.x - bboxSide,
        y: this.labelAnchor.y - bboxSide,
        width: bboxSide,
        height: bboxSide
      }
    }

    if (this.orientation === 'SW') {
      return {
        x: this.labelAnchor.x - bboxSide,
        y: this.labelAnchor.y,
        width: bboxSide,
        height: bboxSide
      }
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

  runFocusTransition (display, callback) {
    if (this.mainLabel) {
      if (this.parent.isFocused()) this.setVisibility(true)
      this.mainLabel.transition()
        .style('opacity', this.parent.isFocused() ? 1 : 0)
        .call(callback)
    }
  }
}
