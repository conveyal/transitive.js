
/**
 * Expose `MultiPoint`
 */

module.exports = MultiPoint;

/**
 * 
 */

function MultiPoint(pointArray) {
  this.points = pointArray;

  this.renderData = [];
}

/**
 * Get id
 */

MultiPoint.prototype.getId = function() {
  return 'multi';
};

/**
 * Get type
 */

MultiPoint.prototype.getType = function() {
  return 'MULTI';
};

/**
 * Get lat
 */

MultiPoint.prototype.getLat = function() {
  return 0;
};


/**
 * Get lon
 */

MultiPoint.prototype.getLon = function() {
  return 0;
};


/**
 * Add render data
 *
 * @param {Object} stopInfo
 */

MultiPoint.prototype.addRenderData = function(pointInfo) {
  this.renderData = [ pointInfo ];
};

/**
 * Draw a multipoint
 *
 * @param {Display} display
 */

MultiPoint.prototype.draw = function(display) {

  if (!this.renderData) return;

  // set up the main svg group for this stop
  this.svgGroup = display.svg.append('g');
    //.attr('id', 'transitive-multipoint-' + this.place_id);

  // set up the markers
  this.marker = this.svgGroup.selectAll('circle')
    .data(this.renderData)
    .enter()
    .append('circle')
    .attr('class', 'transitive-multipoint-circle');

};

/**
 * Refresh the point
 *
 * @param {Display} display
 */

MultiPoint.prototype.refresh = function(display) {
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
};
