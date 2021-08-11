const STYLES = {}

STYLES.places_icon = {
  height: [20],
  visibility: ['visible'],
  width: [20],
  x: [-10],
  y: [-10]
}

/**
 * Transitive style overrides for transit stops. All this does is sets the
 * radius to 6 pixels.
 */
STYLES.stops_merged = {
  r() {
    return 6
  }
}

export default STYLES
