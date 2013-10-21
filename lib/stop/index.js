
/**
 * Expose `Stop`
 */

module.exports = Stop;

/**
 * A transit Stop, as defined in the input data.
 * Stops are shared between Patterns.
 *
 * @param {Object}
 */

function Stop(data) {
  for (var key in data) {
    if (key === 'patterns') continue;
    this[key] = data[key];
  }

  this.patterns = [];
}

/**
 * Get id
 */

Stop.prototype.getId = function() {
  return this.stop_id;
};
