/**
 * PatternGroup -- a collection of one or more RoutePatterns associated with
 * a PathSegment
 */
export default class PatternGroup {
  constructor() {
    this.patterns = []

    // lookup tables mapping pattern IDs to their from/to indices in the containing PathSegment
    this.fromIndexLookup = {}
    this.toIndexLookup = {}
  }

  addPattern(pattern, fromIndex, toIndex) {
    if (this.patterns.indexOf(pattern) === -1) {
      this.patterns.push(pattern)
      this.fromIndexLookup[pattern.pattern_id] = fromIndex
      this.toIndexLookup[pattern.pattern_id] = toIndex
    }
  }

  getFromIndex(pattern) {
    return this.fromIndexLookup[pattern.pattern_id]
  }

  getToIndex(pattern) {
    return this.toIndexLookup[pattern.pattern_id]
  }
}
