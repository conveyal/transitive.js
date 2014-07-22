/**
 * Dependencies
 */

var augment = require('augment');
var each = require('each');

var Point = require('./index');
var Util = require('../util');

var SphericalMercator = require('../spherical-mercator');
var sm = new SphericalMercator();

var debug = require('debug')('transitive:point');


/**
 *  
 */

var TurnPoint = augment(Point, function(base) {

  this.constructor = function(data) {
    base.constructor.call(this, data);
    var smCoords = sm.forward([data.lon, data.lat]);
    this.worldX = smCoords[0];
    this.worldY = smCoords[1];
  };

  this.getType = function() {
    return 'TURN';
  };

});


/**
 * Expose `TurnPoint`
 */

module.exports = TurnPoint;
