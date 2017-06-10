/**
 * Label object
 */

export default class Label {
  constructor (parent) {
    this.parent = parent
    this.sortableType = 'LABEL'
  }

  getText () {
    if (!this.labelText) this.labelText = this.initText()
    return this.labelText
  }

  initText () {
    return this.parent.getName()
  }

  render (display) {}

  refresh (display) {}

  setVisibility (visibility) {
    if (this.svgGroup) this.svgGroup.attr('visibility', visibility ? 'visible' : 'hidden')
  }

  getBBox () {
    return null
  }

  intersects (obj) {
    return null
  }

  intersectsBBox (bbox) {
    var thisBBox = this.getBBox(this.orientation)
    var r = (thisBBox.x <= bbox.x + bbox.width &&
      bbox.x <= thisBBox.x + thisBBox.width &&
      thisBBox.y <= bbox.y + bbox.height &&
      bbox.y <= thisBBox.y + thisBBox.height)
    return r
  }

  isFocused () {
    return this.parent.isFocused()
  }

  getZIndex () {
    return 1000000
  }
}
