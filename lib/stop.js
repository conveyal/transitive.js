
/**
 * Expose `Stop`
 */

module.exports = Stop;

/**
 * A transit Stop, as defined in the input data.
 * Stops are shared between Patterns.
 *
 * @param {Object}
 */

function Stop(data) {
  for (var key in data) {
    if (key === 'patterns') continue;
    this[key] = data[key];
  }

  this.patterns = [];

  this.renderData = [];
}

/**
 * Get id
 */

Stop.prototype.getId = function() {
  return this.stop_id;
};


Stop.prototype.draw = function(display) {
  if(this.renderData.length === 0) return;

  // set up the main svg group for this stop
  this.svgGroup = display.svg.append('g');

  // set up the pattern-level markers
  this.patternMarkers = this.svgGroup.selectAll('.transitive-stop')
    .data(this.renderData)
    .enter()
    .append('g');

  this.patternMarkers.append('circle')
    .attr('class', 'transitive-stop-circle');


  // set up a group for the stop-level labels
  this.labels = this.svgGroup.append('g');

  // create the main stop label
  this.labels.append('text')
    .attr('id', 'transitive-stop-label-' + this.getId())
    .text(this.stop_name)
    .attr('class', 'transitive-stop-label');
};


Stop.prototype.refresh = function(display) {
  if(this.renderData.length === 0) return;

  // refresh the pattern-level markers
  this.patternMarkers.data(this.renderData);
  this.patternMarkers.attr('transform', function (d, i) {
    var x = display.xScale(d.x) - d.offsetX;
    var y = display.yScale(d.y) + d.offsetY;
    return 'translate(' + x +', ' + y +')';
  });

  // refresh the stop-level labels
  var ld = this.renderData[this.renderData.length-1];
  this.labels.attr('transform', function (d, i) {
    var x = display.xScale(ld.x) - ld.offsetX;
    var y = display.yScale(ld.y) + ld.offsetY;
    return 'translate(' + x +', ' + y +')';
  });

};
