/**
 * Label object
 */

export default class Label {
  constructor(parent) {
    this.parent = parent
    this.sortableType = 'LABEL'
  }

  getText() {
    if (!this.labelText) this.labelText = this.initText()
    return this.labelText
  }

  initText() {
    // TODO: determine why getName is missing for patterns running on routes
    // without short names
    return typeof this.parent.getName === 'function'
      ? this.parent.getName()
      : null
  }

  render(display) {
    throw new Error('method not defined by subclass!')
  }

  /**
   * Does not need to be implemented by subclass
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  refresh(display) {}

  setVisibility(visibility) {
    if (this.svgGroup) {
      this.svgGroup.attr('display', visibility ? 'initial' : 'none')
    }
  }

  getBBox() {
    return null
  }

  intersects(obj) {
    return null
  }

  intersectsBBox(bbox) {
    const thisBBox = this.getBBox(this.orientation)
    const r =
      thisBBox.x <= bbox.x + bbox.width &&
      bbox.x <= thisBBox.x + thisBBox.width &&
      thisBBox.y <= bbox.y + bbox.height &&
      bbox.y <= thisBBox.y + thisBBox.height
    return r
  }

  isFocused() {
    return this.parent.isFocused()
  }

  getZIndex() {
    return 1000000
  }
}
