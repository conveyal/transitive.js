
var DEFAULT_RULES = {

  /**
   * Expose `stop`
   */

  stop: {
    cx: 0,
    cy: 0,
    fill: 'white',
    r: 5,
    stroke: 'none'
  },

  /**
   * Expose `stop labels`
   */

  stopLabel: {
    'font-family': 'sans-serif',
    'font-size': function(data, display, index) {
      if (data.stop.stop_id === 'S3') {
        return '20px';
      } else {
        return '12px';
      }
    },
    transform: function(data, display, index) {
      return 'rotate(-45, ' + this.x + ', ' + this.y + ')';
    },
    visibility: function(data, display, index) {
      if (display.zoom.scale() < 0.75) {
        return 'hidden';
      } else {
        return 'visible';
      }
    },
    x: 0,
    y: -12
  },

  /**
   * Expose `route`
   */

  route: {
    stroke: 'blue',
    'stroke-width': '15px',
    fill: 'none'
  }

};
