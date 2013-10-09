
/**
 * Expose `rules`
 */

module.exports = {
    circle: {
        cx: 0,
        cy: 0,
        fill: 'white',
        r: 5,
        stroke: 'none'
    },

    label: {
        stroke: 'black',
        'font-family': 'sans-serif',
        'font-size': function(data, index, zoom) {
          if (data.stop.stop_id === 'S3') {
            return '20px';
          } else {
            return '12px';
          }
        },
        transform: function(data, index, zoom) {
            return 'rotate(-45, ' + this.x + ', ' + this.y + ')';
        },
        visibility: function(data, index, zoom) {
          if (zoom < 0.75) {
            return 'hidden';
          } else {
            return 'visible';
          }
        },
        x: 0,
        y: -12
    },

    line: {
        stroke: 'blue',
        'stroke-width': '15px',
        fill: 'none'
    }
};

/**
 * Other styles
 */

module.exports.s2 = {
    circle: {
        'cx': 0,
        'cy': 0,
        'fill': 'white',
        'r': 6,
        'stroke': 'black',
        'stroke-width': '2px'
    },

    label: {
        'color': 'black',
        'font-family': 'sans-serif',
        'font-size': '10px',
        'transform': function(zoom) {
            return 'rotate(45, ' + this.x + ', ' + this.y + ')';
        },
        visibility: function(data, zoom) {
          if (zoom < 0.75) {
            return 'hidden';
          } else {
            return 'visible';
          }
        },
        'x': -5,
        'y': 15
    },

    line: {
        'stroke': 'red',
        'stroke-width': '12px',
        'fill': 'none'
    }
};

module.exports.s3 = {
    circle: {
        'cx': 0,
        'cy': -6,
        'fill': 'green',
        'r': 7,
        'stroke': 'none'
    },

    label: {
        'color': 'black',
        'font-family': 'sans-serif',
        'font-size': '10px',
        'transform': function(data, zoom) {
            return 'rotate(-45, ' + this.x + ', ' + this.y + ')';
        },
        visibility: function(data, zoom) {
          if (zoom < 0.75) {
            return 'hidden';
          } else {
            return 'visible';
          }
        },
        'x': 0,
        'y': -16
    },

    line: {
        'stroke': 'green',
        'stroke-width': '12px',
        'fill': 'none'
    }
};
