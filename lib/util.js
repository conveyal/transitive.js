/**
 * General Transitive utilities library
 */

var d3 = require('d3');


/**
 * Parse a pixel-based style descriptor, returning an number. 
 *
 * @param {String/Number} 
 */

module.exports.parsePixelStyle = function(descriptor) {
  if(typeof descriptor === 'number') return descriptor;
  return parseFloat(descriptor.substring(0, descriptor.length - 2), 10);
};



module.exports.getTextBBox = function(text, attrs) {
  var container = d3.select('body').append('svg');
  container.append('text')
    .attr({ x: -1000, y: -1000 })
    .attr(attrs)
    .text(text);
  var bbox = container.node().getBBox();
  container.remove();

  return { height: bbox.height, width: bbox.width };
};