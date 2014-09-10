/**
 * Dependencies
 */

//var parse = require('color-parser');

/**
 * Expose pattern styles
 */

var STYLES = {};

STYLES.segments = {

  // override the default stroke color
  stroke: function(display, segment) {
    if (!segment.focused) return;

    switch (segment.type) {
      case 'CAR':
        return '#888';
      case 'WALK':
        return '#00f';
      case 'BICYCLE':
        return '#f00';

    }
  },

  // override the default stroke width
  'stroke-width': function(display, segment, index, utils) {
    switch (segment.type) {
      case 'CAR':
        return utils.pixels(display.zoom.scale(), 2, 4, 6) + 'px';
      case 'WALK':
      case 'BICYCLE':
        return '4px'
      case 'TRANSIT':
        // bus segments:
        if (segment.mode === 3) return utils.pixels(display.zoom.scale(), 2, 4,
          8) + 'px';
        // all others:
        return utils.pixels(display.zoom.scale(), 4, 8, 12) + 'px';
    }
  },

  // specify the dash-array
  'stroke-dasharray': function(display, segment) {
    switch (segment.type) {
      case 'CAR':
        return '3,2';
      case 'WALK':
      case 'BICYCLE':
        return '0.01,6';
    }
  },

  // specify the line cap type
  'stroke-linecap': function(display, segment) {
    switch (segment.type) {
      case 'CAR':
        return 'butt';
      case 'WALK':
      case 'BICYCLE':
        return 'round';
    }
  },

  // specify the circle marker for 'dotted' line styles
  /*'marker-mid': function(display, segment, index, utils) {
    var radius, fillColor;

    switch(segment.type) {
      case 'WALK':
        radius = 3;
        fillColor = '#5ae3f9';
        return utils.defineSegmentCircleMarker(display, segment, radius, fillColor);
      case 'BICYCLE':
        radius = 2;
        fillColor = '#f00';
        return utils.defineSegmentCircleMarker(display, segment, radius, fillColor);
    }
  },

  // specify the spacing for marker styling
  'marker-spacing': function(display, segment) {
    switch(segment.type) {
      case 'WALK':
        return 8;
      case 'BICYCLE':
        return 6;
    }
  }*/

};

/** style overrides for segment-based labels **/

STYLES.segment_label_containers = {

  // specify the fill color for the label bubble
  fill: function(display, label) {
    if (!label.isFocused()) return;

    return '#008';
  }
};

/** style overrides for places (i.e. the start and end icons) **/

STYLES.places_icon = {
  x: [-16],
  y: [-16],
  width: [
    32
  ],
  height: [
    32
  ],
  'xlink:href': [

    function(display, data) {
      if (data.owner.getId() === 'from') return 'img/star60.svg';
      if (data.owner.getId() === 'to') return 'img/map25.svg';
    }
  ],
  visibility: [
    'visible'
  ]
};
