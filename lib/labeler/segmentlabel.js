
/**
 * Dependencies
 */

var augment = require('augment');

var Label = require('./label');


/**
 * SegmentLabel object
 */

var SegmentLabel = augment(Label, function(base) {

  this.constructor = function(parent) {

    base.constructor.call(this, parent);

  };


  this.initText = function() {
    return this.parent.pattern.route.route_short_name;
  };


  this.render = function() {
    this.svgGroup = this.parent.labelSvg.append('g')
      .attr('class', 'transitive-sortable')
      .datum(this);

    var typeStr = this.parent.getType().toLowerCase();

    var padding = this.textHeight * 0.1;

    this.containerWidth = this.textWidth + padding * 2;
    this.containerHeight = this.textHeight;

    this.containerSvg = this.svgGroup.append('rect')
      .datum({ segment: this.parent })
      .attr({
        width: this.containerWidth,
        height: this.containerHeight
      })
      .attr('id', 'transitive-segment-label-container-' + this.parent.getId())
      .text(this.getText())
      .attr('class', 'transitive-segment-label-container');


    this.textSvg = this.svgGroup.append('text')
      .datum({ segment: this.parent })
      .attr('id', 'transitive-segment-label-' + this.parent.getId())
      .text(this.getText())
      .attr('class', 'transitive-segment-label')
      .attr('transform', (function (d, i) {
        return 'translate(' + padding + ', ' + (this.textHeight - padding * 2) + ')';
      }).bind(this));

  };


  this.refresh = function() {
    if(!this.labelAnchor) return;

    if(!this.svgGroup) this.render();

    this.svgGroup
      .attr('transform', (function (d, i) {
        var tx = (this.labelAnchor.x - this.containerWidth / 2);
        var ty = (this.labelAnchor.y - this.containerHeight / 2);
        return 'translate(' + tx + ',' + ty + ')';
      }).bind(this));
  };


  this.getBBox = function() {
    return {
      x : this.labelAnchor.x - this.containerWidth / 2,
      y : this.labelAnchor.y - this.containerHeight / 2,
      width : this.containerWidth,
      height : this.containerHeight
    };
  };


  this.intersects = function(obj) {
    if(obj instanceof Label) {
      // todo: handle label-label intersection for diagonally placed labels separately
      return this.intersectsBBox(obj.getBBox());
    }
    else if(obj.x && obj.y && obj.width && obj.height) {
      return this.intersectsBBox(obj);
    }

    return false;
  };


});


/**
 * Expose `SegmentLabel`
 */

module.exports = SegmentLabel;