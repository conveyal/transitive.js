
/**
 * Dependencies
 */

var d3 = require('d3');

/**
 * Expose `Place`
 */

module.exports = Place;

/**
 * 
 */

function Place(data) {
  for (var key in data) {
    this[key] = data[key];
  }

  this.paths = [];

  this.labelAngle = 0;
}

Place.prototype.getType = function() {
  return 'PLACE';
};


/**
 * Get ID
 */

Place.prototype.getId = function() {
  return this.place_id;
};


/**
 * Get lat
 */

Place.prototype.getLat = function() {
  return this.place_lat;
};


/**
 * Get lon
 */

Place.prototype.getLon = function() {
  return this.place_lon;
};

Place.prototype.addRenderData = function(pointInfo) {
  this.renderData = [ pointInfo ];
};


/**
 * Draw a place
 *
 * @param {Display} display
 */

Place.prototype.draw = function(display) {
  if (!this.renderData) return;

  // set up the main svg group for this stop
  this.svgGroup = display.svg.append('g')
    .attr('id', 'transitive-place-' + this.place_id);

  // set up the markers
  this.marker = this.svgGroup.selectAll('circle')
    .data(this.renderData)
    .enter()
    .append('circle')
    .attr('class', 'transitive-place-circle');


  // create the label
  this.mainLabel = this.svgGroup.append('text')
    .data(this.renderData)
    .attr('id', 'transitive-place-label-' + this.place_id)
    .text(this.place_name)
    .attr('class', 'transitive-place-label')
    //.attr('text-anchor', textAnchor)
    .attr('transform', (function (d, i) {
      return 'rotate(' + this.labelAngle + ', 0, 0)';
    }).bind(this));

};

/**
 * Refresh the place
 *
 * @param {Display} display
 */

Place.prototype.refresh = function(display) {
  if (!this.renderData) return;

  var cx, cy;
  // refresh the pattern-level markers
  this.marker.data(this.renderData);
  this.marker.attr('transform', function (d, i) {
    cx = d.x;
    cy = d.y;
    var x = display.xScale(d.x) + d.offsetX;
    var y = display.yScale(d.y) - d.offsetY;
    return 'translate(' + x +', ' + y +')';
  });


  // refresh the label
  this.mainLabel.attr('transform', (function (d, i) {
    var x = display.xScale(cx);
    var y = display.yScale(cy);
    return 'translate(' + x +',' + y +')';
  }).bind(this));

};
