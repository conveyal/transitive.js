
/**
 * Expose `Stop`
 */

module.exports = Stop;

/**
 *  A transit Stop, as defined in the input data. Stops are shared between Patterns
 */

function Stop(data) {
  for (var name in data) {
    if (name === 'patterns') {
      continue;
    }

    this[name] = data[name];
  }

  this.patterns = [];
}

Stop.prototype.getId = function () {
  return this.stop_id;
};