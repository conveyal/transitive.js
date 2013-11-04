
/**
 * Default static rules
 */

module.exports = {

  /**
   * All stops
   */

  '.transitive-stop-circle': {
    cx: 0,
    cy: 0,
    fill: 'white',
    r: 5,
    stroke: 'none'
  },

  /**
   * All labels
   */

  '.transitive-stop-label': {
    color: 'black',
    'font-family': 'sans-serif',
    'font-size': '10px',
    transform: function (transitive, pattern, data, index) {
      return 'rotate(-45, ' + this.x + ', ' + this.y + ')';
    },
    visibility: function (transitive, pattern, data, index) {
      if (transitive.display.zoom.scale() < 0.75) return 'hidden';
      return 'visible';
    },
    x: 0,
    y: -12
  },

  /**
   * All lines
   */

  '.transitive-line': {
    stroke: function (transitive, pattern) {
      if (pattern.route.route_color) {
        return '#' + pattern.route.route_color;
      } else {
        return 'grey';
      }
    },
    'stroke-width': '15px',
    fill: function (transitive, pattern, data, index) {
      return 'none';
    }
  }
};
