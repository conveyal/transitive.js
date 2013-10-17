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
require.register("component-to-function/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `toFunction()`.\n\
 */\n\
\n\
module.exports = toFunction;\n\
\n\
/**\n\
 * Convert `obj` to a `Function`.\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function toFunction(obj) {\n\
  switch ({}.toString.call(obj)) {\n\
    case '[object Object]':\n\
      return objectToFunction(obj);\n\
    case '[object Function]':\n\
      return obj;\n\
    case '[object String]':\n\
      return stringToFunction(obj);\n\
    case '[object RegExp]':\n\
      return regexpToFunction(obj);\n\
    default:\n\
      return defaultToFunction(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Default to strict equality.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function defaultToFunction(val) {\n\
  return function(obj){\n\
    return val === obj;\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert `re` to a function.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function regexpToFunction(re) {\n\
  return function(obj){\n\
    return re.test(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert property `str` to a function.\n\
 *\n\
 * @param {String} str\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function stringToFunction(str) {\n\
  // immediate such as \"> 20\"\n\
  if (/^ *\\W+/.test(str)) return new Function('_', 'return _ ' + str);\n\
\n\
  // properties such as \"name.first\" or \"age > 18\"\n\
  return new Function('_', 'return _.' + str);\n\
}\n\
\n\
/**\n\
 * Convert `object` to a function.\n\
 *\n\
 * @param {Object} object\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function objectToFunction(obj) {\n\
  var match = {}\n\
  for (var key in obj) {\n\
    match[key] = typeof obj[key] === 'string'\n\
      ? defaultToFunction(obj[key])\n\
      : toFunction(obj[key])\n\
  }\n\
  return function(val){\n\
    if (typeof val !== 'object') return false;\n\
    for (var key in match) {\n\
      if (!(key in val)) return false;\n\
      if (!match[key](val[key])) return false;\n\
    }\n\
    return true;\n\
  }\n\
}\n\
//@ sourceURL=component-to-function/index.js"
));
require.register("component-type/index.js", Function("exports, require, module",
"\n\
/**\n\
 * toString ref.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val){\n\
  switch (toString.call(val)) {\n\
    case '[object Function]': return 'function';\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object String]': return 'string';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val && val.nodeType === 1) return 'element';\n\
  if (val === Object(val)) return 'object';\n\
\n\
  return typeof val;\n\
};\n\
//@ sourceURL=component-type/index.js"
));
require.register("component-each/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var toFunction = require('to-function');\n\
var type;\n\
\n\
try {\n\
  type = require('type-component');\n\
} catch (e) {\n\
  type = require('type');\n\
}\n\
\n\
/**\n\
 * HOP reference.\n\
 */\n\
\n\
var has = Object.prototype.hasOwnProperty;\n\
\n\
/**\n\
 * Iterate the given `obj` and invoke `fn(val, i)`.\n\
 *\n\
 * @param {String|Array|Object} obj\n\
 * @param {Function} fn\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn){\n\
  fn = toFunction(fn);\n\
  switch (type(obj)) {\n\
    case 'array':\n\
      return array(obj, fn);\n\
    case 'object':\n\
      if ('number' == typeof obj.length) return array(obj, fn);\n\
      return object(obj, fn);\n\
    case 'string':\n\
      return string(obj, fn);\n\
  }\n\
};\n\
\n\
/**\n\
 * Iterate string chars.\n\
 *\n\
 * @param {String} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function string(obj, fn) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn(obj.charAt(i), i);\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate object keys.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function object(obj, fn) {\n\
  for (var key in obj) {\n\
    if (has.call(obj, key)) {\n\
      fn(key, obj[key]);\n\
    }\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate array-ish.\n\
 *\n\
 * @param {Array|Object} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function array(obj, fn) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn(obj[i], i);\n\
  }\n\
}\n\
//@ sourceURL=component-each/index.js"
));
require.register("styler/computed.js", Function("exports, require, module",
"\n\
/**\n\
 * Computed rules\n\
 */\n\
\n\
module.exports = [];\n\
//@ sourceURL=styler/computed.js"
));
require.register("styler/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Dependencies\n\
 */\n\
\n\
var each = require('each');\n\
\n\
/**\n\
 * List of CSS style rules\n\
 */\n\
\n\
var styles = [\n\
  'color',\n\
  'fill',\n\
  'font',\n\
  'font-family',\n\
  'font-size',\n\
  'stroke',\n\
  'stroke-width'\n\
];\n\
\n\
/**\n\
 * Expose `Styler`\n\
 */\n\
\n\
module.exports = Styler;\n\
\n\
/**\n\
 * Styler object\n\
 */\n\
\n\
function Styler(static, computed) {\n\
  if (!(this instanceof Styler)) {\n\
    return new Styler();\n\
  }\n\
\n\
  this.computed = require('./computed');\n\
  this.static = require('./static');\n\
\n\
  if (static) {\n\
    this.load(static);\n\
  }\n\
\n\
  if (computed) {\n\
    this.computed = this.computed.push(computed);\n\
  }\n\
}\n\
\n\
/**\n\
 * Load a set of rules\n\
 *\n\
 * @param {Object} a set of rules\n\
 */\n\
\n\
Styler.prototype.load = function(set) {\n\
  each(set, function (rules, selector) {\n\
    if (!this.static[selector]) {\n\
      this.static[selector] = rules;\n\
    } else {\n\
      each(rules, function (rule, name) {\n\
        this.static[selector][name] = rule;\n\
      }.bind(this));\n\
    }\n\
  }.bind(this));\n\
};\n\
\n\
/**\n\
 * Render elements against these rules\n\
 *\n\
 * @param {Object} a D3 list of elements\n\
 * @param {Object} the D3 display object\n\
 */\n\
\n\
Styler.prototype.render = function render(el, display) {\n\
  // apply static rules\n\
  each(this.static, function (rules, selector) {\n\
    applyAttrAndStyle(el.svgGroup.selectAll(selector), display, rules);\n\
  });\n\
\n\
  // apply computed rules\n\
  each(this.computed, function (rule) {\n\
    rule(el, display);\n\
  });\n\
};\n\
\n\
/**\n\
 * Check if it's an attribute or a style and apply accordingly\n\
 *\n\
 * @param {Object} a D3 list of elements\n\
 * @param {Object} the D3 display object\n\
 * @param {Object} the rules to apply to the elements\n\
 */\n\
\n\
function applyAttrAndStyle(el, display, rules) {\n\
  for (var name in rules) {\n\
    var type = isStyle(name)\n\
      ? 'style'\n\
      : 'attr';\n\
\n\
    el[type](name, computeRule(rules[name]));\n\
  }\n\
\n\
  function computeRule(rule) {\n\
    return function (data, index) {\n\
      return isFunction(rule)\n\
        ? rule.call(rules, data, display, index)\n\
        : rule;\n\
    };\n\
  }\n\
}\n\
\n\
/**\n\
 * Is function?\n\
 */\n\
\n\
function isFunction(val) {\n\
  return Object.prototype.toString.call(val) === '[object Function]';\n\
}\n\
\n\
/**\n\
 * Is style?\n\
 */\n\
\n\
function isStyle(val) {\n\
  return styles.indexOf(val) !== -1;\n\
}\n\
//@ sourceURL=styler/index.js"
));
require.register("styler/static.js", Function("exports, require, module",
"\n\
/**\n\
 * Default static rules\n\
 */\n\
\n\
module.exports = {\n\
\n\
  /**\n\
   * All stops\n\
   */\n\
\n\
  '.stop-circle': {\n\
    cx: 0,\n\
    cy: 0,\n\
    fill: 'white',\n\
    r: 5,\n\
    stroke: 'none'\n\
  },\n\
\n\
  /**\n\
   * All labels\n\
   */\n\
\n\
  '.stop-label': {\n\
    'font-family': 'sans-serif',\n\
    'font-size': function(data, display, index) {\n\
      if (data.stop.stop_id === 'S3') {\n\
        return '20px';\n\
      } else {\n\
        return '12px';\n\
      }\n\
    },\n\
    transform: function(data, display, index) {\n\
      return 'rotate(-45, ' + this.x + ', ' + this.y + ')';\n\
    },\n\
    visibility: function(data, display, index) {\n\
      if (display.zoom.scale() < 0.75) {\n\
        return 'hidden';\n\
      } else {\n\
        return 'visible';\n\
      }\n\
    },\n\
    x: 0,\n\
    y: -12\n\
  },\n\
\n\
  /**\n\
   * All lines\n\
   */\n\
\n\
  '.line': {\n\
    stroke: 'blue',\n\
    'stroke-width': '15px',\n\
    fill: 'none'\n\
  }\n\
};\n\
//@ sourceURL=styler/static.js"
));
require.register("app/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Dependencies\n\
 */\n\
\n\
var Styler = require('styler');\n\
\n\
/**\n\
 * Expose `Transitive`\n\
 */\n\
\n\
module.exports = Transitive;\n\
\n\
/**\n\
 * Main object\n\
 */\n\
\n\
function Transitive(el, data, staticStyle, computedStyles) {\n\
  if (!(this instanceof Transitive)) {\n\
    return new Transitive();\n\
  }\n\
\n\
  this.el = el;\n\
  this.styler = new Styler(staticStyle, computedStyles);\n\
\n\
  this.load(data);\n\
  this.render();\n\
}\n\
\n\
/**\n\
 * Render\n\
 */\n\
\n\
Transitive.prototype.render = function() {\n\
  // render ?\n\
};\n\
\n\
/**\n\
 * Set element\n\
 */\n\
\n\
Transitive.prototype.setElement = function(el) {\n\
  this.el = el;\n\
  this.render();\n\
};\n\
//@ sourceURL=app/index.js"
));
require.register("transitive/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `app`\n\
 */\n\
\n\
module.exports = require('app');\n\
//@ sourceURL=transitive/index.js"
));


require.alias("app/index.js", "transitive/deps/app/index.js");
require.alias("app/index.js", "app/index.js");
require.alias("styler/computed.js", "app/deps/styler/computed.js");
require.alias("styler/index.js", "app/deps/styler/index.js");
require.alias("styler/static.js", "app/deps/styler/static.js");
require.alias("component-each/index.js", "styler/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("transitive/index.js", "transitive/index.js");if (typeof exports == "object") {
  module.exports = require("transitive");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("transitive"); });
} else {
  this["Transitive"] = require("transitive");
}})();