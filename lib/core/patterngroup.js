/**
 * Expose `PatternGroup`
 */

module.exports = PatternGroup

/**
 * PatternGroup -- a collection of one or more RoutePatterns associated with
 * a PathSegment
 *
 * @param {Object} RoutePattern data object from the transitive.js input
 */

function PatternGroup () {
  this.patterns = []

  // lookup tables mapping pattern IDs to their from/to indices in the containing PathSegment
  this.fromIndexLookup = {}
  this.toIndexLookup = {}
}

PatternGroup.prototype.addPattern = function (pattern, fromIndex, toIndex) {
  if (this.patterns.indexOf(pattern) === -1) {
    this.patterns.push(pattern)
    this.fromIndexLookup[pattern.pattern_id] = fromIndex
    this.toIndexLookup[pattern.pattern_id] = toIndex
  }
}

PatternGroup.prototype.getFromIndex = function (pattern) {
  return this.fromIndexLookup[pattern.pattern_id]
}

PatternGroup.prototype.getToIndex = function (pattern) {
  return this.toIndexLookup[pattern.pattern_id]
}
