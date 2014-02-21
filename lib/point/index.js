var augment = require('augment');


var Stop = augment(Object, function () {

  this.constructor = function(data) {
    for (var key in data) {
      this[key] = data[key];
    }

    this.paths = [];
    this.renderData = [];
    this.labelAngle = 0;
  };


  /**
   * Get unique ID for point -- must be defined by subclass
   */

  this.getId = function() { };


  /**
   * Get Point type -- must be defined by subclass
   */

  this.getType = function() { };


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

});


/**
 * Expose `Stop`
 */

module.exports = Stop;