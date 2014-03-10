var augment = require('augment');


var Stop = augment(Object, function () {

  this.constructor = function(data) {
    for (var key in data) {
      this[key] = data[key];
    }

    this.paths = [];
    this.renderData = [];

    this.labelAnchor = null;
    this.labelAngle = 0;
    this.labelOffsetX = function() { return  0; };
    this.labelOffsetY = function() { return  0; };
    this.labelPosition = 1;
  };


  /**
   * Get unique ID for point -- must be defined by subclass
   */

  this.getId = function() { };

  this.getElementId = function() {
    return this.getType().toLowerCase() + '-' + this.getId();
  };


  /**
   * Get Point type -- must be defined by subclass
   */

  this.getType = function() { };


  /**
   * Get Point name
   */

  this.getName = function() {
    return this.getType() + ' point (ID=' + this.getId() + ')';
  };


  /**
   * Get latitude
   */

  this.getLat = function() {
    return 0;
  };


  /**
   * Get longitude
   */

  this.getLon = function() {
    return 0;
  };


  /**
   * Draw the point
   *
   * @param {Display} display
   */

  this.draw = function(display) { };


  /**
   * Refresh a previously drawn point
   *
   * @param {Display} display
   */

  this.refresh = function(display) { };


  //** Shared geom utility functions **//

  this.constructMergedCircle = function(display, patternStylerKey) {

    var debug = (this.getId() === '5742');
    var dataArray = this.getRenderDataArray();

    var xValues = [], yValues = [];
    dataArray.forEach(function(data) {
      var x = display.xScale(data.x) + data.offsetX;
      var y = display.yScale(data.y) - data.offsetY;
      //if(debug) console.log(x + ', ' + y);
      xValues.push(x);
      yValues.push(y);
    });
    var minX = Math.min.apply(Math, xValues), minY = Math.min.apply(Math, yValues);
    var maxX = Math.max.apply(Math, xValues), maxY = Math.max.apply(Math, yValues);
    var baseRadius = Math.max( (maxX - minX), (maxY - minY) ) / 2;

    var patternRadius = display.styler.compute(display.styler[patternStylerKey].r, display, { 'point': this });
    var padding = parseFloat(patternRadius);//.substring(0, patternRadius.length - 2), 10) - 2;

    return {
      'cx': (minX+maxX)/2,
      'cy': (minY+maxY)/2,
      'r': baseRadius + padding
    };
  };

  this.constructMergedPolygon = function(display, patternStylerKey) {

    var dataArray = this.getRenderDataArray();

    var xValues = [], yValues = [];
    dataArray.forEach(function(data) {
      var x = display.xScale(data.x) + data.offsetX;
      var y = display.yScale(data.y) - data.offsetY;
      xValues.push(x);
      yValues.push(y);
    });
    var minX = Math.min.apply(Math, xValues), minY = Math.min.apply(Math, yValues);
    var maxX = Math.max.apply(Math, xValues), maxY = Math.max.apply(Math, yValues);

    var patternRadius = display.styler.compute(display.styler[patternStylerKey].r, display, { 'point': this });
    var r = parseFloat(patternRadius); //.substring(0, patternRadius.length - 2), 10) - 2;
    //r = r * 2;

    var dx = maxX - minX;
    var dy = maxY - minY;
    var l = Math.sqrt(dx * dx + dy * dy);

    var vector = {
      x: dx / l,
      y: dy / l
    };

    var leftVector = {
      x : -vector.y,
      y : vector.x
    };

    var rightVector = {
      x : vector.y,
      y : -vector.x
    };

    var x0 = minX + r * leftVector.x, y0 = minY + r * leftVector.y;
    var x1 = maxX + r * leftVector.x, y1 = maxY + r * leftVector.y;
    var x2 = maxX + r * rightVector.x, y2 = maxY + r * rightVector.y;
    var x3 = minX + r * rightVector.x, y3 = minY + r * rightVector.y;

    var pathStr = 'M ' + x0 + ' ' + y0;
    pathStr += ' L ' + x1 + ' ' + y1;
    pathStr += ' A ' + r + ' ' + r + ' 0 0 0 ' + x2 + ' ' + y2;
    pathStr += ' L ' + x3 + ' ' + y3;
    pathStr += ' A ' + r + ' ' + r + ' 0 0 0 ' + x0 + ' ' + y0;
    pathStr += ' Z';
    return {
      'd': pathStr
    };
  };

  this.initLabels = function() {

    // set up a group for the stop-level labels
    this.labels = this.svgGroup.append('g');

    var typeStr = this.getType().toLowerCase();

    this.mainLabel = this.labels.append('text')
      .datum({ point: this })
      .attr('id', 'transitive-' + typeStr + '-label-' + this.getId())
      .text(this.getName().replace('METRO STATION', ''))
      .attr('class', 'transitive-' + typeStr + '-label')
      .attr('text-anchor', this.labelPosition > 0 ? 'start' : 'end')
      .attr('transform', (function (d, i) {
        return 'rotate(' + this.labelAngle + ', 0, 0)';
      }).bind(this));
  };

  this.refreshLabels = function(display, cx, cy) {
    this.labels.attr('transform', (function (d, i) {
      var la = this.labelAnchor;
      var x = display.xScale(cx) + (la ? la.offsetX : 0);
      var y = display.yScale(cy) - (la ? la.offsetY : 0);
      if(la) {
        this.lastX = la.x;
        this.lastY = la.y;
      }
      return 'translate(' + x +',' + y +')';
    }).bind(this));
  };

  this.updateLabelPosition = function(labelAngle, labelPosition) {
    this.labelAngle = labelAngle;
    this.labelPosition = labelPosition;

    if(this.mainLabel) {
      this.mainLabel
        .attr('text-anchor', this.labelPosition > 0 ? 'start' : 'end')
        .attr('transform', (function (d, i) {
          return 'rotate(' + this.labelAngle + ', 0, 0)';
        }).bind(this));
    }
  };

});


/**
 * Expose `Stop`
 */

module.exports = Stop;