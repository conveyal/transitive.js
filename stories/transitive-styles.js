const STYLES = {}

STYLES.places_icon = {
  x: [-10],
  y: [-10],
  width: [
    20
  ],
  height: [
    20
  ],
  visibility: [
    'visible'
  ]
}

/**
 * Transitive style overrides for transit stops. All this does is sets the
 * radius to 6 pixels.
 */
STYLES.stops_merged = {
  r () {
    return 6
  }
}

export default STYLES
