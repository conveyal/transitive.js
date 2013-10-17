;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("graph/index.js", function(exports, require, module){

/**
 * Graph
 */

});
require.register("linemap/index.js", function(exports, require, module){

/**
 * Linemap
 */

});
require.register("style/index.js", function(exports, require, module){

/**
 * The list of rules
 */

var rules = {};

/**
 * Expose `load`
 *
 * @param {Object} a set of rules
 */

module.exports.load = function load(r) {
  rules = r;
};

/**
 * Expose `set`
 *
 * @param {Object} a D3 list of elements
 * @param {Object} the D3 display object
 */

module.exports.set = function set(el, display) {
  applyAttrAndStyle(el.svgGroup.selectAll('.stop-circle'), display, rules.stop);
  applyAttrAndStyle(el.svgGroup.selectAll('.stop-label'), display, rules.stopLabel);
  applyAttrAndStyle(el.svgGroup.selectAll('.line'), display, rules.route);
};

/**
 * Check if it's an attribute or a style and apply accordingly
 *
 * @param {Object} a D3 list of elements
 * @param {Object} the D3 display object
 * @param {Object} the rules to apply to the elements
 */

function applyAttrAndStyle(el, display, rules) {
  var name, type;

  for (name in rules) {
    type = isStyle(name)
      ? 'style'
      : 'attr';

    el[type](name, computeRule(rules[name]));
  }

  function computeRule(rule) {
    return function (data, index) {
      return isFunction(rule)
        ? rule.call(rules, data, display, index)
        : rule;
    };
  }
}

/**
 * Is function?
 */

function isFunction(val) {
  return Object.prototype.toString.call(val) === '[object Function]';
}

/**
 * Is style?
 */

function isStyle(val) {
  return [
    'color',
    'fill',
    'font',
    'font-family',
    'font-size',
    'stroke',
    'stroke-width'
  ].indexOf(val) !== -1;
}

});
require.register("transitive/index.js", function(exports, require, module){

/**
 * Dependencies
 */

var graph = require('graph');
var linemap = require('linemap');
var style = require('style');

/**
 * Load the data
 */

module.exports.loadData = function loadData(data) {

};

/**
 * Set the style rules
 */

module.exports.loadRules = function loadRules(rules) {
  style.load(rules);
};

/**
 * Render to an element
 */

module.exports.renderTo = function renderTo(el) {

};

});



require.alias("graph/index.js", "transitive/deps/graph/index.js");
require.alias("graph/index.js", "graph/index.js");

require.alias("linemap/index.js", "transitive/deps/linemap/index.js");
require.alias("linemap/index.js", "linemap/index.js");

require.alias("style/index.js", "transitive/deps/style/index.js");
require.alias("style/index.js", "style/index.js");

require.alias("transitive/index.js", "transitive/index.js");if (typeof exports == "object") {
  module.exports = require("transitive");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("transitive"); });
} else {
  this["transitive"] = require("transitive");
}})();