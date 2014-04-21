var augment = require('augment');

var PointLabel = require('../labeler/pointlabel');


var Point = augment(Object, function () {

  this.constructor = function(data) {
    for (var key in data) {
      this[key] = data[key];
    }

    this.paths = [];
    this.renderData = [];

    this.label = new PointLabel(this);
    this.renderLabel = true;

    this.focused = true;
    this.sortableType = 'POINT';
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

  this.clearRenderData = function() { };

  this.containsFromPoint = function() {
    return false;
  };

  this.containsToPoint = function() {
    return false;
  };

  this.initSvg = function(display) {
    // set up the main svg group for this stop
    this.svgGroup = display.svg.append('g')
      .attr('id', 'transitive-' + this.getType().toLowerCase() + '-' + this.getId())
      //.attr('class', 'transitive-sortable')
      .datum(this);

    this.markerSvg = this.svgGroup.append('g');
    this.labelSvg = this.svgGroup.append('g');
  };

  //** Shared geom utility functions **//

  this.constructMergedCircle = function(display, patternStylerKey) {
    console.log('cmc: '+ this.getName());

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

    var x0, y0, x1, y1, x2, y2, x3, y3, pathStr;
    var dx = maxX - minX;
    var dy = maxY - minY;
    var l = Math.sqrt(dx * dx + dy * dy);
    if(l === 0) {
      x0 = minX + r;
      y0 = minY;
      x1 = minX - r;
      y1 = minY;
      pathStr = 'M ' + x0 + ' ' + y0;
      pathStr += ' A ' + r + ' ' + r + ' 0 0 0 ' + x1 + ' ' + y1;
      pathStr += ' A ' + r + ' ' + r + ' 0 0 0 ' + x0 + ' ' + y0;
      pathStr += ' Z';
      return {
        'd': pathStr
      };
    }

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

    x0 = minX + r * leftVector.x;
    y0 = minY + r * leftVector.y;
    x1 = maxX + r * leftVector.x;
    y1 = maxY + r * leftVector.y;
    x2 = maxX + r * rightVector.x;
    y2 = maxY + r * rightVector.y;
    x3 = minX + r * rightVector.x;
    y3 = minY + r * rightVector.y;

    pathStr = 'M ' + x0 + ' ' + y0;
    pathStr += ' L ' + x1 + ' ' + y1;
    pathStr += ' A ' + r + ' ' + r + ' 0 0 0 ' + x2 + ' ' + y2;
    pathStr += ' L ' + x3 + ' ' + y3;
    pathStr += ' A ' + r + ' ' + r + ' 0 0 0 ' + x0 + ' ' + y0;
    pathStr += ' Z';
    return {
      'd': pathStr
    };
  };

  
  this.refreshLabel = function(display) {

    if(!this.renderLabel) return; //|| !this.labelAnchor) return;
    this.label.refresh(display);
  };


  this.getMarkerBBox = function() {
    //console.log(this.markerSvg.node());
    return this.markerSvg.node().getBBox();
  };


  this.setFocused = function(focused) {
    this.focused = focused;
  };


  this.isFocused = function() {
    return (this.focused === true);
  };


  this.getZIndex = function() {
    return 10000;
  };

});


/**
 * Expose `Point`
 */

module.exports = Point;