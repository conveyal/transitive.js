
/**
 * Dependencies
 */

var augment = require('augment');


/**
 * Label object
 */

var Label = augment(Object, function () {

  this.constructor = function(parent) {
    this.parent = parent;
    this.sortableType = 'LABEL';
  };


  this.getText = function() {
    if(!this.labelText) this.labelText = this.initText();
    return this.labelText;
  };


  this.initText = function() {
    return this.parent.getName();
  };


  this.render = function() {
  };


  this.refresh = function() {
  };


  this.setVisibility = function(visibility) {
    if(this.svgGroup) this.svgGroup.attr('visibility', visibility ? 'visible' : 'hidden');
  };


  this.getBBox = function() {
    return null;
  };


  this.intersects = function(obj) {
    return null;
  };


  this.intersectsBBox = function(bbox) {
    var thisBBox = this.getBBox(this.orientation);
    var r = (thisBBox.x <= bbox.x + bbox.width &&
            bbox.x <= thisBBox.x + thisBBox.width &&
            thisBBox.y <= bbox.y + bbox.height &&
            bbox.y <= thisBBox.y + thisBBox.height);
    return r;
  };


  this.isFocused = function() {
    return this.parent.isFocused();
  };


  this.getZIndex = function() {
    return 20000;
  };

});


/**
 * Expose `Label`
 */

module.exports = Label;