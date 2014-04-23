/**
 * Expose `TransitiveLoader`
 */

module.exports = ProfilerLoader;

/**
 *
 */

function ProfilerLoader(profiler, od, callback) {

  this.callback = callback;
  this.profiler = profiler;

  this.routes = {};
  
  this.opts = {
    from: od.from,
    to: od.to
  };

  profiler.profile(od, (function(err, profile) {

    console.log(profile);
    this.opts.profile = profile;
    this.opts.limit = profile.options.length;
    this.loadRoutes();

  }).bind(this));

}


ProfilerLoader.prototype.loadRoutes = function(profileResponse) {

  this.profiler.routes((function(err, routes) {

    routes.forEach(function(route) {
      this.routes[route.id] = route;
    }, this);

    this.loadPatterns();

  }).bind(this));

};


ProfilerLoader.prototype.loadPatterns = function(profileResponse) {

  this.profiler.patterns(this.opts, (function(err, patterns) {
    this.opts.patterns = patterns;

    this.opts.routes = [];
    patterns.forEach(function(pattern) {
      var route = this.routes[pattern.routeId];
      if(this.opts.routes.indexOf(route) === -1) {
        this.opts.routes.push(route);
      }
    }, this);

    this.constructData();

  }).bind(this));

};


ProfilerLoader.prototype.constructData = function() {

  var data = this.profiler.convertOtpData(this.opts);
  this.callback.call(this, data);

};

