/**
 * Expose `Journey`
 */

module.exports = Journey;

/**
 * 
 */

function Journey(data) {

  for(var key in data) {
    this[key] = data[key];
  }
  
  this.patterns = [];
}

Journey.prototype.addPattern = function(pattern) {
  this.patterns.push(pattern);
  pattern.journey = this;
};
