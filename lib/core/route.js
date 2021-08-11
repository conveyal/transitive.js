import { invertColor } from '../util/color'

/**
 * A transit Route, as defined in the input data.
 * Routes contain one or more Patterns.
 */

export default class Route {
  constructor(data) {
    for (const key in data) {
      if (key === 'patterns') continue
      this[key] = data[key]
    }

    this.patterns = []
  }

  /**
   * Add Pattern
   *
   * @param {Pattern}
   */

  addPattern(pattern) {
    this.patterns.push(pattern)
    pattern.route = this
  }

  /**
   * Rather than rely on the route text color field to be defined, simply return
   * the black or white inverse of the background color.
   */
  getTextColor() {
    const bgColor = this.getColor()
    if (bgColor) return invertColor(bgColor)
  }

  getColor() {
    if (this.route_color) {
      if (this.route_color.charAt(0) === '#') return this.route_color
      return '#' + this.route_color
    }

    // assign a random shade of gray
    /* var c = 128 + Math.floor(64 * Math.random());
    var hex = c.toString(16);
    hex = (hex.length === 1) ? '0' + hex : hex;

    this.route_color = '#' + hex + hex + hex;

    return this.route_color; */
  }
}
