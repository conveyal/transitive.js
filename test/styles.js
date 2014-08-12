/**
 * Dependencies
 */

//var parse = require('color-parser');

/**
 * Expose pattern styles
 */

var STYLES = {};

STYLES.places_icon = {
  x: [-16 ],
  y: [-16 ],
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
