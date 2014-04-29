
/**
 * Dependencies
 */

//var parse = require('color-parser');

/**
 * Expose pattern styles
 */

var STYLES = {};

STYLES.places_icon = {
  x: [
    -10,
  ],
  y: [
    -10,
  ],
  width: [
    20,
  ],
  height: [
    20,
  ],
  'xlink:href' : [
    function(display, data) {
      if(data.owner.getId() === 'from') return 'img/house.svg';
      if(data.owner.getId() === 'to') return 'img/office.svg';
    }
  ],
  visibility: [ 
    'visible'
  ]
};