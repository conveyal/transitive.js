/**
 * Dependencies
 */

var augment = require('augment');
var each = require('each');

var Point = require('./index');
var Util = require('../util');

var SphericalMercator = require('../util/spherical-mercator');
var sm = new SphericalMercator();

var debug = require('debug')('transitive:point');

/**
 *
 */

var TurnPoint = augment(Point, function(base) {

  this.constructor = function(data, id) {
    base.constructor.call(this, data);
    this.name = 'Turn @ ' + data.lat + ', ' + data.lon;
    if(!this.worldX || !this.worldY) {
      var smCoords = sm.forward([data.lon, data.lat]);
      this.worldX = smCoords[0];
      this.worldY = smCoords[1];
      this.isSegmentEndPoint = false;
    }
    this.id = id;
  };

  this.getId = function() {
    return this.id;
  };

  this.getType = function() {
    return 'TURN';
  };

  this.getName = function() {
    return this.name;
  };

  this.containsSegmentEndPoint = function() {
    return this.isSegmentEndPoint;
  };
});

/**
 * Expose `TurnPoint`
 */

module.exports = TurnPoint;
