
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

  this.labelAnchor = null;
  this.labelAngle = -45;
  this.labelOffsetX = function() { return  0; };
  this.labelOffsetY = function() { return  0; };

  // flag indicating whether this stop is the endpoint of a pattern
  this.isEndPoint = false;

  // flag indicating whether this stop is a point of convergence/divergence between 2+ patterns
  this.isBranchPoint = false;
}

/**
 * Get id
 */

Stop.prototype.getId = function() {
  return this.stop_id;
};

Stop.prototype.addRenderData = function(stopInfo) {
  this.renderData.push(stopInfo);

  // check if this is the 'topmost' stopInfo item received (based on offsets) for labeling purposes
  if(!this.topAnchor) this.topAnchor = stopInfo;
  else {
    if(stopInfo.offsetY > this.topAnchor.offsetY) {
      this.topAnchor = stopInfo;
    }
  }

  // check if this is the 'bottommost' stopInfo iterm received
  if(!this.bottomAnchor) this.bottomAnchor = stopInfo;
  else {
    if(stopInfo.offsetY < this.bottomAnchor.offsetY) {
      this.bottomAnchor = stopInfo;
    }
  }

  //console.log(stopInfo);
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
  this.mainLabel = this.labels.append('text')
    .data(this.renderData)
    .attr('id', 'transitive-stop-label-' + this.getId())
    .text(this.stop_name.replace('METRO STATION', ''))
    .attr('class', 'transitive-stop-label');

  if(this.labelPosition > 0) { // the 'above' position
    this.mainLabel.attr('text-anchor', 'start');
    this.labelAnchor = this.topAnchor;
    this.labelOffsetY = function(lineWidth) { return 0.7 * lineWidth; };
  }
  else { // the 'below' position
    this.mainLabel.attr('text-anchor', 'end');
    this.labelAnchor = this.bottomAnchor;
    this.labelOffsetX = function(lineWidth) { return 0.4 * lineWidth; };
    this.labelOffsetY = function(lineWidth) { return -lineWidth; };
  }

};


Stop.prototype.refresh = function(display) {
  if(this.renderData.length === 0) return;

  // refresh the pattern-level markers
  this.patternMarkers.data(this.renderData);
  this.patternMarkers.attr('transform', function (d, i) {
    var x = display.xScale(d.x) + d.offsetX;
    var y = display.yScale(d.y) - d.offsetY ;
    return 'translate(' + x +', ' + y +')';
  });

  // refresh the stop-level labels
  this.labels.attr('transform', (function (d, i) {
    var la = this.labelAnchor;
    var x = display.xScale(la.x) + la.offsetX + this.labelOffsetX(la.pattern.lineWidth);
    var y = display.yScale(la.y) - la.offsetY - this.labelOffsetY(la.pattern.lineWidth);
    return 'translate(' + x +', ' + y +')';
  }).bind(this));

  this.mainLabel.attr('transform', (function (d, i) {
    return 'rotate(' + this.labelAngle + ',0,0)';
  }).bind(this));

};
