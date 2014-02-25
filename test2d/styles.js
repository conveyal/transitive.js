
/**
 * Dependencies
 */

//var parse = require('color-parser');

/**
 * Expose pattern styles
 */

var STYLES = {};

STYLES.segments = {
  stroke: function(display, data) {
    if (data.type === 'TRANSIT') {
      var color = toBSColor(data.pattern.route_id.toLowerCase());
      return color || '#999';
    }
    return '#ddd';
  },
  'stroke-dasharray': function(display, data) {
    if (data.type !== 'TRANSIT') {
      return '10, 5';
    }
  },
  'stroke-linecap': [
    'round',
    function(display, data) {
      if (!data.otpSegment) {
        return 'butt';
      }
    }
  ]
};

/**
 * Expose stop styles
 */

STYLES.stops = {
  /*r: [
    function(display, data, index, utils) {
      return utils.pixels(display.zoom.scale(), 2, 4, 8) + 'px';
    },
    function(display, data, index, utils) {
      if (data.point.isSegmentEndPoint) {
        return utils.pixels(display.zoom.scale(), 2, 4, 8) + 'px';
      }
    },
    function(display, data, index, utils) {
      if (data.point.isEndPoint) {
        return utils.pixels(display.zoom.scale(), 3, 6, 12) + 'px';
      }
    }
  ],*/
  stroke: '#444',
  'stroke-width': [
    function(display, data, index, utils) {
      return utils.pixels(display.zoom.scale(), 0.5, 1, 2) + 'px';
    },
    function(display, data, index, utils) {
      if (data.point.isSegmentEndPoint) {
        return utils.pixels(display.zoom.scale(), 1, 2, 4) + 'px';
      }
    },
    function(display, data, index, utils) {
      if (data.point.isEndPoint) {
        return utils.pixels(display.zoom.scale(), 2, 4, 8) + 'px';
      }
    }
  ]
};

/**
 * Expose label styles
 */

STYLES.labels = {
  x: function (display, data, index, utils) {
    var width = utils.strokeWidth(display);
    if (data.stop && data.stop.isEndPoint) {
      width *= data.stop.renderData.length;
    }
    return Math.sqrt(width * width * 2) * (data.stop && data.stop.labelPosition ? data.stop.labelPosition : -1) + 'px';
  },
  y: function (display, data, index, utils) {
    return utils.fontSize(display, data) / 2 * -(data.stop && data.stop.labelPosition ? data.stop.labelPosition : -1) + 'px';
  },
  'font-size': '12px',
  'text-transform': 'uppercase',
  'font-family': 'Helvetica',
  'visibility': 'hidden'
  /*transform: function(display, data) {
    console.log(data);
    if (data.point) {
      if (data.point.isEndPoint) {
        return '';
      } else {
        var angle = data.point.angle;
        if (angle > 0) angle = 45 - angle;
        else angle -= 45;
        return 'rotate(' + angle + ', 0, 0)';
      }
    }
  }*/
};

/**
 * TO BSColor
 */

function toBSColor(s) {
  switch (s.toLowerCase()) {
    case 'red':
      return '#d9534f';
    case 'green':
      return '#5cb85c';
    case 'blue':
      return '#428bca';
    case 'yellow':
      return '#ffd247';
    case 'orange':
      return '#f0ad4e';
    case 'lightgrey':
      return '#efefef';
    default:
      return null;
  }
}
