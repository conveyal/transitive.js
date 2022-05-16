import Route from '../core/route'
import RoutePattern from '../core/pattern'
import { otpModeToGtfsType } from '../util'

import styles from './styles'

/**
 * Element Types
 */

const types = [
  'labels',
  'segments',
  'segments_front',
  'segments_halo',
  'segment_labels',
  'segment_label_containers',
  'stops_merged',
  'stops_pattern',
  'places',
  'places_icon',
  'multipoints_merged',
  'multipoints_pattern',
  'wireframe_vertices',
  'wireframe_edges'
]

/**
 * Styler object
 */

export default class Styler {
  constructor(styles, transitive) {
    // if (!(this instanceof Styler)) return new Styler(styles)
    this.transitive = transitive

    // reset styles
    this.reset()

    // load styles
    if (styles) this.load(styles)
  }

  /**
   * Clear all current styles
   */

  clear() {
    for (const i in types) {
      this[types[i]] = {}
    }
  }

  /**
   * Reset to the predefined styles
   */

  reset() {
    for (const i in types) {
      const type = types[i]
      this[type] = Object.assign({}, styles[type] || {})
      for (const key in this[type]) {
        if (!Array.isArray(this[type][key])) this[type][key] = [this[type][key]]
      }
    }
  }

  /**
   * Load rules
   *
   * @param {Object} a set of style rules
   */

  load(styles) {
    for (const i in types) {
      const type = types[i]
      if (styles[type]) {
        for (const key in styles[type]) {
          this[type][key] = (this[type][key] || []).concat(styles[type][key])
        }
      }
    }
  }

  /**
   * Compute a style rule based on the current display and data
   *
   * @param {Array} array of rules
   * @param {Object} the Display object
   * @param {Object} data associated with this object
   * @param {Number} index of this object
   */

  compute(rules, display, data, index) {
    let computed
    for (const i in rules) {
      const rule = rules[i]
      const val =
        typeof rule === 'function'
          ? rule.call(this, display, data, index, styles.utils)
          : rule
      if (val !== undefined && val !== null) computed = val
    }
    return computed
  }

  compute2(type, attr, data, index) {
    let computed
    const rules = this[type][attr]
    if (!rules) return null
    for (const rule of rules) {
      const val =
        typeof rule === 'function'
          ? rule.call(this, this.transitive.display, data, index, styles.utils)
          : rule
      if (val !== undefined && val !== null) computed = val
    }
    return computed
  }

  /**
   * Return the collection of default segment styles for a mode.
   *
   * @param {String} an OTP mode string
   */

  getModeStyles(mode, display) {
    const modeStyles = {}

    // simulate a segment w/ the specified style
    const segment = {
      focused: true,
      isFocused: function () {
        return true
      }
    }

    if (
      mode === 'WALK' ||
      mode === 'BICYCLE' ||
      mode === 'BICYCLE_RENT' ||
      mode === 'CAR' ||
      mode === 'CAR_RENT' ||
      mode === 'MICROMOBILITY' ||
      mode === 'MICROMOBILITY_RENT' ||
      mode === 'SCOOTER'
    ) {
      segment.type = mode
    } else {
      // assume a transit mode
      segment.type = 'TRANSIT'
      segment.mode = otpModeToGtfsType(mode)
      const route = new Route({
        agency_id: '',
        route_id: '',
        route_long_name: '',
        route_short_name: '',
        route_type: segment.mode
      })
      const pattern = new RoutePattern({})
      route.addPattern(pattern)
      segment.patterns = [pattern]
    }

    for (const attrName in this.segments) {
      const rules = this.segments[attrName]
      for (const i in rules) {
        const rule = rules[i]
        const val = isFunction(rule)
          ? rule.call(this, display, segment, 0, styles.utils)
          : rule
        if (val !== undefined && val !== null) {
          modeStyles[attrName] = val
        }
      }
    }

    return modeStyles
  }
}

/**
 * Is function?
 */

function isFunction(val) {
  return Object.prototype.toString.call(val) === '[object Function]'
}
