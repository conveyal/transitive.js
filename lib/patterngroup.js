
/**
 * Expose `PatternGroup`
 */

module.exports = PatternGroup;

/**
 * A PatternGroup
 *
 * @param {Object} RoutePattern data object from the transitive.js input
 */

function PatternGroup() {
  this.patterns = [];
}

PatternGroup.prototype.addPattern = function(pattern) {
  if(this.patterns.indexOf(pattern) === -1) this.patterns.push(pattern);
};