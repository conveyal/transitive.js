
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
require.register("component-set/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Set`.\n\
 */\n\
\n\
module.exports = Set;\n\
\n\
/**\n\
 * Initialize a new `Set` with optional `vals`\n\
 *\n\
 * @param {Array} vals\n\
 * @api public\n\
 */\n\
\n\
function Set(vals) {\n\
  if (!(this instanceof Set)) return new Set(vals);\n\
  this.vals = [];\n\
  if (vals) {\n\
    for (var i = 0; i < vals.length; ++i) {\n\
      this.add(vals[i]);\n\
    }\n\
  }\n\
}\n\
\n\
/**\n\
 * Add `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @api public\n\
 */\n\
\n\
Set.prototype.add = function(val){\n\
  if (this.has(val)) return;\n\
  this.vals.push(val);\n\
};\n\
\n\
/**\n\
 * Check if this set has `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Set.prototype.has = function(val){\n\
  return !! ~this.indexOf(val);\n\
};\n\
\n\
/**\n\
 * Return the indexof `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Number}\n\
 * @api private\n\
 */\n\
\n\
Set.prototype.indexOf = function(val){\n\
  for (var i = 0, len = this.vals.length; i < len; ++i) {\n\
    var obj = this.vals[i];\n\
    if (obj.equals && obj.equals(val)) return i;\n\
    if (obj == val) return i;\n\
  }\n\
  return -1;\n\
};\n\
\n\
/**\n\
 * Iterate each member and invoke `fn(val)`.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Set}\n\
 * @api public\n\
 */\n\
\n\
Set.prototype.each = function(fn){\n\
  for (var i = 0; i < this.vals.length; ++i) {\n\
    fn(this.vals[i]);\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return the values as an array.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Set.prototype.values =\n\
Set.prototype.array =\n\
Set.prototype.members =\n\
Set.prototype.toJSON = function(){\n\
  return this.vals;\n\
};\n\
\n\
/**\n\
 * Return the set size.\n\
 *\n\
 * @return {Number}\n\
 * @api public\n\
 */\n\
\n\
Set.prototype.size = function(){\n\
  return this.vals.length;\n\
};\n\
\n\
/**\n\
 * Empty the set and return old values.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Set.prototype.clear = function(){\n\
  var old = this.vals;\n\
  this.vals = [];\n\
  return old;\n\
};\n\
\n\
/**\n\
 * Remove `val`, returning __true__ when present, otherwise __false__.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Mixed}\n\
 * @api public\n\
 */\n\
\n\
Set.prototype.remove = function(val){\n\
  var i = this.indexOf(val);\n\
  if (~i) this.vals.splice(i, 1);\n\
  return !! ~i;\n\
};\n\
\n\
/**\n\
 * Perform a union on `set`.\n\
 *\n\
 * @param {Set} set\n\
 * @return {Set} new set\n\
 * @api public\n\
 */\n\
\n\
Set.prototype.union = function(set){\n\
  var ret = new Set;\n\
  var a = this.vals;\n\
  var b = set.vals;\n\
  for (var i = 0; i < a.length; ++i) ret.add(a[i]);\n\
  for (var i = 0; i < b.length; ++i) ret.add(b[i]);\n\
  return ret;\n\
};\n\
\n\
/**\n\
 * Perform an intersection on `set`.\n\
 *\n\
 * @param {Set} set\n\
 * @return {Set} new set\n\
 * @api public\n\
 */\n\
\n\
Set.prototype.intersect = function(set){\n\
  var ret = new Set;\n\
  var a = this.vals;\n\
  var b = set.vals;\n\
\n\
  for (var i = 0; i < a.length; ++i) {\n\
    if (set.has(a[i])) {\n\
      ret.add(a[i]);\n\
    }\n\
  }\n\
\n\
  for (var i = 0; i < b.length; ++i) {\n\
    if (this.has(b[i])) {\n\
      ret.add(b[i]);\n\
    }\n\
  }\n\
\n\
  return ret;\n\
};\n\
\n\
/**\n\
 * Check if the set is empty.\n\
 *\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Set.prototype.isEmpty = function(){\n\
  return 0 == this.vals.length;\n\
};\n\
\n\
//@ sourceURL=component-set/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("cristiandouce-merge-util/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var has = Object.prototype.hasOwnProperty;\n\
\n\
try {\n\
  var type = require('type-component');\n\
} catch (err) {\n\
  var type = require('type');\n\
}\n\
\n\
/**\n\
 * Expose merge\n\
 */\n\
\n\
module.exports = merge;\n\
\n\
/**\n\
 * Merge `b` into `a`.\n\
 *\n\
 * @param {Object} a\n\
 * @param {Object} b\n\
 * @return {Object} a\n\
 * @api public\n\
 */\n\
\n\
function merge (a, b){\n\
  for (var key in b) {\n\
    if (has.call(b, key) && b[key] != null) {\n\
      if (!a) a = {};\n\
      if ('object' === type(b[key])) {\n\
        a[key] = merge(a[key], b[key]);\n\
      } else {\n\
        a[key] = b[key];\n\
      }\n\
    }\n\
  }\n\
  return a;\n\
};//@ sourceURL=cristiandouce-merge-util/index.js"
));
require.register("mbostock-d3/d3.js", Function("exports, require, module",
"d3 = function() {\n\
  var d3 = {\n\
    version: \"3.3.11\"\n\
  };\n\
  if (!Date.now) Date.now = function() {\n\
    return +new Date();\n\
  };\n\
  var d3_arraySlice = [].slice, d3_array = function(list) {\n\
    return d3_arraySlice.call(list);\n\
  };\n\
  var d3_document = document, d3_documentElement = d3_document.documentElement, d3_window = window;\n\
  try {\n\
    d3_array(d3_documentElement.childNodes)[0].nodeType;\n\
  } catch (e) {\n\
    d3_array = function(list) {\n\
      var i = list.length, array = new Array(i);\n\
      while (i--) array[i] = list[i];\n\
      return array;\n\
    };\n\
  }\n\
  try {\n\
    d3_document.createElement(\"div\").style.setProperty(\"opacity\", 0, \"\");\n\
  } catch (error) {\n\
    var d3_element_prototype = d3_window.Element.prototype, d3_element_setAttribute = d3_element_prototype.setAttribute, d3_element_setAttributeNS = d3_element_prototype.setAttributeNS, d3_style_prototype = d3_window.CSSStyleDeclaration.prototype, d3_style_setProperty = d3_style_prototype.setProperty;\n\
    d3_element_prototype.setAttribute = function(name, value) {\n\
      d3_element_setAttribute.call(this, name, value + \"\");\n\
    };\n\
    d3_element_prototype.setAttributeNS = function(space, local, value) {\n\
      d3_element_setAttributeNS.call(this, space, local, value + \"\");\n\
    };\n\
    d3_style_prototype.setProperty = function(name, value, priority) {\n\
      d3_style_setProperty.call(this, name, value + \"\", priority);\n\
    };\n\
  }\n\
  d3.ascending = function(a, b) {\n\
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;\n\
  };\n\
  d3.descending = function(a, b) {\n\
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;\n\
  };\n\
  d3.min = function(array, f) {\n\
    var i = -1, n = array.length, a, b;\n\
    if (arguments.length === 1) {\n\
      while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;\n\
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;\n\
    } else {\n\
      while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;\n\
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;\n\
    }\n\
    return a;\n\
  };\n\
  d3.max = function(array, f) {\n\
    var i = -1, n = array.length, a, b;\n\
    if (arguments.length === 1) {\n\
      while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;\n\
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;\n\
    } else {\n\
      while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;\n\
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;\n\
    }\n\
    return a;\n\
  };\n\
  d3.extent = function(array, f) {\n\
    var i = -1, n = array.length, a, b, c;\n\
    if (arguments.length === 1) {\n\
      while (++i < n && !((a = c = array[i]) != null && a <= a)) a = c = undefined;\n\
      while (++i < n) if ((b = array[i]) != null) {\n\
        if (a > b) a = b;\n\
        if (c < b) c = b;\n\
      }\n\
    } else {\n\
      while (++i < n && !((a = c = f.call(array, array[i], i)) != null && a <= a)) a = undefined;\n\
      while (++i < n) if ((b = f.call(array, array[i], i)) != null) {\n\
        if (a > b) a = b;\n\
        if (c < b) c = b;\n\
      }\n\
    }\n\
    return [ a, c ];\n\
  };\n\
  d3.sum = function(array, f) {\n\
    var s = 0, n = array.length, a, i = -1;\n\
    if (arguments.length === 1) {\n\
      while (++i < n) if (!isNaN(a = +array[i])) s += a;\n\
    } else {\n\
      while (++i < n) if (!isNaN(a = +f.call(array, array[i], i))) s += a;\n\
    }\n\
    return s;\n\
  };\n\
  function d3_number(x) {\n\
    return x != null && !isNaN(x);\n\
  }\n\
  d3.mean = function(array, f) {\n\
    var n = array.length, a, m = 0, i = -1, j = 0;\n\
    if (arguments.length === 1) {\n\
      while (++i < n) if (d3_number(a = array[i])) m += (a - m) / ++j;\n\
    } else {\n\
      while (++i < n) if (d3_number(a = f.call(array, array[i], i))) m += (a - m) / ++j;\n\
    }\n\
    return j ? m : undefined;\n\
  };\n\
  d3.quantile = function(values, p) {\n\
    var H = (values.length - 1) * p + 1, h = Math.floor(H), v = +values[h - 1], e = H - h;\n\
    return e ? v + e * (values[h] - v) : v;\n\
  };\n\
  d3.median = function(array, f) {\n\
    if (arguments.length > 1) array = array.map(f);\n\
    array = array.filter(d3_number);\n\
    return array.length ? d3.quantile(array.sort(d3.ascending), .5) : undefined;\n\
  };\n\
  d3.bisector = function(f) {\n\
    return {\n\
      left: function(a, x, lo, hi) {\n\
        if (arguments.length < 3) lo = 0;\n\
        if (arguments.length < 4) hi = a.length;\n\
        while (lo < hi) {\n\
          var mid = lo + hi >>> 1;\n\
          if (f.call(a, a[mid], mid) < x) lo = mid + 1; else hi = mid;\n\
        }\n\
        return lo;\n\
      },\n\
      right: function(a, x, lo, hi) {\n\
        if (arguments.length < 3) lo = 0;\n\
        if (arguments.length < 4) hi = a.length;\n\
        while (lo < hi) {\n\
          var mid = lo + hi >>> 1;\n\
          if (x < f.call(a, a[mid], mid)) hi = mid; else lo = mid + 1;\n\
        }\n\
        return lo;\n\
      }\n\
    };\n\
  };\n\
  var d3_bisector = d3.bisector(function(d) {\n\
    return d;\n\
  });\n\
  d3.bisectLeft = d3_bisector.left;\n\
  d3.bisect = d3.bisectRight = d3_bisector.right;\n\
  d3.shuffle = function(array) {\n\
    var m = array.length, t, i;\n\
    while (m) {\n\
      i = Math.random() * m-- | 0;\n\
      t = array[m], array[m] = array[i], array[i] = t;\n\
    }\n\
    return array;\n\
  };\n\
  d3.permute = function(array, indexes) {\n\
    var i = indexes.length, permutes = new Array(i);\n\
    while (i--) permutes[i] = array[indexes[i]];\n\
    return permutes;\n\
  };\n\
  d3.pairs = function(array) {\n\
    var i = 0, n = array.length - 1, p0, p1 = array[0], pairs = new Array(n < 0 ? 0 : n);\n\
    while (i < n) pairs[i] = [ p0 = p1, p1 = array[++i] ];\n\
    return pairs;\n\
  };\n\
  d3.zip = function() {\n\
    if (!(n = arguments.length)) return [];\n\
    for (var i = -1, m = d3.min(arguments, d3_zipLength), zips = new Array(m); ++i < m; ) {\n\
      for (var j = -1, n, zip = zips[i] = new Array(n); ++j < n; ) {\n\
        zip[j] = arguments[j][i];\n\
      }\n\
    }\n\
    return zips;\n\
  };\n\
  function d3_zipLength(d) {\n\
    return d.length;\n\
  }\n\
  d3.transpose = function(matrix) {\n\
    return d3.zip.apply(d3, matrix);\n\
  };\n\
  d3.keys = function(map) {\n\
    var keys = [];\n\
    for (var key in map) keys.push(key);\n\
    return keys;\n\
  };\n\
  d3.values = function(map) {\n\
    var values = [];\n\
    for (var key in map) values.push(map[key]);\n\
    return values;\n\
  };\n\
  d3.entries = function(map) {\n\
    var entries = [];\n\
    for (var key in map) entries.push({\n\
      key: key,\n\
      value: map[key]\n\
    });\n\
    return entries;\n\
  };\n\
  d3.merge = function(arrays) {\n\
    var n = arrays.length, m, i = -1, j = 0, merged, array;\n\
    while (++i < n) j += arrays[i].length;\n\
    merged = new Array(j);\n\
    while (--n >= 0) {\n\
      array = arrays[n];\n\
      m = array.length;\n\
      while (--m >= 0) {\n\
        merged[--j] = array[m];\n\
      }\n\
    }\n\
    return merged;\n\
  };\n\
  var abs = Math.abs;\n\
  d3.range = function(start, stop, step) {\n\
    if (arguments.length < 3) {\n\
      step = 1;\n\
      if (arguments.length < 2) {\n\
        stop = start;\n\
        start = 0;\n\
      }\n\
    }\n\
    if ((stop - start) / step === Infinity) throw new Error(\"infinite range\");\n\
    var range = [], k = d3_range_integerScale(abs(step)), i = -1, j;\n\
    start *= k, stop *= k, step *= k;\n\
    if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k); else while ((j = start + step * ++i) < stop) range.push(j / k);\n\
    return range;\n\
  };\n\
  function d3_range_integerScale(x) {\n\
    var k = 1;\n\
    while (x * k % 1) k *= 10;\n\
    return k;\n\
  }\n\
  function d3_class(ctor, properties) {\n\
    try {\n\
      for (var key in properties) {\n\
        Object.defineProperty(ctor.prototype, key, {\n\
          value: properties[key],\n\
          enumerable: false\n\
        });\n\
      }\n\
    } catch (e) {\n\
      ctor.prototype = properties;\n\
    }\n\
  }\n\
  d3.map = function(object) {\n\
    var map = new d3_Map();\n\
    if (object instanceof d3_Map) object.forEach(function(key, value) {\n\
      map.set(key, value);\n\
    }); else for (var key in object) map.set(key, object[key]);\n\
    return map;\n\
  };\n\
  function d3_Map() {}\n\
  d3_class(d3_Map, {\n\
    has: function(key) {\n\
      return d3_map_prefix + key in this;\n\
    },\n\
    get: function(key) {\n\
      return this[d3_map_prefix + key];\n\
    },\n\
    set: function(key, value) {\n\
      return this[d3_map_prefix + key] = value;\n\
    },\n\
    remove: function(key) {\n\
      key = d3_map_prefix + key;\n\
      return key in this && delete this[key];\n\
    },\n\
    keys: function() {\n\
      var keys = [];\n\
      this.forEach(function(key) {\n\
        keys.push(key);\n\
      });\n\
      return keys;\n\
    },\n\
    values: function() {\n\
      var values = [];\n\
      this.forEach(function(key, value) {\n\
        values.push(value);\n\
      });\n\
      return values;\n\
    },\n\
    entries: function() {\n\
      var entries = [];\n\
      this.forEach(function(key, value) {\n\
        entries.push({\n\
          key: key,\n\
          value: value\n\
        });\n\
      });\n\
      return entries;\n\
    },\n\
    forEach: function(f) {\n\
      for (var key in this) {\n\
        if (key.charCodeAt(0) === d3_map_prefixCode) {\n\
          f.call(this, key.substring(1), this[key]);\n\
        }\n\
      }\n\
    }\n\
  });\n\
  var d3_map_prefix = \"\\x00\", d3_map_prefixCode = d3_map_prefix.charCodeAt(0);\n\
  d3.nest = function() {\n\
    var nest = {}, keys = [], sortKeys = [], sortValues, rollup;\n\
    function map(mapType, array, depth) {\n\
      if (depth >= keys.length) return rollup ? rollup.call(nest, array) : sortValues ? array.sort(sortValues) : array;\n\
      var i = -1, n = array.length, key = keys[depth++], keyValue, object, setter, valuesByKey = new d3_Map(), values;\n\
      while (++i < n) {\n\
        if (values = valuesByKey.get(keyValue = key(object = array[i]))) {\n\
          values.push(object);\n\
        } else {\n\
          valuesByKey.set(keyValue, [ object ]);\n\
        }\n\
      }\n\
      if (mapType) {\n\
        object = mapType();\n\
        setter = function(keyValue, values) {\n\
          object.set(keyValue, map(mapType, values, depth));\n\
        };\n\
      } else {\n\
        object = {};\n\
        setter = function(keyValue, values) {\n\
          object[keyValue] = map(mapType, values, depth);\n\
        };\n\
      }\n\
      valuesByKey.forEach(setter);\n\
      return object;\n\
    }\n\
    function entries(map, depth) {\n\
      if (depth >= keys.length) return map;\n\
      var array = [], sortKey = sortKeys[depth++];\n\
      map.forEach(function(key, keyMap) {\n\
        array.push({\n\
          key: key,\n\
          values: entries(keyMap, depth)\n\
        });\n\
      });\n\
      return sortKey ? array.sort(function(a, b) {\n\
        return sortKey(a.key, b.key);\n\
      }) : array;\n\
    }\n\
    nest.map = function(array, mapType) {\n\
      return map(mapType, array, 0);\n\
    };\n\
    nest.entries = function(array) {\n\
      return entries(map(d3.map, array, 0), 0);\n\
    };\n\
    nest.key = function(d) {\n\
      keys.push(d);\n\
      return nest;\n\
    };\n\
    nest.sortKeys = function(order) {\n\
      sortKeys[keys.length - 1] = order;\n\
      return nest;\n\
    };\n\
    nest.sortValues = function(order) {\n\
      sortValues = order;\n\
      return nest;\n\
    };\n\
    nest.rollup = function(f) {\n\
      rollup = f;\n\
      return nest;\n\
    };\n\
    return nest;\n\
  };\n\
  d3.set = function(array) {\n\
    var set = new d3_Set();\n\
    if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);\n\
    return set;\n\
  };\n\
  function d3_Set() {}\n\
  d3_class(d3_Set, {\n\
    has: function(value) {\n\
      return d3_map_prefix + value in this;\n\
    },\n\
    add: function(value) {\n\
      this[d3_map_prefix + value] = true;\n\
      return value;\n\
    },\n\
    remove: function(value) {\n\
      value = d3_map_prefix + value;\n\
      return value in this && delete this[value];\n\
    },\n\
    values: function() {\n\
      var values = [];\n\
      this.forEach(function(value) {\n\
        values.push(value);\n\
      });\n\
      return values;\n\
    },\n\
    forEach: function(f) {\n\
      for (var value in this) {\n\
        if (value.charCodeAt(0) === d3_map_prefixCode) {\n\
          f.call(this, value.substring(1));\n\
        }\n\
      }\n\
    }\n\
  });\n\
  d3.behavior = {};\n\
  d3.rebind = function(target, source) {\n\
    var i = 1, n = arguments.length, method;\n\
    while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);\n\
    return target;\n\
  };\n\
  function d3_rebind(target, source, method) {\n\
    return function() {\n\
      var value = method.apply(source, arguments);\n\
      return value === source ? target : value;\n\
    };\n\
  }\n\
  function d3_vendorSymbol(object, name) {\n\
    if (name in object) return name;\n\
    name = name.charAt(0).toUpperCase() + name.substring(1);\n\
    for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {\n\
      var prefixName = d3_vendorPrefixes[i] + name;\n\
      if (prefixName in object) return prefixName;\n\
    }\n\
  }\n\
  var d3_vendorPrefixes = [ \"webkit\", \"ms\", \"moz\", \"Moz\", \"o\", \"O\" ];\n\
  function d3_noop() {}\n\
  d3.dispatch = function() {\n\
    var dispatch = new d3_dispatch(), i = -1, n = arguments.length;\n\
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);\n\
    return dispatch;\n\
  };\n\
  function d3_dispatch() {}\n\
  d3_dispatch.prototype.on = function(type, listener) {\n\
    var i = type.indexOf(\".\"), name = \"\";\n\
    if (i >= 0) {\n\
      name = type.substring(i + 1);\n\
      type = type.substring(0, i);\n\
    }\n\
    if (type) return arguments.length < 2 ? this[type].on(name) : this[type].on(name, listener);\n\
    if (arguments.length === 2) {\n\
      if (listener == null) for (type in this) {\n\
        if (this.hasOwnProperty(type)) this[type].on(name, null);\n\
      }\n\
      return this;\n\
    }\n\
  };\n\
  function d3_dispatch_event(dispatch) {\n\
    var listeners = [], listenerByName = new d3_Map();\n\
    function event() {\n\
      var z = listeners, i = -1, n = z.length, l;\n\
      while (++i < n) if (l = z[i].on) l.apply(this, arguments);\n\
      return dispatch;\n\
    }\n\
    event.on = function(name, listener) {\n\
      var l = listenerByName.get(name), i;\n\
      if (arguments.length < 2) return l && l.on;\n\
      if (l) {\n\
        l.on = null;\n\
        listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));\n\
        listenerByName.remove(name);\n\
      }\n\
      if (listener) listeners.push(listenerByName.set(name, {\n\
        on: listener\n\
      }));\n\
      return dispatch;\n\
    };\n\
    return event;\n\
  }\n\
  d3.event = null;\n\
  function d3_eventPreventDefault() {\n\
    d3.event.preventDefault();\n\
  }\n\
  function d3_eventSource() {\n\
    var e = d3.event, s;\n\
    while (s = e.sourceEvent) e = s;\n\
    return e;\n\
  }\n\
  function d3_eventDispatch(target) {\n\
    var dispatch = new d3_dispatch(), i = 0, n = arguments.length;\n\
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);\n\
    dispatch.of = function(thiz, argumentz) {\n\
      return function(e1) {\n\
        try {\n\
          var e0 = e1.sourceEvent = d3.event;\n\
          e1.target = target;\n\
          d3.event = e1;\n\
          dispatch[e1.type].apply(thiz, argumentz);\n\
        } finally {\n\
          d3.event = e0;\n\
        }\n\
      };\n\
    };\n\
    return dispatch;\n\
  }\n\
  d3.requote = function(s) {\n\
    return s.replace(d3_requote_re, \"\\\\$&\");\n\
  };\n\
  var d3_requote_re = /[\\\\\\^\\$\\*\\+\\?\\|\\[\\]\\(\\)\\.\\{\\}]/g;\n\
  var d3_subclass = {}.__proto__ ? function(object, prototype) {\n\
    object.__proto__ = prototype;\n\
  } : function(object, prototype) {\n\
    for (var property in prototype) object[property] = prototype[property];\n\
  };\n\
  function d3_selection(groups) {\n\
    d3_subclass(groups, d3_selectionPrototype);\n\
    return groups;\n\
  }\n\
  var d3_select = function(s, n) {\n\
    return n.querySelector(s);\n\
  }, d3_selectAll = function(s, n) {\n\
    return n.querySelectorAll(s);\n\
  }, d3_selectMatcher = d3_documentElement[d3_vendorSymbol(d3_documentElement, \"matchesSelector\")], d3_selectMatches = function(n, s) {\n\
    return d3_selectMatcher.call(n, s);\n\
  };\n\
  if (typeof Sizzle === \"function\") {\n\
    d3_select = function(s, n) {\n\
      return Sizzle(s, n)[0] || null;\n\
    };\n\
    d3_selectAll = function(s, n) {\n\
      return Sizzle.uniqueSort(Sizzle(s, n));\n\
    };\n\
    d3_selectMatches = Sizzle.matchesSelector;\n\
  }\n\
  d3.selection = function() {\n\
    return d3_selectionRoot;\n\
  };\n\
  var d3_selectionPrototype = d3.selection.prototype = [];\n\
  d3_selectionPrototype.select = function(selector) {\n\
    var subgroups = [], subgroup, subnode, group, node;\n\
    selector = d3_selection_selector(selector);\n\
    for (var j = -1, m = this.length; ++j < m; ) {\n\
      subgroups.push(subgroup = []);\n\
      subgroup.parentNode = (group = this[j]).parentNode;\n\
      for (var i = -1, n = group.length; ++i < n; ) {\n\
        if (node = group[i]) {\n\
          subgroup.push(subnode = selector.call(node, node.__data__, i, j));\n\
          if (subnode && \"__data__\" in node) subnode.__data__ = node.__data__;\n\
        } else {\n\
          subgroup.push(null);\n\
        }\n\
      }\n\
    }\n\
    return d3_selection(subgroups);\n\
  };\n\
  function d3_selection_selector(selector) {\n\
    return typeof selector === \"function\" ? selector : function() {\n\
      return d3_select(selector, this);\n\
    };\n\
  }\n\
  d3_selectionPrototype.selectAll = function(selector) {\n\
    var subgroups = [], subgroup, node;\n\
    selector = d3_selection_selectorAll(selector);\n\
    for (var j = -1, m = this.length; ++j < m; ) {\n\
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {\n\
        if (node = group[i]) {\n\
          subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));\n\
          subgroup.parentNode = node;\n\
        }\n\
      }\n\
    }\n\
    return d3_selection(subgroups);\n\
  };\n\
  function d3_selection_selectorAll(selector) {\n\
    return typeof selector === \"function\" ? selector : function() {\n\
      return d3_selectAll(selector, this);\n\
    };\n\
  }\n\
  var d3_nsPrefix = {\n\
    svg: \"http://www.w3.org/2000/svg\",\n\
    xhtml: \"http://www.w3.org/1999/xhtml\",\n\
    xlink: \"http://www.w3.org/1999/xlink\",\n\
    xml: \"http://www.w3.org/XML/1998/namespace\",\n\
    xmlns: \"http://www.w3.org/2000/xmlns/\"\n\
  };\n\
  d3.ns = {\n\
    prefix: d3_nsPrefix,\n\
    qualify: function(name) {\n\
      var i = name.indexOf(\":\"), prefix = name;\n\
      if (i >= 0) {\n\
        prefix = name.substring(0, i);\n\
        name = name.substring(i + 1);\n\
      }\n\
      return d3_nsPrefix.hasOwnProperty(prefix) ? {\n\
        space: d3_nsPrefix[prefix],\n\
        local: name\n\
      } : name;\n\
    }\n\
  };\n\
  d3_selectionPrototype.attr = function(name, value) {\n\
    if (arguments.length < 2) {\n\
      if (typeof name === \"string\") {\n\
        var node = this.node();\n\
        name = d3.ns.qualify(name);\n\
        return name.local ? node.getAttributeNS(name.space, name.local) : node.getAttribute(name);\n\
      }\n\
      for (value in name) this.each(d3_selection_attr(value, name[value]));\n\
      return this;\n\
    }\n\
    return this.each(d3_selection_attr(name, value));\n\
  };\n\
  function d3_selection_attr(name, value) {\n\
    name = d3.ns.qualify(name);\n\
    function attrNull() {\n\
      this.removeAttribute(name);\n\
    }\n\
    function attrNullNS() {\n\
      this.removeAttributeNS(name.space, name.local);\n\
    }\n\
    function attrConstant() {\n\
      this.setAttribute(name, value);\n\
    }\n\
    function attrConstantNS() {\n\
      this.setAttributeNS(name.space, name.local, value);\n\
    }\n\
    function attrFunction() {\n\
      var x = value.apply(this, arguments);\n\
      if (x == null) this.removeAttribute(name); else this.setAttribute(name, x);\n\
    }\n\
    function attrFunctionNS() {\n\
      var x = value.apply(this, arguments);\n\
      if (x == null) this.removeAttributeNS(name.space, name.local); else this.setAttributeNS(name.space, name.local, x);\n\
    }\n\
    return value == null ? name.local ? attrNullNS : attrNull : typeof value === \"function\" ? name.local ? attrFunctionNS : attrFunction : name.local ? attrConstantNS : attrConstant;\n\
  }\n\
  function d3_collapse(s) {\n\
    return s.trim().replace(/\\s+/g, \" \");\n\
  }\n\
  d3_selectionPrototype.classed = function(name, value) {\n\
    if (arguments.length < 2) {\n\
      if (typeof name === \"string\") {\n\
        var node = this.node(), n = (name = name.trim().split(/^|\\s+/g)).length, i = -1;\n\
        if (value = node.classList) {\n\
          while (++i < n) if (!value.contains(name[i])) return false;\n\
        } else {\n\
          value = node.getAttribute(\"class\");\n\
          while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;\n\
        }\n\
        return true;\n\
      }\n\
      for (value in name) this.each(d3_selection_classed(value, name[value]));\n\
      return this;\n\
    }\n\
    return this.each(d3_selection_classed(name, value));\n\
  };\n\
  function d3_selection_classedRe(name) {\n\
    return new RegExp(\"(?:^|\\\\s+)\" + d3.requote(name) + \"(?:\\\\s+|$)\", \"g\");\n\
  }\n\
  function d3_selection_classed(name, value) {\n\
    name = name.trim().split(/\\s+/).map(d3_selection_classedName);\n\
    var n = name.length;\n\
    function classedConstant() {\n\
      var i = -1;\n\
      while (++i < n) name[i](this, value);\n\
    }\n\
    function classedFunction() {\n\
      var i = -1, x = value.apply(this, arguments);\n\
      while (++i < n) name[i](this, x);\n\
    }\n\
    return typeof value === \"function\" ? classedFunction : classedConstant;\n\
  }\n\
  function d3_selection_classedName(name) {\n\
    var re = d3_selection_classedRe(name);\n\
    return function(node, value) {\n\
      if (c = node.classList) return value ? c.add(name) : c.remove(name);\n\
      var c = node.getAttribute(\"class\") || \"\";\n\
      if (value) {\n\
        re.lastIndex = 0;\n\
        if (!re.test(c)) node.setAttribute(\"class\", d3_collapse(c + \" \" + name));\n\
      } else {\n\
        node.setAttribute(\"class\", d3_collapse(c.replace(re, \" \")));\n\
      }\n\
    };\n\
  }\n\
  d3_selectionPrototype.style = function(name, value, priority) {\n\
    var n = arguments.length;\n\
    if (n < 3) {\n\
      if (typeof name !== \"string\") {\n\
        if (n < 2) value = \"\";\n\
        for (priority in name) this.each(d3_selection_style(priority, name[priority], value));\n\
        return this;\n\
      }\n\
      if (n < 2) return d3_window.getComputedStyle(this.node(), null).getPropertyValue(name);\n\
      priority = \"\";\n\
    }\n\
    return this.each(d3_selection_style(name, value, priority));\n\
  };\n\
  function d3_selection_style(name, value, priority) {\n\
    function styleNull() {\n\
      this.style.removeProperty(name);\n\
    }\n\
    function styleConstant() {\n\
      this.style.setProperty(name, value, priority);\n\
    }\n\
    function styleFunction() {\n\
      var x = value.apply(this, arguments);\n\
      if (x == null) this.style.removeProperty(name); else this.style.setProperty(name, x, priority);\n\
    }\n\
    return value == null ? styleNull : typeof value === \"function\" ? styleFunction : styleConstant;\n\
  }\n\
  d3_selectionPrototype.property = function(name, value) {\n\
    if (arguments.length < 2) {\n\
      if (typeof name === \"string\") return this.node()[name];\n\
      for (value in name) this.each(d3_selection_property(value, name[value]));\n\
      return this;\n\
    }\n\
    return this.each(d3_selection_property(name, value));\n\
  };\n\
  function d3_selection_property(name, value) {\n\
    function propertyNull() {\n\
      delete this[name];\n\
    }\n\
    function propertyConstant() {\n\
      this[name] = value;\n\
    }\n\
    function propertyFunction() {\n\
      var x = value.apply(this, arguments);\n\
      if (x == null) delete this[name]; else this[name] = x;\n\
    }\n\
    return value == null ? propertyNull : typeof value === \"function\" ? propertyFunction : propertyConstant;\n\
  }\n\
  d3_selectionPrototype.text = function(value) {\n\
    return arguments.length ? this.each(typeof value === \"function\" ? function() {\n\
      var v = value.apply(this, arguments);\n\
      this.textContent = v == null ? \"\" : v;\n\
    } : value == null ? function() {\n\
      this.textContent = \"\";\n\
    } : function() {\n\
      this.textContent = value;\n\
    }) : this.node().textContent;\n\
  };\n\
  d3_selectionPrototype.html = function(value) {\n\
    return arguments.length ? this.each(typeof value === \"function\" ? function() {\n\
      var v = value.apply(this, arguments);\n\
      this.innerHTML = v == null ? \"\" : v;\n\
    } : value == null ? function() {\n\
      this.innerHTML = \"\";\n\
    } : function() {\n\
      this.innerHTML = value;\n\
    }) : this.node().innerHTML;\n\
  };\n\
  d3_selectionPrototype.append = function(name) {\n\
    name = d3_selection_creator(name);\n\
    return this.select(function() {\n\
      return this.appendChild(name.apply(this, arguments));\n\
    });\n\
  };\n\
  function d3_selection_creator(name) {\n\
    return typeof name === \"function\" ? name : (name = d3.ns.qualify(name)).local ? function() {\n\
      return this.ownerDocument.createElementNS(name.space, name.local);\n\
    } : function() {\n\
      return this.ownerDocument.createElementNS(this.namespaceURI, name);\n\
    };\n\
  }\n\
  d3_selectionPrototype.insert = function(name, before) {\n\
    name = d3_selection_creator(name);\n\
    before = d3_selection_selector(before);\n\
    return this.select(function() {\n\
      return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);\n\
    });\n\
  };\n\
  d3_selectionPrototype.remove = function() {\n\
    return this.each(function() {\n\
      var parent = this.parentNode;\n\
      if (parent) parent.removeChild(this);\n\
    });\n\
  };\n\
  d3_selectionPrototype.data = function(value, key) {\n\
    var i = -1, n = this.length, group, node;\n\
    if (!arguments.length) {\n\
      value = new Array(n = (group = this[0]).length);\n\
      while (++i < n) {\n\
        if (node = group[i]) {\n\
          value[i] = node.__data__;\n\
        }\n\
      }\n\
      return value;\n\
    }\n\
    function bind(group, groupData) {\n\
      var i, n = group.length, m = groupData.length, n0 = Math.min(n, m), updateNodes = new Array(m), enterNodes = new Array(m), exitNodes = new Array(n), node, nodeData;\n\
      if (key) {\n\
        var nodeByKeyValue = new d3_Map(), dataByKeyValue = new d3_Map(), keyValues = [], keyValue;\n\
        for (i = -1; ++i < n; ) {\n\
          keyValue = key.call(node = group[i], node.__data__, i);\n\
          if (nodeByKeyValue.has(keyValue)) {\n\
            exitNodes[i] = node;\n\
          } else {\n\
            nodeByKeyValue.set(keyValue, node);\n\
          }\n\
          keyValues.push(keyValue);\n\
        }\n\
        for (i = -1; ++i < m; ) {\n\
          keyValue = key.call(groupData, nodeData = groupData[i], i);\n\
          if (node = nodeByKeyValue.get(keyValue)) {\n\
            updateNodes[i] = node;\n\
            node.__data__ = nodeData;\n\
          } else if (!dataByKeyValue.has(keyValue)) {\n\
            enterNodes[i] = d3_selection_dataNode(nodeData);\n\
          }\n\
          dataByKeyValue.set(keyValue, nodeData);\n\
          nodeByKeyValue.remove(keyValue);\n\
        }\n\
        for (i = -1; ++i < n; ) {\n\
          if (nodeByKeyValue.has(keyValues[i])) {\n\
            exitNodes[i] = group[i];\n\
          }\n\
        }\n\
      } else {\n\
        for (i = -1; ++i < n0; ) {\n\
          node = group[i];\n\
          nodeData = groupData[i];\n\
          if (node) {\n\
            node.__data__ = nodeData;\n\
            updateNodes[i] = node;\n\
          } else {\n\
            enterNodes[i] = d3_selection_dataNode(nodeData);\n\
          }\n\
        }\n\
        for (;i < m; ++i) {\n\
          enterNodes[i] = d3_selection_dataNode(groupData[i]);\n\
        }\n\
        for (;i < n; ++i) {\n\
          exitNodes[i] = group[i];\n\
        }\n\
      }\n\
      enterNodes.update = updateNodes;\n\
      enterNodes.parentNode = updateNodes.parentNode = exitNodes.parentNode = group.parentNode;\n\
      enter.push(enterNodes);\n\
      update.push(updateNodes);\n\
      exit.push(exitNodes);\n\
    }\n\
    var enter = d3_selection_enter([]), update = d3_selection([]), exit = d3_selection([]);\n\
    if (typeof value === \"function\") {\n\
      while (++i < n) {\n\
        bind(group = this[i], value.call(group, group.parentNode.__data__, i));\n\
      }\n\
    } else {\n\
      while (++i < n) {\n\
        bind(group = this[i], value);\n\
      }\n\
    }\n\
    update.enter = function() {\n\
      return enter;\n\
    };\n\
    update.exit = function() {\n\
      return exit;\n\
    };\n\
    return update;\n\
  };\n\
  function d3_selection_dataNode(data) {\n\
    return {\n\
      __data__: data\n\
    };\n\
  }\n\
  d3_selectionPrototype.datum = function(value) {\n\
    return arguments.length ? this.property(\"__data__\", value) : this.property(\"__data__\");\n\
  };\n\
  d3_selectionPrototype.filter = function(filter) {\n\
    var subgroups = [], subgroup, group, node;\n\
    if (typeof filter !== \"function\") filter = d3_selection_filter(filter);\n\
    for (var j = 0, m = this.length; j < m; j++) {\n\
      subgroups.push(subgroup = []);\n\
      subgroup.parentNode = (group = this[j]).parentNode;\n\
      for (var i = 0, n = group.length; i < n; i++) {\n\
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {\n\
          subgroup.push(node);\n\
        }\n\
      }\n\
    }\n\
    return d3_selection(subgroups);\n\
  };\n\
  function d3_selection_filter(selector) {\n\
    return function() {\n\
      return d3_selectMatches(this, selector);\n\
    };\n\
  }\n\
  d3_selectionPrototype.order = function() {\n\
    for (var j = -1, m = this.length; ++j < m; ) {\n\
      for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {\n\
        if (node = group[i]) {\n\
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);\n\
          next = node;\n\
        }\n\
      }\n\
    }\n\
    return this;\n\
  };\n\
  d3_selectionPrototype.sort = function(comparator) {\n\
    comparator = d3_selection_sortComparator.apply(this, arguments);\n\
    for (var j = -1, m = this.length; ++j < m; ) this[j].sort(comparator);\n\
    return this.order();\n\
  };\n\
  function d3_selection_sortComparator(comparator) {\n\
    if (!arguments.length) comparator = d3.ascending;\n\
    return function(a, b) {\n\
      return a && b ? comparator(a.__data__, b.__data__) : !a - !b;\n\
    };\n\
  }\n\
  d3_selectionPrototype.each = function(callback) {\n\
    return d3_selection_each(this, function(node, i, j) {\n\
      callback.call(node, node.__data__, i, j);\n\
    });\n\
  };\n\
  function d3_selection_each(groups, callback) {\n\
    for (var j = 0, m = groups.length; j < m; j++) {\n\
      for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {\n\
        if (node = group[i]) callback(node, i, j);\n\
      }\n\
    }\n\
    return groups;\n\
  }\n\
  d3_selectionPrototype.call = function(callback) {\n\
    var args = d3_array(arguments);\n\
    callback.apply(args[0] = this, args);\n\
    return this;\n\
  };\n\
  d3_selectionPrototype.empty = function() {\n\
    return !this.node();\n\
  };\n\
  d3_selectionPrototype.node = function() {\n\
    for (var j = 0, m = this.length; j < m; j++) {\n\
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {\n\
        var node = group[i];\n\
        if (node) return node;\n\
      }\n\
    }\n\
    return null;\n\
  };\n\
  d3_selectionPrototype.size = function() {\n\
    var n = 0;\n\
    this.each(function() {\n\
      ++n;\n\
    });\n\
    return n;\n\
  };\n\
  function d3_selection_enter(selection) {\n\
    d3_subclass(selection, d3_selection_enterPrototype);\n\
    return selection;\n\
  }\n\
  var d3_selection_enterPrototype = [];\n\
  d3.selection.enter = d3_selection_enter;\n\
  d3.selection.enter.prototype = d3_selection_enterPrototype;\n\
  d3_selection_enterPrototype.append = d3_selectionPrototype.append;\n\
  d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;\n\
  d3_selection_enterPrototype.node = d3_selectionPrototype.node;\n\
  d3_selection_enterPrototype.call = d3_selectionPrototype.call;\n\
  d3_selection_enterPrototype.size = d3_selectionPrototype.size;\n\
  d3_selection_enterPrototype.select = function(selector) {\n\
    var subgroups = [], subgroup, subnode, upgroup, group, node;\n\
    for (var j = -1, m = this.length; ++j < m; ) {\n\
      upgroup = (group = this[j]).update;\n\
      subgroups.push(subgroup = []);\n\
      subgroup.parentNode = group.parentNode;\n\
      for (var i = -1, n = group.length; ++i < n; ) {\n\
        if (node = group[i]) {\n\
          subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));\n\
          subnode.__data__ = node.__data__;\n\
        } else {\n\
          subgroup.push(null);\n\
        }\n\
      }\n\
    }\n\
    return d3_selection(subgroups);\n\
  };\n\
  d3_selection_enterPrototype.insert = function(name, before) {\n\
    if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);\n\
    return d3_selectionPrototype.insert.call(this, name, before);\n\
  };\n\
  function d3_selection_enterInsertBefore(enter) {\n\
    var i0, j0;\n\
    return function(d, i, j) {\n\
      var group = enter[j].update, n = group.length, node;\n\
      if (j != j0) j0 = j, i0 = 0;\n\
      if (i >= i0) i0 = i + 1;\n\
      while (!(node = group[i0]) && ++i0 < n) ;\n\
      return node;\n\
    };\n\
  }\n\
  d3_selectionPrototype.transition = function() {\n\
    var id = d3_transitionInheritId || ++d3_transitionId, subgroups = [], subgroup, node, transition = d3_transitionInherit || {\n\
      time: Date.now(),\n\
      ease: d3_ease_cubicInOut,\n\
      delay: 0,\n\
      duration: 250\n\
    };\n\
    for (var j = -1, m = this.length; ++j < m; ) {\n\
      subgroups.push(subgroup = []);\n\
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {\n\
        if (node = group[i]) d3_transitionNode(node, i, id, transition);\n\
        subgroup.push(node);\n\
      }\n\
    }\n\
    return d3_transition(subgroups, id);\n\
  };\n\
  d3_selectionPrototype.interrupt = function() {\n\
    return this.each(d3_selection_interrupt);\n\
  };\n\
  function d3_selection_interrupt() {\n\
    var lock = this.__transition__;\n\
    if (lock) ++lock.active;\n\
  }\n\
  d3.select = function(node) {\n\
    var group = [ typeof node === \"string\" ? d3_select(node, d3_document) : node ];\n\
    group.parentNode = d3_documentElement;\n\
    return d3_selection([ group ]);\n\
  };\n\
  d3.selectAll = function(nodes) {\n\
    var group = d3_array(typeof nodes === \"string\" ? d3_selectAll(nodes, d3_document) : nodes);\n\
    group.parentNode = d3_documentElement;\n\
    return d3_selection([ group ]);\n\
  };\n\
  var d3_selectionRoot = d3.select(d3_documentElement);\n\
  d3_selectionPrototype.on = function(type, listener, capture) {\n\
    var n = arguments.length;\n\
    if (n < 3) {\n\
      if (typeof type !== \"string\") {\n\
        if (n < 2) listener = false;\n\
        for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));\n\
        return this;\n\
      }\n\
      if (n < 2) return (n = this.node()[\"__on\" + type]) && n._;\n\
      capture = false;\n\
    }\n\
    return this.each(d3_selection_on(type, listener, capture));\n\
  };\n\
  function d3_selection_on(type, listener, capture) {\n\
    var name = \"__on\" + type, i = type.indexOf(\".\"), wrap = d3_selection_onListener;\n\
    if (i > 0) type = type.substring(0, i);\n\
    var filter = d3_selection_onFilters.get(type);\n\
    if (filter) type = filter, wrap = d3_selection_onFilter;\n\
    function onRemove() {\n\
      var l = this[name];\n\
      if (l) {\n\
        this.removeEventListener(type, l, l.$);\n\
        delete this[name];\n\
      }\n\
    }\n\
    function onAdd() {\n\
      var l = wrap(listener, d3_array(arguments));\n\
      onRemove.call(this);\n\
      this.addEventListener(type, this[name] = l, l.$ = capture);\n\
      l._ = listener;\n\
    }\n\
    function removeAll() {\n\
      var re = new RegExp(\"^__on([^.]+)\" + d3.requote(type) + \"$\"), match;\n\
      for (var name in this) {\n\
        if (match = name.match(re)) {\n\
          var l = this[name];\n\
          this.removeEventListener(match[1], l, l.$);\n\
          delete this[name];\n\
        }\n\
      }\n\
    }\n\
    return i ? listener ? onAdd : onRemove : listener ? d3_noop : removeAll;\n\
  }\n\
  var d3_selection_onFilters = d3.map({\n\
    mouseenter: \"mouseover\",\n\
    mouseleave: \"mouseout\"\n\
  });\n\
  d3_selection_onFilters.forEach(function(k) {\n\
    if (\"on\" + k in d3_document) d3_selection_onFilters.remove(k);\n\
  });\n\
  function d3_selection_onListener(listener, argumentz) {\n\
    return function(e) {\n\
      var o = d3.event;\n\
      d3.event = e;\n\
      argumentz[0] = this.__data__;\n\
      try {\n\
        listener.apply(this, argumentz);\n\
      } finally {\n\
        d3.event = o;\n\
      }\n\
    };\n\
  }\n\
  function d3_selection_onFilter(listener, argumentz) {\n\
    var l = d3_selection_onListener(listener, argumentz);\n\
    return function(e) {\n\
      var target = this, related = e.relatedTarget;\n\
      if (!related || related !== target && !(related.compareDocumentPosition(target) & 8)) {\n\
        l.call(target, e);\n\
      }\n\
    };\n\
  }\n\
  var d3_event_dragSelect = \"onselectstart\" in d3_document ? null : d3_vendorSymbol(d3_documentElement.style, \"userSelect\"), d3_event_dragId = 0;\n\
  function d3_event_dragSuppress() {\n\
    var name = \".dragsuppress-\" + ++d3_event_dragId, click = \"click\" + name, w = d3.select(d3_window).on(\"touchmove\" + name, d3_eventPreventDefault).on(\"dragstart\" + name, d3_eventPreventDefault).on(\"selectstart\" + name, d3_eventPreventDefault);\n\
    if (d3_event_dragSelect) {\n\
      var style = d3_documentElement.style, select = style[d3_event_dragSelect];\n\
      style[d3_event_dragSelect] = \"none\";\n\
    }\n\
    return function(suppressClick) {\n\
      w.on(name, null);\n\
      if (d3_event_dragSelect) style[d3_event_dragSelect] = select;\n\
      if (suppressClick) {\n\
        function off() {\n\
          w.on(click, null);\n\
        }\n\
        w.on(click, function() {\n\
          d3_eventPreventDefault();\n\
          off();\n\
        }, true);\n\
        setTimeout(off, 0);\n\
      }\n\
    };\n\
  }\n\
  d3.mouse = function(container) {\n\
    return d3_mousePoint(container, d3_eventSource());\n\
  };\n\
  var d3_mouse_bug44083 = /WebKit/.test(d3_window.navigator.userAgent) ? -1 : 0;\n\
  function d3_mousePoint(container, e) {\n\
    if (e.changedTouches) e = e.changedTouches[0];\n\
    var svg = container.ownerSVGElement || container;\n\
    if (svg.createSVGPoint) {\n\
      var point = svg.createSVGPoint();\n\
      if (d3_mouse_bug44083 < 0 && (d3_window.scrollX || d3_window.scrollY)) {\n\
        svg = d3.select(\"body\").append(\"svg\").style({\n\
          position: \"absolute\",\n\
          top: 0,\n\
          left: 0,\n\
          margin: 0,\n\
          padding: 0,\n\
          border: \"none\"\n\
        }, \"important\");\n\
        var ctm = svg[0][0].getScreenCTM();\n\
        d3_mouse_bug44083 = !(ctm.f || ctm.e);\n\
        svg.remove();\n\
      }\n\
      if (d3_mouse_bug44083) point.x = e.pageX, point.y = e.pageY; else point.x = e.clientX, \n\
      point.y = e.clientY;\n\
      point = point.matrixTransform(container.getScreenCTM().inverse());\n\
      return [ point.x, point.y ];\n\
    }\n\
    var rect = container.getBoundingClientRect();\n\
    return [ e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop ];\n\
  }\n\
  d3.touches = function(container, touches) {\n\
    if (arguments.length < 2) touches = d3_eventSource().touches;\n\
    return touches ? d3_array(touches).map(function(touch) {\n\
      var point = d3_mousePoint(container, touch);\n\
      point.identifier = touch.identifier;\n\
      return point;\n\
    }) : [];\n\
  };\n\
  d3.behavior.drag = function() {\n\
    var event = d3_eventDispatch(drag, \"drag\", \"dragstart\", \"dragend\"), origin = null, mousedown = dragstart(d3_noop, d3.mouse, \"mousemove\", \"mouseup\"), touchstart = dragstart(touchid, touchposition, \"touchmove\", \"touchend\");\n\
    function drag() {\n\
      this.on(\"mousedown.drag\", mousedown).on(\"touchstart.drag\", touchstart);\n\
    }\n\
    function touchid() {\n\
      return d3.event.changedTouches[0].identifier;\n\
    }\n\
    function touchposition(parent, id) {\n\
      return d3.touches(parent).filter(function(p) {\n\
        return p.identifier === id;\n\
      })[0];\n\
    }\n\
    function dragstart(id, position, move, end) {\n\
      return function() {\n\
        var target = this, parent = target.parentNode, event_ = event.of(target, arguments), eventTarget = d3.event.target, eventId = id(), drag = eventId == null ? \"drag\" : \"drag-\" + eventId, origin_ = position(parent, eventId), dragged = 0, offset, w = d3.select(d3_window).on(move + \".\" + drag, moved).on(end + \".\" + drag, ended), dragRestore = d3_event_dragSuppress();\n\
        if (origin) {\n\
          offset = origin.apply(target, arguments);\n\
          offset = [ offset.x - origin_[0], offset.y - origin_[1] ];\n\
        } else {\n\
          offset = [ 0, 0 ];\n\
        }\n\
        event_({\n\
          type: \"dragstart\"\n\
        });\n\
        function moved() {\n\
          var p = position(parent, eventId), dx = p[0] - origin_[0], dy = p[1] - origin_[1];\n\
          dragged |= dx | dy;\n\
          origin_ = p;\n\
          event_({\n\
            type: \"drag\",\n\
            x: p[0] + offset[0],\n\
            y: p[1] + offset[1],\n\
            dx: dx,\n\
            dy: dy\n\
          });\n\
        }\n\
        function ended() {\n\
          w.on(move + \".\" + drag, null).on(end + \".\" + drag, null);\n\
          dragRestore(dragged && d3.event.target === eventTarget);\n\
          event_({\n\
            type: \"dragend\"\n\
          });\n\
        }\n\
      };\n\
    }\n\
    drag.origin = function(x) {\n\
      if (!arguments.length) return origin;\n\
      origin = x;\n\
      return drag;\n\
    };\n\
    return d3.rebind(drag, event, \"on\");\n\
  };\n\
  var π = Math.PI, τ = 2 * π, halfπ = π / 2, ε = 1e-6, ε2 = ε * ε, d3_radians = π / 180, d3_degrees = 180 / π;\n\
  function d3_sgn(x) {\n\
    return x > 0 ? 1 : x < 0 ? -1 : 0;\n\
  }\n\
  function d3_acos(x) {\n\
    return x > 1 ? 0 : x < -1 ? π : Math.acos(x);\n\
  }\n\
  function d3_asin(x) {\n\
    return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);\n\
  }\n\
  function d3_sinh(x) {\n\
    return ((x = Math.exp(x)) - 1 / x) / 2;\n\
  }\n\
  function d3_cosh(x) {\n\
    return ((x = Math.exp(x)) + 1 / x) / 2;\n\
  }\n\
  function d3_tanh(x) {\n\
    return ((x = Math.exp(2 * x)) - 1) / (x + 1);\n\
  }\n\
  function d3_haversin(x) {\n\
    return (x = Math.sin(x / 2)) * x;\n\
  }\n\
  var ρ = Math.SQRT2, ρ2 = 2, ρ4 = 4;\n\
  d3.interpolateZoom = function(p0, p1) {\n\
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2];\n\
    var dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + ρ4 * d2) / (2 * w0 * ρ2 * d1), b1 = (w1 * w1 - w0 * w0 - ρ4 * d2) / (2 * w1 * ρ2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), dr = r1 - r0, S = (dr || Math.log(w1 / w0)) / ρ;\n\
    function interpolate(t) {\n\
      var s = t * S;\n\
      if (dr) {\n\
        var coshr0 = d3_cosh(r0), u = w0 / (ρ2 * d1) * (coshr0 * d3_tanh(ρ * s + r0) - d3_sinh(r0));\n\
        return [ ux0 + u * dx, uy0 + u * dy, w0 * coshr0 / d3_cosh(ρ * s + r0) ];\n\
      }\n\
      return [ ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(ρ * s) ];\n\
    }\n\
    interpolate.duration = S * 1e3;\n\
    return interpolate;\n\
  };\n\
  d3.behavior.zoom = function() {\n\
    var view = {\n\
      x: 0,\n\
      y: 0,\n\
      k: 1\n\
    }, translate0, center, size = [ 960, 500 ], scaleExtent = d3_behavior_zoomInfinity, mousedown = \"mousedown.zoom\", mousemove = \"mousemove.zoom\", mouseup = \"mouseup.zoom\", mousewheelTimer, touchstart = \"touchstart.zoom\", touchtime, event = d3_eventDispatch(zoom, \"zoomstart\", \"zoom\", \"zoomend\"), x0, x1, y0, y1;\n\
    function zoom(g) {\n\
      g.on(mousedown, mousedowned).on(d3_behavior_zoomWheel + \".zoom\", mousewheeled).on(mousemove, mousewheelreset).on(\"dblclick.zoom\", dblclicked).on(touchstart, touchstarted);\n\
    }\n\
    zoom.event = function(g) {\n\
      g.each(function() {\n\
        var event_ = event.of(this, arguments), view1 = view;\n\
        if (d3_transitionInheritId) {\n\
          d3.select(this).transition().each(\"start.zoom\", function() {\n\
            view = this.__chart__ || {\n\
              x: 0,\n\
              y: 0,\n\
              k: 1\n\
            };\n\
            zoomstarted(event_);\n\
          }).tween(\"zoom:zoom\", function() {\n\
            var dx = size[0], dy = size[1], cx = dx / 2, cy = dy / 2, i = d3.interpolateZoom([ (cx - view.x) / view.k, (cy - view.y) / view.k, dx / view.k ], [ (cx - view1.x) / view1.k, (cy - view1.y) / view1.k, dx / view1.k ]);\n\
            return function(t) {\n\
              var l = i(t), k = dx / l[2];\n\
              this.__chart__ = view = {\n\
                x: cx - l[0] * k,\n\
                y: cy - l[1] * k,\n\
                k: k\n\
              };\n\
              zoomed(event_);\n\
            };\n\
          }).each(\"end.zoom\", function() {\n\
            zoomended(event_);\n\
          });\n\
        } else {\n\
          this.__chart__ = view;\n\
          zoomstarted(event_);\n\
          zoomed(event_);\n\
          zoomended(event_);\n\
        }\n\
      });\n\
    };\n\
    zoom.translate = function(_) {\n\
      if (!arguments.length) return [ view.x, view.y ];\n\
      view = {\n\
        x: +_[0],\n\
        y: +_[1],\n\
        k: view.k\n\
      };\n\
      rescale();\n\
      return zoom;\n\
    };\n\
    zoom.scale = function(_) {\n\
      if (!arguments.length) return view.k;\n\
      view = {\n\
        x: view.x,\n\
        y: view.y,\n\
        k: +_\n\
      };\n\
      rescale();\n\
      return zoom;\n\
    };\n\
    zoom.scaleExtent = function(_) {\n\
      if (!arguments.length) return scaleExtent;\n\
      scaleExtent = _ == null ? d3_behavior_zoomInfinity : [ +_[0], +_[1] ];\n\
      return zoom;\n\
    };\n\
    zoom.center = function(_) {\n\
      if (!arguments.length) return center;\n\
      center = _ && [ +_[0], +_[1] ];\n\
      return zoom;\n\
    };\n\
    zoom.size = function(_) {\n\
      if (!arguments.length) return size;\n\
      size = _ && [ +_[0], +_[1] ];\n\
      return zoom;\n\
    };\n\
    zoom.x = function(z) {\n\
      if (!arguments.length) return x1;\n\
      x1 = z;\n\
      x0 = z.copy();\n\
      view = {\n\
        x: 0,\n\
        y: 0,\n\
        k: 1\n\
      };\n\
      return zoom;\n\
    };\n\
    zoom.y = function(z) {\n\
      if (!arguments.length) return y1;\n\
      y1 = z;\n\
      y0 = z.copy();\n\
      view = {\n\
        x: 0,\n\
        y: 0,\n\
        k: 1\n\
      };\n\
      return zoom;\n\
    };\n\
    function location(p) {\n\
      return [ (p[0] - view.x) / view.k, (p[1] - view.y) / view.k ];\n\
    }\n\
    function point(l) {\n\
      return [ l[0] * view.k + view.x, l[1] * view.k + view.y ];\n\
    }\n\
    function scaleTo(s) {\n\
      view.k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));\n\
    }\n\
    function translateTo(p, l) {\n\
      l = point(l);\n\
      view.x += p[0] - l[0];\n\
      view.y += p[1] - l[1];\n\
    }\n\
    function rescale() {\n\
      if (x1) x1.domain(x0.range().map(function(x) {\n\
        return (x - view.x) / view.k;\n\
      }).map(x0.invert));\n\
      if (y1) y1.domain(y0.range().map(function(y) {\n\
        return (y - view.y) / view.k;\n\
      }).map(y0.invert));\n\
    }\n\
    function zoomstarted(event) {\n\
      event({\n\
        type: \"zoomstart\"\n\
      });\n\
    }\n\
    function zoomed(event) {\n\
      rescale();\n\
      event({\n\
        type: \"zoom\",\n\
        scale: view.k,\n\
        translate: [ view.x, view.y ]\n\
      });\n\
    }\n\
    function zoomended(event) {\n\
      event({\n\
        type: \"zoomend\"\n\
      });\n\
    }\n\
    function mousedowned() {\n\
      var target = this, event_ = event.of(target, arguments), eventTarget = d3.event.target, dragged = 0, w = d3.select(d3_window).on(mousemove, moved).on(mouseup, ended), l = location(d3.mouse(target)), dragRestore = d3_event_dragSuppress();\n\
      d3_selection_interrupt.call(target);\n\
      zoomstarted(event_);\n\
      function moved() {\n\
        dragged = 1;\n\
        translateTo(d3.mouse(target), l);\n\
        zoomed(event_);\n\
      }\n\
      function ended() {\n\
        w.on(mousemove, d3_window === target ? mousewheelreset : null).on(mouseup, null);\n\
        dragRestore(dragged && d3.event.target === eventTarget);\n\
        zoomended(event_);\n\
      }\n\
    }\n\
    function touchstarted() {\n\
      var target = this, event_ = event.of(target, arguments), locations0 = {}, distance0 = 0, scale0, eventId = d3.event.changedTouches[0].identifier, touchmove = \"touchmove.zoom-\" + eventId, touchend = \"touchend.zoom-\" + eventId, w = d3.select(d3_window).on(touchmove, moved).on(touchend, ended), t = d3.select(target).on(mousedown, null).on(touchstart, started), dragRestore = d3_event_dragSuppress();\n\
      d3_selection_interrupt.call(target);\n\
      started();\n\
      zoomstarted(event_);\n\
      function relocate() {\n\
        var touches = d3.touches(target);\n\
        scale0 = view.k;\n\
        touches.forEach(function(t) {\n\
          if (t.identifier in locations0) locations0[t.identifier] = location(t);\n\
        });\n\
        return touches;\n\
      }\n\
      function started() {\n\
        var changed = d3.event.changedTouches;\n\
        for (var i = 0, n = changed.length; i < n; ++i) {\n\
          locations0[changed[i].identifier] = null;\n\
        }\n\
        var touches = relocate(), now = Date.now();\n\
        if (touches.length === 1) {\n\
          if (now - touchtime < 500) {\n\
            var p = touches[0], l = locations0[p.identifier];\n\
            scaleTo(view.k * 2);\n\
            translateTo(p, l);\n\
            d3_eventPreventDefault();\n\
            zoomed(event_);\n\
          }\n\
          touchtime = now;\n\
        } else if (touches.length > 1) {\n\
          var p = touches[0], q = touches[1], dx = p[0] - q[0], dy = p[1] - q[1];\n\
          distance0 = dx * dx + dy * dy;\n\
        }\n\
      }\n\
      function moved() {\n\
        var touches = d3.touches(target), p0, l0, p1, l1;\n\
        for (var i = 0, n = touches.length; i < n; ++i, l1 = null) {\n\
          p1 = touches[i];\n\
          if (l1 = locations0[p1.identifier]) {\n\
            if (l0) break;\n\
            p0 = p1, l0 = l1;\n\
          }\n\
        }\n\
        if (l1) {\n\
          var distance1 = (distance1 = p1[0] - p0[0]) * distance1 + (distance1 = p1[1] - p0[1]) * distance1, scale1 = distance0 && Math.sqrt(distance1 / distance0);\n\
          p0 = [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ];\n\
          l0 = [ (l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2 ];\n\
          scaleTo(scale1 * scale0);\n\
        }\n\
        touchtime = null;\n\
        translateTo(p0, l0);\n\
        zoomed(event_);\n\
      }\n\
      function ended() {\n\
        if (d3.event.touches.length) {\n\
          var changed = d3.event.changedTouches;\n\
          for (var i = 0, n = changed.length; i < n; ++i) {\n\
            delete locations0[changed[i].identifier];\n\
          }\n\
          for (var identifier in locations0) {\n\
            return void relocate();\n\
          }\n\
        }\n\
        w.on(touchmove, null).on(touchend, null);\n\
        t.on(mousedown, mousedowned).on(touchstart, touchstarted);\n\
        dragRestore();\n\
        zoomended(event_);\n\
      }\n\
    }\n\
    function mousewheeled() {\n\
      var event_ = event.of(this, arguments);\n\
      if (mousewheelTimer) clearTimeout(mousewheelTimer); else d3_selection_interrupt.call(this), \n\
      zoomstarted(event_);\n\
      mousewheelTimer = setTimeout(function() {\n\
        mousewheelTimer = null;\n\
        zoomended(event_);\n\
      }, 50);\n\
      d3_eventPreventDefault();\n\
      var point = center || d3.mouse(this);\n\
      if (!translate0) translate0 = location(point);\n\
      scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * view.k);\n\
      translateTo(point, translate0);\n\
      zoomed(event_);\n\
    }\n\
    function mousewheelreset() {\n\
      translate0 = null;\n\
    }\n\
    function dblclicked() {\n\
      var event_ = event.of(this, arguments), p = d3.mouse(this), l = location(p), k = Math.log(view.k) / Math.LN2;\n\
      zoomstarted(event_);\n\
      scaleTo(Math.pow(2, d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1));\n\
      translateTo(p, l);\n\
      zoomed(event_);\n\
      zoomended(event_);\n\
    }\n\
    return d3.rebind(zoom, event, \"on\");\n\
  };\n\
  var d3_behavior_zoomInfinity = [ 0, Infinity ];\n\
  var d3_behavior_zoomDelta, d3_behavior_zoomWheel = \"onwheel\" in d3_document ? (d3_behavior_zoomDelta = function() {\n\
    return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1);\n\
  }, \"wheel\") : \"onmousewheel\" in d3_document ? (d3_behavior_zoomDelta = function() {\n\
    return d3.event.wheelDelta;\n\
  }, \"mousewheel\") : (d3_behavior_zoomDelta = function() {\n\
    return -d3.event.detail;\n\
  }, \"MozMousePixelScroll\");\n\
  function d3_Color() {}\n\
  d3_Color.prototype.toString = function() {\n\
    return this.rgb() + \"\";\n\
  };\n\
  d3.hsl = function(h, s, l) {\n\
    return arguments.length === 1 ? h instanceof d3_Hsl ? d3_hsl(h.h, h.s, h.l) : d3_rgb_parse(\"\" + h, d3_rgb_hsl, d3_hsl) : d3_hsl(+h, +s, +l);\n\
  };\n\
  function d3_hsl(h, s, l) {\n\
    return new d3_Hsl(h, s, l);\n\
  }\n\
  function d3_Hsl(h, s, l) {\n\
    this.h = h;\n\
    this.s = s;\n\
    this.l = l;\n\
  }\n\
  var d3_hslPrototype = d3_Hsl.prototype = new d3_Color();\n\
  d3_hslPrototype.brighter = function(k) {\n\
    k = Math.pow(.7, arguments.length ? k : 1);\n\
    return d3_hsl(this.h, this.s, this.l / k);\n\
  };\n\
  d3_hslPrototype.darker = function(k) {\n\
    k = Math.pow(.7, arguments.length ? k : 1);\n\
    return d3_hsl(this.h, this.s, k * this.l);\n\
  };\n\
  d3_hslPrototype.rgb = function() {\n\
    return d3_hsl_rgb(this.h, this.s, this.l);\n\
  };\n\
  function d3_hsl_rgb(h, s, l) {\n\
    var m1, m2;\n\
    h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;\n\
    s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;\n\
    l = l < 0 ? 0 : l > 1 ? 1 : l;\n\
    m2 = l <= .5 ? l * (1 + s) : l + s - l * s;\n\
    m1 = 2 * l - m2;\n\
    function v(h) {\n\
      if (h > 360) h -= 360; else if (h < 0) h += 360;\n\
      if (h < 60) return m1 + (m2 - m1) * h / 60;\n\
      if (h < 180) return m2;\n\
      if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;\n\
      return m1;\n\
    }\n\
    function vv(h) {\n\
      return Math.round(v(h) * 255);\n\
    }\n\
    return d3_rgb(vv(h + 120), vv(h), vv(h - 120));\n\
  }\n\
  d3.hcl = function(h, c, l) {\n\
    return arguments.length === 1 ? h instanceof d3_Hcl ? d3_hcl(h.h, h.c, h.l) : h instanceof d3_Lab ? d3_lab_hcl(h.l, h.a, h.b) : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b) : d3_hcl(+h, +c, +l);\n\
  };\n\
  function d3_hcl(h, c, l) {\n\
    return new d3_Hcl(h, c, l);\n\
  }\n\
  function d3_Hcl(h, c, l) {\n\
    this.h = h;\n\
    this.c = c;\n\
    this.l = l;\n\
  }\n\
  var d3_hclPrototype = d3_Hcl.prototype = new d3_Color();\n\
  d3_hclPrototype.brighter = function(k) {\n\
    return d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));\n\
  };\n\
  d3_hclPrototype.darker = function(k) {\n\
    return d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));\n\
  };\n\
  d3_hclPrototype.rgb = function() {\n\
    return d3_hcl_lab(this.h, this.c, this.l).rgb();\n\
  };\n\
  function d3_hcl_lab(h, c, l) {\n\
    if (isNaN(h)) h = 0;\n\
    if (isNaN(c)) c = 0;\n\
    return d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);\n\
  }\n\
  d3.lab = function(l, a, b) {\n\
    return arguments.length === 1 ? l instanceof d3_Lab ? d3_lab(l.l, l.a, l.b) : l instanceof d3_Hcl ? d3_hcl_lab(l.l, l.c, l.h) : d3_rgb_lab((l = d3.rgb(l)).r, l.g, l.b) : d3_lab(+l, +a, +b);\n\
  };\n\
  function d3_lab(l, a, b) {\n\
    return new d3_Lab(l, a, b);\n\
  }\n\
  function d3_Lab(l, a, b) {\n\
    this.l = l;\n\
    this.a = a;\n\
    this.b = b;\n\
  }\n\
  var d3_lab_K = 18;\n\
  var d3_lab_X = .95047, d3_lab_Y = 1, d3_lab_Z = 1.08883;\n\
  var d3_labPrototype = d3_Lab.prototype = new d3_Color();\n\
  d3_labPrototype.brighter = function(k) {\n\
    return d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);\n\
  };\n\
  d3_labPrototype.darker = function(k) {\n\
    return d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);\n\
  };\n\
  d3_labPrototype.rgb = function() {\n\
    return d3_lab_rgb(this.l, this.a, this.b);\n\
  };\n\
  function d3_lab_rgb(l, a, b) {\n\
    var y = (l + 16) / 116, x = y + a / 500, z = y - b / 200;\n\
    x = d3_lab_xyz(x) * d3_lab_X;\n\
    y = d3_lab_xyz(y) * d3_lab_Y;\n\
    z = d3_lab_xyz(z) * d3_lab_Z;\n\
    return d3_rgb(d3_xyz_rgb(3.2404542 * x - 1.5371385 * y - .4985314 * z), d3_xyz_rgb(-.969266 * x + 1.8760108 * y + .041556 * z), d3_xyz_rgb(.0556434 * x - .2040259 * y + 1.0572252 * z));\n\
  }\n\
  function d3_lab_hcl(l, a, b) {\n\
    return l > 0 ? d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l) : d3_hcl(NaN, NaN, l);\n\
  }\n\
  function d3_lab_xyz(x) {\n\
    return x > .206893034 ? x * x * x : (x - 4 / 29) / 7.787037;\n\
  }\n\
  function d3_xyz_lab(x) {\n\
    return x > .008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;\n\
  }\n\
  function d3_xyz_rgb(r) {\n\
    return Math.round(255 * (r <= .00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - .055));\n\
  }\n\
  d3.rgb = function(r, g, b) {\n\
    return arguments.length === 1 ? r instanceof d3_Rgb ? d3_rgb(r.r, r.g, r.b) : d3_rgb_parse(\"\" + r, d3_rgb, d3_hsl_rgb) : d3_rgb(~~r, ~~g, ~~b);\n\
  };\n\
  function d3_rgbNumber(value) {\n\
    return d3_rgb(value >> 16, value >> 8 & 255, value & 255);\n\
  }\n\
  function d3_rgbString(value) {\n\
    return d3_rgbNumber(value) + \"\";\n\
  }\n\
  function d3_rgb(r, g, b) {\n\
    return new d3_Rgb(r, g, b);\n\
  }\n\
  function d3_Rgb(r, g, b) {\n\
    this.r = r;\n\
    this.g = g;\n\
    this.b = b;\n\
  }\n\
  var d3_rgbPrototype = d3_Rgb.prototype = new d3_Color();\n\
  d3_rgbPrototype.brighter = function(k) {\n\
    k = Math.pow(.7, arguments.length ? k : 1);\n\
    var r = this.r, g = this.g, b = this.b, i = 30;\n\
    if (!r && !g && !b) return d3_rgb(i, i, i);\n\
    if (r && r < i) r = i;\n\
    if (g && g < i) g = i;\n\
    if (b && b < i) b = i;\n\
    return d3_rgb(Math.min(255, ~~(r / k)), Math.min(255, ~~(g / k)), Math.min(255, ~~(b / k)));\n\
  };\n\
  d3_rgbPrototype.darker = function(k) {\n\
    k = Math.pow(.7, arguments.length ? k : 1);\n\
    return d3_rgb(~~(k * this.r), ~~(k * this.g), ~~(k * this.b));\n\
  };\n\
  d3_rgbPrototype.hsl = function() {\n\
    return d3_rgb_hsl(this.r, this.g, this.b);\n\
  };\n\
  d3_rgbPrototype.toString = function() {\n\
    return \"#\" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);\n\
  };\n\
  function d3_rgb_hex(v) {\n\
    return v < 16 ? \"0\" + Math.max(0, v).toString(16) : Math.min(255, v).toString(16);\n\
  }\n\
  function d3_rgb_parse(format, rgb, hsl) {\n\
    var r = 0, g = 0, b = 0, m1, m2, name;\n\
    m1 = /([a-z]+)\\((.*)\\)/i.exec(format);\n\
    if (m1) {\n\
      m2 = m1[2].split(\",\");\n\
      switch (m1[1]) {\n\
       case \"hsl\":\n\
        {\n\
          return hsl(parseFloat(m2[0]), parseFloat(m2[1]) / 100, parseFloat(m2[2]) / 100);\n\
        }\n\
\n\
       case \"rgb\":\n\
        {\n\
          return rgb(d3_rgb_parseNumber(m2[0]), d3_rgb_parseNumber(m2[1]), d3_rgb_parseNumber(m2[2]));\n\
        }\n\
      }\n\
    }\n\
    if (name = d3_rgb_names.get(format)) return rgb(name.r, name.g, name.b);\n\
    if (format != null && format.charAt(0) === \"#\") {\n\
      if (format.length === 4) {\n\
        r = format.charAt(1);\n\
        r += r;\n\
        g = format.charAt(2);\n\
        g += g;\n\
        b = format.charAt(3);\n\
        b += b;\n\
      } else if (format.length === 7) {\n\
        r = format.substring(1, 3);\n\
        g = format.substring(3, 5);\n\
        b = format.substring(5, 7);\n\
      }\n\
      r = parseInt(r, 16);\n\
      g = parseInt(g, 16);\n\
      b = parseInt(b, 16);\n\
    }\n\
    return rgb(r, g, b);\n\
  }\n\
  function d3_rgb_hsl(r, g, b) {\n\
    var min = Math.min(r /= 255, g /= 255, b /= 255), max = Math.max(r, g, b), d = max - min, h, s, l = (max + min) / 2;\n\
    if (d) {\n\
      s = l < .5 ? d / (max + min) : d / (2 - max - min);\n\
      if (r == max) h = (g - b) / d + (g < b ? 6 : 0); else if (g == max) h = (b - r) / d + 2; else h = (r - g) / d + 4;\n\
      h *= 60;\n\
    } else {\n\
      h = NaN;\n\
      s = l > 0 && l < 1 ? 0 : h;\n\
    }\n\
    return d3_hsl(h, s, l);\n\
  }\n\
  function d3_rgb_lab(r, g, b) {\n\
    r = d3_rgb_xyz(r);\n\
    g = d3_rgb_xyz(g);\n\
    b = d3_rgb_xyz(b);\n\
    var x = d3_xyz_lab((.4124564 * r + .3575761 * g + .1804375 * b) / d3_lab_X), y = d3_xyz_lab((.2126729 * r + .7151522 * g + .072175 * b) / d3_lab_Y), z = d3_xyz_lab((.0193339 * r + .119192 * g + .9503041 * b) / d3_lab_Z);\n\
    return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));\n\
  }\n\
  function d3_rgb_xyz(r) {\n\
    return (r /= 255) <= .04045 ? r / 12.92 : Math.pow((r + .055) / 1.055, 2.4);\n\
  }\n\
  function d3_rgb_parseNumber(c) {\n\
    var f = parseFloat(c);\n\
    return c.charAt(c.length - 1) === \"%\" ? Math.round(f * 2.55) : f;\n\
  }\n\
  var d3_rgb_names = d3.map({\n\
    aliceblue: 15792383,\n\
    antiquewhite: 16444375,\n\
    aqua: 65535,\n\
    aquamarine: 8388564,\n\
    azure: 15794175,\n\
    beige: 16119260,\n\
    bisque: 16770244,\n\
    black: 0,\n\
    blanchedalmond: 16772045,\n\
    blue: 255,\n\
    blueviolet: 9055202,\n\
    brown: 10824234,\n\
    burlywood: 14596231,\n\
    cadetblue: 6266528,\n\
    chartreuse: 8388352,\n\
    chocolate: 13789470,\n\
    coral: 16744272,\n\
    cornflowerblue: 6591981,\n\
    cornsilk: 16775388,\n\
    crimson: 14423100,\n\
    cyan: 65535,\n\
    darkblue: 139,\n\
    darkcyan: 35723,\n\
    darkgoldenrod: 12092939,\n\
    darkgray: 11119017,\n\
    darkgreen: 25600,\n\
    darkgrey: 11119017,\n\
    darkkhaki: 12433259,\n\
    darkmagenta: 9109643,\n\
    darkolivegreen: 5597999,\n\
    darkorange: 16747520,\n\
    darkorchid: 10040012,\n\
    darkred: 9109504,\n\
    darksalmon: 15308410,\n\
    darkseagreen: 9419919,\n\
    darkslateblue: 4734347,\n\
    darkslategray: 3100495,\n\
    darkslategrey: 3100495,\n\
    darkturquoise: 52945,\n\
    darkviolet: 9699539,\n\
    deeppink: 16716947,\n\
    deepskyblue: 49151,\n\
    dimgray: 6908265,\n\
    dimgrey: 6908265,\n\
    dodgerblue: 2003199,\n\
    firebrick: 11674146,\n\
    floralwhite: 16775920,\n\
    forestgreen: 2263842,\n\
    fuchsia: 16711935,\n\
    gainsboro: 14474460,\n\
    ghostwhite: 16316671,\n\
    gold: 16766720,\n\
    goldenrod: 14329120,\n\
    gray: 8421504,\n\
    green: 32768,\n\
    greenyellow: 11403055,\n\
    grey: 8421504,\n\
    honeydew: 15794160,\n\
    hotpink: 16738740,\n\
    indianred: 13458524,\n\
    indigo: 4915330,\n\
    ivory: 16777200,\n\
    khaki: 15787660,\n\
    lavender: 15132410,\n\
    lavenderblush: 16773365,\n\
    lawngreen: 8190976,\n\
    lemonchiffon: 16775885,\n\
    lightblue: 11393254,\n\
    lightcoral: 15761536,\n\
    lightcyan: 14745599,\n\
    lightgoldenrodyellow: 16448210,\n\
    lightgray: 13882323,\n\
    lightgreen: 9498256,\n\
    lightgrey: 13882323,\n\
    lightpink: 16758465,\n\
    lightsalmon: 16752762,\n\
    lightseagreen: 2142890,\n\
    lightskyblue: 8900346,\n\
    lightslategray: 7833753,\n\
    lightslategrey: 7833753,\n\
    lightsteelblue: 11584734,\n\
    lightyellow: 16777184,\n\
    lime: 65280,\n\
    limegreen: 3329330,\n\
    linen: 16445670,\n\
    magenta: 16711935,\n\
    maroon: 8388608,\n\
    mediumaquamarine: 6737322,\n\
    mediumblue: 205,\n\
    mediumorchid: 12211667,\n\
    mediumpurple: 9662683,\n\
    mediumseagreen: 3978097,\n\
    mediumslateblue: 8087790,\n\
    mediumspringgreen: 64154,\n\
    mediumturquoise: 4772300,\n\
    mediumvioletred: 13047173,\n\
    midnightblue: 1644912,\n\
    mintcream: 16121850,\n\
    mistyrose: 16770273,\n\
    moccasin: 16770229,\n\
    navajowhite: 16768685,\n\
    navy: 128,\n\
    oldlace: 16643558,\n\
    olive: 8421376,\n\
    olivedrab: 7048739,\n\
    orange: 16753920,\n\
    orangered: 16729344,\n\
    orchid: 14315734,\n\
    palegoldenrod: 15657130,\n\
    palegreen: 10025880,\n\
    paleturquoise: 11529966,\n\
    palevioletred: 14381203,\n\
    papayawhip: 16773077,\n\
    peachpuff: 16767673,\n\
    peru: 13468991,\n\
    pink: 16761035,\n\
    plum: 14524637,\n\
    powderblue: 11591910,\n\
    purple: 8388736,\n\
    red: 16711680,\n\
    rosybrown: 12357519,\n\
    royalblue: 4286945,\n\
    saddlebrown: 9127187,\n\
    salmon: 16416882,\n\
    sandybrown: 16032864,\n\
    seagreen: 3050327,\n\
    seashell: 16774638,\n\
    sienna: 10506797,\n\
    silver: 12632256,\n\
    skyblue: 8900331,\n\
    slateblue: 6970061,\n\
    slategray: 7372944,\n\
    slategrey: 7372944,\n\
    snow: 16775930,\n\
    springgreen: 65407,\n\
    steelblue: 4620980,\n\
    tan: 13808780,\n\
    teal: 32896,\n\
    thistle: 14204888,\n\
    tomato: 16737095,\n\
    turquoise: 4251856,\n\
    violet: 15631086,\n\
    wheat: 16113331,\n\
    white: 16777215,\n\
    whitesmoke: 16119285,\n\
    yellow: 16776960,\n\
    yellowgreen: 10145074\n\
  });\n\
  d3_rgb_names.forEach(function(key, value) {\n\
    d3_rgb_names.set(key, d3_rgbNumber(value));\n\
  });\n\
  function d3_functor(v) {\n\
    return typeof v === \"function\" ? v : function() {\n\
      return v;\n\
    };\n\
  }\n\
  d3.functor = d3_functor;\n\
  function d3_identity(d) {\n\
    return d;\n\
  }\n\
  d3.xhr = d3_xhrType(d3_identity);\n\
  function d3_xhrType(response) {\n\
    return function(url, mimeType, callback) {\n\
      if (arguments.length === 2 && typeof mimeType === \"function\") callback = mimeType, \n\
      mimeType = null;\n\
      return d3_xhr(url, mimeType, response, callback);\n\
    };\n\
  }\n\
  function d3_xhr(url, mimeType, response, callback) {\n\
    var xhr = {}, dispatch = d3.dispatch(\"beforesend\", \"progress\", \"load\", \"error\"), headers = {}, request = new XMLHttpRequest(), responseType = null;\n\
    if (d3_window.XDomainRequest && !(\"withCredentials\" in request) && /^(http(s)?:)?\\/\\//.test(url)) request = new XDomainRequest();\n\
    \"onload\" in request ? request.onload = request.onerror = respond : request.onreadystatechange = function() {\n\
      request.readyState > 3 && respond();\n\
    };\n\
    function respond() {\n\
      var status = request.status, result;\n\
      if (!status && request.responseText || status >= 200 && status < 300 || status === 304) {\n\
        try {\n\
          result = response.call(xhr, request);\n\
        } catch (e) {\n\
          dispatch.error.call(xhr, e);\n\
          return;\n\
        }\n\
        dispatch.load.call(xhr, result);\n\
      } else {\n\
        dispatch.error.call(xhr, request);\n\
      }\n\
    }\n\
    request.onprogress = function(event) {\n\
      var o = d3.event;\n\
      d3.event = event;\n\
      try {\n\
        dispatch.progress.call(xhr, request);\n\
      } finally {\n\
        d3.event = o;\n\
      }\n\
    };\n\
    xhr.header = function(name, value) {\n\
      name = (name + \"\").toLowerCase();\n\
      if (arguments.length < 2) return headers[name];\n\
      if (value == null) delete headers[name]; else headers[name] = value + \"\";\n\
      return xhr;\n\
    };\n\
    xhr.mimeType = function(value) {\n\
      if (!arguments.length) return mimeType;\n\
      mimeType = value == null ? null : value + \"\";\n\
      return xhr;\n\
    };\n\
    xhr.responseType = function(value) {\n\
      if (!arguments.length) return responseType;\n\
      responseType = value;\n\
      return xhr;\n\
    };\n\
    xhr.response = function(value) {\n\
      response = value;\n\
      return xhr;\n\
    };\n\
    [ \"get\", \"post\" ].forEach(function(method) {\n\
      xhr[method] = function() {\n\
        return xhr.send.apply(xhr, [ method ].concat(d3_array(arguments)));\n\
      };\n\
    });\n\
    xhr.send = function(method, data, callback) {\n\
      if (arguments.length === 2 && typeof data === \"function\") callback = data, data = null;\n\
      request.open(method, url, true);\n\
      if (mimeType != null && !(\"accept\" in headers)) headers[\"accept\"] = mimeType + \",*/*\";\n\
      if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);\n\
      if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);\n\
      if (responseType != null) request.responseType = responseType;\n\
      if (callback != null) xhr.on(\"error\", callback).on(\"load\", function(request) {\n\
        callback(null, request);\n\
      });\n\
      dispatch.beforesend.call(xhr, request);\n\
      request.send(data == null ? null : data);\n\
      return xhr;\n\
    };\n\
    xhr.abort = function() {\n\
      request.abort();\n\
      return xhr;\n\
    };\n\
    d3.rebind(xhr, dispatch, \"on\");\n\
    return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));\n\
  }\n\
  function d3_xhr_fixCallback(callback) {\n\
    return callback.length === 1 ? function(error, request) {\n\
      callback(error == null ? request : null);\n\
    } : callback;\n\
  }\n\
  d3.dsv = function(delimiter, mimeType) {\n\
    var reFormat = new RegExp('[\"' + delimiter + \"\\n\
]\"), delimiterCode = delimiter.charCodeAt(0);\n\
    function dsv(url, row, callback) {\n\
      if (arguments.length < 3) callback = row, row = null;\n\
      var xhr = d3_xhr(url, mimeType, row == null ? response : typedResponse(row), callback);\n\
      xhr.row = function(_) {\n\
        return arguments.length ? xhr.response((row = _) == null ? response : typedResponse(_)) : row;\n\
      };\n\
      return xhr;\n\
    }\n\
    function response(request) {\n\
      return dsv.parse(request.responseText);\n\
    }\n\
    function typedResponse(f) {\n\
      return function(request) {\n\
        return dsv.parse(request.responseText, f);\n\
      };\n\
    }\n\
    dsv.parse = function(text, f) {\n\
      var o;\n\
      return dsv.parseRows(text, function(row, i) {\n\
        if (o) return o(row, i - 1);\n\
        var a = new Function(\"d\", \"return {\" + row.map(function(name, i) {\n\
          return JSON.stringify(name) + \": d[\" + i + \"]\";\n\
        }).join(\",\") + \"}\");\n\
        o = f ? function(row, i) {\n\
          return f(a(row), i);\n\
        } : a;\n\
      });\n\
    };\n\
    dsv.parseRows = function(text, f) {\n\
      var EOL = {}, EOF = {}, rows = [], N = text.length, I = 0, n = 0, t, eol;\n\
      function token() {\n\
        if (I >= N) return EOF;\n\
        if (eol) return eol = false, EOL;\n\
        var j = I;\n\
        if (text.charCodeAt(j) === 34) {\n\
          var i = j;\n\
          while (i++ < N) {\n\
            if (text.charCodeAt(i) === 34) {\n\
              if (text.charCodeAt(i + 1) !== 34) break;\n\
              ++i;\n\
            }\n\
          }\n\
          I = i + 2;\n\
          var c = text.charCodeAt(i + 1);\n\
          if (c === 13) {\n\
            eol = true;\n\
            if (text.charCodeAt(i + 2) === 10) ++I;\n\
          } else if (c === 10) {\n\
            eol = true;\n\
          }\n\
          return text.substring(j + 1, i).replace(/\"\"/g, '\"');\n\
        }\n\
        while (I < N) {\n\
          var c = text.charCodeAt(I++), k = 1;\n\
          if (c === 10) eol = true; else if (c === 13) {\n\
            eol = true;\n\
            if (text.charCodeAt(I) === 10) ++I, ++k;\n\
          } else if (c !== delimiterCode) continue;\n\
          return text.substring(j, I - k);\n\
        }\n\
        return text.substring(j);\n\
      }\n\
      while ((t = token()) !== EOF) {\n\
        var a = [];\n\
        while (t !== EOL && t !== EOF) {\n\
          a.push(t);\n\
          t = token();\n\
        }\n\
        if (f && !(a = f(a, n++))) continue;\n\
        rows.push(a);\n\
      }\n\
      return rows;\n\
    };\n\
    dsv.format = function(rows) {\n\
      if (Array.isArray(rows[0])) return dsv.formatRows(rows);\n\
      var fieldSet = new d3_Set(), fields = [];\n\
      rows.forEach(function(row) {\n\
        for (var field in row) {\n\
          if (!fieldSet.has(field)) {\n\
            fields.push(fieldSet.add(field));\n\
          }\n\
        }\n\
      });\n\
      return [ fields.map(formatValue).join(delimiter) ].concat(rows.map(function(row) {\n\
        return fields.map(function(field) {\n\
          return formatValue(row[field]);\n\
        }).join(delimiter);\n\
      })).join(\"\\n\
\");\n\
    };\n\
    dsv.formatRows = function(rows) {\n\
      return rows.map(formatRow).join(\"\\n\
\");\n\
    };\n\
    function formatRow(row) {\n\
      return row.map(formatValue).join(delimiter);\n\
    }\n\
    function formatValue(text) {\n\
      return reFormat.test(text) ? '\"' + text.replace(/\\\"/g, '\"\"') + '\"' : text;\n\
    }\n\
    return dsv;\n\
  };\n\
  d3.csv = d3.dsv(\",\", \"text/csv\");\n\
  d3.tsv = d3.dsv(\"\t\", \"text/tab-separated-values\");\n\
  var d3_timer_queueHead, d3_timer_queueTail, d3_timer_interval, d3_timer_timeout, d3_timer_active, d3_timer_frame = d3_window[d3_vendorSymbol(d3_window, \"requestAnimationFrame\")] || function(callback) {\n\
    setTimeout(callback, 17);\n\
  };\n\
  d3.timer = function(callback, delay, then) {\n\
    var n = arguments.length;\n\
    if (n < 2) delay = 0;\n\
    if (n < 3) then = Date.now();\n\
    var time = then + delay, timer = {\n\
      c: callback,\n\
      t: time,\n\
      f: false,\n\
      n: null\n\
    };\n\
    if (d3_timer_queueTail) d3_timer_queueTail.n = timer; else d3_timer_queueHead = timer;\n\
    d3_timer_queueTail = timer;\n\
    if (!d3_timer_interval) {\n\
      d3_timer_timeout = clearTimeout(d3_timer_timeout);\n\
      d3_timer_interval = 1;\n\
      d3_timer_frame(d3_timer_step);\n\
    }\n\
  };\n\
  function d3_timer_step() {\n\
    var now = d3_timer_mark(), delay = d3_timer_sweep() - now;\n\
    if (delay > 24) {\n\
      if (isFinite(delay)) {\n\
        clearTimeout(d3_timer_timeout);\n\
        d3_timer_timeout = setTimeout(d3_timer_step, delay);\n\
      }\n\
      d3_timer_interval = 0;\n\
    } else {\n\
      d3_timer_interval = 1;\n\
      d3_timer_frame(d3_timer_step);\n\
    }\n\
  }\n\
  d3.timer.flush = function() {\n\
    d3_timer_mark();\n\
    d3_timer_sweep();\n\
  };\n\
  function d3_timer_mark() {\n\
    var now = Date.now();\n\
    d3_timer_active = d3_timer_queueHead;\n\
    while (d3_timer_active) {\n\
      if (now >= d3_timer_active.t) d3_timer_active.f = d3_timer_active.c(now - d3_timer_active.t);\n\
      d3_timer_active = d3_timer_active.n;\n\
    }\n\
    return now;\n\
  }\n\
  function d3_timer_sweep() {\n\
    var t0, t1 = d3_timer_queueHead, time = Infinity;\n\
    while (t1) {\n\
      if (t1.f) {\n\
        t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;\n\
      } else {\n\
        if (t1.t < time) time = t1.t;\n\
        t1 = (t0 = t1).n;\n\
      }\n\
    }\n\
    d3_timer_queueTail = t0;\n\
    return time;\n\
  }\n\
  var d3_format_decimalPoint = \".\", d3_format_thousandsSeparator = \",\", d3_format_grouping = [ 3, 3 ], d3_format_currencySymbol = \"$\";\n\
  var d3_formatPrefixes = [ \"y\", \"z\", \"a\", \"f\", \"p\", \"n\", \"µ\", \"m\", \"\", \"k\", \"M\", \"G\", \"T\", \"P\", \"E\", \"Z\", \"Y\" ].map(d3_formatPrefix);\n\
  d3.formatPrefix = function(value, precision) {\n\
    var i = 0;\n\
    if (value) {\n\
      if (value < 0) value *= -1;\n\
      if (precision) value = d3.round(value, d3_format_precision(value, precision));\n\
      i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);\n\
      i = Math.max(-24, Math.min(24, Math.floor((i <= 0 ? i + 1 : i - 1) / 3) * 3));\n\
    }\n\
    return d3_formatPrefixes[8 + i / 3];\n\
  };\n\
  function d3_formatPrefix(d, i) {\n\
    var k = Math.pow(10, abs(8 - i) * 3);\n\
    return {\n\
      scale: i > 8 ? function(d) {\n\
        return d / k;\n\
      } : function(d) {\n\
        return d * k;\n\
      },\n\
      symbol: d\n\
    };\n\
  }\n\
  d3.round = function(x, n) {\n\
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);\n\
  };\n\
  d3.format = function(specifier) {\n\
    var match = d3_format_re.exec(specifier), fill = match[1] || \" \", align = match[2] || \">\", sign = match[3] || \"\", symbol = match[4] || \"\", zfill = match[5], width = +match[6], comma = match[7], precision = match[8], type = match[9], scale = 1, suffix = \"\", integer = false;\n\
    if (precision) precision = +precision.substring(1);\n\
    if (zfill || fill === \"0\" && align === \"=\") {\n\
      zfill = fill = \"0\";\n\
      align = \"=\";\n\
      if (comma) width -= Math.floor((width - 1) / 4);\n\
    }\n\
    switch (type) {\n\
     case \"n\":\n\
      comma = true;\n\
      type = \"g\";\n\
      break;\n\
\n\
     case \"%\":\n\
      scale = 100;\n\
      suffix = \"%\";\n\
      type = \"f\";\n\
      break;\n\
\n\
     case \"p\":\n\
      scale = 100;\n\
      suffix = \"%\";\n\
      type = \"r\";\n\
      break;\n\
\n\
     case \"b\":\n\
     case \"o\":\n\
     case \"x\":\n\
     case \"X\":\n\
      if (symbol === \"#\") symbol = \"0\" + type.toLowerCase();\n\
\n\
     case \"c\":\n\
     case \"d\":\n\
      integer = true;\n\
      precision = 0;\n\
      break;\n\
\n\
     case \"s\":\n\
      scale = -1;\n\
      type = \"r\";\n\
      break;\n\
    }\n\
    if (symbol === \"#\") symbol = \"\"; else if (symbol === \"$\") symbol = d3_format_currencySymbol;\n\
    if (type == \"r\" && !precision) type = \"g\";\n\
    if (precision != null) {\n\
      if (type == \"g\") precision = Math.max(1, Math.min(21, precision)); else if (type == \"e\" || type == \"f\") precision = Math.max(0, Math.min(20, precision));\n\
    }\n\
    type = d3_format_types.get(type) || d3_format_typeDefault;\n\
    var zcomma = zfill && comma;\n\
    return function(value) {\n\
      if (integer && value % 1) return \"\";\n\
      var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, \"-\") : sign;\n\
      if (scale < 0) {\n\
        var prefix = d3.formatPrefix(value, precision);\n\
        value = prefix.scale(value);\n\
        suffix = prefix.symbol;\n\
      } else {\n\
        value *= scale;\n\
      }\n\
      value = type(value, precision);\n\
      var i = value.lastIndexOf(\".\"), before = i < 0 ? value : value.substring(0, i), after = i < 0 ? \"\" : d3_format_decimalPoint + value.substring(i + 1);\n\
      if (!zfill && comma) before = d3_format_group(before);\n\
      var length = symbol.length + before.length + after.length + (zcomma ? 0 : negative.length), padding = length < width ? new Array(length = width - length + 1).join(fill) : \"\";\n\
      if (zcomma) before = d3_format_group(padding + before);\n\
      negative += symbol;\n\
      value = before + after;\n\
      return (align === \"<\" ? negative + value + padding : align === \">\" ? padding + negative + value : align === \"^\" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length) : negative + (zcomma ? value : padding + value)) + suffix;\n\
    };\n\
  };\n\
  var d3_format_re = /(?:([^{])?([<>=^]))?([+\\- ])?([$#])?(0)?(\\d+)?(,)?(\\.-?\\d+)?([a-z%])?/i;\n\
  var d3_format_types = d3.map({\n\
    b: function(x) {\n\
      return x.toString(2);\n\
    },\n\
    c: function(x) {\n\
      return String.fromCharCode(x);\n\
    },\n\
    o: function(x) {\n\
      return x.toString(8);\n\
    },\n\
    x: function(x) {\n\
      return x.toString(16);\n\
    },\n\
    X: function(x) {\n\
      return x.toString(16).toUpperCase();\n\
    },\n\
    g: function(x, p) {\n\
      return x.toPrecision(p);\n\
    },\n\
    e: function(x, p) {\n\
      return x.toExponential(p);\n\
    },\n\
    f: function(x, p) {\n\
      return x.toFixed(p);\n\
    },\n\
    r: function(x, p) {\n\
      return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p))));\n\
    }\n\
  });\n\
  function d3_format_precision(x, p) {\n\
    return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);\n\
  }\n\
  function d3_format_typeDefault(x) {\n\
    return x + \"\";\n\
  }\n\
  var d3_format_group = d3_identity;\n\
  if (d3_format_grouping) {\n\
    var d3_format_groupingLength = d3_format_grouping.length;\n\
    d3_format_group = function(value) {\n\
      var i = value.length, t = [], j = 0, g = d3_format_grouping[0];\n\
      while (i > 0 && g > 0) {\n\
        t.push(value.substring(i -= g, i + g));\n\
        g = d3_format_grouping[j = (j + 1) % d3_format_groupingLength];\n\
      }\n\
      return t.reverse().join(d3_format_thousandsSeparator);\n\
    };\n\
  }\n\
  d3.geo = {};\n\
  function d3_adder() {}\n\
  d3_adder.prototype = {\n\
    s: 0,\n\
    t: 0,\n\
    add: function(y) {\n\
      d3_adderSum(y, this.t, d3_adderTemp);\n\
      d3_adderSum(d3_adderTemp.s, this.s, this);\n\
      if (this.s) this.t += d3_adderTemp.t; else this.s = d3_adderTemp.t;\n\
    },\n\
    reset: function() {\n\
      this.s = this.t = 0;\n\
    },\n\
    valueOf: function() {\n\
      return this.s;\n\
    }\n\
  };\n\
  var d3_adderTemp = new d3_adder();\n\
  function d3_adderSum(a, b, o) {\n\
    var x = o.s = a + b, bv = x - a, av = x - bv;\n\
    o.t = a - av + (b - bv);\n\
  }\n\
  d3.geo.stream = function(object, listener) {\n\
    if (object && d3_geo_streamObjectType.hasOwnProperty(object.type)) {\n\
      d3_geo_streamObjectType[object.type](object, listener);\n\
    } else {\n\
      d3_geo_streamGeometry(object, listener);\n\
    }\n\
  };\n\
  function d3_geo_streamGeometry(geometry, listener) {\n\
    if (geometry && d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {\n\
      d3_geo_streamGeometryType[geometry.type](geometry, listener);\n\
    }\n\
  }\n\
  var d3_geo_streamObjectType = {\n\
    Feature: function(feature, listener) {\n\
      d3_geo_streamGeometry(feature.geometry, listener);\n\
    },\n\
    FeatureCollection: function(object, listener) {\n\
      var features = object.features, i = -1, n = features.length;\n\
      while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);\n\
    }\n\
  };\n\
  var d3_geo_streamGeometryType = {\n\
    Sphere: function(object, listener) {\n\
      listener.sphere();\n\
    },\n\
    Point: function(object, listener) {\n\
      object = object.coordinates;\n\
      listener.point(object[0], object[1], object[2]);\n\
    },\n\
    MultiPoint: function(object, listener) {\n\
      var coordinates = object.coordinates, i = -1, n = coordinates.length;\n\
      while (++i < n) object = coordinates[i], listener.point(object[0], object[1], object[2]);\n\
    },\n\
    LineString: function(object, listener) {\n\
      d3_geo_streamLine(object.coordinates, listener, 0);\n\
    },\n\
    MultiLineString: function(object, listener) {\n\
      var coordinates = object.coordinates, i = -1, n = coordinates.length;\n\
      while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);\n\
    },\n\
    Polygon: function(object, listener) {\n\
      d3_geo_streamPolygon(object.coordinates, listener);\n\
    },\n\
    MultiPolygon: function(object, listener) {\n\
      var coordinates = object.coordinates, i = -1, n = coordinates.length;\n\
      while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);\n\
    },\n\
    GeometryCollection: function(object, listener) {\n\
      var geometries = object.geometries, i = -1, n = geometries.length;\n\
      while (++i < n) d3_geo_streamGeometry(geometries[i], listener);\n\
    }\n\
  };\n\
  function d3_geo_streamLine(coordinates, listener, closed) {\n\
    var i = -1, n = coordinates.length - closed, coordinate;\n\
    listener.lineStart();\n\
    while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1], coordinate[2]);\n\
    listener.lineEnd();\n\
  }\n\
  function d3_geo_streamPolygon(coordinates, listener) {\n\
    var i = -1, n = coordinates.length;\n\
    listener.polygonStart();\n\
    while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);\n\
    listener.polygonEnd();\n\
  }\n\
  d3.geo.area = function(object) {\n\
    d3_geo_areaSum = 0;\n\
    d3.geo.stream(object, d3_geo_area);\n\
    return d3_geo_areaSum;\n\
  };\n\
  var d3_geo_areaSum, d3_geo_areaRingSum = new d3_adder();\n\
  var d3_geo_area = {\n\
    sphere: function() {\n\
      d3_geo_areaSum += 4 * π;\n\
    },\n\
    point: d3_noop,\n\
    lineStart: d3_noop,\n\
    lineEnd: d3_noop,\n\
    polygonStart: function() {\n\
      d3_geo_areaRingSum.reset();\n\
      d3_geo_area.lineStart = d3_geo_areaRingStart;\n\
    },\n\
    polygonEnd: function() {\n\
      var area = 2 * d3_geo_areaRingSum;\n\
      d3_geo_areaSum += area < 0 ? 4 * π + area : area;\n\
      d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;\n\
    }\n\
  };\n\
  function d3_geo_areaRingStart() {\n\
    var λ00, φ00, λ0, cosφ0, sinφ0;\n\
    d3_geo_area.point = function(λ, φ) {\n\
      d3_geo_area.point = nextPoint;\n\
      λ0 = (λ00 = λ) * d3_radians, cosφ0 = Math.cos(φ = (φ00 = φ) * d3_radians / 2 + π / 4), \n\
      sinφ0 = Math.sin(φ);\n\
    };\n\
    function nextPoint(λ, φ) {\n\
      λ *= d3_radians;\n\
      φ = φ * d3_radians / 2 + π / 4;\n\
      var dλ = λ - λ0, cosφ = Math.cos(φ), sinφ = Math.sin(φ), k = sinφ0 * sinφ, u = cosφ0 * cosφ + k * Math.cos(dλ), v = k * Math.sin(dλ);\n\
      d3_geo_areaRingSum.add(Math.atan2(v, u));\n\
      λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;\n\
    }\n\
    d3_geo_area.lineEnd = function() {\n\
      nextPoint(λ00, φ00);\n\
    };\n\
  }\n\
  function d3_geo_cartesian(spherical) {\n\
    var λ = spherical[0], φ = spherical[1], cosφ = Math.cos(φ);\n\
    return [ cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ) ];\n\
  }\n\
  function d3_geo_cartesianDot(a, b) {\n\
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];\n\
  }\n\
  function d3_geo_cartesianCross(a, b) {\n\
    return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];\n\
  }\n\
  function d3_geo_cartesianAdd(a, b) {\n\
    a[0] += b[0];\n\
    a[1] += b[1];\n\
    a[2] += b[2];\n\
  }\n\
  function d3_geo_cartesianScale(vector, k) {\n\
    return [ vector[0] * k, vector[1] * k, vector[2] * k ];\n\
  }\n\
  function d3_geo_cartesianNormalize(d) {\n\
    var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);\n\
    d[0] /= l;\n\
    d[1] /= l;\n\
    d[2] /= l;\n\
  }\n\
  function d3_geo_spherical(cartesian) {\n\
    return [ Math.atan2(cartesian[1], cartesian[0]), d3_asin(cartesian[2]) ];\n\
  }\n\
  function d3_geo_sphericalEqual(a, b) {\n\
    return abs(a[0] - b[0]) < ε && abs(a[1] - b[1]) < ε;\n\
  }\n\
  d3.geo.bounds = function() {\n\
    var λ0, φ0, λ1, φ1, λ_, λ__, φ__, p0, dλSum, ranges, range;\n\
    var bound = {\n\
      point: point,\n\
      lineStart: lineStart,\n\
      lineEnd: lineEnd,\n\
      polygonStart: function() {\n\
        bound.point = ringPoint;\n\
        bound.lineStart = ringStart;\n\
        bound.lineEnd = ringEnd;\n\
        dλSum = 0;\n\
        d3_geo_area.polygonStart();\n\
      },\n\
      polygonEnd: function() {\n\
        d3_geo_area.polygonEnd();\n\
        bound.point = point;\n\
        bound.lineStart = lineStart;\n\
        bound.lineEnd = lineEnd;\n\
        if (d3_geo_areaRingSum < 0) λ0 = -(λ1 = 180), φ0 = -(φ1 = 90); else if (dλSum > ε) φ1 = 90; else if (dλSum < -ε) φ0 = -90;\n\
        range[0] = λ0, range[1] = λ1;\n\
      }\n\
    };\n\
    function point(λ, φ) {\n\
      ranges.push(range = [ λ0 = λ, λ1 = λ ]);\n\
      if (φ < φ0) φ0 = φ;\n\
      if (φ > φ1) φ1 = φ;\n\
    }\n\
    function linePoint(λ, φ) {\n\
      var p = d3_geo_cartesian([ λ * d3_radians, φ * d3_radians ]);\n\
      if (p0) {\n\
        var normal = d3_geo_cartesianCross(p0, p), equatorial = [ normal[1], -normal[0], 0 ], inflection = d3_geo_cartesianCross(equatorial, normal);\n\
        d3_geo_cartesianNormalize(inflection);\n\
        inflection = d3_geo_spherical(inflection);\n\
        var dλ = λ - λ_, s = dλ > 0 ? 1 : -1, λi = inflection[0] * d3_degrees * s, antimeridian = abs(dλ) > 180;\n\
        if (antimeridian ^ (s * λ_ < λi && λi < s * λ)) {\n\
          var φi = inflection[1] * d3_degrees;\n\
          if (φi > φ1) φ1 = φi;\n\
        } else if (λi = (λi + 360) % 360 - 180, antimeridian ^ (s * λ_ < λi && λi < s * λ)) {\n\
          var φi = -inflection[1] * d3_degrees;\n\
          if (φi < φ0) φ0 = φi;\n\
        } else {\n\
          if (φ < φ0) φ0 = φ;\n\
          if (φ > φ1) φ1 = φ;\n\
        }\n\
        if (antimeridian) {\n\
          if (λ < λ_) {\n\
            if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;\n\
          } else {\n\
            if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;\n\
          }\n\
        } else {\n\
          if (λ1 >= λ0) {\n\
            if (λ < λ0) λ0 = λ;\n\
            if (λ > λ1) λ1 = λ;\n\
          } else {\n\
            if (λ > λ_) {\n\
              if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;\n\
            } else {\n\
              if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;\n\
            }\n\
          }\n\
        }\n\
      } else {\n\
        point(λ, φ);\n\
      }\n\
      p0 = p, λ_ = λ;\n\
    }\n\
    function lineStart() {\n\
      bound.point = linePoint;\n\
    }\n\
    function lineEnd() {\n\
      range[0] = λ0, range[1] = λ1;\n\
      bound.point = point;\n\
      p0 = null;\n\
    }\n\
    function ringPoint(λ, φ) {\n\
      if (p0) {\n\
        var dλ = λ - λ_;\n\
        dλSum += abs(dλ) > 180 ? dλ + (dλ > 0 ? 360 : -360) : dλ;\n\
      } else λ__ = λ, φ__ = φ;\n\
      d3_geo_area.point(λ, φ);\n\
      linePoint(λ, φ);\n\
    }\n\
    function ringStart() {\n\
      d3_geo_area.lineStart();\n\
    }\n\
    function ringEnd() {\n\
      ringPoint(λ__, φ__);\n\
      d3_geo_area.lineEnd();\n\
      if (abs(dλSum) > ε) λ0 = -(λ1 = 180);\n\
      range[0] = λ0, range[1] = λ1;\n\
      p0 = null;\n\
    }\n\
    function angle(λ0, λ1) {\n\
      return (λ1 -= λ0) < 0 ? λ1 + 360 : λ1;\n\
    }\n\
    function compareRanges(a, b) {\n\
      return a[0] - b[0];\n\
    }\n\
    function withinRange(x, range) {\n\
      return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;\n\
    }\n\
    return function(feature) {\n\
      φ1 = λ1 = -(λ0 = φ0 = Infinity);\n\
      ranges = [];\n\
      d3.geo.stream(feature, bound);\n\
      var n = ranges.length;\n\
      if (n) {\n\
        ranges.sort(compareRanges);\n\
        for (var i = 1, a = ranges[0], b, merged = [ a ]; i < n; ++i) {\n\
          b = ranges[i];\n\
          if (withinRange(b[0], a) || withinRange(b[1], a)) {\n\
            if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];\n\
            if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];\n\
          } else {\n\
            merged.push(a = b);\n\
          }\n\
        }\n\
        var best = -Infinity, dλ;\n\
        for (var n = merged.length - 1, i = 0, a = merged[n], b; i <= n; a = b, ++i) {\n\
          b = merged[i];\n\
          if ((dλ = angle(a[1], b[0])) > best) best = dλ, λ0 = b[0], λ1 = a[1];\n\
        }\n\
      }\n\
      ranges = range = null;\n\
      return λ0 === Infinity || φ0 === Infinity ? [ [ NaN, NaN ], [ NaN, NaN ] ] : [ [ λ0, φ0 ], [ λ1, φ1 ] ];\n\
    };\n\
  }();\n\
  d3.geo.centroid = function(object) {\n\
    d3_geo_centroidW0 = d3_geo_centroidW1 = d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;\n\
    d3.geo.stream(object, d3_geo_centroid);\n\
    var x = d3_geo_centroidX2, y = d3_geo_centroidY2, z = d3_geo_centroidZ2, m = x * x + y * y + z * z;\n\
    if (m < ε2) {\n\
      x = d3_geo_centroidX1, y = d3_geo_centroidY1, z = d3_geo_centroidZ1;\n\
      if (d3_geo_centroidW1 < ε) x = d3_geo_centroidX0, y = d3_geo_centroidY0, z = d3_geo_centroidZ0;\n\
      m = x * x + y * y + z * z;\n\
      if (m < ε2) return [ NaN, NaN ];\n\
    }\n\
    return [ Math.atan2(y, x) * d3_degrees, d3_asin(z / Math.sqrt(m)) * d3_degrees ];\n\
  };\n\
  var d3_geo_centroidW0, d3_geo_centroidW1, d3_geo_centroidX0, d3_geo_centroidY0, d3_geo_centroidZ0, d3_geo_centroidX1, d3_geo_centroidY1, d3_geo_centroidZ1, d3_geo_centroidX2, d3_geo_centroidY2, d3_geo_centroidZ2;\n\
  var d3_geo_centroid = {\n\
    sphere: d3_noop,\n\
    point: d3_geo_centroidPoint,\n\
    lineStart: d3_geo_centroidLineStart,\n\
    lineEnd: d3_geo_centroidLineEnd,\n\
    polygonStart: function() {\n\
      d3_geo_centroid.lineStart = d3_geo_centroidRingStart;\n\
    },\n\
    polygonEnd: function() {\n\
      d3_geo_centroid.lineStart = d3_geo_centroidLineStart;\n\
    }\n\
  };\n\
  function d3_geo_centroidPoint(λ, φ) {\n\
    λ *= d3_radians;\n\
    var cosφ = Math.cos(φ *= d3_radians);\n\
    d3_geo_centroidPointXYZ(cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ));\n\
  }\n\
  function d3_geo_centroidPointXYZ(x, y, z) {\n\
    ++d3_geo_centroidW0;\n\
    d3_geo_centroidX0 += (x - d3_geo_centroidX0) / d3_geo_centroidW0;\n\
    d3_geo_centroidY0 += (y - d3_geo_centroidY0) / d3_geo_centroidW0;\n\
    d3_geo_centroidZ0 += (z - d3_geo_centroidZ0) / d3_geo_centroidW0;\n\
  }\n\
  function d3_geo_centroidLineStart() {\n\
    var x0, y0, z0;\n\
    d3_geo_centroid.point = function(λ, φ) {\n\
      λ *= d3_radians;\n\
      var cosφ = Math.cos(φ *= d3_radians);\n\
      x0 = cosφ * Math.cos(λ);\n\
      y0 = cosφ * Math.sin(λ);\n\
      z0 = Math.sin(φ);\n\
      d3_geo_centroid.point = nextPoint;\n\
      d3_geo_centroidPointXYZ(x0, y0, z0);\n\
    };\n\
    function nextPoint(λ, φ) {\n\
      λ *= d3_radians;\n\
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), w = Math.atan2(Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);\n\
      d3_geo_centroidW1 += w;\n\
      d3_geo_centroidX1 += w * (x0 + (x0 = x));\n\
      d3_geo_centroidY1 += w * (y0 + (y0 = y));\n\
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));\n\
      d3_geo_centroidPointXYZ(x0, y0, z0);\n\
    }\n\
  }\n\
  function d3_geo_centroidLineEnd() {\n\
    d3_geo_centroid.point = d3_geo_centroidPoint;\n\
  }\n\
  function d3_geo_centroidRingStart() {\n\
    var λ00, φ00, x0, y0, z0;\n\
    d3_geo_centroid.point = function(λ, φ) {\n\
      λ00 = λ, φ00 = φ;\n\
      d3_geo_centroid.point = nextPoint;\n\
      λ *= d3_radians;\n\
      var cosφ = Math.cos(φ *= d3_radians);\n\
      x0 = cosφ * Math.cos(λ);\n\
      y0 = cosφ * Math.sin(λ);\n\
      z0 = Math.sin(φ);\n\
      d3_geo_centroidPointXYZ(x0, y0, z0);\n\
    };\n\
    d3_geo_centroid.lineEnd = function() {\n\
      nextPoint(λ00, φ00);\n\
      d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;\n\
      d3_geo_centroid.point = d3_geo_centroidPoint;\n\
    };\n\
    function nextPoint(λ, φ) {\n\
      λ *= d3_radians;\n\
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), cx = y0 * z - z0 * y, cy = z0 * x - x0 * z, cz = x0 * y - y0 * x, m = Math.sqrt(cx * cx + cy * cy + cz * cz), u = x0 * x + y0 * y + z0 * z, v = m && -d3_acos(u) / m, w = Math.atan2(m, u);\n\
      d3_geo_centroidX2 += v * cx;\n\
      d3_geo_centroidY2 += v * cy;\n\
      d3_geo_centroidZ2 += v * cz;\n\
      d3_geo_centroidW1 += w;\n\
      d3_geo_centroidX1 += w * (x0 + (x0 = x));\n\
      d3_geo_centroidY1 += w * (y0 + (y0 = y));\n\
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));\n\
      d3_geo_centroidPointXYZ(x0, y0, z0);\n\
    }\n\
  }\n\
  function d3_true() {\n\
    return true;\n\
  }\n\
  function d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener) {\n\
    var subject = [], clip = [];\n\
    segments.forEach(function(segment) {\n\
      if ((n = segment.length - 1) <= 0) return;\n\
      var n, p0 = segment[0], p1 = segment[n];\n\
      if (d3_geo_sphericalEqual(p0, p1)) {\n\
        listener.lineStart();\n\
        for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);\n\
        listener.lineEnd();\n\
        return;\n\
      }\n\
      var a = new d3_geo_clipPolygonIntersection(p0, segment, null, true), b = new d3_geo_clipPolygonIntersection(p0, null, a, false);\n\
      a.o = b;\n\
      subject.push(a);\n\
      clip.push(b);\n\
      a = new d3_geo_clipPolygonIntersection(p1, segment, null, false);\n\
      b = new d3_geo_clipPolygonIntersection(p1, null, a, true);\n\
      a.o = b;\n\
      subject.push(a);\n\
      clip.push(b);\n\
    });\n\
    clip.sort(compare);\n\
    d3_geo_clipPolygonLinkCircular(subject);\n\
    d3_geo_clipPolygonLinkCircular(clip);\n\
    if (!subject.length) return;\n\
    for (var i = 0, entry = clipStartInside, n = clip.length; i < n; ++i) {\n\
      clip[i].e = entry = !entry;\n\
    }\n\
    var start = subject[0], points, point;\n\
    while (1) {\n\
      var current = start, isSubject = true;\n\
      while (current.v) if ((current = current.n) === start) return;\n\
      points = current.z;\n\
      listener.lineStart();\n\
      do {\n\
        current.v = current.o.v = true;\n\
        if (current.e) {\n\
          if (isSubject) {\n\
            for (var i = 0, n = points.length; i < n; ++i) listener.point((point = points[i])[0], point[1]);\n\
          } else {\n\
            interpolate(current.x, current.n.x, 1, listener);\n\
          }\n\
          current = current.n;\n\
        } else {\n\
          if (isSubject) {\n\
            points = current.p.z;\n\
            for (var i = points.length - 1; i >= 0; --i) listener.point((point = points[i])[0], point[1]);\n\
          } else {\n\
            interpolate(current.x, current.p.x, -1, listener);\n\
          }\n\
          current = current.p;\n\
        }\n\
        current = current.o;\n\
        points = current.z;\n\
        isSubject = !isSubject;\n\
      } while (!current.v);\n\
      listener.lineEnd();\n\
    }\n\
  }\n\
  function d3_geo_clipPolygonLinkCircular(array) {\n\
    if (!(n = array.length)) return;\n\
    var n, i = 0, a = array[0], b;\n\
    while (++i < n) {\n\
      a.n = b = array[i];\n\
      b.p = a;\n\
      a = b;\n\
    }\n\
    a.n = b = array[0];\n\
    b.p = a;\n\
  }\n\
  function d3_geo_clipPolygonIntersection(point, points, other, entry) {\n\
    this.x = point;\n\
    this.z = points;\n\
    this.o = other;\n\
    this.e = entry;\n\
    this.v = false;\n\
    this.n = this.p = null;\n\
  }\n\
  function d3_geo_clip(pointVisible, clipLine, interpolate, clipStart) {\n\
    return function(rotate, listener) {\n\
      var line = clipLine(listener), rotatedClipStart = rotate.invert(clipStart[0], clipStart[1]);\n\
      var clip = {\n\
        point: point,\n\
        lineStart: lineStart,\n\
        lineEnd: lineEnd,\n\
        polygonStart: function() {\n\
          clip.point = pointRing;\n\
          clip.lineStart = ringStart;\n\
          clip.lineEnd = ringEnd;\n\
          segments = [];\n\
          polygon = [];\n\
          listener.polygonStart();\n\
        },\n\
        polygonEnd: function() {\n\
          clip.point = point;\n\
          clip.lineStart = lineStart;\n\
          clip.lineEnd = lineEnd;\n\
          segments = d3.merge(segments);\n\
          var clipStartInside = d3_geo_pointInPolygon(rotatedClipStart, polygon);\n\
          if (segments.length) {\n\
            d3_geo_clipPolygon(segments, d3_geo_clipSort, clipStartInside, interpolate, listener);\n\
          } else if (clipStartInside) {\n\
            listener.lineStart();\n\
            interpolate(null, null, 1, listener);\n\
            listener.lineEnd();\n\
          }\n\
          listener.polygonEnd();\n\
          segments = polygon = null;\n\
        },\n\
        sphere: function() {\n\
          listener.polygonStart();\n\
          listener.lineStart();\n\
          interpolate(null, null, 1, listener);\n\
          listener.lineEnd();\n\
          listener.polygonEnd();\n\
        }\n\
      };\n\
      function point(λ, φ) {\n\
        var point = rotate(λ, φ);\n\
        if (pointVisible(λ = point[0], φ = point[1])) listener.point(λ, φ);\n\
      }\n\
      function pointLine(λ, φ) {\n\
        var point = rotate(λ, φ);\n\
        line.point(point[0], point[1]);\n\
      }\n\
      function lineStart() {\n\
        clip.point = pointLine;\n\
        line.lineStart();\n\
      }\n\
      function lineEnd() {\n\
        clip.point = point;\n\
        line.lineEnd();\n\
      }\n\
      var segments;\n\
      var buffer = d3_geo_clipBufferListener(), ringListener = clipLine(buffer), polygon, ring;\n\
      function pointRing(λ, φ) {\n\
        ring.push([ λ, φ ]);\n\
        var point = rotate(λ, φ);\n\
        ringListener.point(point[0], point[1]);\n\
      }\n\
      function ringStart() {\n\
        ringListener.lineStart();\n\
        ring = [];\n\
      }\n\
      function ringEnd() {\n\
        pointRing(ring[0][0], ring[0][1]);\n\
        ringListener.lineEnd();\n\
        var clean = ringListener.clean(), ringSegments = buffer.buffer(), segment, n = ringSegments.length;\n\
        ring.pop();\n\
        polygon.push(ring);\n\
        ring = null;\n\
        if (!n) return;\n\
        if (clean & 1) {\n\
          segment = ringSegments[0];\n\
          var n = segment.length - 1, i = -1, point;\n\
          listener.lineStart();\n\
          while (++i < n) listener.point((point = segment[i])[0], point[1]);\n\
          listener.lineEnd();\n\
          return;\n\
        }\n\
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));\n\
        segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));\n\
      }\n\
      return clip;\n\
    };\n\
  }\n\
  function d3_geo_clipSegmentLength1(segment) {\n\
    return segment.length > 1;\n\
  }\n\
  function d3_geo_clipBufferListener() {\n\
    var lines = [], line;\n\
    return {\n\
      lineStart: function() {\n\
        lines.push(line = []);\n\
      },\n\
      point: function(λ, φ) {\n\
        line.push([ λ, φ ]);\n\
      },\n\
      lineEnd: d3_noop,\n\
      buffer: function() {\n\
        var buffer = lines;\n\
        lines = [];\n\
        line = null;\n\
        return buffer;\n\
      },\n\
      rejoin: function() {\n\
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));\n\
      }\n\
    };\n\
  }\n\
  function d3_geo_clipSort(a, b) {\n\
    return ((a = a.x)[0] < 0 ? a[1] - halfπ - ε : halfπ - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfπ - ε : halfπ - b[1]);\n\
  }\n\
  function d3_geo_pointInPolygon(point, polygon) {\n\
    var meridian = point[0], parallel = point[1], meridianNormal = [ Math.sin(meridian), -Math.cos(meridian), 0 ], polarAngle = 0, winding = 0;\n\
    d3_geo_areaRingSum.reset();\n\
    for (var i = 0, n = polygon.length; i < n; ++i) {\n\
      var ring = polygon[i], m = ring.length;\n\
      if (!m) continue;\n\
      var point0 = ring[0], λ0 = point0[0], φ0 = point0[1] / 2 + π / 4, sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), j = 1;\n\
      while (true) {\n\
        if (j === m) j = 0;\n\
        point = ring[j];\n\
        var λ = point[0], φ = point[1] / 2 + π / 4, sinφ = Math.sin(φ), cosφ = Math.cos(φ), dλ = λ - λ0, antimeridian = abs(dλ) > π, k = sinφ0 * sinφ;\n\
        d3_geo_areaRingSum.add(Math.atan2(k * Math.sin(dλ), cosφ0 * cosφ + k * Math.cos(dλ)));\n\
        polarAngle += antimeridian ? dλ + (dλ >= 0 ? τ : -τ) : dλ;\n\
        if (antimeridian ^ λ0 >= meridian ^ λ >= meridian) {\n\
          var arc = d3_geo_cartesianCross(d3_geo_cartesian(point0), d3_geo_cartesian(point));\n\
          d3_geo_cartesianNormalize(arc);\n\
          var intersection = d3_geo_cartesianCross(meridianNormal, arc);\n\
          d3_geo_cartesianNormalize(intersection);\n\
          var φarc = (antimeridian ^ dλ >= 0 ? -1 : 1) * d3_asin(intersection[2]);\n\
          if (parallel > φarc || parallel === φarc && (arc[0] || arc[1])) {\n\
            winding += antimeridian ^ dλ >= 0 ? 1 : -1;\n\
          }\n\
        }\n\
        if (!j++) break;\n\
        λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ, point0 = point;\n\
      }\n\
    }\n\
    return (polarAngle < -ε || polarAngle < ε && d3_geo_areaRingSum < 0) ^ winding & 1;\n\
  }\n\
  var d3_geo_clipAntimeridian = d3_geo_clip(d3_true, d3_geo_clipAntimeridianLine, d3_geo_clipAntimeridianInterpolate, [ -π, -π / 2 ]);\n\
  function d3_geo_clipAntimeridianLine(listener) {\n\
    var λ0 = NaN, φ0 = NaN, sλ0 = NaN, clean;\n\
    return {\n\
      lineStart: function() {\n\
        listener.lineStart();\n\
        clean = 1;\n\
      },\n\
      point: function(λ1, φ1) {\n\
        var sλ1 = λ1 > 0 ? π : -π, dλ = abs(λ1 - λ0);\n\
        if (abs(dλ - π) < ε) {\n\
          listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? halfπ : -halfπ);\n\
          listener.point(sλ0, φ0);\n\
          listener.lineEnd();\n\
          listener.lineStart();\n\
          listener.point(sλ1, φ0);\n\
          listener.point(λ1, φ0);\n\
          clean = 0;\n\
        } else if (sλ0 !== sλ1 && dλ >= π) {\n\
          if (abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;\n\
          if (abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;\n\
          φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);\n\
          listener.point(sλ0, φ0);\n\
          listener.lineEnd();\n\
          listener.lineStart();\n\
          listener.point(sλ1, φ0);\n\
          clean = 0;\n\
        }\n\
        listener.point(λ0 = λ1, φ0 = φ1);\n\
        sλ0 = sλ1;\n\
      },\n\
      lineEnd: function() {\n\
        listener.lineEnd();\n\
        λ0 = φ0 = NaN;\n\
      },\n\
      clean: function() {\n\
        return 2 - clean;\n\
      }\n\
    };\n\
  }\n\
  function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {\n\
    var cosφ0, cosφ1, sinλ0_λ1 = Math.sin(λ0 - λ1);\n\
    return abs(sinλ0_λ1) > ε ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1) - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0)) / (cosφ0 * cosφ1 * sinλ0_λ1)) : (φ0 + φ1) / 2;\n\
  }\n\
  function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {\n\
    var φ;\n\
    if (from == null) {\n\
      φ = direction * halfπ;\n\
      listener.point(-π, φ);\n\
      listener.point(0, φ);\n\
      listener.point(π, φ);\n\
      listener.point(π, 0);\n\
      listener.point(π, -φ);\n\
      listener.point(0, -φ);\n\
      listener.point(-π, -φ);\n\
      listener.point(-π, 0);\n\
      listener.point(-π, φ);\n\
    } else if (abs(from[0] - to[0]) > ε) {\n\
      var s = from[0] < to[0] ? π : -π;\n\
      φ = direction * s / 2;\n\
      listener.point(-s, φ);\n\
      listener.point(0, φ);\n\
      listener.point(s, φ);\n\
    } else {\n\
      listener.point(to[0], to[1]);\n\
    }\n\
  }\n\
  function d3_geo_clipCircle(radius) {\n\
    var cr = Math.cos(radius), smallRadius = cr > 0, notHemisphere = abs(cr) > ε, interpolate = d3_geo_circleInterpolate(radius, 6 * d3_radians);\n\
    return d3_geo_clip(visible, clipLine, interpolate, smallRadius ? [ 0, -radius ] : [ -π, radius - π ]);\n\
    function visible(λ, φ) {\n\
      return Math.cos(λ) * Math.cos(φ) > cr;\n\
    }\n\
    function clipLine(listener) {\n\
      var point0, c0, v0, v00, clean;\n\
      return {\n\
        lineStart: function() {\n\
          v00 = v0 = false;\n\
          clean = 1;\n\
        },\n\
        point: function(λ, φ) {\n\
          var point1 = [ λ, φ ], point2, v = visible(λ, φ), c = smallRadius ? v ? 0 : code(λ, φ) : v ? code(λ + (λ < 0 ? π : -π), φ) : 0;\n\
          if (!point0 && (v00 = v0 = v)) listener.lineStart();\n\
          if (v !== v0) {\n\
            point2 = intersect(point0, point1);\n\
            if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {\n\
              point1[0] += ε;\n\
              point1[1] += ε;\n\
              v = visible(point1[0], point1[1]);\n\
            }\n\
          }\n\
          if (v !== v0) {\n\
            clean = 0;\n\
            if (v) {\n\
              listener.lineStart();\n\
              point2 = intersect(point1, point0);\n\
              listener.point(point2[0], point2[1]);\n\
            } else {\n\
              point2 = intersect(point0, point1);\n\
              listener.point(point2[0], point2[1]);\n\
              listener.lineEnd();\n\
            }\n\
            point0 = point2;\n\
          } else if (notHemisphere && point0 && smallRadius ^ v) {\n\
            var t;\n\
            if (!(c & c0) && (t = intersect(point1, point0, true))) {\n\
              clean = 0;\n\
              if (smallRadius) {\n\
                listener.lineStart();\n\
                listener.point(t[0][0], t[0][1]);\n\
                listener.point(t[1][0], t[1][1]);\n\
                listener.lineEnd();\n\
              } else {\n\
                listener.point(t[1][0], t[1][1]);\n\
                listener.lineEnd();\n\
                listener.lineStart();\n\
                listener.point(t[0][0], t[0][1]);\n\
              }\n\
            }\n\
          }\n\
          if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) {\n\
            listener.point(point1[0], point1[1]);\n\
          }\n\
          point0 = point1, v0 = v, c0 = c;\n\
        },\n\
        lineEnd: function() {\n\
          if (v0) listener.lineEnd();\n\
          point0 = null;\n\
        },\n\
        clean: function() {\n\
          return clean | (v00 && v0) << 1;\n\
        }\n\
      };\n\
    }\n\
    function intersect(a, b, two) {\n\
      var pa = d3_geo_cartesian(a), pb = d3_geo_cartesian(b);\n\
      var n1 = [ 1, 0, 0 ], n2 = d3_geo_cartesianCross(pa, pb), n2n2 = d3_geo_cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;\n\
      if (!determinant) return !two && a;\n\
      var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = d3_geo_cartesianCross(n1, n2), A = d3_geo_cartesianScale(n1, c1), B = d3_geo_cartesianScale(n2, c2);\n\
      d3_geo_cartesianAdd(A, B);\n\
      var u = n1xn2, w = d3_geo_cartesianDot(A, u), uu = d3_geo_cartesianDot(u, u), t2 = w * w - uu * (d3_geo_cartesianDot(A, A) - 1);\n\
      if (t2 < 0) return;\n\
      var t = Math.sqrt(t2), q = d3_geo_cartesianScale(u, (-w - t) / uu);\n\
      d3_geo_cartesianAdd(q, A);\n\
      q = d3_geo_spherical(q);\n\
      if (!two) return q;\n\
      var λ0 = a[0], λ1 = b[0], φ0 = a[1], φ1 = b[1], z;\n\
      if (λ1 < λ0) z = λ0, λ0 = λ1, λ1 = z;\n\
      var δλ = λ1 - λ0, polar = abs(δλ - π) < ε, meridian = polar || δλ < ε;\n\
      if (!polar && φ1 < φ0) z = φ0, φ0 = φ1, φ1 = z;\n\
      if (meridian ? polar ? φ0 + φ1 > 0 ^ q[1] < (abs(q[0] - λ0) < ε ? φ0 : φ1) : φ0 <= q[1] && q[1] <= φ1 : δλ > π ^ (λ0 <= q[0] && q[0] <= λ1)) {\n\
        var q1 = d3_geo_cartesianScale(u, (-w + t) / uu);\n\
        d3_geo_cartesianAdd(q1, A);\n\
        return [ q, d3_geo_spherical(q1) ];\n\
      }\n\
    }\n\
    function code(λ, φ) {\n\
      var r = smallRadius ? radius : π - radius, code = 0;\n\
      if (λ < -r) code |= 1; else if (λ > r) code |= 2;\n\
      if (φ < -r) code |= 4; else if (φ > r) code |= 8;\n\
      return code;\n\
    }\n\
  }\n\
  function d3_geom_clipLine(x0, y0, x1, y1) {\n\
    return function(line) {\n\
      var a = line.a, b = line.b, ax = a.x, ay = a.y, bx = b.x, by = b.y, t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay, r;\n\
      r = x0 - ax;\n\
      if (!dx && r > 0) return;\n\
      r /= dx;\n\
      if (dx < 0) {\n\
        if (r < t0) return;\n\
        if (r < t1) t1 = r;\n\
      } else if (dx > 0) {\n\
        if (r > t1) return;\n\
        if (r > t0) t0 = r;\n\
      }\n\
      r = x1 - ax;\n\
      if (!dx && r < 0) return;\n\
      r /= dx;\n\
      if (dx < 0) {\n\
        if (r > t1) return;\n\
        if (r > t0) t0 = r;\n\
      } else if (dx > 0) {\n\
        if (r < t0) return;\n\
        if (r < t1) t1 = r;\n\
      }\n\
      r = y0 - ay;\n\
      if (!dy && r > 0) return;\n\
      r /= dy;\n\
      if (dy < 0) {\n\
        if (r < t0) return;\n\
        if (r < t1) t1 = r;\n\
      } else if (dy > 0) {\n\
        if (r > t1) return;\n\
        if (r > t0) t0 = r;\n\
      }\n\
      r = y1 - ay;\n\
      if (!dy && r < 0) return;\n\
      r /= dy;\n\
      if (dy < 0) {\n\
        if (r > t1) return;\n\
        if (r > t0) t0 = r;\n\
      } else if (dy > 0) {\n\
        if (r < t0) return;\n\
        if (r < t1) t1 = r;\n\
      }\n\
      if (t0 > 0) line.a = {\n\
        x: ax + t0 * dx,\n\
        y: ay + t0 * dy\n\
      };\n\
      if (t1 < 1) line.b = {\n\
        x: ax + t1 * dx,\n\
        y: ay + t1 * dy\n\
      };\n\
      return line;\n\
    };\n\
  }\n\
  var d3_geo_clipExtentMAX = 1e9;\n\
  d3.geo.clipExtent = function() {\n\
    var x0, y0, x1, y1, stream, clip, clipExtent = {\n\
      stream: function(output) {\n\
        if (stream) stream.valid = false;\n\
        stream = clip(output);\n\
        stream.valid = true;\n\
        return stream;\n\
      },\n\
      extent: function(_) {\n\
        if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];\n\
        clip = d3_geo_clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]);\n\
        if (stream) stream.valid = false, stream = null;\n\
        return clipExtent;\n\
      }\n\
    };\n\
    return clipExtent.extent([ [ 0, 0 ], [ 960, 500 ] ]);\n\
  };\n\
  function d3_geo_clipExtent(x0, y0, x1, y1) {\n\
    return function(listener) {\n\
      var listener_ = listener, bufferListener = d3_geo_clipBufferListener(), clipLine = d3_geom_clipLine(x0, y0, x1, y1), segments, polygon, ring;\n\
      var clip = {\n\
        point: point,\n\
        lineStart: lineStart,\n\
        lineEnd: lineEnd,\n\
        polygonStart: function() {\n\
          listener = bufferListener;\n\
          segments = [];\n\
          polygon = [];\n\
          clean = true;\n\
        },\n\
        polygonEnd: function() {\n\
          listener = listener_;\n\
          segments = d3.merge(segments);\n\
          var clipStartInside = insidePolygon([ x0, y1 ]), inside = clean && clipStartInside, visible = segments.length;\n\
          if (inside || visible) {\n\
            listener.polygonStart();\n\
            if (inside) {\n\
              listener.lineStart();\n\
              interpolate(null, null, 1, listener);\n\
              listener.lineEnd();\n\
            }\n\
            if (visible) {\n\
              d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener);\n\
            }\n\
            listener.polygonEnd();\n\
          }\n\
          segments = polygon = ring = null;\n\
        }\n\
      };\n\
      function insidePolygon(p) {\n\
        var wn = 0, n = polygon.length, y = p[1];\n\
        for (var i = 0; i < n; ++i) {\n\
          for (var j = 1, v = polygon[i], m = v.length, a = v[0], b; j < m; ++j) {\n\
            b = v[j];\n\
            if (a[1] <= y) {\n\
              if (b[1] > y && isLeft(a, b, p) > 0) ++wn;\n\
            } else {\n\
              if (b[1] <= y && isLeft(a, b, p) < 0) --wn;\n\
            }\n\
            a = b;\n\
          }\n\
        }\n\
        return wn !== 0;\n\
      }\n\
      function isLeft(a, b, c) {\n\
        return (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);\n\
      }\n\
      function interpolate(from, to, direction, listener) {\n\
        var a = 0, a1 = 0;\n\
        if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoints(from, to) < 0 ^ direction > 0) {\n\
          do {\n\
            listener.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);\n\
          } while ((a = (a + direction + 4) % 4) !== a1);\n\
        } else {\n\
          listener.point(to[0], to[1]);\n\
        }\n\
      }\n\
      function pointVisible(x, y) {\n\
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;\n\
      }\n\
      function point(x, y) {\n\
        if (pointVisible(x, y)) listener.point(x, y);\n\
      }\n\
      var x__, y__, v__, x_, y_, v_, first, clean;\n\
      function lineStart() {\n\
        clip.point = linePoint;\n\
        if (polygon) polygon.push(ring = []);\n\
        first = true;\n\
        v_ = false;\n\
        x_ = y_ = NaN;\n\
      }\n\
      function lineEnd() {\n\
        if (segments) {\n\
          linePoint(x__, y__);\n\
          if (v__ && v_) bufferListener.rejoin();\n\
          segments.push(bufferListener.buffer());\n\
        }\n\
        clip.point = point;\n\
        if (v_) listener.lineEnd();\n\
      }\n\
      function linePoint(x, y) {\n\
        x = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, x));\n\
        y = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, y));\n\
        var v = pointVisible(x, y);\n\
        if (polygon) ring.push([ x, y ]);\n\
        if (first) {\n\
          x__ = x, y__ = y, v__ = v;\n\
          first = false;\n\
          if (v) {\n\
            listener.lineStart();\n\
            listener.point(x, y);\n\
          }\n\
        } else {\n\
          if (v && v_) listener.point(x, y); else {\n\
            var l = {\n\
              a: {\n\
                x: x_,\n\
                y: y_\n\
              },\n\
              b: {\n\
                x: x,\n\
                y: y\n\
              }\n\
            };\n\
            if (clipLine(l)) {\n\
              if (!v_) {\n\
                listener.lineStart();\n\
                listener.point(l.a.x, l.a.y);\n\
              }\n\
              listener.point(l.b.x, l.b.y);\n\
              if (!v) listener.lineEnd();\n\
              clean = false;\n\
            } else if (v) {\n\
              listener.lineStart();\n\
              listener.point(x, y);\n\
              clean = false;\n\
            }\n\
          }\n\
        }\n\
        x_ = x, y_ = y, v_ = v;\n\
      }\n\
      return clip;\n\
    };\n\
    function corner(p, direction) {\n\
      return abs(p[0] - x0) < ε ? direction > 0 ? 0 : 3 : abs(p[0] - x1) < ε ? direction > 0 ? 2 : 1 : abs(p[1] - y0) < ε ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;\n\
    }\n\
    function compare(a, b) {\n\
      return comparePoints(a.x, b.x);\n\
    }\n\
    function comparePoints(a, b) {\n\
      var ca = corner(a, 1), cb = corner(b, 1);\n\
      return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];\n\
    }\n\
  }\n\
  function d3_geo_compose(a, b) {\n\
    function compose(x, y) {\n\
      return x = a(x, y), b(x[0], x[1]);\n\
    }\n\
    if (a.invert && b.invert) compose.invert = function(x, y) {\n\
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);\n\
    };\n\
    return compose;\n\
  }\n\
  function d3_geo_conic(projectAt) {\n\
    var φ0 = 0, φ1 = π / 3, m = d3_geo_projectionMutator(projectAt), p = m(φ0, φ1);\n\
    p.parallels = function(_) {\n\
      if (!arguments.length) return [ φ0 / π * 180, φ1 / π * 180 ];\n\
      return m(φ0 = _[0] * π / 180, φ1 = _[1] * π / 180);\n\
    };\n\
    return p;\n\
  }\n\
  function d3_geo_conicEqualArea(φ0, φ1) {\n\
    var sinφ0 = Math.sin(φ0), n = (sinφ0 + Math.sin(φ1)) / 2, C = 1 + sinφ0 * (2 * n - sinφ0), ρ0 = Math.sqrt(C) / n;\n\
    function forward(λ, φ) {\n\
      var ρ = Math.sqrt(C - 2 * n * Math.sin(φ)) / n;\n\
      return [ ρ * Math.sin(λ *= n), ρ0 - ρ * Math.cos(λ) ];\n\
    }\n\
    forward.invert = function(x, y) {\n\
      var ρ0_y = ρ0 - y;\n\
      return [ Math.atan2(x, ρ0_y) / n, d3_asin((C - (x * x + ρ0_y * ρ0_y) * n * n) / (2 * n)) ];\n\
    };\n\
    return forward;\n\
  }\n\
  (d3.geo.conicEqualArea = function() {\n\
    return d3_geo_conic(d3_geo_conicEqualArea);\n\
  }).raw = d3_geo_conicEqualArea;\n\
  d3.geo.albers = function() {\n\
    return d3.geo.conicEqualArea().rotate([ 96, 0 ]).center([ -.6, 38.7 ]).parallels([ 29.5, 45.5 ]).scale(1070);\n\
  };\n\
  d3.geo.albersUsa = function() {\n\
    var lower48 = d3.geo.albers();\n\
    var alaska = d3.geo.conicEqualArea().rotate([ 154, 0 ]).center([ -2, 58.5 ]).parallels([ 55, 65 ]);\n\
    var hawaii = d3.geo.conicEqualArea().rotate([ 157, 0 ]).center([ -3, 19.9 ]).parallels([ 8, 18 ]);\n\
    var point, pointStream = {\n\
      point: function(x, y) {\n\
        point = [ x, y ];\n\
      }\n\
    }, lower48Point, alaskaPoint, hawaiiPoint;\n\
    function albersUsa(coordinates) {\n\
      var x = coordinates[0], y = coordinates[1];\n\
      point = null;\n\
      (lower48Point(x, y), point) || (alaskaPoint(x, y), point) || hawaiiPoint(x, y);\n\
      return point;\n\
    }\n\
    albersUsa.invert = function(coordinates) {\n\
      var k = lower48.scale(), t = lower48.translate(), x = (coordinates[0] - t[0]) / k, y = (coordinates[1] - t[1]) / k;\n\
      return (y >= .12 && y < .234 && x >= -.425 && x < -.214 ? alaska : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii : lower48).invert(coordinates);\n\
    };\n\
    albersUsa.stream = function(stream) {\n\
      var lower48Stream = lower48.stream(stream), alaskaStream = alaska.stream(stream), hawaiiStream = hawaii.stream(stream);\n\
      return {\n\
        point: function(x, y) {\n\
          lower48Stream.point(x, y);\n\
          alaskaStream.point(x, y);\n\
          hawaiiStream.point(x, y);\n\
        },\n\
        sphere: function() {\n\
          lower48Stream.sphere();\n\
          alaskaStream.sphere();\n\
          hawaiiStream.sphere();\n\
        },\n\
        lineStart: function() {\n\
          lower48Stream.lineStart();\n\
          alaskaStream.lineStart();\n\
          hawaiiStream.lineStart();\n\
        },\n\
        lineEnd: function() {\n\
          lower48Stream.lineEnd();\n\
          alaskaStream.lineEnd();\n\
          hawaiiStream.lineEnd();\n\
        },\n\
        polygonStart: function() {\n\
          lower48Stream.polygonStart();\n\
          alaskaStream.polygonStart();\n\
          hawaiiStream.polygonStart();\n\
        },\n\
        polygonEnd: function() {\n\
          lower48Stream.polygonEnd();\n\
          alaskaStream.polygonEnd();\n\
          hawaiiStream.polygonEnd();\n\
        }\n\
      };\n\
    };\n\
    albersUsa.precision = function(_) {\n\
      if (!arguments.length) return lower48.precision();\n\
      lower48.precision(_);\n\
      alaska.precision(_);\n\
      hawaii.precision(_);\n\
      return albersUsa;\n\
    };\n\
    albersUsa.scale = function(_) {\n\
      if (!arguments.length) return lower48.scale();\n\
      lower48.scale(_);\n\
      alaska.scale(_ * .35);\n\
      hawaii.scale(_);\n\
      return albersUsa.translate(lower48.translate());\n\
    };\n\
    albersUsa.translate = function(_) {\n\
      if (!arguments.length) return lower48.translate();\n\
      var k = lower48.scale(), x = +_[0], y = +_[1];\n\
      lower48Point = lower48.translate(_).clipExtent([ [ x - .455 * k, y - .238 * k ], [ x + .455 * k, y + .238 * k ] ]).stream(pointStream).point;\n\
      alaskaPoint = alaska.translate([ x - .307 * k, y + .201 * k ]).clipExtent([ [ x - .425 * k + ε, y + .12 * k + ε ], [ x - .214 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;\n\
      hawaiiPoint = hawaii.translate([ x - .205 * k, y + .212 * k ]).clipExtent([ [ x - .214 * k + ε, y + .166 * k + ε ], [ x - .115 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;\n\
      return albersUsa;\n\
    };\n\
    return albersUsa.scale(1070);\n\
  };\n\
  var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {\n\
    point: d3_noop,\n\
    lineStart: d3_noop,\n\
    lineEnd: d3_noop,\n\
    polygonStart: function() {\n\
      d3_geo_pathAreaPolygon = 0;\n\
      d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;\n\
    },\n\
    polygonEnd: function() {\n\
      d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;\n\
      d3_geo_pathAreaSum += abs(d3_geo_pathAreaPolygon / 2);\n\
    }\n\
  };\n\
  function d3_geo_pathAreaRingStart() {\n\
    var x00, y00, x0, y0;\n\
    d3_geo_pathArea.point = function(x, y) {\n\
      d3_geo_pathArea.point = nextPoint;\n\
      x00 = x0 = x, y00 = y0 = y;\n\
    };\n\
    function nextPoint(x, y) {\n\
      d3_geo_pathAreaPolygon += y0 * x - x0 * y;\n\
      x0 = x, y0 = y;\n\
    }\n\
    d3_geo_pathArea.lineEnd = function() {\n\
      nextPoint(x00, y00);\n\
    };\n\
  }\n\
  var d3_geo_pathBoundsX0, d3_geo_pathBoundsY0, d3_geo_pathBoundsX1, d3_geo_pathBoundsY1;\n\
  var d3_geo_pathBounds = {\n\
    point: d3_geo_pathBoundsPoint,\n\
    lineStart: d3_noop,\n\
    lineEnd: d3_noop,\n\
    polygonStart: d3_noop,\n\
    polygonEnd: d3_noop\n\
  };\n\
  function d3_geo_pathBoundsPoint(x, y) {\n\
    if (x < d3_geo_pathBoundsX0) d3_geo_pathBoundsX0 = x;\n\
    if (x > d3_geo_pathBoundsX1) d3_geo_pathBoundsX1 = x;\n\
    if (y < d3_geo_pathBoundsY0) d3_geo_pathBoundsY0 = y;\n\
    if (y > d3_geo_pathBoundsY1) d3_geo_pathBoundsY1 = y;\n\
  }\n\
  function d3_geo_pathBuffer() {\n\
    var pointCircle = d3_geo_pathBufferCircle(4.5), buffer = [];\n\
    var stream = {\n\
      point: point,\n\
      lineStart: function() {\n\
        stream.point = pointLineStart;\n\
      },\n\
      lineEnd: lineEnd,\n\
      polygonStart: function() {\n\
        stream.lineEnd = lineEndPolygon;\n\
      },\n\
      polygonEnd: function() {\n\
        stream.lineEnd = lineEnd;\n\
        stream.point = point;\n\
      },\n\
      pointRadius: function(_) {\n\
        pointCircle = d3_geo_pathBufferCircle(_);\n\
        return stream;\n\
      },\n\
      result: function() {\n\
        if (buffer.length) {\n\
          var result = buffer.join(\"\");\n\
          buffer = [];\n\
          return result;\n\
        }\n\
      }\n\
    };\n\
    function point(x, y) {\n\
      buffer.push(\"M\", x, \",\", y, pointCircle);\n\
    }\n\
    function pointLineStart(x, y) {\n\
      buffer.push(\"M\", x, \",\", y);\n\
      stream.point = pointLine;\n\
    }\n\
    function pointLine(x, y) {\n\
      buffer.push(\"L\", x, \",\", y);\n\
    }\n\
    function lineEnd() {\n\
      stream.point = point;\n\
    }\n\
    function lineEndPolygon() {\n\
      buffer.push(\"Z\");\n\
    }\n\
    return stream;\n\
  }\n\
  function d3_geo_pathBufferCircle(radius) {\n\
    return \"m0,\" + radius + \"a\" + radius + \",\" + radius + \" 0 1,1 0,\" + -2 * radius + \"a\" + radius + \",\" + radius + \" 0 1,1 0,\" + 2 * radius + \"z\";\n\
  }\n\
  var d3_geo_pathCentroid = {\n\
    point: d3_geo_pathCentroidPoint,\n\
    lineStart: d3_geo_pathCentroidLineStart,\n\
    lineEnd: d3_geo_pathCentroidLineEnd,\n\
    polygonStart: function() {\n\
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;\n\
    },\n\
    polygonEnd: function() {\n\
      d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;\n\
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;\n\
      d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;\n\
    }\n\
  };\n\
  function d3_geo_pathCentroidPoint(x, y) {\n\
    d3_geo_centroidX0 += x;\n\
    d3_geo_centroidY0 += y;\n\
    ++d3_geo_centroidZ0;\n\
  }\n\
  function d3_geo_pathCentroidLineStart() {\n\
    var x0, y0;\n\
    d3_geo_pathCentroid.point = function(x, y) {\n\
      d3_geo_pathCentroid.point = nextPoint;\n\
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);\n\
    };\n\
    function nextPoint(x, y) {\n\
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);\n\
      d3_geo_centroidX1 += z * (x0 + x) / 2;\n\
      d3_geo_centroidY1 += z * (y0 + y) / 2;\n\
      d3_geo_centroidZ1 += z;\n\
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);\n\
    }\n\
  }\n\
  function d3_geo_pathCentroidLineEnd() {\n\
    d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;\n\
  }\n\
  function d3_geo_pathCentroidRingStart() {\n\
    var x00, y00, x0, y0;\n\
    d3_geo_pathCentroid.point = function(x, y) {\n\
      d3_geo_pathCentroid.point = nextPoint;\n\
      d3_geo_pathCentroidPoint(x00 = x0 = x, y00 = y0 = y);\n\
    };\n\
    function nextPoint(x, y) {\n\
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);\n\
      d3_geo_centroidX1 += z * (x0 + x) / 2;\n\
      d3_geo_centroidY1 += z * (y0 + y) / 2;\n\
      d3_geo_centroidZ1 += z;\n\
      z = y0 * x - x0 * y;\n\
      d3_geo_centroidX2 += z * (x0 + x);\n\
      d3_geo_centroidY2 += z * (y0 + y);\n\
      d3_geo_centroidZ2 += z * 3;\n\
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);\n\
    }\n\
    d3_geo_pathCentroid.lineEnd = function() {\n\
      nextPoint(x00, y00);\n\
    };\n\
  }\n\
  function d3_geo_pathContext(context) {\n\
    var pointRadius = 4.5;\n\
    var stream = {\n\
      point: point,\n\
      lineStart: function() {\n\
        stream.point = pointLineStart;\n\
      },\n\
      lineEnd: lineEnd,\n\
      polygonStart: function() {\n\
        stream.lineEnd = lineEndPolygon;\n\
      },\n\
      polygonEnd: function() {\n\
        stream.lineEnd = lineEnd;\n\
        stream.point = point;\n\
      },\n\
      pointRadius: function(_) {\n\
        pointRadius = _;\n\
        return stream;\n\
      },\n\
      result: d3_noop\n\
    };\n\
    function point(x, y) {\n\
      context.moveTo(x, y);\n\
      context.arc(x, y, pointRadius, 0, τ);\n\
    }\n\
    function pointLineStart(x, y) {\n\
      context.moveTo(x, y);\n\
      stream.point = pointLine;\n\
    }\n\
    function pointLine(x, y) {\n\
      context.lineTo(x, y);\n\
    }\n\
    function lineEnd() {\n\
      stream.point = point;\n\
    }\n\
    function lineEndPolygon() {\n\
      context.closePath();\n\
    }\n\
    return stream;\n\
  }\n\
  function d3_geo_resample(project) {\n\
    var δ2 = .5, cosMinDistance = Math.cos(30 * d3_radians), maxDepth = 16;\n\
    function resample(stream) {\n\
      return (maxDepth ? resampleRecursive : resampleNone)(stream);\n\
    }\n\
    function resampleNone(stream) {\n\
      return d3_geo_transformPoint(stream, function(x, y) {\n\
        x = project(x, y);\n\
        stream.point(x[0], x[1]);\n\
      });\n\
    }\n\
    function resampleRecursive(stream) {\n\
      var λ00, φ00, x00, y00, a00, b00, c00, λ0, x0, y0, a0, b0, c0;\n\
      var resample = {\n\
        point: point,\n\
        lineStart: lineStart,\n\
        lineEnd: lineEnd,\n\
        polygonStart: function() {\n\
          stream.polygonStart();\n\
          resample.lineStart = ringStart;\n\
        },\n\
        polygonEnd: function() {\n\
          stream.polygonEnd();\n\
          resample.lineStart = lineStart;\n\
        }\n\
      };\n\
      function point(x, y) {\n\
        x = project(x, y);\n\
        stream.point(x[0], x[1]);\n\
      }\n\
      function lineStart() {\n\
        x0 = NaN;\n\
        resample.point = linePoint;\n\
        stream.lineStart();\n\
      }\n\
      function linePoint(λ, φ) {\n\
        var c = d3_geo_cartesian([ λ, φ ]), p = project(λ, φ);\n\
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x0 = p[0], y0 = p[1], λ0 = λ, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);\n\
        stream.point(x0, y0);\n\
      }\n\
      function lineEnd() {\n\
        resample.point = point;\n\
        stream.lineEnd();\n\
      }\n\
      function ringStart() {\n\
        lineStart();\n\
        resample.point = ringPoint;\n\
        resample.lineEnd = ringEnd;\n\
      }\n\
      function ringPoint(λ, φ) {\n\
        linePoint(λ00 = λ, φ00 = φ), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;\n\
        resample.point = linePoint;\n\
      }\n\
      function ringEnd() {\n\
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x00, y00, λ00, a00, b00, c00, maxDepth, stream);\n\
        resample.lineEnd = lineEnd;\n\
        lineEnd();\n\
      }\n\
      return resample;\n\
    }\n\
    function resampleLineTo(x0, y0, λ0, a0, b0, c0, x1, y1, λ1, a1, b1, c1, depth, stream) {\n\
      var dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy;\n\
      if (d2 > 4 * δ2 && depth--) {\n\
        var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = Math.sqrt(a * a + b * b + c * c), φ2 = Math.asin(c /= m), λ2 = abs(abs(c) - 1) < ε || abs(λ0 - λ1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a), p = project(λ2, φ2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;\n\
        if (dz * dz / d2 > δ2 || abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {\n\
          resampleLineTo(x0, y0, λ0, a0, b0, c0, x2, y2, λ2, a /= m, b /= m, c, depth, stream);\n\
          stream.point(x2, y2);\n\
          resampleLineTo(x2, y2, λ2, a, b, c, x1, y1, λ1, a1, b1, c1, depth, stream);\n\
        }\n\
      }\n\
    }\n\
    resample.precision = function(_) {\n\
      if (!arguments.length) return Math.sqrt(δ2);\n\
      maxDepth = (δ2 = _ * _) > 0 && 16;\n\
      return resample;\n\
    };\n\
    return resample;\n\
  }\n\
  d3.geo.path = function() {\n\
    var pointRadius = 4.5, projection, context, projectStream, contextStream, cacheStream;\n\
    function path(object) {\n\
      if (object) {\n\
        if (typeof pointRadius === \"function\") contextStream.pointRadius(+pointRadius.apply(this, arguments));\n\
        if (!cacheStream || !cacheStream.valid) cacheStream = projectStream(contextStream);\n\
        d3.geo.stream(object, cacheStream);\n\
      }\n\
      return contextStream.result();\n\
    }\n\
    path.area = function(object) {\n\
      d3_geo_pathAreaSum = 0;\n\
      d3.geo.stream(object, projectStream(d3_geo_pathArea));\n\
      return d3_geo_pathAreaSum;\n\
    };\n\
    path.centroid = function(object) {\n\
      d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;\n\
      d3.geo.stream(object, projectStream(d3_geo_pathCentroid));\n\
      return d3_geo_centroidZ2 ? [ d3_geo_centroidX2 / d3_geo_centroidZ2, d3_geo_centroidY2 / d3_geo_centroidZ2 ] : d3_geo_centroidZ1 ? [ d3_geo_centroidX1 / d3_geo_centroidZ1, d3_geo_centroidY1 / d3_geo_centroidZ1 ] : d3_geo_centroidZ0 ? [ d3_geo_centroidX0 / d3_geo_centroidZ0, d3_geo_centroidY0 / d3_geo_centroidZ0 ] : [ NaN, NaN ];\n\
    };\n\
    path.bounds = function(object) {\n\
      d3_geo_pathBoundsX1 = d3_geo_pathBoundsY1 = -(d3_geo_pathBoundsX0 = d3_geo_pathBoundsY0 = Infinity);\n\
      d3.geo.stream(object, projectStream(d3_geo_pathBounds));\n\
      return [ [ d3_geo_pathBoundsX0, d3_geo_pathBoundsY0 ], [ d3_geo_pathBoundsX1, d3_geo_pathBoundsY1 ] ];\n\
    };\n\
    path.projection = function(_) {\n\
      if (!arguments.length) return projection;\n\
      projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;\n\
      return reset();\n\
    };\n\
    path.context = function(_) {\n\
      if (!arguments.length) return context;\n\
      contextStream = (context = _) == null ? new d3_geo_pathBuffer() : new d3_geo_pathContext(_);\n\
      if (typeof pointRadius !== \"function\") contextStream.pointRadius(pointRadius);\n\
      return reset();\n\
    };\n\
    path.pointRadius = function(_) {\n\
      if (!arguments.length) return pointRadius;\n\
      pointRadius = typeof _ === \"function\" ? _ : (contextStream.pointRadius(+_), +_);\n\
      return path;\n\
    };\n\
    function reset() {\n\
      cacheStream = null;\n\
      return path;\n\
    }\n\
    return path.projection(d3.geo.albersUsa()).context(null);\n\
  };\n\
  function d3_geo_pathProjectStream(project) {\n\
    var resample = d3_geo_resample(function(x, y) {\n\
      return project([ x * d3_degrees, y * d3_degrees ]);\n\
    });\n\
    return function(stream) {\n\
      return d3_geo_projectionRadians(resample(stream));\n\
    };\n\
  }\n\
  d3.geo.transform = function(methods) {\n\
    return {\n\
      stream: function(stream) {\n\
        var transform = new d3_geo_transform(stream);\n\
        for (var k in methods) transform[k] = methods[k];\n\
        return transform;\n\
      }\n\
    };\n\
  };\n\
  function d3_geo_transform(stream) {\n\
    this.stream = stream;\n\
  }\n\
  d3_geo_transform.prototype = {\n\
    point: function(x, y) {\n\
      this.stream.point(x, y);\n\
    },\n\
    sphere: function() {\n\
      this.stream.sphere();\n\
    },\n\
    lineStart: function() {\n\
      this.stream.lineStart();\n\
    },\n\
    lineEnd: function() {\n\
      this.stream.lineEnd();\n\
    },\n\
    polygonStart: function() {\n\
      this.stream.polygonStart();\n\
    },\n\
    polygonEnd: function() {\n\
      this.stream.polygonEnd();\n\
    }\n\
  };\n\
  function d3_geo_transformPoint(stream, point) {\n\
    return {\n\
      point: point,\n\
      sphere: function() {\n\
        stream.sphere();\n\
      },\n\
      lineStart: function() {\n\
        stream.lineStart();\n\
      },\n\
      lineEnd: function() {\n\
        stream.lineEnd();\n\
      },\n\
      polygonStart: function() {\n\
        stream.polygonStart();\n\
      },\n\
      polygonEnd: function() {\n\
        stream.polygonEnd();\n\
      }\n\
    };\n\
  }\n\
  d3.geo.projection = d3_geo_projection;\n\
  d3.geo.projectionMutator = d3_geo_projectionMutator;\n\
  function d3_geo_projection(project) {\n\
    return d3_geo_projectionMutator(function() {\n\
      return project;\n\
    })();\n\
  }\n\
  function d3_geo_projectionMutator(projectAt) {\n\
    var project, rotate, projectRotate, projectResample = d3_geo_resample(function(x, y) {\n\
      x = project(x, y);\n\
      return [ x[0] * k + δx, δy - x[1] * k ];\n\
    }), k = 150, x = 480, y = 250, λ = 0, φ = 0, δλ = 0, δφ = 0, δγ = 0, δx, δy, preclip = d3_geo_clipAntimeridian, postclip = d3_identity, clipAngle = null, clipExtent = null, stream;\n\
    function projection(point) {\n\
      point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);\n\
      return [ point[0] * k + δx, δy - point[1] * k ];\n\
    }\n\
    function invert(point) {\n\
      point = projectRotate.invert((point[0] - δx) / k, (δy - point[1]) / k);\n\
      return point && [ point[0] * d3_degrees, point[1] * d3_degrees ];\n\
    }\n\
    projection.stream = function(output) {\n\
      if (stream) stream.valid = false;\n\
      stream = d3_geo_projectionRadians(preclip(rotate, projectResample(postclip(output))));\n\
      stream.valid = true;\n\
      return stream;\n\
    };\n\
    projection.clipAngle = function(_) {\n\
      if (!arguments.length) return clipAngle;\n\
      preclip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle((clipAngle = +_) * d3_radians);\n\
      return invalidate();\n\
    };\n\
    projection.clipExtent = function(_) {\n\
      if (!arguments.length) return clipExtent;\n\
      clipExtent = _;\n\
      postclip = _ ? d3_geo_clipExtent(_[0][0], _[0][1], _[1][0], _[1][1]) : d3_identity;\n\
      return invalidate();\n\
    };\n\
    projection.scale = function(_) {\n\
      if (!arguments.length) return k;\n\
      k = +_;\n\
      return reset();\n\
    };\n\
    projection.translate = function(_) {\n\
      if (!arguments.length) return [ x, y ];\n\
      x = +_[0];\n\
      y = +_[1];\n\
      return reset();\n\
    };\n\
    projection.center = function(_) {\n\
      if (!arguments.length) return [ λ * d3_degrees, φ * d3_degrees ];\n\
      λ = _[0] % 360 * d3_radians;\n\
      φ = _[1] % 360 * d3_radians;\n\
      return reset();\n\
    };\n\
    projection.rotate = function(_) {\n\
      if (!arguments.length) return [ δλ * d3_degrees, δφ * d3_degrees, δγ * d3_degrees ];\n\
      δλ = _[0] % 360 * d3_radians;\n\
      δφ = _[1] % 360 * d3_radians;\n\
      δγ = _.length > 2 ? _[2] % 360 * d3_radians : 0;\n\
      return reset();\n\
    };\n\
    d3.rebind(projection, projectResample, \"precision\");\n\
    function reset() {\n\
      projectRotate = d3_geo_compose(rotate = d3_geo_rotation(δλ, δφ, δγ), project);\n\
      var center = project(λ, φ);\n\
      δx = x - center[0] * k;\n\
      δy = y + center[1] * k;\n\
      return invalidate();\n\
    }\n\
    function invalidate() {\n\
      if (stream) stream.valid = false, stream = null;\n\
      return projection;\n\
    }\n\
    return function() {\n\
      project = projectAt.apply(this, arguments);\n\
      projection.invert = project.invert && invert;\n\
      return reset();\n\
    };\n\
  }\n\
  function d3_geo_projectionRadians(stream) {\n\
    return d3_geo_transformPoint(stream, function(x, y) {\n\
      stream.point(x * d3_radians, y * d3_radians);\n\
    });\n\
  }\n\
  function d3_geo_equirectangular(λ, φ) {\n\
    return [ λ, φ ];\n\
  }\n\
  (d3.geo.equirectangular = function() {\n\
    return d3_geo_projection(d3_geo_equirectangular);\n\
  }).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;\n\
  d3.geo.rotation = function(rotate) {\n\
    rotate = d3_geo_rotation(rotate[0] % 360 * d3_radians, rotate[1] * d3_radians, rotate.length > 2 ? rotate[2] * d3_radians : 0);\n\
    function forward(coordinates) {\n\
      coordinates = rotate(coordinates[0] * d3_radians, coordinates[1] * d3_radians);\n\
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;\n\
    }\n\
    forward.invert = function(coordinates) {\n\
      coordinates = rotate.invert(coordinates[0] * d3_radians, coordinates[1] * d3_radians);\n\
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;\n\
    };\n\
    return forward;\n\
  };\n\
  function d3_geo_identityRotation(λ, φ) {\n\
    return [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];\n\
  }\n\
  d3_geo_identityRotation.invert = d3_geo_equirectangular;\n\
  function d3_geo_rotation(δλ, δφ, δγ) {\n\
    return δλ ? δφ || δγ ? d3_geo_compose(d3_geo_rotationλ(δλ), d3_geo_rotationφγ(δφ, δγ)) : d3_geo_rotationλ(δλ) : δφ || δγ ? d3_geo_rotationφγ(δφ, δγ) : d3_geo_identityRotation;\n\
  }\n\
  function d3_geo_forwardRotationλ(δλ) {\n\
    return function(λ, φ) {\n\
      return λ += δλ, [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];\n\
    };\n\
  }\n\
  function d3_geo_rotationλ(δλ) {\n\
    var rotation = d3_geo_forwardRotationλ(δλ);\n\
    rotation.invert = d3_geo_forwardRotationλ(-δλ);\n\
    return rotation;\n\
  }\n\
  function d3_geo_rotationφγ(δφ, δγ) {\n\
    var cosδφ = Math.cos(δφ), sinδφ = Math.sin(δφ), cosδγ = Math.cos(δγ), sinδγ = Math.sin(δγ);\n\
    function rotation(λ, φ) {\n\
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδφ + x * sinδφ;\n\
      return [ Math.atan2(y * cosδγ - k * sinδγ, x * cosδφ - z * sinδφ), d3_asin(k * cosδγ + y * sinδγ) ];\n\
    }\n\
    rotation.invert = function(λ, φ) {\n\
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδγ - y * sinδγ;\n\
      return [ Math.atan2(y * cosδγ + z * sinδγ, x * cosδφ + k * sinδφ), d3_asin(k * cosδφ - x * sinδφ) ];\n\
    };\n\
    return rotation;\n\
  }\n\
  d3.geo.circle = function() {\n\
    var origin = [ 0, 0 ], angle, precision = 6, interpolate;\n\
    function circle() {\n\
      var center = typeof origin === \"function\" ? origin.apply(this, arguments) : origin, rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert, ring = [];\n\
      interpolate(null, null, 1, {\n\
        point: function(x, y) {\n\
          ring.push(x = rotate(x, y));\n\
          x[0] *= d3_degrees, x[1] *= d3_degrees;\n\
        }\n\
      });\n\
      return {\n\
        type: \"Polygon\",\n\
        coordinates: [ ring ]\n\
      };\n\
    }\n\
    circle.origin = function(x) {\n\
      if (!arguments.length) return origin;\n\
      origin = x;\n\
      return circle;\n\
    };\n\
    circle.angle = function(x) {\n\
      if (!arguments.length) return angle;\n\
      interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);\n\
      return circle;\n\
    };\n\
    circle.precision = function(_) {\n\
      if (!arguments.length) return precision;\n\
      interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);\n\
      return circle;\n\
    };\n\
    return circle.angle(90);\n\
  };\n\
  function d3_geo_circleInterpolate(radius, precision) {\n\
    var cr = Math.cos(radius), sr = Math.sin(radius);\n\
    return function(from, to, direction, listener) {\n\
      var step = direction * precision;\n\
      if (from != null) {\n\
        from = d3_geo_circleAngle(cr, from);\n\
        to = d3_geo_circleAngle(cr, to);\n\
        if (direction > 0 ? from < to : from > to) from += direction * τ;\n\
      } else {\n\
        from = radius + direction * τ;\n\
        to = radius - .5 * step;\n\
      }\n\
      for (var point, t = from; direction > 0 ? t > to : t < to; t -= step) {\n\
        listener.point((point = d3_geo_spherical([ cr, -sr * Math.cos(t), -sr * Math.sin(t) ]))[0], point[1]);\n\
      }\n\
    };\n\
  }\n\
  function d3_geo_circleAngle(cr, point) {\n\
    var a = d3_geo_cartesian(point);\n\
    a[0] -= cr;\n\
    d3_geo_cartesianNormalize(a);\n\
    var angle = d3_acos(-a[1]);\n\
    return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - ε) % (2 * Math.PI);\n\
  }\n\
  d3.geo.distance = function(a, b) {\n\
    var Δλ = (b[0] - a[0]) * d3_radians, φ0 = a[1] * d3_radians, φ1 = b[1] * d3_radians, sinΔλ = Math.sin(Δλ), cosΔλ = Math.cos(Δλ), sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1), t;\n\
    return Math.atan2(Math.sqrt((t = cosφ1 * sinΔλ) * t + (t = cosφ0 * sinφ1 - sinφ0 * cosφ1 * cosΔλ) * t), sinφ0 * sinφ1 + cosφ0 * cosφ1 * cosΔλ);\n\
  };\n\
  d3.geo.graticule = function() {\n\
    var x1, x0, X1, X0, y1, y0, Y1, Y0, dx = 10, dy = dx, DX = 90, DY = 360, x, y, X, Y, precision = 2.5;\n\
    function graticule() {\n\
      return {\n\
        type: \"MultiLineString\",\n\
        coordinates: lines()\n\
      };\n\
    }\n\
    function lines() {\n\
      return d3.range(Math.ceil(X0 / DX) * DX, X1, DX).map(X).concat(d3.range(Math.ceil(Y0 / DY) * DY, Y1, DY).map(Y)).concat(d3.range(Math.ceil(x0 / dx) * dx, x1, dx).filter(function(x) {\n\
        return abs(x % DX) > ε;\n\
      }).map(x)).concat(d3.range(Math.ceil(y0 / dy) * dy, y1, dy).filter(function(y) {\n\
        return abs(y % DY) > ε;\n\
      }).map(y));\n\
    }\n\
    graticule.lines = function() {\n\
      return lines().map(function(coordinates) {\n\
        return {\n\
          type: \"LineString\",\n\
          coordinates: coordinates\n\
        };\n\
      });\n\
    };\n\
    graticule.outline = function() {\n\
      return {\n\
        type: \"Polygon\",\n\
        coordinates: [ X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1)) ]\n\
      };\n\
    };\n\
    graticule.extent = function(_) {\n\
      if (!arguments.length) return graticule.minorExtent();\n\
      return graticule.majorExtent(_).minorExtent(_);\n\
    };\n\
    graticule.majorExtent = function(_) {\n\
      if (!arguments.length) return [ [ X0, Y0 ], [ X1, Y1 ] ];\n\
      X0 = +_[0][0], X1 = +_[1][0];\n\
      Y0 = +_[0][1], Y1 = +_[1][1];\n\
      if (X0 > X1) _ = X0, X0 = X1, X1 = _;\n\
      if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;\n\
      return graticule.precision(precision);\n\
    };\n\
    graticule.minorExtent = function(_) {\n\
      if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];\n\
      x0 = +_[0][0], x1 = +_[1][0];\n\
      y0 = +_[0][1], y1 = +_[1][1];\n\
      if (x0 > x1) _ = x0, x0 = x1, x1 = _;\n\
      if (y0 > y1) _ = y0, y0 = y1, y1 = _;\n\
      return graticule.precision(precision);\n\
    };\n\
    graticule.step = function(_) {\n\
      if (!arguments.length) return graticule.minorStep();\n\
      return graticule.majorStep(_).minorStep(_);\n\
    };\n\
    graticule.majorStep = function(_) {\n\
      if (!arguments.length) return [ DX, DY ];\n\
      DX = +_[0], DY = +_[1];\n\
      return graticule;\n\
    };\n\
    graticule.minorStep = function(_) {\n\
      if (!arguments.length) return [ dx, dy ];\n\
      dx = +_[0], dy = +_[1];\n\
      return graticule;\n\
    };\n\
    graticule.precision = function(_) {\n\
      if (!arguments.length) return precision;\n\
      precision = +_;\n\
      x = d3_geo_graticuleX(y0, y1, 90);\n\
      y = d3_geo_graticuleY(x0, x1, precision);\n\
      X = d3_geo_graticuleX(Y0, Y1, 90);\n\
      Y = d3_geo_graticuleY(X0, X1, precision);\n\
      return graticule;\n\
    };\n\
    return graticule.majorExtent([ [ -180, -90 + ε ], [ 180, 90 - ε ] ]).minorExtent([ [ -180, -80 - ε ], [ 180, 80 + ε ] ]);\n\
  };\n\
  function d3_geo_graticuleX(y0, y1, dy) {\n\
    var y = d3.range(y0, y1 - ε, dy).concat(y1);\n\
    return function(x) {\n\
      return y.map(function(y) {\n\
        return [ x, y ];\n\
      });\n\
    };\n\
  }\n\
  function d3_geo_graticuleY(x0, x1, dx) {\n\
    var x = d3.range(x0, x1 - ε, dx).concat(x1);\n\
    return function(y) {\n\
      return x.map(function(x) {\n\
        return [ x, y ];\n\
      });\n\
    };\n\
  }\n\
  function d3_source(d) {\n\
    return d.source;\n\
  }\n\
  function d3_target(d) {\n\
    return d.target;\n\
  }\n\
  d3.geo.greatArc = function() {\n\
    var source = d3_source, source_, target = d3_target, target_;\n\
    function greatArc() {\n\
      return {\n\
        type: \"LineString\",\n\
        coordinates: [ source_ || source.apply(this, arguments), target_ || target.apply(this, arguments) ]\n\
      };\n\
    }\n\
    greatArc.distance = function() {\n\
      return d3.geo.distance(source_ || source.apply(this, arguments), target_ || target.apply(this, arguments));\n\
    };\n\
    greatArc.source = function(_) {\n\
      if (!arguments.length) return source;\n\
      source = _, source_ = typeof _ === \"function\" ? null : _;\n\
      return greatArc;\n\
    };\n\
    greatArc.target = function(_) {\n\
      if (!arguments.length) return target;\n\
      target = _, target_ = typeof _ === \"function\" ? null : _;\n\
      return greatArc;\n\
    };\n\
    greatArc.precision = function() {\n\
      return arguments.length ? greatArc : 0;\n\
    };\n\
    return greatArc;\n\
  };\n\
  d3.geo.interpolate = function(source, target) {\n\
    return d3_geo_interpolate(source[0] * d3_radians, source[1] * d3_radians, target[0] * d3_radians, target[1] * d3_radians);\n\
  };\n\
  function d3_geo_interpolate(x0, y0, x1, y1) {\n\
    var cy0 = Math.cos(y0), sy0 = Math.sin(y0), cy1 = Math.cos(y1), sy1 = Math.sin(y1), kx0 = cy0 * Math.cos(x0), ky0 = cy0 * Math.sin(x0), kx1 = cy1 * Math.cos(x1), ky1 = cy1 * Math.sin(x1), d = 2 * Math.asin(Math.sqrt(d3_haversin(y1 - y0) + cy0 * cy1 * d3_haversin(x1 - x0))), k = 1 / Math.sin(d);\n\
    var interpolate = d ? function(t) {\n\
      var B = Math.sin(t *= d) * k, A = Math.sin(d - t) * k, x = A * kx0 + B * kx1, y = A * ky0 + B * ky1, z = A * sy0 + B * sy1;\n\
      return [ Math.atan2(y, x) * d3_degrees, Math.atan2(z, Math.sqrt(x * x + y * y)) * d3_degrees ];\n\
    } : function() {\n\
      return [ x0 * d3_degrees, y0 * d3_degrees ];\n\
    };\n\
    interpolate.distance = d;\n\
    return interpolate;\n\
  }\n\
  d3.geo.length = function(object) {\n\
    d3_geo_lengthSum = 0;\n\
    d3.geo.stream(object, d3_geo_length);\n\
    return d3_geo_lengthSum;\n\
  };\n\
  var d3_geo_lengthSum;\n\
  var d3_geo_length = {\n\
    sphere: d3_noop,\n\
    point: d3_noop,\n\
    lineStart: d3_geo_lengthLineStart,\n\
    lineEnd: d3_noop,\n\
    polygonStart: d3_noop,\n\
    polygonEnd: d3_noop\n\
  };\n\
  function d3_geo_lengthLineStart() {\n\
    var λ0, sinφ0, cosφ0;\n\
    d3_geo_length.point = function(λ, φ) {\n\
      λ0 = λ * d3_radians, sinφ0 = Math.sin(φ *= d3_radians), cosφ0 = Math.cos(φ);\n\
      d3_geo_length.point = nextPoint;\n\
    };\n\
    d3_geo_length.lineEnd = function() {\n\
      d3_geo_length.point = d3_geo_length.lineEnd = d3_noop;\n\
    };\n\
    function nextPoint(λ, φ) {\n\
      var sinφ = Math.sin(φ *= d3_radians), cosφ = Math.cos(φ), t = abs((λ *= d3_radians) - λ0), cosΔλ = Math.cos(t);\n\
      d3_geo_lengthSum += Math.atan2(Math.sqrt((t = cosφ * Math.sin(t)) * t + (t = cosφ0 * sinφ - sinφ0 * cosφ * cosΔλ) * t), sinφ0 * sinφ + cosφ0 * cosφ * cosΔλ);\n\
      λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ;\n\
    }\n\
  }\n\
  function d3_geo_azimuthal(scale, angle) {\n\
    function azimuthal(λ, φ) {\n\
      var cosλ = Math.cos(λ), cosφ = Math.cos(φ), k = scale(cosλ * cosφ);\n\
      return [ k * cosφ * Math.sin(λ), k * Math.sin(φ) ];\n\
    }\n\
    azimuthal.invert = function(x, y) {\n\
      var ρ = Math.sqrt(x * x + y * y), c = angle(ρ), sinc = Math.sin(c), cosc = Math.cos(c);\n\
      return [ Math.atan2(x * sinc, ρ * cosc), Math.asin(ρ && y * sinc / ρ) ];\n\
    };\n\
    return azimuthal;\n\
  }\n\
  var d3_geo_azimuthalEqualArea = d3_geo_azimuthal(function(cosλcosφ) {\n\
    return Math.sqrt(2 / (1 + cosλcosφ));\n\
  }, function(ρ) {\n\
    return 2 * Math.asin(ρ / 2);\n\
  });\n\
  (d3.geo.azimuthalEqualArea = function() {\n\
    return d3_geo_projection(d3_geo_azimuthalEqualArea);\n\
  }).raw = d3_geo_azimuthalEqualArea;\n\
  var d3_geo_azimuthalEquidistant = d3_geo_azimuthal(function(cosλcosφ) {\n\
    var c = Math.acos(cosλcosφ);\n\
    return c && c / Math.sin(c);\n\
  }, d3_identity);\n\
  (d3.geo.azimuthalEquidistant = function() {\n\
    return d3_geo_projection(d3_geo_azimuthalEquidistant);\n\
  }).raw = d3_geo_azimuthalEquidistant;\n\
  function d3_geo_conicConformal(φ0, φ1) {\n\
    var cosφ0 = Math.cos(φ0), t = function(φ) {\n\
      return Math.tan(π / 4 + φ / 2);\n\
    }, n = φ0 === φ1 ? Math.sin(φ0) : Math.log(cosφ0 / Math.cos(φ1)) / Math.log(t(φ1) / t(φ0)), F = cosφ0 * Math.pow(t(φ0), n) / n;\n\
    if (!n) return d3_geo_mercator;\n\
    function forward(λ, φ) {\n\
      var ρ = abs(abs(φ) - halfπ) < ε ? 0 : F / Math.pow(t(φ), n);\n\
      return [ ρ * Math.sin(n * λ), F - ρ * Math.cos(n * λ) ];\n\
    }\n\
    forward.invert = function(x, y) {\n\
      var ρ0_y = F - y, ρ = d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y);\n\
      return [ Math.atan2(x, ρ0_y) / n, 2 * Math.atan(Math.pow(F / ρ, 1 / n)) - halfπ ];\n\
    };\n\
    return forward;\n\
  }\n\
  (d3.geo.conicConformal = function() {\n\
    return d3_geo_conic(d3_geo_conicConformal);\n\
  }).raw = d3_geo_conicConformal;\n\
  function d3_geo_conicEquidistant(φ0, φ1) {\n\
    var cosφ0 = Math.cos(φ0), n = φ0 === φ1 ? Math.sin(φ0) : (cosφ0 - Math.cos(φ1)) / (φ1 - φ0), G = cosφ0 / n + φ0;\n\
    if (abs(n) < ε) return d3_geo_equirectangular;\n\
    function forward(λ, φ) {\n\
      var ρ = G - φ;\n\
      return [ ρ * Math.sin(n * λ), G - ρ * Math.cos(n * λ) ];\n\
    }\n\
    forward.invert = function(x, y) {\n\
      var ρ0_y = G - y;\n\
      return [ Math.atan2(x, ρ0_y) / n, G - d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y) ];\n\
    };\n\
    return forward;\n\
  }\n\
  (d3.geo.conicEquidistant = function() {\n\
    return d3_geo_conic(d3_geo_conicEquidistant);\n\
  }).raw = d3_geo_conicEquidistant;\n\
  var d3_geo_gnomonic = d3_geo_azimuthal(function(cosλcosφ) {\n\
    return 1 / cosλcosφ;\n\
  }, Math.atan);\n\
  (d3.geo.gnomonic = function() {\n\
    return d3_geo_projection(d3_geo_gnomonic);\n\
  }).raw = d3_geo_gnomonic;\n\
  function d3_geo_mercator(λ, φ) {\n\
    return [ λ, Math.log(Math.tan(π / 4 + φ / 2)) ];\n\
  }\n\
  d3_geo_mercator.invert = function(x, y) {\n\
    return [ x, 2 * Math.atan(Math.exp(y)) - halfπ ];\n\
  };\n\
  function d3_geo_mercatorProjection(project) {\n\
    var m = d3_geo_projection(project), scale = m.scale, translate = m.translate, clipExtent = m.clipExtent, clipAuto;\n\
    m.scale = function() {\n\
      var v = scale.apply(m, arguments);\n\
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;\n\
    };\n\
    m.translate = function() {\n\
      var v = translate.apply(m, arguments);\n\
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;\n\
    };\n\
    m.clipExtent = function(_) {\n\
      var v = clipExtent.apply(m, arguments);\n\
      if (v === m) {\n\
        if (clipAuto = _ == null) {\n\
          var k = π * scale(), t = translate();\n\
          clipExtent([ [ t[0] - k, t[1] - k ], [ t[0] + k, t[1] + k ] ]);\n\
        }\n\
      } else if (clipAuto) {\n\
        v = null;\n\
      }\n\
      return v;\n\
    };\n\
    return m.clipExtent(null);\n\
  }\n\
  (d3.geo.mercator = function() {\n\
    return d3_geo_mercatorProjection(d3_geo_mercator);\n\
  }).raw = d3_geo_mercator;\n\
  var d3_geo_orthographic = d3_geo_azimuthal(function() {\n\
    return 1;\n\
  }, Math.asin);\n\
  (d3.geo.orthographic = function() {\n\
    return d3_geo_projection(d3_geo_orthographic);\n\
  }).raw = d3_geo_orthographic;\n\
  var d3_geo_stereographic = d3_geo_azimuthal(function(cosλcosφ) {\n\
    return 1 / (1 + cosλcosφ);\n\
  }, function(ρ) {\n\
    return 2 * Math.atan(ρ);\n\
  });\n\
  (d3.geo.stereographic = function() {\n\
    return d3_geo_projection(d3_geo_stereographic);\n\
  }).raw = d3_geo_stereographic;\n\
  function d3_geo_transverseMercator(λ, φ) {\n\
    var B = Math.cos(φ) * Math.sin(λ);\n\
    return [ Math.log((1 + B) / (1 - B)) / 2, Math.atan2(Math.tan(φ), Math.cos(λ)) ];\n\
  }\n\
  d3_geo_transverseMercator.invert = function(x, y) {\n\
    return [ Math.atan2(d3_sinh(x), Math.cos(y)), d3_asin(Math.sin(y) / d3_cosh(x)) ];\n\
  };\n\
  (d3.geo.transverseMercator = function() {\n\
    return d3_geo_mercatorProjection(d3_geo_transverseMercator);\n\
  }).raw = d3_geo_transverseMercator;\n\
  d3.geom = {};\n\
  function d3_geom_pointX(d) {\n\
    return d[0];\n\
  }\n\
  function d3_geom_pointY(d) {\n\
    return d[1];\n\
  }\n\
  d3.geom.hull = function(vertices) {\n\
    var x = d3_geom_pointX, y = d3_geom_pointY;\n\
    if (arguments.length) return hull(vertices);\n\
    function hull(data) {\n\
      if (data.length < 3) return [];\n\
      var fx = d3_functor(x), fy = d3_functor(y), n = data.length, vertices, plen = n - 1, points = [], stack = [], d, i, j, h = 0, x1, y1, x2, y2, u, v, a, sp;\n\
      if (fx === d3_geom_pointX && y === d3_geom_pointY) vertices = data; else for (i = 0, \n\
      vertices = []; i < n; ++i) {\n\
        vertices.push([ +fx.call(this, d = data[i], i), +fy.call(this, d, i) ]);\n\
      }\n\
      for (i = 1; i < n; ++i) {\n\
        if (vertices[i][1] < vertices[h][1] || vertices[i][1] == vertices[h][1] && vertices[i][0] < vertices[h][0]) h = i;\n\
      }\n\
      for (i = 0; i < n; ++i) {\n\
        if (i === h) continue;\n\
        y1 = vertices[i][1] - vertices[h][1];\n\
        x1 = vertices[i][0] - vertices[h][0];\n\
        points.push({\n\
          angle: Math.atan2(y1, x1),\n\
          index: i\n\
        });\n\
      }\n\
      points.sort(function(a, b) {\n\
        return a.angle - b.angle;\n\
      });\n\
      a = points[0].angle;\n\
      v = points[0].index;\n\
      u = 0;\n\
      for (i = 1; i < plen; ++i) {\n\
        j = points[i].index;\n\
        if (a == points[i].angle) {\n\
          x1 = vertices[v][0] - vertices[h][0];\n\
          y1 = vertices[v][1] - vertices[h][1];\n\
          x2 = vertices[j][0] - vertices[h][0];\n\
          y2 = vertices[j][1] - vertices[h][1];\n\
          if (x1 * x1 + y1 * y1 >= x2 * x2 + y2 * y2) {\n\
            points[i].index = -1;\n\
            continue;\n\
          } else {\n\
            points[u].index = -1;\n\
          }\n\
        }\n\
        a = points[i].angle;\n\
        u = i;\n\
        v = j;\n\
      }\n\
      stack.push(h);\n\
      for (i = 0, j = 0; i < 2; ++j) {\n\
        if (points[j].index > -1) {\n\
          stack.push(points[j].index);\n\
          i++;\n\
        }\n\
      }\n\
      sp = stack.length;\n\
      for (;j < plen; ++j) {\n\
        if (points[j].index < 0) continue;\n\
        while (!d3_geom_hullCCW(stack[sp - 2], stack[sp - 1], points[j].index, vertices)) {\n\
          --sp;\n\
        }\n\
        stack[sp++] = points[j].index;\n\
      }\n\
      var poly = [];\n\
      for (i = sp - 1; i >= 0; --i) poly.push(data[stack[i]]);\n\
      return poly;\n\
    }\n\
    hull.x = function(_) {\n\
      return arguments.length ? (x = _, hull) : x;\n\
    };\n\
    hull.y = function(_) {\n\
      return arguments.length ? (y = _, hull) : y;\n\
    };\n\
    return hull;\n\
  };\n\
  function d3_geom_hullCCW(i1, i2, i3, v) {\n\
    var t, a, b, c, d, e, f;\n\
    t = v[i1];\n\
    a = t[0];\n\
    b = t[1];\n\
    t = v[i2];\n\
    c = t[0];\n\
    d = t[1];\n\
    t = v[i3];\n\
    e = t[0];\n\
    f = t[1];\n\
    return (f - b) * (c - a) - (d - b) * (e - a) > 0;\n\
  }\n\
  d3.geom.polygon = function(coordinates) {\n\
    d3_subclass(coordinates, d3_geom_polygonPrototype);\n\
    return coordinates;\n\
  };\n\
  var d3_geom_polygonPrototype = d3.geom.polygon.prototype = [];\n\
  d3_geom_polygonPrototype.area = function() {\n\
    var i = -1, n = this.length, a, b = this[n - 1], area = 0;\n\
    while (++i < n) {\n\
      a = b;\n\
      b = this[i];\n\
      area += a[1] * b[0] - a[0] * b[1];\n\
    }\n\
    return area * .5;\n\
  };\n\
  d3_geom_polygonPrototype.centroid = function(k) {\n\
    var i = -1, n = this.length, x = 0, y = 0, a, b = this[n - 1], c;\n\
    if (!arguments.length) k = -1 / (6 * this.area());\n\
    while (++i < n) {\n\
      a = b;\n\
      b = this[i];\n\
      c = a[0] * b[1] - b[0] * a[1];\n\
      x += (a[0] + b[0]) * c;\n\
      y += (a[1] + b[1]) * c;\n\
    }\n\
    return [ x * k, y * k ];\n\
  };\n\
  d3_geom_polygonPrototype.clip = function(subject) {\n\
    var input, closed = d3_geom_polygonClosed(subject), i = -1, n = this.length - d3_geom_polygonClosed(this), j, m, a = this[n - 1], b, c, d;\n\
    while (++i < n) {\n\
      input = subject.slice();\n\
      subject.length = 0;\n\
      b = this[i];\n\
      c = input[(m = input.length - closed) - 1];\n\
      j = -1;\n\
      while (++j < m) {\n\
        d = input[j];\n\
        if (d3_geom_polygonInside(d, a, b)) {\n\
          if (!d3_geom_polygonInside(c, a, b)) {\n\
            subject.push(d3_geom_polygonIntersect(c, d, a, b));\n\
          }\n\
          subject.push(d);\n\
        } else if (d3_geom_polygonInside(c, a, b)) {\n\
          subject.push(d3_geom_polygonIntersect(c, d, a, b));\n\
        }\n\
        c = d;\n\
      }\n\
      if (closed) subject.push(subject[0]);\n\
      a = b;\n\
    }\n\
    return subject;\n\
  };\n\
  function d3_geom_polygonInside(p, a, b) {\n\
    return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);\n\
  }\n\
  function d3_geom_polygonIntersect(c, d, a, b) {\n\
    var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3, y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3, ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);\n\
    return [ x1 + ua * x21, y1 + ua * y21 ];\n\
  }\n\
  function d3_geom_polygonClosed(coordinates) {\n\
    var a = coordinates[0], b = coordinates[coordinates.length - 1];\n\
    return !(a[0] - b[0] || a[1] - b[1]);\n\
  }\n\
  var d3_geom_voronoiEdges, d3_geom_voronoiCells, d3_geom_voronoiBeaches, d3_geom_voronoiBeachPool = [], d3_geom_voronoiFirstCircle, d3_geom_voronoiCircles, d3_geom_voronoiCirclePool = [];\n\
  function d3_geom_voronoiBeach() {\n\
    d3_geom_voronoiRedBlackNode(this);\n\
    this.edge = this.site = this.circle = null;\n\
  }\n\
  function d3_geom_voronoiCreateBeach(site) {\n\
    var beach = d3_geom_voronoiBeachPool.pop() || new d3_geom_voronoiBeach();\n\
    beach.site = site;\n\
    return beach;\n\
  }\n\
  function d3_geom_voronoiDetachBeach(beach) {\n\
    d3_geom_voronoiDetachCircle(beach);\n\
    d3_geom_voronoiBeaches.remove(beach);\n\
    d3_geom_voronoiBeachPool.push(beach);\n\
    d3_geom_voronoiRedBlackNode(beach);\n\
  }\n\
  function d3_geom_voronoiRemoveBeach(beach) {\n\
    var circle = beach.circle, x = circle.x, y = circle.cy, vertex = {\n\
      x: x,\n\
      y: y\n\
    }, previous = beach.P, next = beach.N, disappearing = [ beach ];\n\
    d3_geom_voronoiDetachBeach(beach);\n\
    var lArc = previous;\n\
    while (lArc.circle && abs(x - lArc.circle.x) < ε && abs(y - lArc.circle.cy) < ε) {\n\
      previous = lArc.P;\n\
      disappearing.unshift(lArc);\n\
      d3_geom_voronoiDetachBeach(lArc);\n\
      lArc = previous;\n\
    }\n\
    disappearing.unshift(lArc);\n\
    d3_geom_voronoiDetachCircle(lArc);\n\
    var rArc = next;\n\
    while (rArc.circle && abs(x - rArc.circle.x) < ε && abs(y - rArc.circle.cy) < ε) {\n\
      next = rArc.N;\n\
      disappearing.push(rArc);\n\
      d3_geom_voronoiDetachBeach(rArc);\n\
      rArc = next;\n\
    }\n\
    disappearing.push(rArc);\n\
    d3_geom_voronoiDetachCircle(rArc);\n\
    var nArcs = disappearing.length, iArc;\n\
    for (iArc = 1; iArc < nArcs; ++iArc) {\n\
      rArc = disappearing[iArc];\n\
      lArc = disappearing[iArc - 1];\n\
      d3_geom_voronoiSetEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);\n\
    }\n\
    lArc = disappearing[0];\n\
    rArc = disappearing[nArcs - 1];\n\
    rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, rArc.site, null, vertex);\n\
    d3_geom_voronoiAttachCircle(lArc);\n\
    d3_geom_voronoiAttachCircle(rArc);\n\
  }\n\
  function d3_geom_voronoiAddBeach(site) {\n\
    var x = site.x, directrix = site.y, lArc, rArc, dxl, dxr, node = d3_geom_voronoiBeaches._;\n\
    while (node) {\n\
      dxl = d3_geom_voronoiLeftBreakPoint(node, directrix) - x;\n\
      if (dxl > ε) node = node.L; else {\n\
        dxr = x - d3_geom_voronoiRightBreakPoint(node, directrix);\n\
        if (dxr > ε) {\n\
          if (!node.R) {\n\
            lArc = node;\n\
            break;\n\
          }\n\
          node = node.R;\n\
        } else {\n\
          if (dxl > -ε) {\n\
            lArc = node.P;\n\
            rArc = node;\n\
          } else if (dxr > -ε) {\n\
            lArc = node;\n\
            rArc = node.N;\n\
          } else {\n\
            lArc = rArc = node;\n\
          }\n\
          break;\n\
        }\n\
      }\n\
    }\n\
    var newArc = d3_geom_voronoiCreateBeach(site);\n\
    d3_geom_voronoiBeaches.insert(lArc, newArc);\n\
    if (!lArc && !rArc) return;\n\
    if (lArc === rArc) {\n\
      d3_geom_voronoiDetachCircle(lArc);\n\
      rArc = d3_geom_voronoiCreateBeach(lArc.site);\n\
      d3_geom_voronoiBeaches.insert(newArc, rArc);\n\
      newArc.edge = rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);\n\
      d3_geom_voronoiAttachCircle(lArc);\n\
      d3_geom_voronoiAttachCircle(rArc);\n\
      return;\n\
    }\n\
    if (!rArc) {\n\
      newArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);\n\
      return;\n\
    }\n\
    d3_geom_voronoiDetachCircle(lArc);\n\
    d3_geom_voronoiDetachCircle(rArc);\n\
    var lSite = lArc.site, ax = lSite.x, ay = lSite.y, bx = site.x - ax, by = site.y - ay, rSite = rArc.site, cx = rSite.x - ax, cy = rSite.y - ay, d = 2 * (bx * cy - by * cx), hb = bx * bx + by * by, hc = cx * cx + cy * cy, vertex = {\n\
      x: (cy * hb - by * hc) / d + ax,\n\
      y: (bx * hc - cx * hb) / d + ay\n\
    };\n\
    d3_geom_voronoiSetEdgeEnd(rArc.edge, lSite, rSite, vertex);\n\
    newArc.edge = d3_geom_voronoiCreateEdge(lSite, site, null, vertex);\n\
    rArc.edge = d3_geom_voronoiCreateEdge(site, rSite, null, vertex);\n\
    d3_geom_voronoiAttachCircle(lArc);\n\
    d3_geom_voronoiAttachCircle(rArc);\n\
  }\n\
  function d3_geom_voronoiLeftBreakPoint(arc, directrix) {\n\
    var site = arc.site, rfocx = site.x, rfocy = site.y, pby2 = rfocy - directrix;\n\
    if (!pby2) return rfocx;\n\
    var lArc = arc.P;\n\
    if (!lArc) return -Infinity;\n\
    site = lArc.site;\n\
    var lfocx = site.x, lfocy = site.y, plby2 = lfocy - directrix;\n\
    if (!plby2) return lfocx;\n\
    var hl = lfocx - rfocx, aby2 = 1 / pby2 - 1 / plby2, b = hl / plby2;\n\
    if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;\n\
    return (rfocx + lfocx) / 2;\n\
  }\n\
  function d3_geom_voronoiRightBreakPoint(arc, directrix) {\n\
    var rArc = arc.N;\n\
    if (rArc) return d3_geom_voronoiLeftBreakPoint(rArc, directrix);\n\
    var site = arc.site;\n\
    return site.y === directrix ? site.x : Infinity;\n\
  }\n\
  function d3_geom_voronoiCell(site) {\n\
    this.site = site;\n\
    this.edges = [];\n\
  }\n\
  d3_geom_voronoiCell.prototype.prepare = function() {\n\
    var halfEdges = this.edges, iHalfEdge = halfEdges.length, edge;\n\
    while (iHalfEdge--) {\n\
      edge = halfEdges[iHalfEdge].edge;\n\
      if (!edge.b || !edge.a) halfEdges.splice(iHalfEdge, 1);\n\
    }\n\
    halfEdges.sort(d3_geom_voronoiHalfEdgeOrder);\n\
    return halfEdges.length;\n\
  };\n\
  function d3_geom_voronoiCloseCells(extent) {\n\
    var x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], x2, y2, x3, y3, cells = d3_geom_voronoiCells, iCell = cells.length, cell, iHalfEdge, halfEdges, nHalfEdges, start, end;\n\
    while (iCell--) {\n\
      cell = cells[iCell];\n\
      if (!cell || !cell.prepare()) continue;\n\
      halfEdges = cell.edges;\n\
      nHalfEdges = halfEdges.length;\n\
      iHalfEdge = 0;\n\
      while (iHalfEdge < nHalfEdges) {\n\
        end = halfEdges[iHalfEdge].end(), x3 = end.x, y3 = end.y;\n\
        start = halfEdges[++iHalfEdge % nHalfEdges].start(), x2 = start.x, y2 = start.y;\n\
        if (abs(x3 - x2) > ε || abs(y3 - y2) > ε) {\n\
          halfEdges.splice(iHalfEdge, 0, new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, end, abs(x3 - x0) < ε && y1 - y3 > ε ? {\n\
            x: x0,\n\
            y: abs(x2 - x0) < ε ? y2 : y1\n\
          } : abs(y3 - y1) < ε && x1 - x3 > ε ? {\n\
            x: abs(y2 - y1) < ε ? x2 : x1,\n\
            y: y1\n\
          } : abs(x3 - x1) < ε && y3 - y0 > ε ? {\n\
            x: x1,\n\
            y: abs(x2 - x1) < ε ? y2 : y0\n\
          } : abs(y3 - y0) < ε && x3 - x0 > ε ? {\n\
            x: abs(y2 - y0) < ε ? x2 : x0,\n\
            y: y0\n\
          } : null), cell.site, null));\n\
          ++nHalfEdges;\n\
        }\n\
      }\n\
    }\n\
  }\n\
  function d3_geom_voronoiHalfEdgeOrder(a, b) {\n\
    return b.angle - a.angle;\n\
  }\n\
  function d3_geom_voronoiCircle() {\n\
    d3_geom_voronoiRedBlackNode(this);\n\
    this.x = this.y = this.arc = this.site = this.cy = null;\n\
  }\n\
  function d3_geom_voronoiAttachCircle(arc) {\n\
    var lArc = arc.P, rArc = arc.N;\n\
    if (!lArc || !rArc) return;\n\
    var lSite = lArc.site, cSite = arc.site, rSite = rArc.site;\n\
    if (lSite === rSite) return;\n\
    var bx = cSite.x, by = cSite.y, ax = lSite.x - bx, ay = lSite.y - by, cx = rSite.x - bx, cy = rSite.y - by;\n\
    var d = 2 * (ax * cy - ay * cx);\n\
    if (d >= -ε2) return;\n\
    var ha = ax * ax + ay * ay, hc = cx * cx + cy * cy, x = (cy * ha - ay * hc) / d, y = (ax * hc - cx * ha) / d, cy = y + by;\n\
    var circle = d3_geom_voronoiCirclePool.pop() || new d3_geom_voronoiCircle();\n\
    circle.arc = arc;\n\
    circle.site = cSite;\n\
    circle.x = x + bx;\n\
    circle.y = cy + Math.sqrt(x * x + y * y);\n\
    circle.cy = cy;\n\
    arc.circle = circle;\n\
    var before = null, node = d3_geom_voronoiCircles._;\n\
    while (node) {\n\
      if (circle.y < node.y || circle.y === node.y && circle.x <= node.x) {\n\
        if (node.L) node = node.L; else {\n\
          before = node.P;\n\
          break;\n\
        }\n\
      } else {\n\
        if (node.R) node = node.R; else {\n\
          before = node;\n\
          break;\n\
        }\n\
      }\n\
    }\n\
    d3_geom_voronoiCircles.insert(before, circle);\n\
    if (!before) d3_geom_voronoiFirstCircle = circle;\n\
  }\n\
  function d3_geom_voronoiDetachCircle(arc) {\n\
    var circle = arc.circle;\n\
    if (circle) {\n\
      if (!circle.P) d3_geom_voronoiFirstCircle = circle.N;\n\
      d3_geom_voronoiCircles.remove(circle);\n\
      d3_geom_voronoiCirclePool.push(circle);\n\
      d3_geom_voronoiRedBlackNode(circle);\n\
      arc.circle = null;\n\
    }\n\
  }\n\
  function d3_geom_voronoiClipEdges(extent) {\n\
    var edges = d3_geom_voronoiEdges, clip = d3_geom_clipLine(extent[0][0], extent[0][1], extent[1][0], extent[1][1]), i = edges.length, e;\n\
    while (i--) {\n\
      e = edges[i];\n\
      if (!d3_geom_voronoiConnectEdge(e, extent) || !clip(e) || abs(e.a.x - e.b.x) < ε && abs(e.a.y - e.b.y) < ε) {\n\
        e.a = e.b = null;\n\
        edges.splice(i, 1);\n\
      }\n\
    }\n\
  }\n\
  function d3_geom_voronoiConnectEdge(edge, extent) {\n\
    var vb = edge.b;\n\
    if (vb) return true;\n\
    var va = edge.a, x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], lSite = edge.l, rSite = edge.r, lx = lSite.x, ly = lSite.y, rx = rSite.x, ry = rSite.y, fx = (lx + rx) / 2, fy = (ly + ry) / 2, fm, fb;\n\
    if (ry === ly) {\n\
      if (fx < x0 || fx >= x1) return;\n\
      if (lx > rx) {\n\
        if (!va) va = {\n\
          x: fx,\n\
          y: y0\n\
        }; else if (va.y >= y1) return;\n\
        vb = {\n\
          x: fx,\n\
          y: y1\n\
        };\n\
      } else {\n\
        if (!va) va = {\n\
          x: fx,\n\
          y: y1\n\
        }; else if (va.y < y0) return;\n\
        vb = {\n\
          x: fx,\n\
          y: y0\n\
        };\n\
      }\n\
    } else {\n\
      fm = (lx - rx) / (ry - ly);\n\
      fb = fy - fm * fx;\n\
      if (fm < -1 || fm > 1) {\n\
        if (lx > rx) {\n\
          if (!va) va = {\n\
            x: (y0 - fb) / fm,\n\
            y: y0\n\
          }; else if (va.y >= y1) return;\n\
          vb = {\n\
            x: (y1 - fb) / fm,\n\
            y: y1\n\
          };\n\
        } else {\n\
          if (!va) va = {\n\
            x: (y1 - fb) / fm,\n\
            y: y1\n\
          }; else if (va.y < y0) return;\n\
          vb = {\n\
            x: (y0 - fb) / fm,\n\
            y: y0\n\
          };\n\
        }\n\
      } else {\n\
        if (ly < ry) {\n\
          if (!va) va = {\n\
            x: x0,\n\
            y: fm * x0 + fb\n\
          }; else if (va.x >= x1) return;\n\
          vb = {\n\
            x: x1,\n\
            y: fm * x1 + fb\n\
          };\n\
        } else {\n\
          if (!va) va = {\n\
            x: x1,\n\
            y: fm * x1 + fb\n\
          }; else if (va.x < x0) return;\n\
          vb = {\n\
            x: x0,\n\
            y: fm * x0 + fb\n\
          };\n\
        }\n\
      }\n\
    }\n\
    edge.a = va;\n\
    edge.b = vb;\n\
    return true;\n\
  }\n\
  function d3_geom_voronoiEdge(lSite, rSite) {\n\
    this.l = lSite;\n\
    this.r = rSite;\n\
    this.a = this.b = null;\n\
  }\n\
  function d3_geom_voronoiCreateEdge(lSite, rSite, va, vb) {\n\
    var edge = new d3_geom_voronoiEdge(lSite, rSite);\n\
    d3_geom_voronoiEdges.push(edge);\n\
    if (va) d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, va);\n\
    if (vb) d3_geom_voronoiSetEdgeEnd(edge, rSite, lSite, vb);\n\
    d3_geom_voronoiCells[lSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, lSite, rSite));\n\
    d3_geom_voronoiCells[rSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, rSite, lSite));\n\
    return edge;\n\
  }\n\
  function d3_geom_voronoiCreateBorderEdge(lSite, va, vb) {\n\
    var edge = new d3_geom_voronoiEdge(lSite, null);\n\
    edge.a = va;\n\
    edge.b = vb;\n\
    d3_geom_voronoiEdges.push(edge);\n\
    return edge;\n\
  }\n\
  function d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, vertex) {\n\
    if (!edge.a && !edge.b) {\n\
      edge.a = vertex;\n\
      edge.l = lSite;\n\
      edge.r = rSite;\n\
    } else if (edge.l === rSite) {\n\
      edge.b = vertex;\n\
    } else {\n\
      edge.a = vertex;\n\
    }\n\
  }\n\
  function d3_geom_voronoiHalfEdge(edge, lSite, rSite) {\n\
    var va = edge.a, vb = edge.b;\n\
    this.edge = edge;\n\
    this.site = lSite;\n\
    this.angle = rSite ? Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x) : edge.l === lSite ? Math.atan2(vb.x - va.x, va.y - vb.y) : Math.atan2(va.x - vb.x, vb.y - va.y);\n\
  }\n\
  d3_geom_voronoiHalfEdge.prototype = {\n\
    start: function() {\n\
      return this.edge.l === this.site ? this.edge.a : this.edge.b;\n\
    },\n\
    end: function() {\n\
      return this.edge.l === this.site ? this.edge.b : this.edge.a;\n\
    }\n\
  };\n\
  function d3_geom_voronoiRedBlackTree() {\n\
    this._ = null;\n\
  }\n\
  function d3_geom_voronoiRedBlackNode(node) {\n\
    node.U = node.C = node.L = node.R = node.P = node.N = null;\n\
  }\n\
  d3_geom_voronoiRedBlackTree.prototype = {\n\
    insert: function(after, node) {\n\
      var parent, grandpa, uncle;\n\
      if (after) {\n\
        node.P = after;\n\
        node.N = after.N;\n\
        if (after.N) after.N.P = node;\n\
        after.N = node;\n\
        if (after.R) {\n\
          after = after.R;\n\
          while (after.L) after = after.L;\n\
          after.L = node;\n\
        } else {\n\
          after.R = node;\n\
        }\n\
        parent = after;\n\
      } else if (this._) {\n\
        after = d3_geom_voronoiRedBlackFirst(this._);\n\
        node.P = null;\n\
        node.N = after;\n\
        after.P = after.L = node;\n\
        parent = after;\n\
      } else {\n\
        node.P = node.N = null;\n\
        this._ = node;\n\
        parent = null;\n\
      }\n\
      node.L = node.R = null;\n\
      node.U = parent;\n\
      node.C = true;\n\
      after = node;\n\
      while (parent && parent.C) {\n\
        grandpa = parent.U;\n\
        if (parent === grandpa.L) {\n\
          uncle = grandpa.R;\n\
          if (uncle && uncle.C) {\n\
            parent.C = uncle.C = false;\n\
            grandpa.C = true;\n\
            after = grandpa;\n\
          } else {\n\
            if (after === parent.R) {\n\
              d3_geom_voronoiRedBlackRotateLeft(this, parent);\n\
              after = parent;\n\
              parent = after.U;\n\
            }\n\
            parent.C = false;\n\
            grandpa.C = true;\n\
            d3_geom_voronoiRedBlackRotateRight(this, grandpa);\n\
          }\n\
        } else {\n\
          uncle = grandpa.L;\n\
          if (uncle && uncle.C) {\n\
            parent.C = uncle.C = false;\n\
            grandpa.C = true;\n\
            after = grandpa;\n\
          } else {\n\
            if (after === parent.L) {\n\
              d3_geom_voronoiRedBlackRotateRight(this, parent);\n\
              after = parent;\n\
              parent = after.U;\n\
            }\n\
            parent.C = false;\n\
            grandpa.C = true;\n\
            d3_geom_voronoiRedBlackRotateLeft(this, grandpa);\n\
          }\n\
        }\n\
        parent = after.U;\n\
      }\n\
      this._.C = false;\n\
    },\n\
    remove: function(node) {\n\
      if (node.N) node.N.P = node.P;\n\
      if (node.P) node.P.N = node.N;\n\
      node.N = node.P = null;\n\
      var parent = node.U, sibling, left = node.L, right = node.R, next, red;\n\
      if (!left) next = right; else if (!right) next = left; else next = d3_geom_voronoiRedBlackFirst(right);\n\
      if (parent) {\n\
        if (parent.L === node) parent.L = next; else parent.R = next;\n\
      } else {\n\
        this._ = next;\n\
      }\n\
      if (left && right) {\n\
        red = next.C;\n\
        next.C = node.C;\n\
        next.L = left;\n\
        left.U = next;\n\
        if (next !== right) {\n\
          parent = next.U;\n\
          next.U = node.U;\n\
          node = next.R;\n\
          parent.L = node;\n\
          next.R = right;\n\
          right.U = next;\n\
        } else {\n\
          next.U = parent;\n\
          parent = next;\n\
          node = next.R;\n\
        }\n\
      } else {\n\
        red = node.C;\n\
        node = next;\n\
      }\n\
      if (node) node.U = parent;\n\
      if (red) return;\n\
      if (node && node.C) {\n\
        node.C = false;\n\
        return;\n\
      }\n\
      do {\n\
        if (node === this._) break;\n\
        if (node === parent.L) {\n\
          sibling = parent.R;\n\
          if (sibling.C) {\n\
            sibling.C = false;\n\
            parent.C = true;\n\
            d3_geom_voronoiRedBlackRotateLeft(this, parent);\n\
            sibling = parent.R;\n\
          }\n\
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {\n\
            if (!sibling.R || !sibling.R.C) {\n\
              sibling.L.C = false;\n\
              sibling.C = true;\n\
              d3_geom_voronoiRedBlackRotateRight(this, sibling);\n\
              sibling = parent.R;\n\
            }\n\
            sibling.C = parent.C;\n\
            parent.C = sibling.R.C = false;\n\
            d3_geom_voronoiRedBlackRotateLeft(this, parent);\n\
            node = this._;\n\
            break;\n\
          }\n\
        } else {\n\
          sibling = parent.L;\n\
          if (sibling.C) {\n\
            sibling.C = false;\n\
            parent.C = true;\n\
            d3_geom_voronoiRedBlackRotateRight(this, parent);\n\
            sibling = parent.L;\n\
          }\n\
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {\n\
            if (!sibling.L || !sibling.L.C) {\n\
              sibling.R.C = false;\n\
              sibling.C = true;\n\
              d3_geom_voronoiRedBlackRotateLeft(this, sibling);\n\
              sibling = parent.L;\n\
            }\n\
            sibling.C = parent.C;\n\
            parent.C = sibling.L.C = false;\n\
            d3_geom_voronoiRedBlackRotateRight(this, parent);\n\
            node = this._;\n\
            break;\n\
          }\n\
        }\n\
        sibling.C = true;\n\
        node = parent;\n\
        parent = parent.U;\n\
      } while (!node.C);\n\
      if (node) node.C = false;\n\
    }\n\
  };\n\
  function d3_geom_voronoiRedBlackRotateLeft(tree, node) {\n\
    var p = node, q = node.R, parent = p.U;\n\
    if (parent) {\n\
      if (parent.L === p) parent.L = q; else parent.R = q;\n\
    } else {\n\
      tree._ = q;\n\
    }\n\
    q.U = parent;\n\
    p.U = q;\n\
    p.R = q.L;\n\
    if (p.R) p.R.U = p;\n\
    q.L = p;\n\
  }\n\
  function d3_geom_voronoiRedBlackRotateRight(tree, node) {\n\
    var p = node, q = node.L, parent = p.U;\n\
    if (parent) {\n\
      if (parent.L === p) parent.L = q; else parent.R = q;\n\
    } else {\n\
      tree._ = q;\n\
    }\n\
    q.U = parent;\n\
    p.U = q;\n\
    p.L = q.R;\n\
    if (p.L) p.L.U = p;\n\
    q.R = p;\n\
  }\n\
  function d3_geom_voronoiRedBlackFirst(node) {\n\
    while (node.L) node = node.L;\n\
    return node;\n\
  }\n\
  function d3_geom_voronoi(sites, bbox) {\n\
    var site = sites.sort(d3_geom_voronoiVertexOrder).pop(), x0, y0, circle;\n\
    d3_geom_voronoiEdges = [];\n\
    d3_geom_voronoiCells = new Array(sites.length);\n\
    d3_geom_voronoiBeaches = new d3_geom_voronoiRedBlackTree();\n\
    d3_geom_voronoiCircles = new d3_geom_voronoiRedBlackTree();\n\
    while (true) {\n\
      circle = d3_geom_voronoiFirstCircle;\n\
      if (site && (!circle || site.y < circle.y || site.y === circle.y && site.x < circle.x)) {\n\
        if (site.x !== x0 || site.y !== y0) {\n\
          d3_geom_voronoiCells[site.i] = new d3_geom_voronoiCell(site);\n\
          d3_geom_voronoiAddBeach(site);\n\
          x0 = site.x, y0 = site.y;\n\
        }\n\
        site = sites.pop();\n\
      } else if (circle) {\n\
        d3_geom_voronoiRemoveBeach(circle.arc);\n\
      } else {\n\
        break;\n\
      }\n\
    }\n\
    if (bbox) d3_geom_voronoiClipEdges(bbox), d3_geom_voronoiCloseCells(bbox);\n\
    var diagram = {\n\
      cells: d3_geom_voronoiCells,\n\
      edges: d3_geom_voronoiEdges\n\
    };\n\
    d3_geom_voronoiBeaches = d3_geom_voronoiCircles = d3_geom_voronoiEdges = d3_geom_voronoiCells = null;\n\
    return diagram;\n\
  }\n\
  function d3_geom_voronoiVertexOrder(a, b) {\n\
    return b.y - a.y || b.x - a.x;\n\
  }\n\
  d3.geom.voronoi = function(points) {\n\
    var x = d3_geom_pointX, y = d3_geom_pointY, fx = x, fy = y, clipExtent = d3_geom_voronoiClipExtent;\n\
    if (points) return voronoi(points);\n\
    function voronoi(data) {\n\
      var polygons = new Array(data.length), x0 = clipExtent[0][0], y0 = clipExtent[0][1], x1 = clipExtent[1][0], y1 = clipExtent[1][1];\n\
      d3_geom_voronoi(sites(data), clipExtent).cells.forEach(function(cell, i) {\n\
        var edges = cell.edges, site = cell.site, polygon = polygons[i] = edges.length ? edges.map(function(e) {\n\
          var s = e.start();\n\
          return [ s.x, s.y ];\n\
        }) : site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1 ? [ [ x0, y1 ], [ x1, y1 ], [ x1, y0 ], [ x0, y0 ] ] : [];\n\
        polygon.point = data[i];\n\
      });\n\
      return polygons;\n\
    }\n\
    function sites(data) {\n\
      return data.map(function(d, i) {\n\
        return {\n\
          x: Math.round(fx(d, i) / ε) * ε,\n\
          y: Math.round(fy(d, i) / ε) * ε,\n\
          i: i\n\
        };\n\
      });\n\
    }\n\
    voronoi.links = function(data) {\n\
      return d3_geom_voronoi(sites(data)).edges.filter(function(edge) {\n\
        return edge.l && edge.r;\n\
      }).map(function(edge) {\n\
        return {\n\
          source: data[edge.l.i],\n\
          target: data[edge.r.i]\n\
        };\n\
      });\n\
    };\n\
    voronoi.triangles = function(data) {\n\
      var triangles = [];\n\
      d3_geom_voronoi(sites(data)).cells.forEach(function(cell, i) {\n\
        var site = cell.site, edges = cell.edges.sort(d3_geom_voronoiHalfEdgeOrder), j = -1, m = edges.length, e0, s0, e1 = edges[m - 1].edge, s1 = e1.l === site ? e1.r : e1.l;\n\
        while (++j < m) {\n\
          e0 = e1;\n\
          s0 = s1;\n\
          e1 = edges[j].edge;\n\
          s1 = e1.l === site ? e1.r : e1.l;\n\
          if (i < s0.i && i < s1.i && d3_geom_voronoiTriangleArea(site, s0, s1) < 0) {\n\
            triangles.push([ data[i], data[s0.i], data[s1.i] ]);\n\
          }\n\
        }\n\
      });\n\
      return triangles;\n\
    };\n\
    voronoi.x = function(_) {\n\
      return arguments.length ? (fx = d3_functor(x = _), voronoi) : x;\n\
    };\n\
    voronoi.y = function(_) {\n\
      return arguments.length ? (fy = d3_functor(y = _), voronoi) : y;\n\
    };\n\
    voronoi.clipExtent = function(_) {\n\
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent;\n\
      clipExtent = _ == null ? d3_geom_voronoiClipExtent : _;\n\
      return voronoi;\n\
    };\n\
    voronoi.size = function(_) {\n\
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent && clipExtent[1];\n\
      return voronoi.clipExtent(_ && [ [ 0, 0 ], _ ]);\n\
    };\n\
    return voronoi;\n\
  };\n\
  var d3_geom_voronoiClipExtent = [ [ -1e6, -1e6 ], [ 1e6, 1e6 ] ];\n\
  function d3_geom_voronoiTriangleArea(a, b, c) {\n\
    return (a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y);\n\
  }\n\
  d3.geom.delaunay = function(vertices) {\n\
    return d3.geom.voronoi().triangles(vertices);\n\
  };\n\
  d3.geom.quadtree = function(points, x1, y1, x2, y2) {\n\
    var x = d3_geom_pointX, y = d3_geom_pointY, compat;\n\
    if (compat = arguments.length) {\n\
      x = d3_geom_quadtreeCompatX;\n\
      y = d3_geom_quadtreeCompatY;\n\
      if (compat === 3) {\n\
        y2 = y1;\n\
        x2 = x1;\n\
        y1 = x1 = 0;\n\
      }\n\
      return quadtree(points);\n\
    }\n\
    function quadtree(data) {\n\
      var d, fx = d3_functor(x), fy = d3_functor(y), xs, ys, i, n, x1_, y1_, x2_, y2_;\n\
      if (x1 != null) {\n\
        x1_ = x1, y1_ = y1, x2_ = x2, y2_ = y2;\n\
      } else {\n\
        x2_ = y2_ = -(x1_ = y1_ = Infinity);\n\
        xs = [], ys = [];\n\
        n = data.length;\n\
        if (compat) for (i = 0; i < n; ++i) {\n\
          d = data[i];\n\
          if (d.x < x1_) x1_ = d.x;\n\
          if (d.y < y1_) y1_ = d.y;\n\
          if (d.x > x2_) x2_ = d.x;\n\
          if (d.y > y2_) y2_ = d.y;\n\
          xs.push(d.x);\n\
          ys.push(d.y);\n\
        } else for (i = 0; i < n; ++i) {\n\
          var x_ = +fx(d = data[i], i), y_ = +fy(d, i);\n\
          if (x_ < x1_) x1_ = x_;\n\
          if (y_ < y1_) y1_ = y_;\n\
          if (x_ > x2_) x2_ = x_;\n\
          if (y_ > y2_) y2_ = y_;\n\
          xs.push(x_);\n\
          ys.push(y_);\n\
        }\n\
      }\n\
      var dx = x2_ - x1_, dy = y2_ - y1_;\n\
      if (dx > dy) y2_ = y1_ + dx; else x2_ = x1_ + dy;\n\
      function insert(n, d, x, y, x1, y1, x2, y2) {\n\
        if (isNaN(x) || isNaN(y)) return;\n\
        if (n.leaf) {\n\
          var nx = n.x, ny = n.y;\n\
          if (nx != null) {\n\
            if (abs(nx - x) + abs(ny - y) < .01) {\n\
              insertChild(n, d, x, y, x1, y1, x2, y2);\n\
            } else {\n\
              var nPoint = n.point;\n\
              n.x = n.y = n.point = null;\n\
              insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);\n\
              insertChild(n, d, x, y, x1, y1, x2, y2);\n\
            }\n\
          } else {\n\
            n.x = x, n.y = y, n.point = d;\n\
          }\n\
        } else {\n\
          insertChild(n, d, x, y, x1, y1, x2, y2);\n\
        }\n\
      }\n\
      function insertChild(n, d, x, y, x1, y1, x2, y2) {\n\
        var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, right = x >= sx, bottom = y >= sy, i = (bottom << 1) + right;\n\
        n.leaf = false;\n\
        n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode());\n\
        if (right) x1 = sx; else x2 = sx;\n\
        if (bottom) y1 = sy; else y2 = sy;\n\
        insert(n, d, x, y, x1, y1, x2, y2);\n\
      }\n\
      var root = d3_geom_quadtreeNode();\n\
      root.add = function(d) {\n\
        insert(root, d, +fx(d, ++i), +fy(d, i), x1_, y1_, x2_, y2_);\n\
      };\n\
      root.visit = function(f) {\n\
        d3_geom_quadtreeVisit(f, root, x1_, y1_, x2_, y2_);\n\
      };\n\
      i = -1;\n\
      if (x1 == null) {\n\
        while (++i < n) {\n\
          insert(root, data[i], xs[i], ys[i], x1_, y1_, x2_, y2_);\n\
        }\n\
        --i;\n\
      } else data.forEach(root.add);\n\
      xs = ys = data = d = null;\n\
      return root;\n\
    }\n\
    quadtree.x = function(_) {\n\
      return arguments.length ? (x = _, quadtree) : x;\n\
    };\n\
    quadtree.y = function(_) {\n\
      return arguments.length ? (y = _, quadtree) : y;\n\
    };\n\
    quadtree.extent = function(_) {\n\
      if (!arguments.length) return x1 == null ? null : [ [ x1, y1 ], [ x2, y2 ] ];\n\
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = +_[0][0], y1 = +_[0][1], x2 = +_[1][0], \n\
      y2 = +_[1][1];\n\
      return quadtree;\n\
    };\n\
    quadtree.size = function(_) {\n\
      if (!arguments.length) return x1 == null ? null : [ x2 - x1, y2 - y1 ];\n\
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = y1 = 0, x2 = +_[0], y2 = +_[1];\n\
      return quadtree;\n\
    };\n\
    return quadtree;\n\
  };\n\
  function d3_geom_quadtreeCompatX(d) {\n\
    return d.x;\n\
  }\n\
  function d3_geom_quadtreeCompatY(d) {\n\
    return d.y;\n\
  }\n\
  function d3_geom_quadtreeNode() {\n\
    return {\n\
      leaf: true,\n\
      nodes: [],\n\
      point: null,\n\
      x: null,\n\
      y: null\n\
    };\n\
  }\n\
  function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {\n\
    if (!f(node, x1, y1, x2, y2)) {\n\
      var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, children = node.nodes;\n\
      if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);\n\
      if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);\n\
      if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);\n\
      if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);\n\
    }\n\
  }\n\
  d3.interpolateRgb = d3_interpolateRgb;\n\
  function d3_interpolateRgb(a, b) {\n\
    a = d3.rgb(a);\n\
    b = d3.rgb(b);\n\
    var ar = a.r, ag = a.g, ab = a.b, br = b.r - ar, bg = b.g - ag, bb = b.b - ab;\n\
    return function(t) {\n\
      return \"#\" + d3_rgb_hex(Math.round(ar + br * t)) + d3_rgb_hex(Math.round(ag + bg * t)) + d3_rgb_hex(Math.round(ab + bb * t));\n\
    };\n\
  }\n\
  d3.interpolateObject = d3_interpolateObject;\n\
  function d3_interpolateObject(a, b) {\n\
    var i = {}, c = {}, k;\n\
    for (k in a) {\n\
      if (k in b) {\n\
        i[k] = d3_interpolate(a[k], b[k]);\n\
      } else {\n\
        c[k] = a[k];\n\
      }\n\
    }\n\
    for (k in b) {\n\
      if (!(k in a)) {\n\
        c[k] = b[k];\n\
      }\n\
    }\n\
    return function(t) {\n\
      for (k in i) c[k] = i[k](t);\n\
      return c;\n\
    };\n\
  }\n\
  d3.interpolateNumber = d3_interpolateNumber;\n\
  function d3_interpolateNumber(a, b) {\n\
    b -= a = +a;\n\
    return function(t) {\n\
      return a + b * t;\n\
    };\n\
  }\n\
  d3.interpolateString = d3_interpolateString;\n\
  function d3_interpolateString(a, b) {\n\
    var m, i, j, s0 = 0, s1 = 0, s = [], q = [], n, o;\n\
    a = a + \"\", b = b + \"\";\n\
    d3_interpolate_number.lastIndex = 0;\n\
    for (i = 0; m = d3_interpolate_number.exec(b); ++i) {\n\
      if (m.index) s.push(b.substring(s0, s1 = m.index));\n\
      q.push({\n\
        i: s.length,\n\
        x: m[0]\n\
      });\n\
      s.push(null);\n\
      s0 = d3_interpolate_number.lastIndex;\n\
    }\n\
    if (s0 < b.length) s.push(b.substring(s0));\n\
    for (i = 0, n = q.length; (m = d3_interpolate_number.exec(a)) && i < n; ++i) {\n\
      o = q[i];\n\
      if (o.x == m[0]) {\n\
        if (o.i) {\n\
          if (s[o.i + 1] == null) {\n\
            s[o.i - 1] += o.x;\n\
            s.splice(o.i, 1);\n\
            for (j = i + 1; j < n; ++j) q[j].i--;\n\
          } else {\n\
            s[o.i - 1] += o.x + s[o.i + 1];\n\
            s.splice(o.i, 2);\n\
            for (j = i + 1; j < n; ++j) q[j].i -= 2;\n\
          }\n\
        } else {\n\
          if (s[o.i + 1] == null) {\n\
            s[o.i] = o.x;\n\
          } else {\n\
            s[o.i] = o.x + s[o.i + 1];\n\
            s.splice(o.i + 1, 1);\n\
            for (j = i + 1; j < n; ++j) q[j].i--;\n\
          }\n\
        }\n\
        q.splice(i, 1);\n\
        n--;\n\
        i--;\n\
      } else {\n\
        o.x = d3_interpolateNumber(parseFloat(m[0]), parseFloat(o.x));\n\
      }\n\
    }\n\
    while (i < n) {\n\
      o = q.pop();\n\
      if (s[o.i + 1] == null) {\n\
        s[o.i] = o.x;\n\
      } else {\n\
        s[o.i] = o.x + s[o.i + 1];\n\
        s.splice(o.i + 1, 1);\n\
      }\n\
      n--;\n\
    }\n\
    if (s.length === 1) {\n\
      return s[0] == null ? (o = q[0].x, function(t) {\n\
        return o(t) + \"\";\n\
      }) : function() {\n\
        return b;\n\
      };\n\
    }\n\
    return function(t) {\n\
      for (i = 0; i < n; ++i) s[(o = q[i]).i] = o.x(t);\n\
      return s.join(\"\");\n\
    };\n\
  }\n\
  var d3_interpolate_number = /[-+]?(?:\\d+\\.?\\d*|\\.?\\d+)(?:[eE][-+]?\\d+)?/g;\n\
  d3.interpolate = d3_interpolate;\n\
  function d3_interpolate(a, b) {\n\
    var i = d3.interpolators.length, f;\n\
    while (--i >= 0 && !(f = d3.interpolators[i](a, b))) ;\n\
    return f;\n\
  }\n\
  d3.interpolators = [ function(a, b) {\n\
    var t = typeof b;\n\
    return (t === \"string\" ? d3_rgb_names.has(b) || /^(#|rgb\\(|hsl\\()/.test(b) ? d3_interpolateRgb : d3_interpolateString : b instanceof d3_Color ? d3_interpolateRgb : t === \"object\" ? Array.isArray(b) ? d3_interpolateArray : d3_interpolateObject : d3_interpolateNumber)(a, b);\n\
  } ];\n\
  d3.interpolateArray = d3_interpolateArray;\n\
  function d3_interpolateArray(a, b) {\n\
    var x = [], c = [], na = a.length, nb = b.length, n0 = Math.min(a.length, b.length), i;\n\
    for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));\n\
    for (;i < na; ++i) c[i] = a[i];\n\
    for (;i < nb; ++i) c[i] = b[i];\n\
    return function(t) {\n\
      for (i = 0; i < n0; ++i) c[i] = x[i](t);\n\
      return c;\n\
    };\n\
  }\n\
  var d3_ease_default = function() {\n\
    return d3_identity;\n\
  };\n\
  var d3_ease = d3.map({\n\
    linear: d3_ease_default,\n\
    poly: d3_ease_poly,\n\
    quad: function() {\n\
      return d3_ease_quad;\n\
    },\n\
    cubic: function() {\n\
      return d3_ease_cubic;\n\
    },\n\
    sin: function() {\n\
      return d3_ease_sin;\n\
    },\n\
    exp: function() {\n\
      return d3_ease_exp;\n\
    },\n\
    circle: function() {\n\
      return d3_ease_circle;\n\
    },\n\
    elastic: d3_ease_elastic,\n\
    back: d3_ease_back,\n\
    bounce: function() {\n\
      return d3_ease_bounce;\n\
    }\n\
  });\n\
  var d3_ease_mode = d3.map({\n\
    \"in\": d3_identity,\n\
    out: d3_ease_reverse,\n\
    \"in-out\": d3_ease_reflect,\n\
    \"out-in\": function(f) {\n\
      return d3_ease_reflect(d3_ease_reverse(f));\n\
    }\n\
  });\n\
  d3.ease = function(name) {\n\
    var i = name.indexOf(\"-\"), t = i >= 0 ? name.substring(0, i) : name, m = i >= 0 ? name.substring(i + 1) : \"in\";\n\
    t = d3_ease.get(t) || d3_ease_default;\n\
    m = d3_ease_mode.get(m) || d3_identity;\n\
    return d3_ease_clamp(m(t.apply(null, d3_arraySlice.call(arguments, 1))));\n\
  };\n\
  function d3_ease_clamp(f) {\n\
    return function(t) {\n\
      return t <= 0 ? 0 : t >= 1 ? 1 : f(t);\n\
    };\n\
  }\n\
  function d3_ease_reverse(f) {\n\
    return function(t) {\n\
      return 1 - f(1 - t);\n\
    };\n\
  }\n\
  function d3_ease_reflect(f) {\n\
    return function(t) {\n\
      return .5 * (t < .5 ? f(2 * t) : 2 - f(2 - 2 * t));\n\
    };\n\
  }\n\
  function d3_ease_quad(t) {\n\
    return t * t;\n\
  }\n\
  function d3_ease_cubic(t) {\n\
    return t * t * t;\n\
  }\n\
  function d3_ease_cubicInOut(t) {\n\
    if (t <= 0) return 0;\n\
    if (t >= 1) return 1;\n\
    var t2 = t * t, t3 = t2 * t;\n\
    return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);\n\
  }\n\
  function d3_ease_poly(e) {\n\
    return function(t) {\n\
      return Math.pow(t, e);\n\
    };\n\
  }\n\
  function d3_ease_sin(t) {\n\
    return 1 - Math.cos(t * halfπ);\n\
  }\n\
  function d3_ease_exp(t) {\n\
    return Math.pow(2, 10 * (t - 1));\n\
  }\n\
  function d3_ease_circle(t) {\n\
    return 1 - Math.sqrt(1 - t * t);\n\
  }\n\
  function d3_ease_elastic(a, p) {\n\
    var s;\n\
    if (arguments.length < 2) p = .45;\n\
    if (arguments.length) s = p / τ * Math.asin(1 / a); else a = 1, s = p / 4;\n\
    return function(t) {\n\
      return 1 + a * Math.pow(2, -10 * t) * Math.sin((t - s) * τ / p);\n\
    };\n\
  }\n\
  function d3_ease_back(s) {\n\
    if (!s) s = 1.70158;\n\
    return function(t) {\n\
      return t * t * ((s + 1) * t - s);\n\
    };\n\
  }\n\
  function d3_ease_bounce(t) {\n\
    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;\n\
  }\n\
  d3.interpolateHcl = d3_interpolateHcl;\n\
  function d3_interpolateHcl(a, b) {\n\
    a = d3.hcl(a);\n\
    b = d3.hcl(b);\n\
    var ah = a.h, ac = a.c, al = a.l, bh = b.h - ah, bc = b.c - ac, bl = b.l - al;\n\
    if (isNaN(bc)) bc = 0, ac = isNaN(ac) ? b.c : ac;\n\
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;\n\
    return function(t) {\n\
      return d3_hcl_lab(ah + bh * t, ac + bc * t, al + bl * t) + \"\";\n\
    };\n\
  }\n\
  d3.interpolateHsl = d3_interpolateHsl;\n\
  function d3_interpolateHsl(a, b) {\n\
    a = d3.hsl(a);\n\
    b = d3.hsl(b);\n\
    var ah = a.h, as = a.s, al = a.l, bh = b.h - ah, bs = b.s - as, bl = b.l - al;\n\
    if (isNaN(bs)) bs = 0, as = isNaN(as) ? b.s : as;\n\
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;\n\
    return function(t) {\n\
      return d3_hsl_rgb(ah + bh * t, as + bs * t, al + bl * t) + \"\";\n\
    };\n\
  }\n\
  d3.interpolateLab = d3_interpolateLab;\n\
  function d3_interpolateLab(a, b) {\n\
    a = d3.lab(a);\n\
    b = d3.lab(b);\n\
    var al = a.l, aa = a.a, ab = a.b, bl = b.l - al, ba = b.a - aa, bb = b.b - ab;\n\
    return function(t) {\n\
      return d3_lab_rgb(al + bl * t, aa + ba * t, ab + bb * t) + \"\";\n\
    };\n\
  }\n\
  d3.interpolateRound = d3_interpolateRound;\n\
  function d3_interpolateRound(a, b) {\n\
    b -= a;\n\
    return function(t) {\n\
      return Math.round(a + b * t);\n\
    };\n\
  }\n\
  d3.transform = function(string) {\n\
    var g = d3_document.createElementNS(d3.ns.prefix.svg, \"g\");\n\
    return (d3.transform = function(string) {\n\
      if (string != null) {\n\
        g.setAttribute(\"transform\", string);\n\
        var t = g.transform.baseVal.consolidate();\n\
      }\n\
      return new d3_transform(t ? t.matrix : d3_transformIdentity);\n\
    })(string);\n\
  };\n\
  function d3_transform(m) {\n\
    var r0 = [ m.a, m.b ], r1 = [ m.c, m.d ], kx = d3_transformNormalize(r0), kz = d3_transformDot(r0, r1), ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;\n\
    if (r0[0] * r1[1] < r1[0] * r0[1]) {\n\
      r0[0] *= -1;\n\
      r0[1] *= -1;\n\
      kx *= -1;\n\
      kz *= -1;\n\
    }\n\
    this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;\n\
    this.translate = [ m.e, m.f ];\n\
    this.scale = [ kx, ky ];\n\
    this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;\n\
  }\n\
  d3_transform.prototype.toString = function() {\n\
    return \"translate(\" + this.translate + \")rotate(\" + this.rotate + \")skewX(\" + this.skew + \")scale(\" + this.scale + \")\";\n\
  };\n\
  function d3_transformDot(a, b) {\n\
    return a[0] * b[0] + a[1] * b[1];\n\
  }\n\
  function d3_transformNormalize(a) {\n\
    var k = Math.sqrt(d3_transformDot(a, a));\n\
    if (k) {\n\
      a[0] /= k;\n\
      a[1] /= k;\n\
    }\n\
    return k;\n\
  }\n\
  function d3_transformCombine(a, b, k) {\n\
    a[0] += k * b[0];\n\
    a[1] += k * b[1];\n\
    return a;\n\
  }\n\
  var d3_transformIdentity = {\n\
    a: 1,\n\
    b: 0,\n\
    c: 0,\n\
    d: 1,\n\
    e: 0,\n\
    f: 0\n\
  };\n\
  d3.interpolateTransform = d3_interpolateTransform;\n\
  function d3_interpolateTransform(a, b) {\n\
    var s = [], q = [], n, A = d3.transform(a), B = d3.transform(b), ta = A.translate, tb = B.translate, ra = A.rotate, rb = B.rotate, wa = A.skew, wb = B.skew, ka = A.scale, kb = B.scale;\n\
    if (ta[0] != tb[0] || ta[1] != tb[1]) {\n\
      s.push(\"translate(\", null, \",\", null, \")\");\n\
      q.push({\n\
        i: 1,\n\
        x: d3_interpolateNumber(ta[0], tb[0])\n\
      }, {\n\
        i: 3,\n\
        x: d3_interpolateNumber(ta[1], tb[1])\n\
      });\n\
    } else if (tb[0] || tb[1]) {\n\
      s.push(\"translate(\" + tb + \")\");\n\
    } else {\n\
      s.push(\"\");\n\
    }\n\
    if (ra != rb) {\n\
      if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360;\n\
      q.push({\n\
        i: s.push(s.pop() + \"rotate(\", null, \")\") - 2,\n\
        x: d3_interpolateNumber(ra, rb)\n\
      });\n\
    } else if (rb) {\n\
      s.push(s.pop() + \"rotate(\" + rb + \")\");\n\
    }\n\
    if (wa != wb) {\n\
      q.push({\n\
        i: s.push(s.pop() + \"skewX(\", null, \")\") - 2,\n\
        x: d3_interpolateNumber(wa, wb)\n\
      });\n\
    } else if (wb) {\n\
      s.push(s.pop() + \"skewX(\" + wb + \")\");\n\
    }\n\
    if (ka[0] != kb[0] || ka[1] != kb[1]) {\n\
      n = s.push(s.pop() + \"scale(\", null, \",\", null, \")\");\n\
      q.push({\n\
        i: n - 4,\n\
        x: d3_interpolateNumber(ka[0], kb[0])\n\
      }, {\n\
        i: n - 2,\n\
        x: d3_interpolateNumber(ka[1], kb[1])\n\
      });\n\
    } else if (kb[0] != 1 || kb[1] != 1) {\n\
      s.push(s.pop() + \"scale(\" + kb + \")\");\n\
    }\n\
    n = q.length;\n\
    return function(t) {\n\
      var i = -1, o;\n\
      while (++i < n) s[(o = q[i]).i] = o.x(t);\n\
      return s.join(\"\");\n\
    };\n\
  }\n\
  function d3_uninterpolateNumber(a, b) {\n\
    b = b - (a = +a) ? 1 / (b - a) : 0;\n\
    return function(x) {\n\
      return (x - a) * b;\n\
    };\n\
  }\n\
  function d3_uninterpolateClamp(a, b) {\n\
    b = b - (a = +a) ? 1 / (b - a) : 0;\n\
    return function(x) {\n\
      return Math.max(0, Math.min(1, (x - a) * b));\n\
    };\n\
  }\n\
  d3.layout = {};\n\
  d3.layout.bundle = function() {\n\
    return function(links) {\n\
      var paths = [], i = -1, n = links.length;\n\
      while (++i < n) paths.push(d3_layout_bundlePath(links[i]));\n\
      return paths;\n\
    };\n\
  };\n\
  function d3_layout_bundlePath(link) {\n\
    var start = link.source, end = link.target, lca = d3_layout_bundleLeastCommonAncestor(start, end), points = [ start ];\n\
    while (start !== lca) {\n\
      start = start.parent;\n\
      points.push(start);\n\
    }\n\
    var k = points.length;\n\
    while (end !== lca) {\n\
      points.splice(k, 0, end);\n\
      end = end.parent;\n\
    }\n\
    return points;\n\
  }\n\
  function d3_layout_bundleAncestors(node) {\n\
    var ancestors = [], parent = node.parent;\n\
    while (parent != null) {\n\
      ancestors.push(node);\n\
      node = parent;\n\
      parent = parent.parent;\n\
    }\n\
    ancestors.push(node);\n\
    return ancestors;\n\
  }\n\
  function d3_layout_bundleLeastCommonAncestor(a, b) {\n\
    if (a === b) return a;\n\
    var aNodes = d3_layout_bundleAncestors(a), bNodes = d3_layout_bundleAncestors(b), aNode = aNodes.pop(), bNode = bNodes.pop(), sharedNode = null;\n\
    while (aNode === bNode) {\n\
      sharedNode = aNode;\n\
      aNode = aNodes.pop();\n\
      bNode = bNodes.pop();\n\
    }\n\
    return sharedNode;\n\
  }\n\
  d3.layout.chord = function() {\n\
    var chord = {}, chords, groups, matrix, n, padding = 0, sortGroups, sortSubgroups, sortChords;\n\
    function relayout() {\n\
      var subgroups = {}, groupSums = [], groupIndex = d3.range(n), subgroupIndex = [], k, x, x0, i, j;\n\
      chords = [];\n\
      groups = [];\n\
      k = 0, i = -1;\n\
      while (++i < n) {\n\
        x = 0, j = -1;\n\
        while (++j < n) {\n\
          x += matrix[i][j];\n\
        }\n\
        groupSums.push(x);\n\
        subgroupIndex.push(d3.range(n));\n\
        k += x;\n\
      }\n\
      if (sortGroups) {\n\
        groupIndex.sort(function(a, b) {\n\
          return sortGroups(groupSums[a], groupSums[b]);\n\
        });\n\
      }\n\
      if (sortSubgroups) {\n\
        subgroupIndex.forEach(function(d, i) {\n\
          d.sort(function(a, b) {\n\
            return sortSubgroups(matrix[i][a], matrix[i][b]);\n\
          });\n\
        });\n\
      }\n\
      k = (τ - padding * n) / k;\n\
      x = 0, i = -1;\n\
      while (++i < n) {\n\
        x0 = x, j = -1;\n\
        while (++j < n) {\n\
          var di = groupIndex[i], dj = subgroupIndex[di][j], v = matrix[di][dj], a0 = x, a1 = x += v * k;\n\
          subgroups[di + \"-\" + dj] = {\n\
            index: di,\n\
            subindex: dj,\n\
            startAngle: a0,\n\
            endAngle: a1,\n\
            value: v\n\
          };\n\
        }\n\
        groups[di] = {\n\
          index: di,\n\
          startAngle: x0,\n\
          endAngle: x,\n\
          value: (x - x0) / k\n\
        };\n\
        x += padding;\n\
      }\n\
      i = -1;\n\
      while (++i < n) {\n\
        j = i - 1;\n\
        while (++j < n) {\n\
          var source = subgroups[i + \"-\" + j], target = subgroups[j + \"-\" + i];\n\
          if (source.value || target.value) {\n\
            chords.push(source.value < target.value ? {\n\
              source: target,\n\
              target: source\n\
            } : {\n\
              source: source,\n\
              target: target\n\
            });\n\
          }\n\
        }\n\
      }\n\
      if (sortChords) resort();\n\
    }\n\
    function resort() {\n\
      chords.sort(function(a, b) {\n\
        return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);\n\
      });\n\
    }\n\
    chord.matrix = function(x) {\n\
      if (!arguments.length) return matrix;\n\
      n = (matrix = x) && matrix.length;\n\
      chords = groups = null;\n\
      return chord;\n\
    };\n\
    chord.padding = function(x) {\n\
      if (!arguments.length) return padding;\n\
      padding = x;\n\
      chords = groups = null;\n\
      return chord;\n\
    };\n\
    chord.sortGroups = function(x) {\n\
      if (!arguments.length) return sortGroups;\n\
      sortGroups = x;\n\
      chords = groups = null;\n\
      return chord;\n\
    };\n\
    chord.sortSubgroups = function(x) {\n\
      if (!arguments.length) return sortSubgroups;\n\
      sortSubgroups = x;\n\
      chords = null;\n\
      return chord;\n\
    };\n\
    chord.sortChords = function(x) {\n\
      if (!arguments.length) return sortChords;\n\
      sortChords = x;\n\
      if (chords) resort();\n\
      return chord;\n\
    };\n\
    chord.chords = function() {\n\
      if (!chords) relayout();\n\
      return chords;\n\
    };\n\
    chord.groups = function() {\n\
      if (!groups) relayout();\n\
      return groups;\n\
    };\n\
    return chord;\n\
  };\n\
  d3.layout.force = function() {\n\
    var force = {}, event = d3.dispatch(\"start\", \"tick\", \"end\"), size = [ 1, 1 ], drag, alpha, friction = .9, linkDistance = d3_layout_forceLinkDistance, linkStrength = d3_layout_forceLinkStrength, charge = -30, gravity = .1, theta = .8, nodes = [], links = [], distances, strengths, charges;\n\
    function repulse(node) {\n\
      return function(quad, x1, _, x2) {\n\
        if (quad.point !== node) {\n\
          var dx = quad.cx - node.x, dy = quad.cy - node.y, dn = 1 / Math.sqrt(dx * dx + dy * dy);\n\
          if ((x2 - x1) * dn < theta) {\n\
            var k = quad.charge * dn * dn;\n\
            node.px -= dx * k;\n\
            node.py -= dy * k;\n\
            return true;\n\
          }\n\
          if (quad.point && isFinite(dn)) {\n\
            var k = quad.pointCharge * dn * dn;\n\
            node.px -= dx * k;\n\
            node.py -= dy * k;\n\
          }\n\
        }\n\
        return !quad.charge;\n\
      };\n\
    }\n\
    force.tick = function() {\n\
      if ((alpha *= .99) < .005) {\n\
        event.end({\n\
          type: \"end\",\n\
          alpha: alpha = 0\n\
        });\n\
        return true;\n\
      }\n\
      var n = nodes.length, m = links.length, q, i, o, s, t, l, k, x, y;\n\
      for (i = 0; i < m; ++i) {\n\
        o = links[i];\n\
        s = o.source;\n\
        t = o.target;\n\
        x = t.x - s.x;\n\
        y = t.y - s.y;\n\
        if (l = x * x + y * y) {\n\
          l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;\n\
          x *= l;\n\
          y *= l;\n\
          t.x -= x * (k = s.weight / (t.weight + s.weight));\n\
          t.y -= y * k;\n\
          s.x += x * (k = 1 - k);\n\
          s.y += y * k;\n\
        }\n\
      }\n\
      if (k = alpha * gravity) {\n\
        x = size[0] / 2;\n\
        y = size[1] / 2;\n\
        i = -1;\n\
        if (k) while (++i < n) {\n\
          o = nodes[i];\n\
          o.x += (x - o.x) * k;\n\
          o.y += (y - o.y) * k;\n\
        }\n\
      }\n\
      if (charge) {\n\
        d3_layout_forceAccumulate(q = d3.geom.quadtree(nodes), alpha, charges);\n\
        i = -1;\n\
        while (++i < n) {\n\
          if (!(o = nodes[i]).fixed) {\n\
            q.visit(repulse(o));\n\
          }\n\
        }\n\
      }\n\
      i = -1;\n\
      while (++i < n) {\n\
        o = nodes[i];\n\
        if (o.fixed) {\n\
          o.x = o.px;\n\
          o.y = o.py;\n\
        } else {\n\
          o.x -= (o.px - (o.px = o.x)) * friction;\n\
          o.y -= (o.py - (o.py = o.y)) * friction;\n\
        }\n\
      }\n\
      event.tick({\n\
        type: \"tick\",\n\
        alpha: alpha\n\
      });\n\
    };\n\
    force.nodes = function(x) {\n\
      if (!arguments.length) return nodes;\n\
      nodes = x;\n\
      return force;\n\
    };\n\
    force.links = function(x) {\n\
      if (!arguments.length) return links;\n\
      links = x;\n\
      return force;\n\
    };\n\
    force.size = function(x) {\n\
      if (!arguments.length) return size;\n\
      size = x;\n\
      return force;\n\
    };\n\
    force.linkDistance = function(x) {\n\
      if (!arguments.length) return linkDistance;\n\
      linkDistance = typeof x === \"function\" ? x : +x;\n\
      return force;\n\
    };\n\
    force.distance = force.linkDistance;\n\
    force.linkStrength = function(x) {\n\
      if (!arguments.length) return linkStrength;\n\
      linkStrength = typeof x === \"function\" ? x : +x;\n\
      return force;\n\
    };\n\
    force.friction = function(x) {\n\
      if (!arguments.length) return friction;\n\
      friction = +x;\n\
      return force;\n\
    };\n\
    force.charge = function(x) {\n\
      if (!arguments.length) return charge;\n\
      charge = typeof x === \"function\" ? x : +x;\n\
      return force;\n\
    };\n\
    force.gravity = function(x) {\n\
      if (!arguments.length) return gravity;\n\
      gravity = +x;\n\
      return force;\n\
    };\n\
    force.theta = function(x) {\n\
      if (!arguments.length) return theta;\n\
      theta = +x;\n\
      return force;\n\
    };\n\
    force.alpha = function(x) {\n\
      if (!arguments.length) return alpha;\n\
      x = +x;\n\
      if (alpha) {\n\
        if (x > 0) alpha = x; else alpha = 0;\n\
      } else if (x > 0) {\n\
        event.start({\n\
          type: \"start\",\n\
          alpha: alpha = x\n\
        });\n\
        d3.timer(force.tick);\n\
      }\n\
      return force;\n\
    };\n\
    force.start = function() {\n\
      var i, n = nodes.length, m = links.length, w = size[0], h = size[1], neighbors, o;\n\
      for (i = 0; i < n; ++i) {\n\
        (o = nodes[i]).index = i;\n\
        o.weight = 0;\n\
      }\n\
      for (i = 0; i < m; ++i) {\n\
        o = links[i];\n\
        if (typeof o.source == \"number\") o.source = nodes[o.source];\n\
        if (typeof o.target == \"number\") o.target = nodes[o.target];\n\
        ++o.source.weight;\n\
        ++o.target.weight;\n\
      }\n\
      for (i = 0; i < n; ++i) {\n\
        o = nodes[i];\n\
        if (isNaN(o.x)) o.x = position(\"x\", w);\n\
        if (isNaN(o.y)) o.y = position(\"y\", h);\n\
        if (isNaN(o.px)) o.px = o.x;\n\
        if (isNaN(o.py)) o.py = o.y;\n\
      }\n\
      distances = [];\n\
      if (typeof linkDistance === \"function\") for (i = 0; i < m; ++i) distances[i] = +linkDistance.call(this, links[i], i); else for (i = 0; i < m; ++i) distances[i] = linkDistance;\n\
      strengths = [];\n\
      if (typeof linkStrength === \"function\") for (i = 0; i < m; ++i) strengths[i] = +linkStrength.call(this, links[i], i); else for (i = 0; i < m; ++i) strengths[i] = linkStrength;\n\
      charges = [];\n\
      if (typeof charge === \"function\") for (i = 0; i < n; ++i) charges[i] = +charge.call(this, nodes[i], i); else for (i = 0; i < n; ++i) charges[i] = charge;\n\
      function position(dimension, size) {\n\
        if (!neighbors) {\n\
          neighbors = new Array(n);\n\
          for (j = 0; j < n; ++j) {\n\
            neighbors[j] = [];\n\
          }\n\
          for (j = 0; j < m; ++j) {\n\
            var o = links[j];\n\
            neighbors[o.source.index].push(o.target);\n\
            neighbors[o.target.index].push(o.source);\n\
          }\n\
        }\n\
        var candidates = neighbors[i], j = -1, m = candidates.length, x;\n\
        while (++j < m) if (!isNaN(x = candidates[j][dimension])) return x;\n\
        return Math.random() * size;\n\
      }\n\
      return force.resume();\n\
    };\n\
    force.resume = function() {\n\
      return force.alpha(.1);\n\
    };\n\
    force.stop = function() {\n\
      return force.alpha(0);\n\
    };\n\
    force.drag = function() {\n\
      if (!drag) drag = d3.behavior.drag().origin(d3_identity).on(\"dragstart.force\", d3_layout_forceDragstart).on(\"drag.force\", dragmove).on(\"dragend.force\", d3_layout_forceDragend);\n\
      if (!arguments.length) return drag;\n\
      this.on(\"mouseover.force\", d3_layout_forceMouseover).on(\"mouseout.force\", d3_layout_forceMouseout).call(drag);\n\
    };\n\
    function dragmove(d) {\n\
      d.px = d3.event.x, d.py = d3.event.y;\n\
      force.resume();\n\
    }\n\
    return d3.rebind(force, event, \"on\");\n\
  };\n\
  function d3_layout_forceDragstart(d) {\n\
    d.fixed |= 2;\n\
  }\n\
  function d3_layout_forceDragend(d) {\n\
    d.fixed &= ~6;\n\
  }\n\
  function d3_layout_forceMouseover(d) {\n\
    d.fixed |= 4;\n\
    d.px = d.x, d.py = d.y;\n\
  }\n\
  function d3_layout_forceMouseout(d) {\n\
    d.fixed &= ~4;\n\
  }\n\
  function d3_layout_forceAccumulate(quad, alpha, charges) {\n\
    var cx = 0, cy = 0;\n\
    quad.charge = 0;\n\
    if (!quad.leaf) {\n\
      var nodes = quad.nodes, n = nodes.length, i = -1, c;\n\
      while (++i < n) {\n\
        c = nodes[i];\n\
        if (c == null) continue;\n\
        d3_layout_forceAccumulate(c, alpha, charges);\n\
        quad.charge += c.charge;\n\
        cx += c.charge * c.cx;\n\
        cy += c.charge * c.cy;\n\
      }\n\
    }\n\
    if (quad.point) {\n\
      if (!quad.leaf) {\n\
        quad.point.x += Math.random() - .5;\n\
        quad.point.y += Math.random() - .5;\n\
      }\n\
      var k = alpha * charges[quad.point.index];\n\
      quad.charge += quad.pointCharge = k;\n\
      cx += k * quad.point.x;\n\
      cy += k * quad.point.y;\n\
    }\n\
    quad.cx = cx / quad.charge;\n\
    quad.cy = cy / quad.charge;\n\
  }\n\
  var d3_layout_forceLinkDistance = 20, d3_layout_forceLinkStrength = 1;\n\
  d3.layout.hierarchy = function() {\n\
    var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren, value = d3_layout_hierarchyValue;\n\
    function recurse(node, depth, nodes) {\n\
      var childs = children.call(hierarchy, node, depth);\n\
      node.depth = depth;\n\
      nodes.push(node);\n\
      if (childs && (n = childs.length)) {\n\
        var i = -1, n, c = node.children = new Array(n), v = 0, j = depth + 1, d;\n\
        while (++i < n) {\n\
          d = c[i] = recurse(childs[i], j, nodes);\n\
          d.parent = node;\n\
          v += d.value;\n\
        }\n\
        if (sort) c.sort(sort);\n\
        if (value) node.value = v;\n\
      } else {\n\
        delete node.children;\n\
        if (value) {\n\
          node.value = +value.call(hierarchy, node, depth) || 0;\n\
        }\n\
      }\n\
      return node;\n\
    }\n\
    function revalue(node, depth) {\n\
      var children = node.children, v = 0;\n\
      if (children && (n = children.length)) {\n\
        var i = -1, n, j = depth + 1;\n\
        while (++i < n) v += revalue(children[i], j);\n\
      } else if (value) {\n\
        v = +value.call(hierarchy, node, depth) || 0;\n\
      }\n\
      if (value) node.value = v;\n\
      return v;\n\
    }\n\
    function hierarchy(d) {\n\
      var nodes = [];\n\
      recurse(d, 0, nodes);\n\
      return nodes;\n\
    }\n\
    hierarchy.sort = function(x) {\n\
      if (!arguments.length) return sort;\n\
      sort = x;\n\
      return hierarchy;\n\
    };\n\
    hierarchy.children = function(x) {\n\
      if (!arguments.length) return children;\n\
      children = x;\n\
      return hierarchy;\n\
    };\n\
    hierarchy.value = function(x) {\n\
      if (!arguments.length) return value;\n\
      value = x;\n\
      return hierarchy;\n\
    };\n\
    hierarchy.revalue = function(root) {\n\
      revalue(root, 0);\n\
      return root;\n\
    };\n\
    return hierarchy;\n\
  };\n\
  function d3_layout_hierarchyRebind(object, hierarchy) {\n\
    d3.rebind(object, hierarchy, \"sort\", \"children\", \"value\");\n\
    object.nodes = object;\n\
    object.links = d3_layout_hierarchyLinks;\n\
    return object;\n\
  }\n\
  function d3_layout_hierarchyChildren(d) {\n\
    return d.children;\n\
  }\n\
  function d3_layout_hierarchyValue(d) {\n\
    return d.value;\n\
  }\n\
  function d3_layout_hierarchySort(a, b) {\n\
    return b.value - a.value;\n\
  }\n\
  function d3_layout_hierarchyLinks(nodes) {\n\
    return d3.merge(nodes.map(function(parent) {\n\
      return (parent.children || []).map(function(child) {\n\
        return {\n\
          source: parent,\n\
          target: child\n\
        };\n\
      });\n\
    }));\n\
  }\n\
  d3.layout.partition = function() {\n\
    var hierarchy = d3.layout.hierarchy(), size = [ 1, 1 ];\n\
    function position(node, x, dx, dy) {\n\
      var children = node.children;\n\
      node.x = x;\n\
      node.y = node.depth * dy;\n\
      node.dx = dx;\n\
      node.dy = dy;\n\
      if (children && (n = children.length)) {\n\
        var i = -1, n, c, d;\n\
        dx = node.value ? dx / node.value : 0;\n\
        while (++i < n) {\n\
          position(c = children[i], x, d = c.value * dx, dy);\n\
          x += d;\n\
        }\n\
      }\n\
    }\n\
    function depth(node) {\n\
      var children = node.children, d = 0;\n\
      if (children && (n = children.length)) {\n\
        var i = -1, n;\n\
        while (++i < n) d = Math.max(d, depth(children[i]));\n\
      }\n\
      return 1 + d;\n\
    }\n\
    function partition(d, i) {\n\
      var nodes = hierarchy.call(this, d, i);\n\
      position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));\n\
      return nodes;\n\
    }\n\
    partition.size = function(x) {\n\
      if (!arguments.length) return size;\n\
      size = x;\n\
      return partition;\n\
    };\n\
    return d3_layout_hierarchyRebind(partition, hierarchy);\n\
  };\n\
  d3.layout.pie = function() {\n\
    var value = Number, sort = d3_layout_pieSortByValue, startAngle = 0, endAngle = τ;\n\
    function pie(data) {\n\
      var values = data.map(function(d, i) {\n\
        return +value.call(pie, d, i);\n\
      });\n\
      var a = +(typeof startAngle === \"function\" ? startAngle.apply(this, arguments) : startAngle);\n\
      var k = ((typeof endAngle === \"function\" ? endAngle.apply(this, arguments) : endAngle) - a) / d3.sum(values);\n\
      var index = d3.range(data.length);\n\
      if (sort != null) index.sort(sort === d3_layout_pieSortByValue ? function(i, j) {\n\
        return values[j] - values[i];\n\
      } : function(i, j) {\n\
        return sort(data[i], data[j]);\n\
      });\n\
      var arcs = [];\n\
      index.forEach(function(i) {\n\
        var d;\n\
        arcs[i] = {\n\
          data: data[i],\n\
          value: d = values[i],\n\
          startAngle: a,\n\
          endAngle: a += d * k\n\
        };\n\
      });\n\
      return arcs;\n\
    }\n\
    pie.value = function(x) {\n\
      if (!arguments.length) return value;\n\
      value = x;\n\
      return pie;\n\
    };\n\
    pie.sort = function(x) {\n\
      if (!arguments.length) return sort;\n\
      sort = x;\n\
      return pie;\n\
    };\n\
    pie.startAngle = function(x) {\n\
      if (!arguments.length) return startAngle;\n\
      startAngle = x;\n\
      return pie;\n\
    };\n\
    pie.endAngle = function(x) {\n\
      if (!arguments.length) return endAngle;\n\
      endAngle = x;\n\
      return pie;\n\
    };\n\
    return pie;\n\
  };\n\
  var d3_layout_pieSortByValue = {};\n\
  d3.layout.stack = function() {\n\
    var values = d3_identity, order = d3_layout_stackOrderDefault, offset = d3_layout_stackOffsetZero, out = d3_layout_stackOut, x = d3_layout_stackX, y = d3_layout_stackY;\n\
    function stack(data, index) {\n\
      var series = data.map(function(d, i) {\n\
        return values.call(stack, d, i);\n\
      });\n\
      var points = series.map(function(d) {\n\
        return d.map(function(v, i) {\n\
          return [ x.call(stack, v, i), y.call(stack, v, i) ];\n\
        });\n\
      });\n\
      var orders = order.call(stack, points, index);\n\
      series = d3.permute(series, orders);\n\
      points = d3.permute(points, orders);\n\
      var offsets = offset.call(stack, points, index);\n\
      var n = series.length, m = series[0].length, i, j, o;\n\
      for (j = 0; j < m; ++j) {\n\
        out.call(stack, series[0][j], o = offsets[j], points[0][j][1]);\n\
        for (i = 1; i < n; ++i) {\n\
          out.call(stack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);\n\
        }\n\
      }\n\
      return data;\n\
    }\n\
    stack.values = function(x) {\n\
      if (!arguments.length) return values;\n\
      values = x;\n\
      return stack;\n\
    };\n\
    stack.order = function(x) {\n\
      if (!arguments.length) return order;\n\
      order = typeof x === \"function\" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;\n\
      return stack;\n\
    };\n\
    stack.offset = function(x) {\n\
      if (!arguments.length) return offset;\n\
      offset = typeof x === \"function\" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;\n\
      return stack;\n\
    };\n\
    stack.x = function(z) {\n\
      if (!arguments.length) return x;\n\
      x = z;\n\
      return stack;\n\
    };\n\
    stack.y = function(z) {\n\
      if (!arguments.length) return y;\n\
      y = z;\n\
      return stack;\n\
    };\n\
    stack.out = function(z) {\n\
      if (!arguments.length) return out;\n\
      out = z;\n\
      return stack;\n\
    };\n\
    return stack;\n\
  };\n\
  function d3_layout_stackX(d) {\n\
    return d.x;\n\
  }\n\
  function d3_layout_stackY(d) {\n\
    return d.y;\n\
  }\n\
  function d3_layout_stackOut(d, y0, y) {\n\
    d.y0 = y0;\n\
    d.y = y;\n\
  }\n\
  var d3_layout_stackOrders = d3.map({\n\
    \"inside-out\": function(data) {\n\
      var n = data.length, i, j, max = data.map(d3_layout_stackMaxIndex), sums = data.map(d3_layout_stackReduceSum), index = d3.range(n).sort(function(a, b) {\n\
        return max[a] - max[b];\n\
      }), top = 0, bottom = 0, tops = [], bottoms = [];\n\
      for (i = 0; i < n; ++i) {\n\
        j = index[i];\n\
        if (top < bottom) {\n\
          top += sums[j];\n\
          tops.push(j);\n\
        } else {\n\
          bottom += sums[j];\n\
          bottoms.push(j);\n\
        }\n\
      }\n\
      return bottoms.reverse().concat(tops);\n\
    },\n\
    reverse: function(data) {\n\
      return d3.range(data.length).reverse();\n\
    },\n\
    \"default\": d3_layout_stackOrderDefault\n\
  });\n\
  var d3_layout_stackOffsets = d3.map({\n\
    silhouette: function(data) {\n\
      var n = data.length, m = data[0].length, sums = [], max = 0, i, j, o, y0 = [];\n\
      for (j = 0; j < m; ++j) {\n\
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];\n\
        if (o > max) max = o;\n\
        sums.push(o);\n\
      }\n\
      for (j = 0; j < m; ++j) {\n\
        y0[j] = (max - sums[j]) / 2;\n\
      }\n\
      return y0;\n\
    },\n\
    wiggle: function(data) {\n\
      var n = data.length, x = data[0], m = x.length, i, j, k, s1, s2, s3, dx, o, o0, y0 = [];\n\
      y0[0] = o = o0 = 0;\n\
      for (j = 1; j < m; ++j) {\n\
        for (i = 0, s1 = 0; i < n; ++i) s1 += data[i][j][1];\n\
        for (i = 0, s2 = 0, dx = x[j][0] - x[j - 1][0]; i < n; ++i) {\n\
          for (k = 0, s3 = (data[i][j][1] - data[i][j - 1][1]) / (2 * dx); k < i; ++k) {\n\
            s3 += (data[k][j][1] - data[k][j - 1][1]) / dx;\n\
          }\n\
          s2 += s3 * data[i][j][1];\n\
        }\n\
        y0[j] = o -= s1 ? s2 / s1 * dx : 0;\n\
        if (o < o0) o0 = o;\n\
      }\n\
      for (j = 0; j < m; ++j) y0[j] -= o0;\n\
      return y0;\n\
    },\n\
    expand: function(data) {\n\
      var n = data.length, m = data[0].length, k = 1 / n, i, j, o, y0 = [];\n\
      for (j = 0; j < m; ++j) {\n\
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];\n\
        if (o) for (i = 0; i < n; i++) data[i][j][1] /= o; else for (i = 0; i < n; i++) data[i][j][1] = k;\n\
      }\n\
      for (j = 0; j < m; ++j) y0[j] = 0;\n\
      return y0;\n\
    },\n\
    zero: d3_layout_stackOffsetZero\n\
  });\n\
  function d3_layout_stackOrderDefault(data) {\n\
    return d3.range(data.length);\n\
  }\n\
  function d3_layout_stackOffsetZero(data) {\n\
    var j = -1, m = data[0].length, y0 = [];\n\
    while (++j < m) y0[j] = 0;\n\
    return y0;\n\
  }\n\
  function d3_layout_stackMaxIndex(array) {\n\
    var i = 1, j = 0, v = array[0][1], k, n = array.length;\n\
    for (;i < n; ++i) {\n\
      if ((k = array[i][1]) > v) {\n\
        j = i;\n\
        v = k;\n\
      }\n\
    }\n\
    return j;\n\
  }\n\
  function d3_layout_stackReduceSum(d) {\n\
    return d.reduce(d3_layout_stackSum, 0);\n\
  }\n\
  function d3_layout_stackSum(p, d) {\n\
    return p + d[1];\n\
  }\n\
  d3.layout.histogram = function() {\n\
    var frequency = true, valuer = Number, ranger = d3_layout_histogramRange, binner = d3_layout_histogramBinSturges;\n\
    function histogram(data, i) {\n\
      var bins = [], values = data.map(valuer, this), range = ranger.call(this, values, i), thresholds = binner.call(this, range, values, i), bin, i = -1, n = values.length, m = thresholds.length - 1, k = frequency ? 1 : 1 / n, x;\n\
      while (++i < m) {\n\
        bin = bins[i] = [];\n\
        bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);\n\
        bin.y = 0;\n\
      }\n\
      if (m > 0) {\n\
        i = -1;\n\
        while (++i < n) {\n\
          x = values[i];\n\
          if (x >= range[0] && x <= range[1]) {\n\
            bin = bins[d3.bisect(thresholds, x, 1, m) - 1];\n\
            bin.y += k;\n\
            bin.push(data[i]);\n\
          }\n\
        }\n\
      }\n\
      return bins;\n\
    }\n\
    histogram.value = function(x) {\n\
      if (!arguments.length) return valuer;\n\
      valuer = x;\n\
      return histogram;\n\
    };\n\
    histogram.range = function(x) {\n\
      if (!arguments.length) return ranger;\n\
      ranger = d3_functor(x);\n\
      return histogram;\n\
    };\n\
    histogram.bins = function(x) {\n\
      if (!arguments.length) return binner;\n\
      binner = typeof x === \"number\" ? function(range) {\n\
        return d3_layout_histogramBinFixed(range, x);\n\
      } : d3_functor(x);\n\
      return histogram;\n\
    };\n\
    histogram.frequency = function(x) {\n\
      if (!arguments.length) return frequency;\n\
      frequency = !!x;\n\
      return histogram;\n\
    };\n\
    return histogram;\n\
  };\n\
  function d3_layout_histogramBinSturges(range, values) {\n\
    return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));\n\
  }\n\
  function d3_layout_histogramBinFixed(range, n) {\n\
    var x = -1, b = +range[0], m = (range[1] - b) / n, f = [];\n\
    while (++x <= n) f[x] = m * x + b;\n\
    return f;\n\
  }\n\
  function d3_layout_histogramRange(values) {\n\
    return [ d3.min(values), d3.max(values) ];\n\
  }\n\
  d3.layout.tree = function() {\n\
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = false;\n\
    function tree(d, i) {\n\
      var nodes = hierarchy.call(this, d, i), root = nodes[0];\n\
      function firstWalk(node, previousSibling) {\n\
        var children = node.children, layout = node._tree;\n\
        if (children && (n = children.length)) {\n\
          var n, firstChild = children[0], previousChild, ancestor = firstChild, child, i = -1;\n\
          while (++i < n) {\n\
            child = children[i];\n\
            firstWalk(child, previousChild);\n\
            ancestor = apportion(child, previousChild, ancestor);\n\
            previousChild = child;\n\
          }\n\
          d3_layout_treeShift(node);\n\
          var midpoint = .5 * (firstChild._tree.prelim + child._tree.prelim);\n\
          if (previousSibling) {\n\
            layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);\n\
            layout.mod = layout.prelim - midpoint;\n\
          } else {\n\
            layout.prelim = midpoint;\n\
          }\n\
        } else {\n\
          if (previousSibling) {\n\
            layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);\n\
          }\n\
        }\n\
      }\n\
      function secondWalk(node, x) {\n\
        node.x = node._tree.prelim + x;\n\
        var children = node.children;\n\
        if (children && (n = children.length)) {\n\
          var i = -1, n;\n\
          x += node._tree.mod;\n\
          while (++i < n) {\n\
            secondWalk(children[i], x);\n\
          }\n\
        }\n\
      }\n\
      function apportion(node, previousSibling, ancestor) {\n\
        if (previousSibling) {\n\
          var vip = node, vop = node, vim = previousSibling, vom = node.parent.children[0], sip = vip._tree.mod, sop = vop._tree.mod, sim = vim._tree.mod, som = vom._tree.mod, shift;\n\
          while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {\n\
            vom = d3_layout_treeLeft(vom);\n\
            vop = d3_layout_treeRight(vop);\n\
            vop._tree.ancestor = node;\n\
            shift = vim._tree.prelim + sim - vip._tree.prelim - sip + separation(vim, vip);\n\
            if (shift > 0) {\n\
              d3_layout_treeMove(d3_layout_treeAncestor(vim, node, ancestor), node, shift);\n\
              sip += shift;\n\
              sop += shift;\n\
            }\n\
            sim += vim._tree.mod;\n\
            sip += vip._tree.mod;\n\
            som += vom._tree.mod;\n\
            sop += vop._tree.mod;\n\
          }\n\
          if (vim && !d3_layout_treeRight(vop)) {\n\
            vop._tree.thread = vim;\n\
            vop._tree.mod += sim - sop;\n\
          }\n\
          if (vip && !d3_layout_treeLeft(vom)) {\n\
            vom._tree.thread = vip;\n\
            vom._tree.mod += sip - som;\n\
            ancestor = node;\n\
          }\n\
        }\n\
        return ancestor;\n\
      }\n\
      d3_layout_treeVisitAfter(root, function(node, previousSibling) {\n\
        node._tree = {\n\
          ancestor: node,\n\
          prelim: 0,\n\
          mod: 0,\n\
          change: 0,\n\
          shift: 0,\n\
          number: previousSibling ? previousSibling._tree.number + 1 : 0\n\
        };\n\
      });\n\
      firstWalk(root);\n\
      secondWalk(root, -root._tree.prelim);\n\
      var left = d3_layout_treeSearch(root, d3_layout_treeLeftmost), right = d3_layout_treeSearch(root, d3_layout_treeRightmost), deep = d3_layout_treeSearch(root, d3_layout_treeDeepest), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2, y1 = deep.depth || 1;\n\
      d3_layout_treeVisitAfter(root, nodeSize ? function(node) {\n\
        node.x *= size[0];\n\
        node.y = node.depth * size[1];\n\
        delete node._tree;\n\
      } : function(node) {\n\
        node.x = (node.x - x0) / (x1 - x0) * size[0];\n\
        node.y = node.depth / y1 * size[1];\n\
        delete node._tree;\n\
      });\n\
      return nodes;\n\
    }\n\
    tree.separation = function(x) {\n\
      if (!arguments.length) return separation;\n\
      separation = x;\n\
      return tree;\n\
    };\n\
    tree.size = function(x) {\n\
      if (!arguments.length) return nodeSize ? null : size;\n\
      nodeSize = (size = x) == null;\n\
      return tree;\n\
    };\n\
    tree.nodeSize = function(x) {\n\
      if (!arguments.length) return nodeSize ? size : null;\n\
      nodeSize = (size = x) != null;\n\
      return tree;\n\
    };\n\
    return d3_layout_hierarchyRebind(tree, hierarchy);\n\
  };\n\
  function d3_layout_treeSeparation(a, b) {\n\
    return a.parent == b.parent ? 1 : 2;\n\
  }\n\
  function d3_layout_treeLeft(node) {\n\
    var children = node.children;\n\
    return children && children.length ? children[0] : node._tree.thread;\n\
  }\n\
  function d3_layout_treeRight(node) {\n\
    var children = node.children, n;\n\
    return children && (n = children.length) ? children[n - 1] : node._tree.thread;\n\
  }\n\
  function d3_layout_treeSearch(node, compare) {\n\
    var children = node.children;\n\
    if (children && (n = children.length)) {\n\
      var child, n, i = -1;\n\
      while (++i < n) {\n\
        if (compare(child = d3_layout_treeSearch(children[i], compare), node) > 0) {\n\
          node = child;\n\
        }\n\
      }\n\
    }\n\
    return node;\n\
  }\n\
  function d3_layout_treeRightmost(a, b) {\n\
    return a.x - b.x;\n\
  }\n\
  function d3_layout_treeLeftmost(a, b) {\n\
    return b.x - a.x;\n\
  }\n\
  function d3_layout_treeDeepest(a, b) {\n\
    return a.depth - b.depth;\n\
  }\n\
  function d3_layout_treeVisitAfter(node, callback) {\n\
    function visit(node, previousSibling) {\n\
      var children = node.children;\n\
      if (children && (n = children.length)) {\n\
        var child, previousChild = null, i = -1, n;\n\
        while (++i < n) {\n\
          child = children[i];\n\
          visit(child, previousChild);\n\
          previousChild = child;\n\
        }\n\
      }\n\
      callback(node, previousSibling);\n\
    }\n\
    visit(node, null);\n\
  }\n\
  function d3_layout_treeShift(node) {\n\
    var shift = 0, change = 0, children = node.children, i = children.length, child;\n\
    while (--i >= 0) {\n\
      child = children[i]._tree;\n\
      child.prelim += shift;\n\
      child.mod += shift;\n\
      shift += child.shift + (change += child.change);\n\
    }\n\
  }\n\
  function d3_layout_treeMove(ancestor, node, shift) {\n\
    ancestor = ancestor._tree;\n\
    node = node._tree;\n\
    var change = shift / (node.number - ancestor.number);\n\
    ancestor.change += change;\n\
    node.change -= change;\n\
    node.shift += shift;\n\
    node.prelim += shift;\n\
    node.mod += shift;\n\
  }\n\
  function d3_layout_treeAncestor(vim, node, ancestor) {\n\
    return vim._tree.ancestor.parent == node.parent ? vim._tree.ancestor : ancestor;\n\
  }\n\
  d3.layout.pack = function() {\n\
    var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort), padding = 0, size = [ 1, 1 ], radius;\n\
    function pack(d, i) {\n\
      var nodes = hierarchy.call(this, d, i), root = nodes[0], w = size[0], h = size[1], r = radius == null ? Math.sqrt : typeof radius === \"function\" ? radius : function() {\n\
        return radius;\n\
      };\n\
      root.x = root.y = 0;\n\
      d3_layout_treeVisitAfter(root, function(d) {\n\
        d.r = +r(d.value);\n\
      });\n\
      d3_layout_treeVisitAfter(root, d3_layout_packSiblings);\n\
      if (padding) {\n\
        var dr = padding * (radius ? 1 : Math.max(2 * root.r / w, 2 * root.r / h)) / 2;\n\
        d3_layout_treeVisitAfter(root, function(d) {\n\
          d.r += dr;\n\
        });\n\
        d3_layout_treeVisitAfter(root, d3_layout_packSiblings);\n\
        d3_layout_treeVisitAfter(root, function(d) {\n\
          d.r -= dr;\n\
        });\n\
      }\n\
      d3_layout_packTransform(root, w / 2, h / 2, radius ? 1 : 1 / Math.max(2 * root.r / w, 2 * root.r / h));\n\
      return nodes;\n\
    }\n\
    pack.size = function(_) {\n\
      if (!arguments.length) return size;\n\
      size = _;\n\
      return pack;\n\
    };\n\
    pack.radius = function(_) {\n\
      if (!arguments.length) return radius;\n\
      radius = _ == null || typeof _ === \"function\" ? _ : +_;\n\
      return pack;\n\
    };\n\
    pack.padding = function(_) {\n\
      if (!arguments.length) return padding;\n\
      padding = +_;\n\
      return pack;\n\
    };\n\
    return d3_layout_hierarchyRebind(pack, hierarchy);\n\
  };\n\
  function d3_layout_packSort(a, b) {\n\
    return a.value - b.value;\n\
  }\n\
  function d3_layout_packInsert(a, b) {\n\
    var c = a._pack_next;\n\
    a._pack_next = b;\n\
    b._pack_prev = a;\n\
    b._pack_next = c;\n\
    c._pack_prev = b;\n\
  }\n\
  function d3_layout_packSplice(a, b) {\n\
    a._pack_next = b;\n\
    b._pack_prev = a;\n\
  }\n\
  function d3_layout_packIntersects(a, b) {\n\
    var dx = b.x - a.x, dy = b.y - a.y, dr = a.r + b.r;\n\
    return .999 * dr * dr > dx * dx + dy * dy;\n\
  }\n\
  function d3_layout_packSiblings(node) {\n\
    if (!(nodes = node.children) || !(n = nodes.length)) return;\n\
    var nodes, xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, a, b, c, i, j, k, n;\n\
    function bound(node) {\n\
      xMin = Math.min(node.x - node.r, xMin);\n\
      xMax = Math.max(node.x + node.r, xMax);\n\
      yMin = Math.min(node.y - node.r, yMin);\n\
      yMax = Math.max(node.y + node.r, yMax);\n\
    }\n\
    nodes.forEach(d3_layout_packLink);\n\
    a = nodes[0];\n\
    a.x = -a.r;\n\
    a.y = 0;\n\
    bound(a);\n\
    if (n > 1) {\n\
      b = nodes[1];\n\
      b.x = b.r;\n\
      b.y = 0;\n\
      bound(b);\n\
      if (n > 2) {\n\
        c = nodes[2];\n\
        d3_layout_packPlace(a, b, c);\n\
        bound(c);\n\
        d3_layout_packInsert(a, c);\n\
        a._pack_prev = c;\n\
        d3_layout_packInsert(c, b);\n\
        b = a._pack_next;\n\
        for (i = 3; i < n; i++) {\n\
          d3_layout_packPlace(a, b, c = nodes[i]);\n\
          var isect = 0, s1 = 1, s2 = 1;\n\
          for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {\n\
            if (d3_layout_packIntersects(j, c)) {\n\
              isect = 1;\n\
              break;\n\
            }\n\
          }\n\
          if (isect == 1) {\n\
            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {\n\
              if (d3_layout_packIntersects(k, c)) {\n\
                break;\n\
              }\n\
            }\n\
          }\n\
          if (isect) {\n\
            if (s1 < s2 || s1 == s2 && b.r < a.r) d3_layout_packSplice(a, b = j); else d3_layout_packSplice(a = k, b);\n\
            i--;\n\
          } else {\n\
            d3_layout_packInsert(a, c);\n\
            b = c;\n\
            bound(c);\n\
          }\n\
        }\n\
      }\n\
    }\n\
    var cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2, cr = 0;\n\
    for (i = 0; i < n; i++) {\n\
      c = nodes[i];\n\
      c.x -= cx;\n\
      c.y -= cy;\n\
      cr = Math.max(cr, c.r + Math.sqrt(c.x * c.x + c.y * c.y));\n\
    }\n\
    node.r = cr;\n\
    nodes.forEach(d3_layout_packUnlink);\n\
  }\n\
  function d3_layout_packLink(node) {\n\
    node._pack_next = node._pack_prev = node;\n\
  }\n\
  function d3_layout_packUnlink(node) {\n\
    delete node._pack_next;\n\
    delete node._pack_prev;\n\
  }\n\
  function d3_layout_packTransform(node, x, y, k) {\n\
    var children = node.children;\n\
    node.x = x += k * node.x;\n\
    node.y = y += k * node.y;\n\
    node.r *= k;\n\
    if (children) {\n\
      var i = -1, n = children.length;\n\
      while (++i < n) d3_layout_packTransform(children[i], x, y, k);\n\
    }\n\
  }\n\
  function d3_layout_packPlace(a, b, c) {\n\
    var db = a.r + c.r, dx = b.x - a.x, dy = b.y - a.y;\n\
    if (db && (dx || dy)) {\n\
      var da = b.r + c.r, dc = dx * dx + dy * dy;\n\
      da *= da;\n\
      db *= db;\n\
      var x = .5 + (db - da) / (2 * dc), y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);\n\
      c.x = a.x + x * dx + y * dy;\n\
      c.y = a.y + x * dy - y * dx;\n\
    } else {\n\
      c.x = a.x + db;\n\
      c.y = a.y;\n\
    }\n\
  }\n\
  d3.layout.cluster = function() {\n\
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = false;\n\
    function cluster(d, i) {\n\
      var nodes = hierarchy.call(this, d, i), root = nodes[0], previousNode, x = 0;\n\
      d3_layout_treeVisitAfter(root, function(node) {\n\
        var children = node.children;\n\
        if (children && children.length) {\n\
          node.x = d3_layout_clusterX(children);\n\
          node.y = d3_layout_clusterY(children);\n\
        } else {\n\
          node.x = previousNode ? x += separation(node, previousNode) : 0;\n\
          node.y = 0;\n\
          previousNode = node;\n\
        }\n\
      });\n\
      var left = d3_layout_clusterLeft(root), right = d3_layout_clusterRight(root), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2;\n\
      d3_layout_treeVisitAfter(root, nodeSize ? function(node) {\n\
        node.x = (node.x - root.x) * size[0];\n\
        node.y = (root.y - node.y) * size[1];\n\
      } : function(node) {\n\
        node.x = (node.x - x0) / (x1 - x0) * size[0];\n\
        node.y = (1 - (root.y ? node.y / root.y : 1)) * size[1];\n\
      });\n\
      return nodes;\n\
    }\n\
    cluster.separation = function(x) {\n\
      if (!arguments.length) return separation;\n\
      separation = x;\n\
      return cluster;\n\
    };\n\
    cluster.size = function(x) {\n\
      if (!arguments.length) return nodeSize ? null : size;\n\
      nodeSize = (size = x) == null;\n\
      return cluster;\n\
    };\n\
    cluster.nodeSize = function(x) {\n\
      if (!arguments.length) return nodeSize ? size : null;\n\
      nodeSize = (size = x) != null;\n\
      return cluster;\n\
    };\n\
    return d3_layout_hierarchyRebind(cluster, hierarchy);\n\
  };\n\
  function d3_layout_clusterY(children) {\n\
    return 1 + d3.max(children, function(child) {\n\
      return child.y;\n\
    });\n\
  }\n\
  function d3_layout_clusterX(children) {\n\
    return children.reduce(function(x, child) {\n\
      return x + child.x;\n\
    }, 0) / children.length;\n\
  }\n\
  function d3_layout_clusterLeft(node) {\n\
    var children = node.children;\n\
    return children && children.length ? d3_layout_clusterLeft(children[0]) : node;\n\
  }\n\
  function d3_layout_clusterRight(node) {\n\
    var children = node.children, n;\n\
    return children && (n = children.length) ? d3_layout_clusterRight(children[n - 1]) : node;\n\
  }\n\
  d3.layout.treemap = function() {\n\
    var hierarchy = d3.layout.hierarchy(), round = Math.round, size = [ 1, 1 ], padding = null, pad = d3_layout_treemapPadNull, sticky = false, stickies, mode = \"squarify\", ratio = .5 * (1 + Math.sqrt(5));\n\
    function scale(children, k) {\n\
      var i = -1, n = children.length, child, area;\n\
      while (++i < n) {\n\
        area = (child = children[i]).value * (k < 0 ? 0 : k);\n\
        child.area = isNaN(area) || area <= 0 ? 0 : area;\n\
      }\n\
    }\n\
    function squarify(node) {\n\
      var children = node.children;\n\
      if (children && children.length) {\n\
        var rect = pad(node), row = [], remaining = children.slice(), child, best = Infinity, score, u = mode === \"slice\" ? rect.dx : mode === \"dice\" ? rect.dy : mode === \"slice-dice\" ? node.depth & 1 ? rect.dy : rect.dx : Math.min(rect.dx, rect.dy), n;\n\
        scale(remaining, rect.dx * rect.dy / node.value);\n\
        row.area = 0;\n\
        while ((n = remaining.length) > 0) {\n\
          row.push(child = remaining[n - 1]);\n\
          row.area += child.area;\n\
          if (mode !== \"squarify\" || (score = worst(row, u)) <= best) {\n\
            remaining.pop();\n\
            best = score;\n\
          } else {\n\
            row.area -= row.pop().area;\n\
            position(row, u, rect, false);\n\
            u = Math.min(rect.dx, rect.dy);\n\
            row.length = row.area = 0;\n\
            best = Infinity;\n\
          }\n\
        }\n\
        if (row.length) {\n\
          position(row, u, rect, true);\n\
          row.length = row.area = 0;\n\
        }\n\
        children.forEach(squarify);\n\
      }\n\
    }\n\
    function stickify(node) {\n\
      var children = node.children;\n\
      if (children && children.length) {\n\
        var rect = pad(node), remaining = children.slice(), child, row = [];\n\
        scale(remaining, rect.dx * rect.dy / node.value);\n\
        row.area = 0;\n\
        while (child = remaining.pop()) {\n\
          row.push(child);\n\
          row.area += child.area;\n\
          if (child.z != null) {\n\
            position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);\n\
            row.length = row.area = 0;\n\
          }\n\
        }\n\
        children.forEach(stickify);\n\
      }\n\
    }\n\
    function worst(row, u) {\n\
      var s = row.area, r, rmax = 0, rmin = Infinity, i = -1, n = row.length;\n\
      while (++i < n) {\n\
        if (!(r = row[i].area)) continue;\n\
        if (r < rmin) rmin = r;\n\
        if (r > rmax) rmax = r;\n\
      }\n\
      s *= s;\n\
      u *= u;\n\
      return s ? Math.max(u * rmax * ratio / s, s / (u * rmin * ratio)) : Infinity;\n\
    }\n\
    function position(row, u, rect, flush) {\n\
      var i = -1, n = row.length, x = rect.x, y = rect.y, v = u ? round(row.area / u) : 0, o;\n\
      if (u == rect.dx) {\n\
        if (flush || v > rect.dy) v = rect.dy;\n\
        while (++i < n) {\n\
          o = row[i];\n\
          o.x = x;\n\
          o.y = y;\n\
          o.dy = v;\n\
          x += o.dx = Math.min(rect.x + rect.dx - x, v ? round(o.area / v) : 0);\n\
        }\n\
        o.z = true;\n\
        o.dx += rect.x + rect.dx - x;\n\
        rect.y += v;\n\
        rect.dy -= v;\n\
      } else {\n\
        if (flush || v > rect.dx) v = rect.dx;\n\
        while (++i < n) {\n\
          o = row[i];\n\
          o.x = x;\n\
          o.y = y;\n\
          o.dx = v;\n\
          y += o.dy = Math.min(rect.y + rect.dy - y, v ? round(o.area / v) : 0);\n\
        }\n\
        o.z = false;\n\
        o.dy += rect.y + rect.dy - y;\n\
        rect.x += v;\n\
        rect.dx -= v;\n\
      }\n\
    }\n\
    function treemap(d) {\n\
      var nodes = stickies || hierarchy(d), root = nodes[0];\n\
      root.x = 0;\n\
      root.y = 0;\n\
      root.dx = size[0];\n\
      root.dy = size[1];\n\
      if (stickies) hierarchy.revalue(root);\n\
      scale([ root ], root.dx * root.dy / root.value);\n\
      (stickies ? stickify : squarify)(root);\n\
      if (sticky) stickies = nodes;\n\
      return nodes;\n\
    }\n\
    treemap.size = function(x) {\n\
      if (!arguments.length) return size;\n\
      size = x;\n\
      return treemap;\n\
    };\n\
    treemap.padding = function(x) {\n\
      if (!arguments.length) return padding;\n\
      function padFunction(node) {\n\
        var p = x.call(treemap, node, node.depth);\n\
        return p == null ? d3_layout_treemapPadNull(node) : d3_layout_treemapPad(node, typeof p === \"number\" ? [ p, p, p, p ] : p);\n\
      }\n\
      function padConstant(node) {\n\
        return d3_layout_treemapPad(node, x);\n\
      }\n\
      var type;\n\
      pad = (padding = x) == null ? d3_layout_treemapPadNull : (type = typeof x) === \"function\" ? padFunction : type === \"number\" ? (x = [ x, x, x, x ], \n\
      padConstant) : padConstant;\n\
      return treemap;\n\
    };\n\
    treemap.round = function(x) {\n\
      if (!arguments.length) return round != Number;\n\
      round = x ? Math.round : Number;\n\
      return treemap;\n\
    };\n\
    treemap.sticky = function(x) {\n\
      if (!arguments.length) return sticky;\n\
      sticky = x;\n\
      stickies = null;\n\
      return treemap;\n\
    };\n\
    treemap.ratio = function(x) {\n\
      if (!arguments.length) return ratio;\n\
      ratio = x;\n\
      return treemap;\n\
    };\n\
    treemap.mode = function(x) {\n\
      if (!arguments.length) return mode;\n\
      mode = x + \"\";\n\
      return treemap;\n\
    };\n\
    return d3_layout_hierarchyRebind(treemap, hierarchy);\n\
  };\n\
  function d3_layout_treemapPadNull(node) {\n\
    return {\n\
      x: node.x,\n\
      y: node.y,\n\
      dx: node.dx,\n\
      dy: node.dy\n\
    };\n\
  }\n\
  function d3_layout_treemapPad(node, padding) {\n\
    var x = node.x + padding[3], y = node.y + padding[0], dx = node.dx - padding[1] - padding[3], dy = node.dy - padding[0] - padding[2];\n\
    if (dx < 0) {\n\
      x += dx / 2;\n\
      dx = 0;\n\
    }\n\
    if (dy < 0) {\n\
      y += dy / 2;\n\
      dy = 0;\n\
    }\n\
    return {\n\
      x: x,\n\
      y: y,\n\
      dx: dx,\n\
      dy: dy\n\
    };\n\
  }\n\
  d3.random = {\n\
    normal: function(µ, σ) {\n\
      var n = arguments.length;\n\
      if (n < 2) σ = 1;\n\
      if (n < 1) µ = 0;\n\
      return function() {\n\
        var x, y, r;\n\
        do {\n\
          x = Math.random() * 2 - 1;\n\
          y = Math.random() * 2 - 1;\n\
          r = x * x + y * y;\n\
        } while (!r || r > 1);\n\
        return µ + σ * x * Math.sqrt(-2 * Math.log(r) / r);\n\
      };\n\
    },\n\
    logNormal: function() {\n\
      var random = d3.random.normal.apply(d3, arguments);\n\
      return function() {\n\
        return Math.exp(random());\n\
      };\n\
    },\n\
    irwinHall: function(m) {\n\
      return function() {\n\
        for (var s = 0, j = 0; j < m; j++) s += Math.random();\n\
        return s / m;\n\
      };\n\
    }\n\
  };\n\
  d3.scale = {};\n\
  function d3_scaleExtent(domain) {\n\
    var start = domain[0], stop = domain[domain.length - 1];\n\
    return start < stop ? [ start, stop ] : [ stop, start ];\n\
  }\n\
  function d3_scaleRange(scale) {\n\
    return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());\n\
  }\n\
  function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {\n\
    var u = uninterpolate(domain[0], domain[1]), i = interpolate(range[0], range[1]);\n\
    return function(x) {\n\
      return i(u(x));\n\
    };\n\
  }\n\
  function d3_scale_nice(domain, nice) {\n\
    var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], dx;\n\
    if (x1 < x0) {\n\
      dx = i0, i0 = i1, i1 = dx;\n\
      dx = x0, x0 = x1, x1 = dx;\n\
    }\n\
    domain[i0] = nice.floor(x0);\n\
    domain[i1] = nice.ceil(x1);\n\
    return domain;\n\
  }\n\
  function d3_scale_niceStep(step) {\n\
    return step ? {\n\
      floor: function(x) {\n\
        return Math.floor(x / step) * step;\n\
      },\n\
      ceil: function(x) {\n\
        return Math.ceil(x / step) * step;\n\
      }\n\
    } : d3_scale_niceIdentity;\n\
  }\n\
  var d3_scale_niceIdentity = {\n\
    floor: d3_identity,\n\
    ceil: d3_identity\n\
  };\n\
  function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {\n\
    var u = [], i = [], j = 0, k = Math.min(domain.length, range.length) - 1;\n\
    if (domain[k] < domain[0]) {\n\
      domain = domain.slice().reverse();\n\
      range = range.slice().reverse();\n\
    }\n\
    while (++j <= k) {\n\
      u.push(uninterpolate(domain[j - 1], domain[j]));\n\
      i.push(interpolate(range[j - 1], range[j]));\n\
    }\n\
    return function(x) {\n\
      var j = d3.bisect(domain, x, 1, k) - 1;\n\
      return i[j](u[j](x));\n\
    };\n\
  }\n\
  d3.scale.linear = function() {\n\
    return d3_scale_linear([ 0, 1 ], [ 0, 1 ], d3_interpolate, false);\n\
  };\n\
  function d3_scale_linear(domain, range, interpolate, clamp) {\n\
    var output, input;\n\
    function rescale() {\n\
      var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear, uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;\n\
      output = linear(domain, range, uninterpolate, interpolate);\n\
      input = linear(range, domain, uninterpolate, d3_interpolate);\n\
      return scale;\n\
    }\n\
    function scale(x) {\n\
      return output(x);\n\
    }\n\
    scale.invert = function(y) {\n\
      return input(y);\n\
    };\n\
    scale.domain = function(x) {\n\
      if (!arguments.length) return domain;\n\
      domain = x.map(Number);\n\
      return rescale();\n\
    };\n\
    scale.range = function(x) {\n\
      if (!arguments.length) return range;\n\
      range = x;\n\
      return rescale();\n\
    };\n\
    scale.rangeRound = function(x) {\n\
      return scale.range(x).interpolate(d3_interpolateRound);\n\
    };\n\
    scale.clamp = function(x) {\n\
      if (!arguments.length) return clamp;\n\
      clamp = x;\n\
      return rescale();\n\
    };\n\
    scale.interpolate = function(x) {\n\
      if (!arguments.length) return interpolate;\n\
      interpolate = x;\n\
      return rescale();\n\
    };\n\
    scale.ticks = function(m) {\n\
      return d3_scale_linearTicks(domain, m);\n\
    };\n\
    scale.tickFormat = function(m, format) {\n\
      return d3_scale_linearTickFormat(domain, m, format);\n\
    };\n\
    scale.nice = function(m) {\n\
      d3_scale_linearNice(domain, m);\n\
      return rescale();\n\
    };\n\
    scale.copy = function() {\n\
      return d3_scale_linear(domain, range, interpolate, clamp);\n\
    };\n\
    return rescale();\n\
  }\n\
  function d3_scale_linearRebind(scale, linear) {\n\
    return d3.rebind(scale, linear, \"range\", \"rangeRound\", \"interpolate\", \"clamp\");\n\
  }\n\
  function d3_scale_linearNice(domain, m) {\n\
    return d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));\n\
  }\n\
  function d3_scale_linearTickRange(domain, m) {\n\
    if (m == null) m = 10;\n\
    var extent = d3_scaleExtent(domain), span = extent[1] - extent[0], step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)), err = m / span * step;\n\
    if (err <= .15) step *= 10; else if (err <= .35) step *= 5; else if (err <= .75) step *= 2;\n\
    extent[0] = Math.ceil(extent[0] / step) * step;\n\
    extent[1] = Math.floor(extent[1] / step) * step + step * .5;\n\
    extent[2] = step;\n\
    return extent;\n\
  }\n\
  function d3_scale_linearTicks(domain, m) {\n\
    return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));\n\
  }\n\
  function d3_scale_linearTickFormat(domain, m, format) {\n\
    var range = d3_scale_linearTickRange(domain, m);\n\
    return d3.format(format ? format.replace(d3_format_re, function(a, b, c, d, e, f, g, h, i, j) {\n\
      return [ b, c, d, e, f, g, h, i || \".\" + d3_scale_linearFormatPrecision(j, range), j ].join(\"\");\n\
    }) : \",.\" + d3_scale_linearPrecision(range[2]) + \"f\");\n\
  }\n\
  var d3_scale_linearFormatSignificant = {\n\
    s: 1,\n\
    g: 1,\n\
    p: 1,\n\
    r: 1,\n\
    e: 1\n\
  };\n\
  function d3_scale_linearPrecision(value) {\n\
    return -Math.floor(Math.log(value) / Math.LN10 + .01);\n\
  }\n\
  function d3_scale_linearFormatPrecision(type, range) {\n\
    var p = d3_scale_linearPrecision(range[2]);\n\
    return type in d3_scale_linearFormatSignificant ? Math.abs(p - d3_scale_linearPrecision(Math.max(Math.abs(range[0]), Math.abs(range[1])))) + +(type !== \"e\") : p - (type === \"%\") * 2;\n\
  }\n\
  d3.scale.log = function() {\n\
    return d3_scale_log(d3.scale.linear().domain([ 0, 1 ]), 10, true, [ 1, 10 ]);\n\
  };\n\
  function d3_scale_log(linear, base, positive, domain) {\n\
    function log(x) {\n\
      return (positive ? Math.log(x < 0 ? 0 : x) : -Math.log(x > 0 ? 0 : -x)) / Math.log(base);\n\
    }\n\
    function pow(x) {\n\
      return positive ? Math.pow(base, x) : -Math.pow(base, -x);\n\
    }\n\
    function scale(x) {\n\
      return linear(log(x));\n\
    }\n\
    scale.invert = function(x) {\n\
      return pow(linear.invert(x));\n\
    };\n\
    scale.domain = function(x) {\n\
      if (!arguments.length) return domain;\n\
      positive = x[0] >= 0;\n\
      linear.domain((domain = x.map(Number)).map(log));\n\
      return scale;\n\
    };\n\
    scale.base = function(_) {\n\
      if (!arguments.length) return base;\n\
      base = +_;\n\
      linear.domain(domain.map(log));\n\
      return scale;\n\
    };\n\
    scale.nice = function() {\n\
      var niced = d3_scale_nice(domain.map(log), positive ? Math : d3_scale_logNiceNegative);\n\
      linear.domain(niced);\n\
      domain = niced.map(pow);\n\
      return scale;\n\
    };\n\
    scale.ticks = function() {\n\
      var extent = d3_scaleExtent(domain), ticks = [], u = extent[0], v = extent[1], i = Math.floor(log(u)), j = Math.ceil(log(v)), n = base % 1 ? 2 : base;\n\
      if (isFinite(j - i)) {\n\
        if (positive) {\n\
          for (;i < j; i++) for (var k = 1; k < n; k++) ticks.push(pow(i) * k);\n\
          ticks.push(pow(i));\n\
        } else {\n\
          ticks.push(pow(i));\n\
          for (;i++ < j; ) for (var k = n - 1; k > 0; k--) ticks.push(pow(i) * k);\n\
        }\n\
        for (i = 0; ticks[i] < u; i++) {}\n\
        for (j = ticks.length; ticks[j - 1] > v; j--) {}\n\
        ticks = ticks.slice(i, j);\n\
      }\n\
      return ticks;\n\
    };\n\
    scale.tickFormat = function(n, format) {\n\
      if (!arguments.length) return d3_scale_logFormat;\n\
      if (arguments.length < 2) format = d3_scale_logFormat; else if (typeof format !== \"function\") format = d3.format(format);\n\
      var k = Math.max(.1, n / scale.ticks().length), f = positive ? (e = 1e-12, Math.ceil) : (e = -1e-12, \n\
      Math.floor), e;\n\
      return function(d) {\n\
        return d / pow(f(log(d) + e)) <= k ? format(d) : \"\";\n\
      };\n\
    };\n\
    scale.copy = function() {\n\
      return d3_scale_log(linear.copy(), base, positive, domain);\n\
    };\n\
    return d3_scale_linearRebind(scale, linear);\n\
  }\n\
  var d3_scale_logFormat = d3.format(\".0e\"), d3_scale_logNiceNegative = {\n\
    floor: function(x) {\n\
      return -Math.ceil(-x);\n\
    },\n\
    ceil: function(x) {\n\
      return -Math.floor(-x);\n\
    }\n\
  };\n\
  d3.scale.pow = function() {\n\
    return d3_scale_pow(d3.scale.linear(), 1, [ 0, 1 ]);\n\
  };\n\
  function d3_scale_pow(linear, exponent, domain) {\n\
    var powp = d3_scale_powPow(exponent), powb = d3_scale_powPow(1 / exponent);\n\
    function scale(x) {\n\
      return linear(powp(x));\n\
    }\n\
    scale.invert = function(x) {\n\
      return powb(linear.invert(x));\n\
    };\n\
    scale.domain = function(x) {\n\
      if (!arguments.length) return domain;\n\
      linear.domain((domain = x.map(Number)).map(powp));\n\
      return scale;\n\
    };\n\
    scale.ticks = function(m) {\n\
      return d3_scale_linearTicks(domain, m);\n\
    };\n\
    scale.tickFormat = function(m, format) {\n\
      return d3_scale_linearTickFormat(domain, m, format);\n\
    };\n\
    scale.nice = function(m) {\n\
      return scale.domain(d3_scale_linearNice(domain, m));\n\
    };\n\
    scale.exponent = function(x) {\n\
      if (!arguments.length) return exponent;\n\
      powp = d3_scale_powPow(exponent = x);\n\
      powb = d3_scale_powPow(1 / exponent);\n\
      linear.domain(domain.map(powp));\n\
      return scale;\n\
    };\n\
    scale.copy = function() {\n\
      return d3_scale_pow(linear.copy(), exponent, domain);\n\
    };\n\
    return d3_scale_linearRebind(scale, linear);\n\
  }\n\
  function d3_scale_powPow(e) {\n\
    return function(x) {\n\
      return x < 0 ? -Math.pow(-x, e) : Math.pow(x, e);\n\
    };\n\
  }\n\
  d3.scale.sqrt = function() {\n\
    return d3.scale.pow().exponent(.5);\n\
  };\n\
  d3.scale.ordinal = function() {\n\
    return d3_scale_ordinal([], {\n\
      t: \"range\",\n\
      a: [ [] ]\n\
    });\n\
  };\n\
  function d3_scale_ordinal(domain, ranger) {\n\
    var index, range, rangeBand;\n\
    function scale(x) {\n\
      return range[((index.get(x) || ranger.t === \"range\" && index.set(x, domain.push(x))) - 1) % range.length];\n\
    }\n\
    function steps(start, step) {\n\
      return d3.range(domain.length).map(function(i) {\n\
        return start + step * i;\n\
      });\n\
    }\n\
    scale.domain = function(x) {\n\
      if (!arguments.length) return domain;\n\
      domain = [];\n\
      index = new d3_Map();\n\
      var i = -1, n = x.length, xi;\n\
      while (++i < n) if (!index.has(xi = x[i])) index.set(xi, domain.push(xi));\n\
      return scale[ranger.t].apply(scale, ranger.a);\n\
    };\n\
    scale.range = function(x) {\n\
      if (!arguments.length) return range;\n\
      range = x;\n\
      rangeBand = 0;\n\
      ranger = {\n\
        t: \"range\",\n\
        a: arguments\n\
      };\n\
      return scale;\n\
    };\n\
    scale.rangePoints = function(x, padding) {\n\
      if (arguments.length < 2) padding = 0;\n\
      var start = x[0], stop = x[1], step = (stop - start) / (Math.max(1, domain.length - 1) + padding);\n\
      range = steps(domain.length < 2 ? (start + stop) / 2 : start + step * padding / 2, step);\n\
      rangeBand = 0;\n\
      ranger = {\n\
        t: \"rangePoints\",\n\
        a: arguments\n\
      };\n\
      return scale;\n\
    };\n\
    scale.rangeBands = function(x, padding, outerPadding) {\n\
      if (arguments.length < 2) padding = 0;\n\
      if (arguments.length < 3) outerPadding = padding;\n\
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = (stop - start) / (domain.length - padding + 2 * outerPadding);\n\
      range = steps(start + step * outerPadding, step);\n\
      if (reverse) range.reverse();\n\
      rangeBand = step * (1 - padding);\n\
      ranger = {\n\
        t: \"rangeBands\",\n\
        a: arguments\n\
      };\n\
      return scale;\n\
    };\n\
    scale.rangeRoundBands = function(x, padding, outerPadding) {\n\
      if (arguments.length < 2) padding = 0;\n\
      if (arguments.length < 3) outerPadding = padding;\n\
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = Math.floor((stop - start) / (domain.length - padding + 2 * outerPadding)), error = stop - start - (domain.length - padding) * step;\n\
      range = steps(start + Math.round(error / 2), step);\n\
      if (reverse) range.reverse();\n\
      rangeBand = Math.round(step * (1 - padding));\n\
      ranger = {\n\
        t: \"rangeRoundBands\",\n\
        a: arguments\n\
      };\n\
      return scale;\n\
    };\n\
    scale.rangeBand = function() {\n\
      return rangeBand;\n\
    };\n\
    scale.rangeExtent = function() {\n\
      return d3_scaleExtent(ranger.a[0]);\n\
    };\n\
    scale.copy = function() {\n\
      return d3_scale_ordinal(domain, ranger);\n\
    };\n\
    return scale.domain(domain);\n\
  }\n\
  d3.scale.category10 = function() {\n\
    return d3.scale.ordinal().range(d3_category10);\n\
  };\n\
  d3.scale.category20 = function() {\n\
    return d3.scale.ordinal().range(d3_category20);\n\
  };\n\
  d3.scale.category20b = function() {\n\
    return d3.scale.ordinal().range(d3_category20b);\n\
  };\n\
  d3.scale.category20c = function() {\n\
    return d3.scale.ordinal().range(d3_category20c);\n\
  };\n\
  var d3_category10 = [ 2062260, 16744206, 2924588, 14034728, 9725885, 9197131, 14907330, 8355711, 12369186, 1556175 ].map(d3_rgbString);\n\
  var d3_category20 = [ 2062260, 11454440, 16744206, 16759672, 2924588, 10018698, 14034728, 16750742, 9725885, 12955861, 9197131, 12885140, 14907330, 16234194, 8355711, 13092807, 12369186, 14408589, 1556175, 10410725 ].map(d3_rgbString);\n\
  var d3_category20b = [ 3750777, 5395619, 7040719, 10264286, 6519097, 9216594, 11915115, 13556636, 9202993, 12426809, 15186514, 15190932, 8666169, 11356490, 14049643, 15177372, 8077683, 10834324, 13528509, 14589654 ].map(d3_rgbString);\n\
  var d3_category20c = [ 3244733, 7057110, 10406625, 13032431, 15095053, 16616764, 16625259, 16634018, 3253076, 7652470, 10607003, 13101504, 7695281, 10394312, 12369372, 14342891, 6513507, 9868950, 12434877, 14277081 ].map(d3_rgbString);\n\
  d3.scale.quantile = function() {\n\
    return d3_scale_quantile([], []);\n\
  };\n\
  function d3_scale_quantile(domain, range) {\n\
    var thresholds;\n\
    function rescale() {\n\
      var k = 0, q = range.length;\n\
      thresholds = [];\n\
      while (++k < q) thresholds[k - 1] = d3.quantile(domain, k / q);\n\
      return scale;\n\
    }\n\
    function scale(x) {\n\
      if (!isNaN(x = +x)) return range[d3.bisect(thresholds, x)];\n\
    }\n\
    scale.domain = function(x) {\n\
      if (!arguments.length) return domain;\n\
      domain = x.filter(function(d) {\n\
        return !isNaN(d);\n\
      }).sort(d3.ascending);\n\
      return rescale();\n\
    };\n\
    scale.range = function(x) {\n\
      if (!arguments.length) return range;\n\
      range = x;\n\
      return rescale();\n\
    };\n\
    scale.quantiles = function() {\n\
      return thresholds;\n\
    };\n\
    scale.invertExtent = function(y) {\n\
      y = range.indexOf(y);\n\
      return y < 0 ? [ NaN, NaN ] : [ y > 0 ? thresholds[y - 1] : domain[0], y < thresholds.length ? thresholds[y] : domain[domain.length - 1] ];\n\
    };\n\
    scale.copy = function() {\n\
      return d3_scale_quantile(domain, range);\n\
    };\n\
    return rescale();\n\
  }\n\
  d3.scale.quantize = function() {\n\
    return d3_scale_quantize(0, 1, [ 0, 1 ]);\n\
  };\n\
  function d3_scale_quantize(x0, x1, range) {\n\
    var kx, i;\n\
    function scale(x) {\n\
      return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];\n\
    }\n\
    function rescale() {\n\
      kx = range.length / (x1 - x0);\n\
      i = range.length - 1;\n\
      return scale;\n\
    }\n\
    scale.domain = function(x) {\n\
      if (!arguments.length) return [ x0, x1 ];\n\
      x0 = +x[0];\n\
      x1 = +x[x.length - 1];\n\
      return rescale();\n\
    };\n\
    scale.range = function(x) {\n\
      if (!arguments.length) return range;\n\
      range = x;\n\
      return rescale();\n\
    };\n\
    scale.invertExtent = function(y) {\n\
      y = range.indexOf(y);\n\
      y = y < 0 ? NaN : y / kx + x0;\n\
      return [ y, y + 1 / kx ];\n\
    };\n\
    scale.copy = function() {\n\
      return d3_scale_quantize(x0, x1, range);\n\
    };\n\
    return rescale();\n\
  }\n\
  d3.scale.threshold = function() {\n\
    return d3_scale_threshold([ .5 ], [ 0, 1 ]);\n\
  };\n\
  function d3_scale_threshold(domain, range) {\n\
    function scale(x) {\n\
      if (x <= x) return range[d3.bisect(domain, x)];\n\
    }\n\
    scale.domain = function(_) {\n\
      if (!arguments.length) return domain;\n\
      domain = _;\n\
      return scale;\n\
    };\n\
    scale.range = function(_) {\n\
      if (!arguments.length) return range;\n\
      range = _;\n\
      return scale;\n\
    };\n\
    scale.invertExtent = function(y) {\n\
      y = range.indexOf(y);\n\
      return [ domain[y - 1], domain[y] ];\n\
    };\n\
    scale.copy = function() {\n\
      return d3_scale_threshold(domain, range);\n\
    };\n\
    return scale;\n\
  }\n\
  d3.scale.identity = function() {\n\
    return d3_scale_identity([ 0, 1 ]);\n\
  };\n\
  function d3_scale_identity(domain) {\n\
    function identity(x) {\n\
      return +x;\n\
    }\n\
    identity.invert = identity;\n\
    identity.domain = identity.range = function(x) {\n\
      if (!arguments.length) return domain;\n\
      domain = x.map(identity);\n\
      return identity;\n\
    };\n\
    identity.ticks = function(m) {\n\
      return d3_scale_linearTicks(domain, m);\n\
    };\n\
    identity.tickFormat = function(m, format) {\n\
      return d3_scale_linearTickFormat(domain, m, format);\n\
    };\n\
    identity.copy = function() {\n\
      return d3_scale_identity(domain);\n\
    };\n\
    return identity;\n\
  }\n\
  d3.svg = {};\n\
  d3.svg.arc = function() {\n\
    var innerRadius = d3_svg_arcInnerRadius, outerRadius = d3_svg_arcOuterRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;\n\
    function arc() {\n\
      var r0 = innerRadius.apply(this, arguments), r1 = outerRadius.apply(this, arguments), a0 = startAngle.apply(this, arguments) + d3_svg_arcOffset, a1 = endAngle.apply(this, arguments) + d3_svg_arcOffset, da = (a1 < a0 && (da = a0, \n\
      a0 = a1, a1 = da), a1 - a0), df = da < π ? \"0\" : \"1\", c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);\n\
      return da >= d3_svg_arcMax ? r0 ? \"M0,\" + r1 + \"A\" + r1 + \",\" + r1 + \" 0 1,1 0,\" + -r1 + \"A\" + r1 + \",\" + r1 + \" 0 1,1 0,\" + r1 + \"M0,\" + r0 + \"A\" + r0 + \",\" + r0 + \" 0 1,0 0,\" + -r0 + \"A\" + r0 + \",\" + r0 + \" 0 1,0 0,\" + r0 + \"Z\" : \"M0,\" + r1 + \"A\" + r1 + \",\" + r1 + \" 0 1,1 0,\" + -r1 + \"A\" + r1 + \",\" + r1 + \" 0 1,1 0,\" + r1 + \"Z\" : r0 ? \"M\" + r1 * c0 + \",\" + r1 * s0 + \"A\" + r1 + \",\" + r1 + \" 0 \" + df + \",1 \" + r1 * c1 + \",\" + r1 * s1 + \"L\" + r0 * c1 + \",\" + r0 * s1 + \"A\" + r0 + \",\" + r0 + \" 0 \" + df + \",0 \" + r0 * c0 + \",\" + r0 * s0 + \"Z\" : \"M\" + r1 * c0 + \",\" + r1 * s0 + \"A\" + r1 + \",\" + r1 + \" 0 \" + df + \",1 \" + r1 * c1 + \",\" + r1 * s1 + \"L0,0\" + \"Z\";\n\
    }\n\
    arc.innerRadius = function(v) {\n\
      if (!arguments.length) return innerRadius;\n\
      innerRadius = d3_functor(v);\n\
      return arc;\n\
    };\n\
    arc.outerRadius = function(v) {\n\
      if (!arguments.length) return outerRadius;\n\
      outerRadius = d3_functor(v);\n\
      return arc;\n\
    };\n\
    arc.startAngle = function(v) {\n\
      if (!arguments.length) return startAngle;\n\
      startAngle = d3_functor(v);\n\
      return arc;\n\
    };\n\
    arc.endAngle = function(v) {\n\
      if (!arguments.length) return endAngle;\n\
      endAngle = d3_functor(v);\n\
      return arc;\n\
    };\n\
    arc.centroid = function() {\n\
      var r = (innerRadius.apply(this, arguments) + outerRadius.apply(this, arguments)) / 2, a = (startAngle.apply(this, arguments) + endAngle.apply(this, arguments)) / 2 + d3_svg_arcOffset;\n\
      return [ Math.cos(a) * r, Math.sin(a) * r ];\n\
    };\n\
    return arc;\n\
  };\n\
  var d3_svg_arcOffset = -halfπ, d3_svg_arcMax = τ - ε;\n\
  function d3_svg_arcInnerRadius(d) {\n\
    return d.innerRadius;\n\
  }\n\
  function d3_svg_arcOuterRadius(d) {\n\
    return d.outerRadius;\n\
  }\n\
  function d3_svg_arcStartAngle(d) {\n\
    return d.startAngle;\n\
  }\n\
  function d3_svg_arcEndAngle(d) {\n\
    return d.endAngle;\n\
  }\n\
  function d3_svg_line(projection) {\n\
    var x = d3_geom_pointX, y = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, tension = .7;\n\
    function line(data) {\n\
      var segments = [], points = [], i = -1, n = data.length, d, fx = d3_functor(x), fy = d3_functor(y);\n\
      function segment() {\n\
        segments.push(\"M\", interpolate(projection(points), tension));\n\
      }\n\
      while (++i < n) {\n\
        if (defined.call(this, d = data[i], i)) {\n\
          points.push([ +fx.call(this, d, i), +fy.call(this, d, i) ]);\n\
        } else if (points.length) {\n\
          segment();\n\
          points = [];\n\
        }\n\
      }\n\
      if (points.length) segment();\n\
      return segments.length ? segments.join(\"\") : null;\n\
    }\n\
    line.x = function(_) {\n\
      if (!arguments.length) return x;\n\
      x = _;\n\
      return line;\n\
    };\n\
    line.y = function(_) {\n\
      if (!arguments.length) return y;\n\
      y = _;\n\
      return line;\n\
    };\n\
    line.defined = function(_) {\n\
      if (!arguments.length) return defined;\n\
      defined = _;\n\
      return line;\n\
    };\n\
    line.interpolate = function(_) {\n\
      if (!arguments.length) return interpolateKey;\n\
      if (typeof _ === \"function\") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;\n\
      return line;\n\
    };\n\
    line.tension = function(_) {\n\
      if (!arguments.length) return tension;\n\
      tension = _;\n\
      return line;\n\
    };\n\
    return line;\n\
  }\n\
  d3.svg.line = function() {\n\
    return d3_svg_line(d3_identity);\n\
  };\n\
  var d3_svg_lineInterpolators = d3.map({\n\
    linear: d3_svg_lineLinear,\n\
    \"linear-closed\": d3_svg_lineLinearClosed,\n\
    step: d3_svg_lineStep,\n\
    \"step-before\": d3_svg_lineStepBefore,\n\
    \"step-after\": d3_svg_lineStepAfter,\n\
    basis: d3_svg_lineBasis,\n\
    \"basis-open\": d3_svg_lineBasisOpen,\n\
    \"basis-closed\": d3_svg_lineBasisClosed,\n\
    bundle: d3_svg_lineBundle,\n\
    cardinal: d3_svg_lineCardinal,\n\
    \"cardinal-open\": d3_svg_lineCardinalOpen,\n\
    \"cardinal-closed\": d3_svg_lineCardinalClosed,\n\
    monotone: d3_svg_lineMonotone\n\
  });\n\
  d3_svg_lineInterpolators.forEach(function(key, value) {\n\
    value.key = key;\n\
    value.closed = /-closed$/.test(key);\n\
  });\n\
  function d3_svg_lineLinear(points) {\n\
    return points.join(\"L\");\n\
  }\n\
  function d3_svg_lineLinearClosed(points) {\n\
    return d3_svg_lineLinear(points) + \"Z\";\n\
  }\n\
  function d3_svg_lineStep(points) {\n\
    var i = 0, n = points.length, p = points[0], path = [ p[0], \",\", p[1] ];\n\
    while (++i < n) path.push(\"H\", (p[0] + (p = points[i])[0]) / 2, \"V\", p[1]);\n\
    if (n > 1) path.push(\"H\", p[0]);\n\
    return path.join(\"\");\n\
  }\n\
  function d3_svg_lineStepBefore(points) {\n\
    var i = 0, n = points.length, p = points[0], path = [ p[0], \",\", p[1] ];\n\
    while (++i < n) path.push(\"V\", (p = points[i])[1], \"H\", p[0]);\n\
    return path.join(\"\");\n\
  }\n\
  function d3_svg_lineStepAfter(points) {\n\
    var i = 0, n = points.length, p = points[0], path = [ p[0], \",\", p[1] ];\n\
    while (++i < n) path.push(\"H\", (p = points[i])[0], \"V\", p[1]);\n\
    return path.join(\"\");\n\
  }\n\
  function d3_svg_lineCardinalOpen(points, tension) {\n\
    return points.length < 4 ? d3_svg_lineLinear(points) : points[1] + d3_svg_lineHermite(points.slice(1, points.length - 1), d3_svg_lineCardinalTangents(points, tension));\n\
  }\n\
  function d3_svg_lineCardinalClosed(points, tension) {\n\
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite((points.push(points[0]), \n\
    points), d3_svg_lineCardinalTangents([ points[points.length - 2] ].concat(points, [ points[1] ]), tension));\n\
  }\n\
  function d3_svg_lineCardinal(points, tension) {\n\
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineCardinalTangents(points, tension));\n\
  }\n\
  function d3_svg_lineHermite(points, tangents) {\n\
    if (tangents.length < 1 || points.length != tangents.length && points.length != tangents.length + 2) {\n\
      return d3_svg_lineLinear(points);\n\
    }\n\
    var quad = points.length != tangents.length, path = \"\", p0 = points[0], p = points[1], t0 = tangents[0], t = t0, pi = 1;\n\
    if (quad) {\n\
      path += \"Q\" + (p[0] - t0[0] * 2 / 3) + \",\" + (p[1] - t0[1] * 2 / 3) + \",\" + p[0] + \",\" + p[1];\n\
      p0 = points[1];\n\
      pi = 2;\n\
    }\n\
    if (tangents.length > 1) {\n\
      t = tangents[1];\n\
      p = points[pi];\n\
      pi++;\n\
      path += \"C\" + (p0[0] + t0[0]) + \",\" + (p0[1] + t0[1]) + \",\" + (p[0] - t[0]) + \",\" + (p[1] - t[1]) + \",\" + p[0] + \",\" + p[1];\n\
      for (var i = 2; i < tangents.length; i++, pi++) {\n\
        p = points[pi];\n\
        t = tangents[i];\n\
        path += \"S\" + (p[0] - t[0]) + \",\" + (p[1] - t[1]) + \",\" + p[0] + \",\" + p[1];\n\
      }\n\
    }\n\
    if (quad) {\n\
      var lp = points[pi];\n\
      path += \"Q\" + (p[0] + t[0] * 2 / 3) + \",\" + (p[1] + t[1] * 2 / 3) + \",\" + lp[0] + \",\" + lp[1];\n\
    }\n\
    return path;\n\
  }\n\
  function d3_svg_lineCardinalTangents(points, tension) {\n\
    var tangents = [], a = (1 - tension) / 2, p0, p1 = points[0], p2 = points[1], i = 1, n = points.length;\n\
    while (++i < n) {\n\
      p0 = p1;\n\
      p1 = p2;\n\
      p2 = points[i];\n\
      tangents.push([ a * (p2[0] - p0[0]), a * (p2[1] - p0[1]) ]);\n\
    }\n\
    return tangents;\n\
  }\n\
  function d3_svg_lineBasis(points) {\n\
    if (points.length < 3) return d3_svg_lineLinear(points);\n\
    var i = 1, n = points.length, pi = points[0], x0 = pi[0], y0 = pi[1], px = [ x0, x0, x0, (pi = points[1])[0] ], py = [ y0, y0, y0, pi[1] ], path = [ x0, \",\", y0, \"L\", d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), \",\", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];\n\
    points.push(points[n - 1]);\n\
    while (++i <= n) {\n\
      pi = points[i];\n\
      px.shift();\n\
      px.push(pi[0]);\n\
      py.shift();\n\
      py.push(pi[1]);\n\
      d3_svg_lineBasisBezier(path, px, py);\n\
    }\n\
    points.pop();\n\
    path.push(\"L\", pi);\n\
    return path.join(\"\");\n\
  }\n\
  function d3_svg_lineBasisOpen(points) {\n\
    if (points.length < 4) return d3_svg_lineLinear(points);\n\
    var path = [], i = -1, n = points.length, pi, px = [ 0 ], py = [ 0 ];\n\
    while (++i < 3) {\n\
      pi = points[i];\n\
      px.push(pi[0]);\n\
      py.push(pi[1]);\n\
    }\n\
    path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px) + \",\" + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));\n\
    --i;\n\
    while (++i < n) {\n\
      pi = points[i];\n\
      px.shift();\n\
      px.push(pi[0]);\n\
      py.shift();\n\
      py.push(pi[1]);\n\
      d3_svg_lineBasisBezier(path, px, py);\n\
    }\n\
    return path.join(\"\");\n\
  }\n\
  function d3_svg_lineBasisClosed(points) {\n\
    var path, i = -1, n = points.length, m = n + 4, pi, px = [], py = [];\n\
    while (++i < 4) {\n\
      pi = points[i % n];\n\
      px.push(pi[0]);\n\
      py.push(pi[1]);\n\
    }\n\
    path = [ d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), \",\", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];\n\
    --i;\n\
    while (++i < m) {\n\
      pi = points[i % n];\n\
      px.shift();\n\
      px.push(pi[0]);\n\
      py.shift();\n\
      py.push(pi[1]);\n\
      d3_svg_lineBasisBezier(path, px, py);\n\
    }\n\
    return path.join(\"\");\n\
  }\n\
  function d3_svg_lineBundle(points, tension) {\n\
    var n = points.length - 1;\n\
    if (n) {\n\
      var x0 = points[0][0], y0 = points[0][1], dx = points[n][0] - x0, dy = points[n][1] - y0, i = -1, p, t;\n\
      while (++i <= n) {\n\
        p = points[i];\n\
        t = i / n;\n\
        p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);\n\
        p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);\n\
      }\n\
    }\n\
    return d3_svg_lineBasis(points);\n\
  }\n\
  function d3_svg_lineDot4(a, b) {\n\
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];\n\
  }\n\
  var d3_svg_lineBasisBezier1 = [ 0, 2 / 3, 1 / 3, 0 ], d3_svg_lineBasisBezier2 = [ 0, 1 / 3, 2 / 3, 0 ], d3_svg_lineBasisBezier3 = [ 0, 1 / 6, 2 / 3, 1 / 6 ];\n\
  function d3_svg_lineBasisBezier(path, x, y) {\n\
    path.push(\"C\", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x), \",\", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y), \",\", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x), \",\", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y), \",\", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x), \",\", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));\n\
  }\n\
  function d3_svg_lineSlope(p0, p1) {\n\
    return (p1[1] - p0[1]) / (p1[0] - p0[0]);\n\
  }\n\
  function d3_svg_lineFiniteDifferences(points) {\n\
    var i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = d3_svg_lineSlope(p0, p1);\n\
    while (++i < j) {\n\
      m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;\n\
    }\n\
    m[i] = d;\n\
    return m;\n\
  }\n\
  function d3_svg_lineMonotoneTangents(points) {\n\
    var tangents = [], d, a, b, s, m = d3_svg_lineFiniteDifferences(points), i = -1, j = points.length - 1;\n\
    while (++i < j) {\n\
      d = d3_svg_lineSlope(points[i], points[i + 1]);\n\
      if (abs(d) < ε) {\n\
        m[i] = m[i + 1] = 0;\n\
      } else {\n\
        a = m[i] / d;\n\
        b = m[i + 1] / d;\n\
        s = a * a + b * b;\n\
        if (s > 9) {\n\
          s = d * 3 / Math.sqrt(s);\n\
          m[i] = s * a;\n\
          m[i + 1] = s * b;\n\
        }\n\
      }\n\
    }\n\
    i = -1;\n\
    while (++i <= j) {\n\
      s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));\n\
      tangents.push([ s || 0, m[i] * s || 0 ]);\n\
    }\n\
    return tangents;\n\
  }\n\
  function d3_svg_lineMonotone(points) {\n\
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));\n\
  }\n\
  d3.svg.line.radial = function() {\n\
    var line = d3_svg_line(d3_svg_lineRadial);\n\
    line.radius = line.x, delete line.x;\n\
    line.angle = line.y, delete line.y;\n\
    return line;\n\
  };\n\
  function d3_svg_lineRadial(points) {\n\
    var point, i = -1, n = points.length, r, a;\n\
    while (++i < n) {\n\
      point = points[i];\n\
      r = point[0];\n\
      a = point[1] + d3_svg_arcOffset;\n\
      point[0] = r * Math.cos(a);\n\
      point[1] = r * Math.sin(a);\n\
    }\n\
    return points;\n\
  }\n\
  function d3_svg_area(projection) {\n\
    var x0 = d3_geom_pointX, x1 = d3_geom_pointX, y0 = 0, y1 = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, interpolateReverse = interpolate, L = \"L\", tension = .7;\n\
    function area(data) {\n\
      var segments = [], points0 = [], points1 = [], i = -1, n = data.length, d, fx0 = d3_functor(x0), fy0 = d3_functor(y0), fx1 = x0 === x1 ? function() {\n\
        return x;\n\
      } : d3_functor(x1), fy1 = y0 === y1 ? function() {\n\
        return y;\n\
      } : d3_functor(y1), x, y;\n\
      function segment() {\n\
        segments.push(\"M\", interpolate(projection(points1), tension), L, interpolateReverse(projection(points0.reverse()), tension), \"Z\");\n\
      }\n\
      while (++i < n) {\n\
        if (defined.call(this, d = data[i], i)) {\n\
          points0.push([ x = +fx0.call(this, d, i), y = +fy0.call(this, d, i) ]);\n\
          points1.push([ +fx1.call(this, d, i), +fy1.call(this, d, i) ]);\n\
        } else if (points0.length) {\n\
          segment();\n\
          points0 = [];\n\
          points1 = [];\n\
        }\n\
      }\n\
      if (points0.length) segment();\n\
      return segments.length ? segments.join(\"\") : null;\n\
    }\n\
    area.x = function(_) {\n\
      if (!arguments.length) return x1;\n\
      x0 = x1 = _;\n\
      return area;\n\
    };\n\
    area.x0 = function(_) {\n\
      if (!arguments.length) return x0;\n\
      x0 = _;\n\
      return area;\n\
    };\n\
    area.x1 = function(_) {\n\
      if (!arguments.length) return x1;\n\
      x1 = _;\n\
      return area;\n\
    };\n\
    area.y = function(_) {\n\
      if (!arguments.length) return y1;\n\
      y0 = y1 = _;\n\
      return area;\n\
    };\n\
    area.y0 = function(_) {\n\
      if (!arguments.length) return y0;\n\
      y0 = _;\n\
      return area;\n\
    };\n\
    area.y1 = function(_) {\n\
      if (!arguments.length) return y1;\n\
      y1 = _;\n\
      return area;\n\
    };\n\
    area.defined = function(_) {\n\
      if (!arguments.length) return defined;\n\
      defined = _;\n\
      return area;\n\
    };\n\
    area.interpolate = function(_) {\n\
      if (!arguments.length) return interpolateKey;\n\
      if (typeof _ === \"function\") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;\n\
      interpolateReverse = interpolate.reverse || interpolate;\n\
      L = interpolate.closed ? \"M\" : \"L\";\n\
      return area;\n\
    };\n\
    area.tension = function(_) {\n\
      if (!arguments.length) return tension;\n\
      tension = _;\n\
      return area;\n\
    };\n\
    return area;\n\
  }\n\
  d3_svg_lineStepBefore.reverse = d3_svg_lineStepAfter;\n\
  d3_svg_lineStepAfter.reverse = d3_svg_lineStepBefore;\n\
  d3.svg.area = function() {\n\
    return d3_svg_area(d3_identity);\n\
  };\n\
  d3.svg.area.radial = function() {\n\
    var area = d3_svg_area(d3_svg_lineRadial);\n\
    area.radius = area.x, delete area.x;\n\
    area.innerRadius = area.x0, delete area.x0;\n\
    area.outerRadius = area.x1, delete area.x1;\n\
    area.angle = area.y, delete area.y;\n\
    area.startAngle = area.y0, delete area.y0;\n\
    area.endAngle = area.y1, delete area.y1;\n\
    return area;\n\
  };\n\
  d3.svg.chord = function() {\n\
    var source = d3_source, target = d3_target, radius = d3_svg_chordRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;\n\
    function chord(d, i) {\n\
      var s = subgroup(this, source, d, i), t = subgroup(this, target, d, i);\n\
      return \"M\" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0) + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0) + arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0)) + \"Z\";\n\
    }\n\
    function subgroup(self, f, d, i) {\n\
      var subgroup = f.call(self, d, i), r = radius.call(self, subgroup, i), a0 = startAngle.call(self, subgroup, i) + d3_svg_arcOffset, a1 = endAngle.call(self, subgroup, i) + d3_svg_arcOffset;\n\
      return {\n\
        r: r,\n\
        a0: a0,\n\
        a1: a1,\n\
        p0: [ r * Math.cos(a0), r * Math.sin(a0) ],\n\
        p1: [ r * Math.cos(a1), r * Math.sin(a1) ]\n\
      };\n\
    }\n\
    function equals(a, b) {\n\
      return a.a0 == b.a0 && a.a1 == b.a1;\n\
    }\n\
    function arc(r, p, a) {\n\
      return \"A\" + r + \",\" + r + \" 0 \" + +(a > π) + \",1 \" + p;\n\
    }\n\
    function curve(r0, p0, r1, p1) {\n\
      return \"Q 0,0 \" + p1;\n\
    }\n\
    chord.radius = function(v) {\n\
      if (!arguments.length) return radius;\n\
      radius = d3_functor(v);\n\
      return chord;\n\
    };\n\
    chord.source = function(v) {\n\
      if (!arguments.length) return source;\n\
      source = d3_functor(v);\n\
      return chord;\n\
    };\n\
    chord.target = function(v) {\n\
      if (!arguments.length) return target;\n\
      target = d3_functor(v);\n\
      return chord;\n\
    };\n\
    chord.startAngle = function(v) {\n\
      if (!arguments.length) return startAngle;\n\
      startAngle = d3_functor(v);\n\
      return chord;\n\
    };\n\
    chord.endAngle = function(v) {\n\
      if (!arguments.length) return endAngle;\n\
      endAngle = d3_functor(v);\n\
      return chord;\n\
    };\n\
    return chord;\n\
  };\n\
  function d3_svg_chordRadius(d) {\n\
    return d.radius;\n\
  }\n\
  d3.svg.diagonal = function() {\n\
    var source = d3_source, target = d3_target, projection = d3_svg_diagonalProjection;\n\
    function diagonal(d, i) {\n\
      var p0 = source.call(this, d, i), p3 = target.call(this, d, i), m = (p0.y + p3.y) / 2, p = [ p0, {\n\
        x: p0.x,\n\
        y: m\n\
      }, {\n\
        x: p3.x,\n\
        y: m\n\
      }, p3 ];\n\
      p = p.map(projection);\n\
      return \"M\" + p[0] + \"C\" + p[1] + \" \" + p[2] + \" \" + p[3];\n\
    }\n\
    diagonal.source = function(x) {\n\
      if (!arguments.length) return source;\n\
      source = d3_functor(x);\n\
      return diagonal;\n\
    };\n\
    diagonal.target = function(x) {\n\
      if (!arguments.length) return target;\n\
      target = d3_functor(x);\n\
      return diagonal;\n\
    };\n\
    diagonal.projection = function(x) {\n\
      if (!arguments.length) return projection;\n\
      projection = x;\n\
      return diagonal;\n\
    };\n\
    return diagonal;\n\
  };\n\
  function d3_svg_diagonalProjection(d) {\n\
    return [ d.x, d.y ];\n\
  }\n\
  d3.svg.diagonal.radial = function() {\n\
    var diagonal = d3.svg.diagonal(), projection = d3_svg_diagonalProjection, projection_ = diagonal.projection;\n\
    diagonal.projection = function(x) {\n\
      return arguments.length ? projection_(d3_svg_diagonalRadialProjection(projection = x)) : projection;\n\
    };\n\
    return diagonal;\n\
  };\n\
  function d3_svg_diagonalRadialProjection(projection) {\n\
    return function() {\n\
      var d = projection.apply(this, arguments), r = d[0], a = d[1] + d3_svg_arcOffset;\n\
      return [ r * Math.cos(a), r * Math.sin(a) ];\n\
    };\n\
  }\n\
  d3.svg.symbol = function() {\n\
    var type = d3_svg_symbolType, size = d3_svg_symbolSize;\n\
    function symbol(d, i) {\n\
      return (d3_svg_symbols.get(type.call(this, d, i)) || d3_svg_symbolCircle)(size.call(this, d, i));\n\
    }\n\
    symbol.type = function(x) {\n\
      if (!arguments.length) return type;\n\
      type = d3_functor(x);\n\
      return symbol;\n\
    };\n\
    symbol.size = function(x) {\n\
      if (!arguments.length) return size;\n\
      size = d3_functor(x);\n\
      return symbol;\n\
    };\n\
    return symbol;\n\
  };\n\
  function d3_svg_symbolSize() {\n\
    return 64;\n\
  }\n\
  function d3_svg_symbolType() {\n\
    return \"circle\";\n\
  }\n\
  function d3_svg_symbolCircle(size) {\n\
    var r = Math.sqrt(size / π);\n\
    return \"M0,\" + r + \"A\" + r + \",\" + r + \" 0 1,1 0,\" + -r + \"A\" + r + \",\" + r + \" 0 1,1 0,\" + r + \"Z\";\n\
  }\n\
  var d3_svg_symbols = d3.map({\n\
    circle: d3_svg_symbolCircle,\n\
    cross: function(size) {\n\
      var r = Math.sqrt(size / 5) / 2;\n\
      return \"M\" + -3 * r + \",\" + -r + \"H\" + -r + \"V\" + -3 * r + \"H\" + r + \"V\" + -r + \"H\" + 3 * r + \"V\" + r + \"H\" + r + \"V\" + 3 * r + \"H\" + -r + \"V\" + r + \"H\" + -3 * r + \"Z\";\n\
    },\n\
    diamond: function(size) {\n\
      var ry = Math.sqrt(size / (2 * d3_svg_symbolTan30)), rx = ry * d3_svg_symbolTan30;\n\
      return \"M0,\" + -ry + \"L\" + rx + \",0\" + \" 0,\" + ry + \" \" + -rx + \",0\" + \"Z\";\n\
    },\n\
    square: function(size) {\n\
      var r = Math.sqrt(size) / 2;\n\
      return \"M\" + -r + \",\" + -r + \"L\" + r + \",\" + -r + \" \" + r + \",\" + r + \" \" + -r + \",\" + r + \"Z\";\n\
    },\n\
    \"triangle-down\": function(size) {\n\
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;\n\
      return \"M0,\" + ry + \"L\" + rx + \",\" + -ry + \" \" + -rx + \",\" + -ry + \"Z\";\n\
    },\n\
    \"triangle-up\": function(size) {\n\
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;\n\
      return \"M0,\" + -ry + \"L\" + rx + \",\" + ry + \" \" + -rx + \",\" + ry + \"Z\";\n\
    }\n\
  });\n\
  d3.svg.symbolTypes = d3_svg_symbols.keys();\n\
  var d3_svg_symbolSqrt3 = Math.sqrt(3), d3_svg_symbolTan30 = Math.tan(30 * d3_radians);\n\
  function d3_transition(groups, id) {\n\
    d3_subclass(groups, d3_transitionPrototype);\n\
    groups.id = id;\n\
    return groups;\n\
  }\n\
  var d3_transitionPrototype = [], d3_transitionId = 0, d3_transitionInheritId, d3_transitionInherit;\n\
  d3_transitionPrototype.call = d3_selectionPrototype.call;\n\
  d3_transitionPrototype.empty = d3_selectionPrototype.empty;\n\
  d3_transitionPrototype.node = d3_selectionPrototype.node;\n\
  d3_transitionPrototype.size = d3_selectionPrototype.size;\n\
  d3.transition = function(selection) {\n\
    return arguments.length ? d3_transitionInheritId ? selection.transition() : selection : d3_selectionRoot.transition();\n\
  };\n\
  d3.transition.prototype = d3_transitionPrototype;\n\
  d3_transitionPrototype.select = function(selector) {\n\
    var id = this.id, subgroups = [], subgroup, subnode, node;\n\
    selector = d3_selection_selector(selector);\n\
    for (var j = -1, m = this.length; ++j < m; ) {\n\
      subgroups.push(subgroup = []);\n\
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {\n\
        if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i, j))) {\n\
          if (\"__data__\" in node) subnode.__data__ = node.__data__;\n\
          d3_transitionNode(subnode, i, id, node.__transition__[id]);\n\
          subgroup.push(subnode);\n\
        } else {\n\
          subgroup.push(null);\n\
        }\n\
      }\n\
    }\n\
    return d3_transition(subgroups, id);\n\
  };\n\
  d3_transitionPrototype.selectAll = function(selector) {\n\
    var id = this.id, subgroups = [], subgroup, subnodes, node, subnode, transition;\n\
    selector = d3_selection_selectorAll(selector);\n\
    for (var j = -1, m = this.length; ++j < m; ) {\n\
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {\n\
        if (node = group[i]) {\n\
          transition = node.__transition__[id];\n\
          subnodes = selector.call(node, node.__data__, i, j);\n\
          subgroups.push(subgroup = []);\n\
          for (var k = -1, o = subnodes.length; ++k < o; ) {\n\
            if (subnode = subnodes[k]) d3_transitionNode(subnode, k, id, transition);\n\
            subgroup.push(subnode);\n\
          }\n\
        }\n\
      }\n\
    }\n\
    return d3_transition(subgroups, id);\n\
  };\n\
  d3_transitionPrototype.filter = function(filter) {\n\
    var subgroups = [], subgroup, group, node;\n\
    if (typeof filter !== \"function\") filter = d3_selection_filter(filter);\n\
    for (var j = 0, m = this.length; j < m; j++) {\n\
      subgroups.push(subgroup = []);\n\
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {\n\
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {\n\
          subgroup.push(node);\n\
        }\n\
      }\n\
    }\n\
    return d3_transition(subgroups, this.id);\n\
  };\n\
  d3_transitionPrototype.tween = function(name, tween) {\n\
    var id = this.id;\n\
    if (arguments.length < 2) return this.node().__transition__[id].tween.get(name);\n\
    return d3_selection_each(this, tween == null ? function(node) {\n\
      node.__transition__[id].tween.remove(name);\n\
    } : function(node) {\n\
      node.__transition__[id].tween.set(name, tween);\n\
    });\n\
  };\n\
  function d3_transition_tween(groups, name, value, tween) {\n\
    var id = groups.id;\n\
    return d3_selection_each(groups, typeof value === \"function\" ? function(node, i, j) {\n\
      node.__transition__[id].tween.set(name, tween(value.call(node, node.__data__, i, j)));\n\
    } : (value = tween(value), function(node) {\n\
      node.__transition__[id].tween.set(name, value);\n\
    }));\n\
  }\n\
  d3_transitionPrototype.attr = function(nameNS, value) {\n\
    if (arguments.length < 2) {\n\
      for (value in nameNS) this.attr(value, nameNS[value]);\n\
      return this;\n\
    }\n\
    var interpolate = nameNS == \"transform\" ? d3_interpolateTransform : d3_interpolate, name = d3.ns.qualify(nameNS);\n\
    function attrNull() {\n\
      this.removeAttribute(name);\n\
    }\n\
    function attrNullNS() {\n\
      this.removeAttributeNS(name.space, name.local);\n\
    }\n\
    function attrTween(b) {\n\
      return b == null ? attrNull : (b += \"\", function() {\n\
        var a = this.getAttribute(name), i;\n\
        return a !== b && (i = interpolate(a, b), function(t) {\n\
          this.setAttribute(name, i(t));\n\
        });\n\
      });\n\
    }\n\
    function attrTweenNS(b) {\n\
      return b == null ? attrNullNS : (b += \"\", function() {\n\
        var a = this.getAttributeNS(name.space, name.local), i;\n\
        return a !== b && (i = interpolate(a, b), function(t) {\n\
          this.setAttributeNS(name.space, name.local, i(t));\n\
        });\n\
      });\n\
    }\n\
    return d3_transition_tween(this, \"attr.\" + nameNS, value, name.local ? attrTweenNS : attrTween);\n\
  };\n\
  d3_transitionPrototype.attrTween = function(nameNS, tween) {\n\
    var name = d3.ns.qualify(nameNS);\n\
    function attrTween(d, i) {\n\
      var f = tween.call(this, d, i, this.getAttribute(name));\n\
      return f && function(t) {\n\
        this.setAttribute(name, f(t));\n\
      };\n\
    }\n\
    function attrTweenNS(d, i) {\n\
      var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));\n\
      return f && function(t) {\n\
        this.setAttributeNS(name.space, name.local, f(t));\n\
      };\n\
    }\n\
    return this.tween(\"attr.\" + nameNS, name.local ? attrTweenNS : attrTween);\n\
  };\n\
  d3_transitionPrototype.style = function(name, value, priority) {\n\
    var n = arguments.length;\n\
    if (n < 3) {\n\
      if (typeof name !== \"string\") {\n\
        if (n < 2) value = \"\";\n\
        for (priority in name) this.style(priority, name[priority], value);\n\
        return this;\n\
      }\n\
      priority = \"\";\n\
    }\n\
    function styleNull() {\n\
      this.style.removeProperty(name);\n\
    }\n\
    function styleString(b) {\n\
      return b == null ? styleNull : (b += \"\", function() {\n\
        var a = d3_window.getComputedStyle(this, null).getPropertyValue(name), i;\n\
        return a !== b && (i = d3_interpolate(a, b), function(t) {\n\
          this.style.setProperty(name, i(t), priority);\n\
        });\n\
      });\n\
    }\n\
    return d3_transition_tween(this, \"style.\" + name, value, styleString);\n\
  };\n\
  d3_transitionPrototype.styleTween = function(name, tween, priority) {\n\
    if (arguments.length < 3) priority = \"\";\n\
    function styleTween(d, i) {\n\
      var f = tween.call(this, d, i, d3_window.getComputedStyle(this, null).getPropertyValue(name));\n\
      return f && function(t) {\n\
        this.style.setProperty(name, f(t), priority);\n\
      };\n\
    }\n\
    return this.tween(\"style.\" + name, styleTween);\n\
  };\n\
  d3_transitionPrototype.text = function(value) {\n\
    return d3_transition_tween(this, \"text\", value, d3_transition_text);\n\
  };\n\
  function d3_transition_text(b) {\n\
    if (b == null) b = \"\";\n\
    return function() {\n\
      this.textContent = b;\n\
    };\n\
  }\n\
  d3_transitionPrototype.remove = function() {\n\
    return this.each(\"end.transition\", function() {\n\
      var p;\n\
      if (this.__transition__.count < 2 && (p = this.parentNode)) p.removeChild(this);\n\
    });\n\
  };\n\
  d3_transitionPrototype.ease = function(value) {\n\
    var id = this.id;\n\
    if (arguments.length < 1) return this.node().__transition__[id].ease;\n\
    if (typeof value !== \"function\") value = d3.ease.apply(d3, arguments);\n\
    return d3_selection_each(this, function(node) {\n\
      node.__transition__[id].ease = value;\n\
    });\n\
  };\n\
  d3_transitionPrototype.delay = function(value) {\n\
    var id = this.id;\n\
    return d3_selection_each(this, typeof value === \"function\" ? function(node, i, j) {\n\
      node.__transition__[id].delay = +value.call(node, node.__data__, i, j);\n\
    } : (value = +value, function(node) {\n\
      node.__transition__[id].delay = value;\n\
    }));\n\
  };\n\
  d3_transitionPrototype.duration = function(value) {\n\
    var id = this.id;\n\
    return d3_selection_each(this, typeof value === \"function\" ? function(node, i, j) {\n\
      node.__transition__[id].duration = Math.max(1, value.call(node, node.__data__, i, j));\n\
    } : (value = Math.max(1, value), function(node) {\n\
      node.__transition__[id].duration = value;\n\
    }));\n\
  };\n\
  d3_transitionPrototype.each = function(type, listener) {\n\
    var id = this.id;\n\
    if (arguments.length < 2) {\n\
      var inherit = d3_transitionInherit, inheritId = d3_transitionInheritId;\n\
      d3_transitionInheritId = id;\n\
      d3_selection_each(this, function(node, i, j) {\n\
        d3_transitionInherit = node.__transition__[id];\n\
        type.call(node, node.__data__, i, j);\n\
      });\n\
      d3_transitionInherit = inherit;\n\
      d3_transitionInheritId = inheritId;\n\
    } else {\n\
      d3_selection_each(this, function(node) {\n\
        var transition = node.__transition__[id];\n\
        (transition.event || (transition.event = d3.dispatch(\"start\", \"end\"))).on(type, listener);\n\
      });\n\
    }\n\
    return this;\n\
  };\n\
  d3_transitionPrototype.transition = function() {\n\
    var id0 = this.id, id1 = ++d3_transitionId, subgroups = [], subgroup, group, node, transition;\n\
    for (var j = 0, m = this.length; j < m; j++) {\n\
      subgroups.push(subgroup = []);\n\
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {\n\
        if (node = group[i]) {\n\
          transition = Object.create(node.__transition__[id0]);\n\
          transition.delay += transition.duration;\n\
          d3_transitionNode(node, i, id1, transition);\n\
        }\n\
        subgroup.push(node);\n\
      }\n\
    }\n\
    return d3_transition(subgroups, id1);\n\
  };\n\
  function d3_transitionNode(node, i, id, inherit) {\n\
    var lock = node.__transition__ || (node.__transition__ = {\n\
      active: 0,\n\
      count: 0\n\
    }), transition = lock[id];\n\
    if (!transition) {\n\
      var time = inherit.time;\n\
      transition = lock[id] = {\n\
        tween: new d3_Map(),\n\
        time: time,\n\
        ease: inherit.ease,\n\
        delay: inherit.delay,\n\
        duration: inherit.duration\n\
      };\n\
      ++lock.count;\n\
      d3.timer(function(elapsed) {\n\
        var d = node.__data__, ease = transition.ease, delay = transition.delay, duration = transition.duration, timer = d3_timer_active, tweened = [];\n\
        timer.t = delay + time;\n\
        if (delay <= elapsed) return start(elapsed - delay);\n\
        timer.c = start;\n\
        function start(elapsed) {\n\
          if (lock.active > id) return stop();\n\
          lock.active = id;\n\
          transition.event && transition.event.start.call(node, d, i);\n\
          transition.tween.forEach(function(key, value) {\n\
            if (value = value.call(node, d, i)) {\n\
              tweened.push(value);\n\
            }\n\
          });\n\
          d3.timer(function() {\n\
            timer.c = tick(elapsed || 1) ? d3_true : tick;\n\
            return 1;\n\
          }, 0, time);\n\
        }\n\
        function tick(elapsed) {\n\
          if (lock.active !== id) return stop();\n\
          var t = elapsed / duration, e = ease(t), n = tweened.length;\n\
          while (n > 0) {\n\
            tweened[--n].call(node, e);\n\
          }\n\
          if (t >= 1) {\n\
            transition.event && transition.event.end.call(node, d, i);\n\
            return stop();\n\
          }\n\
        }\n\
        function stop() {\n\
          if (--lock.count) delete lock[id]; else delete node.__transition__;\n\
          return 1;\n\
        }\n\
      }, 0, time);\n\
    }\n\
  }\n\
  d3.svg.axis = function() {\n\
    var scale = d3.scale.linear(), orient = d3_svg_axisDefaultOrient, innerTickSize = 6, outerTickSize = 6, tickPadding = 3, tickArguments_ = [ 10 ], tickValues = null, tickFormat_;\n\
    function axis(g) {\n\
      g.each(function() {\n\
        var g = d3.select(this);\n\
        var scale0 = this.__chart__ || scale, scale1 = this.__chart__ = scale.copy();\n\
        var ticks = tickValues == null ? scale1.ticks ? scale1.ticks.apply(scale1, tickArguments_) : scale1.domain() : tickValues, tickFormat = tickFormat_ == null ? scale1.tickFormat ? scale1.tickFormat.apply(scale1, tickArguments_) : d3_identity : tickFormat_, tick = g.selectAll(\".tick\").data(ticks, scale1), tickEnter = tick.enter().insert(\"g\", \".domain\").attr(\"class\", \"tick\").style(\"opacity\", ε), tickExit = d3.transition(tick.exit()).style(\"opacity\", ε).remove(), tickUpdate = d3.transition(tick).style(\"opacity\", 1), tickTransform;\n\
        var range = d3_scaleRange(scale1), path = g.selectAll(\".domain\").data([ 0 ]), pathUpdate = (path.enter().append(\"path\").attr(\"class\", \"domain\"), \n\
        d3.transition(path));\n\
        tickEnter.append(\"line\");\n\
        tickEnter.append(\"text\");\n\
        var lineEnter = tickEnter.select(\"line\"), lineUpdate = tickUpdate.select(\"line\"), text = tick.select(\"text\").text(tickFormat), textEnter = tickEnter.select(\"text\"), textUpdate = tickUpdate.select(\"text\");\n\
        switch (orient) {\n\
         case \"bottom\":\n\
          {\n\
            tickTransform = d3_svg_axisX;\n\
            lineEnter.attr(\"y2\", innerTickSize);\n\
            textEnter.attr(\"y\", Math.max(innerTickSize, 0) + tickPadding);\n\
            lineUpdate.attr(\"x2\", 0).attr(\"y2\", innerTickSize);\n\
            textUpdate.attr(\"x\", 0).attr(\"y\", Math.max(innerTickSize, 0) + tickPadding);\n\
            text.attr(\"dy\", \".71em\").style(\"text-anchor\", \"middle\");\n\
            pathUpdate.attr(\"d\", \"M\" + range[0] + \",\" + outerTickSize + \"V0H\" + range[1] + \"V\" + outerTickSize);\n\
            break;\n\
          }\n\
\n\
         case \"top\":\n\
          {\n\
            tickTransform = d3_svg_axisX;\n\
            lineEnter.attr(\"y2\", -innerTickSize);\n\
            textEnter.attr(\"y\", -(Math.max(innerTickSize, 0) + tickPadding));\n\
            lineUpdate.attr(\"x2\", 0).attr(\"y2\", -innerTickSize);\n\
            textUpdate.attr(\"x\", 0).attr(\"y\", -(Math.max(innerTickSize, 0) + tickPadding));\n\
            text.attr(\"dy\", \"0em\").style(\"text-anchor\", \"middle\");\n\
            pathUpdate.attr(\"d\", \"M\" + range[0] + \",\" + -outerTickSize + \"V0H\" + range[1] + \"V\" + -outerTickSize);\n\
            break;\n\
          }\n\
\n\
         case \"left\":\n\
          {\n\
            tickTransform = d3_svg_axisY;\n\
            lineEnter.attr(\"x2\", -innerTickSize);\n\
            textEnter.attr(\"x\", -(Math.max(innerTickSize, 0) + tickPadding));\n\
            lineUpdate.attr(\"x2\", -innerTickSize).attr(\"y2\", 0);\n\
            textUpdate.attr(\"x\", -(Math.max(innerTickSize, 0) + tickPadding)).attr(\"y\", 0);\n\
            text.attr(\"dy\", \".32em\").style(\"text-anchor\", \"end\");\n\
            pathUpdate.attr(\"d\", \"M\" + -outerTickSize + \",\" + range[0] + \"H0V\" + range[1] + \"H\" + -outerTickSize);\n\
            break;\n\
          }\n\
\n\
         case \"right\":\n\
          {\n\
            tickTransform = d3_svg_axisY;\n\
            lineEnter.attr(\"x2\", innerTickSize);\n\
            textEnter.attr(\"x\", Math.max(innerTickSize, 0) + tickPadding);\n\
            lineUpdate.attr(\"x2\", innerTickSize).attr(\"y2\", 0);\n\
            textUpdate.attr(\"x\", Math.max(innerTickSize, 0) + tickPadding).attr(\"y\", 0);\n\
            text.attr(\"dy\", \".32em\").style(\"text-anchor\", \"start\");\n\
            pathUpdate.attr(\"d\", \"M\" + outerTickSize + \",\" + range[0] + \"H0V\" + range[1] + \"H\" + outerTickSize);\n\
            break;\n\
          }\n\
        }\n\
        if (scale1.rangeBand) {\n\
          var x = scale1, dx = x.rangeBand() / 2;\n\
          scale0 = scale1 = function(d) {\n\
            return x(d) + dx;\n\
          };\n\
        } else if (scale0.rangeBand) {\n\
          scale0 = scale1;\n\
        } else {\n\
          tickExit.call(tickTransform, scale1);\n\
        }\n\
        tickEnter.call(tickTransform, scale0);\n\
        tickUpdate.call(tickTransform, scale1);\n\
      });\n\
    }\n\
    axis.scale = function(x) {\n\
      if (!arguments.length) return scale;\n\
      scale = x;\n\
      return axis;\n\
    };\n\
    axis.orient = function(x) {\n\
      if (!arguments.length) return orient;\n\
      orient = x in d3_svg_axisOrients ? x + \"\" : d3_svg_axisDefaultOrient;\n\
      return axis;\n\
    };\n\
    axis.ticks = function() {\n\
      if (!arguments.length) return tickArguments_;\n\
      tickArguments_ = arguments;\n\
      return axis;\n\
    };\n\
    axis.tickValues = function(x) {\n\
      if (!arguments.length) return tickValues;\n\
      tickValues = x;\n\
      return axis;\n\
    };\n\
    axis.tickFormat = function(x) {\n\
      if (!arguments.length) return tickFormat_;\n\
      tickFormat_ = x;\n\
      return axis;\n\
    };\n\
    axis.tickSize = function(x) {\n\
      var n = arguments.length;\n\
      if (!n) return innerTickSize;\n\
      innerTickSize = +x;\n\
      outerTickSize = +arguments[n - 1];\n\
      return axis;\n\
    };\n\
    axis.innerTickSize = function(x) {\n\
      if (!arguments.length) return innerTickSize;\n\
      innerTickSize = +x;\n\
      return axis;\n\
    };\n\
    axis.outerTickSize = function(x) {\n\
      if (!arguments.length) return outerTickSize;\n\
      outerTickSize = +x;\n\
      return axis;\n\
    };\n\
    axis.tickPadding = function(x) {\n\
      if (!arguments.length) return tickPadding;\n\
      tickPadding = +x;\n\
      return axis;\n\
    };\n\
    axis.tickSubdivide = function() {\n\
      return arguments.length && axis;\n\
    };\n\
    return axis;\n\
  };\n\
  var d3_svg_axisDefaultOrient = \"bottom\", d3_svg_axisOrients = {\n\
    top: 1,\n\
    right: 1,\n\
    bottom: 1,\n\
    left: 1\n\
  };\n\
  function d3_svg_axisX(selection, x) {\n\
    selection.attr(\"transform\", function(d) {\n\
      return \"translate(\" + x(d) + \",0)\";\n\
    });\n\
  }\n\
  function d3_svg_axisY(selection, y) {\n\
    selection.attr(\"transform\", function(d) {\n\
      return \"translate(0,\" + y(d) + \")\";\n\
    });\n\
  }\n\
  d3.svg.brush = function() {\n\
    var event = d3_eventDispatch(brush, \"brushstart\", \"brush\", \"brushend\"), x = null, y = null, xExtent = [ 0, 0 ], yExtent = [ 0, 0 ], xExtentDomain, yExtentDomain, xClamp = true, yClamp = true, resizes = d3_svg_brushResizes[0];\n\
    function brush(g) {\n\
      g.each(function() {\n\
        var g = d3.select(this).style(\"pointer-events\", \"all\").style(\"-webkit-tap-highlight-color\", \"rgba(0,0,0,0)\").on(\"mousedown.brush\", brushstart).on(\"touchstart.brush\", brushstart);\n\
        var background = g.selectAll(\".background\").data([ 0 ]);\n\
        background.enter().append(\"rect\").attr(\"class\", \"background\").style(\"visibility\", \"hidden\").style(\"cursor\", \"crosshair\");\n\
        g.selectAll(\".extent\").data([ 0 ]).enter().append(\"rect\").attr(\"class\", \"extent\").style(\"cursor\", \"move\");\n\
        var resize = g.selectAll(\".resize\").data(resizes, d3_identity);\n\
        resize.exit().remove();\n\
        resize.enter().append(\"g\").attr(\"class\", function(d) {\n\
          return \"resize \" + d;\n\
        }).style(\"cursor\", function(d) {\n\
          return d3_svg_brushCursor[d];\n\
        }).append(\"rect\").attr(\"x\", function(d) {\n\
          return /[ew]$/.test(d) ? -3 : null;\n\
        }).attr(\"y\", function(d) {\n\
          return /^[ns]/.test(d) ? -3 : null;\n\
        }).attr(\"width\", 6).attr(\"height\", 6).style(\"visibility\", \"hidden\");\n\
        resize.style(\"display\", brush.empty() ? \"none\" : null);\n\
        var gUpdate = d3.transition(g), backgroundUpdate = d3.transition(background), range;\n\
        if (x) {\n\
          range = d3_scaleRange(x);\n\
          backgroundUpdate.attr(\"x\", range[0]).attr(\"width\", range[1] - range[0]);\n\
          redrawX(gUpdate);\n\
        }\n\
        if (y) {\n\
          range = d3_scaleRange(y);\n\
          backgroundUpdate.attr(\"y\", range[0]).attr(\"height\", range[1] - range[0]);\n\
          redrawY(gUpdate);\n\
        }\n\
        redraw(gUpdate);\n\
      });\n\
    }\n\
    brush.event = function(g) {\n\
      g.each(function() {\n\
        var event_ = event.of(this, arguments), extent1 = {\n\
          x: xExtent,\n\
          y: yExtent,\n\
          i: xExtentDomain,\n\
          j: yExtentDomain\n\
        }, extent0 = this.__chart__ || extent1;\n\
        this.__chart__ = extent1;\n\
        if (d3_transitionInheritId) {\n\
          d3.select(this).transition().each(\"start.brush\", function() {\n\
            xExtentDomain = extent0.i;\n\
            yExtentDomain = extent0.j;\n\
            xExtent = extent0.x;\n\
            yExtent = extent0.y;\n\
            event_({\n\
              type: \"brushstart\"\n\
            });\n\
          }).tween(\"brush:brush\", function() {\n\
            var xi = d3_interpolateArray(xExtent, extent1.x), yi = d3_interpolateArray(yExtent, extent1.y);\n\
            xExtentDomain = yExtentDomain = null;\n\
            return function(t) {\n\
              xExtent = extent1.x = xi(t);\n\
              yExtent = extent1.y = yi(t);\n\
              event_({\n\
                type: \"brush\",\n\
                mode: \"resize\"\n\
              });\n\
            };\n\
          }).each(\"end.brush\", function() {\n\
            xExtentDomain = extent1.i;\n\
            yExtentDomain = extent1.j;\n\
            event_({\n\
              type: \"brush\",\n\
              mode: \"resize\"\n\
            });\n\
            event_({\n\
              type: \"brushend\"\n\
            });\n\
          });\n\
        } else {\n\
          event_({\n\
            type: \"brushstart\"\n\
          });\n\
          event_({\n\
            type: \"brush\",\n\
            mode: \"resize\"\n\
          });\n\
          event_({\n\
            type: \"brushend\"\n\
          });\n\
        }\n\
      });\n\
    };\n\
    function redraw(g) {\n\
      g.selectAll(\".resize\").attr(\"transform\", function(d) {\n\
        return \"translate(\" + xExtent[+/e$/.test(d)] + \",\" + yExtent[+/^s/.test(d)] + \")\";\n\
      });\n\
    }\n\
    function redrawX(g) {\n\
      g.select(\".extent\").attr(\"x\", xExtent[0]);\n\
      g.selectAll(\".extent,.n>rect,.s>rect\").attr(\"width\", xExtent[1] - xExtent[0]);\n\
    }\n\
    function redrawY(g) {\n\
      g.select(\".extent\").attr(\"y\", yExtent[0]);\n\
      g.selectAll(\".extent,.e>rect,.w>rect\").attr(\"height\", yExtent[1] - yExtent[0]);\n\
    }\n\
    function brushstart() {\n\
      var target = this, eventTarget = d3.select(d3.event.target), event_ = event.of(target, arguments), g = d3.select(target), resizing = eventTarget.datum(), resizingX = !/^(n|s)$/.test(resizing) && x, resizingY = !/^(e|w)$/.test(resizing) && y, dragging = eventTarget.classed(\"extent\"), dragRestore = d3_event_dragSuppress(), center, origin = d3.mouse(target), offset;\n\
      var w = d3.select(d3_window).on(\"keydown.brush\", keydown).on(\"keyup.brush\", keyup);\n\
      if (d3.event.changedTouches) {\n\
        w.on(\"touchmove.brush\", brushmove).on(\"touchend.brush\", brushend);\n\
      } else {\n\
        w.on(\"mousemove.brush\", brushmove).on(\"mouseup.brush\", brushend);\n\
      }\n\
      g.interrupt().selectAll(\"*\").interrupt();\n\
      if (dragging) {\n\
        origin[0] = xExtent[0] - origin[0];\n\
        origin[1] = yExtent[0] - origin[1];\n\
      } else if (resizing) {\n\
        var ex = +/w$/.test(resizing), ey = +/^n/.test(resizing);\n\
        offset = [ xExtent[1 - ex] - origin[0], yExtent[1 - ey] - origin[1] ];\n\
        origin[0] = xExtent[ex];\n\
        origin[1] = yExtent[ey];\n\
      } else if (d3.event.altKey) center = origin.slice();\n\
      g.style(\"pointer-events\", \"none\").selectAll(\".resize\").style(\"display\", null);\n\
      d3.select(\"body\").style(\"cursor\", eventTarget.style(\"cursor\"));\n\
      event_({\n\
        type: \"brushstart\"\n\
      });\n\
      brushmove();\n\
      function keydown() {\n\
        if (d3.event.keyCode == 32) {\n\
          if (!dragging) {\n\
            center = null;\n\
            origin[0] -= xExtent[1];\n\
            origin[1] -= yExtent[1];\n\
            dragging = 2;\n\
          }\n\
          d3_eventPreventDefault();\n\
        }\n\
      }\n\
      function keyup() {\n\
        if (d3.event.keyCode == 32 && dragging == 2) {\n\
          origin[0] += xExtent[1];\n\
          origin[1] += yExtent[1];\n\
          dragging = 0;\n\
          d3_eventPreventDefault();\n\
        }\n\
      }\n\
      function brushmove() {\n\
        var point = d3.mouse(target), moved = false;\n\
        if (offset) {\n\
          point[0] += offset[0];\n\
          point[1] += offset[1];\n\
        }\n\
        if (!dragging) {\n\
          if (d3.event.altKey) {\n\
            if (!center) center = [ (xExtent[0] + xExtent[1]) / 2, (yExtent[0] + yExtent[1]) / 2 ];\n\
            origin[0] = xExtent[+(point[0] < center[0])];\n\
            origin[1] = yExtent[+(point[1] < center[1])];\n\
          } else center = null;\n\
        }\n\
        if (resizingX && move1(point, x, 0)) {\n\
          redrawX(g);\n\
          moved = true;\n\
        }\n\
        if (resizingY && move1(point, y, 1)) {\n\
          redrawY(g);\n\
          moved = true;\n\
        }\n\
        if (moved) {\n\
          redraw(g);\n\
          event_({\n\
            type: \"brush\",\n\
            mode: dragging ? \"move\" : \"resize\"\n\
          });\n\
        }\n\
      }\n\
      function move1(point, scale, i) {\n\
        var range = d3_scaleRange(scale), r0 = range[0], r1 = range[1], position = origin[i], extent = i ? yExtent : xExtent, size = extent[1] - extent[0], min, max;\n\
        if (dragging) {\n\
          r0 -= position;\n\
          r1 -= size + position;\n\
        }\n\
        min = (i ? yClamp : xClamp) ? Math.max(r0, Math.min(r1, point[i])) : point[i];\n\
        if (dragging) {\n\
          max = (min += position) + size;\n\
        } else {\n\
          if (center) position = Math.max(r0, Math.min(r1, 2 * center[i] - min));\n\
          if (position < min) {\n\
            max = min;\n\
            min = position;\n\
          } else {\n\
            max = position;\n\
          }\n\
        }\n\
        if (extent[0] != min || extent[1] != max) {\n\
          if (i) yExtentDomain = null; else xExtentDomain = null;\n\
          extent[0] = min;\n\
          extent[1] = max;\n\
          return true;\n\
        }\n\
      }\n\
      function brushend() {\n\
        brushmove();\n\
        g.style(\"pointer-events\", \"all\").selectAll(\".resize\").style(\"display\", brush.empty() ? \"none\" : null);\n\
        d3.select(\"body\").style(\"cursor\", null);\n\
        w.on(\"mousemove.brush\", null).on(\"mouseup.brush\", null).on(\"touchmove.brush\", null).on(\"touchend.brush\", null).on(\"keydown.brush\", null).on(\"keyup.brush\", null);\n\
        dragRestore();\n\
        event_({\n\
          type: \"brushend\"\n\
        });\n\
      }\n\
    }\n\
    brush.x = function(z) {\n\
      if (!arguments.length) return x;\n\
      x = z;\n\
      resizes = d3_svg_brushResizes[!x << 1 | !y];\n\
      return brush;\n\
    };\n\
    brush.y = function(z) {\n\
      if (!arguments.length) return y;\n\
      y = z;\n\
      resizes = d3_svg_brushResizes[!x << 1 | !y];\n\
      return brush;\n\
    };\n\
    brush.clamp = function(z) {\n\
      if (!arguments.length) return x && y ? [ xClamp, yClamp ] : x ? xClamp : y ? yClamp : null;\n\
      if (x && y) xClamp = !!z[0], yClamp = !!z[1]; else if (x) xClamp = !!z; else if (y) yClamp = !!z;\n\
      return brush;\n\
    };\n\
    brush.extent = function(z) {\n\
      var x0, x1, y0, y1, t;\n\
      if (!arguments.length) {\n\
        if (x) {\n\
          if (xExtentDomain) {\n\
            x0 = xExtentDomain[0], x1 = xExtentDomain[1];\n\
          } else {\n\
            x0 = xExtent[0], x1 = xExtent[1];\n\
            if (x.invert) x0 = x.invert(x0), x1 = x.invert(x1);\n\
            if (x1 < x0) t = x0, x0 = x1, x1 = t;\n\
          }\n\
        }\n\
        if (y) {\n\
          if (yExtentDomain) {\n\
            y0 = yExtentDomain[0], y1 = yExtentDomain[1];\n\
          } else {\n\
            y0 = yExtent[0], y1 = yExtent[1];\n\
            if (y.invert) y0 = y.invert(y0), y1 = y.invert(y1);\n\
            if (y1 < y0) t = y0, y0 = y1, y1 = t;\n\
          }\n\
        }\n\
        return x && y ? [ [ x0, y0 ], [ x1, y1 ] ] : x ? [ x0, x1 ] : y && [ y0, y1 ];\n\
      }\n\
      if (x) {\n\
        x0 = z[0], x1 = z[1];\n\
        if (y) x0 = x0[0], x1 = x1[0];\n\
        xExtentDomain = [ x0, x1 ];\n\
        if (x.invert) x0 = x(x0), x1 = x(x1);\n\
        if (x1 < x0) t = x0, x0 = x1, x1 = t;\n\
        if (x0 != xExtent[0] || x1 != xExtent[1]) xExtent = [ x0, x1 ];\n\
      }\n\
      if (y) {\n\
        y0 = z[0], y1 = z[1];\n\
        if (x) y0 = y0[1], y1 = y1[1];\n\
        yExtentDomain = [ y0, y1 ];\n\
        if (y.invert) y0 = y(y0), y1 = y(y1);\n\
        if (y1 < y0) t = y0, y0 = y1, y1 = t;\n\
        if (y0 != yExtent[0] || y1 != yExtent[1]) yExtent = [ y0, y1 ];\n\
      }\n\
      return brush;\n\
    };\n\
    brush.clear = function() {\n\
      if (!brush.empty()) {\n\
        xExtent = [ 0, 0 ], yExtent = [ 0, 0 ];\n\
        xExtentDomain = yExtentDomain = null;\n\
      }\n\
      return brush;\n\
    };\n\
    brush.empty = function() {\n\
      return !!x && xExtent[0] == xExtent[1] || !!y && yExtent[0] == yExtent[1];\n\
    };\n\
    return d3.rebind(brush, event, \"on\");\n\
  };\n\
  var d3_svg_brushCursor = {\n\
    n: \"ns-resize\",\n\
    e: \"ew-resize\",\n\
    s: \"ns-resize\",\n\
    w: \"ew-resize\",\n\
    nw: \"nwse-resize\",\n\
    ne: \"nesw-resize\",\n\
    se: \"nwse-resize\",\n\
    sw: \"nesw-resize\"\n\
  };\n\
  var d3_svg_brushResizes = [ [ \"n\", \"e\", \"s\", \"w\", \"nw\", \"ne\", \"se\", \"sw\" ], [ \"e\", \"w\" ], [ \"n\", \"s\" ], [] ];\n\
  var d3_time = d3.time = {}, d3_date = Date, d3_time_daySymbols = [ \"Sunday\", \"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\", \"Saturday\" ];\n\
  function d3_date_utc() {\n\
    this._ = new Date(arguments.length > 1 ? Date.UTC.apply(this, arguments) : arguments[0]);\n\
  }\n\
  d3_date_utc.prototype = {\n\
    getDate: function() {\n\
      return this._.getUTCDate();\n\
    },\n\
    getDay: function() {\n\
      return this._.getUTCDay();\n\
    },\n\
    getFullYear: function() {\n\
      return this._.getUTCFullYear();\n\
    },\n\
    getHours: function() {\n\
      return this._.getUTCHours();\n\
    },\n\
    getMilliseconds: function() {\n\
      return this._.getUTCMilliseconds();\n\
    },\n\
    getMinutes: function() {\n\
      return this._.getUTCMinutes();\n\
    },\n\
    getMonth: function() {\n\
      return this._.getUTCMonth();\n\
    },\n\
    getSeconds: function() {\n\
      return this._.getUTCSeconds();\n\
    },\n\
    getTime: function() {\n\
      return this._.getTime();\n\
    },\n\
    getTimezoneOffset: function() {\n\
      return 0;\n\
    },\n\
    valueOf: function() {\n\
      return this._.valueOf();\n\
    },\n\
    setDate: function() {\n\
      d3_time_prototype.setUTCDate.apply(this._, arguments);\n\
    },\n\
    setDay: function() {\n\
      d3_time_prototype.setUTCDay.apply(this._, arguments);\n\
    },\n\
    setFullYear: function() {\n\
      d3_time_prototype.setUTCFullYear.apply(this._, arguments);\n\
    },\n\
    setHours: function() {\n\
      d3_time_prototype.setUTCHours.apply(this._, arguments);\n\
    },\n\
    setMilliseconds: function() {\n\
      d3_time_prototype.setUTCMilliseconds.apply(this._, arguments);\n\
    },\n\
    setMinutes: function() {\n\
      d3_time_prototype.setUTCMinutes.apply(this._, arguments);\n\
    },\n\
    setMonth: function() {\n\
      d3_time_prototype.setUTCMonth.apply(this._, arguments);\n\
    },\n\
    setSeconds: function() {\n\
      d3_time_prototype.setUTCSeconds.apply(this._, arguments);\n\
    },\n\
    setTime: function() {\n\
      d3_time_prototype.setTime.apply(this._, arguments);\n\
    }\n\
  };\n\
  var d3_time_prototype = Date.prototype;\n\
  var d3_time_formatDateTime = \"%a %b %e %X %Y\", d3_time_formatDate = \"%m/%d/%Y\", d3_time_formatTime = \"%H:%M:%S\";\n\
  var d3_time_days = [ \"Sunday\", \"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\", \"Saturday\" ], d3_time_dayAbbreviations = [ \"Sun\", \"Mon\", \"Tue\", \"Wed\", \"Thu\", \"Fri\", \"Sat\" ], d3_time_months = [ \"January\", \"February\", \"March\", \"April\", \"May\", \"June\", \"July\", \"August\", \"September\", \"October\", \"November\", \"December\" ], d3_time_monthAbbreviations = [ \"Jan\", \"Feb\", \"Mar\", \"Apr\", \"May\", \"Jun\", \"Jul\", \"Aug\", \"Sep\", \"Oct\", \"Nov\", \"Dec\" ];\n\
  function d3_time_interval(local, step, number) {\n\
    function round(date) {\n\
      var d0 = local(date), d1 = offset(d0, 1);\n\
      return date - d0 < d1 - date ? d0 : d1;\n\
    }\n\
    function ceil(date) {\n\
      step(date = local(new d3_date(date - 1)), 1);\n\
      return date;\n\
    }\n\
    function offset(date, k) {\n\
      step(date = new d3_date(+date), k);\n\
      return date;\n\
    }\n\
    function range(t0, t1, dt) {\n\
      var time = ceil(t0), times = [];\n\
      if (dt > 1) {\n\
        while (time < t1) {\n\
          if (!(number(time) % dt)) times.push(new Date(+time));\n\
          step(time, 1);\n\
        }\n\
      } else {\n\
        while (time < t1) times.push(new Date(+time)), step(time, 1);\n\
      }\n\
      return times;\n\
    }\n\
    function range_utc(t0, t1, dt) {\n\
      try {\n\
        d3_date = d3_date_utc;\n\
        var utc = new d3_date_utc();\n\
        utc._ = t0;\n\
        return range(utc, t1, dt);\n\
      } finally {\n\
        d3_date = Date;\n\
      }\n\
    }\n\
    local.floor = local;\n\
    local.round = round;\n\
    local.ceil = ceil;\n\
    local.offset = offset;\n\
    local.range = range;\n\
    var utc = local.utc = d3_time_interval_utc(local);\n\
    utc.floor = utc;\n\
    utc.round = d3_time_interval_utc(round);\n\
    utc.ceil = d3_time_interval_utc(ceil);\n\
    utc.offset = d3_time_interval_utc(offset);\n\
    utc.range = range_utc;\n\
    return local;\n\
  }\n\
  function d3_time_interval_utc(method) {\n\
    return function(date, k) {\n\
      try {\n\
        d3_date = d3_date_utc;\n\
        var utc = new d3_date_utc();\n\
        utc._ = date;\n\
        return method(utc, k)._;\n\
      } finally {\n\
        d3_date = Date;\n\
      }\n\
    };\n\
  }\n\
  d3_time.year = d3_time_interval(function(date) {\n\
    date = d3_time.day(date);\n\
    date.setMonth(0, 1);\n\
    return date;\n\
  }, function(date, offset) {\n\
    date.setFullYear(date.getFullYear() + offset);\n\
  }, function(date) {\n\
    return date.getFullYear();\n\
  });\n\
  d3_time.years = d3_time.year.range;\n\
  d3_time.years.utc = d3_time.year.utc.range;\n\
  d3_time.day = d3_time_interval(function(date) {\n\
    var day = new d3_date(2e3, 0);\n\
    day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());\n\
    return day;\n\
  }, function(date, offset) {\n\
    date.setDate(date.getDate() + offset);\n\
  }, function(date) {\n\
    return date.getDate() - 1;\n\
  });\n\
  d3_time.days = d3_time.day.range;\n\
  d3_time.days.utc = d3_time.day.utc.range;\n\
  d3_time.dayOfYear = function(date) {\n\
    var year = d3_time.year(date);\n\
    return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);\n\
  };\n\
  d3_time_daySymbols.forEach(function(day, i) {\n\
    day = day.toLowerCase();\n\
    i = 7 - i;\n\
    var interval = d3_time[day] = d3_time_interval(function(date) {\n\
      (date = d3_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);\n\
      return date;\n\
    }, function(date, offset) {\n\
      date.setDate(date.getDate() + Math.floor(offset) * 7);\n\
    }, function(date) {\n\
      var day = d3_time.year(date).getDay();\n\
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);\n\
    });\n\
    d3_time[day + \"s\"] = interval.range;\n\
    d3_time[day + \"s\"].utc = interval.utc.range;\n\
    d3_time[day + \"OfYear\"] = function(date) {\n\
      var day = d3_time.year(date).getDay();\n\
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7);\n\
    };\n\
  });\n\
  d3_time.week = d3_time.sunday;\n\
  d3_time.weeks = d3_time.sunday.range;\n\
  d3_time.weeks.utc = d3_time.sunday.utc.range;\n\
  d3_time.weekOfYear = d3_time.sundayOfYear;\n\
  d3_time.format = d3_time_format;\n\
  function d3_time_format(template) {\n\
    var n = template.length;\n\
    function format(date) {\n\
      var string = [], i = -1, j = 0, c, p, f;\n\
      while (++i < n) {\n\
        if (template.charCodeAt(i) === 37) {\n\
          string.push(template.substring(j, i));\n\
          if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);\n\
          if (f = d3_time_formats[c]) c = f(date, p == null ? c === \"e\" ? \" \" : \"0\" : p);\n\
          string.push(c);\n\
          j = i + 1;\n\
        }\n\
      }\n\
      string.push(template.substring(j, i));\n\
      return string.join(\"\");\n\
    }\n\
    format.parse = function(string) {\n\
      var d = {\n\
        y: 1900,\n\
        m: 0,\n\
        d: 1,\n\
        H: 0,\n\
        M: 0,\n\
        S: 0,\n\
        L: 0,\n\
        Z: null\n\
      }, i = d3_time_parse(d, template, string, 0);\n\
      if (i != string.length) return null;\n\
      if (\"p\" in d) d.H = d.H % 12 + d.p * 12;\n\
      var localZ = d.Z != null && d3_date !== d3_date_utc, date = new (localZ ? d3_date_utc : d3_date)();\n\
      if (\"j\" in d) date.setFullYear(d.y, 0, d.j); else if (\"w\" in d && (\"W\" in d || \"U\" in d)) {\n\
        date.setFullYear(d.y, 0, 1);\n\
        date.setFullYear(d.y, 0, \"W\" in d ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7 : d.w + d.U * 7 - (date.getDay() + 6) % 7);\n\
      } else date.setFullYear(d.y, d.m, d.d);\n\
      date.setHours(d.H + Math.floor(d.Z / 100), d.M + d.Z % 100, d.S, d.L);\n\
      return localZ ? date._ : date;\n\
    };\n\
    format.toString = function() {\n\
      return template;\n\
    };\n\
    return format;\n\
  }\n\
  function d3_time_parse(date, template, string, j) {\n\
    var c, p, t, i = 0, n = template.length, m = string.length;\n\
    while (i < n) {\n\
      if (j >= m) return -1;\n\
      c = template.charCodeAt(i++);\n\
      if (c === 37) {\n\
        t = template.charAt(i++);\n\
        p = d3_time_parsers[t in d3_time_formatPads ? template.charAt(i++) : t];\n\
        if (!p || (j = p(date, string, j)) < 0) return -1;\n\
      } else if (c != string.charCodeAt(j++)) {\n\
        return -1;\n\
      }\n\
    }\n\
    return j;\n\
  }\n\
  function d3_time_formatRe(names) {\n\
    return new RegExp(\"^(?:\" + names.map(d3.requote).join(\"|\") + \")\", \"i\");\n\
  }\n\
  function d3_time_formatLookup(names) {\n\
    var map = new d3_Map(), i = -1, n = names.length;\n\
    while (++i < n) map.set(names[i].toLowerCase(), i);\n\
    return map;\n\
  }\n\
  function d3_time_formatPad(value, fill, width) {\n\
    var sign = value < 0 ? \"-\" : \"\", string = (sign ? -value : value) + \"\", length = string.length;\n\
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);\n\
  }\n\
  var d3_time_dayRe = d3_time_formatRe(d3_time_days), d3_time_dayLookup = d3_time_formatLookup(d3_time_days), d3_time_dayAbbrevRe = d3_time_formatRe(d3_time_dayAbbreviations), d3_time_dayAbbrevLookup = d3_time_formatLookup(d3_time_dayAbbreviations), d3_time_monthRe = d3_time_formatRe(d3_time_months), d3_time_monthLookup = d3_time_formatLookup(d3_time_months), d3_time_monthAbbrevRe = d3_time_formatRe(d3_time_monthAbbreviations), d3_time_monthAbbrevLookup = d3_time_formatLookup(d3_time_monthAbbreviations), d3_time_percentRe = /^%/;\n\
  var d3_time_formatPads = {\n\
    \"-\": \"\",\n\
    _: \" \",\n\
    \"0\": \"0\"\n\
  };\n\
  var d3_time_formats = {\n\
    a: function(d) {\n\
      return d3_time_dayAbbreviations[d.getDay()];\n\
    },\n\
    A: function(d) {\n\
      return d3_time_days[d.getDay()];\n\
    },\n\
    b: function(d) {\n\
      return d3_time_monthAbbreviations[d.getMonth()];\n\
    },\n\
    B: function(d) {\n\
      return d3_time_months[d.getMonth()];\n\
    },\n\
    c: d3_time_format(d3_time_formatDateTime),\n\
    d: function(d, p) {\n\
      return d3_time_formatPad(d.getDate(), p, 2);\n\
    },\n\
    e: function(d, p) {\n\
      return d3_time_formatPad(d.getDate(), p, 2);\n\
    },\n\
    H: function(d, p) {\n\
      return d3_time_formatPad(d.getHours(), p, 2);\n\
    },\n\
    I: function(d, p) {\n\
      return d3_time_formatPad(d.getHours() % 12 || 12, p, 2);\n\
    },\n\
    j: function(d, p) {\n\
      return d3_time_formatPad(1 + d3_time.dayOfYear(d), p, 3);\n\
    },\n\
    L: function(d, p) {\n\
      return d3_time_formatPad(d.getMilliseconds(), p, 3);\n\
    },\n\
    m: function(d, p) {\n\
      return d3_time_formatPad(d.getMonth() + 1, p, 2);\n\
    },\n\
    M: function(d, p) {\n\
      return d3_time_formatPad(d.getMinutes(), p, 2);\n\
    },\n\
    p: function(d) {\n\
      return d.getHours() >= 12 ? \"PM\" : \"AM\";\n\
    },\n\
    S: function(d, p) {\n\
      return d3_time_formatPad(d.getSeconds(), p, 2);\n\
    },\n\
    U: function(d, p) {\n\
      return d3_time_formatPad(d3_time.sundayOfYear(d), p, 2);\n\
    },\n\
    w: function(d) {\n\
      return d.getDay();\n\
    },\n\
    W: function(d, p) {\n\
      return d3_time_formatPad(d3_time.mondayOfYear(d), p, 2);\n\
    },\n\
    x: d3_time_format(d3_time_formatDate),\n\
    X: d3_time_format(d3_time_formatTime),\n\
    y: function(d, p) {\n\
      return d3_time_formatPad(d.getFullYear() % 100, p, 2);\n\
    },\n\
    Y: function(d, p) {\n\
      return d3_time_formatPad(d.getFullYear() % 1e4, p, 4);\n\
    },\n\
    Z: d3_time_zone,\n\
    \"%\": function() {\n\
      return \"%\";\n\
    }\n\
  };\n\
  var d3_time_parsers = {\n\
    a: d3_time_parseWeekdayAbbrev,\n\
    A: d3_time_parseWeekday,\n\
    b: d3_time_parseMonthAbbrev,\n\
    B: d3_time_parseMonth,\n\
    c: d3_time_parseLocaleFull,\n\
    d: d3_time_parseDay,\n\
    e: d3_time_parseDay,\n\
    H: d3_time_parseHour24,\n\
    I: d3_time_parseHour24,\n\
    j: d3_time_parseDayOfYear,\n\
    L: d3_time_parseMilliseconds,\n\
    m: d3_time_parseMonthNumber,\n\
    M: d3_time_parseMinutes,\n\
    p: d3_time_parseAmPm,\n\
    S: d3_time_parseSeconds,\n\
    U: d3_time_parseWeekNumberSunday,\n\
    w: d3_time_parseWeekdayNumber,\n\
    W: d3_time_parseWeekNumberMonday,\n\
    x: d3_time_parseLocaleDate,\n\
    X: d3_time_parseLocaleTime,\n\
    y: d3_time_parseYear,\n\
    Y: d3_time_parseFullYear,\n\
    Z: d3_time_parseZone,\n\
    \"%\": d3_time_parseLiteralPercent\n\
  };\n\
  function d3_time_parseWeekdayAbbrev(date, string, i) {\n\
    d3_time_dayAbbrevRe.lastIndex = 0;\n\
    var n = d3_time_dayAbbrevRe.exec(string.substring(i));\n\
    return n ? (date.w = d3_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseWeekday(date, string, i) {\n\
    d3_time_dayRe.lastIndex = 0;\n\
    var n = d3_time_dayRe.exec(string.substring(i));\n\
    return n ? (date.w = d3_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseWeekdayNumber(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i, i + 1));\n\
    return n ? (date.w = +n[0], i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseWeekNumberSunday(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i));\n\
    return n ? (date.U = +n[0], i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseWeekNumberMonday(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i));\n\
    return n ? (date.W = +n[0], i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseMonthAbbrev(date, string, i) {\n\
    d3_time_monthAbbrevRe.lastIndex = 0;\n\
    var n = d3_time_monthAbbrevRe.exec(string.substring(i));\n\
    return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseMonth(date, string, i) {\n\
    d3_time_monthRe.lastIndex = 0;\n\
    var n = d3_time_monthRe.exec(string.substring(i));\n\
    return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseLocaleFull(date, string, i) {\n\
    return d3_time_parse(date, d3_time_formats.c.toString(), string, i);\n\
  }\n\
  function d3_time_parseLocaleDate(date, string, i) {\n\
    return d3_time_parse(date, d3_time_formats.x.toString(), string, i);\n\
  }\n\
  function d3_time_parseLocaleTime(date, string, i) {\n\
    return d3_time_parse(date, d3_time_formats.X.toString(), string, i);\n\
  }\n\
  function d3_time_parseFullYear(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i, i + 4));\n\
    return n ? (date.y = +n[0], i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseYear(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));\n\
    return n ? (date.y = d3_time_expandYear(+n[0]), i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseZone(date, string, i) {\n\
    return /^[+-]\\d{4}$/.test(string = string.substring(i, i + 5)) ? (date.Z = +string, \n\
    i + 5) : -1;\n\
  }\n\
  function d3_time_expandYear(d) {\n\
    return d + (d > 68 ? 1900 : 2e3);\n\
  }\n\
  function d3_time_parseMonthNumber(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));\n\
    return n ? (date.m = n[0] - 1, i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseDay(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));\n\
    return n ? (date.d = +n[0], i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseDayOfYear(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i, i + 3));\n\
    return n ? (date.j = +n[0], i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseHour24(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));\n\
    return n ? (date.H = +n[0], i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseMinutes(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));\n\
    return n ? (date.M = +n[0], i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseSeconds(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));\n\
    return n ? (date.S = +n[0], i + n[0].length) : -1;\n\
  }\n\
  function d3_time_parseMilliseconds(date, string, i) {\n\
    d3_time_numberRe.lastIndex = 0;\n\
    var n = d3_time_numberRe.exec(string.substring(i, i + 3));\n\
    return n ? (date.L = +n[0], i + n[0].length) : -1;\n\
  }\n\
  var d3_time_numberRe = /^\\s*\\d+/;\n\
  function d3_time_parseAmPm(date, string, i) {\n\
    var n = d3_time_amPmLookup.get(string.substring(i, i += 2).toLowerCase());\n\
    return n == null ? -1 : (date.p = n, i);\n\
  }\n\
  var d3_time_amPmLookup = d3.map({\n\
    am: 0,\n\
    pm: 1\n\
  });\n\
  function d3_time_zone(d) {\n\
    var z = d.getTimezoneOffset(), zs = z > 0 ? \"-\" : \"+\", zh = ~~(abs(z) / 60), zm = abs(z) % 60;\n\
    return zs + d3_time_formatPad(zh, \"0\", 2) + d3_time_formatPad(zm, \"0\", 2);\n\
  }\n\
  function d3_time_parseLiteralPercent(date, string, i) {\n\
    d3_time_percentRe.lastIndex = 0;\n\
    var n = d3_time_percentRe.exec(string.substring(i, i + 1));\n\
    return n ? i + n[0].length : -1;\n\
  }\n\
  d3_time_format.utc = d3_time_formatUtc;\n\
  function d3_time_formatUtc(template) {\n\
    var local = d3_time_format(template);\n\
    function format(date) {\n\
      try {\n\
        d3_date = d3_date_utc;\n\
        var utc = new d3_date();\n\
        utc._ = date;\n\
        return local(utc);\n\
      } finally {\n\
        d3_date = Date;\n\
      }\n\
    }\n\
    format.parse = function(string) {\n\
      try {\n\
        d3_date = d3_date_utc;\n\
        var date = local.parse(string);\n\
        return date && date._;\n\
      } finally {\n\
        d3_date = Date;\n\
      }\n\
    };\n\
    format.toString = local.toString;\n\
    return format;\n\
  }\n\
  var d3_time_formatIso = d3_time_formatUtc(\"%Y-%m-%dT%H:%M:%S.%LZ\");\n\
  d3_time_format.iso = Date.prototype.toISOString && +new Date(\"2000-01-01T00:00:00.000Z\") ? d3_time_formatIsoNative : d3_time_formatIso;\n\
  function d3_time_formatIsoNative(date) {\n\
    return date.toISOString();\n\
  }\n\
  d3_time_formatIsoNative.parse = function(string) {\n\
    var date = new Date(string);\n\
    return isNaN(date) ? null : date;\n\
  };\n\
  d3_time_formatIsoNative.toString = d3_time_formatIso.toString;\n\
  d3_time.second = d3_time_interval(function(date) {\n\
    return new d3_date(Math.floor(date / 1e3) * 1e3);\n\
  }, function(date, offset) {\n\
    date.setTime(date.getTime() + Math.floor(offset) * 1e3);\n\
  }, function(date) {\n\
    return date.getSeconds();\n\
  });\n\
  d3_time.seconds = d3_time.second.range;\n\
  d3_time.seconds.utc = d3_time.second.utc.range;\n\
  d3_time.minute = d3_time_interval(function(date) {\n\
    return new d3_date(Math.floor(date / 6e4) * 6e4);\n\
  }, function(date, offset) {\n\
    date.setTime(date.getTime() + Math.floor(offset) * 6e4);\n\
  }, function(date) {\n\
    return date.getMinutes();\n\
  });\n\
  d3_time.minutes = d3_time.minute.range;\n\
  d3_time.minutes.utc = d3_time.minute.utc.range;\n\
  d3_time.hour = d3_time_interval(function(date) {\n\
    var timezone = date.getTimezoneOffset() / 60;\n\
    return new d3_date((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);\n\
  }, function(date, offset) {\n\
    date.setTime(date.getTime() + Math.floor(offset) * 36e5);\n\
  }, function(date) {\n\
    return date.getHours();\n\
  });\n\
  d3_time.hours = d3_time.hour.range;\n\
  d3_time.hours.utc = d3_time.hour.utc.range;\n\
  d3_time.month = d3_time_interval(function(date) {\n\
    date = d3_time.day(date);\n\
    date.setDate(1);\n\
    return date;\n\
  }, function(date, offset) {\n\
    date.setMonth(date.getMonth() + offset);\n\
  }, function(date) {\n\
    return date.getMonth();\n\
  });\n\
  d3_time.months = d3_time.month.range;\n\
  d3_time.months.utc = d3_time.month.utc.range;\n\
  function d3_time_scale(linear, methods, format) {\n\
    function scale(x) {\n\
      return linear(x);\n\
    }\n\
    scale.invert = function(x) {\n\
      return d3_time_scaleDate(linear.invert(x));\n\
    };\n\
    scale.domain = function(x) {\n\
      if (!arguments.length) return linear.domain().map(d3_time_scaleDate);\n\
      linear.domain(x);\n\
      return scale;\n\
    };\n\
    function tickMethod(extent, count) {\n\
      var span = extent[1] - extent[0], target = span / count, i = d3.bisect(d3_time_scaleSteps, target);\n\
      return i == d3_time_scaleSteps.length ? [ methods.year, d3_scale_linearTickRange(extent.map(function(d) {\n\
        return d / 31536e6;\n\
      }), count)[2] ] : !i ? [ d3_time_scaleMilliseconds, d3_scale_linearTickRange(extent, count)[2] ] : methods[target / d3_time_scaleSteps[i - 1] < d3_time_scaleSteps[i] / target ? i - 1 : i];\n\
    }\n\
    scale.nice = function(interval, skip) {\n\
      var domain = scale.domain(), extent = d3_scaleExtent(domain), method = interval == null ? tickMethod(extent, 10) : typeof interval === \"number\" && tickMethod(extent, interval);\n\
      if (method) interval = method[0], skip = method[1];\n\
      function skipped(date) {\n\
        return !isNaN(date) && !interval.range(date, d3_time_scaleDate(+date + 1), skip).length;\n\
      }\n\
      return scale.domain(d3_scale_nice(domain, skip > 1 ? {\n\
        floor: function(date) {\n\
          while (skipped(date = interval.floor(date))) date = d3_time_scaleDate(date - 1);\n\
          return date;\n\
        },\n\
        ceil: function(date) {\n\
          while (skipped(date = interval.ceil(date))) date = d3_time_scaleDate(+date + 1);\n\
          return date;\n\
        }\n\
      } : interval));\n\
    };\n\
    scale.ticks = function(interval, skip) {\n\
      var extent = d3_scaleExtent(scale.domain()), method = interval == null ? tickMethod(extent, 10) : typeof interval === \"number\" ? tickMethod(extent, interval) : !interval.range && [ {\n\
        range: interval\n\
      }, skip ];\n\
      if (method) interval = method[0], skip = method[1];\n\
      return interval.range(extent[0], d3_time_scaleDate(+extent[1] + 1), skip < 1 ? 1 : skip);\n\
    };\n\
    scale.tickFormat = function() {\n\
      return format;\n\
    };\n\
    scale.copy = function() {\n\
      return d3_time_scale(linear.copy(), methods, format);\n\
    };\n\
    return d3_scale_linearRebind(scale, linear);\n\
  }\n\
  function d3_time_scaleDate(t) {\n\
    return new Date(t);\n\
  }\n\
  function d3_time_scaleFormat(formats) {\n\
    return function(date) {\n\
      var i = formats.length - 1, f = formats[i];\n\
      while (!f[1](date)) f = formats[--i];\n\
      return f[0](date);\n\
    };\n\
  }\n\
  var d3_time_scaleSteps = [ 1e3, 5e3, 15e3, 3e4, 6e4, 3e5, 9e5, 18e5, 36e5, 108e5, 216e5, 432e5, 864e5, 1728e5, 6048e5, 2592e6, 7776e6, 31536e6 ];\n\
  var d3_time_scaleLocalMethods = [ [ d3_time.second, 1 ], [ d3_time.second, 5 ], [ d3_time.second, 15 ], [ d3_time.second, 30 ], [ d3_time.minute, 1 ], [ d3_time.minute, 5 ], [ d3_time.minute, 15 ], [ d3_time.minute, 30 ], [ d3_time.hour, 1 ], [ d3_time.hour, 3 ], [ d3_time.hour, 6 ], [ d3_time.hour, 12 ], [ d3_time.day, 1 ], [ d3_time.day, 2 ], [ d3_time.week, 1 ], [ d3_time.month, 1 ], [ d3_time.month, 3 ], [ d3_time.year, 1 ] ];\n\
  var d3_time_scaleLocalFormats = [ [ d3_time_format(\"%Y\"), d3_true ], [ d3_time_format(\"%B\"), function(d) {\n\
    return d.getMonth();\n\
  } ], [ d3_time_format(\"%b %d\"), function(d) {\n\
    return d.getDate() != 1;\n\
  } ], [ d3_time_format(\"%a %d\"), function(d) {\n\
    return d.getDay() && d.getDate() != 1;\n\
  } ], [ d3_time_format(\"%I %p\"), function(d) {\n\
    return d.getHours();\n\
  } ], [ d3_time_format(\"%I:%M\"), function(d) {\n\
    return d.getMinutes();\n\
  } ], [ d3_time_format(\":%S\"), function(d) {\n\
    return d.getSeconds();\n\
  } ], [ d3_time_format(\".%L\"), function(d) {\n\
    return d.getMilliseconds();\n\
  } ] ];\n\
  var d3_time_scaleLocalFormat = d3_time_scaleFormat(d3_time_scaleLocalFormats);\n\
  d3_time_scaleLocalMethods.year = d3_time.year;\n\
  d3_time.scale = function() {\n\
    return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);\n\
  };\n\
  var d3_time_scaleMilliseconds = {\n\
    range: function(start, stop, step) {\n\
      return d3.range(+start, +stop, step).map(d3_time_scaleDate);\n\
    }\n\
  };\n\
  var d3_time_scaleUTCMethods = d3_time_scaleLocalMethods.map(function(m) {\n\
    return [ m[0].utc, m[1] ];\n\
  });\n\
  var d3_time_scaleUTCFormats = [ [ d3_time_formatUtc(\"%Y\"), d3_true ], [ d3_time_formatUtc(\"%B\"), function(d) {\n\
    return d.getUTCMonth();\n\
  } ], [ d3_time_formatUtc(\"%b %d\"), function(d) {\n\
    return d.getUTCDate() != 1;\n\
  } ], [ d3_time_formatUtc(\"%a %d\"), function(d) {\n\
    return d.getUTCDay() && d.getUTCDate() != 1;\n\
  } ], [ d3_time_formatUtc(\"%I %p\"), function(d) {\n\
    return d.getUTCHours();\n\
  } ], [ d3_time_formatUtc(\"%I:%M\"), function(d) {\n\
    return d.getUTCMinutes();\n\
  } ], [ d3_time_formatUtc(\":%S\"), function(d) {\n\
    return d.getUTCSeconds();\n\
  } ], [ d3_time_formatUtc(\".%L\"), function(d) {\n\
    return d.getUTCMilliseconds();\n\
  } ] ];\n\
  var d3_time_scaleUTCFormat = d3_time_scaleFormat(d3_time_scaleUTCFormats);\n\
  d3_time_scaleUTCMethods.year = d3_time.year.utc;\n\
  d3_time.scale.utc = function() {\n\
    return d3_time_scale(d3.scale.linear(), d3_time_scaleUTCMethods, d3_time_scaleUTCFormat);\n\
  };\n\
  d3.text = d3_xhrType(function(request) {\n\
    return request.responseText;\n\
  });\n\
  d3.json = function(url, callback) {\n\
    return d3_xhr(url, \"application/json\", d3_json, callback);\n\
  };\n\
  function d3_json(request) {\n\
    return JSON.parse(request.responseText);\n\
  }\n\
  d3.html = function(url, callback) {\n\
    return d3_xhr(url, \"text/html\", d3_html, callback);\n\
  };\n\
  function d3_html(request) {\n\
    var range = d3_document.createRange();\n\
    range.selectNode(d3_document.body);\n\
    return range.createContextualFragment(request.responseText);\n\
  }\n\
  d3.xml = d3_xhrType(function(request) {\n\
    return request.responseXML;\n\
  });\n\
  return d3;\n\
}();//@ sourceURL=mbostock-d3/d3.js"
));
require.register("mbostock-d3/index-browserify.js", Function("exports, require, module",
"require(\"./d3\");\n\
module.exports = d3;\n\
(function () { delete this.d3; })(); // unset global\n\
//@ sourceURL=mbostock-d3/index-browserify.js"
));
require.register("trevorgerhardt-stylesheet/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Dependencies\n\
 */\n\
\n\
var merge = require('merge-util');\n\
\n\
/**\n\
 * Expose `StyleSheet`\n\
 */\n\
\n\
module.exports = StyleSheet;\n\
\n\
/**\n\
 * Create an instance of StyleSheet\n\
 *\n\
 * @param {Object} CSS rules\n\
 * @param {Object} variables to substitute\n\
 */\n\
\n\
function StyleSheet(rules, variables) {\n\
  if (!(this instanceof StyleSheet)) {\n\
    return new StyleSheet(rules, variables);\n\
  }\n\
\n\
  this.variables = {};\n\
  this.rules = {};\n\
\n\
  if (rules) {\n\
    this.add(rules);\n\
  }\n\
\n\
  if (variables) {\n\
    this.define(variables);\n\
  }\n\
}\n\
\n\
/**\n\
 * Define new variables.\n\
 *\n\
 * @param {Object}\n\
 */\n\
\n\
StyleSheet.prototype.define = function(variables) {\n\
  this.variables = merge(this.variables, variables);\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Add new css but won't refresh the style element's content.\n\
 *\n\
 * @param {Object}\n\
 */\n\
\n\
StyleSheet.prototype.add = function(rules) {\n\
  this.rules = merge(this.rules, rules);\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Append new css to the style element or refresh its content.\n\
 */\n\
\n\
StyleSheet.prototype.render = function() {\n\
  if (!this.el) {\n\
    this.el = createStyleSheetElement();\n\
  }\n\
\n\
  this.el.innerHTML = generateCSS(this.rules, this.variables);\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Clear the styles & variables.\n\
 */\n\
\n\
StyleSheet.prototype.clear = function() {\n\
  this.el.innerHTML = '';\n\
  this.rules = '';\n\
  this.variables = {};\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the style element.\n\
 */\n\
\n\
StyleSheet.prototype.remove = function() {\n\
  var el = this.el;\n\
  if (el && el.parentNode) {\n\
    el.parentNode.removeChild(el);\n\
    this.el = null;\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/*\n\
 * Create new stylesheet.\n\
 */\n\
\n\
function createStyleSheetElement() {\n\
  var elem = document.createElement('style');\n\
  var head = document.getElementsByTagName('head')[0];\n\
\n\
  head.appendChild(elem);\n\
  return elem;\n\
}\n\
\n\
/*\n\
 * Generate CSS subsituting in the variables\n\
 */\n\
\n\
function generateCSS(rules, variables) {\n\
  var list = '';\n\
  var value;\n\
  for (var selector in rules) {\n\
    list += selector + '{';\n\
    for (var rule in rules[selector]) {\n\
      value = rules[selector][rule];\n\
\n\
      if (isFunction(value)) {\n\
        value = value();\n\
      }\n\
\n\
      list += rule + ':' + value + ';';\n\
    }\n\
\n\
    list += '}';\n\
  }\n\
\n\
  // substitue in the variables\n\
  for (var name in variables) {\n\
    value = variables[name];\n\
\n\
    if (isFunction(value)) {\n\
      value = value();\n\
    }\n\
\n\
    list = list.replace(new RegExp('@' + name, 'gi'), value);\n\
  }\n\
\n\
  return list;\n\
}\n\
\n\
/**\n\
 * Is function?\n\
 */\n\
\n\
function isFunction(val) {\n\
  return Object.prototype.toString.call(val) === '[object Function]';\n\
}\n\
//@ sourceURL=trevorgerhardt-stylesheet/index.js"
));
require.register("visionmedia-debug/index.js", Function("exports, require, module",
"if ('undefined' == typeof window) {\n\
  module.exports = require('./lib/debug');\n\
} else {\n\
  module.exports = require('./debug');\n\
}\n\
//@ sourceURL=visionmedia-debug/index.js"
));
require.register("visionmedia-debug/debug.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `debug()` as the module.\n\
 */\n\
\n\
module.exports = debug;\n\
\n\
/**\n\
 * Create a debugger with the given `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {Type}\n\
 * @api public\n\
 */\n\
\n\
function debug(name) {\n\
  if (!debug.enabled(name)) return function(){};\n\
\n\
  return function(fmt){\n\
    fmt = coerce(fmt);\n\
\n\
    var curr = new Date;\n\
    var ms = curr - (debug[name] || curr);\n\
    debug[name] = curr;\n\
\n\
    fmt = name\n\
      + ' '\n\
      + fmt\n\
      + ' +' + debug.humanize(ms);\n\
\n\
    // This hackery is required for IE8\n\
    // where `console.log` doesn't have 'apply'\n\
    window.console\n\
      && console.log\n\
      && Function.prototype.apply.call(console.log, console, arguments);\n\
  }\n\
}\n\
\n\
/**\n\
 * The currently active debug mode names.\n\
 */\n\
\n\
debug.names = [];\n\
debug.skips = [];\n\
\n\
/**\n\
 * Enables a debug mode by name. This can include modes\n\
 * separated by a colon and wildcards.\n\
 *\n\
 * @param {String} name\n\
 * @api public\n\
 */\n\
\n\
debug.enable = function(name) {\n\
  try {\n\
    localStorage.debug = name;\n\
  } catch(e){}\n\
\n\
  var split = (name || '').split(/[\\s,]+/)\n\
    , len = split.length;\n\
\n\
  for (var i = 0; i < len; i++) {\n\
    name = split[i].replace('*', '.*?');\n\
    if (name[0] === '-') {\n\
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));\n\
    }\n\
    else {\n\
      debug.names.push(new RegExp('^' + name + '$'));\n\
    }\n\
  }\n\
};\n\
\n\
/**\n\
 * Disable debug output.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
debug.disable = function(){\n\
  debug.enable('');\n\
};\n\
\n\
/**\n\
 * Humanize the given `ms`.\n\
 *\n\
 * @param {Number} m\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
debug.humanize = function(ms) {\n\
  var sec = 1000\n\
    , min = 60 * 1000\n\
    , hour = 60 * min;\n\
\n\
  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';\n\
  if (ms >= min) return (ms / min).toFixed(1) + 'm';\n\
  if (ms >= sec) return (ms / sec | 0) + 's';\n\
  return ms + 'ms';\n\
};\n\
\n\
/**\n\
 * Returns true if the given mode name is enabled, false otherwise.\n\
 *\n\
 * @param {String} name\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
debug.enabled = function(name) {\n\
  for (var i = 0, len = debug.skips.length; i < len; i++) {\n\
    if (debug.skips[i].test(name)) {\n\
      return false;\n\
    }\n\
  }\n\
  for (var i = 0, len = debug.names.length; i < len; i++) {\n\
    if (debug.names[i].test(name)) {\n\
      return true;\n\
    }\n\
  }\n\
  return false;\n\
};\n\
\n\
/**\n\
 * Coerce `val`.\n\
 */\n\
\n\
function coerce(val) {\n\
  if (val instanceof Error) return val.stack || val.message;\n\
  return val;\n\
}\n\
\n\
// persist\n\
\n\
try {\n\
  if (window.localStorage) debug.enable(localStorage.debug);\n\
} catch(e){}\n\
//@ sourceURL=visionmedia-debug/debug.js"
));
require.register("yields-svg-attributes/index.js", Function("exports, require, module",
"\n\
/**\n\
 * SVG Attributes\n\
 *\n\
 * http://www.w3.org/TR/SVG/attindex.html\n\
 */\n\
\n\
module.exports = [\n\
  'height',\n\
  'target',\n\
  'title',\n\
  'width',\n\
  'y1',\n\
  'y2',\n\
  'x1',\n\
  'x2',\n\
  'cx',\n\
  'cy',\n\
  'dx',\n\
  'dy',\n\
  'rx',\n\
  'ry',\n\
  'd',\n\
  'r',\n\
  'y',\n\
  'x'\n\
];\n\
//@ sourceURL=yields-svg-attributes/index.js"
));
require.register("conveyal-transitive.js/lib/graph/edge.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Edge`\n\
 */\n\
\n\
module.exports = Edge;\n\
\n\
/**\n\
 * Initialize a new edge\n\
 *\n\
 * @param {Array}\n\
 * @param {Vertex}\n\
 * @param {Vertex}\n\
 */\n\
\n\
function Edge(stopArray, fromVertex, toVertex) {\n\
  this.stopArray = stopArray;\n\
  this.fromVertex = fromVertex;\n\
  this.toVertex = toVertex;\n\
  this.patterns = [];\n\
\n\
  this.calculateVectors();\n\
}\n\
\n\
/**\n\
 *\n\
 */\n\
\n\
Edge.prototype.pointAlongEdge = function(t) {\n\
  var x = this.fromVertex.x + t * (this.toVertex.x - this.fromVertex.x);\n\
  var y = this.fromVertex.y + t * (this.toVertex.y - this.fromVertex.y);\n\
  return {\n\
    x: x,\n\
    y: y\n\
  };\n\
};\n\
\n\
/**\n\
 *\n\
 */\n\
\n\
Edge.prototype.calculateVectors = function() {\n\
  var dx = this.fromVertex.x - this.toVertex.x;\n\
  var dy = this.fromVertex.y - this.toVertex.y;\n\
  var l = Math.sqrt(dx * dx + dy * dy);\n\
\n\
  this.vector = {\n\
    x: dx / l,\n\
    y : dy / l\n\
  };\n\
\n\
  this.leftVector = {\n\
    x : -this.vector.y,\n\
    y : this.vector.x\n\
  };\n\
\n\
  this.rightVector = {\n\
    x : this.vector.y,\n\
    y : -this.vector.x\n\
  };\n\
};\n\
\n\
/**\n\
 *  Add a pattern to the edge\n\
 */\n\
\n\
Edge.prototype.addPattern = function(pattern) {\n\
  if (this.patterns.indexOf(pattern) === -1) this.patterns.push(pattern);\n\
};\n\
\n\
/**\n\
 *  Gets the vertex opposite another vertex on an edge\n\
 */\n\
\n\
Edge.prototype.oppositeVertex = function(vertex) {\n\
  if (vertex === this.toVertex) return this.fromVertex;\n\
  if (vertex === this.fromVertex) return this.toVertex;\n\
  return null;\n\
};\n\
\n\
/**\n\
 *\n\
 */\n\
\n\
Edge.prototype.setStopLabelPosition = function(pos, skip) {\n\
  if (this.fromVertex.stop !== skip) this.fromVertex.stop.labelPosition = pos;\n\
  if (this.toVertex.stop !== skip) this.toVertex.stop.labelPosition = pos;\n\
\n\
  this.stopArray.forEach(function(stop) {\n\
    if (stop !== skip) stop.labelPosition = pos;\n\
  });\n\
};\n\
\n\
/**\n\
 *\n\
 */\n\
\n\
Edge.prototype.toString = function() {\n\
  return this.fromVertex.stop.getId() + '_' + this.toVertex.stop.getId();\n\
};\n\
//@ sourceURL=conveyal-transitive.js/lib/graph/edge.js"
));
require.register("conveyal-transitive.js/lib/graph/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Dependencies\n\
 */\n\
\n\
var Edge = require('./edge');\n\
var Vertex = require('./vertex');\n\
\n\
/**\n\
 * Expose `Graph`\n\
 */\n\
\n\
module.exports = NetworkGraph;\n\
\n\
/**\n\
 *  An graph representing the underlying 'wireframe' network\n\
 */\n\
\n\
function NetworkGraph() {\n\
  this.vertices = [];\n\
  this.edges = [];\n\
}\n\
\n\
/**\n\
 * Add Vertex\n\
 */\n\
\n\
NetworkGraph.prototype.addVertex = function(stop, x, y) {\n\
  if(!x) x = stop.stop_lon;\n\
  if(!y) y = stop.stop_lat;\n\
  var vertex = new Vertex(stop, x, y);\n\
  this.vertices.push(vertex);\n\
  return vertex;\n\
};\n\
\n\
/**\n\
 * Add Edge\n\
 */\n\
\n\
NetworkGraph.prototype.addEdge = function(stopArray, fromVertex, toVertex) {\n\
  if (this.vertices.indexOf(fromVertex) === -1) {\n\
    console.log('Error: NetworkGraph does not contain Edge fromVertex');\n\
    return;\n\
  }\n\
\n\
  if (this.vertices.indexOf(toVertex) === -1) {\n\
    console.log('Error: NetworkGraph does not contain Edge toVertex');\n\
    return;\n\
  }\n\
\n\
  var edge = new Edge(stopArray, fromVertex, toVertex);\n\
  this.edges.push(edge);\n\
  fromVertex.edges.push(edge);\n\
  toVertex.edges.push(edge);\n\
\n\
  return edge;\n\
};\n\
\n\
/**\n\
 * Get the equivalent edge\n\
 */\n\
\n\
NetworkGraph.prototype.getEquivalentEdge = function(stopArray, from, to) {\n\
  for (var e = 0; e < this.edges.length; e++) {\n\
    var edge = this.edges[e];\n\
    if (edge.fromVertex === from\n\
      && edge.toVertex === to\n\
      && stopArray.length === edge.stopArray.length\n\
      && equal(stopArray, edge.stopArray)) {\n\
      return edge;\n\
    }\n\
  }\n\
};\n\
\n\
/**\n\
 * Convert the graph coordinates to a linear 1-d display. Assumes a branch-based, acyclic graph\n\
 */\n\
\n\
NetworkGraph.prototype.convertTo1D = function(stopArray, from, to) {\n\
  if (this.edges.length === 0) return;\n\
\n\
  // find the \"trunk\" edge; i.e. the one with the most patterns\n\
  var trunkEdge = null;\n\
  var maxPatterns = 0;\n\
\n\
  for (var e = 0; e < this.edges.length; e++) {\n\
    var edge = this.edges[e];\n\
    if(edge.patterns.length > maxPatterns) {\n\
      trunkEdge = edge;\n\
      maxPatterns = edge.patterns.length;\n\
    }\n\
  }\n\
  this.exploredVertices = [trunkEdge.fromVertex, trunkEdge.toVertex];\n\
\n\
  //console.log('trunk edge: ');\n\
  //console.log(trunkEdge);\n\
  trunkEdge.setStopLabelPosition(-1);\n\
\n\
  // determine the direction relative to the trunk edge\n\
  var llDir = trunkEdge.toVertex.x - trunkEdge.fromVertex.x;\n\
  if(llDir === 0) llDir = trunkEdge.toVertex.y - trunkEdge.fromVertex.y;\n\
\n\
  if(llDir > 0) {\n\
    // make the trunk edge from (0,0) to (x,0)\n\
    trunkEdge.fromVertex.moveTo(0, 0);\n\
    trunkEdge.toVertex.moveTo(trunkEdge.stopArray.length + 1, 0);\n\
\n\
    // explore the graph in both directions\n\
    this.extend1D(trunkEdge, trunkEdge.fromVertex, -1, 0);\n\
    this.extend1D(trunkEdge, trunkEdge.toVertex, 1, 0);\n\
  }\n\
  else {\n\
    // make the trunk edge from (x,0) to (0,0)\n\
    trunkEdge.toVertex.moveTo(0, 0);\n\
    trunkEdge.fromVertex.moveTo(trunkEdge.stopArray.length + 1, 0);\n\
\n\
    // explore the graph in both directions\n\
    this.extend1D(trunkEdge, trunkEdge.fromVertex, 1, 0);\n\
    this.extend1D(trunkEdge, trunkEdge.toVertex, -1, 0);\n\
  }\n\
\n\
  this.apply1DOffsets();\n\
};\n\
\n\
NetworkGraph.prototype.extend1D = function(edge, vertex, direction, y) {\n\
\n\
  var edges = vertex.incidentEdges(edge);\n\
  if(edges.length === 0) { // no additional edges to explore; we're done\n\
    return;\n\
  }\n\
  else if(edges.length === 1) { // exactly one other edge to explore\n\
    var extEdge = edges[0];\n\
    var oppVertex = extEdge.oppositeVertex(vertex);\n\
    extEdge.setStopLabelPosition((y > 0) ? 1 : -1, vertex);\n\
\n\
    if(this.exploredVertices.indexOf(oppVertex) !== -1) {\n\
      console.log('Warning: found cycle in 1d graph');\n\
      return;\n\
    }\n\
    this.exploredVertices.push(oppVertex);\n\
\n\
    oppVertex.moveTo(vertex.x + (extEdge.stopArray.length + 1) * direction, y);\n\
    this.extend1D(extEdge, oppVertex, direction, y);\n\
  }\n\
  else { // branch case\n\
    //console.log('branch:');\n\
\n\
    // iterate through the branches\n\
    edges.forEach(function(extEdge, i) {\n\
      var oppVertex = extEdge.oppositeVertex(vertex);\n\
\n\
      if(this.exploredVertices.indexOf(oppVertex) !== -1) {\n\
        console.log('Warning: found cycle in 1d graph (branch)');\n\
        return;\n\
      }\n\
      this.exploredVertices.push(oppVertex);\n\
\n\
      // the first branch encountered is rendered as the straight line\n\
      // TODO: apply logic to this based on trip count, etc.\n\
      if(i === 0) {\n\
        oppVertex.moveTo(vertex.x + (extEdge.stopArray.length + 1) * direction, y);\n\
        extEdge.setStopLabelPosition((y > 0) ? 1 : -1, vertex);\n\
        this.extend1D(extEdge, oppVertex, direction, y);\n\
      }\n\
      else { // subsequent branches\n\
\n\
        //console.log('branch y+'+i);\n\
        var branchY = y+i;\n\
\n\
        if(extEdge.stopArray.length === 0) {\n\
          oppVertex.moveTo(vertex.x + 1 * direction, branchY);\n\
          return;\n\
        }\n\
\n\
        var newVertexStop;\n\
        if(extEdge.fromVertex === vertex) {\n\
          newVertexStop = extEdge.stopArray[0];\n\
          extEdge.stopArray.splice(0, 1);\n\
        }\n\
        else if(extEdge.toVertex === vertex) {\n\
          newVertexStop = extEdge.stopArray[extEdge.stopArray.length-1];\n\
          extEdge.stopArray.splice(extEdge.stopArray.length-1, 1);\n\
        }\n\
\n\
        var newVertex = this.addVertex(newVertexStop, vertex.x+direction, branchY);\n\
\n\
        this.splitEdge(extEdge, newVertex, vertex);\n\
        extEdge.setStopLabelPosition((branchY > 0) ? 1 : -1, vertex);\n\
\n\
        oppVertex.moveTo(newVertex.x + (extEdge.stopArray.length + 1) * direction, branchY);\n\
        this.extend1D(extEdge, oppVertex, direction, branchY);\n\
      }\n\
      //console.log(extEdge);\n\
    }, this);\n\
  }\n\
};\n\
\n\
\n\
/**\n\
 *\n\
 */\n\
\n\
NetworkGraph.prototype.splitEdge = function(edge, newVertex, adjacentVertex) {\n\
\n\
  var newEdge;\n\
  // attach the existing edge to the inserted vertex\n\
  if(edge.fromVertex === adjacentVertex) {\n\
    newEdge = this.addEdge([], adjacentVertex, newVertex);\n\
    edge.fromVertex = newVertex;\n\
  }\n\
  else if(edge.toVertex === adjacentVertex) {\n\
    newEdge = this.addEdge([], newVertex, adjacentVertex);\n\
    edge.toVertex = newVertex;\n\
  }\n\
  else { // invalid params\n\
    console.log('Warning: invalid params to graph.splitEdge');\n\
    return;\n\
  }\n\
\n\
  // de-associate the existing edge from the adjacentVertex\n\
  adjacentVertex.removeEdge(edge);\n\
\n\
  // create new edge and copy the patterns\n\
  //var newEdge = this.addEdge([], adjacentVertex, newVertex);\n\
  edge.patterns.forEach(function(pattern) {\n\
    newEdge.addPattern(pattern);\n\
  });\n\
\n\
  // associate both edges with the new vertex\n\
  newVertex.edges = [newEdge, edge];\n\
\n\
  // update the affected patterns' edge lists\n\
  edge.patterns.forEach(function(pattern) {\n\
    var i = pattern.graphEdges.indexOf(edge);\n\
    pattern.insertEdge(i, newEdge);\n\
  });\n\
\n\
};\n\
\n\
\n\
/**\n\
 *  Compute offsets for a 1.5D line map rendering\n\
 */\n\
\n\
NetworkGraph.prototype.apply1DOffsets = function() {\n\
\n\
  // initialize the bundle comparisons\n\
  this.bundleComparisons = {};\n\
\n\
  // loop through all vertices with order of 3+ (i.e. where pattern convergence/divergence is possible)\n\
  this.vertices.forEach(function(vertex) {\n\
    if(vertex.edges.length <= 2) return;\n\
\n\
    // loop through the incident edges with 2+ patterns\n\
    vertex.edges.forEach(function(edge) {\n\
      if(edge.patterns.length < 2) return;\n\
\n\
      // compare each pattern pair sharing this edge\n\
      for(var i = 0; i < edge.patterns.length; i++) {\n\
        for(var j = i+1; j < edge.patterns.length; j++) {\n\
          var p1 = edge.patterns[i], p2 = edge.patterns[j];\n\
          var adjEdge1 = p1.getAdjacentEdge(edge, vertex);\n\
          var adjEdge2 = p2.getAdjacentEdge(edge, vertex);\n\
          if(adjEdge1 !== null && adjEdge2 !== null || adjEdge1 !== adjEdge2) {\n\
            var oppVertex1 = adjEdge1.oppositeVertex(vertex);\n\
            var oppVertex2 = adjEdge2.oppositeVertex(vertex);\n\
\n\
            var dx = edge.toVertex.x - edge.fromVertex.x;\n\
            if(dx > 0 && oppVertex1.y < oppVertex2.y) {\n\
              this.bundleComparison(p2, p1);\n\
            }\n\
            else if(dx > 0 && oppVertex1.y > oppVertex2.y) {\n\
              this.bundleComparison(p1, p2);\n\
            }\n\
            else if(dx < 0 && oppVertex1.y < oppVertex2.y) {\n\
              this.bundleComparison(p1, p2);\n\
            }\n\
            else if(dx < 0 && oppVertex1.y > oppVertex2.y) {\n\
              this.bundleComparison(p2, p1);\n\
            }\n\
          }\n\
        }\n\
      }\n\
    }, this);\n\
  }, this);\n\
\n\
  // create a copy of the array, sorted by bundle size (decreasing)\n\
  var sortedEdges = this.edges.concat().sort(function compare(a,b) {\n\
    if(a.patterns.length > b.patterns.length) return -1;\n\
    if(a.patterns.length < b.patterns.length) return 1;\n\
    return 0;\n\
  });\n\
\n\
  sortedEdges.forEach(function(edge) {\n\
    if(edge.toVertex.y !== edge.fromVertex.y) return;\n\
    //console.log('edge w/ ' + edge.patterns.length + ' to offset');\n\
    if(edge.patterns.length === 1) {\n\
      edge.patterns[0].setEdgeOffset(edge, 0);\n\
    }\n\
    else { // 2+ patterns\n\
      var this_ = this;\n\
\n\
      // compute the offsets for this buncle\n\
      var sortedPatterns = edge.patterns.concat().sort(function compare(a, b) {\n\
        var key = a.pattern_id + ',' + b.pattern_id;\n\
        var compValue = this_.bundleComparisons[key];\n\
        if(compValue < 0) return -1;\n\
        if(compValue > 0) return 1;\n\
        return 0;\n\
      });\n\
      sortedPatterns.forEach(function(pattern, i) {\n\
        pattern.setEdgeOffset(edge, (-i + (edge.patterns.length-1)/2) * -1.2, i, true);\n\
      });\n\
    }\n\
  }, this);\n\
};\n\
\n\
\n\
/**\n\
 *  Helper method for creating comparisons between patterns for bundle offsetting\n\
 */\n\
\n\
NetworkGraph.prototype.bundleComparison = function(p1, p2) {\n\
\n\
  var key = p1.pattern_id + ',' + p2.pattern_id;\n\
  if(!(key in this.bundleComparisons)) this.bundleComparisons[key] = 0;\n\
  this.bundleComparisons[key] += 1;\n\
\n\
  key = p2.pattern_id + ',' + p1.pattern_id;\n\
  if(!(key in this.bundleComparisons)) this.bundleComparisons[key] = 0;\n\
  this.bundleComparisons[key] -= 1;\n\
};\n\
\n\
\n\
/**\n\
 * Check if arrays are equal\n\
 */\n\
\n\
function equal(a, b) {\n\
  if (a.length !== b.length) {\n\
    return false;\n\
  }\n\
\n\
  for (var i in a) {\n\
    if (a[i] !== b[i]) {\n\
      return false;\n\
    }\n\
  }\n\
\n\
  return true;\n\
}\n\
//@ sourceURL=conveyal-transitive.js/lib/graph/index.js"
));
require.register("conveyal-transitive.js/lib/graph/vertex.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Vertex`\n\
 */\n\
\n\
module.exports = Vertex;\n\
\n\
/**\n\
 * Initialize new Vertex\n\
 *\n\
 * @param {Stop}\n\
 * @param {Number}\n\
 * @param {Number}\n\
 */\n\
\n\
function Vertex(stop, x, y) {\n\
  this.stop = stop;\n\
  this.x = x;\n\
  this.y = y;\n\
  this.edges = [];\n\
}\n\
\n\
\n\
/**\n\
 * Move to new coordinate\n\
 *\n\
 * @param {Number}\n\
 * @param {Number}\n\
 */\n\
\n\
Vertex.prototype.moveTo = function(x, y) {\n\
  this.x = x;\n\
  this.y = y;\n\
  this.edges.forEach(function (edge) {\n\
    edge.calculateVectors();\n\
  });\n\
};\n\
\n\
\n\
/**\n\
 * Get array of edges incident to vertex. Allows specification of \"incoming\" edge that will not be included in results\n\
 *\n\
 * @param {Edge}\n\
 */\n\
\n\
Vertex.prototype.incidentEdges = function(inEdge) {\n\
\tvar results = [];\n\
\tthis.edges.forEach(function(edge) {\n\
\t\tif(edge !== inEdge) results.push(edge);\n\
\t});\n\
\treturn results;\n\
};\n\
\n\
\n\
/**\n\
 * Remove an edge from the vertex's edge list\n\
 *\n\
 * @param {Edge}\n\
 */\n\
\n\
Vertex.prototype.removeEdge = function(edge) {\n\
  var index = this.edges.indexOf(edge);\n\
  if(index !== -1) this.edges.splice(index, 1);\n\
};//@ sourceURL=conveyal-transitive.js/lib/graph/vertex.js"
));
require.register("conveyal-transitive.js/lib/styler/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Dependencies\n\
 */\n\
\n\
var merge = require('merge-util');\n\
var styles = require('./styles');\n\
var StyleSheet = require('stylesheet');\n\
var svgAttributes = require('svg-attributes');\n\
\n\
/**\n\
 * Element Types\n\
 */\n\
\n\
var types = [ 'labels', 'patterns', 'stops' ];\n\
\n\
/**\n\
 * Add transform\n\
 */\n\
\n\
svgAttributes.push('transform');\n\
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
function Styler(styles) {\n\
  if (!(this instanceof Styler)) return new Styler(styles);\n\
\n\
  // reset styles\n\
  this.reset();\n\
\n\
  // load styles\n\
  if (styles) this.load(styles);\n\
}\n\
\n\
/**\n\
 * Reset to the predefined styles\n\
 */\n\
\n\
Styler.prototype.reset = function () {\n\
  types.forEach(function (type) {\n\
    this[type] = merge({}, styles[type]);\n\
  }, this);\n\
};\n\
\n\
/**\n\
 * Load rules\n\
 *\n\
 * @param {Object} a set of style rules\n\
 */\n\
\n\
Styler.prototype.load = function(styles) {\n\
  types.forEach(function (type) {\n\
    if (styles[type]) this[type] = merge(this[type], styles[type]);\n\
  }, this);\n\
};\n\
\n\
/**\n\
 * Render pattern\n\
 *\n\
 * @param {Display} display\n\
 * @param {Pattern} pattern\n\
 */\n\
\n\
Styler.prototype.renderPattern = function(display, pattern) {\n\
  applyAttrAndStyle(\n\
    display,\n\
    pattern,\n\
    this.patterns\n\
  );\n\
};\n\
\n\
/**\n\
 * Render elements against these rules\n\
 *\n\
 * @param {Display} a D3 list of elements\n\
 * @param {Stop} Transitive Stop object\n\
 */\n\
\n\
Styler.prototype.renderStop = function(display, stop) {\n\
  applyAttrAndStyle(\n\
    display,\n\
    stop.svgGroup.selectAll('.transitive-stop-circle'),\n\
    this.stops\n\
  );\n\
\n\
  applyAttrAndStyle(\n\
    display,\n\
    stop.svgGroup.selectAll('.transitive-stop-label'),\n\
    this.labels\n\
  );\n\
};\n\
\n\
/**\n\
 * Check if it's an attribute or a style and apply accordingly\n\
 *\n\
 * @param {Transitive} the transitive object\n\
 * @param {Pattern} the Pattern object\n\
 * @param {Object} a D3 list of elements\n\
 * @param {Object} the rules to apply to the elements\n\
 */\n\
\n\
function applyAttrAndStyle(display, elements, rules) {\n\
  for (var name in rules) {\n\
    var type = svgAttributes.indexOf(name) === -1\n\
      ? 'style'\n\
      : 'attr';\n\
    var value = computeRule(rules[name]);\n\
    if (!!value) elements[type](name, value);\n\
  }\n\
\n\
  function computeRule(rule) {\n\
    return function (data, index) {\n\
      return isFunction(rule)\n\
        ? rule.call(rules, display, data, index)\n\
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
//@ sourceURL=conveyal-transitive.js/lib/styler/index.js"
));
require.register("conveyal-transitive.js/lib/styler/styles.js", Function("exports, require, module",
"\n\
/**\n\
 *\n\
 */\n\
\n\
var zoom_min = 0.25, zoom_max = 4, zoom_mid = 1;\n\
function pixels(current_z, min, normal, max) {\n\
  if (current_z === zoom_mid) return normal;\n\
  if (current_z < zoom_mid) return min + (current_z - zoom_min) / (zoom_mid - zoom_min) * (normal - min);\n\
  return normal + (current_z - zoom_mid) / (zoom_max - zoom_mid) * (max - normal);\n\
}\n\
\n\
function strokeWidth(display) {\n\
  return pixels(display.zoom.scale(), 5, 12, 19);\n\
}\n\
\n\
function fontSize(display, data) {\n\
  return pixels(display.zoom.scale(), 10, 14, 18);\n\
}\n\
\n\
/**\n\
 * Default stop rules\n\
 */\n\
\n\
exports.stops = {\n\
  cx: 0,\n\
  cy: function (display, data) {\n\
    if (data.stop.renderData.length === 2 && data.stop.isEndPoint) {\n\
      return -strokeWidth(display) / 2 + 'px';\n\
    } else if (data.stop.renderData.length === 3 && data.stop.isEndPoint) {\n\
      return -strokeWidth(display) + 'px';\n\
    }\n\
    return 0;\n\
  },\n\
  fill: function (display, data) {\n\
    return '#fff';\n\
  },\n\
  r: function (display, data) {\n\
    if (data.stop.isEndPoint) {\n\
      var width = data.stop.renderData.length * strokeWidth(display) / 2;\n\
      return 1.75 * width + 'px';\n\
    }\n\
    return pixels(display.zoom.scale(), 2, 4, 6.5) + 'px';\n\
  },\n\
  stroke: function (display, data) {\n\
    if (data.stop.isEndPoint && data.pattern.route.route_color) {\n\
      return '#' + data.pattern.route.route_color;\n\
    } else if (data.pattern.route.route_color) {\n\
      return 'gray';\n\
    }\n\
    return '#2EB1E6';\n\
  },\n\
  'stroke-width': function (display, data) {\n\
    if (data.stop.isEndPoint) {\n\
      return data.stop.renderData.length * strokeWidth(display) / 2 + 'px';\n\
    }\n\
    return pixels(display.zoom.scale(), 0.5, 1, 1.5) + 'px';\n\
  },\n\
  visibility: function(display, data) {\n\
    if (data.stop.renderData.length > 1) {\n\
      if (data.stop.renderData[0].displayed && data.stop.isEndPoint) return 'hidden';\n\
      data.stop.renderData[0].displayed = true;\n\
    }\n\
  }\n\
};\n\
\n\
/**\n\
 * Default label rules\n\
 */\n\
\n\
exports.labels = {\n\
  color: '#1a1a1a',\n\
  'font-family': '\\'Lato\\', sans-serif',\n\
  'font-size': function(display, data) {\n\
    return fontSize(display, data) + 'px';\n\
  },\n\
  visibility: function (display, data) {\n\
    if (display.zoom.scale() >= 0.8) return 'visible';\n\
    if (display.zoom.scale() >= 0.6 && data.stop.isBranchPoint) return 'visible';\n\
    if (display.zoom.scale() >= 0.4 && data.stop.isEndPoint) return 'visible';\n\
    return 'hidden';\n\
  },\n\
  x: function (display, data) {\n\
    var width = strokeWidth(display);\n\
    if (data.stop.isEndPoint) {\n\
      width *= data.stop.renderData.length;\n\
    }\n\
\n\
    return Math.sqrt(width * width * 2) * data.stop.labelPosition + 'px';\n\
  },\n\
  y: function (display, data) {\n\
    return fontSize(display, data)  / 2 * -data.stop.labelPosition + 'px';\n\
  },\n\
  'text-transform': function (display, data) {\n\
    if (data.stop.isEndPoint) {\n\
      return 'uppercase';\n\
    } else {\n\
      return 'capitalize';\n\
    }\n\
  }\n\
};\n\
\n\
/**\n\
 * All patterns\n\
 */\n\
\n\
exports.patterns = {\n\
  stroke: function (display, data) {\n\
    if (data.route.route_color) return '#' + data.route.route_color;\n\
    return '#2EB1E6';\n\
  },\n\
  'stroke-dasharray': function (display, data) {\n\
    if (data.frequency.average > 12) return false;\n\
    if (data.frequency.average > 6) return '12px, 12px';\n\
    return '12px, 2px';\n\
  },\n\
  'stroke-width': function (display) {\n\
    return pixels(display.zoom.scale(), 5, 12, 19) + 'px';\n\
  },\n\
  fill: function (display, data, index) {\n\
    return 'none';\n\
  }\n\
};\n\
//@ sourceURL=conveyal-transitive.js/lib/styler/styles.js"
));
require.register("conveyal-transitive.js/lib/display.js", Function("exports, require, module",
"\n\
/**\n\
 * Dependencies\n\
 */\n\
\n\
var d3 = require('d3');\n\
\n\
/**\n\
 * Expose `Display`\n\
 */\n\
\n\
module.exports = Display;\n\
\n\
/**\n\
 *  The D3-based SVG display.\n\
 */\n\
\n\
function Display(el, zoom) {\n\
  // set up the pan/zoom behavior\n\
  this.zoom = zoom || d3.behavior.zoom()\n\
    .scaleExtent([ 0.25, 4 ]);\n\
\n\
  // set up the svg display\n\
  this.svg = d3.select(el)\n\
    .append('svg')\n\
    .append('g');\n\
\n\
  // call the zoom behavior\n\
  this.svg.call(this.zoom);\n\
\n\
  // append an overlay to capture pan/zoom events on entire viewport\n\
  this.svg.append('rect')\n\
    .style('fill', 'none')\n\
    .style('pointer-events', 'all');\n\
}\n\
\n\
/**\n\
 * Empty the display\n\
 */\n\
\n\
Display.prototype.empty = function() {\n\
  this.svg.selectAll(':not(rect)').remove();\n\
};\n\
\n\
/**\n\
 * Set the scale\n\
 */\n\
\n\
Display.prototype.setScale = function(height, width, graph) {\n\
  setScales(this, height, width, graph);\n\
\n\
  this.xScale.range([ 0, width ]);\n\
  this.yScale.range([ height, 0 ]);\n\
\n\
  this.zoom\n\
    .x(this.xScale)\n\
    .y(this.yScale);\n\
\n\
  this.svg\n\
    .attr('width', width)\n\
    .attr('height', height);\n\
\n\
  this.svg.select('rect')\n\
    .attr('width', width)\n\
    .attr('height', height);\n\
};\n\
\n\
/**\n\
 * Initialize the x/y coordinate space domain to fit the graph.\n\
 */\n\
\n\
function setScales(display, height, width, graph) {\n\
  var minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE;\n\
  var minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;\n\
\n\
  graph.vertices.forEach(function(vertex) {\n\
    minX = Math.min(minX, vertex.x);\n\
    maxX = Math.max(maxX, vertex.x);\n\
    minY = Math.min(minY, vertex.y);\n\
    maxY = Math.max(maxY, vertex.y);\n\
  });\n\
\n\
  var xRange = maxX - minX, yRange = maxY - minY;\n\
  var displayAspect = width / height;\n\
  var graphAspect = xRange / (yRange === 0 ? Number.MIN_VALUE : yRange);\n\
\n\
  var paddingFactor = 0.2, padding;\n\
  var dispX1, dispX2, dispY1, dispY2;\n\
\n\
  if (displayAspect > graphAspect) { // y-axis is dominant\n\
    padding = paddingFactor * yRange;\n\
    dispY1 = minY - padding;\n\
    dispY2 = maxY + padding;\n\
    var dispXRange = (yRange + 2 * padding) * displayAspect;\n\
    var xMidpoint = (maxX + minX) / 2;\n\
    dispX1 = xMidpoint - dispXRange / 2;\n\
    dispX2 = xMidpoint + dispXRange / 2;\n\
  } else { // x-axis dominant\n\
    padding = paddingFactor * xRange;\n\
    dispX1 = minX - padding;\n\
    dispX2 = maxX + padding;\n\
    var dispYRange = (xRange + 2 * padding) / displayAspect;\n\
    var yMidpoint = (maxY + minY) / 2;\n\
    dispY1 = yMidpoint - dispYRange / 2;\n\
    dispY2 = yMidpoint + dispYRange / 2;\n\
  }\n\
\n\
  // set up the scales\n\
  display.xScale = d3.scale.linear()\n\
    .domain([ dispX1, dispX2 ]);\n\
\n\
  display.yScale = d3.scale.linear()\n\
    .domain([ dispY1, dispY2 ]);\n\
}//@ sourceURL=conveyal-transitive.js/lib/display.js"
));
require.register("conveyal-transitive.js/lib/pattern.js", Function("exports, require, module",
"\n\
/**\n\
 * Dependencies\n\
 */\n\
\n\
var d3 = require('d3');\n\
\n\
/**\n\
 * Expose `Pattern`\n\
 */\n\
\n\
module.exports = Pattern;\n\
\n\
/**\n\
 * A Route Pattern -- a unique sequence of stops\n\
 *\n\
 * @param {Object} pattern data\n\
 */\n\
\n\
function Pattern(data) {\n\
  for (var key in data) {\n\
    if (key === 'stops') continue;\n\
    this[key] = data[key];\n\
  }\n\
\n\
  this.stops = [];\n\
\n\
  // The pattern as an ordered sequence of edges in the graph w/ associated metadata.\n\
  // Array of objects containing the following fields:\n\
  //  - edge : the Edge object\n\
  //  - offset : the offset for rendering, expressed as a factor of the line width and relative to the 'forward' direction of the pattern\n\
  this.graphEdges = [];\n\
\n\
  // temporarily hardcoding the line width; need to get this from the styler\n\
  this.lineWidth = 10;\n\
}\n\
\n\
/**\n\
 * addEdge: add a new edge to the end of this pattern's edge list\n\
 */\n\
\n\
Pattern.prototype.addEdge = function(edge) {\n\
  this.graphEdges.push({\n\
    edge: edge,\n\
    offset: null\n\
  });\n\
};\n\
\n\
/**\n\
 * insertEdge: insert an edge into this patterns edge list at a specified index\n\
 */\n\
\n\
Pattern.prototype.insertEdge = function(index, edge) {\n\
  this.graphEdges.splice(index, 0, {\n\
    edge: edge,\n\
    offset: null\n\
  });\n\
};\n\
\n\
/**\n\
 * setEdgeOffset: applies a specified offset to a specified edge in the pattern\n\
 */\n\
\n\
Pattern.prototype.setEdgeOffset = function(edge, offset, bundleIndex, extend) {\n\
  this.graphEdges.forEach(function(edgeInfo, i) {\n\
    if(edgeInfo.edge === edge && edgeInfo.offset === null) {\n\
      edgeInfo.offset = offset;\n\
      edgeInfo.bundleIndex = bundleIndex;\n\
      //console.log('- set offset: '+offset);\n\
      if(extend) this.extend1DEdgeOffset(i);\n\
    }\n\
  }, this);\n\
};\n\
\n\
/**\n\
 * extend1DEdgeOffset\n\
 */\n\
\n\
Pattern.prototype.extend1DEdgeOffset = function(edgeIndex) {\n\
  var offset = this.graphEdges[edgeIndex].offset;\n\
  var bundleIndex = this.graphEdges[edgeIndex].bundleIndex;\n\
  var edgeInfo;\n\
  for(var i = edgeIndex; i < this.graphEdges.length; i++) {\n\
    edgeInfo = this.graphEdges[i];\n\
    if(edgeInfo.edge.fromVertex.y !== edgeInfo.edge.toVertex.y) break;\n\
    if(edgeInfo.offset === null) {\n\
      edgeInfo.offset = offset;\n\
      edgeInfo.bundleIndex = bundleIndex;\n\
    }\n\
  }\n\
  for(i = edgeIndex; i >= 0; i--) {\n\
    edgeInfo = this.graphEdges[i];\n\
    if(edgeInfo.edge.fromVertex.y !== edgeInfo.edge.toVertex.y) break;\n\
    if(edgeInfo.offset === null) {\n\
      edgeInfo.offset = offset;\n\
      edgeInfo.bundleIndex = bundleIndex;\n\
    }\n\
  }\n\
};\n\
\n\
/**\n\
 * Draw\n\
 */\n\
\n\
Pattern.prototype.draw = function(display, capExtension) {\n\
  var stops = this.stops;\n\
\n\
  // add the line to the pattern\n\
  this.line = d3.svg.line() // the line translation function\n\
    .x(function (stopInfo, i) {\n\
      var vx = stopInfo.x, x;\n\
\n\
      // if first/last element, extend the line slightly\n\
      var edgeIndex = i === 0\n\
        ? 0\n\
        : i - 1;\n\
\n\
      if (i === 0) {\n\
        x = display.xScale(vx)\n\
          + capExtension * stopInfo.outEdge.vector.x;\n\
      } else if (i === stops.length-1) {\n\
        x = display.xScale(vx)\n\
          - capExtension * stopInfo.inEdge.vector.x;\n\
      } else {\n\
        x = display.xScale(vx);\n\
      }\n\
\n\
      if (stopInfo.offsetX) {\n\
        x += stopInfo.offsetX;\n\
      }\n\
\n\
      return x;\n\
    })\n\
    .y(function (stopInfo, i) {\n\
      var vy = stopInfo.y, y;\n\
\n\
      var edgeIndex = (i === 0) ? 0 : i - 1;\n\
\n\
      if (i === 0) {\n\
        y = display.yScale(vy)\n\
          - capExtension * stopInfo.outEdge.vector.y;\n\
      } else if (i === stops.length-1) {\n\
        y = display.yScale(vy)\n\
          + capExtension * stopInfo.inEdge.vector.y;\n\
      } else {\n\
        y = display.yScale(vy);\n\
      }\n\
\n\
      if (stopInfo.offsetY) {\n\
        y -= stopInfo.offsetY;\n\
      }\n\
\n\
      return y;\n\
    })\n\
    .interpolate('linear');\n\
\n\
  this.lineGraph = display.svg.append('path')\n\
    .attr('id', 'transitive-pattern-' + this.pattern_id)\n\
    .attr('class', 'transitive-line')\n\
    .data([ this ]);\n\
};\n\
\n\
/**\n\
 * Refresh\n\
 */\n\
\n\
Pattern.prototype.refresh = function(display, styler) {\n\
  // compute the line width\n\
  var lw = styler.patterns['stroke-width'](display, this);\n\
  this.lineWidth = parseFloat(lw.substring(0, lw.length - 2), 10) - 2;\n\
\n\
  // update the line and stop groups\n\
  this.lineGraph.attr('d', this.line(this.renderData));\n\
};\n\
\n\
/**\n\
 * Returns an array of \"stop info\" objects, each consisting of the stop x/y\n\
 * coordinates in the Display coordinate space, and a reference to the original\n\
 * Stop instance\n\
 */\n\
\n\
Pattern.prototype.refreshRenderData = function() {\n\
  this.renderData = [];\n\
  this.graphEdges.forEach(function (edgeInfo, i) {\n\
\n\
    var edge = edgeInfo.edge;\n\
\n\
    var nextEdgeInfo = i < this.graphEdges.length - 1\n\
      ? this.graphEdges[i + 1]\n\
      : null;\n\
\n\
    var stopInfo;\n\
\n\
    // the \"from\" vertex stop for this edge (first edge only)\n\
    if (i === 0) {\n\
      stopInfo = {\n\
        pattern: this,\n\
        x: edge.fromVertex.x,\n\
        y: edge.fromVertex.y,\n\
        stop: edge.fromVertex.stop,\n\
        inEdge: null,\n\
        outEdge: edge\n\
      };\n\
\n\
      stopInfo.offsetX = edgeInfo.offset\n\
        ? edge.rightVector.x * this.lineWidth * edgeInfo.offset\n\
        : 0;\n\
\n\
      stopInfo.offsetY = edgeInfo.offset\n\
        ? edge.rightVector.y * this.lineWidth * edgeInfo.offset\n\
        : 0;\n\
\n\
      this.renderData.push(stopInfo);\n\
      edge.fromVertex.stop.addRenderData(stopInfo);\n\
    }\n\
\n\
    // the internal stops for this edge\n\
    edge.stopArray.forEach(function (stop, i) {\n\
      stopInfo = edge.pointAlongEdge((i + 1) / (edge.stopArray.length + 1));\n\
      stopInfo.pattern = this;\n\
      stopInfo.stop = stop;\n\
      stopInfo.inEdge = stopInfo.outEdge = edge;\n\
      if (edgeInfo.offset) {\n\
        stopInfo.offsetX = edge.rightVector.x * this.lineWidth * edgeInfo.offset;\n\
        stopInfo.offsetY = edge.rightVector.y * this.lineWidth * edgeInfo.offset;\n\
      } else {\n\
        stopInfo.offsetX = stopInfo.offsetY = 0;\n\
      }\n\
      if (edgeInfo.bundleIndex === 0) stopInfo.showLabel = true;\n\
      this.renderData.push(stopInfo);\n\
      stop.addRenderData(stopInfo);\n\
    }, this);\n\
\n\
    // the \"to\" vertex stop for this edge. handles the 'corner' case between adjacent edges\n\
    stopInfo = this.constructCornerStopInfo(edgeInfo, edge.toVertex, nextEdgeInfo);\n\
    this.renderData.push(stopInfo);\n\
    edge.toVertex.stop.addRenderData(stopInfo);\n\
\n\
  }, this);\n\
};\n\
\n\
\n\
Pattern.prototype.constructCornerStopInfo = function(edgeInfo1, vertex, edgeInfo2) {\n\
  var edge1 = edgeInfo1 ? edgeInfo1.edge : null;\n\
  var edge2 = edgeInfo2 ? edgeInfo2.edge : null;\n\
\n\
  var stopInfo = {\n\
    pattern: this,\n\
    x: vertex.x,\n\
    y: vertex.y,\n\
    stop: vertex.stop,\n\
    inEdge: edge1,\n\
    outEdge: edge2\n\
  };\n\
\n\
  var offset = null;\n\
  if(edgeInfo1 && edgeInfo1.offset) offset = edgeInfo1.offset;\n\
  if(edgeInfo2 && edgeInfo2.offset) offset = edgeInfo2.offset;\n\
\n\
  if(offset === null) {\n\
    stopInfo.offsetX = stopInfo.offsetY = 0;\n\
    return stopInfo;\n\
  }\n\
\n\
  if (edge2\n\
    && edge2.rightVector.x !== edge1.rightVector.x\n\
    && edge2.rightVector.y !== edge1.rightVector.y) {\n\
\n\
    var added = {\n\
      x: edge2.rightVector.x + edge1.rightVector.x,\n\
      y: edge2.rightVector.y + edge1.rightVector.y,\n\
    };\n\
\n\
    var len = Math.sqrt(added.x * added.x + added.y * added.y);\n\
    var normalized = { x : added.x / len, y : added.y / len };\n\
\n\
    var opp = Math.sqrt(\n\
      Math.pow(edge2.rightVector.x - edge1.rightVector.x, 2)\n\
      + Math.pow(edge2.rightVector.y - edge1.rightVector.y, 2)\n\
      ) / 2;\n\
\n\
    var l = 1 / Math.sqrt(1 - opp * opp); // sqrt(1-x*x) = sin(acos(x))\n\
\n\
    stopInfo.offsetX = normalized.x * this.lineWidth * offset * l;\n\
    stopInfo.offsetY = normalized.y * this.lineWidth * offset * l;\n\
  } else {\n\
    stopInfo.offsetX = edge1.rightVector.x * this.lineWidth * offset;\n\
    stopInfo.offsetY = edge1.rightVector.y * this.lineWidth * offset;\n\
  }\n\
\n\
  //stopInfo.showLabel = true;\n\
  return stopInfo;\n\
};\n\
\n\
\n\
/**\n\
 * Get graph vertices\n\
 */\n\
\n\
Pattern.prototype.getGraphVertices = function() {\n\
  var vertices = [];\n\
  this.graphEdges.forEach(function (edge, i) {\n\
    if (i === 0) {\n\
      vertices.push(edge.fromVertex);\n\
    }\n\
    vertices.push(edge.toVertex);\n\
  });\n\
  return vertices;\n\
};\n\
\n\
Pattern.prototype.getEdgeIndex = function(edge) {\n\
  for(var i = 0; i < this.graphEdges.length; i++) {\n\
    if(this.graphEdges[i].edge === edge) return i;\n\
  }\n\
  return -1;\n\
};\n\
\n\
Pattern.prototype.getAdjacentEdge = function(edge, vertex) {\n\
\n\
  // ensure that edge/vertex pair is valid\n\
  if(edge.toVertex !== vertex && edge.fromVertex !== vertex) return null;\n\
\n\
  var index = this.getEdgeIndex(edge);\n\
  if(index === -1) return null;\n\
\n\
  // check previous edge\n\
  if(index > 0) {\n\
    var prevEdge = this.graphEdges[index-1].edge;\n\
    if(prevEdge.toVertex === vertex || prevEdge.fromVertex === vertex) return prevEdge;\n\
  }\n\
\n\
  // check next edge\n\
  if(index < this.graphEdges.length-1) {\n\
    var nextEdge = this.graphEdges[index+1].edge;\n\
    if(nextEdge.toVertex === vertex || nextEdge.fromVertex === vertex) return nextEdge;\n\
  }\n\
\n\
  return null;\n\
};\n\
\n\
\n\
Pattern.prototype.vertexArray = function() {\n\
\n\
  var vertex = this.startVertex();\n\
  var array = [ vertex ];\n\
\n\
  this.graphEdges.forEach(function(edgeInfo) {\n\
    vertex = edgeInfo.edge.oppositeVertex(vertex);\n\
    array.push(vertex);\n\
  });\n\
\n\
  return array;\n\
};\n\
\n\
Pattern.prototype.startVertex = function() {\n\
  if(!this.graphEdges || this.graphEdges.length === 0) return null;\n\
  if(this.graphEdges.length === 1) return this.graphEdges[0].fromVertex;\n\
  var first = this.graphEdges[0].edge, next = this.graphEdges[1].edge;\n\
  if(first.toVertex == next.toVertex || first.toVertex == next.fromVertex) return first.fromVertex;\n\
  if(first.fromVertex == next.toVertex || first.fromVertex == next.fromVertex) return first.toVertex;\n\
  return null;\n\
};\n\
\n\
Pattern.prototype.endVertex = function() {\n\
  if(!this.graphEdges || this.graphEdges.length === 0) return null;\n\
  if(this.graphEdges.length === 1) return this.graphEdges[0].toVertex;\n\
  var last = this.graphEdges[this.graphEdges.length-1].edge, prev = this.graphEdges[this.graphEdges.length-2].edge;\n\
  if(last.toVertex == prev.toVertex || last.toVertex == prev.fromVertex) return last.fromVertex;\n\
  if(last.fromVertex == prev.toVertex || last.fromVertex == prev.fromVertex) return last.toVertex;\n\
  return null;\n\
};\n\
\n\
Pattern.prototype.toString = function() {\n\
  return this.startVertex().stop.stop_name + ' to ' + this.endVertex().stop.stop_name;\n\
};//@ sourceURL=conveyal-transitive.js/lib/pattern.js"
));
require.register("conveyal-transitive.js/lib/route.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Route`\n\
 */\n\
\n\
module.exports = Route;\n\
\n\
/**\n\
 * A transit Route, as defined in the input data.\n\
 * Routes contain one or more Patterns.\n\
 *\n\
 * @param {Object}\n\
 */\n\
\n\
function Route(data) {\n\
  for (var key in data) {\n\
    if (key === 'patterns') continue;\n\
    this[key] = data[key];\n\
  }\n\
\n\
  this.patterns = [];\n\
}\n\
\n\
/**\n\
 * Add Pattern\n\
 *\n\
 * @param {Pattern}\n\
 */\n\
\n\
Route.prototype.addPattern = function(pattern) {\n\
  this.patterns.push(pattern);\n\
  pattern.route = this;\n\
};\n\
//@ sourceURL=conveyal-transitive.js/lib/route.js"
));
require.register("conveyal-transitive.js/lib/stop.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Stop`\n\
 */\n\
\n\
module.exports = Stop;\n\
\n\
/**\n\
 * A transit `Stop`, as defined in the input data. `Stop`s are shared between\n\
 * `Pattern`s.\n\
 *\n\
 * @param {Object} data\n\
 */\n\
\n\
function Stop(data) {\n\
  for (var key in data) {\n\
    if (key === 'patterns') continue;\n\
    this[key] = data[key];\n\
  }\n\
\n\
  this.patterns = [];\n\
  this.renderData = [];\n\
\n\
  this.labelAnchor = null;\n\
  this.labelAngle = -45;\n\
  this.labelOffsetX = function() { return  0; };\n\
  this.labelOffsetY = function() { return  0; };\n\
\n\
  // flag indicating whether this stop is the endpoint of a pattern\n\
  this.isEndPoint = false;\n\
\n\
  // flag indicating whether this stop is a point of convergence/divergence between 2+ patterns\n\
  this.isBranchPoint = false;\n\
}\n\
\n\
/**\n\
 * Get id\n\
 */\n\
\n\
Stop.prototype.getId = function() {\n\
  return this.stop_id;\n\
};\n\
\n\
/**\n\
 * Add render data\n\
 *\n\
 * @param {Object} stopInfo\n\
 */\n\
\n\
Stop.prototype.addRenderData = function(stopInfo) {\n\
  this.renderData.push(stopInfo);\n\
\n\
  // check if this is the 'topmost' stopInfo item received (based on offsets) for labeling purposes\n\
  if (!this.topAnchor) {\n\
    this.topAnchor = stopInfo;\n\
  } else if (stopInfo.offsetY > this.topAnchor.offsetY) {\n\
    this.topAnchor = stopInfo;\n\
  }\n\
\n\
  // check if this is the 'bottommost' stopInfo iterm received\n\
  if (!this.bottomAnchor) {\n\
    this.bottomAnchor = stopInfo;\n\
  } else if (stopInfo.offsetY < this.bottomAnchor.offsetY) {\n\
    this.bottomAnchor = stopInfo;\n\
  }\n\
};\n\
\n\
/**\n\
 * Draw a stop\n\
 *\n\
 * @param {Display} display\n\
 */\n\
\n\
Stop.prototype.draw = function(display) {\n\
  if (this.renderData.length === 0) return;\n\
\n\
  var textAnchor = 'start';\n\
  if (this.labelPosition > 0) { // the 'above' position\n\
    this.labelAnchor = this.topAnchor;\n\
  } else { // the 'below' position\n\
    textAnchor = 'end';\n\
    this.labelAnchor = this.bottomAnchor;\n\
  }\n\
\n\
  // set up the main svg group for this stop\n\
  this.svgGroup = display.svg.append('g')\n\
    .attr('id', 'transitive-stop-' + this.stop_id);\n\
\n\
  // set up the pattern-level markers\n\
  this.patternMarkers = this.svgGroup.selectAll('circle')\n\
    .data(this.renderData)\n\
    .enter()\n\
    .append('circle')\n\
    .attr('class', 'transitive-stop-circle');\n\
\n\
  // set up a group for the stop-level labels\n\
  this.labels = this.svgGroup\n\
    .append('g');\n\
\n\
  // create the main stop label\n\
  this.mainLabel = this.labels.append('text')\n\
    .data(this.renderData)\n\
    .attr('id', 'transitive-stop-label-' + this.stop_id)\n\
    .text(this.stop_name.replace('METRO STATION', ''))\n\
    .attr('class', 'transitive-stop-label')\n\
    .attr('text-anchor', textAnchor)\n\
    .attr('transform', (function (d, i) {\n\
      return 'rotate(' + this.labelAngle + ', 0, 0)';\n\
    }).bind(this));\n\
};\n\
\n\
/**\n\
 * Refresh the stop\n\
 *\n\
 * @param {Display} display\n\
 */\n\
\n\
Stop.prototype.refresh = function(display) {\n\
  if (this.renderData.length === 0) return;\n\
\n\
  var cx, cy;\n\
  // refresh the pattern-level markers\n\
  this.patternMarkers.data(this.renderData);\n\
  this.patternMarkers.attr('transform', function (d, i) {\n\
    cx = d.x;\n\
    cy = d.y;\n\
    var x = display.xScale(d.x) + d.offsetX;\n\
    var y = display.yScale(d.y) - d.offsetY;\n\
    return 'translate(' + x +', ' + y +')';\n\
  });\n\
\n\
\n\
  //console.log(this.labelAnchor);\n\
  /* refresh the stop-level labels */\n\
  this.labels.attr('transform', (function (d, i) {\n\
    var la = this.labelAnchor;\n\
    var x = display.xScale(cx) + la.offsetX;\n\
    var y = display.yScale(cy) - la.offsetY;\n\
    this.lastX = la.x;\n\
    this.lastY = la.y;\n\
    return 'translate(' + x +',' + y +')';\n\
  }).bind(this));\n\
};\n\
//@ sourceURL=conveyal-transitive.js/lib/stop.js"
));
require.register("conveyal-transitive.js/lib/transitive.js", Function("exports, require, module",
"\n\
/**\n\
 * Dependencies\n\
 */\n\
\n\
var d3 = require('d3');\n\
var debug = require('debug')('transitive');\n\
var Display = require('./display');\n\
var Emitter = require('emitter');\n\
var Graph = require('./graph');\n\
var Pattern = require('./pattern');\n\
var Route = require('./route');\n\
var Stop = require('./stop');\n\
var Styler = require('./styler');\n\
var toFunction = require('to-function');\n\
\n\
/**\n\
 * Expose `Transitive`\n\
 */\n\
\n\
module.exports = Transitive;\n\
\n\
/**\n\
 * Expose `d3`\n\
 */\n\
\n\
module.exports.d3 = Transitive.prototype.d3 = d3;\n\
\n\
/**\n\
 * Expose `version`\n\
 */\n\
\n\
module.exports.version = '0.0.0';\n\
\n\
/**\n\
 * Create a new instance of `Transitive`\n\
 *\n\
 * @param {Element} element to render to\n\
 * @param {Object} data to render\n\
 * @param {Object} styles to apply\n\
 * @param {Object} options object\n\
 */\n\
\n\
function Transitive(el, data, styles, options) {\n\
  if (!(this instanceof Transitive)) {\n\
    return new Transitive(el, data, styles, options);\n\
  }\n\
\n\
  this.clearFilters();\n\
  this.data = data;\n\
  this.setElement(el);\n\
  this.style = new Styler(styles);\n\
}\n\
\n\
/**\n\
 * Mixin `Emitter`\n\
 */\n\
\n\
Emitter(Transitive.prototype);\n\
\n\
/**\n\
 * Add a data filter\n\
 *\n\
 * @param {String} type\n\
 * @param {String|Object|Function} filter, gets passed to `to-function`\n\
 */\n\
\n\
Transitive.prototype.addFilter =\n\
Transitive.prototype.filter = function(type, filter) {\n\
  if (!this._filter[type]) this._filter[type] = [];\n\
  this._filter[type].push(toFunction(filter));\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Clear all data filters\n\
 *\n\
 * @param {String} filter type\n\
 */\n\
\n\
Transitive.prototype.clearFilters = function(type) {\n\
  if (type) {\n\
    this._filter[type] = [];\n\
  } else {\n\
    this._filter = {\n\
      patterns: [],\n\
      routes: [],\n\
      stops: []\n\
    };\n\
  }\n\
\n\
  this.emit('clear filters', this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Load\n\
 *\n\
 * @param {Object} data\n\
 */\n\
\n\
Transitive.prototype.load = function(data) {\n\
  debug('load', data);\n\
\n\
  this.graph = new Graph();\n\
\n\
  // Generate the stop objects\n\
  this.stops = {};\n\
  applyFilters(data.stops, this._filter.stops).forEach(function (data) {\n\
    this.stops[data.stop_id] = new Stop(data);\n\
  }, this);\n\
\n\
  // A list of stops that will become vertices in the network graph. This\n\
  // includes all stops that serve as a pattern endpoint and/or a\n\
  // convergence/divergence point between patterns\n\
  var vertexStops = {};\n\
\n\
  // object maps stop ids to arrays of unique stop_ids reachable from that stop\n\
  var adjacentStops = {};\n\
\n\
  // Generate the routes & patterns\n\
  this.routes = {};\n\
  this.patterns = {};\n\
\n\
  applyFilters(data.routes, this._filter.routes).forEach(function (routeData) {\n\
    var route = this.routes[routeData.route_id] = new Route(routeData);\n\
    // iterate through the Route's constituent Patterns\n\
    applyFilters(routeData.patterns, this._filter.patterns).forEach(function (patternData, i) {\n\
      // Create the Pattern object\n\
      var pattern = this.patterns[patternData.pattern_id] = new Pattern(patternData);\n\
\n\
      // add to the route\n\
      route.addPattern(pattern);\n\
\n\
      // iterate through this pattern's stops, associating stops/patterns with\n\
      // each other and initializing the adjacentStops table\n\
      var previousStop = null;\n\
      patternData.stops.forEach(function (stopInfo) {\n\
        var stop = this.stops[stopInfo.stop_id];\n\
\n\
        pattern.stops.push(stop);\n\
        stop.patterns.push(pattern);\n\
\n\
        // called for each pair of adjacent stops in pattern\n\
        if (previousStop) {\n\
          addStopAdjacency(adjacentStops, stop.getId(), previousStop.getId());\n\
          addStopAdjacency(adjacentStops, previousStop.getId(), stop.getId());\n\
        }\n\
\n\
        previousStop = stop;\n\
      }, this);\n\
\n\
      // add the start and end stops to the vertexStops collection\n\
      var firstStop = pattern.stops[0];\n\
      if(!(firstStop.getId() in vertexStops)) {\n\
        vertexStops[firstStop.getId()] = firstStop;\n\
        firstStop.isEndPoint = true;\n\
      }\n\
\n\
      var lastStop = pattern.stops[pattern.stops.length-1];\n\
      if(!(lastStop.getId() in vertexStops)) {\n\
        vertexStops[lastStop.getId()] = lastStop;\n\
        lastStop.isEndPoint = true;\n\
      }\n\
    }, this);\n\
  }, this);\n\
\n\
  // determine the convergence/divergence vertex stops by looking for stops w/ >2 adjacent stops\n\
  for (var stopId in adjacentStops) {\n\
    if (adjacentStops[stopId].length > 2) {\n\
      vertexStops[stopId] = this.stops[stopId];\n\
      this.stops[stopId].isBranchPoint = true;\n\
    }\n\
  }\n\
\n\
  // populate the vertices in the graph object\n\
  for (stopId in vertexStops) {\n\
    var stop = vertexStops[stopId];\n\
    var vertex = this.graph.addVertex(stop, 0, 0);\n\
    stop.graphVertex = vertex;\n\
  }\n\
\n\
  populateGraphEdges(this.patterns, this.graph);\n\
\n\
  this.graph.convertTo1D();\n\
  //this.placeStopLabels();\n\
  this.setScale();\n\
\n\
  this.emit('load', this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Render\n\
 */\n\
\n\
Transitive.prototype.render = function() {\n\
  this.load(this.data);\n\
\n\
  var display = this.display;\n\
  var offsetLeft = this.el.offsetLeft;\n\
  var offsetTop = this.el.offsetTop;\n\
\n\
  // remove all old svg elements\n\
  this.display.empty();\n\
\n\
  // initialize the pattern svg elements\n\
  for (var key in this.patterns) {\n\
    var pattern = this.patterns[key];\n\
    pattern.refreshRenderData();\n\
    pattern.draw(this.display, 10);\n\
  }\n\
\n\
  // Draw the stop svg elements\n\
  for (key in this.stops) this.stops[key].draw(this.display);\n\
\n\
  this.refresh();\n\
\n\
  this.emit('render', this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Render to\n\
 *\n\
 * @param {Element} el\n\
 */\n\
\n\
Transitive.prototype.renderTo = function(el) {\n\
  this.setElement(el);\n\
  this.render();\n\
\n\
  this.emit('render to', this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Refresh\n\
 */\n\
\n\
Transitive.prototype.refresh = function() {\n\
\n\
  // clear the stop render data\n\
  for (var key in this.stops) this.stops[key].renderData = [];\n\
\n\
  // refresh the patterns\n\
  for (key in this.patterns) {\n\
    var pattern = this.patterns[key];\n\
    pattern.refreshRenderData(); // also updates the stop-level renderData\n\
\n\
    this.style.renderPattern(this.display, pattern.lineGraph);\n\
    pattern.refresh(this.display, this.style);\n\
  }\n\
\n\
  // refresh the stops\n\
  for (key in this.stops) {\n\
    var stop = this.stops[key];\n\
    if (!stop.svgGroup) continue; // check if this stop is not currently rendered\n\
\n\
    this.style.renderStop(this.display, stop);\n\
    stop.refresh(this.display);\n\
  }\n\
\n\
  this.emit('refresh', this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set element\n\
 */\n\
\n\
Transitive.prototype.setElement = function(el) {\n\
  if (this.el) this.el.innerHTML = null;\n\
\n\
  this.el = el;\n\
\n\
  this.display = new Display(el);\n\
  this.display.zoom.on('zoom', this.refresh.bind(this));\n\
\n\
  this.setScale();\n\
\n\
  this.emit('set element', this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set scale\n\
 */\n\
\n\
Transitive.prototype.setScale = function() {\n\
  if (this.display && this.el && this.graph) {\n\
    this.display.setScale(this.el.clientHeight, this.el.clientWidth,\n\
      this.graph);\n\
  }\n\
\n\
  this.emit('set scale', this);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Apply an array of filters to an array of data\n\
 *\n\
 * @param {Array} data\n\
 * @param {Array} filters\n\
 */\n\
\n\
function applyFilters(data, filters) {\n\
  filters.forEach(function (filter) {\n\
    data = data.filter(filter);\n\
  });\n\
\n\
  return data;\n\
}\n\
\n\
/**\n\
 * Helper function for stopAjacency table\n\
 *\n\
 * @param {Stop} adjacent stops list\n\
 * @param {Stop} stopA\n\
 * @param {Stop} stopB\n\
 */\n\
\n\
function addStopAdjacency(stops, stopIdA, stopIdB) {\n\
  if (!stops[stopIdA]) stops[stopIdA] = [];\n\
  if (stops[stopIdA].indexOf(stopIdB) === -1) stops[stopIdA].push(stopIdB);\n\
}\n\
\n\
/**\n\
 * Populate the graph edges\n\
 *\n\
 * @param {Object} patterns\n\
 * @param {Graph} graph\n\
 */\n\
\n\
function populateGraphEdges(patterns, graph) {\n\
  // vertex associated with the last vertex stop we passed in this sequence\n\
  var lastVertex = null;\n\
\n\
  // collection of 'internal' (i.e. non-vertex) stops passed\n\
  // since the last vertex stop\n\
  var internalStops = [];\n\
\n\
  for (var id in patterns) {\n\
    var pattern = patterns[id];\n\
\n\
    lastVertex = null;\n\
\n\
    for (var stopId in pattern.stops) {\n\
      var stop = pattern.stops[stopId];\n\
      if (stop.graphVertex) { // this is a vertex stop\n\
        if (lastVertex !== null) {\n\
          var edge = graph.getEquivalentEdge(internalStops, lastVertex,\n\
            stop.graphVertex);\n\
\n\
          if (!edge) {\n\
            edge = graph.addEdge(internalStops, lastVertex, stop.graphVertex);\n\
          }\n\
\n\
          pattern.addEdge(edge);\n\
          edge.addPattern(pattern);\n\
        }\n\
\n\
        lastVertex = stop.graphVertex;\n\
        internalStops = [];\n\
      } else { // this is an internal stop\n\
        internalStops.push(stop);\n\
      }\n\
    }\n\
  }\n\
}\n\
//@ sourceURL=conveyal-transitive.js/lib/transitive.js"
));
require.register("component-matches-selector/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var query = require('query');\n\
\n\
/**\n\
 * Element prototype.\n\
 */\n\
\n\
var proto = Element.prototype;\n\
\n\
/**\n\
 * Vendor function.\n\
 */\n\
\n\
var vendor = proto.matches\n\
  || proto.webkitMatchesSelector\n\
  || proto.mozMatchesSelector\n\
  || proto.msMatchesSelector\n\
  || proto.oMatchesSelector;\n\
\n\
/**\n\
 * Expose `match()`.\n\
 */\n\
\n\
module.exports = match;\n\
\n\
/**\n\
 * Match `el` to `selector`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
function match(el, selector) {\n\
  if (vendor) return vendor.call(el, selector);\n\
  var nodes = query.all(selector, el.parentNode);\n\
  for (var i = 0; i < nodes.length; ++i) {\n\
    if (nodes[i] == el) return true;\n\
  }\n\
  return false;\n\
}\n\
//@ sourceURL=component-matches-selector/index.js"
));
require.register("yields-traverse/index.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies\n\
 */\n\
\n\
var matches = require('matches-selector');\n\
\n\
/**\n\
 * Traverse with the given `el`, `selector` and `len`.\n\
 *\n\
 * @param {String} type\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @param {Number} len\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(type, el, selector, len){\n\
  var el = el[type]\n\
    , n = len || 1\n\
    , ret = [];\n\
\n\
  if (!el) return ret;\n\
\n\
  do {\n\
    if (n == ret.length) break;\n\
    if (1 != el.nodeType) continue;\n\
    if (matches(el, selector)) ret.push(el);\n\
    if (!selector) ret.push(el);\n\
  } while (el = el[type]);\n\
\n\
  return ret;\n\
}\n\
//@ sourceURL=yields-traverse/index.js"
));
require.register("ianstormtaylor-previous-sibling/index.js", Function("exports, require, module",
"\n\
var traverse = require('traverse');\n\
\n\
\n\
/**\n\
 * Expose `previousSibling`.\n\
 */\n\
\n\
module.exports = previousSibling;\n\
\n\
\n\
/**\n\
 * Get the previous sibling for an `el`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector (optional)\n\
 */\n\
\n\
function previousSibling (el, selector) {\n\
  el = traverse('previousSibling', el, selector)[0];\n\
  return el || null;\n\
}//@ sourceURL=ianstormtaylor-previous-sibling/index.js"
));
require.register("ianstormtaylor-next-sibling/index.js", Function("exports, require, module",
"\n\
var traverse = require('traverse');\n\
\n\
\n\
/**\n\
 * Expose `nextSibling`.\n\
 */\n\
\n\
module.exports = nextSibling;\n\
\n\
\n\
/**\n\
 * Get the next sibling for an `el`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector (optional)\n\
 */\n\
\n\
function nextSibling (el, selector) {\n\
  el = traverse('nextSibling', el, selector)[0];\n\
  return el || null;\n\
}//@ sourceURL=ianstormtaylor-next-sibling/index.js"
));
require.register("component-debounce/index.js", Function("exports, require, module",
"/**\n\
 * Debounces a function by the given threshold.\n\
 *\n\
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/\n\
 * @param {Function} function to wrap\n\
 * @param {Number} timeout in ms (`100`)\n\
 * @param {Boolean} whether to execute at the beginning (`false`)\n\
 * @api public\n\
 */\n\
\n\
module.exports = function debounce(func, threshold, execAsap){\n\
  var timeout;\n\
\n\
  return function debounced(){\n\
    var obj = this, args = arguments;\n\
\n\
    function delayed () {\n\
      if (!execAsap) {\n\
        func.apply(obj, args);\n\
      }\n\
      timeout = null;\n\
    }\n\
\n\
    if (timeout) {\n\
      clearTimeout(timeout);\n\
    } else if (execAsap) {\n\
      func.apply(obj, args);\n\
    }\n\
\n\
    timeout = setTimeout(delayed, threshold || 100);\n\
  };\n\
};\n\
//@ sourceURL=component-debounce/index.js"
));
require.register("component-pillbox/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Emitter = require('emitter')\n\
  , keyname = require('keyname')\n\
  , events = require('events')\n\
  , each = require('each')\n\
  , Set = require('set');\n\
\n\
/**\n\
 * Expose `Pillbox`.\n\
 */\n\
\n\
module.exports = Pillbox\n\
\n\
/**\n\
 * Initialize a `Pillbox` with the given\n\
 * `input` element and `options`.\n\
 *\n\
 * @param {Element} input\n\
 * @param {Object} options\n\
 * @api public\n\
 */\n\
\n\
function Pillbox(input, options) {\n\
  if (!(this instanceof Pillbox)) return new Pillbox(input, options);\n\
  this.options = options || {}\n\
  this.input = input;\n\
  this.tags = new Set;\n\
  this.el = document.createElement('div');\n\
  this.el.className = 'pillbox';\n\
  this.el.style = input.style;\n\
  input.parentNode.insertBefore(this.el, input);\n\
  input.parentNode.removeChild(input);\n\
  this.el.appendChild(input);\n\
  this.events = events(this.el, this);\n\
  this.bind();\n\
}\n\
\n\
/**\n\
 * Mixin emitter.\n\
 */\n\
\n\
Emitter(Pillbox.prototype);\n\
\n\
/**\n\
 * Bind internal events.\n\
 *\n\
 * @return {Pillbox}\n\
 * @api public\n\
 */\n\
\n\
Pillbox.prototype.bind = function(){\n\
  this.events.bind('click');\n\
  this.events.bind('keydown');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Unbind internal events.\n\
 *\n\
 * @return {Pillbox}\n\
 * @api public\n\
 */\n\
\n\
Pillbox.prototype.unbind = function(){\n\
  this.events.unbind();\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Handle keyup.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Pillbox.prototype.onkeydown = function(e){\n\
  switch (keyname(e.which)) {\n\
    case 'enter':\n\
      e.preventDefault();\n\
      this.add(e.target.value);\n\
      e.target.value = '';\n\
      break;\n\
    case 'space':\n\
      if (!this.options.space) return;\n\
      e.preventDefault();\n\
      this.add(e.target.value);\n\
      e.target.value = '';\n\
      break;\n\
    case 'backspace':\n\
      if ('' == e.target.value) {\n\
        this.remove(this.last());\n\
      }\n\
      break;\n\
  }\n\
};\n\
\n\
/**\n\
 * Handle click.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Pillbox.prototype.onclick = function(){\n\
  this.input.focus();\n\
};\n\
\n\
/**\n\
 * Set / Get all values.\n\
 *\n\
 * @param {Array} vals\n\
 * @return {Array|Pillbox}\n\
 * @api public\n\
 */\n\
\n\
Pillbox.prototype.values = function(vals){\n\
  var self = this;\n\
\n\
  if (0 == arguments.length) {\n\
    return this.tags.values();\n\
  }\n\
\n\
  each(vals, function(value){\n\
    self.add(value);\n\
  });\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return the last member of the set.\n\
 *\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
Pillbox.prototype.last = function(){\n\
  return this.tags.vals[this.tags.vals.length - 1];\n\
};\n\
\n\
/**\n\
 * Add `tag`.\n\
 *\n\
 * @param {String} tag\n\
 * @return {Pillbox} self\n\
 * @api public\n\
 */\n\
\n\
Pillbox.prototype.add = function(tag) {\n\
  var self = this\n\
  tag = tag.trim();\n\
\n\
  // blank\n\
  if ('' == tag) return;\n\
\n\
  // exists\n\
  if (this.tags.has(tag)) return;\n\
\n\
  // lowercase\n\
  if (this.options.lowercase) tag = tag.toLowerCase();\n\
\n\
  // add it\n\
  this.tags.add(tag);\n\
\n\
  // list item\n\
  var span = document.createElement('span');\n\
  span.setAttribute('data', tag);\n\
  span.appendChild(document.createTextNode(tag));\n\
  span.onclick = function(e) {\n\
    e.preventDefault();\n\
    self.input.focus();\n\
  };\n\
\n\
  // delete link\n\
  var del = document.createElement('a');\n\
  del.appendChild(document.createTextNode('✕'));\n\
  del.href = '#';\n\
  del.onclick = this.remove.bind(this, tag);\n\
  span.appendChild(del);\n\
\n\
  this.el.insertBefore(span, this.input);\n\
  this.emit('add', tag);\n\
\n\
  return this;\n\
}\n\
\n\
/**\n\
 * Remove `tag`.\n\
 *\n\
 * @param {String} tag\n\
 * @return {Pillbox} self\n\
 * @api public\n\
 */\n\
\n\
Pillbox.prototype.remove = function(tag) {\n\
  if (!this.tags.has(tag)) return this;\n\
  this.tags.remove(tag);\n\
\n\
  var span;\n\
  for (var i = 0; i < this.el.childNodes.length; ++i) {\n\
    span = this.el.childNodes[i];\n\
    if (tag == span.getAttribute('data')) break;\n\
  }\n\
\n\
  this.el.removeChild(span);\n\
  this.emit('remove', tag);\n\
\n\
  return this;\n\
}\n\
\n\
//@ sourceURL=component-pillbox/index.js"
));
require.register("component-keyname/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Key name map.\n\
 */\n\
\n\
var map = {\n\
  8: 'backspace',\n\
  9: 'tab',\n\
  13: 'enter',\n\
  16: 'shift',\n\
  17: 'ctrl',\n\
  18: 'alt',\n\
  20: 'capslock',\n\
  27: 'esc',\n\
  32: 'space',\n\
  33: 'pageup',\n\
  34: 'pagedown',\n\
  35: 'end',\n\
  36: 'home',\n\
  37: 'left',\n\
  38: 'up',\n\
  39: 'right',\n\
  40: 'down',\n\
  45: 'ins',\n\
  46: 'del',\n\
  91: 'meta',\n\
  93: 'meta',\n\
  224: 'meta'\n\
};\n\
\n\
/**\n\
 * Return key name for `n`.\n\
 *\n\
 * @param {Number} n\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(n){\n\
  return map[n];\n\
};//@ sourceURL=component-keyname/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"module.exports = function(arr, obj){\n\
  if (arr.indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("component-classes/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var index = require('indexof');\n\
\n\
/**\n\
 * Whitespace regexp.\n\
 */\n\
\n\
var re = /\\s+/;\n\
\n\
/**\n\
 * toString reference.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Wrap `el` in a `ClassList`.\n\
 *\n\
 * @param {Element} el\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el){\n\
  return new ClassList(el);\n\
};\n\
\n\
/**\n\
 * Initialize a new ClassList for `el`.\n\
 *\n\
 * @param {Element} el\n\
 * @api private\n\
 */\n\
\n\
function ClassList(el) {\n\
  if (!el) throw new Error('A DOM element reference is required');\n\
  this.el = el;\n\
  this.list = el.classList;\n\
}\n\
\n\
/**\n\
 * Add class `name` if not already present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.add = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.add(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (!~i) arr.push(name);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove class `name` when present, or\n\
 * pass a regular expression to remove\n\
 * any which match.\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.remove = function(name){\n\
  if ('[object RegExp]' == toString.call(name)) {\n\
    return this.removeMatching(name);\n\
  }\n\
\n\
  // classList\n\
  if (this.list) {\n\
    this.list.remove(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (~i) arr.splice(i, 1);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove all classes matching `re`.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {ClassList}\n\
 * @api private\n\
 */\n\
\n\
ClassList.prototype.removeMatching = function(re){\n\
  var arr = this.array();\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (re.test(arr[i])) {\n\
      this.remove(arr[i]);\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Toggle class `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.toggle = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.toggle(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  if (this.has(name)) {\n\
    this.remove(name);\n\
  } else {\n\
    this.add(name);\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return an array of classes.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.array = function(){\n\
  var str = this.el.className.replace(/^\\s+|\\s+$/g, '');\n\
  var arr = str.split(re);\n\
  if ('' === arr[0]) arr.shift();\n\
  return arr;\n\
};\n\
\n\
/**\n\
 * Check if class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.has =\n\
ClassList.prototype.contains = function(name){\n\
  return this.list\n\
    ? this.list.contains(name)\n\
    : !! ~index(this.array(), name);\n\
};\n\
//@ sourceURL=component-classes/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  if (el.addEventListener) {\n\
    el.addEventListener(type, fn, capture || false);\n\
  } else {\n\
    el.attachEvent('on' + type, fn);\n\
  }\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  if (el.removeEventListener) {\n\
    el.removeEventListener(type, fn, capture || false);\n\
  } else {\n\
    el.detachEvent('on' + type, fn);\n\
  }\n\
  return fn;\n\
};\n\
//@ sourceURL=component-event/index.js"
));
require.register("discore-closest/index.js", Function("exports, require, module",
"var matches = require('matches-selector')\n\
\n\
module.exports = function (element, selector, checkYoSelf, root) {\n\
  element = checkYoSelf ? {parentNode: element} : element\n\
\n\
  root = root || document\n\
\n\
  // Make sure `element !== document` and `element != null`\n\
  // otherwise we get an illegal invocation\n\
  while ((element = element.parentNode) && element !== document) {\n\
    if (matches(element, selector))\n\
      return element\n\
    // After `matches` on the edge case that\n\
    // the selector matches the root\n\
    // (when the root is not the document)\n\
    if (element === root)\n\
      return  \n\
  }\n\
}//@ sourceURL=discore-closest/index.js"
));
require.register("component-delegate/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var closest = require('closest')\n\
  , event = require('event');\n\
\n\
/**\n\
 * Delegate event `type` to `selector`\n\
 * and invoke `fn(e)`. A callback function\n\
 * is returned which may be passed to `.unbind()`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, selector, type, fn, capture){\n\
  return event.bind(el, type, function(e){\n\
    var target = e.target || e.srcElement;\n\
    e.delegateTarget = closest(target, selector, true, el);\n\
    if (e.delegateTarget) fn.call(el, e);\n\
  }, capture);\n\
};\n\
\n\
/**\n\
 * Unbind event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  event.unbind(el, type, fn, capture);\n\
};\n\
//@ sourceURL=component-delegate/index.js"
));
require.register("component-events/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var events = require('event');\n\
var delegate = require('delegate');\n\
\n\
/**\n\
 * Expose `Events`.\n\
 */\n\
\n\
module.exports = Events;\n\
\n\
/**\n\
 * Initialize an `Events` with the given\n\
 * `el` object which events will be bound to,\n\
 * and the `obj` which will receive method calls.\n\
 *\n\
 * @param {Object} el\n\
 * @param {Object} obj\n\
 * @api public\n\
 */\n\
\n\
function Events(el, obj) {\n\
  if (!(this instanceof Events)) return new Events(el, obj);\n\
  if (!el) throw new Error('element required');\n\
  if (!obj) throw new Error('object required');\n\
  this.el = el;\n\
  this.obj = obj;\n\
  this._events = {};\n\
}\n\
\n\
/**\n\
 * Subscription helper.\n\
 */\n\
\n\
Events.prototype.sub = function(event, method, cb){\n\
  this._events[event] = this._events[event] || {};\n\
  this._events[event][method] = cb;\n\
};\n\
\n\
/**\n\
 * Bind to `event` with optional `method` name.\n\
 * When `method` is undefined it becomes `event`\n\
 * with the \"on\" prefix.\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Direct event handling:\n\
 *\n\
 *    events.bind('click') // implies \"onclick\"\n\
 *    events.bind('click', 'remove')\n\
 *    events.bind('click', 'sort', 'asc')\n\
 *\n\
 *  Delegated event handling:\n\
 *\n\
 *    events.bind('click li > a')\n\
 *    events.bind('click li > a', 'remove')\n\
 *    events.bind('click a.sort-ascending', 'sort', 'asc')\n\
 *    events.bind('click a.sort-descending', 'sort', 'desc')\n\
 *\n\
 * @param {String} event\n\
 * @param {String|function} [method]\n\
 * @return {Function} callback\n\
 * @api public\n\
 */\n\
\n\
Events.prototype.bind = function(event, method){\n\
  var e = parse(event);\n\
  var el = this.el;\n\
  var obj = this.obj;\n\
  var name = e.name;\n\
  var method = method || 'on' + name;\n\
  var args = [].slice.call(arguments, 2);\n\
\n\
  // callback\n\
  function cb(){\n\
    var a = [].slice.call(arguments).concat(args);\n\
    obj[method].apply(obj, a);\n\
  }\n\
\n\
  // bind\n\
  if (e.selector) {\n\
    cb = delegate.bind(el, e.selector, name, cb);\n\
  } else {\n\
    events.bind(el, name, cb);\n\
  }\n\
\n\
  // subscription for unbinding\n\
  this.sub(name, method, cb);\n\
\n\
  return cb;\n\
};\n\
\n\
/**\n\
 * Unbind a single binding, all bindings for `event`,\n\
 * or all bindings within the manager.\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Unbind direct handlers:\n\
 *\n\
 *     events.unbind('click', 'remove')\n\
 *     events.unbind('click')\n\
 *     events.unbind()\n\
 *\n\
 * Unbind delegate handlers:\n\
 *\n\
 *     events.unbind('click', 'remove')\n\
 *     events.unbind('click')\n\
 *     events.unbind()\n\
 *\n\
 * @param {String|Function} [event]\n\
 * @param {String|Function} [method]\n\
 * @api public\n\
 */\n\
\n\
Events.prototype.unbind = function(event, method){\n\
  if (0 == arguments.length) return this.unbindAll();\n\
  if (1 == arguments.length) return this.unbindAllOf(event);\n\
\n\
  // no bindings for this event\n\
  var bindings = this._events[event];\n\
  if (!bindings) return;\n\
\n\
  // no bindings for this method\n\
  var cb = bindings[method];\n\
  if (!cb) return;\n\
\n\
  events.unbind(this.el, event, cb);\n\
};\n\
\n\
/**\n\
 * Unbind all events.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.unbindAll = function(){\n\
  for (var event in this._events) {\n\
    this.unbindAllOf(event);\n\
  }\n\
};\n\
\n\
/**\n\
 * Unbind all events for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.unbindAllOf = function(event){\n\
  var bindings = this._events[event];\n\
  if (!bindings) return;\n\
\n\
  for (var method in bindings) {\n\
    this.unbind(event, method);\n\
  }\n\
};\n\
\n\
/**\n\
 * Parse `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function parse(event) {\n\
  var parts = event.split(/ +/);\n\
  return {\n\
    name: parts.shift(),\n\
    selector: parts.join(' ')\n\
  }\n\
}\n\
//@ sourceURL=component-events/index.js"
));
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  option: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  optgroup: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  thead: [1, '<table>', '</table>'],\n\
  tbody: [1, '<table>', '</table>'],\n\
  tfoot: [1, '<table>', '</table>'],\n\
  colgroup: [1, '<table>', '</table>'],\n\
  caption: [1, '<table>', '</table>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // Note: when moving children, don't rely on el.children\n\
  // being 'live' to support Polymer's broken behaviour.\n\
  // See: https://github.com/component/domify/pull/23\n\
  if (1 == el.children.length) {\n\
    return el.removeChild(el.children[0]);\n\
  }\n\
\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.children.length) {\n\
    fragment.appendChild(el.removeChild(el.children[0]));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("component-query/index.js", Function("exports, require, module",
"function one(selector, el) {\n\
  return el.querySelector(selector);\n\
}\n\
\n\
exports = module.exports = function(selector, el){\n\
  el = el || document;\n\
  return one(selector, el);\n\
};\n\
\n\
exports.all = function(selector, el){\n\
  el = el || document;\n\
  return el.querySelectorAll(selector);\n\
};\n\
\n\
exports.engine = function(obj){\n\
  if (!obj.one) throw new Error('.one callback required');\n\
  if (!obj.all) throw new Error('.all callback required');\n\
  one = obj.one;\n\
  exports.all = obj.all;\n\
  return exports;\n\
};\n\
//@ sourceURL=component-query/index.js"
));
require.register("yields-select/index.js", Function("exports, require, module",
"/**\n\
 * dependencies\n\
 */\n\
\n\
var previous = require('previous-sibling');\n\
var template = require('./template.html');\n\
var next = require('next-sibling');\n\
var debounce = require('debounce');\n\
var Pillbox = require('pillbox');\n\
var classes = require('classes');\n\
var Emitter = require('emitter');\n\
var keyname = require('keyname');\n\
var events = require('events');\n\
var domify = require('domify');\n\
var query = require('query');\n\
var each = require('each');\n\
var tpl = domify(template);\n\
\n\
/**\n\
 * Export `Select`\n\
 */\n\
\n\
module.exports = Select;\n\
\n\
/**\n\
 * Initialize `Select`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Select(){\n\
  if (!(this instanceof Select)) return new Select;\n\
  this.el = tpl.cloneNode(true);\n\
  this.classes = classes(this.el);\n\
  this.opts = query('.select-options', this.el);\n\
  this.dropdown = query('.select-dropdown', this.el);\n\
  this.input = query('.select-input', this.el);\n\
  this.inputEvents = events(this.input, this);\n\
  this.docEvents = events(document, this);\n\
  this.events = events(this.el, this);\n\
  this._selected = [];\n\
  this.options = {};\n\
  this.bind();\n\
}\n\
\n\
/**\n\
 * Mixins.\n\
 */\n\
\n\
Emitter(Select.prototype);\n\
\n\
/**\n\
 * Bind internal events.\n\
 *\n\
 * @return {Select}\n\
 * @api private\n\
 */\n\
\n\
Select.prototype.bind = function(){\n\
  this.events.bind('click .select-box', 'focus');\n\
  this.events.bind('mouseover .select-option');\n\
  var onsearch = this.onsearch.bind(this);\n\
  this.input.onkeyup = debounce(onsearch, 300);\n\
  this.docEvents.bind('touchstart', 'blur');\n\
  this.inputEvents.bind('focus', 'show');\n\
  this.events.bind('touchstart');\n\
  this.inputEvents.bind('blur');\n\
  this.events.bind('keydown');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Unbind internal events.\n\
 *\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.unbind = function(){\n\
  this.inputEvents.unbind();\n\
  this.docEvents.unbind();\n\
  this.events.unbind();\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set the select label.\n\
 *\n\
 * @param {String} label\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.label = function(label){\n\
  this._label = label;\n\
  this.input.placeholder = label;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Allow multiple.\n\
 *\n\
 * @param {String} label\n\
 * @param {Object} opts\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.multiple = function(label, opts){\n\
  if (this._multiple) return;\n\
  this._multiple = true;\n\
  this.classes.remove('select-single');\n\
  this.classes.add('select-multiple');\n\
  this.box = new Pillbox(this.input, opts);\n\
  this.box.events.unbind('keydown');\n\
  this.box.on('remove', this.deselect.bind(this));\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Add an option with `name` and `value`.\n\
 *\n\
 * @param {String|Object} name\n\
 * @param {Mixed} value\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.add = function(name, value){\n\
  var opt = option.apply(null, arguments);\n\
  opt.el.onmousedown = this.select.bind(this, name);\n\
  this.opts.appendChild(opt.el);\n\
  this.options[opt.name] = opt;\n\
  this.emit('add', opt);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove an option with `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.remove = function(name){\n\
  name = name.toLowerCase();\n\
  var opt = this.get(name);\n\
  this.emit('remove', opt);\n\
  this.opts.removeChild(opt.el);\n\
\n\
  // selected\n\
  if (opt.selected) {\n\
    this.deselect(opt.name);\n\
  }\n\
\n\
  delete this.options[name];\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove all options.\n\
 *\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.empty = function(){\n\
  each(this.options, this.remove.bind(this));\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Select `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.select = function(name){\n\
  var opt = this.get(name);\n\
\n\
  // state\n\
  if (!this.classes.has('selected')) {\n\
    this.classes.add('selected');\n\
  }\n\
\n\
  // select\n\
  this.emit('select', opt);\n\
  opt.selected = true;\n\
\n\
  // hide\n\
  opt.el.setAttribute('hidden', '');\n\
  classes(opt.el).add('selected');\n\
\n\
  // multiple\n\
  if (this._multiple) {\n\
    this.box.add(opt.label);\n\
    this._selected.push(opt);\n\
    this.input.value = '';\n\
    this.dehighlight();\n\
    this.change();\n\
    this.hide();\n\
    return this;\n\
  }\n\
\n\
  // single\n\
  var prev = this._selected[0];\n\
  if (prev) this.deselect(prev.name);\n\
  this._selected = [opt];\n\
  this.input.value = opt.label;\n\
  this.hide();\n\
  this.change();\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Deselect `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.deselect = function(name){\n\
  var opt = this.get(name);\n\
\n\
  // deselect\n\
  this.emit('deselect', opt);\n\
  opt.selected = false;\n\
\n\
  // show\n\
  opt.el.removeAttribute('hidden');\n\
  classes(opt.el).remove('selected');\n\
\n\
  // multiple\n\
  if (this._multiple) {\n\
    this.box.remove(opt.label);\n\
    var i = this._selected.indexOf(opt);\n\
    if (!~i) return this;\n\
    this._selected.splice(i, 1);\n\
    this.change();\n\
    return this;\n\
  }\n\
\n\
  // deselect\n\
  this.classes.remove('selected');\n\
\n\
  // single\n\
  this.label(this._label);\n\
  this._selected = [];\n\
  this.change();\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Get an option `name` or dropdown.\n\
 *\n\
 * @param {String} name\n\
 * @return {Element}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.get = function(name){\n\
  if ('string' == typeof name) {\n\
    name = name.toLowerCase();\n\
    var opt = this.options[name];\n\
    if (!opt) throw new Error('option \"' + name + '\" does not exist');\n\
    return opt;\n\
  }\n\
\n\
  return { el: this.dropdown };\n\
};\n\
\n\
/**\n\
 * Show options or `name`\n\
 *\n\
 * @param {String} name\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.show = function(name){\n\
  var opt = this.get(name);\n\
\n\
  // visible\n\
  if (this.visible(name)) return this;\n\
\n\
  // show\n\
  opt.el.removeAttribute('hidden');\n\
\n\
  // focus\n\
  if (!this._multiple && !this._searchable) {\n\
    this.el.focus();\n\
  }\n\
\n\
  // option\n\
  if ('string' == typeof name) return this;\n\
\n\
  // show\n\
  this.emit('show');\n\
  this.classes.add('open');\n\
\n\
  // highlight\n\
  var el = query('.select-option:not([hidden]):not(.selected)', this.opts);\n\
  if (el) this.highlight(el);\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Hide options or `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.hide = function(name){\n\
  var opt = this.get(name);\n\
  opt.el.setAttribute('hidden', '');\n\
  if ('string' == typeof name) return this;\n\
  this.emit('hide');\n\
  this.classes.remove('open');\n\
  this.showAll();\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Check if options or `name` is visible.\n\
 *\n\
 * @param {String} name\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.visible = function(name){\n\
  return ! this.get(name).el.hasAttribute('hidden');\n\
};\n\
\n\
/**\n\
 * Toggle show / hide with optional `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.toggle = function(name){\n\
  if ('string' != typeof name) name = null;\n\
\n\
  return this.visible(name)\n\
    ? this.hide(name)\n\
    : this.show(name);\n\
};\n\
\n\
/**\n\
 * Disable `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.disable = function(name){\n\
  var opt = this.get(name);\n\
  opt.el.setAttribute('disabled', true);\n\
  opt.disabled = true;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Enable `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.enable = function(name){\n\
  var opt = this.get(name);\n\
  opt.el.removeAttribute('disabled');\n\
  opt.disabled = false;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set / get the selected options.\n\
 *\n\
 * @param {Array} opts\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.selected = function(arr){\n\
  if (1 == arguments.length) {\n\
    arr.forEach(this.select, this);\n\
    return this;\n\
  }\n\
\n\
  return this._selected;\n\
};\n\
\n\
/**\n\
 * Get the values.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.values = function(){\n\
  return this._selected.map(function(opt){\n\
    return opt.value;\n\
  });\n\
};\n\
\n\
/**\n\
 * Search `term`.\n\
 *\n\
 * @param {String} term\n\
 * @return {Search}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.search = function(term){\n\
  var expr = term.toLowerCase()\n\
    , opts = this.options\n\
    , self = this\n\
    , found = 0;\n\
\n\
  // show\n\
  if (!this.visible()) {\n\
    this.show()\n\
  }\n\
\n\
  // custom search\n\
  this.emit('search', term, opts);\n\
\n\
  // abort\n\
  if (this.hasListeners('search')) return this;\n\
\n\
  // search\n\
  each(opts, function(name, opt){\n\
    if (opt.disabled) return;\n\
    if (opt.selected) return;\n\
\n\
    if (~name.indexOf(expr)) {\n\
      self.show(name);\n\
      if (1 == ++found) self.highlight(opt.el);\n\
    } else {\n\
      self.hide(opt.name);\n\
    }\n\
  });\n\
\n\
  // all done\n\
  return this.emit('found', found);\n\
};\n\
\n\
/**\n\
 * Highlight the given `name`.\n\
 *\n\
 * @param {String|Element} el\n\
 * @return {Select}\n\
 * @api private\n\
 */\n\
\n\
Select.prototype.highlight = function(el){\n\
  if ('string' == typeof el) el = this.get(el).el;\n\
  this.dehighlight();\n\
  classes(el).add('highlighted');\n\
  this.active = el;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * De-highlight.\n\
 *\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.dehighlight = function(){\n\
  if (!this.active) return this;\n\
  classes(this.active).remove('highlighted');\n\
  this.active = null;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Focus input.\n\
 *\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.focus = function(){\n\
  this.input.focus();\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Blur input.\n\
 *\n\
 * @return {Select}\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.blur = function(){\n\
  this.input.blur();\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Highlight next element.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Select.prototype.next = function(){\n\
  if (!this.active) return;\n\
  var el = next(this.active, ':not([hidden]):not(.selected)');\n\
  el = el || query('.select-option:not([hidden])', this.opts);\n\
  if (el) this.highlight(el);\n\
};\n\
\n\
/**\n\
 * Highlight previous element.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Select.prototype.previous = function(){\n\
  if (!this.active) return;\n\
  var el = previous(this.active, ':not([hidden]):not(.selected)');\n\
  el = el || query.all('.select-option:not([hidden])', this.el);\n\
  if (el.length) el = el[el.length - 1];\n\
  if (el.className) this.highlight(el);\n\
};\n\
\n\
/**\n\
 * on-input\n\
 *\n\
 * @param {Event} e\n\
 * @api private\n\
 */\n\
\n\
Select.prototype.onsearch = function(e){\n\
  var key = keyname(e.which);\n\
\n\
  // ignore\n\
  if ('down' == key) return;\n\
  if ('up' == key) return;\n\
  if ('enter' == key) return;\n\
  if ('left' == key) return;\n\
  if ('right' == key) return;\n\
\n\
  // search\n\
  if (e.target.value) {\n\
    this.search(e.target.value);\n\
  } else {\n\
    this.showAll();\n\
  }\n\
};\n\
\n\
/**\n\
 * on-keydown.\n\
 *\n\
 * @param {Event} e\n\
 * @api private\n\
 */\n\
\n\
Select.prototype.onkeydown = function(e){\n\
  var visible = this.visible()\n\
    , box = this.box;\n\
\n\
  // actions\n\
  switch (keyname(e.which)) {\n\
    case 'down':\n\
      e.preventDefault();\n\
      visible\n\
        ? this.next()\n\
        : this.show();\n\
      break;\n\
    case 'up':\n\
      e.preventDefault();\n\
      visible\n\
        ? this.previous()\n\
        : this.show();\n\
      break;\n\
    case 'esc':\n\
      this.hide();\n\
      this.input.value = '';\n\
      break;\n\
    case 'enter':\n\
      if (!this.active || !visible) return;\n\
      var name = this.active.getAttribute('data-name');\n\
      this.select(name);\n\
      break;\n\
    case 'backspace':\n\
      if (box) return box.onkeydown(e);\n\
      var all = this._selected;\n\
      var item = all[all.length - 1];\n\
      if (!item) return;\n\
      this.deselect(item.name);\n\
      break;\n\
  }\n\
};\n\
\n\
/**\n\
 * on-mouseover\n\
 *\n\
 * @param {Event} e\n\
 * @api private\n\
 */\n\
\n\
Select.prototype.onmouseover = function(e){\n\
  var name = e.target.getAttribute('data-name');\n\
  this.highlight(name);\n\
};\n\
\n\
/**\n\
 * Emit change.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Select.prototype.change = function(){\n\
  this.emit('change', this);\n\
};\n\
\n\
/**\n\
 * on-blur.\n\
 *\n\
 * @param {Event} e\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.onblur = function(e){\n\
  this.showAll();\n\
  this.hide();\n\
\n\
  if (this._multiple) {\n\
    this.input.value = '';\n\
  } else if (!this._selected.length) {\n\
    this.input.value = '';\n\
  }\n\
};\n\
\n\
/**\n\
 * Show all options.\n\
 *\n\
 * @return {Select}\n\
 * @api private\n\
 */\n\
\n\
Select.prototype.showAll = function(){\n\
  var els = query.all('[hidden]:not(.selected)', this.opts);\n\
\n\
  for (var i = 0; i < els.length; ++i) {\n\
    els[i].removeAttribute('hidden');\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * on-touchstart.\n\
 *\n\
 * @param {Event} e\n\
 * @api public\n\
 */\n\
\n\
Select.prototype.ontouchstart = function(e){\n\
  e.stopImmediatePropagation();\n\
};\n\
\n\
/**\n\
 * Create an option.\n\
 *\n\
 * @param {String|Object} obj\n\
 * @param {Mixed} value\n\
 * @param {Element} el\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function option(obj, value, el){\n\
  if ('string' == typeof obj) {\n\
    return option({\n\
      value: value,\n\
      name: obj,\n\
      el: el\n\
    });\n\
  }\n\
\n\
  // option\n\
  obj.label = obj.name;\n\
  obj.name = obj.name.toLowerCase();\n\
  obj.value = obj.value == null \n\
    ? obj.name\n\
    : obj.value;\n\
\n\
  // element\n\
  if (!obj.el) {\n\
    obj.el = document.createElement('li');\n\
    obj.el.textContent = obj.label;\n\
  }\n\
\n\
  // domify\n\
  if ('string' == typeof obj.el) {\n\
    obj.el = domify(obj.el);\n\
  }\n\
\n\
  // setup element\n\
  obj.el.setAttribute('data-name', obj.name);\n\
  classes(obj.el).add('select-option');\n\
  classes(obj.el).add('show');\n\
\n\
  // opt\n\
  return obj;\n\
}\n\
//@ sourceURL=yields-select/index.js"
));
require.register("codemirror/index.js", Function("exports, require, module",
"// CodeMirror is the only global var we claim\n\
module.exports = (function() {\n\
  \"use strict\";\n\
\n\
  // BROWSER SNIFFING\n\
\n\
  // Crude, but necessary to handle a number of hard-to-feature-detect\n\
  // bugs and behavior differences.\n\
  var gecko = /gecko\\/\\d/i.test(navigator.userAgent);\n\
  // IE11 currently doesn't count as 'ie', since it has almost none of\n\
  // the same bugs as earlier versions. Use ie_gt10 to handle\n\
  // incompatibilities in that version.\n\
  var ie = /MSIE \\d/.test(navigator.userAgent);\n\
  var ie_lt8 = ie && (document.documentMode == null || document.documentMode <\n\
    8);\n\
  var ie_lt9 = ie && (document.documentMode == null || document.documentMode <\n\
    9);\n\
  var ie_gt10 = /Trident\\/([7-9]|\\d{2,})\\./.test(navigator.userAgent);\n\
  var webkit = /WebKit\\//.test(navigator.userAgent);\n\
  var qtwebkit = webkit && /Qt\\/\\d+\\.\\d+/.test(navigator.userAgent);\n\
  var chrome = /Chrome\\//.test(navigator.userAgent);\n\
  var opera = /Opera\\//.test(navigator.userAgent);\n\
  var safari = /Apple Computer/.test(navigator.vendor);\n\
  var khtml = /KHTML\\//.test(navigator.userAgent);\n\
  var mac_geLion = /Mac OS X 1\\d\\D([7-9]|\\d\\d)\\D/.test(navigator.userAgent);\n\
  var mac_geMountainLion = /Mac OS X 1\\d\\D([8-9]|\\d\\d)\\D/.test(navigator.userAgent);\n\
  var phantom = /PhantomJS/.test(navigator.userAgent);\n\
\n\
  var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\\/\\w+/.test(\n\
    navigator.userAgent);\n\
  // This is woefully incomplete. Suggestions for alternative methods welcome.\n\
  var mobile = ios ||\n\
    /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(navigator\n\
      .userAgent);\n\
  var mac = ios || /Mac/.test(navigator.platform);\n\
  var windows = /win/i.test(navigator.platform);\n\
\n\
  var opera_version = opera && navigator.userAgent.match(\n\
    /Version\\/(\\d*\\.\\d*)/);\n\
  if (opera_version) opera_version = Number(opera_version[1]);\n\
  if (opera_version && opera_version >= 15) {\n\
    opera = false;\n\
    webkit = true;\n\
  }\n\
  // Some browsers use the wrong event properties to signal cmd/ctrl on OS X\n\
  var flipCtrlCmd = mac && (qtwebkit || opera && (opera_version == null ||\n\
    opera_version < 12.11));\n\
  var captureMiddleClick = gecko || (ie && !ie_lt9);\n\
\n\
  // Optimize some code when these features are not used\n\
  var sawReadOnlySpans = false,\n\
    sawCollapsedSpans = false;\n\
\n\
  // CONSTRUCTOR\n\
\n\
  function CodeMirror(place, options) {\n\
    if (!(this instanceof CodeMirror)) return new CodeMirror(place, options);\n\
\n\
    this.options = options = options || {};\n\
    // Determine effective options based on given values and defaults.\n\
    for (var opt in defaults)\n\
      if (!options.hasOwnProperty(opt) && defaults.hasOwnProperty(opt))\n\
        options[opt] = defaults[opt];\n\
    setGuttersForLineNumbers(options);\n\
\n\
    var docStart = typeof options.value == \"string\" ? 0 : options.value.first;\n\
    var display = this.display = makeDisplay(place, docStart);\n\
    display.wrapper.CodeMirror = this;\n\
    updateGutters(this);\n\
    if (options.autofocus && !mobile) focusInput(this);\n\
\n\
    this.state = {\n\
      keyMaps: [],\n\
      overlays: [],\n\
      modeGen: 0,\n\
      overwrite: false,\n\
      focused: false,\n\
      suppressEdits: false,\n\
      pasteIncoming: false,\n\
      draggingText: false,\n\
      highlight: new Delayed()\n\
    };\n\
\n\
    themeChanged(this);\n\
    if (options.lineWrapping)\n\
      this.display.wrapper.className += \" CodeMirror-wrap\";\n\
\n\
    var doc = options.value;\n\
    if (typeof doc == \"string\") doc = new Doc(options.value, options.mode);\n\
    operation(this, attachDoc)(this, doc);\n\
\n\
    // Override magic textarea content restore that IE sometimes does\n\
    // on our hidden textarea on reload\n\
    if (ie) setTimeout(bind(resetInput, this, true), 20);\n\
\n\
    registerEventHandlers(this);\n\
    // IE throws unspecified error in certain cases, when\n\
    // trying to access activeElement before onload\n\
    var hasFocus;\n\
    try {\n\
      hasFocus = (document.activeElement == display.input);\n\
    } catch (e) {}\n\
    if (hasFocus || (options.autofocus && !mobile)) setTimeout(bind(onFocus,\n\
      this), 20);\n\
    else onBlur(this);\n\
\n\
    operation(this, function() {\n\
      for (var opt in optionHandlers)\n\
        if (optionHandlers.propertyIsEnumerable(opt))\n\
          optionHandlers[opt](this, options[opt], Init);\n\
      for (var i = 0; i < initHooks.length; ++i) initHooks[i](this);\n\
    })();\n\
  }\n\
\n\
  // DISPLAY CONSTRUCTOR\n\
\n\
  function makeDisplay(place, docStart) {\n\
    var d = {};\n\
\n\
    var input = d.input = elt(\"textarea\", null, null,\n\
      \"position: absolute; padding: 0; width: 1px; height: 1em; outline: none; font-size: 4px;\"\n\
    );\n\
    if (webkit) input.style.width = \"1000px\";\n\
    else input.setAttribute(\"wrap\", \"off\");\n\
    // if border: 0; -- iOS fails to open keyboard (issue #1287)\n\
    if (ios) input.style.border = \"1px solid black\";\n\
    input.setAttribute(\"autocorrect\", \"off\");\n\
    input.setAttribute(\"autocapitalize\", \"off\");\n\
    input.setAttribute(\"spellcheck\", \"false\");\n\
\n\
    // Wraps and hides input textarea\n\
    d.inputDiv = elt(\"div\", [input], null,\n\
      \"overflow: hidden; position: relative; width: 3px; height: 0px;\");\n\
    // The actual fake scrollbars.\n\
    d.scrollbarH = elt(\"div\", [elt(\"div\", null, null, \"height: 1px\")],\n\
      \"CodeMirror-hscrollbar\");\n\
    d.scrollbarV = elt(\"div\", [elt(\"div\", null, null, \"width: 1px\")],\n\
      \"CodeMirror-vscrollbar\");\n\
    d.scrollbarFiller = elt(\"div\", null, \"CodeMirror-scrollbar-filler\");\n\
    d.gutterFiller = elt(\"div\", null, \"CodeMirror-gutter-filler\");\n\
    // DIVs containing the selection and the actual code\n\
    d.lineDiv = elt(\"div\", null, \"CodeMirror-code\");\n\
    d.selectionDiv = elt(\"div\", null, null, \"position: relative; z-index: 1\");\n\
    // Blinky cursor, and element used to ensure cursor fits at the end of a line\n\
    d.cursor = elt(\"div\", \"\\u00a0\", \"CodeMirror-cursor\");\n\
    // Secondary cursor, shown when on a 'jump' in bi-directional text\n\
    d.otherCursor = elt(\"div\", \"\\u00a0\",\n\
      \"CodeMirror-cursor CodeMirror-secondarycursor\");\n\
    // Used to measure text size\n\
    d.measure = elt(\"div\", null, \"CodeMirror-measure\");\n\
    // Wraps everything that needs to exist inside the vertically-padded coordinate system\n\
    d.lineSpace = elt(\"div\", [d.measure, d.selectionDiv, d.lineDiv, d.cursor,\n\
        d.otherCursor\n\
      ],\n\
      null, \"position: relative; outline: none\");\n\
    // Moved around its parent to cover visible view\n\
    d.mover = elt(\"div\", [elt(\"div\", [d.lineSpace], \"CodeMirror-lines\")],\n\
      null, \"position: relative\");\n\
    // Set to the height of the text, causes scrolling\n\
    d.sizer = elt(\"div\", [d.mover], \"CodeMirror-sizer\");\n\
    // D is needed because behavior of elts with overflow: auto and padding is inconsistent across browsers\n\
    d.heightForcer = elt(\"div\", null, null, \"position: absolute; height: \" +\n\
      scrollerCutOff + \"px; width: 1px;\");\n\
    // Will contain the gutters, if any\n\
    d.gutters = elt(\"div\", null, \"CodeMirror-gutters\");\n\
    d.lineGutter = null;\n\
    // Provides scrolling\n\
    d.scroller = elt(\"div\", [d.sizer, d.heightForcer, d.gutters],\n\
      \"CodeMirror-scroll\");\n\
    d.scroller.setAttribute(\"tabIndex\", \"-1\");\n\
    // The element in which the editor lives.\n\
    d.wrapper = elt(\"div\", [d.inputDiv, d.scrollbarH, d.scrollbarV,\n\
      d.scrollbarFiller, d.gutterFiller, d.scroller\n\
    ], \"CodeMirror\");\n\
    // Work around IE7 z-index bug\n\
    if (ie_lt8) {\n\
      d.gutters.style.zIndex = -1;\n\
      d.scroller.style.paddingRight = 0;\n\
    }\n\
    if (place.appendChild) place.appendChild(d.wrapper);\n\
    else place(d.wrapper);\n\
\n\
    // Needed to hide big blue blinking cursor on Mobile Safari\n\
    if (ios) input.style.width = \"0px\";\n\
    if (!webkit) d.scroller.draggable = true;\n\
    // Needed to handle Tab key in KHTML\n\
    if (khtml) {\n\
      d.inputDiv.style.height = \"1px\";\n\
      d.inputDiv.style.position = \"absolute\";\n\
    }\n\
    // Need to set a minimum width to see the scrollbar on IE7 (but must not set it on IE8).\n\
    else if (ie_lt8) d.scrollbarH.style.minWidth = d.scrollbarV.style.minWidth =\n\
      \"18px\";\n\
\n\
    // Current visible range (may be bigger than the view window).\n\
    d.viewOffset = d.lastSizeC = 0;\n\
    d.showingFrom = d.showingTo = docStart;\n\
\n\
    // Used to only resize the line number gutter when necessary (when\n\
    // the amount of lines crosses a boundary that makes its width change)\n\
    d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null;\n\
    // See readInput and resetInput\n\
    d.prevInput = \"\";\n\
    // Set to true when a non-horizontal-scrolling widget is added. As\n\
    // an optimization, widget aligning is skipped when d is false.\n\
    d.alignWidgets = false;\n\
    // Flag that indicates whether we currently expect input to appear\n\
    // (after some event like 'keypress' or 'input') and are polling\n\
    // intensively.\n\
    d.pollingFast = false;\n\
    // Self-resetting timeout for the poller\n\
    d.poll = new Delayed();\n\
\n\
    d.cachedCharWidth = d.cachedTextHeight = null;\n\
    d.measureLineCache = [];\n\
    d.measureLineCachePos = 0;\n\
\n\
    // Tracks when resetInput has punted to just putting a short\n\
    // string instead of the (large) selection.\n\
    d.inaccurateSelection = false;\n\
\n\
    // Tracks the maximum line length so that the horizontal scrollbar\n\
    // can be kept static when scrolling.\n\
    d.maxLine = null;\n\
    d.maxLineLength = 0;\n\
    d.maxLineChanged = false;\n\
\n\
    // Used for measuring wheel scrolling granularity\n\
    d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null;\n\
\n\
    return d;\n\
  }\n\
\n\
  // STATE UPDATES\n\
\n\
  // Used to get the editor into a consistent state again when options change.\n\
\n\
  function loadMode(cm) {\n\
    cm.doc.mode = CodeMirror.getMode(cm.options, cm.doc.modeOption);\n\
    cm.doc.iter(function(line) {\n\
      if (line.stateAfter) line.stateAfter = null;\n\
      if (line.styles) line.styles = null;\n\
    });\n\
    cm.doc.frontier = cm.doc.first;\n\
    startWorker(cm, 100);\n\
    cm.state.modeGen++;\n\
    if (cm.curOp) regChange(cm);\n\
  }\n\
\n\
  function wrappingChanged(cm) {\n\
    if (cm.options.lineWrapping) {\n\
      cm.display.wrapper.className += \" CodeMirror-wrap\";\n\
      cm.display.sizer.style.minWidth = \"\";\n\
    } else {\n\
      cm.display.wrapper.className = cm.display.wrapper.className.replace(\n\
        \" CodeMirror-wrap\", \"\");\n\
      computeMaxLength(cm);\n\
    }\n\
    estimateLineHeights(cm);\n\
    regChange(cm);\n\
    clearCaches(cm);\n\
    setTimeout(function() {\n\
      updateScrollbars(cm);\n\
    }, 100);\n\
  }\n\
\n\
  function estimateHeight(cm) {\n\
    var th = textHeight(cm.display),\n\
      wrapping = cm.options.lineWrapping;\n\
    var perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth /\n\
      charWidth(cm.display) - 3);\n\
    return function(line) {\n\
      if (lineIsHidden(cm.doc, line))\n\
        return 0;\n\
      else if (wrapping)\n\
        return (Math.ceil(line.text.length / perLine) || 1) * th;\n\
      else\n\
        return th;\n\
    };\n\
  }\n\
\n\
  function estimateLineHeights(cm) {\n\
    var doc = cm.doc,\n\
      est = estimateHeight(cm);\n\
    doc.iter(function(line) {\n\
      var estHeight = est(line);\n\
      if (estHeight != line.height) updateLineHeight(line, estHeight);\n\
    });\n\
  }\n\
\n\
  function keyMapChanged(cm) {\n\
    var map = keyMap[cm.options.keyMap],\n\
      style = map.style;\n\
    cm.display.wrapper.className = cm.display.wrapper.className.replace(\n\
      /\\s*cm-keymap-\\S+/g, \"\") +\n\
      (style ? \" cm-keymap-\" + style : \"\");\n\
    cm.state.disableInput = map.disableInput;\n\
  }\n\
\n\
  function themeChanged(cm) {\n\
    cm.display.wrapper.className = cm.display.wrapper.className.replace(\n\
      /\\s*cm-s-\\S+/g, \"\") +\n\
      cm.options.theme.replace(/(^|\\s)\\s*/g, \" cm-s-\");\n\
    clearCaches(cm);\n\
  }\n\
\n\
  function guttersChanged(cm) {\n\
    updateGutters(cm);\n\
    regChange(cm);\n\
    setTimeout(function() {\n\
      alignHorizontally(cm);\n\
    }, 20);\n\
  }\n\
\n\
  function updateGutters(cm) {\n\
    var gutters = cm.display.gutters,\n\
      specs = cm.options.gutters;\n\
    removeChildren(gutters);\n\
    for (var i = 0; i < specs.length; ++i) {\n\
      var gutterClass = specs[i];\n\
      var gElt = gutters.appendChild(elt(\"div\", null, \"CodeMirror-gutter \" +\n\
        gutterClass));\n\
      if (gutterClass == \"CodeMirror-linenumbers\") {\n\
        cm.display.lineGutter = gElt;\n\
        gElt.style.width = (cm.display.lineNumWidth || 1) + \"px\";\n\
      }\n\
    }\n\
    gutters.style.display = i ? \"\" : \"none\";\n\
  }\n\
\n\
  function lineLength(doc, line) {\n\
    if (line.height == 0) return 0;\n\
    var len = line.text.length,\n\
      merged, cur = line;\n\
    while (merged = collapsedSpanAtStart(cur)) {\n\
      var found = merged.find();\n\
      cur = getLine(doc, found.from.line);\n\
      len += found.from.ch - found.to.ch;\n\
    }\n\
    cur = line;\n\
    while (merged = collapsedSpanAtEnd(cur)) {\n\
      var found = merged.find();\n\
      len -= cur.text.length - found.from.ch;\n\
      cur = getLine(doc, found.to.line);\n\
      len += cur.text.length - found.to.ch;\n\
    }\n\
    return len;\n\
  }\n\
\n\
  function computeMaxLength(cm) {\n\
    var d = cm.display,\n\
      doc = cm.doc;\n\
    d.maxLine = getLine(doc, doc.first);\n\
    d.maxLineLength = lineLength(doc, d.maxLine);\n\
    d.maxLineChanged = true;\n\
    doc.iter(function(line) {\n\
      var len = lineLength(doc, line);\n\
      if (len > d.maxLineLength) {\n\
        d.maxLineLength = len;\n\
        d.maxLine = line;\n\
      }\n\
    });\n\
  }\n\
\n\
  // Make sure the gutters options contains the element\n\
  // \"CodeMirror-linenumbers\" when the lineNumbers option is true.\n\
  function setGuttersForLineNumbers(options) {\n\
    var found = indexOf(options.gutters, \"CodeMirror-linenumbers\");\n\
    if (found == -1 && options.lineNumbers) {\n\
      options.gutters = options.gutters.concat([\"CodeMirror-linenumbers\"]);\n\
    } else if (found > -1 && !options.lineNumbers) {\n\
      options.gutters = options.gutters.slice(0);\n\
      options.gutters.splice(found, 1);\n\
    }\n\
  }\n\
\n\
  // SCROLLBARS\n\
\n\
  // Re-synchronize the fake scrollbars with the actual size of the\n\
  // content. Optionally force a scrollTop.\n\
  function updateScrollbars(cm) {\n\
    var d = cm.display,\n\
      docHeight = cm.doc.height;\n\
    var totalHeight = docHeight + paddingVert(d);\n\
    d.sizer.style.minHeight = d.heightForcer.style.top = totalHeight + \"px\";\n\
    d.gutters.style.height = Math.max(totalHeight, d.scroller.clientHeight -\n\
      scrollerCutOff) + \"px\";\n\
    var scrollHeight = Math.max(totalHeight, d.scroller.scrollHeight);\n\
    var needsH = d.scroller.scrollWidth > (d.scroller.clientWidth + 1);\n\
    var needsV = scrollHeight > (d.scroller.clientHeight + 1);\n\
    if (needsV) {\n\
      d.scrollbarV.style.display = \"block\";\n\
      d.scrollbarV.style.bottom = needsH ? scrollbarWidth(d.measure) + \"px\" :\n\
        \"0\";\n\
      d.scrollbarV.firstChild.style.height =\n\
        (scrollHeight - d.scroller.clientHeight + d.scrollbarV.clientHeight) +\n\
        \"px\";\n\
    } else {\n\
      d.scrollbarV.style.display = \"\";\n\
      d.scrollbarV.firstChild.style.height = \"0\";\n\
    }\n\
    if (needsH) {\n\
      d.scrollbarH.style.display = \"block\";\n\
      d.scrollbarH.style.right = needsV ? scrollbarWidth(d.measure) + \"px\" :\n\
        \"0\";\n\
      d.scrollbarH.firstChild.style.width =\n\
        (d.scroller.scrollWidth - d.scroller.clientWidth + d.scrollbarH.clientWidth) +\n\
        \"px\";\n\
    } else {\n\
      d.scrollbarH.style.display = \"\";\n\
      d.scrollbarH.firstChild.style.width = \"0\";\n\
    }\n\
    if (needsH && needsV) {\n\
      d.scrollbarFiller.style.display = \"block\";\n\
      d.scrollbarFiller.style.height = d.scrollbarFiller.style.width =\n\
        scrollbarWidth(d.measure) + \"px\";\n\
    } else d.scrollbarFiller.style.display = \"\";\n\
    if (needsH && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter) {\n\
      d.gutterFiller.style.display = \"block\";\n\
      d.gutterFiller.style.height = scrollbarWidth(d.measure) + \"px\";\n\
      d.gutterFiller.style.width = d.gutters.offsetWidth + \"px\";\n\
    } else d.gutterFiller.style.display = \"\";\n\
\n\
    if (mac_geLion && scrollbarWidth(d.measure) === 0) {\n\
      d.scrollbarV.style.minWidth = d.scrollbarH.style.minHeight =\n\
        mac_geMountainLion ? \"18px\" : \"12px\";\n\
      d.scrollbarV.style.pointerEvents = d.scrollbarH.style.pointerEvents =\n\
        \"none\";\n\
    }\n\
  }\n\
\n\
  function visibleLines(display, doc, viewPort) {\n\
    var top = display.scroller.scrollTop,\n\
      height = display.wrapper.clientHeight;\n\
    if (typeof viewPort == \"number\") top = viewPort;\n\
    else if (viewPort) {\n\
      top = viewPort.top;\n\
      height = viewPort.bottom - viewPort.top;\n\
    }\n\
    top = Math.floor(top - paddingTop(display));\n\
    var bottom = Math.ceil(top + height);\n\
    return {\n\
      from: lineAtHeight(doc, top),\n\
      to: lineAtHeight(doc, bottom)\n\
    };\n\
  }\n\
\n\
  // LINE NUMBERS\n\
\n\
  function alignHorizontally(cm) {\n\
    var display = cm.display;\n\
    if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter))\n\
      return;\n\
    var comp = compensateForHScroll(display) - display.scroller.scrollLeft +\n\
      cm.doc.scrollLeft;\n\
    var gutterW = display.gutters.offsetWidth,\n\
      l = comp + \"px\";\n\
    for (var n = display.lineDiv.firstChild; n; n = n.nextSibling)\n\
      if (n.alignable) {\n\
        for (var i = 0, a = n.alignable; i < a.length; ++i) a[i].style.left =\n\
          l;\n\
      }\n\
    if (cm.options.fixedGutter)\n\
      display.gutters.style.left = (comp + gutterW) + \"px\";\n\
  }\n\
\n\
  function maybeUpdateLineNumberWidth(cm) {\n\
    if (!cm.options.lineNumbers) return false;\n\
    var doc = cm.doc,\n\
      last = lineNumberFor(cm.options, doc.first + doc.size - 1),\n\
      display = cm.display;\n\
    if (last.length != display.lineNumChars) {\n\
      var test = display.measure.appendChild(elt(\"div\", [elt(\"div\", last)],\n\
        \"CodeMirror-linenumber CodeMirror-gutter-elt\"));\n\
      var innerW = test.firstChild.offsetWidth,\n\
        padding = test.offsetWidth - innerW;\n\
      display.lineGutter.style.width = \"\";\n\
      display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth -\n\
        padding);\n\
      display.lineNumWidth = display.lineNumInnerWidth + padding;\n\
      display.lineNumChars = display.lineNumInnerWidth ? last.length : -1;\n\
      display.lineGutter.style.width = display.lineNumWidth + \"px\";\n\
      return true;\n\
    }\n\
    return false;\n\
  }\n\
\n\
  function lineNumberFor(options, i) {\n\
    return String(options.lineNumberFormatter(i + options.firstLineNumber));\n\
  }\n\
\n\
  function compensateForHScroll(display) {\n\
    return getRect(display.scroller)\n\
      .left - getRect(display.sizer)\n\
      .left;\n\
  }\n\
\n\
  // DISPLAY DRAWING\n\
\n\
  function updateDisplay(cm, changes, viewPort, forced) {\n\
    var oldFrom = cm.display.showingFrom,\n\
      oldTo = cm.display.showingTo,\n\
      updated;\n\
    var visible = visibleLines(cm.display, cm.doc, viewPort);\n\
    for (var first = true;; first = false) {\n\
      var oldWidth = cm.display.scroller.clientWidth;\n\
      if (!updateDisplayInner(cm, changes, visible, forced)) break;\n\
      updated = true;\n\
      changes = [];\n\
      updateSelection(cm);\n\
      updateScrollbars(cm);\n\
      if (first && cm.options.lineWrapping && oldWidth != cm.display.scroller\n\
        .clientWidth) {\n\
        forced = true;\n\
        continue;\n\
      }\n\
      forced = false;\n\
\n\
      // Clip forced viewport to actual scrollable area\n\
      if (viewPort)\n\
        viewPort = Math.min(cm.display.scroller.scrollHeight - cm.display.scroller\n\
          .clientHeight,\n\
          typeof viewPort == \"number\" ? viewPort : viewPort.top);\n\
      visible = visibleLines(cm.display, cm.doc, viewPort);\n\
      if (visible.from >= cm.display.showingFrom && visible.to <= cm.display.showingTo)\n\
        break;\n\
    }\n\
\n\
    if (updated) {\n\
      signalLater(cm, \"update\", cm);\n\
      if (cm.display.showingFrom != oldFrom || cm.display.showingTo != oldTo)\n\
        signalLater(cm, \"viewportChange\", cm, cm.display.showingFrom, cm.display\n\
          .showingTo);\n\
    }\n\
    return updated;\n\
  }\n\
\n\
  // Uses a set of changes plus the current scroll position to\n\
  // determine which DOM updates have to be made, and makes the\n\
  // updates.\n\
  function updateDisplayInner(cm, changes, visible, forced) {\n\
    var display = cm.display,\n\
      doc = cm.doc;\n\
    if (!display.wrapper.clientWidth) {\n\
      display.showingFrom = display.showingTo = doc.first;\n\
      display.viewOffset = 0;\n\
      return;\n\
    }\n\
\n\
    // Bail out if the visible area is already rendered and nothing changed.\n\
    if (!forced && changes.length == 0 &&\n\
      visible.from > display.showingFrom && visible.to < display.showingTo)\n\
      return;\n\
\n\
    if (maybeUpdateLineNumberWidth(cm))\n\
      changes = [{\n\
        from: doc.first,\n\
        to: doc.first + doc.size\n\
      }];\n\
    var gutterW = display.sizer.style.marginLeft = display.gutters.offsetWidth +\n\
      \"px\";\n\
    display.scrollbarH.style.left = cm.options.fixedGutter ? gutterW : \"0\";\n\
\n\
    // Used to determine which lines need their line numbers updated\n\
    var positionsChangedFrom = Infinity;\n\
    if (cm.options.lineNumbers)\n\
      for (var i = 0; i < changes.length; ++i)\n\
        if (changes[i].diff && changes[i].from < positionsChangedFrom) {\n\
          positionsChangedFrom = changes[i].from;\n\
        }\n\
\n\
    var end = doc.first + doc.size;\n\
    var from = Math.max(visible.from - cm.options.viewportMargin, doc.first);\n\
    var to = Math.min(end, visible.to + cm.options.viewportMargin);\n\
    if (display.showingFrom < from && from - display.showingFrom < 20) from =\n\
      Math.max(doc.first, display.showingFrom);\n\
    if (display.showingTo > to && display.showingTo - to < 20) to = Math.min(\n\
      end, display.showingTo);\n\
    if (sawCollapsedSpans) {\n\
      from = lineNo(visualLine(doc, getLine(doc, from)));\n\
      while (to < end && lineIsHidden(doc, getLine(doc, to)))++to;\n\
    }\n\
\n\
    // Create a range of theoretically intact lines, and punch holes\n\
    // in that using the change info.\n\
    var intact = [{\n\
      from: Math.max(display.showingFrom, doc.first),\n\
      to: Math.min(display.showingTo, end)\n\
    }];\n\
    if (intact[0].from >= intact[0].to) intact = [];\n\
    else intact = computeIntact(intact, changes);\n\
    // When merged lines are present, we might have to reduce the\n\
    // intact ranges because changes in continued fragments of the\n\
    // intact lines do require the lines to be redrawn.\n\
    if (sawCollapsedSpans)\n\
      for (var i = 0; i < intact.length; ++i) {\n\
        var range = intact[i],\n\
          merged;\n\
        while (merged = collapsedSpanAtEnd(getLine(doc, range.to - 1))) {\n\
          var newTo = merged.find()\n\
            .from.line;\n\
          if (newTo > range.from) range.to = newTo;\n\
          else {\n\
            intact.splice(i--, 1);\n\
            break;\n\
          }\n\
        }\n\
      }\n\
\n\
    // Clip off the parts that won't be visible\n\
    var intactLines = 0;\n\
    for (var i = 0; i < intact.length; ++i) {\n\
      var range = intact[i];\n\
      if (range.from < from) range.from = from;\n\
      if (range.to > to) range.to = to;\n\
      if (range.from >= range.to) intact.splice(i--, 1);\n\
      else intactLines += range.to - range.from;\n\
    }\n\
    if (!forced && intactLines == to - from && from == display.showingFrom &&\n\
      to == display.showingTo) {\n\
      updateViewOffset(cm);\n\
      return;\n\
    }\n\
    intact.sort(function(a, b) {\n\
      return a.from - b.from;\n\
    });\n\
\n\
    // Avoid crashing on IE's \"unspecified error\" when in iframes\n\
    try {\n\
      var focused = document.activeElement;\n\
    } catch (e) {}\n\
    if (intactLines < (to - from) * .7) display.lineDiv.style.display =\n\
      \"none\";\n\
    patchDisplay(cm, from, to, intact, positionsChangedFrom);\n\
    display.lineDiv.style.display = \"\";\n\
    if (focused && document.activeElement != focused && focused.offsetHeight)\n\
      focused.focus();\n\
\n\
    var different = from != display.showingFrom || to != display.showingTo ||\n\
      display.lastSizeC != display.wrapper.clientHeight;\n\
    // This is just a bogus formula that detects when the editor is\n\
    // resized or the font size changes.\n\
    if (different) {\n\
      display.lastSizeC = display.wrapper.clientHeight;\n\
      startWorker(cm, 400);\n\
    }\n\
    display.showingFrom = from;\n\
    display.showingTo = to;\n\
\n\
    display.gutters.style.height = \"\";\n\
    updateHeightsInViewport(cm);\n\
    updateViewOffset(cm);\n\
\n\
    return true;\n\
  }\n\
\n\
  function updateHeightsInViewport(cm) {\n\
    var display = cm.display;\n\
    var prevBottom = display.lineDiv.offsetTop;\n\
    for (var node = display.lineDiv.firstChild, height; node; node = node.nextSibling)\n\
      if (node.lineObj) {\n\
        if (ie_lt8) {\n\
          var bot = node.offsetTop + node.offsetHeight;\n\
          height = bot - prevBottom;\n\
          prevBottom = bot;\n\
        } else {\n\
          var box = getRect(node);\n\
          height = box.bottom - box.top;\n\
        }\n\
        var diff = node.lineObj.height - height;\n\
        if (height < 2) height = textHeight(display);\n\
        if (diff > .001 || diff < -.001) {\n\
          updateLineHeight(node.lineObj, height);\n\
          var widgets = node.lineObj.widgets;\n\
          if (widgets)\n\
            for (var i = 0; i < widgets.length; ++i)\n\
              widgets[i].height = widgets[i].node.offsetHeight;\n\
        }\n\
      }\n\
  }\n\
\n\
  function updateViewOffset(cm) {\n\
    var off = cm.display.viewOffset = heightAtLine(cm, getLine(cm.doc, cm.display\n\
      .showingFrom));\n\
    // Position the mover div to align with the current virtual scroll position\n\
    cm.display.mover.style.top = off + \"px\";\n\
  }\n\
\n\
  function computeIntact(intact, changes) {\n\
    for (var i = 0, l = changes.length || 0; i < l; ++i) {\n\
      var change = changes[i],\n\
        intact2 = [],\n\
        diff = change.diff || 0;\n\
      for (var j = 0, l2 = intact.length; j < l2; ++j) {\n\
        var range = intact[j];\n\
        if (change.to <= range.from && change.diff) {\n\
          intact2.push({\n\
            from: range.from + diff,\n\
            to: range.to + diff\n\
          });\n\
        } else if (change.to <= range.from || change.from >= range.to) {\n\
          intact2.push(range);\n\
        } else {\n\
          if (change.from > range.from)\n\
            intact2.push({\n\
              from: range.from,\n\
              to: change.from\n\
            });\n\
          if (change.to < range.to)\n\
            intact2.push({\n\
              from: change.to + diff,\n\
              to: range.to + diff\n\
            });\n\
        }\n\
      }\n\
      intact = intact2;\n\
    }\n\
    return intact;\n\
  }\n\
\n\
  function getDimensions(cm) {\n\
    var d = cm.display,\n\
      left = {}, width = {};\n\
    for (var n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {\n\
      left[cm.options.gutters[i]] = n.offsetLeft;\n\
      width[cm.options.gutters[i]] = n.offsetWidth;\n\
    }\n\
    return {\n\
      fixedPos: compensateForHScroll(d),\n\
      gutterTotalWidth: d.gutters.offsetWidth,\n\
      gutterLeft: left,\n\
      gutterWidth: width,\n\
      wrapperWidth: d.wrapper.clientWidth\n\
    };\n\
  }\n\
\n\
  function patchDisplay(cm, from, to, intact, updateNumbersFrom) {\n\
    var dims = getDimensions(cm);\n\
    var display = cm.display,\n\
      lineNumbers = cm.options.lineNumbers;\n\
    if (!intact.length && (!webkit || !cm.display.currentWheelTarget))\n\
      removeChildren(display.lineDiv);\n\
    var container = display.lineDiv,\n\
      cur = container.firstChild;\n\
\n\
    function rm(node) {\n\
      var next = node.nextSibling;\n\
      if (webkit && mac && cm.display.currentWheelTarget == node) {\n\
        node.style.display = \"none\";\n\
        node.lineObj = null;\n\
      } else {\n\
        node.parentNode.removeChild(node);\n\
      }\n\
      return next;\n\
    }\n\
\n\
    var nextIntact = intact.shift(),\n\
      lineN = from;\n\
    cm.doc.iter(from, to, function(line) {\n\
      if (nextIntact && nextIntact.to == lineN) nextIntact = intact.shift();\n\
      if (lineIsHidden(cm.doc, line)) {\n\
        if (line.height != 0) updateLineHeight(line, 0);\n\
        if (line.widgets && cur && cur.previousSibling)\n\
          for (var i = 0; i < line.widgets.length; ++i) {\n\
            var w = line.widgets[i];\n\
            if (w.showIfHidden) {\n\
              var prev = cur.previousSibling;\n\
              if (/pre/i.test(prev.nodeName)) {\n\
                var wrap = elt(\"div\", null, null, \"position: relative\");\n\
                prev.parentNode.replaceChild(wrap, prev);\n\
                wrap.appendChild(prev);\n\
                prev = wrap;\n\
              }\n\
              var wnode = prev.appendChild(elt(\"div\", [w.node],\n\
                \"CodeMirror-linewidget\"));\n\
              if (!w.handleMouseEvents) wnode.ignoreEvents = true;\n\
              positionLineWidget(w, wnode, prev, dims);\n\
            }\n\
          }\n\
      } else if (nextIntact && nextIntact.from <= lineN && nextIntact.to >\n\
        lineN) {\n\
        // This line is intact. Skip to the actual node. Update its\n\
        // line number if needed.\n\
        while (cur.lineObj != line) cur = rm(cur);\n\
        if (lineNumbers && updateNumbersFrom <= lineN && cur.lineNumber)\n\
          setTextContent(cur.lineNumber, lineNumberFor(cm.options, lineN));\n\
        cur = cur.nextSibling;\n\
      } else {\n\
        // For lines with widgets, make an attempt to find and reuse\n\
        // the existing element, so that widgets aren't needlessly\n\
        // removed and re-inserted into the dom\n\
        if (line.widgets)\n\
          for (var j = 0, search = cur, reuse; search && j < 20; ++j,\n\
            search = search.nextSibling)\n\
            if (search.lineObj == line && /div/i.test(search.nodeName)) {\n\
              reuse = search;\n\
              break;\n\
            }\n\
            // This line needs to be generated.\n\
        var lineNode = buildLineElement(cm, line, lineN, dims, reuse);\n\
        if (lineNode != reuse) {\n\
          container.insertBefore(lineNode, cur);\n\
        } else {\n\
          while (cur != reuse) cur = rm(cur);\n\
          cur = cur.nextSibling;\n\
        }\n\
\n\
        lineNode.lineObj = line;\n\
      }\n\
      ++lineN;\n\
    });\n\
    while (cur) cur = rm(cur);\n\
  }\n\
\n\
  function buildLineElement(cm, line, lineNo, dims, reuse) {\n\
    var built = buildLineContent(cm, line),\n\
      lineElement = built.pre;\n\
    var markers = line.gutterMarkers,\n\
      display = cm.display,\n\
      wrap;\n\
\n\
    var bgClass = built.bgClass ? built.bgClass + \" \" + (line.bgClass || \"\") :\n\
      line.bgClass;\n\
    if (!cm.options.lineNumbers && !markers && !bgClass && !line.wrapClass && !\n\
      line.widgets)\n\
      return lineElement;\n\
\n\
    // Lines with gutter elements, widgets or a background class need\n\
    // to be wrapped again, and have the extra elements added to the\n\
    // wrapper div\n\
\n\
    if (reuse) {\n\
      reuse.alignable = null;\n\
      var isOk = true,\n\
        widgetsSeen = 0,\n\
        insertBefore = null;\n\
      for (var n = reuse.firstChild, next; n; n = next) {\n\
        next = n.nextSibling;\n\
        if (!/\\bCodeMirror-linewidget\\b/.test(n.className)) {\n\
          reuse.removeChild(n);\n\
        } else {\n\
          for (var i = 0; i < line.widgets.length; ++i) {\n\
            var widget = line.widgets[i];\n\
            if (widget.node == n.firstChild) {\n\
              if (!widget.above && !insertBefore) insertBefore = n;\n\
              positionLineWidget(widget, n, reuse, dims);\n\
              ++widgetsSeen;\n\
              break;\n\
            }\n\
          }\n\
          if (i == line.widgets.length) {\n\
            isOk = false;\n\
            break;\n\
          }\n\
        }\n\
      }\n\
      reuse.insertBefore(lineElement, insertBefore);\n\
      if (isOk && widgetsSeen == line.widgets.length) {\n\
        wrap = reuse;\n\
        reuse.className = line.wrapClass || \"\";\n\
      }\n\
    }\n\
    if (!wrap) {\n\
      wrap = elt(\"div\", null, line.wrapClass, \"position: relative\");\n\
      wrap.appendChild(lineElement);\n\
    }\n\
    // Kludge to make sure the styled element lies behind the selection (by z-index)\n\
    if (bgClass)\n\
      wrap.insertBefore(elt(\"div\", null, bgClass +\n\
        \" CodeMirror-linebackground\"), wrap.firstChild);\n\
    if (cm.options.lineNumbers || markers) {\n\
      var gutterWrap = wrap.insertBefore(elt(\"div\", null,\n\
          \"CodeMirror-gutter-wrapper\", \"position: absolute; left: \" +\n\
          (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) +\n\
          \"px\"),\n\
        lineElement);\n\
      if (cm.options.fixedGutter)(wrap.alignable || (wrap.alignable = []))\n\
        .push(gutterWrap);\n\
      if (cm.options.lineNumbers && (!markers || !markers[\n\
        \"CodeMirror-linenumbers\"]))\n\
        wrap.lineNumber = gutterWrap.appendChild(\n\
          elt(\"div\", lineNumberFor(cm.options, lineNo),\n\
            \"CodeMirror-linenumber CodeMirror-gutter-elt\",\n\
            \"left: \" + dims.gutterLeft[\"CodeMirror-linenumbers\"] +\n\
            \"px; width: \" + display.lineNumInnerWidth + \"px\"));\n\
      if (markers)\n\
        for (var k = 0; k < cm.options.gutters.length; ++k) {\n\
          var id = cm.options.gutters[k],\n\
            found = markers.hasOwnProperty(id) && markers[id];\n\
          if (found)\n\
            gutterWrap.appendChild(elt(\"div\", [found],\n\
              \"CodeMirror-gutter-elt\", \"left: \" +\n\
              dims.gutterLeft[id] + \"px; width: \" + dims.gutterWidth[id] +\n\
              \"px\"));\n\
        }\n\
    }\n\
    if (ie_lt8) wrap.style.zIndex = 2;\n\
    if (line.widgets && wrap != reuse)\n\
      for (var i = 0, ws = line.widgets; i < ws.length; ++i) {\n\
        var widget = ws[i],\n\
          node = elt(\"div\", [widget.node], \"CodeMirror-linewidget\");\n\
        if (!widget.handleMouseEvents) node.ignoreEvents = true;\n\
        positionLineWidget(widget, node, wrap, dims);\n\
        if (widget.above)\n\
          wrap.insertBefore(node, cm.options.lineNumbers && line.height != 0 ?\n\
            gutterWrap : lineElement);\n\
        else\n\
          wrap.appendChild(node);\n\
        signalLater(widget, \"redraw\");\n\
      }\n\
    return wrap;\n\
  }\n\
\n\
  function positionLineWidget(widget, node, wrap, dims) {\n\
    if (widget.noHScroll) {\n\
      (wrap.alignable || (wrap.alignable = []))\n\
        .push(node);\n\
      var width = dims.wrapperWidth;\n\
      node.style.left = dims.fixedPos + \"px\";\n\
      if (!widget.coverGutter) {\n\
        width -= dims.gutterTotalWidth;\n\
        node.style.paddingLeft = dims.gutterTotalWidth + \"px\";\n\
      }\n\
      node.style.width = width + \"px\";\n\
    }\n\
    if (widget.coverGutter) {\n\
      node.style.zIndex = 5;\n\
      node.style.position = \"relative\";\n\
      if (!widget.noHScroll) node.style.marginLeft = -dims.gutterTotalWidth +\n\
        \"px\";\n\
    }\n\
  }\n\
\n\
  // SELECTION / CURSOR\n\
\n\
  function updateSelection(cm) {\n\
    var display = cm.display;\n\
    var collapsed = posEq(cm.doc.sel.from, cm.doc.sel.to);\n\
    if (collapsed || cm.options.showCursorWhenSelecting)\n\
      updateSelectionCursor(cm);\n\
    else\n\
      display.cursor.style.display = display.otherCursor.style.display =\n\
        \"none\";\n\
    if (!collapsed)\n\
      updateSelectionRange(cm);\n\
    else\n\
      display.selectionDiv.style.display = \"none\";\n\
\n\
    // Move the hidden textarea near the cursor to prevent scrolling artifacts\n\
    if (cm.options.moveInputWithCursor) {\n\
      var headPos = cursorCoords(cm, cm.doc.sel.head, \"div\");\n\
      var wrapOff = getRect(display.wrapper),\n\
        lineOff = getRect(display.lineDiv);\n\
      display.inputDiv.style.top = Math.max(0, Math.min(display.wrapper.clientHeight -\n\
        10,\n\
        headPos.top + lineOff.top - wrapOff.top)) + \"px\";\n\
      display.inputDiv.style.left = Math.max(0, Math.min(display.wrapper.clientWidth -\n\
        10,\n\
        headPos.left + lineOff.left - wrapOff.left)) + \"px\";\n\
    }\n\
  }\n\
\n\
  // No selection, plain cursor\n\
  function updateSelectionCursor(cm) {\n\
    var display = cm.display,\n\
      pos = cursorCoords(cm, cm.doc.sel.head, \"div\");\n\
    display.cursor.style.left = pos.left + \"px\";\n\
    display.cursor.style.top = pos.top + \"px\";\n\
    display.cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options\n\
      .cursorHeight + \"px\";\n\
    display.cursor.style.display = \"\";\n\
\n\
    if (pos.other) {\n\
      display.otherCursor.style.display = \"\";\n\
      display.otherCursor.style.left = pos.other.left + \"px\";\n\
      display.otherCursor.style.top = pos.other.top + \"px\";\n\
      display.otherCursor.style.height = (pos.other.bottom - pos.other.top) *\n\
        .85 + \"px\";\n\
    } else {\n\
      display.otherCursor.style.display = \"none\";\n\
    }\n\
  }\n\
\n\
  // Highlight selection\n\
  function updateSelectionRange(cm) {\n\
    var display = cm.display,\n\
      doc = cm.doc,\n\
      sel = cm.doc.sel;\n\
    var fragment = document.createDocumentFragment();\n\
    var clientWidth = display.lineSpace.offsetWidth,\n\
      pl = paddingLeft(cm.display);\n\
\n\
    function add(left, top, width, bottom) {\n\
      if (top < 0) top = 0;\n\
      fragment.appendChild(elt(\"div\", null, \"CodeMirror-selected\",\n\
        \"position: absolute; left: \" + left +\n\
        \"px; top: \" + top + \"px; width: \" + (width == null ? clientWidth -\n\
          left : width) +\n\
        \"px; height: \" + (bottom - top) + \"px\"));\n\
    }\n\
\n\
    function drawForLine(line, fromArg, toArg) {\n\
      var lineObj = getLine(doc, line);\n\
      var lineLen = lineObj.text.length;\n\
      var start, end;\n\
\n\
      function coords(ch, bias) {\n\
        return charCoords(cm, Pos(line, ch), \"div\", lineObj, bias);\n\
      }\n\
\n\
      iterateBidiSections(getOrder(lineObj), fromArg || 0, toArg == null ?\n\
        lineLen : toArg, function(from, to, dir) {\n\
          var leftPos = coords(from, \"left\"),\n\
            rightPos, left, right;\n\
          if (from == to) {\n\
            rightPos = leftPos;\n\
            left = right = leftPos.left;\n\
          } else {\n\
            rightPos = coords(to - 1, \"right\");\n\
            if (dir == \"rtl\") {\n\
              var tmp = leftPos;\n\
              leftPos = rightPos;\n\
              rightPos = tmp;\n\
            }\n\
            left = leftPos.left;\n\
            right = rightPos.right;\n\
          }\n\
          if (fromArg == null && from == 0) left = pl;\n\
          if (rightPos.top - leftPos.top > 3) { // Different lines, draw top part\n\
            add(left, leftPos.top, null, leftPos.bottom);\n\
            left = pl;\n\
            if (leftPos.bottom < rightPos.top) add(left, leftPos.bottom, null,\n\
              rightPos.top);\n\
          }\n\
          if (toArg == null && to == lineLen) right = clientWidth;\n\
          if (!start || leftPos.top < start.top || leftPos.top == start.top &&\n\
            leftPos.left < start.left)\n\
            start = leftPos;\n\
          if (!end || rightPos.bottom > end.bottom || rightPos.bottom == end.bottom &&\n\
            rightPos.right > end.right)\n\
            end = rightPos;\n\
          if (left < pl + 1) left = pl;\n\
          add(left, rightPos.top, right - left, rightPos.bottom);\n\
        });\n\
      return {\n\
        start: start,\n\
        end: end\n\
      };\n\
    }\n\
\n\
    if (sel.from.line == sel.to.line) {\n\
      drawForLine(sel.from.line, sel.from.ch, sel.to.ch);\n\
    } else {\n\
      var fromLine = getLine(doc, sel.from.line),\n\
        toLine = getLine(doc, sel.to.line);\n\
      var singleVLine = visualLine(doc, fromLine) == visualLine(doc, toLine);\n\
      var leftEnd = drawForLine(sel.from.line, sel.from.ch, singleVLine ?\n\
        fromLine.text.length : null)\n\
        .end;\n\
      var rightStart = drawForLine(sel.to.line, singleVLine ? 0 : null, sel.to\n\
        .ch)\n\
        .start;\n\
      if (singleVLine) {\n\
        if (leftEnd.top < rightStart.top - 2) {\n\
          add(leftEnd.right, leftEnd.top, null, leftEnd.bottom);\n\
          add(pl, rightStart.top, rightStart.left, rightStart.bottom);\n\
        } else {\n\
          add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right,\n\
            leftEnd.bottom);\n\
        }\n\
      }\n\
      if (leftEnd.bottom < rightStart.top)\n\
        add(pl, leftEnd.bottom, null, rightStart.top);\n\
    }\n\
\n\
    removeChildrenAndAdd(display.selectionDiv, fragment);\n\
    display.selectionDiv.style.display = \"\";\n\
  }\n\
\n\
  // Cursor-blinking\n\
  function restartBlink(cm) {\n\
    if (!cm.state.focused) return;\n\
    var display = cm.display;\n\
    clearInterval(display.blinker);\n\
    var on = true;\n\
    display.cursor.style.visibility = display.otherCursor.style.visibility =\n\
      \"\";\n\
    if (cm.options.cursorBlinkRate > 0)\n\
      display.blinker = setInterval(function() {\n\
        display.cursor.style.visibility = display.otherCursor.style.visibility =\n\
          (on = !on) ? \"\" : \"hidden\";\n\
      }, cm.options.cursorBlinkRate);\n\
  }\n\
\n\
  // HIGHLIGHT WORKER\n\
\n\
  function startWorker(cm, time) {\n\
    if (cm.doc.mode.startState && cm.doc.frontier < cm.display.showingTo)\n\
      cm.state.highlight.set(time, bind(highlightWorker, cm));\n\
  }\n\
\n\
  function highlightWorker(cm) {\n\
    var doc = cm.doc;\n\
    if (doc.frontier < doc.first) doc.frontier = doc.first;\n\
    if (doc.frontier >= cm.display.showingTo) return;\n\
    var end = +new Date + cm.options.workTime;\n\
    var state = copyState(doc.mode, getStateBefore(cm, doc.frontier));\n\
    var changed = [],\n\
      prevChange;\n\
    doc.iter(doc.frontier, Math.min(doc.first + doc.size, cm.display.showingTo +\n\
      500), function(line) {\n\
      if (doc.frontier >= cm.display.showingFrom) { // Visible\n\
        var oldStyles = line.styles;\n\
        line.styles = highlightLine(cm, line, state, true);\n\
        var ischange = !oldStyles || oldStyles.length != line.styles.length;\n\
        for (var i = 0; !ischange && i < oldStyles.length; ++i) ischange =\n\
          oldStyles[i] != line.styles[i];\n\
        if (ischange) {\n\
          if (prevChange && prevChange.end == doc.frontier) prevChange.end++;\n\
          else changed.push(prevChange = {\n\
            start: doc.frontier,\n\
            end: doc.frontier + 1\n\
          });\n\
        }\n\
        line.stateAfter = copyState(doc.mode, state);\n\
      } else {\n\
        processLine(cm, line.text, state);\n\
        line.stateAfter = doc.frontier % 5 == 0 ? copyState(doc.mode, state) :\n\
          null;\n\
      }\n\
      ++doc.frontier;\n\
      if (+new Date > end) {\n\
        startWorker(cm, cm.options.workDelay);\n\
        return true;\n\
      }\n\
    });\n\
    if (changed.length)\n\
      operation(cm, function() {\n\
        for (var i = 0; i < changed.length; ++i)\n\
          regChange(this, changed[i].start, changed[i].end);\n\
      })();\n\
  }\n\
\n\
  // Finds the line to start with when starting a parse. Tries to\n\
  // find a line with a stateAfter, so that it can start with a\n\
  // valid state. If that fails, it returns the line with the\n\
  // smallest indentation, which tends to need the least context to\n\
  // parse correctly.\n\
  function findStartLine(cm, n, precise) {\n\
    var minindent, minline, doc = cm.doc;\n\
    var lim = precise ? -1 : n - (cm.doc.mode.innerMode ? 1000 : 100);\n\
    for (var search = n; search > lim; --search) {\n\
      if (search <= doc.first) return doc.first;\n\
      var line = getLine(doc, search - 1);\n\
      if (line.stateAfter && (!precise || search <= doc.frontier)) return search;\n\
      var indented = countColumn(line.text, null, cm.options.tabSize);\n\
      if (minline == null || minindent > indented) {\n\
        minline = search - 1;\n\
        minindent = indented;\n\
      }\n\
    }\n\
    return minline;\n\
  }\n\
\n\
  function getStateBefore(cm, n, precise) {\n\
    var doc = cm.doc,\n\
      display = cm.display;\n\
    if (!doc.mode.startState) return true;\n\
    var pos = findStartLine(cm, n, precise),\n\
      state = pos > doc.first && getLine(doc, pos - 1)\n\
        .stateAfter;\n\
    if (!state) state = startState(doc.mode);\n\
    else state = copyState(doc.mode, state);\n\
    doc.iter(pos, n, function(line) {\n\
      processLine(cm, line.text, state);\n\
      var save = pos == n - 1 || pos % 5 == 0 || pos >= display.showingFrom &&\n\
        pos < display.showingTo;\n\
      line.stateAfter = save ? copyState(doc.mode, state) : null;\n\
      ++pos;\n\
    });\n\
    if (precise) doc.frontier = pos;\n\
    return state;\n\
  }\n\
\n\
  // POSITION MEASUREMENT\n\
\n\
  function paddingTop(display) {\n\
    return display.lineSpace.offsetTop;\n\
  }\n\
\n\
  function paddingVert(display) {\n\
    return display.mover.offsetHeight - display.lineSpace.offsetHeight;\n\
  }\n\
\n\
  function paddingLeft(display) {\n\
    var e = removeChildrenAndAdd(display.measure, elt(\"pre\", null, null,\n\
      \"text-align: left\"))\n\
      .appendChild(elt(\"span\", \"x\"));\n\
    return e.offsetLeft;\n\
  }\n\
\n\
  function measureChar(cm, line, ch, data, bias) {\n\
    var dir = -1;\n\
    data = data || measureLine(cm, line);\n\
    if (data.crude) {\n\
      var left = data.left + ch * data.width;\n\
      return {\n\
        left: left,\n\
        right: left + data.width,\n\
        top: data.top,\n\
        bottom: data.bottom\n\
      };\n\
    }\n\
\n\
    for (var pos = ch;; pos += dir) {\n\
      var r = data[pos];\n\
      if (r) break;\n\
      if (dir < 0 && pos == 0) dir = 1;\n\
    }\n\
    bias = pos > ch ? \"left\" : pos < ch ? \"right\" : bias;\n\
    if (bias == \"left\" && r.leftSide) r = r.leftSide;\n\
    else if (bias == \"right\" && r.rightSide) r = r.rightSide;\n\
    return {\n\
      left: pos < ch ? r.right : r.left,\n\
      right: pos > ch ? r.left : r.right,\n\
      top: r.top,\n\
      bottom: r.bottom\n\
    };\n\
  }\n\
\n\
  function findCachedMeasurement(cm, line) {\n\
    var cache = cm.display.measureLineCache;\n\
    for (var i = 0; i < cache.length; ++i) {\n\
      var memo = cache[i];\n\
      if (memo.text == line.text && memo.markedSpans == line.markedSpans &&\n\
        cm.display.scroller.clientWidth == memo.width &&\n\
        memo.classes == line.textClass + \"|\" + line.wrapClass)\n\
        return memo;\n\
    }\n\
  }\n\
\n\
  function clearCachedMeasurement(cm, line) {\n\
    var exists = findCachedMeasurement(cm, line);\n\
    if (exists) exists.text = exists.measure = exists.markedSpans = null;\n\
  }\n\
\n\
  function measureLine(cm, line) {\n\
    // First look in the cache\n\
    var cached = findCachedMeasurement(cm, line);\n\
    if (cached) return cached.measure;\n\
\n\
    // Failing that, recompute and store result in cache\n\
    var measure = measureLineInner(cm, line);\n\
    var cache = cm.display.measureLineCache;\n\
    var memo = {\n\
      text: line.text,\n\
      width: cm.display.scroller.clientWidth,\n\
      markedSpans: line.markedSpans,\n\
      measure: measure,\n\
      classes: line.textClass + \"|\" + line.wrapClass\n\
    };\n\
    if (cache.length == 16) cache[++cm.display.measureLineCachePos % 16] =\n\
      memo;\n\
    else cache.push(memo);\n\
    return measure;\n\
  }\n\
\n\
  function measureLineInner(cm, line) {\n\
    if (!cm.options.lineWrapping && line.text.length >= cm.options.crudeMeasuringFrom)\n\
      return crudelyMeasureLine(cm, line);\n\
\n\
    var display = cm.display,\n\
      measure = emptyArray(line.text.length);\n\
    var pre = buildLineContent(cm, line, measure, true)\n\
      .pre;\n\
\n\
    // IE does not cache element positions of inline elements between\n\
    // calls to getBoundingClientRect. This makes the loop below,\n\
    // which gathers the positions of all the characters on the line,\n\
    // do an amount of layout work quadratic to the number of\n\
    // characters. When line wrapping is off, we try to improve things\n\
    // by first subdividing the line into a bunch of inline blocks, so\n\
    // that IE can reuse most of the layout information from caches\n\
    // for those blocks. This does interfere with line wrapping, so it\n\
    // doesn't work when wrapping is on, but in that case the\n\
    // situation is slightly better, since IE does cache line-wrapping\n\
    // information and only recomputes per-line.\n\
    if (ie && !ie_lt8 && !cm.options.lineWrapping && pre.childNodes.length >\n\
      100) {\n\
      var fragment = document.createDocumentFragment();\n\
      var chunk = 10,\n\
        n = pre.childNodes.length;\n\
      for (var i = 0, chunks = Math.ceil(n / chunk); i < chunks; ++i) {\n\
        var wrap = elt(\"div\", null, null, \"display: inline-block\");\n\
        for (var j = 0; j < chunk && n; ++j) {\n\
          wrap.appendChild(pre.firstChild);\n\
          --n;\n\
        }\n\
        fragment.appendChild(wrap);\n\
      }\n\
      pre.appendChild(fragment);\n\
    }\n\
\n\
    removeChildrenAndAdd(display.measure, pre);\n\
\n\
    var outer = getRect(display.lineDiv);\n\
    var vranges = [],\n\
      data = emptyArray(line.text.length),\n\
      maxBot = pre.offsetHeight;\n\
    // Work around an IE7/8 bug where it will sometimes have randomly\n\
    // replaced our pre with a clone at this point.\n\
    if (ie_lt9 && display.measure.first != pre)\n\
      removeChildrenAndAdd(display.measure, pre);\n\
\n\
    function measureRect(rect) {\n\
      var top = rect.top - outer.top,\n\
        bot = rect.bottom - outer.top;\n\
      if (bot > maxBot) bot = maxBot;\n\
      if (top < 0) top = 0;\n\
      for (var i = vranges.length - 2; i >= 0; i -= 2) {\n\
        var rtop = vranges[i],\n\
          rbot = vranges[i + 1];\n\
        if (rtop > bot || rbot < top) continue;\n\
        if (rtop <= top && rbot >= bot ||\n\
          top <= rtop && bot >= rbot ||\n\
          Math.min(bot, rbot) - Math.max(top, rtop) >= (bot - top) >> 1) {\n\
          vranges[i] = Math.min(top, rtop);\n\
          vranges[i + 1] = Math.max(bot, rbot);\n\
          break;\n\
        }\n\
      }\n\
      if (i < 0) {\n\
        i = vranges.length;\n\
        vranges.push(top, bot);\n\
      }\n\
      return {\n\
        left: rect.left - outer.left,\n\
        right: rect.right - outer.left,\n\
        top: i,\n\
        bottom: null\n\
      };\n\
    }\n\
\n\
    function finishRect(rect) {\n\
      rect.bottom = vranges[rect.top + 1];\n\
      rect.top = vranges[rect.top];\n\
    }\n\
\n\
    for (var i = 0, cur; i < measure.length; ++i)\n\
      if (cur = measure[i]) {\n\
        var node = cur,\n\
          rect = null;\n\
        // A widget might wrap, needs special care\n\
        if (/\\bCodeMirror-widget\\b/.test(cur.className) && cur.getClientRects) {\n\
          if (cur.firstChild.nodeType == 1) node = cur.firstChild;\n\
          var rects = node.getClientRects();\n\
          if (rects.length > 1) {\n\
            rect = data[i] = measureRect(rects[0]);\n\
            rect.rightSide = measureRect(rects[rects.length - 1]);\n\
          }\n\
        }\n\
        if (!rect) rect = data[i] = measureRect(getRect(node));\n\
        if (cur.measureRight) rect.right = getRect(cur.measureRight)\n\
          .left - outer.left;\n\
        if (cur.leftSide) rect.leftSide = measureRect(getRect(cur.leftSide));\n\
      }\n\
    removeChildren(cm.display.measure);\n\
    for (var i = 0, cur; i < data.length; ++i)\n\
      if (cur = data[i]) {\n\
        finishRect(cur);\n\
        if (cur.leftSide) finishRect(cur.leftSide);\n\
        if (cur.rightSide) finishRect(cur.rightSide);\n\
      }\n\
    return data;\n\
  }\n\
\n\
  function crudelyMeasureLine(cm, line) {\n\
    var copy = new Line(line.text.slice(0, 100), null);\n\
    if (line.textClass) copy.textClass = line.textClass;\n\
    var measure = measureLineInner(cm, copy);\n\
    var left = measureChar(cm, copy, 0, measure, \"left\");\n\
    var right = measureChar(cm, copy, 99, measure, \"right\");\n\
    return {\n\
      crude: true,\n\
      top: left.top,\n\
      left: left.left,\n\
      bottom: left.bottom,\n\
      width: (right.right - left.left) / 100\n\
    };\n\
  }\n\
\n\
  function measureLineWidth(cm, line) {\n\
    var hasBadSpan = false;\n\
    if (line.markedSpans)\n\
      for (var i = 0; i < line.markedSpans; ++i) {\n\
        var sp = line.markedSpans[i];\n\
        if (sp.collapsed && (sp.to == null || sp.to == line.text.length))\n\
          hasBadSpan = true;\n\
      }\n\
    var cached = !hasBadSpan && findCachedMeasurement(cm, line);\n\
    if (cached || line.text.length >= cm.options.crudeMeasuringFrom)\n\
      return measureChar(cm, line, line.text.length, cached && cached.measure,\n\
        \"right\")\n\
        .right;\n\
\n\
    var pre = buildLineContent(cm, line, null, true)\n\
      .pre;\n\
    var end = pre.appendChild(zeroWidthElement(cm.display.measure));\n\
    removeChildrenAndAdd(cm.display.measure, pre);\n\
    return getRect(end)\n\
      .right - getRect(cm.display.lineDiv)\n\
      .left;\n\
  }\n\
\n\
  function clearCaches(cm) {\n\
    cm.display.measureLineCache.length = cm.display.measureLineCachePos = 0;\n\
    cm.display.cachedCharWidth = cm.display.cachedTextHeight = null;\n\
    if (!cm.options.lineWrapping) cm.display.maxLineChanged = true;\n\
    cm.display.lineNumChars = null;\n\
  }\n\
\n\
  function pageScrollX() {\n\
    return window.pageXOffset || (document.documentElement || document.body)\n\
      .scrollLeft;\n\
  }\n\
\n\
  function pageScrollY() {\n\
    return window.pageYOffset || (document.documentElement || document.body)\n\
      .scrollTop;\n\
  }\n\
\n\
  // Context is one of \"line\", \"div\" (display.lineDiv), \"local\"/null (editor), or \"page\"\n\
  function intoCoordSystem(cm, lineObj, rect, context) {\n\
    if (lineObj.widgets)\n\
      for (var i = 0; i < lineObj.widgets.length; ++i)\n\
        if (lineObj.widgets[i].above) {\n\
          var size = widgetHeight(lineObj.widgets[i]);\n\
          rect.top += size;\n\
          rect.bottom += size;\n\
        }\n\
    if (context == \"line\") return rect;\n\
    if (!context) context = \"local\";\n\
    var yOff = heightAtLine(cm, lineObj);\n\
    if (context == \"local\") yOff += paddingTop(cm.display);\n\
    else yOff -= cm.display.viewOffset;\n\
    if (context == \"page\" || context == \"window\") {\n\
      var lOff = getRect(cm.display.lineSpace);\n\
      yOff += lOff.top + (context == \"window\" ? 0 : pageScrollY());\n\
      var xOff = lOff.left + (context == \"window\" ? 0 : pageScrollX());\n\
      rect.left += xOff;\n\
      rect.right += xOff;\n\
    }\n\
    rect.top += yOff;\n\
    rect.bottom += yOff;\n\
    return rect;\n\
  }\n\
\n\
  // Context may be \"window\", \"page\", \"div\", or \"local\"/null\n\
  // Result is in \"div\" coords\n\
  function fromCoordSystem(cm, coords, context) {\n\
    if (context == \"div\") return coords;\n\
    var left = coords.left,\n\
      top = coords.top;\n\
    // First move into \"page\" coordinate system\n\
    if (context == \"page\") {\n\
      left -= pageScrollX();\n\
      top -= pageScrollY();\n\
    } else if (context == \"local\" || !context) {\n\
      var localBox = getRect(cm.display.sizer);\n\
      left += localBox.left;\n\
      top += localBox.top;\n\
    }\n\
\n\
    var lineSpaceBox = getRect(cm.display.lineSpace);\n\
    return {\n\
      left: left - lineSpaceBox.left,\n\
      top: top - lineSpaceBox.top\n\
    };\n\
  }\n\
\n\
  function charCoords(cm, pos, context, lineObj, bias) {\n\
    if (!lineObj) lineObj = getLine(cm.doc, pos.line);\n\
    return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, null,\n\
      bias), context);\n\
  }\n\
\n\
  function cursorCoords(cm, pos, context, lineObj, measurement) {\n\
    lineObj = lineObj || getLine(cm.doc, pos.line);\n\
    if (!measurement) measurement = measureLine(cm, lineObj);\n\
\n\
    function get(ch, right) {\n\
      var m = measureChar(cm, lineObj, ch, measurement, right ? \"right\" :\n\
        \"left\");\n\
      if (right) m.left = m.right;\n\
      else m.right = m.left;\n\
      return intoCoordSystem(cm, lineObj, m, context);\n\
    }\n\
\n\
    function getBidi(ch, partPos) {\n\
      var part = order[partPos],\n\
        right = part.level % 2;\n\
      if (ch == bidiLeft(part) && partPos && part.level < order[partPos - 1].level) {\n\
        part = order[--partPos];\n\
        ch = bidiRight(part) - (part.level % 2 ? 0 : 1);\n\
        right = true;\n\
      } else if (ch == bidiRight(part) && partPos < order.length - 1 && part.level <\n\
        order[partPos + 1].level) {\n\
        part = order[++partPos];\n\
        ch = bidiLeft(part) - part.level % 2;\n\
        right = false;\n\
      }\n\
      if (right && ch == part.to && ch > part.from) return get(ch - 1);\n\
      return get(ch, right);\n\
    }\n\
    var order = getOrder(lineObj),\n\
      ch = pos.ch;\n\
    if (!order) return get(ch);\n\
    var partPos = getBidiPartAt(order, ch);\n\
    var val = getBidi(ch, partPos);\n\
    if (bidiOther != null) val.other = getBidi(ch, bidiOther);\n\
    return val;\n\
  }\n\
\n\
  function PosWithInfo(line, ch, outside, xRel) {\n\
    var pos = new Pos(line, ch);\n\
    pos.xRel = xRel;\n\
    if (outside) pos.outside = true;\n\
    return pos;\n\
  }\n\
\n\
  // Coords must be lineSpace-local\n\
  function coordsChar(cm, x, y) {\n\
    var doc = cm.doc;\n\
    y += cm.display.viewOffset;\n\
    if (y < 0) return PosWithInfo(doc.first, 0, true, -1);\n\
    var lineNo = lineAtHeight(doc, y),\n\
      last = doc.first + doc.size - 1;\n\
    if (lineNo > last)\n\
      return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last)\n\
        .text.length, true, 1);\n\
    if (x < 0) x = 0;\n\
\n\
    for (;;) {\n\
      var lineObj = getLine(doc, lineNo);\n\
      var found = coordsCharInner(cm, lineObj, lineNo, x, y);\n\
      var merged = collapsedSpanAtEnd(lineObj);\n\
      var mergedPos = merged && merged.find();\n\
      if (merged && (found.ch > mergedPos.from.ch || found.ch == mergedPos.from\n\
        .ch && found.xRel > 0))\n\
        lineNo = mergedPos.to.line;\n\
      else\n\
        return found;\n\
    }\n\
  }\n\
\n\
  function coordsCharInner(cm, lineObj, lineNo, x, y) {\n\
    var innerOff = y - heightAtLine(cm, lineObj);\n\
    var wrongLine = false,\n\
      adjust = 2 * cm.display.wrapper.clientWidth;\n\
    var measurement = measureLine(cm, lineObj);\n\
\n\
    function getX(ch) {\n\
      var sp = cursorCoords(cm, Pos(lineNo, ch), \"line\",\n\
        lineObj, measurement);\n\
      wrongLine = true;\n\
      if (innerOff > sp.bottom) return sp.left - adjust;\n\
      else if (innerOff < sp.top) return sp.left + adjust;\n\
      else wrongLine = false;\n\
      return sp.left;\n\
    }\n\
\n\
    var bidi = getOrder(lineObj),\n\
      dist = lineObj.text.length;\n\
    var from = lineLeft(lineObj),\n\
      to = lineRight(lineObj);\n\
    var fromX = getX(from),\n\
      fromOutside = wrongLine,\n\
      toX = getX(to),\n\
      toOutside = wrongLine;\n\
\n\
    if (x > toX) return PosWithInfo(lineNo, to, toOutside, 1);\n\
    // Do a binary search between these bounds.\n\
    for (;;) {\n\
      if (bidi ? to == from || to == moveVisually(lineObj, from, 1) : to -\n\
        from <= 1) {\n\
        var ch = x < fromX || x - fromX <= toX - x ? from : to;\n\
        var xDiff = x - (ch == from ? fromX : toX);\n\
        while (isExtendingChar.test(lineObj.text.charAt(ch)))++ch;\n\
        var pos = PosWithInfo(lineNo, ch, ch == from ? fromOutside :\n\
          toOutside,\n\
          xDiff < 0 ? -1 : xDiff ? 1 : 0);\n\
        return pos;\n\
      }\n\
      var step = Math.ceil(dist / 2),\n\
        middle = from + step;\n\
      if (bidi) {\n\
        middle = from;\n\
        for (var i = 0; i < step; ++i) middle = moveVisually(lineObj, middle,\n\
          1);\n\
      }\n\
      var middleX = getX(middle);\n\
      if (middleX > x) {\n\
        to = middle;\n\
        toX = middleX;\n\
        if (toOutside = wrongLine) toX += 1000;\n\
        dist = step;\n\
      } else {\n\
        from = middle;\n\
        fromX = middleX;\n\
        fromOutside = wrongLine;\n\
        dist -= step;\n\
      }\n\
    }\n\
  }\n\
\n\
  var measureText;\n\
\n\
  function textHeight(display) {\n\
    if (display.cachedTextHeight != null) return display.cachedTextHeight;\n\
    if (measureText == null) {\n\
      measureText = elt(\"pre\");\n\
      // Measure a bunch of lines, for browsers that compute\n\
      // fractional heights.\n\
      for (var i = 0; i < 49; ++i) {\n\
        measureText.appendChild(document.createTextNode(\"x\"));\n\
        measureText.appendChild(elt(\"br\"));\n\
      }\n\
      measureText.appendChild(document.createTextNode(\"x\"));\n\
    }\n\
    removeChildrenAndAdd(display.measure, measureText);\n\
    var height = measureText.offsetHeight / 50;\n\
    if (height > 3) display.cachedTextHeight = height;\n\
    removeChildren(display.measure);\n\
    return height || 1;\n\
  }\n\
\n\
  function charWidth(display) {\n\
    if (display.cachedCharWidth != null) return display.cachedCharWidth;\n\
    var anchor = elt(\"span\", \"x\");\n\
    var pre = elt(\"pre\", [anchor]);\n\
    removeChildrenAndAdd(display.measure, pre);\n\
    var width = anchor.offsetWidth;\n\
    if (width > 2) display.cachedCharWidth = width;\n\
    return width || 10;\n\
  }\n\
\n\
  // OPERATIONS\n\
\n\
  // Operations are used to wrap changes in such a way that each\n\
  // change won't have to update the cursor and display (which would\n\
  // be awkward, slow, and error-prone), but instead updates are\n\
  // batched and then all combined and executed at once.\n\
\n\
  var nextOpId = 0;\n\
\n\
  function startOperation(cm) {\n\
    cm.curOp = {\n\
      // An array of ranges of lines that have to be updated. See\n\
      // updateDisplay.\n\
      changes: [],\n\
      forceUpdate: false,\n\
      updateInput: null,\n\
      userSelChange: null,\n\
      textChanged: null,\n\
      selectionChanged: false,\n\
      cursorActivity: false,\n\
      updateMaxLine: false,\n\
      updateScrollPos: false,\n\
      id: ++nextOpId\n\
    };\n\
    if (!delayedCallbackDepth++) delayedCallbacks = [];\n\
  }\n\
\n\
  function endOperation(cm) {\n\
    var op = cm.curOp,\n\
      doc = cm.doc,\n\
      display = cm.display;\n\
    cm.curOp = null;\n\
\n\
    if (op.updateMaxLine) computeMaxLength(cm);\n\
    if (display.maxLineChanged && !cm.options.lineWrapping && display.maxLine) {\n\
      var width = measureLineWidth(cm, display.maxLine);\n\
      display.sizer.style.minWidth = Math.max(0, width + 3 + scrollerCutOff) +\n\
        \"px\";\n\
      display.maxLineChanged = false;\n\
      var maxScrollLeft = Math.max(0, display.sizer.offsetLeft + display.sizer\n\
        .offsetWidth - display.scroller.clientWidth);\n\
      if (maxScrollLeft < doc.scrollLeft && !op.updateScrollPos)\n\
        setScrollLeft(cm, Math.min(display.scroller.scrollLeft, maxScrollLeft),\n\
          true);\n\
    }\n\
    var newScrollPos, updated;\n\
    if (op.updateScrollPos) {\n\
      newScrollPos = op.updateScrollPos;\n\
    } else if (op.selectionChanged && display.scroller.clientHeight) { // don't rescroll if not visible\n\
      var coords = cursorCoords(cm, doc.sel.head);\n\
      newScrollPos = calculateScrollPos(cm, coords.left, coords.top, coords.left,\n\
        coords.bottom);\n\
    }\n\
    if (op.changes.length || op.forceUpdate || newScrollPos && newScrollPos.scrollTop !=\n\
      null) {\n\
      updated = updateDisplay(cm, op.changes, newScrollPos && newScrollPos.scrollTop,\n\
        op.forceUpdate);\n\
      if (cm.display.scroller.offsetHeight) cm.doc.scrollTop = cm.display.scroller\n\
        .scrollTop;\n\
    }\n\
    if (!updated && op.selectionChanged) updateSelection(cm);\n\
    if (op.updateScrollPos) {\n\
      var top = Math.max(0, Math.min(display.scroller.scrollHeight - display.scroller\n\
        .clientHeight, newScrollPos.scrollTop));\n\
      var left = Math.max(0, Math.min(display.scroller.scrollWidth - display.scroller\n\
        .clientWidth, newScrollPos.scrollLeft));\n\
      display.scroller.scrollTop = display.scrollbarV.scrollTop = doc.scrollTop =\n\
        top;\n\
      display.scroller.scrollLeft = display.scrollbarH.scrollLeft = doc.scrollLeft =\n\
        left;\n\
      alignHorizontally(cm);\n\
      if (op.scrollToPos)\n\
        scrollPosIntoView(cm, clipPos(cm.doc, op.scrollToPos.from),\n\
          clipPos(cm.doc, op.scrollToPos.to), op.scrollToPos.margin);\n\
    } else if (newScrollPos) {\n\
      scrollCursorIntoView(cm);\n\
    }\n\
    if (op.selectionChanged) restartBlink(cm);\n\
\n\
    if (cm.state.focused && op.updateInput)\n\
      resetInput(cm, op.userSelChange);\n\
\n\
    var hidden = op.maybeHiddenMarkers,\n\
      unhidden = op.maybeUnhiddenMarkers;\n\
    if (hidden)\n\
      for (var i = 0; i < hidden.length; ++i)\n\
        if (!hidden[i].lines.length) signal(hidden[i], \"hide\");\n\
    if (unhidden)\n\
      for (var i = 0; i < unhidden.length; ++i)\n\
        if (unhidden[i].lines.length) signal(unhidden[i], \"unhide\");\n\
\n\
    var delayed;\n\
    if (!--delayedCallbackDepth) {\n\
      delayed = delayedCallbacks;\n\
      delayedCallbacks = null;\n\
    }\n\
    if (op.textChanged)\n\
      signal(cm, \"change\", cm, op.textChanged);\n\
    if (op.cursorActivity) signal(cm, \"cursorActivity\", cm);\n\
    if (delayed)\n\
      for (var i = 0; i < delayed.length; ++i) delayed[i]();\n\
  }\n\
\n\
  // Wraps a function in an operation. Returns the wrapped function.\n\
  function operation(cm1, f) {\n\
    return function() {\n\
      var cm = cm1 || this,\n\
        withOp = !cm.curOp;\n\
      if (withOp) startOperation(cm);\n\
      try {\n\
        var result = f.apply(cm, arguments);\n\
      } finally {\n\
        if (withOp) endOperation(cm);\n\
      }\n\
      return result;\n\
    };\n\
  }\n\
\n\
  function docOperation(f) {\n\
    return function() {\n\
      var withOp = this.cm && !this.cm.curOp,\n\
        result;\n\
      if (withOp) startOperation(this.cm);\n\
      try {\n\
        result = f.apply(this, arguments);\n\
      } finally {\n\
        if (withOp) endOperation(this.cm);\n\
      }\n\
      return result;\n\
    };\n\
  }\n\
\n\
  function runInOp(cm, f) {\n\
    var withOp = !cm.curOp,\n\
      result;\n\
    if (withOp) startOperation(cm);\n\
    try {\n\
      result = f();\n\
    } finally {\n\
      if (withOp) endOperation(cm);\n\
    }\n\
    return result;\n\
  }\n\
\n\
  function regChange(cm, from, to, lendiff) {\n\
    if (from == null) from = cm.doc.first;\n\
    if (to == null) to = cm.doc.first + cm.doc.size;\n\
    cm.curOp.changes.push({\n\
      from: from,\n\
      to: to,\n\
      diff: lendiff\n\
    });\n\
  }\n\
\n\
  // INPUT HANDLING\n\
\n\
  function slowPoll(cm) {\n\
    if (cm.display.pollingFast) return;\n\
    cm.display.poll.set(cm.options.pollInterval, function() {\n\
      readInput(cm);\n\
      if (cm.state.focused) slowPoll(cm);\n\
    });\n\
  }\n\
\n\
  function fastPoll(cm) {\n\
    var missed = false;\n\
    cm.display.pollingFast = true;\n\
\n\
    function p() {\n\
      var changed = readInput(cm);\n\
      if (!changed && !missed) {\n\
        missed = true;\n\
        cm.display.poll.set(60, p);\n\
      } else {\n\
        cm.display.pollingFast = false;\n\
        slowPoll(cm);\n\
      }\n\
    }\n\
    cm.display.poll.set(20, p);\n\
  }\n\
\n\
  // prevInput is a hack to work with IME. If we reset the textarea\n\
  // on every change, that breaks IME. So we look for changes\n\
  // compared to the previous content instead. (Modern browsers have\n\
  // events that indicate IME taking place, but these are not widely\n\
  // supported or compatible enough yet to rely on.)\n\
  function readInput(cm) {\n\
    var input = cm.display.input,\n\
      prevInput = cm.display.prevInput,\n\
      doc = cm.doc,\n\
      sel = doc.sel;\n\
    if (!cm.state.focused || hasSelection(input) || isReadOnly(cm) || cm.state\n\
      .disableInput) return false;\n\
    if (cm.state.pasteIncoming && cm.state.fakedLastChar) {\n\
      input.value = input.value.substring(0, input.value.length - 1);\n\
      cm.state.fakedLastChar = false;\n\
    }\n\
    var text = input.value;\n\
    if (text == prevInput && posEq(sel.from, sel.to)) return false;\n\
    if (ie && !ie_lt9 && cm.display.inputHasSelection === text) {\n\
      resetInput(cm, true);\n\
      return false;\n\
    }\n\
\n\
    var withOp = !cm.curOp;\n\
    if (withOp) startOperation(cm);\n\
    sel.shift = false;\n\
    var same = 0,\n\
      l = Math.min(prevInput.length, text.length);\n\
    while (same < l && prevInput.charCodeAt(same) == text.charCodeAt(same))++\n\
    same;\n\
    var from = sel.from,\n\
      to = sel.to;\n\
    if (same < prevInput.length)\n\
      from = Pos(from.line, from.ch - (prevInput.length - same));\n\
    else if (cm.state.overwrite && posEq(from, to) && !cm.state.pasteIncoming)\n\
      to = Pos(to.line, Math.min(getLine(doc, to.line)\n\
        .text.length, to.ch + (text.length - same)));\n\
\n\
    var updateInput = cm.curOp.updateInput;\n\
    var changeEvent = {\n\
      from: from,\n\
      to: to,\n\
      text: splitLines(text.slice(same)),\n\
      origin: cm.state.pasteIncoming ? \"paste\" : \"+input\"\n\
    };\n\
    makeChange(cm.doc, changeEvent, \"end\");\n\
    cm.curOp.updateInput = updateInput;\n\
    signalLater(cm, \"inputRead\", cm, changeEvent);\n\
\n\
    if (text.length > 1000 || text.indexOf(\"\\n\
\") > -1) input.value = cm.display\n\
      .prevInput = \"\";\n\
    else cm.display.prevInput = text;\n\
    if (withOp) endOperation(cm);\n\
    cm.state.pasteIncoming = false;\n\
    return true;\n\
  }\n\
\n\
  function resetInput(cm, user) {\n\
    var minimal, selected, doc = cm.doc;\n\
    if (!posEq(doc.sel.from, doc.sel.to)) {\n\
      cm.display.prevInput = \"\";\n\
      minimal = hasCopyEvent &&\n\
        (doc.sel.to.line - doc.sel.from.line > 100 || (selected = cm.getSelection())\n\
        .length > 1000);\n\
      var content = minimal ? \"-\" : selected || cm.getSelection();\n\
      cm.display.input.value = content;\n\
      if (cm.state.focused) selectInput(cm.display.input);\n\
      if (ie && !ie_lt9) cm.display.inputHasSelection = content;\n\
    } else if (user) {\n\
      cm.display.prevInput = cm.display.input.value = \"\";\n\
      if (ie && !ie_lt9) cm.display.inputHasSelection = null;\n\
    }\n\
    cm.display.inaccurateSelection = minimal;\n\
  }\n\
\n\
  function focusInput(cm) {\n\
    if (cm.options.readOnly != \"nocursor\" && (!mobile || document.activeElement !=\n\
      cm.display.input))\n\
      cm.display.input.focus();\n\
  }\n\
\n\
  function isReadOnly(cm) {\n\
    return cm.options.readOnly || cm.doc.cantEdit;\n\
  }\n\
\n\
  // EVENT HANDLERS\n\
\n\
  function registerEventHandlers(cm) {\n\
    var d = cm.display;\n\
    on(d.scroller, \"mousedown\", operation(cm, onMouseDown));\n\
    if (ie)\n\
      on(d.scroller, \"dblclick\", operation(cm, function(e) {\n\
        if (signalDOMEvent(cm, e)) return;\n\
        var pos = posFromMouse(cm, e);\n\
        if (!pos || clickInGutter(cm, e) || eventInWidget(cm.display, e))\n\
          return;\n\
        e_preventDefault(e);\n\
        var word = findWordAt(getLine(cm.doc, pos.line)\n\
          .text, pos);\n\
        extendSelection(cm.doc, word.from, word.to);\n\
      }));\n\
    else\n\
      on(d.scroller, \"dblclick\", function(e) {\n\
        signalDOMEvent(cm, e) || e_preventDefault(e);\n\
      });\n\
    on(d.lineSpace, \"selectstart\", function(e) {\n\
      if (!eventInWidget(d, e)) e_preventDefault(e);\n\
    });\n\
    // Gecko browsers fire contextmenu *after* opening the menu, at\n\
    // which point we can't mess with it anymore. Context menu is\n\
    // handled in onMouseDown for Gecko.\n\
    if (!captureMiddleClick) on(d.scroller, \"contextmenu\", function(e) {\n\
      onContextMenu(cm, e);\n\
    });\n\
\n\
    on(d.scroller, \"scroll\", function() {\n\
      if (d.scroller.clientHeight) {\n\
        setScrollTop(cm, d.scroller.scrollTop);\n\
        setScrollLeft(cm, d.scroller.scrollLeft, true);\n\
        signal(cm, \"scroll\", cm);\n\
      }\n\
    });\n\
    on(d.scrollbarV, \"scroll\", function() {\n\
      if (d.scroller.clientHeight) setScrollTop(cm, d.scrollbarV.scrollTop);\n\
    });\n\
    on(d.scrollbarH, \"scroll\", function() {\n\
      if (d.scroller.clientHeight) setScrollLeft(cm, d.scrollbarH.scrollLeft);\n\
    });\n\
\n\
    on(d.scroller, \"mousewheel\", function(e) {\n\
      onScrollWheel(cm, e);\n\
    });\n\
    on(d.scroller, \"DOMMouseScroll\", function(e) {\n\
      onScrollWheel(cm, e);\n\
    });\n\
\n\
    function reFocus() {\n\
      if (cm.state.focused) setTimeout(bind(focusInput, cm), 0);\n\
    }\n\
    on(d.scrollbarH, \"mousedown\", reFocus);\n\
    on(d.scrollbarV, \"mousedown\", reFocus);\n\
    // Prevent wrapper from ever scrolling\n\
    on(d.wrapper, \"scroll\", function() {\n\
      d.wrapper.scrollTop = d.wrapper.scrollLeft = 0;\n\
    });\n\
\n\
    var resizeTimer;\n\
\n\
    function onResize() {\n\
      if (resizeTimer == null) resizeTimer = setTimeout(function() {\n\
        resizeTimer = null;\n\
        // Might be a text scaling operation, clear size caches.\n\
        d.cachedCharWidth = d.cachedTextHeight = knownScrollbarWidth = null;\n\
        clearCaches(cm);\n\
        runInOp(cm, bind(regChange, cm));\n\
      }, 100);\n\
    }\n\
    on(window, \"resize\", onResize);\n\
    // Above handler holds on to the editor and its data structures.\n\
    // Here we poll to unregister it when the editor is no longer in\n\
    // the document, so that it can be garbage-collected.\n\
    function unregister() {\n\
      for (var p = d.wrapper.parentNode; p && p != document.body; p = p.parentNode) {}\n\
      if (p) setTimeout(unregister, 5000);\n\
      else off(window, \"resize\", onResize);\n\
    }\n\
    setTimeout(unregister, 5000);\n\
\n\
    on(d.input, \"keyup\", operation(cm, function(e) {\n\
      if (signalDOMEvent(cm, e) || cm.options.onKeyEvent && cm.options.onKeyEvent(\n\
        cm, addStop(e))) return;\n\
      if (e.keyCode == 16) cm.doc.sel.shift = false;\n\
    }));\n\
    on(d.input, \"input\", function() {\n\
      if (ie && !ie_lt9 && cm.display.inputHasSelection) cm.display.inputHasSelection =\n\
        null;\n\
      fastPoll(cm);\n\
    });\n\
    on(d.input, \"keydown\", operation(cm, onKeyDown));\n\
    on(d.input, \"keypress\", operation(cm, onKeyPress));\n\
    on(d.input, \"focus\", bind(onFocus, cm));\n\
    on(d.input, \"blur\", bind(onBlur, cm));\n\
\n\
    function drag_(e) {\n\
      if (signalDOMEvent(cm, e) || cm.options.onDragEvent && cm.options.onDragEvent(\n\
        cm, addStop(e))) return;\n\
      e_stop(e);\n\
    }\n\
    if (cm.options.dragDrop) {\n\
      on(d.scroller, \"dragstart\", function(e) {\n\
        onDragStart(cm, e);\n\
      });\n\
      on(d.scroller, \"dragenter\", drag_);\n\
      on(d.scroller, \"dragover\", drag_);\n\
      on(d.scroller, \"drop\", operation(cm, onDrop));\n\
    }\n\
    on(d.scroller, \"paste\", function(e) {\n\
      if (eventInWidget(d, e)) return;\n\
      focusInput(cm);\n\
      fastPoll(cm);\n\
    });\n\
    on(d.input, \"paste\", function() {\n\
      // Workaround for webkit bug https://bugs.webkit.org/show_bug.cgi?id=90206\n\
      // Add a char to the end of textarea before paste occur so that\n\
      // selection doesn't span to the end of textarea.\n\
      if (webkit && !cm.state.fakedLastChar && !(new Date - cm.state.lastMiddleDown <\n\
        200)) {\n\
        var start = d.input.selectionStart,\n\
          end = d.input.selectionEnd;\n\
        d.input.value += \"$\";\n\
        d.input.selectionStart = start;\n\
        d.input.selectionEnd = end;\n\
        cm.state.fakedLastChar = true;\n\
      }\n\
      cm.state.pasteIncoming = true;\n\
      fastPoll(cm);\n\
    });\n\
\n\
    function prepareCopy() {\n\
      if (d.inaccurateSelection) {\n\
        d.prevInput = \"\";\n\
        d.inaccurateSelection = false;\n\
        d.input.value = cm.getSelection();\n\
        selectInput(d.input);\n\
      }\n\
    }\n\
    on(d.input, \"cut\", prepareCopy);\n\
    on(d.input, \"copy\", prepareCopy);\n\
\n\
    // Needed to handle Tab key in KHTML\n\
    if (khtml) on(d.sizer, \"mouseup\", function() {\n\
      if (document.activeElement == d.input) d.input.blur();\n\
      focusInput(cm);\n\
    });\n\
  }\n\
\n\
  function eventInWidget(display, e) {\n\
    for (var n = e_target(e); n != display.wrapper; n = n.parentNode) {\n\
      if (!n || n.ignoreEvents || n.parentNode == display.sizer && n !=\n\
        display.mover) return true;\n\
    }\n\
  }\n\
\n\
  function posFromMouse(cm, e, liberal) {\n\
    var display = cm.display;\n\
    if (!liberal) {\n\
      var target = e_target(e);\n\
      if (target == display.scrollbarH || target == display.scrollbarH.firstChild ||\n\
        target == display.scrollbarV || target == display.scrollbarV.firstChild ||\n\
        target == display.scrollbarFiller || target == display.gutterFiller)\n\
        return null;\n\
    }\n\
    var x, y, space = getRect(display.lineSpace);\n\
    // Fails unpredictably on IE[67] when mouse is dragged around quickly.\n\
    try {\n\
      x = e.clientX;\n\
      y = e.clientY;\n\
    } catch (e) {\n\
      return null;\n\
    }\n\
    return coordsChar(cm, x - space.left, y - space.top);\n\
  }\n\
\n\
  var lastClick, lastDoubleClick;\n\
\n\
  function onMouseDown(e) {\n\
    if (signalDOMEvent(this, e)) return;\n\
    var cm = this,\n\
      display = cm.display,\n\
      doc = cm.doc,\n\
      sel = doc.sel;\n\
    sel.shift = e.shiftKey;\n\
\n\
    if (eventInWidget(display, e)) {\n\
      if (!webkit) {\n\
        display.scroller.draggable = false;\n\
        setTimeout(function() {\n\
          display.scroller.draggable = true;\n\
        }, 100);\n\
      }\n\
      return;\n\
    }\n\
    if (clickInGutter(cm, e)) return;\n\
    var start = posFromMouse(cm, e);\n\
\n\
    switch (e_button(e)) {\n\
      case 3:\n\
        if (captureMiddleClick) onContextMenu.call(cm, cm, e);\n\
        return;\n\
      case 2:\n\
        if (webkit) cm.state.lastMiddleDown = +new Date;\n\
        if (start) extendSelection(cm.doc, start);\n\
        setTimeout(bind(focusInput, cm), 20);\n\
        e_preventDefault(e);\n\
        return;\n\
    }\n\
    // For button 1, if it was clicked inside the editor\n\
    // (posFromMouse returning non-null), we have to adjust the\n\
    // selection.\n\
    if (!start) {\n\
      if (e_target(e) == display.scroller) e_preventDefault(e);\n\
      return;\n\
    }\n\
\n\
    if (!cm.state.focused) onFocus(cm);\n\
\n\
    var now = +new Date,\n\
      type = \"single\";\n\
    if (lastDoubleClick && lastDoubleClick.time > now - 400 && posEq(\n\
      lastDoubleClick.pos, start)) {\n\
      type = \"triple\";\n\
      e_preventDefault(e);\n\
      setTimeout(bind(focusInput, cm), 20);\n\
      selectLine(cm, start.line);\n\
    } else if (lastClick && lastClick.time > now - 400 && posEq(lastClick.pos,\n\
      start)) {\n\
      type = \"double\";\n\
      lastDoubleClick = {\n\
        time: now,\n\
        pos: start\n\
      };\n\
      e_preventDefault(e);\n\
      var word = findWordAt(getLine(doc, start.line)\n\
        .text, start);\n\
      extendSelection(cm.doc, word.from, word.to);\n\
    } else {\n\
      lastClick = {\n\
        time: now,\n\
        pos: start\n\
      };\n\
    }\n\
\n\
    var last = start;\n\
    if (cm.options.dragDrop && dragAndDrop && !isReadOnly(cm) && !posEq(sel.from,\n\
        sel.to) && !posLess(start, sel.from) && !posLess(sel.to, start) &&\n\
      type == \"single\") {\n\
      var dragEnd = operation(cm, function(e2) {\n\
        if (webkit) display.scroller.draggable = false;\n\
        cm.state.draggingText = false;\n\
        off(document, \"mouseup\", dragEnd);\n\
        off(display.scroller, \"drop\", dragEnd);\n\
        if (Math.abs(e.clientX - e2.clientX) + Math.abs(e.clientY - e2.clientY) <\n\
          10) {\n\
          e_preventDefault(e2);\n\
          extendSelection(cm.doc, start);\n\
          focusInput(cm);\n\
        }\n\
      });\n\
      // Let the drag handler handle this.\n\
      if (webkit) display.scroller.draggable = true;\n\
      cm.state.draggingText = dragEnd;\n\
      // IE's approach to draggable\n\
      if (display.scroller.dragDrop) display.scroller.dragDrop();\n\
      on(document, \"mouseup\", dragEnd);\n\
      on(display.scroller, \"drop\", dragEnd);\n\
      return;\n\
    }\n\
    e_preventDefault(e);\n\
    if (type == \"single\") extendSelection(cm.doc, clipPos(doc, start));\n\
\n\
    var startstart = sel.from,\n\
      startend = sel.to,\n\
      lastPos = start;\n\
\n\
    function doSelect(cur) {\n\
      if (posEq(lastPos, cur)) return;\n\
      lastPos = cur;\n\
\n\
      if (type == \"single\") {\n\
        extendSelection(cm.doc, clipPos(doc, start), cur);\n\
        return;\n\
      }\n\
\n\
      startstart = clipPos(doc, startstart);\n\
      startend = clipPos(doc, startend);\n\
      if (type == \"double\") {\n\
        var word = findWordAt(getLine(doc, cur.line)\n\
          .text, cur);\n\
        if (posLess(cur, startstart)) extendSelection(cm.doc, word.from,\n\
          startend);\n\
        else extendSelection(cm.doc, startstart, word.to);\n\
      } else if (type == \"triple\") {\n\
        if (posLess(cur, startstart)) extendSelection(cm.doc, startend,\n\
          clipPos(doc, Pos(cur.line, 0)));\n\
        else extendSelection(cm.doc, startstart, clipPos(doc, Pos(cur.line +\n\
          1, 0)));\n\
      }\n\
    }\n\
\n\
    var editorSize = getRect(display.wrapper);\n\
    // Used to ensure timeout re-tries don't fire when another extend\n\
    // happened in the meantime (clearTimeout isn't reliable -- at\n\
    // least on Chrome, the timeouts still happen even when cleared,\n\
    // if the clear happens after their scheduled firing time).\n\
    var counter = 0;\n\
\n\
    function extend(e) {\n\
      var curCount = ++counter;\n\
      var cur = posFromMouse(cm, e, true);\n\
      if (!cur) return;\n\
      if (!posEq(cur, last)) {\n\
        if (!cm.state.focused) onFocus(cm);\n\
        last = cur;\n\
        doSelect(cur);\n\
        var visible = visibleLines(display, doc);\n\
        if (cur.line >= visible.to || cur.line < visible.from)\n\
          setTimeout(operation(cm, function() {\n\
            if (counter == curCount) extend(e);\n\
          }), 150);\n\
      } else {\n\
        var outside = e.clientY < editorSize.top ? -20 : e.clientY >\n\
          editorSize.bottom ? 20 : 0;\n\
        if (outside) setTimeout(operation(cm, function() {\n\
          if (counter != curCount) return;\n\
          display.scroller.scrollTop += outside;\n\
          extend(e);\n\
        }), 50);\n\
      }\n\
    }\n\
\n\
    function done(e) {\n\
      counter = Infinity;\n\
      e_preventDefault(e);\n\
      focusInput(cm);\n\
      off(document, \"mousemove\", move);\n\
      off(document, \"mouseup\", up);\n\
    }\n\
\n\
    var move = operation(cm, function(e) {\n\
      if (!ie && !e_button(e)) done(e);\n\
      else extend(e);\n\
    });\n\
    var up = operation(cm, done);\n\
    on(document, \"mousemove\", move);\n\
    on(document, \"mouseup\", up);\n\
  }\n\
\n\
  function gutterEvent(cm, e, type, prevent, signalfn) {\n\
    try {\n\
      var mX = e.clientX,\n\
        mY = e.clientY;\n\
    } catch (e) {\n\
      return false;\n\
    }\n\
    if (mX >= Math.floor(getRect(cm.display.gutters)\n\
      .right)) return false;\n\
    if (prevent) e_preventDefault(e);\n\
\n\
    var display = cm.display;\n\
    var lineBox = getRect(display.lineDiv);\n\
\n\
    if (mY > lineBox.bottom || !hasHandler(cm, type)) return e_defaultPrevented(\n\
      e);\n\
    mY -= lineBox.top - display.viewOffset;\n\
\n\
    for (var i = 0; i < cm.options.gutters.length; ++i) {\n\
      var g = display.gutters.childNodes[i];\n\
      if (g && getRect(g)\n\
        .right >= mX) {\n\
        var line = lineAtHeight(cm.doc, mY);\n\
        var gutter = cm.options.gutters[i];\n\
        signalfn(cm, type, cm, line, gutter, e);\n\
        return e_defaultPrevented(e);\n\
      }\n\
    }\n\
  }\n\
\n\
  function contextMenuInGutter(cm, e) {\n\
    if (!hasHandler(cm, \"gutterContextMenu\")) return false;\n\
    return gutterEvent(cm, e, \"gutterContextMenu\", false, signal);\n\
  }\n\
\n\
  function clickInGutter(cm, e) {\n\
    return gutterEvent(cm, e, \"gutterClick\", true, signalLater);\n\
  }\n\
\n\
  // Kludge to work around strange IE behavior where it'll sometimes\n\
  // re-fire a series of drag-related events right after the drop (#1551)\n\
  var lastDrop = 0;\n\
\n\
  function onDrop(e) {\n\
    var cm = this;\n\
    if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e) || (cm.options.onDragEvent &&\n\
      cm.options.onDragEvent(cm, addStop(e))))\n\
      return;\n\
    e_preventDefault(e);\n\
    if (ie) lastDrop = +new Date;\n\
    var pos = posFromMouse(cm, e, true),\n\
      files = e.dataTransfer.files;\n\
    if (!pos || isReadOnly(cm)) return;\n\
    if (files && files.length && window.FileReader && window.File) {\n\
      var n = files.length,\n\
        text = Array(n),\n\
        read = 0;\n\
      var loadFile = function(file, i) {\n\
        var reader = new FileReader;\n\
        reader.onload = function() {\n\
          text[i] = reader.result;\n\
          if (++read == n) {\n\
            pos = clipPos(cm.doc, pos);\n\
            makeChange(cm.doc, {\n\
              from: pos,\n\
              to: pos,\n\
              text: splitLines(text.join(\"\\n\
\")),\n\
              origin: \"paste\"\n\
            }, \"around\");\n\
          }\n\
        };\n\
        reader.readAsText(file);\n\
      };\n\
      for (var i = 0; i < n; ++i) loadFile(files[i], i);\n\
    } else {\n\
      // Don't do a replace if the drop happened inside of the selected text.\n\
      if (cm.state.draggingText && !(posLess(pos, cm.doc.sel.from) || posLess(\n\
        cm.doc.sel.to, pos))) {\n\
        cm.state.draggingText(e);\n\
        // Ensure the editor is re-focused\n\
        setTimeout(bind(focusInput, cm), 20);\n\
        return;\n\
      }\n\
      try {\n\
        var text = e.dataTransfer.getData(\"Text\");\n\
        if (text) {\n\
          var curFrom = cm.doc.sel.from,\n\
            curTo = cm.doc.sel.to;\n\
          setSelection(cm.doc, pos, pos);\n\
          if (cm.state.draggingText) replaceRange(cm.doc, \"\", curFrom, curTo,\n\
            \"paste\");\n\
          cm.replaceSelection(text, null, \"paste\");\n\
          focusInput(cm);\n\
        }\n\
      } catch (e) {}\n\
    }\n\
  }\n\
\n\
  function onDragStart(cm, e) {\n\
    if (ie && (!cm.state.draggingText || +new Date - lastDrop < 100)) {\n\
      e_stop(e);\n\
      return;\n\
    }\n\
    if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) return;\n\
\n\
    var txt = cm.getSelection();\n\
    e.dataTransfer.setData(\"Text\", txt);\n\
\n\
    // Use dummy image instead of default browsers image.\n\
    // Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.\n\
    if (e.dataTransfer.setDragImage && !safari) {\n\
      var img = elt(\"img\", null, null, \"position: fixed; left: 0; top: 0;\");\n\
      img.src =\n\
        \"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==\";\n\
      if (opera) {\n\
        img.width = img.height = 1;\n\
        cm.display.wrapper.appendChild(img);\n\
        // Force a relayout, or Opera won't use our image for some obscure reason\n\
        img._top = img.offsetTop;\n\
      }\n\
      e.dataTransfer.setDragImage(img, 0, 0);\n\
      if (opera) img.parentNode.removeChild(img);\n\
    }\n\
  }\n\
\n\
  function setScrollTop(cm, val) {\n\
    if (Math.abs(cm.doc.scrollTop - val) < 2) return;\n\
    cm.doc.scrollTop = val;\n\
    if (!gecko) updateDisplay(cm, [], val);\n\
    if (cm.display.scroller.scrollTop != val) cm.display.scroller.scrollTop =\n\
      val;\n\
    if (cm.display.scrollbarV.scrollTop != val) cm.display.scrollbarV.scrollTop =\n\
      val;\n\
    if (gecko) updateDisplay(cm, []);\n\
    startWorker(cm, 100);\n\
  }\n\
\n\
  function setScrollLeft(cm, val, isScroller) {\n\
    if (isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft -\n\
      val) < 2) return;\n\
    val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller\n\
      .clientWidth);\n\
    cm.doc.scrollLeft = val;\n\
    alignHorizontally(cm);\n\
    if (cm.display.scroller.scrollLeft != val) cm.display.scroller.scrollLeft =\n\
      val;\n\
    if (cm.display.scrollbarH.scrollLeft != val) cm.display.scrollbarH.scrollLeft =\n\
      val;\n\
  }\n\
\n\
  // Since the delta values reported on mouse wheel events are\n\
  // unstandardized between browsers and even browser versions, and\n\
  // generally horribly unpredictable, this code starts by measuring\n\
  // the scroll effect that the first few mouse wheel events have,\n\
  // and, from that, detects the way it can convert deltas to pixel\n\
  // offsets afterwards.\n\
  //\n\
  // The reason we want to know the amount a wheel event will scroll\n\
  // is that it gives us a chance to update the display before the\n\
  // actual scrolling happens, reducing flickering.\n\
\n\
  var wheelSamples = 0,\n\
    wheelPixelsPerUnit = null;\n\
  // Fill in a browser-detected starting value on browsers where we\n\
  // know one. These don't have to be accurate -- the result of them\n\
  // being wrong would just be a slight flicker on the first wheel\n\
  // scroll (if it is large enough).\n\
  if (ie) wheelPixelsPerUnit = -.53;\n\
  else if (gecko) wheelPixelsPerUnit = 15;\n\
  else if (chrome) wheelPixelsPerUnit = -.7;\n\
  else if (safari) wheelPixelsPerUnit = -1 / 3;\n\
\n\
  function onScrollWheel(cm, e) {\n\
    var dx = e.wheelDeltaX,\n\
      dy = e.wheelDeltaY;\n\
    if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS) dx = e.detail;\n\
    if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS) dy = e.detail;\n\
    else if (dy == null) dy = e.wheelDelta;\n\
\n\
    var display = cm.display,\n\
      scroll = display.scroller;\n\
    // Quit if there's nothing to scroll here\n\
    if (!(dx && scroll.scrollWidth > scroll.clientWidth ||\n\
      dy && scroll.scrollHeight > scroll.clientHeight)) return;\n\
\n\
    // Webkit browsers on OS X abort momentum scrolls when the target\n\
    // of the scroll event is removed from the scrollable element.\n\
    // This hack (see related code in patchDisplay) makes sure the\n\
    // element is kept around.\n\
    if (dy && mac && webkit) {\n\
      for (var cur = e.target; cur != scroll; cur = cur.parentNode) {\n\
        if (cur.lineObj) {\n\
          cm.display.currentWheelTarget = cur;\n\
          break;\n\
        }\n\
      }\n\
    }\n\
\n\
    // On some browsers, horizontal scrolling will cause redraws to\n\
    // happen before the gutter has been realigned, causing it to\n\
    // wriggle around in a most unseemly way. When we have an\n\
    // estimated pixels/delta value, we just handle horizontal\n\
    // scrolling entirely here. It'll be slightly off from native, but\n\
    // better than glitching out.\n\
    if (dx && !gecko && !opera && wheelPixelsPerUnit != null) {\n\
      if (dy)\n\
        setScrollTop(cm, Math.max(0, Math.min(scroll.scrollTop + dy *\n\
          wheelPixelsPerUnit, scroll.scrollHeight - scroll.clientHeight)));\n\
      setScrollLeft(cm, Math.max(0, Math.min(scroll.scrollLeft + dx *\n\
        wheelPixelsPerUnit, scroll.scrollWidth - scroll.clientWidth)));\n\
      e_preventDefault(e);\n\
      display.wheelStartX = null; // Abort measurement, if in progress\n\
      return;\n\
    }\n\
\n\
    if (dy && wheelPixelsPerUnit != null) {\n\
      var pixels = dy * wheelPixelsPerUnit;\n\
      var top = cm.doc.scrollTop,\n\
        bot = top + display.wrapper.clientHeight;\n\
      if (pixels < 0) top = Math.max(0, top + pixels - 50);\n\
      else bot = Math.min(cm.doc.height, bot + pixels + 50);\n\
      updateDisplay(cm, [], {\n\
        top: top,\n\
        bottom: bot\n\
      });\n\
    }\n\
\n\
    if (wheelSamples < 20) {\n\
      if (display.wheelStartX == null) {\n\
        display.wheelStartX = scroll.scrollLeft;\n\
        display.wheelStartY = scroll.scrollTop;\n\
        display.wheelDX = dx;\n\
        display.wheelDY = dy;\n\
        setTimeout(function() {\n\
          if (display.wheelStartX == null) return;\n\
          var movedX = scroll.scrollLeft - display.wheelStartX;\n\
          var movedY = scroll.scrollTop - display.wheelStartY;\n\
          var sample = (movedY && display.wheelDY && movedY / display.wheelDY) ||\n\
            (movedX && display.wheelDX && movedX / display.wheelDX);\n\
          display.wheelStartX = display.wheelStartY = null;\n\
          if (!sample) return;\n\
          wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) /\n\
            (wheelSamples + 1);\n\
          ++wheelSamples;\n\
        }, 200);\n\
      } else {\n\
        display.wheelDX += dx;\n\
        display.wheelDY += dy;\n\
      }\n\
    }\n\
  }\n\
\n\
  function doHandleBinding(cm, bound, dropShift) {\n\
    if (typeof bound == \"string\") {\n\
      bound = commands[bound];\n\
      if (!bound) return false;\n\
    }\n\
    // Ensure previous input has been read, so that the handler sees a\n\
    // consistent view of the document\n\
    if (cm.display.pollingFast && readInput(cm)) cm.display.pollingFast =\n\
      false;\n\
    var doc = cm.doc,\n\
      prevShift = doc.sel.shift,\n\
      done = false;\n\
    try {\n\
      if (isReadOnly(cm)) cm.state.suppressEdits = true;\n\
      if (dropShift) doc.sel.shift = false;\n\
      done = bound(cm) != Pass;\n\
    } finally {\n\
      doc.sel.shift = prevShift;\n\
      cm.state.suppressEdits = false;\n\
    }\n\
    return done;\n\
  }\n\
\n\
  function allKeyMaps(cm) {\n\
    var maps = cm.state.keyMaps.slice(0);\n\
    if (cm.options.extraKeys) maps.push(cm.options.extraKeys);\n\
    maps.push(cm.options.keyMap);\n\
    return maps;\n\
  }\n\
\n\
  var maybeTransition;\n\
\n\
  function handleKeyBinding(cm, e) {\n\
    // Handle auto keymap transitions\n\
    var startMap = getKeyMap(cm.options.keyMap),\n\
      next = startMap.auto;\n\
    clearTimeout(maybeTransition);\n\
    if (next && !isModifierKey(e)) maybeTransition = setTimeout(function() {\n\
      if (getKeyMap(cm.options.keyMap) == startMap) {\n\
        cm.options.keyMap = (next.call ? next.call(null, cm) : next);\n\
        keyMapChanged(cm);\n\
      }\n\
    }, 50);\n\
\n\
    var name = keyName(e, true),\n\
      handled = false;\n\
    if (!name) return false;\n\
    var keymaps = allKeyMaps(cm);\n\
\n\
    if (e.shiftKey) {\n\
      // First try to resolve full name (including 'Shift-'). Failing\n\
      // that, see if there is a cursor-motion command (starting with\n\
      // 'go') bound to the keyname without 'Shift-'.\n\
      handled = lookupKey(\"Shift-\" + name, keymaps, function(b) {\n\
        return doHandleBinding(cm, b, true);\n\
      }) || lookupKey(name, keymaps, function(b) {\n\
        if (typeof b == \"string\" ? /^go[A-Z]/.test(b) : b.motion)\n\
          return doHandleBinding(cm, b);\n\
      });\n\
    } else {\n\
      handled = lookupKey(name, keymaps, function(b) {\n\
        return doHandleBinding(cm, b);\n\
      });\n\
    }\n\
\n\
    if (handled) {\n\
      e_preventDefault(e);\n\
      restartBlink(cm);\n\
      if (ie_lt9) {\n\
        e.oldKeyCode = e.keyCode;\n\
        e.keyCode = 0;\n\
      }\n\
      signalLater(cm, \"keyHandled\", cm, name, e);\n\
    }\n\
    return handled;\n\
  }\n\
\n\
  function handleCharBinding(cm, e, ch) {\n\
    var handled = lookupKey(\"'\" + ch + \"'\", allKeyMaps(cm),\n\
      function(b) {\n\
        return doHandleBinding(cm, b, true);\n\
      });\n\
    if (handled) {\n\
      e_preventDefault(e);\n\
      restartBlink(cm);\n\
      signalLater(cm, \"keyHandled\", cm, \"'\" + ch + \"'\", e);\n\
    }\n\
    return handled;\n\
  }\n\
\n\
  var lastStoppedKey = null;\n\
\n\
  function onKeyDown(e) {\n\
    var cm = this;\n\
    if (!cm.state.focused) onFocus(cm);\n\
    if (signalDOMEvent(cm, e) || cm.options.onKeyEvent && cm.options.onKeyEvent(\n\
      cm, addStop(e))) return;\n\
    if (ie && e.keyCode == 27) e.returnValue = false;\n\
    var code = e.keyCode;\n\
    // IE does strange things with escape.\n\
    cm.doc.sel.shift = code == 16 || e.shiftKey;\n\
    // First give onKeyEvent option a chance to handle this.\n\
    var handled = handleKeyBinding(cm, e);\n\
    if (opera) {\n\
      lastStoppedKey = handled ? code : null;\n\
      // Opera has no cut event... we try to at least catch the key combo\n\
      if (!handled && code == 88 && !hasCopyEvent && (mac ? e.metaKey : e.ctrlKey))\n\
        cm.replaceSelection(\"\");\n\
    }\n\
  }\n\
\n\
  function onKeyPress(e) {\n\
    var cm = this;\n\
    if (signalDOMEvent(cm, e) || cm.options.onKeyEvent && cm.options.onKeyEvent(\n\
      cm, addStop(e))) return;\n\
    var keyCode = e.keyCode,\n\
      charCode = e.charCode;\n\
    if (opera && keyCode == lastStoppedKey) {\n\
      lastStoppedKey = null;\n\
      e_preventDefault(e);\n\
      return;\n\
    }\n\
    if (((opera && (!e.which || e.which < 10)) || khtml) && handleKeyBinding(\n\
      cm, e)) return;\n\
    var ch = String.fromCharCode(charCode == null ? keyCode : charCode);\n\
    if (this.options.electricChars && this.doc.mode.electricChars &&\n\
      this.options.smartIndent && !isReadOnly(this) &&\n\
      this.doc.mode.electricChars.indexOf(ch) > -1)\n\
      setTimeout(operation(cm, function() {\n\
        indentLine(cm, cm.doc.sel.to.line, \"smart\");\n\
      }), 75);\n\
    if (handleCharBinding(cm, e, ch)) return;\n\
    if (ie && !ie_lt9) cm.display.inputHasSelection = null;\n\
    fastPoll(cm);\n\
  }\n\
\n\
  function onFocus(cm) {\n\
    if (cm.options.readOnly == \"nocursor\") return;\n\
    if (!cm.state.focused) {\n\
      signal(cm, \"focus\", cm);\n\
      cm.state.focused = true;\n\
      if (cm.display.wrapper.className.search(/\\bCodeMirror-focused\\b/) == -1)\n\
        cm.display.wrapper.className += \" CodeMirror-focused\";\n\
      if (!cm.curOp) {\n\
        resetInput(cm, true);\n\
        if (webkit) setTimeout(bind(resetInput, cm, true), 0); // Issue #1730\n\
      }\n\
    }\n\
    slowPoll(cm);\n\
    restartBlink(cm);\n\
  }\n\
\n\
  function onBlur(cm) {\n\
    if (cm.state.focused) {\n\
      signal(cm, \"blur\", cm);\n\
      cm.state.focused = false;\n\
      cm.display.wrapper.className = cm.display.wrapper.className.replace(\n\
        \" CodeMirror-focused\", \"\");\n\
    }\n\
    clearInterval(cm.display.blinker);\n\
    setTimeout(function() {\n\
      if (!cm.state.focused) cm.doc.sel.shift = false;\n\
    }, 150);\n\
  }\n\
\n\
  var detectingSelectAll;\n\
\n\
  function onContextMenu(cm, e) {\n\
    if (signalDOMEvent(cm, e, \"contextmenu\")) return;\n\
    var display = cm.display,\n\
      sel = cm.doc.sel;\n\
    if (eventInWidget(display, e) || contextMenuInGutter(cm, e)) return;\n\
\n\
    var pos = posFromMouse(cm, e),\n\
      scrollPos = display.scroller.scrollTop;\n\
    if (!pos || opera) return; // Opera is difficult.\n\
\n\
    // Reset the current text selection only if the click is done outside of the selection\n\
    // and 'resetSelectionOnContextMenu' option is true.\n\
    var reset = cm.options.resetSelectionOnContextMenu;\n\
    if (reset && (posEq(sel.from, sel.to) || posLess(pos, sel.from) || !\n\
      posLess(pos, sel.to)))\n\
      operation(cm, setSelection)(cm.doc, pos, pos);\n\
\n\
    var oldCSS = display.input.style.cssText;\n\
    display.inputDiv.style.position = \"absolute\";\n\
    display.input.style.cssText =\n\
      \"position: fixed; width: 30px; height: 30px; top: \" + (e.clientY - 5) +\n\
      \"px; left: \" + (e.clientX - 5) +\n\
      \"px; z-index: 1000; background: transparent; outline: none;\" +\n\
      \"border-width: 0; outline: none; overflow: hidden; opacity: .05; -ms-opacity: .05; filter: alpha(opacity=5);\";\n\
    focusInput(cm);\n\
    resetInput(cm, true);\n\
    // Adds \"Select all\" to context menu in FF\n\
    if (posEq(sel.from, sel.to)) display.input.value = display.prevInput =\n\
      \" \";\n\
\n\
    function prepareSelectAllHack() {\n\
      if (display.input.selectionStart != null) {\n\
        var extval = display.input.value = \"\\u200b\" + (posEq(sel.from, sel.to) ?\n\
          \"\" : display.input.value);\n\
        display.prevInput = \"\\u200b\";\n\
        display.input.selectionStart = 1;\n\
        display.input.selectionEnd = extval.length;\n\
      }\n\
    }\n\
\n\
    function rehide() {\n\
      display.inputDiv.style.position = \"relative\";\n\
      display.input.style.cssText = oldCSS;\n\
      if (ie_lt9) display.scrollbarV.scrollTop = display.scroller.scrollTop =\n\
        scrollPos;\n\
      slowPoll(cm);\n\
\n\
      // Try to detect the user choosing select-all\n\
      if (display.input.selectionStart != null) {\n\
        if (!ie || ie_lt9) prepareSelectAllHack();\n\
        clearTimeout(detectingSelectAll);\n\
        var i = 0,\n\
          poll = function() {\n\
            if (display.prevInput == \"\\u200b\" && display.input.selectionStart ==\n\
              0)\n\
              operation(cm, commands.selectAll)(cm);\n\
            else if (i++ < 10) detectingSelectAll = setTimeout(poll, 500);\n\
            else resetInput(cm);\n\
          };\n\
        detectingSelectAll = setTimeout(poll, 200);\n\
      }\n\
    }\n\
\n\
    if (ie && !ie_lt9) prepareSelectAllHack();\n\
    if (captureMiddleClick) {\n\
      e_stop(e);\n\
      var mouseup = function() {\n\
        off(window, \"mouseup\", mouseup);\n\
        setTimeout(rehide, 20);\n\
      };\n\
      on(window, \"mouseup\", mouseup);\n\
    } else {\n\
      setTimeout(rehide, 50);\n\
    }\n\
  }\n\
\n\
  // UPDATING\n\
\n\
  var changeEnd = CodeMirror.changeEnd = function(change) {\n\
    if (!change.text) return change.to;\n\
    return Pos(change.from.line + change.text.length - 1,\n\
      lst(change.text)\n\
      .length + (change.text.length == 1 ? change.from.ch : 0));\n\
  };\n\
\n\
  // Make sure a position will be valid after the given change.\n\
  function clipPostChange(doc, change, pos) {\n\
    if (!posLess(change.from, pos)) return clipPos(doc, pos);\n\
    var diff = (change.text.length - 1) - (change.to.line - change.from.line);\n\
    if (pos.line > change.to.line + diff) {\n\
      var preLine = pos.line - diff,\n\
        lastLine = doc.first + doc.size - 1;\n\
      if (preLine > lastLine) return Pos(lastLine, getLine(doc, lastLine)\n\
        .text.length);\n\
      return clipToLen(pos, getLine(doc, preLine)\n\
        .text.length);\n\
    }\n\
    if (pos.line == change.to.line + diff)\n\
      return clipToLen(pos, lst(change.text)\n\
        .length + (change.text.length == 1 ? change.from.ch : 0) +\n\
        getLine(doc, change.to.line)\n\
        .text.length - change.to.ch);\n\
    var inside = pos.line - change.from.line;\n\
    return clipToLen(pos, change.text[inside].length + (inside ? 0 : change.from\n\
      .ch));\n\
  }\n\
\n\
  // Hint can be null|\"end\"|\"start\"|\"around\"|{anchor,head}\n\
  function computeSelAfterChange(doc, change, hint) {\n\
    if (hint && typeof hint == \"object\") // Assumed to be {anchor, head} object\n\
      return {\n\
        anchor: clipPostChange(doc, change, hint.anchor),\n\
        head: clipPostChange(doc, change, hint.head)\n\
      };\n\
\n\
    if (hint == \"start\") return {\n\
      anchor: change.from,\n\
      head: change.from\n\
    };\n\
\n\
    var end = changeEnd(change);\n\
    if (hint == \"around\") return {\n\
      anchor: change.from,\n\
      head: end\n\
    };\n\
    if (hint == \"end\") return {\n\
      anchor: end,\n\
      head: end\n\
    };\n\
\n\
    // hint is null, leave the selection alone as much as possible\n\
    var adjustPos = function(pos) {\n\
      if (posLess(pos, change.from)) return pos;\n\
      if (!posLess(change.to, pos)) return end;\n\
\n\
      var line = pos.line + change.text.length - (change.to.line - change.from\n\
        .line) - 1,\n\
        ch = pos.ch;\n\
      if (pos.line == change.to.line) ch += end.ch - change.to.ch;\n\
      return Pos(line, ch);\n\
    };\n\
    return {\n\
      anchor: adjustPos(doc.sel.anchor),\n\
      head: adjustPos(doc.sel.head)\n\
    };\n\
  }\n\
\n\
  function filterChange(doc, change, update) {\n\
    var obj = {\n\
      canceled: false,\n\
      from: change.from,\n\
      to: change.to,\n\
      text: change.text,\n\
      origin: change.origin,\n\
      cancel: function() {\n\
        this.canceled = true;\n\
      }\n\
    };\n\
    if (update) obj.update = function(from, to, text, origin) {\n\
      if (from) this.from = clipPos(doc, from);\n\
      if (to) this.to = clipPos(doc, to);\n\
      if (text) this.text = text;\n\
      if (origin !== undefined) this.origin = origin;\n\
    };\n\
    signal(doc, \"beforeChange\", doc, obj);\n\
    if (doc.cm) signal(doc.cm, \"beforeChange\", doc.cm, obj);\n\
\n\
    if (obj.canceled) return null;\n\
    return {\n\
      from: obj.from,\n\
      to: obj.to,\n\
      text: obj.text,\n\
      origin: obj.origin\n\
    };\n\
  }\n\
\n\
  // Replace the range from from to to by the strings in replacement.\n\
  // change is a {from, to, text [, origin]} object\n\
  function makeChange(doc, change, selUpdate, ignoreReadOnly) {\n\
    if (doc.cm) {\n\
      if (!doc.cm.curOp) return operation(doc.cm, makeChange)(doc, change,\n\
        selUpdate, ignoreReadOnly);\n\
      if (doc.cm.state.suppressEdits) return;\n\
    }\n\
\n\
    if (hasHandler(doc, \"beforeChange\") || doc.cm && hasHandler(doc.cm,\n\
      \"beforeChange\")) {\n\
      change = filterChange(doc, change, true);\n\
      if (!change) return;\n\
    }\n\
\n\
    // Possibly split or suppress the update based on the presence\n\
    // of read-only spans in its range.\n\
    var split = sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(\n\
      doc, change.from, change.to);\n\
    if (split) {\n\
      for (var i = split.length - 1; i >= 1; --i)\n\
        makeChangeNoReadonly(doc, {\n\
          from: split[i].from,\n\
          to: split[i].to,\n\
          text: [\"\"]\n\
        });\n\
      if (split.length)\n\
        makeChangeNoReadonly(doc, {\n\
          from: split[0].from,\n\
          to: split[0].to,\n\
          text: change.text\n\
        }, selUpdate);\n\
    } else {\n\
      makeChangeNoReadonly(doc, change, selUpdate);\n\
    }\n\
  }\n\
\n\
  function makeChangeNoReadonly(doc, change, selUpdate) {\n\
    if (change.text.length == 1 && change.text[0] == \"\" && posEq(change.from,\n\
      change.to)) return;\n\
    var selAfter = computeSelAfterChange(doc, change, selUpdate);\n\
    addToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN);\n\
\n\
    makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc,\n\
      change));\n\
    var rebased = [];\n\
\n\
    linkedDocs(doc, function(doc, sharedHist) {\n\
      if (!sharedHist && indexOf(rebased, doc.history) == -1) {\n\
        rebaseHist(doc.history, change);\n\
        rebased.push(doc.history);\n\
      }\n\
      makeChangeSingleDoc(doc, change, null, stretchSpansOverChange(doc,\n\
        change));\n\
    });\n\
  }\n\
\n\
  function makeChangeFromHistory(doc, type) {\n\
    if (doc.cm && doc.cm.state.suppressEdits) return;\n\
\n\
    var hist = doc.history;\n\
    var event = (type == \"undo\" ? hist.done : hist.undone)\n\
      .pop();\n\
    if (!event) return;\n\
\n\
    var anti = {\n\
      changes: [],\n\
      anchorBefore: event.anchorAfter,\n\
      headBefore: event.headAfter,\n\
      anchorAfter: event.anchorBefore,\n\
      headAfter: event.headBefore,\n\
      generation: hist.generation\n\
    };\n\
    (type == \"undo\" ? hist.undone : hist.done)\n\
      .push(anti);\n\
    hist.generation = event.generation || ++hist.maxGeneration;\n\
\n\
    var filter = hasHandler(doc, \"beforeChange\") || doc.cm && hasHandler(doc.cm,\n\
      \"beforeChange\");\n\
\n\
    for (var i = event.changes.length - 1; i >= 0; --i) {\n\
      var change = event.changes[i];\n\
      change.origin = type;\n\
      if (filter && !filterChange(doc, change, false)) {\n\
        (type == \"undo\" ? hist.done : hist.undone)\n\
          .length = 0;\n\
        return;\n\
      }\n\
\n\
      anti.changes.push(historyChangeFromChange(doc, change));\n\
\n\
      var after = i ? computeSelAfterChange(doc, change, null) : {\n\
        anchor: event.anchorBefore,\n\
        head: event.headBefore\n\
      };\n\
      makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change));\n\
      var rebased = [];\n\
\n\
      linkedDocs(doc, function(doc, sharedHist) {\n\
        if (!sharedHist && indexOf(rebased, doc.history) == -1) {\n\
          rebaseHist(doc.history, change);\n\
          rebased.push(doc.history);\n\
        }\n\
        makeChangeSingleDoc(doc, change, null, mergeOldSpans(doc, change));\n\
      });\n\
    }\n\
  }\n\
\n\
  function shiftDoc(doc, distance) {\n\
    function shiftPos(pos) {\n\
      return Pos(pos.line + distance, pos.ch);\n\
    }\n\
    doc.first += distance;\n\
    if (doc.cm) regChange(doc.cm, doc.first, doc.first, distance);\n\
    doc.sel.head = shiftPos(doc.sel.head);\n\
    doc.sel.anchor = shiftPos(doc.sel.anchor);\n\
    doc.sel.from = shiftPos(doc.sel.from);\n\
    doc.sel.to = shiftPos(doc.sel.to);\n\
  }\n\
\n\
  function makeChangeSingleDoc(doc, change, selAfter, spans) {\n\
    if (doc.cm && !doc.cm.curOp)\n\
      return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter,\n\
        spans);\n\
\n\
    if (change.to.line < doc.first) {\n\
      shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line));\n\
      return;\n\
    }\n\
    if (change.from.line > doc.lastLine()) return;\n\
\n\
    // Clip the change to the size of this doc\n\
    if (change.from.line < doc.first) {\n\
      var shift = change.text.length - 1 - (doc.first - change.from.line);\n\
      shiftDoc(doc, shift);\n\
      change = {\n\
        from: Pos(doc.first, 0),\n\
        to: Pos(change.to.line + shift, change.to.ch),\n\
        text: [lst(change.text)],\n\
        origin: change.origin\n\
      };\n\
    }\n\
    var last = doc.lastLine();\n\
    if (change.to.line > last) {\n\
      change = {\n\
        from: change.from,\n\
        to: Pos(last, getLine(doc, last)\n\
          .text.length),\n\
        text: [change.text[0]],\n\
        origin: change.origin\n\
      };\n\
    }\n\
\n\
    change.removed = getBetween(doc, change.from, change.to);\n\
\n\
    if (!selAfter) selAfter = computeSelAfterChange(doc, change, null);\n\
    if (doc.cm) makeChangeSingleDocInEditor(doc.cm, change, spans, selAfter);\n\
    else updateDoc(doc, change, spans, selAfter);\n\
  }\n\
\n\
  function makeChangeSingleDocInEditor(cm, change, spans, selAfter) {\n\
    var doc = cm.doc,\n\
      display = cm.display,\n\
      from = change.from,\n\
      to = change.to;\n\
\n\
    var recomputeMaxLength = false,\n\
      checkWidthStart = from.line;\n\
    if (!cm.options.lineWrapping) {\n\
      checkWidthStart = lineNo(visualLine(doc, getLine(doc, from.line)));\n\
      doc.iter(checkWidthStart, to.line + 1, function(line) {\n\
        if (line == display.maxLine) {\n\
          recomputeMaxLength = true;\n\
          return true;\n\
        }\n\
      });\n\
    }\n\
\n\
    if (!posLess(doc.sel.head, change.from) && !posLess(change.to, doc.sel.head))\n\
      cm.curOp.cursorActivity = true;\n\
\n\
    updateDoc(doc, change, spans, selAfter, estimateHeight(cm));\n\
\n\
    if (!cm.options.lineWrapping) {\n\
      doc.iter(checkWidthStart, from.line + change.text.length, function(line) {\n\
        var len = lineLength(doc, line);\n\
        if (len > display.maxLineLength) {\n\
          display.maxLine = line;\n\
          display.maxLineLength = len;\n\
          display.maxLineChanged = true;\n\
          recomputeMaxLength = false;\n\
        }\n\
      });\n\
      if (recomputeMaxLength) cm.curOp.updateMaxLine = true;\n\
    }\n\
\n\
    // Adjust frontier, schedule worker\n\
    doc.frontier = Math.min(doc.frontier, from.line);\n\
    startWorker(cm, 400);\n\
\n\
    var lendiff = change.text.length - (to.line - from.line) - 1;\n\
    // Remember that these lines changed, for updating the display\n\
    regChange(cm, from.line, to.line + 1, lendiff);\n\
\n\
    if (hasHandler(cm, \"change\")) {\n\
      var changeObj = {\n\
        from: from,\n\
        to: to,\n\
        text: change.text,\n\
        removed: change.removed,\n\
        origin: change.origin\n\
      };\n\
      if (cm.curOp.textChanged) {\n\
        for (var cur = cm.curOp.textChanged; cur.next; cur = cur.next) {}\n\
        cur.next = changeObj;\n\
      } else cm.curOp.textChanged = changeObj;\n\
    }\n\
  }\n\
\n\
  function replaceRange(doc, code, from, to, origin) {\n\
    if (!to) to = from;\n\
    if (posLess(to, from)) {\n\
      var tmp = to;\n\
      to = from;\n\
      from = tmp;\n\
    }\n\
    if (typeof code == \"string\") code = splitLines(code);\n\
    makeChange(doc, {\n\
      from: from,\n\
      to: to,\n\
      text: code,\n\
      origin: origin\n\
    }, null);\n\
  }\n\
\n\
  // POSITION OBJECT\n\
\n\
  function Pos(line, ch) {\n\
    if (!(this instanceof Pos)) return new Pos(line, ch);\n\
    this.line = line;\n\
    this.ch = ch;\n\
  }\n\
  CodeMirror.Pos = Pos;\n\
\n\
  function posEq(a, b) {\n\
    return a.line == b.line && a.ch == b.ch;\n\
  }\n\
\n\
  function posLess(a, b) {\n\
    return a.line < b.line || (a.line == b.line && a.ch < b.ch);\n\
  }\n\
\n\
  function copyPos(x) {\n\
    return Pos(x.line, x.ch);\n\
  }\n\
\n\
  // SELECTION\n\
\n\
  function clipLine(doc, n) {\n\
    return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1));\n\
  }\n\
\n\
  function clipPos(doc, pos) {\n\
    if (pos.line < doc.first) return Pos(doc.first, 0);\n\
    var last = doc.first + doc.size - 1;\n\
    if (pos.line > last) return Pos(last, getLine(doc, last)\n\
      .text.length);\n\
    return clipToLen(pos, getLine(doc, pos.line)\n\
      .text.length);\n\
  }\n\
\n\
  function clipToLen(pos, linelen) {\n\
    var ch = pos.ch;\n\
    if (ch == null || ch > linelen) return Pos(pos.line, linelen);\n\
    else if (ch < 0) return Pos(pos.line, 0);\n\
    else return pos;\n\
  }\n\
\n\
  function isLine(doc, l) {\n\
    return l >= doc.first && l < doc.first + doc.size;\n\
  }\n\
\n\
  // If shift is held, this will move the selection anchor. Otherwise,\n\
  // it'll set the whole selection.\n\
  function extendSelection(doc, pos, other, bias) {\n\
    if (doc.sel.shift || doc.sel.extend) {\n\
      var anchor = doc.sel.anchor;\n\
      if (other) {\n\
        var posBefore = posLess(pos, anchor);\n\
        if (posBefore != posLess(other, anchor)) {\n\
          anchor = pos;\n\
          pos = other;\n\
        } else if (posBefore != posLess(pos, other)) {\n\
          pos = other;\n\
        }\n\
      }\n\
      setSelection(doc, anchor, pos, bias);\n\
    } else {\n\
      setSelection(doc, pos, other || pos, bias);\n\
    }\n\
    if (doc.cm) doc.cm.curOp.userSelChange = true;\n\
  }\n\
\n\
  function filterSelectionChange(doc, anchor, head) {\n\
    var obj = {\n\
      anchor: anchor,\n\
      head: head\n\
    };\n\
    signal(doc, \"beforeSelectionChange\", doc, obj);\n\
    if (doc.cm) signal(doc.cm, \"beforeSelectionChange\", doc.cm, obj);\n\
    obj.anchor = clipPos(doc, obj.anchor);\n\
    obj.head = clipPos(doc, obj.head);\n\
    return obj;\n\
  }\n\
\n\
  // Update the selection. Last two args are only used by\n\
  // updateDoc, since they have to be expressed in the line\n\
  // numbers before the update.\n\
  function setSelection(doc, anchor, head, bias, checkAtomic) {\n\
    if (!checkAtomic && hasHandler(doc, \"beforeSelectionChange\") || doc.cm &&\n\
      hasHandler(doc.cm, \"beforeSelectionChange\")) {\n\
      var filtered = filterSelectionChange(doc, anchor, head);\n\
      head = filtered.head;\n\
      anchor = filtered.anchor;\n\
    }\n\
\n\
    var sel = doc.sel;\n\
    sel.goalColumn = null;\n\
    if (bias == null) bias = posLess(head, sel.head) ? -1 : 1;\n\
    // Skip over atomic spans.\n\
    if (checkAtomic || !posEq(anchor, sel.anchor))\n\
      anchor = skipAtomic(doc, anchor, bias, checkAtomic != \"push\");\n\
    if (checkAtomic || !posEq(head, sel.head))\n\
      head = skipAtomic(doc, head, bias, checkAtomic != \"push\");\n\
\n\
    if (posEq(sel.anchor, anchor) && posEq(sel.head, head)) return;\n\
\n\
    sel.anchor = anchor;\n\
    sel.head = head;\n\
    var inv = posLess(head, anchor);\n\
    sel.from = inv ? head : anchor;\n\
    sel.to = inv ? anchor : head;\n\
\n\
    if (doc.cm)\n\
      doc.cm.curOp.updateInput = doc.cm.curOp.selectionChanged =\n\
        doc.cm.curOp.cursorActivity = true;\n\
\n\
    signalLater(doc, \"cursorActivity\", doc);\n\
  }\n\
\n\
  function reCheckSelection(cm) {\n\
    setSelection(cm.doc, cm.doc.sel.from, cm.doc.sel.to, null, \"push\");\n\
  }\n\
\n\
  function skipAtomic(doc, pos, bias, mayClear) {\n\
    var flipped = false,\n\
      curPos = pos;\n\
    var dir = bias || 1;\n\
    doc.cantEdit = false;\n\
    search: for (;;) {\n\
      var line = getLine(doc, curPos.line);\n\
      if (line.markedSpans) {\n\
        for (var i = 0; i < line.markedSpans.length; ++i) {\n\
          var sp = line.markedSpans[i],\n\
            m = sp.marker;\n\
          if ((sp.from == null || (m.inclusiveLeft ? sp.from <= curPos.ch :\n\
              sp.from < curPos.ch)) &&\n\
            (sp.to == null || (m.inclusiveRight ? sp.to >= curPos.ch : sp.to >\n\
              curPos.ch))) {\n\
            if (mayClear) {\n\
              signal(m, \"beforeCursorEnter\");\n\
              if (m.explicitlyCleared) {\n\
                if (!line.markedSpans) break;\n\
                else {\n\
                  --i;\n\
                  continue;\n\
                }\n\
              }\n\
            }\n\
            if (!m.atomic) continue;\n\
            var newPos = m.find()[dir < 0 ? \"from\" : \"to\"];\n\
            if (posEq(newPos, curPos)) {\n\
              newPos.ch += dir;\n\
              if (newPos.ch < 0) {\n\
                if (newPos.line > doc.first) newPos = clipPos(doc, Pos(newPos\n\
                  .line - 1));\n\
                else newPos = null;\n\
              } else if (newPos.ch > line.text.length) {\n\
                if (newPos.line < doc.first + doc.size - 1) newPos = Pos(\n\
                  newPos.line + 1, 0);\n\
                else newPos = null;\n\
              }\n\
              if (!newPos) {\n\
                if (flipped) {\n\
                  // Driven in a corner -- no valid cursor position found at all\n\
                  // -- try again *with* clearing, if we didn't already\n\
                  if (!mayClear) return skipAtomic(doc, pos, bias, true);\n\
                  // Otherwise, turn off editing until further notice, and return the start of the doc\n\
                  doc.cantEdit = true;\n\
                  return Pos(doc.first, 0);\n\
                }\n\
                flipped = true;\n\
                newPos = pos;\n\
                dir = -dir;\n\
              }\n\
            }\n\
            curPos = newPos;\n\
            continue search;\n\
          }\n\
        }\n\
      }\n\
      return curPos;\n\
    }\n\
  }\n\
\n\
  // SCROLLING\n\
\n\
  function scrollCursorIntoView(cm) {\n\
    var coords = scrollPosIntoView(cm, cm.doc.sel.head, null, cm.options.cursorScrollMargin);\n\
    if (!cm.state.focused) return;\n\
    var display = cm.display,\n\
      box = getRect(display.sizer),\n\
      doScroll = null;\n\
    if (coords.top + box.top < 0) doScroll = true;\n\
    else if (coords.bottom + box.top > (window.innerHeight || document.documentElement\n\
      .clientHeight)) doScroll = false;\n\
    if (doScroll != null && !phantom) {\n\
      var hidden = display.cursor.style.display == \"none\";\n\
      if (hidden) {\n\
        display.cursor.style.display = \"\";\n\
        display.cursor.style.left = coords.left + \"px\";\n\
        display.cursor.style.top = (coords.top - display.viewOffset) + \"px\";\n\
      }\n\
      display.cursor.scrollIntoView(doScroll);\n\
      if (hidden) display.cursor.style.display = \"none\";\n\
    }\n\
  }\n\
\n\
  function scrollPosIntoView(cm, pos, end, margin) {\n\
    if (margin == null) margin = 0;\n\
    for (;;) {\n\
      var changed = false,\n\
        coords = cursorCoords(cm, pos);\n\
      var endCoords = !end || end == pos ? coords : cursorCoords(cm, end);\n\
      var scrollPos = calculateScrollPos(cm, Math.min(coords.left, endCoords.left),\n\
        Math.min(coords.top, endCoords.top) - margin,\n\
        Math.max(coords.left, endCoords.left),\n\
        Math.max(coords.bottom, endCoords.bottom) + margin);\n\
      var startTop = cm.doc.scrollTop,\n\
        startLeft = cm.doc.scrollLeft;\n\
      if (scrollPos.scrollTop != null) {\n\
        setScrollTop(cm, scrollPos.scrollTop);\n\
        if (Math.abs(cm.doc.scrollTop - startTop) > 1) changed = true;\n\
      }\n\
      if (scrollPos.scrollLeft != null) {\n\
        setScrollLeft(cm, scrollPos.scrollLeft);\n\
        if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) changed = true;\n\
      }\n\
      if (!changed) return coords;\n\
    }\n\
  }\n\
\n\
  function scrollIntoView(cm, x1, y1, x2, y2) {\n\
    var scrollPos = calculateScrollPos(cm, x1, y1, x2, y2);\n\
    if (scrollPos.scrollTop != null) setScrollTop(cm, scrollPos.scrollTop);\n\
    if (scrollPos.scrollLeft != null) setScrollLeft(cm, scrollPos.scrollLeft);\n\
  }\n\
\n\
  function calculateScrollPos(cm, x1, y1, x2, y2) {\n\
    var display = cm.display,\n\
      snapMargin = textHeight(cm.display);\n\
    if (y1 < 0) y1 = 0;\n\
    var screen = display.scroller.clientHeight - scrollerCutOff,\n\
      screentop = display.scroller.scrollTop,\n\
      result = {};\n\
    var docBottom = cm.doc.height + paddingVert(display);\n\
    var atTop = y1 < snapMargin,\n\
      atBottom = y2 > docBottom - snapMargin;\n\
    if (y1 < screentop) {\n\
      result.scrollTop = atTop ? 0 : y1;\n\
    } else if (y2 > screentop + screen) {\n\
      var newTop = Math.min(y1, (atBottom ? docBottom : y2) - screen);\n\
      if (newTop != screentop) result.scrollTop = newTop;\n\
    }\n\
\n\
    var screenw = display.scroller.clientWidth - scrollerCutOff,\n\
      screenleft = display.scroller.scrollLeft;\n\
    x1 += display.gutters.offsetWidth;\n\
    x2 += display.gutters.offsetWidth;\n\
    var gutterw = display.gutters.offsetWidth;\n\
    var atLeft = x1 < gutterw + 10;\n\
    if (x1 < screenleft + gutterw || atLeft) {\n\
      if (atLeft) x1 = 0;\n\
      result.scrollLeft = Math.max(0, x1 - 10 - gutterw);\n\
    } else if (x2 > screenw + screenleft - 3) {\n\
      result.scrollLeft = x2 + 10 - screenw;\n\
    }\n\
    return result;\n\
  }\n\
\n\
  function updateScrollPos(cm, left, top) {\n\
    cm.curOp.updateScrollPos = {\n\
      scrollLeft: left == null ? cm.doc.scrollLeft : left,\n\
      scrollTop: top == null ? cm.doc.scrollTop : top\n\
    };\n\
  }\n\
\n\
  function addToScrollPos(cm, left, top) {\n\
    var pos = cm.curOp.updateScrollPos || (cm.curOp.updateScrollPos = {\n\
      scrollLeft: cm.doc.scrollLeft,\n\
      scrollTop: cm.doc.scrollTop\n\
    });\n\
    var scroll = cm.display.scroller;\n\
    pos.scrollTop = Math.max(0, Math.min(scroll.scrollHeight - scroll.clientHeight,\n\
      pos.scrollTop + top));\n\
    pos.scrollLeft = Math.max(0, Math.min(scroll.scrollWidth - scroll.clientWidth,\n\
      pos.scrollLeft + left));\n\
  }\n\
\n\
  // API UTILITIES\n\
\n\
  function indentLine(cm, n, how, aggressive) {\n\
    var doc = cm.doc;\n\
    if (how == null) how = \"add\";\n\
    if (how == \"smart\") {\n\
      if (!cm.doc.mode.indent) how = \"prev\";\n\
      else var state = getStateBefore(cm, n);\n\
    }\n\
\n\
    var tabSize = cm.options.tabSize;\n\
    var line = getLine(doc, n),\n\
      curSpace = countColumn(line.text, null, tabSize);\n\
    var curSpaceString = line.text.match(/^\\s*/)[0],\n\
      indentation;\n\
    if (how == \"smart\") {\n\
      indentation = cm.doc.mode.indent(state, line.text.slice(curSpaceString.length),\n\
        line.text);\n\
      if (indentation == Pass) {\n\
        if (!aggressive) return;\n\
        how = \"prev\";\n\
      }\n\
    }\n\
    if (how == \"prev\") {\n\
      if (n > doc.first) indentation = countColumn(getLine(doc, n - 1)\n\
        .text, null, tabSize);\n\
      else indentation = 0;\n\
    } else if (how == \"add\") {\n\
      indentation = curSpace + cm.options.indentUnit;\n\
    } else if (how == \"subtract\") {\n\
      indentation = curSpace - cm.options.indentUnit;\n\
    } else if (typeof how == \"number\") {\n\
      indentation = curSpace + how;\n\
    }\n\
    indentation = Math.max(0, indentation);\n\
\n\
    var indentString = \"\",\n\
      pos = 0;\n\
    if (cm.options.indentWithTabs)\n\
      for (var i = Math.floor(indentation / tabSize); i; --i) {\n\
        pos += tabSize;\n\
        indentString += \"\\t\";\n\
      }\n\
    if (pos < indentation) indentString += spaceStr(indentation - pos);\n\
\n\
    if (indentString != curSpaceString)\n\
      replaceRange(cm.doc, indentString, Pos(n, 0), Pos(n, curSpaceString.length),\n\
        \"+input\");\n\
    else if (doc.sel.head.line == n && doc.sel.head.ch < curSpaceString.length)\n\
      setSelection(doc, Pos(n, curSpaceString.length), Pos(n, curSpaceString.length),\n\
        1);\n\
    line.stateAfter = null;\n\
  }\n\
\n\
  function changeLine(cm, handle, op) {\n\
    var no = handle,\n\
      line = handle,\n\
      doc = cm.doc;\n\
    if (typeof handle == \"number\") line = getLine(doc, clipLine(doc, handle));\n\
    else no = lineNo(handle);\n\
    if (no == null) return null;\n\
    if (op(line, no)) regChange(cm, no, no + 1);\n\
    else return null;\n\
    return line;\n\
  }\n\
\n\
  function findPosH(doc, pos, dir, unit, visually) {\n\
    var line = pos.line,\n\
      ch = pos.ch,\n\
      origDir = dir;\n\
    var lineObj = getLine(doc, line);\n\
    var possible = true;\n\
\n\
    function findNextLine() {\n\
      var l = line + dir;\n\
      if (l < doc.first || l >= doc.first + doc.size) return (possible =\n\
        false);\n\
      line = l;\n\
      return lineObj = getLine(doc, l);\n\
    }\n\
\n\
    function moveOnce(boundToLine) {\n\
      var next = (visually ? moveVisually : moveLogically)(lineObj, ch, dir,\n\
        true);\n\
      if (next == null) {\n\
        if (!boundToLine && findNextLine()) {\n\
          if (visually) ch = (dir < 0 ? lineRight : lineLeft)(lineObj);\n\
          else ch = dir < 0 ? lineObj.text.length : 0;\n\
        } else return (possible = false);\n\
      } else ch = next;\n\
      return true;\n\
    }\n\
\n\
    if (unit == \"char\") moveOnce();\n\
    else if (unit == \"column\") moveOnce(true);\n\
    else if (unit == \"word\" || unit == \"group\") {\n\
      var sawType = null,\n\
        group = unit == \"group\";\n\
      for (var first = true;; first = false) {\n\
        if (dir < 0 && !moveOnce(!first)) break;\n\
        var cur = lineObj.text.charAt(ch) || \"\\n\
\";\n\
        var type = isWordChar(cur) ? \"w\" : !group ? null : /\\s/.test(cur) ?\n\
          null : \"p\";\n\
        if (sawType && sawType != type) {\n\
          if (dir < 0) {\n\
            dir = 1;\n\
            moveOnce();\n\
          }\n\
          break;\n\
        }\n\
        if (type) sawType = type;\n\
        if (dir > 0 && !moveOnce(!first)) break;\n\
      }\n\
    }\n\
    var result = skipAtomic(doc, Pos(line, ch), origDir, true);\n\
    if (!possible) result.hitSide = true;\n\
    return result;\n\
  }\n\
\n\
  function findPosV(cm, pos, dir, unit) {\n\
    var doc = cm.doc,\n\
      x = pos.left,\n\
      y;\n\
    if (unit == \"page\") {\n\
      var pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight ||\n\
        document.documentElement.clientHeight);\n\
      y = pos.top + dir * (pageSize - (dir < 0 ? 1.5 : .5) * textHeight(cm.display));\n\
    } else if (unit == \"line\") {\n\
      y = dir > 0 ? pos.bottom + 3 : pos.top - 3;\n\
    }\n\
    for (;;) {\n\
      var target = coordsChar(cm, x, y);\n\
      if (!target.outside) break;\n\
      if (dir < 0 ? y <= 0 : y >= doc.height) {\n\
        target.hitSide = true;\n\
        break;\n\
      }\n\
      y += dir * 5;\n\
    }\n\
    return target;\n\
  }\n\
\n\
  function findWordAt(line, pos) {\n\
    var start = pos.ch,\n\
      end = pos.ch;\n\
    if (line) {\n\
      if ((pos.xRel < 0 || end == line.length) && start)--start;\n\
      else ++end;\n\
      var startChar = line.charAt(start);\n\
      var check = isWordChar(startChar) ? isWordChar : /\\s/.test(startChar) ?\n\
          function(ch) {\n\
            return /\\s/.test(ch);\n\
        } : function(ch) {\n\
          return !/\\s/.test(ch) && !isWordChar(ch);\n\
        };\n\
      while (start > 0 && check(line.charAt(start - 1)))--start;\n\
      while (end < line.length && check(line.charAt(end)))++end;\n\
    }\n\
    return {\n\
      from: Pos(pos.line, start),\n\
      to: Pos(pos.line, end)\n\
    };\n\
  }\n\
\n\
  function selectLine(cm, line) {\n\
    extendSelection(cm.doc, Pos(line, 0), clipPos(cm.doc, Pos(line + 1, 0)));\n\
  }\n\
\n\
  // PROTOTYPE\n\
\n\
  // The publicly visible API. Note that operation(null, f) means\n\
  // 'wrap f in an operation, performed on its `this` parameter'\n\
\n\
  CodeMirror.prototype = {\n\
    constructor: CodeMirror,\n\
    focus: function() {\n\
      window.focus();\n\
      focusInput(this);\n\
      fastPoll(this);\n\
    },\n\
\n\
    setOption: function(option, value) {\n\
      var options = this.options,\n\
        old = options[option];\n\
      if (options[option] == value && option != \"mode\") return;\n\
      options[option] = value;\n\
      if (optionHandlers.hasOwnProperty(option))\n\
        operation(this, optionHandlers[option])(this, value, old);\n\
    },\n\
\n\
    getOption: function(option) {\n\
      return this.options[option];\n\
    },\n\
    getDoc: function() {\n\
      return this.doc;\n\
    },\n\
\n\
    addKeyMap: function(map, bottom) {\n\
      this.state.keyMaps[bottom ? \"push\" : \"unshift\"](map);\n\
    },\n\
    removeKeyMap: function(map) {\n\
      var maps = this.state.keyMaps;\n\
      for (var i = 0; i < maps.length; ++i)\n\
        if (maps[i] == map || (typeof maps[i] != \"string\" && maps[i].name ==\n\
          map)) {\n\
          maps.splice(i, 1);\n\
          return true;\n\
        }\n\
    },\n\
\n\
    addOverlay: operation(null, function(spec, options) {\n\
      var mode = spec.token ? spec : CodeMirror.getMode(this.options, spec);\n\
      if (mode.startState) throw new Error(\"Overlays may not be stateful.\");\n\
      this.state.overlays.push({\n\
        mode: mode,\n\
        modeSpec: spec,\n\
        opaque: options && options.opaque\n\
      });\n\
      this.state.modeGen++;\n\
      regChange(this);\n\
    }),\n\
    removeOverlay: operation(null, function(spec) {\n\
      var overlays = this.state.overlays;\n\
      for (var i = 0; i < overlays.length; ++i) {\n\
        var cur = overlays[i].modeSpec;\n\
        if (cur == spec || typeof spec == \"string\" && cur.name == spec) {\n\
          overlays.splice(i, 1);\n\
          this.state.modeGen++;\n\
          regChange(this);\n\
          return;\n\
        }\n\
      }\n\
    }),\n\
\n\
    indentLine: operation(null, function(n, dir, aggressive) {\n\
      if (typeof dir != \"string\" && typeof dir != \"number\") {\n\
        if (dir == null) dir = this.options.smartIndent ? \"smart\" : \"prev\";\n\
        else dir = dir ? \"add\" : \"subtract\";\n\
      }\n\
      if (isLine(this.doc, n)) indentLine(this, n, dir, aggressive);\n\
    }),\n\
    indentSelection: operation(null, function(how) {\n\
      var sel = this.doc.sel;\n\
      if (posEq(sel.from, sel.to)) return indentLine(this, sel.from.line,\n\
        how);\n\
      var e = sel.to.line - (sel.to.ch ? 0 : 1);\n\
      for (var i = sel.from.line; i <= e; ++i) indentLine(this, i, how);\n\
    }),\n\
\n\
    // Fetch the parser token for a given character. Useful for hacks\n\
    // that want to inspect the mode state (say, for completion).\n\
    getTokenAt: function(pos, precise) {\n\
      var doc = this.doc;\n\
      pos = clipPos(doc, pos);\n\
      var state = getStateBefore(this, pos.line, precise),\n\
        mode = this.doc.mode;\n\
      var line = getLine(doc, pos.line);\n\
      var stream = new StringStream(line.text, this.options.tabSize);\n\
      while (stream.pos < pos.ch && !stream.eol()) {\n\
        stream.start = stream.pos;\n\
        var style = mode.token(stream, state);\n\
      }\n\
      return {\n\
        start: stream.start,\n\
        end: stream.pos,\n\
        string: stream.current(),\n\
        className: style || null, // Deprecated, use 'type' instead\n\
        type: style || null,\n\
        state: state\n\
      };\n\
    },\n\
\n\
    getTokenTypeAt: function(pos) {\n\
      pos = clipPos(this.doc, pos);\n\
      var styles = getLineStyles(this, getLine(this.doc, pos.line));\n\
      var before = 0,\n\
        after = (styles.length - 1) / 2,\n\
        ch = pos.ch;\n\
      if (ch == 0) return styles[2];\n\
      for (;;) {\n\
        var mid = (before + after) >> 1;\n\
        if ((mid ? styles[mid * 2 - 1] : 0) >= ch) after = mid;\n\
        else if (styles[mid * 2 + 1] < ch) before = mid + 1;\n\
        else return styles[mid * 2 + 2];\n\
      }\n\
    },\n\
\n\
    getModeAt: function(pos) {\n\
      var mode = this.doc.mode;\n\
      if (!mode.innerMode) return mode;\n\
      return CodeMirror.innerMode(mode, this.getTokenAt(pos)\n\
        .state)\n\
        .mode;\n\
    },\n\
\n\
    getHelper: function(pos, type) {\n\
      if (!helpers.hasOwnProperty(type)) return;\n\
      var help = helpers[type],\n\
        mode = this.getModeAt(pos);\n\
      return mode[type] && help[mode[type]] ||\n\
        mode.helperType && help[mode.helperType] ||\n\
        help[mode.name];\n\
    },\n\
\n\
    getStateAfter: function(line, precise) {\n\
      var doc = this.doc;\n\
      line = clipLine(doc, line == null ? doc.first + doc.size - 1 : line);\n\
      return getStateBefore(this, line + 1, precise);\n\
    },\n\
\n\
    cursorCoords: function(start, mode) {\n\
      var pos, sel = this.doc.sel;\n\
      if (start == null) pos = sel.head;\n\
      else if (typeof start == \"object\") pos = clipPos(this.doc, start);\n\
      else pos = start ? sel.from : sel.to;\n\
      return cursorCoords(this, pos, mode || \"page\");\n\
    },\n\
\n\
    charCoords: function(pos, mode) {\n\
      return charCoords(this, clipPos(this.doc, pos), mode || \"page\");\n\
    },\n\
\n\
    coordsChar: function(coords, mode) {\n\
      coords = fromCoordSystem(this, coords, mode || \"page\");\n\
      return coordsChar(this, coords.left, coords.top);\n\
    },\n\
\n\
    lineAtHeight: function(height, mode) {\n\
      height = fromCoordSystem(this, {\n\
        top: height,\n\
        left: 0\n\
      }, mode || \"page\")\n\
        .top;\n\
      return lineAtHeight(this.doc, height + this.display.viewOffset);\n\
    },\n\
    heightAtLine: function(line, mode) {\n\
      var end = false,\n\
        last = this.doc.first + this.doc.size - 1;\n\
      if (line < this.doc.first) line = this.doc.first;\n\
      else if (line > last) {\n\
        line = last;\n\
        end = true;\n\
      }\n\
      var lineObj = getLine(this.doc, line);\n\
      return intoCoordSystem(this, getLine(this.doc, line), {\n\
        top: 0,\n\
        left: 0\n\
      }, mode || \"page\")\n\
        .top +\n\
        (end ? lineObj.height : 0);\n\
    },\n\
\n\
    defaultTextHeight: function() {\n\
      return textHeight(this.display);\n\
    },\n\
    defaultCharWidth: function() {\n\
      return charWidth(this.display);\n\
    },\n\
\n\
    setGutterMarker: operation(null, function(line, gutterID, value) {\n\
      return changeLine(this, line, function(line) {\n\
        var markers = line.gutterMarkers || (line.gutterMarkers = {});\n\
        markers[gutterID] = value;\n\
        if (!value && isEmpty(markers)) line.gutterMarkers = null;\n\
        return true;\n\
      });\n\
    }),\n\
\n\
    clearGutter: operation(null, function(gutterID) {\n\
      var cm = this,\n\
        doc = cm.doc,\n\
        i = doc.first;\n\
      doc.iter(function(line) {\n\
        if (line.gutterMarkers && line.gutterMarkers[gutterID]) {\n\
          line.gutterMarkers[gutterID] = null;\n\
          regChange(cm, i, i + 1);\n\
          if (isEmpty(line.gutterMarkers)) line.gutterMarkers = null;\n\
        }\n\
        ++i;\n\
      });\n\
    }),\n\
\n\
    addLineClass: operation(null, function(handle, where, cls) {\n\
      return changeLine(this, handle, function(line) {\n\
        var prop = where == \"text\" ? \"textClass\" : where == \"background\" ?\n\
          \"bgClass\" : \"wrapClass\";\n\
        if (!line[prop]) line[prop] = cls;\n\
        else if (new RegExp(\"(?:^|\\\\s)\" + cls + \"(?:$|\\\\s)\")\n\
          .test(line[prop])) return false;\n\
        else line[prop] += \" \" + cls;\n\
        return true;\n\
      });\n\
    }),\n\
\n\
    removeLineClass: operation(null, function(handle, where, cls) {\n\
      return changeLine(this, handle, function(line) {\n\
        var prop = where == \"text\" ? \"textClass\" : where == \"background\" ?\n\
          \"bgClass\" : \"wrapClass\";\n\
        var cur = line[prop];\n\
        if (!cur) return false;\n\
        else if (cls == null) line[prop] = null;\n\
        else {\n\
          var found = cur.match(new RegExp(\"(?:^|\\\\s+)\" + cls +\n\
            \"(?:$|\\\\s+)\"));\n\
          if (!found) return false;\n\
          var end = found.index + found[0].length;\n\
          line[prop] = cur.slice(0, found.index) + (!found.index || end ==\n\
            cur.length ? \"\" : \" \") + cur.slice(end) || null;\n\
        }\n\
        return true;\n\
      });\n\
    }),\n\
\n\
    addLineWidget: operation(null, function(handle, node, options) {\n\
      return addLineWidget(this, handle, node, options);\n\
    }),\n\
\n\
    removeLineWidget: function(widget) {\n\
      widget.clear();\n\
    },\n\
\n\
    lineInfo: function(line) {\n\
      if (typeof line == \"number\") {\n\
        if (!isLine(this.doc, line)) return null;\n\
        var n = line;\n\
        line = getLine(this.doc, line);\n\
        if (!line) return null;\n\
      } else {\n\
        var n = lineNo(line);\n\
        if (n == null) return null;\n\
      }\n\
      return {\n\
        line: n,\n\
        handle: line,\n\
        text: line.text,\n\
        gutterMarkers: line.gutterMarkers,\n\
        textClass: line.textClass,\n\
        bgClass: line.bgClass,\n\
        wrapClass: line.wrapClass,\n\
        widgets: line.widgets\n\
      };\n\
    },\n\
\n\
    getViewport: function() {\n\
      return {\n\
        from: this.display.showingFrom,\n\
        to: this.display.showingTo\n\
      };\n\
    },\n\
\n\
    addWidget: function(pos, node, scroll, vert, horiz) {\n\
      var display = this.display;\n\
      pos = cursorCoords(this, clipPos(this.doc, pos));\n\
      var top = pos.bottom,\n\
        left = pos.left;\n\
      node.style.position = \"absolute\";\n\
      display.sizer.appendChild(node);\n\
      if (vert == \"over\") {\n\
        top = pos.top;\n\
      } else if (vert == \"above\" || vert == \"near\") {\n\
        var vspace = Math.max(display.wrapper.clientHeight, this.doc.height),\n\
          hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);\n\
        // Default to positioning above (if specified and possible); otherwise default to positioning below\n\
        if ((vert == 'above' || pos.bottom + node.offsetHeight > vspace) &&\n\
          pos.top > node.offsetHeight)\n\
          top = pos.top - node.offsetHeight;\n\
        else if (pos.bottom + node.offsetHeight <= vspace)\n\
          top = pos.bottom;\n\
        if (left + node.offsetWidth > hspace)\n\
          left = hspace - node.offsetWidth;\n\
      }\n\
      node.style.top = top + \"px\";\n\
      node.style.left = node.style.right = \"\";\n\
      if (horiz == \"right\") {\n\
        left = display.sizer.clientWidth - node.offsetWidth;\n\
        node.style.right = \"0px\";\n\
      } else {\n\
        if (horiz == \"left\") left = 0;\n\
        else if (horiz == \"middle\") left = (display.sizer.clientWidth - node.offsetWidth) /\n\
          2;\n\
        node.style.left = left + \"px\";\n\
      }\n\
      if (scroll)\n\
        scrollIntoView(this, left, top, left + node.offsetWidth, top + node.offsetHeight);\n\
    },\n\
\n\
    triggerOnKeyDown: operation(null, onKeyDown),\n\
\n\
    execCommand: function(cmd) {\n\
      return commands[cmd](this);\n\
    },\n\
\n\
    findPosH: function(from, amount, unit, visually) {\n\
      var dir = 1;\n\
      if (amount < 0) {\n\
        dir = -1;\n\
        amount = -amount;\n\
      }\n\
      for (var i = 0, cur = clipPos(this.doc, from); i < amount; ++i) {\n\
        cur = findPosH(this.doc, cur, dir, unit, visually);\n\
        if (cur.hitSide) break;\n\
      }\n\
      return cur;\n\
    },\n\
\n\
    moveH: operation(null, function(dir, unit) {\n\
      var sel = this.doc.sel,\n\
        pos;\n\
      if (sel.shift || sel.extend || posEq(sel.from, sel.to))\n\
        pos = findPosH(this.doc, sel.head, dir, unit, this.options.rtlMoveVisually);\n\
      else\n\
        pos = dir < 0 ? sel.from : sel.to;\n\
      extendSelection(this.doc, pos, pos, dir);\n\
    }),\n\
\n\
    deleteH: operation(null, function(dir, unit) {\n\
      var sel = this.doc.sel;\n\
      if (!posEq(sel.from, sel.to)) replaceRange(this.doc, \"\", sel.from,\n\
        sel.to, \"+delete\");\n\
      else replaceRange(this.doc, \"\", sel.from, findPosH(this.doc, sel.head,\n\
        dir, unit, false), \"+delete\");\n\
      this.curOp.userSelChange = true;\n\
    }),\n\
\n\
    findPosV: function(from, amount, unit, goalColumn) {\n\
      var dir = 1,\n\
        x = goalColumn;\n\
      if (amount < 0) {\n\
        dir = -1;\n\
        amount = -amount;\n\
      }\n\
      for (var i = 0, cur = clipPos(this.doc, from); i < amount; ++i) {\n\
        var coords = cursorCoords(this, cur, \"div\");\n\
        if (x == null) x = coords.left;\n\
        else coords.left = x;\n\
        cur = findPosV(this, coords, dir, unit);\n\
        if (cur.hitSide) break;\n\
      }\n\
      return cur;\n\
    },\n\
\n\
    moveV: operation(null, function(dir, unit) {\n\
      var sel = this.doc.sel;\n\
      var pos = cursorCoords(this, sel.head, \"div\");\n\
      if (sel.goalColumn != null) pos.left = sel.goalColumn;\n\
      var target = findPosV(this, pos, dir, unit);\n\
\n\
      if (unit == \"page\") addToScrollPos(this, 0, charCoords(this, target,\n\
          \"div\")\n\
        .top - pos.top);\n\
      extendSelection(this.doc, target, target, dir);\n\
      sel.goalColumn = pos.left;\n\
    }),\n\
\n\
    toggleOverwrite: function(value) {\n\
      if (value != null && value == this.state.overwrite) return;\n\
      if (this.state.overwrite = !this.state.overwrite)\n\
        this.display.cursor.className += \" CodeMirror-overwrite\";\n\
      else\n\
        this.display.cursor.className = this.display.cursor.className.replace(\n\
          \" CodeMirror-overwrite\", \"\");\n\
    },\n\
    hasFocus: function() {\n\
      return this.state.focused;\n\
    },\n\
\n\
    scrollTo: operation(null, function(x, y) {\n\
      updateScrollPos(this, x, y);\n\
    }),\n\
    getScrollInfo: function() {\n\
      var scroller = this.display.scroller,\n\
        co = scrollerCutOff;\n\
      return {\n\
        left: scroller.scrollLeft,\n\
        top: scroller.scrollTop,\n\
        height: scroller.scrollHeight - co,\n\
        width: scroller.scrollWidth - co,\n\
        clientHeight: scroller.clientHeight - co,\n\
        clientWidth: scroller.clientWidth - co\n\
      };\n\
    },\n\
\n\
    scrollIntoView: operation(null, function(range, margin) {\n\
      if (range == null) range = {\n\
        from: this.doc.sel.head,\n\
        to: null\n\
      };\n\
      else if (typeof range == \"number\") range = {\n\
        from: Pos(range, 0),\n\
        to: null\n\
      };\n\
      else if (range.from == null) range = {\n\
        from: range,\n\
        to: null\n\
      };\n\
      if (!range.to) range.to = range.from;\n\
      if (!margin) margin = 0;\n\
\n\
      var coords = range;\n\
      if (range.from.line != null) {\n\
        this.curOp.scrollToPos = {\n\
          from: range.from,\n\
          to: range.to,\n\
          margin: margin\n\
        };\n\
        coords = {\n\
          from: cursorCoords(this, range.from),\n\
          to: cursorCoords(this, range.to)\n\
        };\n\
      }\n\
      var sPos = calculateScrollPos(this, Math.min(coords.from.left, coords\n\
          .to.left),\n\
        Math.min(coords.from.top, coords.to.top) - margin,\n\
        Math.max(coords.from.right, coords.to.right),\n\
        Math.max(coords.from.bottom, coords.to.bottom) + margin);\n\
      updateScrollPos(this, sPos.scrollLeft, sPos.scrollTop);\n\
    }),\n\
\n\
    setSize: operation(null, function(width, height) {\n\
      function interpret(val) {\n\
        return typeof val == \"number\" || /^\\d+$/.test(String(val)) ? val +\n\
          \"px\" : val;\n\
      }\n\
      if (width != null) this.display.wrapper.style.width = interpret(width);\n\
      if (height != null) this.display.wrapper.style.height = interpret(\n\
        height);\n\
      if (this.options.lineWrapping)\n\
        this.display.measureLineCache.length = this.display.measureLineCachePos =\n\
          0;\n\
      this.curOp.forceUpdate = true;\n\
    }),\n\
\n\
    operation: function(f) {\n\
      return runInOp(this, f);\n\
    },\n\
\n\
    refresh: operation(null, function() {\n\
      var badHeight = this.display.cachedTextHeight == null;\n\
      clearCaches(this);\n\
      updateScrollPos(this, this.doc.scrollLeft, this.doc.scrollTop);\n\
      regChange(this);\n\
      if (badHeight) estimateLineHeights(this);\n\
    }),\n\
\n\
    swapDoc: operation(null, function(doc) {\n\
      var old = this.doc;\n\
      old.cm = null;\n\
      attachDoc(this, doc);\n\
      clearCaches(this);\n\
      resetInput(this, true);\n\
      updateScrollPos(this, doc.scrollLeft, doc.scrollTop);\n\
      signalLater(this, \"swapDoc\", this, old);\n\
      return old;\n\
    }),\n\
\n\
    getInputField: function() {\n\
      return this.display.input;\n\
    },\n\
    getWrapperElement: function() {\n\
      return this.display.wrapper;\n\
    },\n\
    getScrollerElement: function() {\n\
      return this.display.scroller;\n\
    },\n\
    getGutterElement: function() {\n\
      return this.display.gutters;\n\
    }\n\
  };\n\
  eventMixin(CodeMirror);\n\
\n\
  // OPTION DEFAULTS\n\
\n\
  var optionHandlers = CodeMirror.optionHandlers = {};\n\
\n\
  // The default configuration options.\n\
  var defaults = CodeMirror.defaults = {};\n\
\n\
  function option(name, deflt, handle, notOnInit) {\n\
    CodeMirror.defaults[name] = deflt;\n\
    if (handle) optionHandlers[name] =\n\
      notOnInit ? function(cm, val, old) {\n\
        if (old != Init) handle(cm, val, old);\n\
    } : handle;\n\
  }\n\
\n\
  var Init = CodeMirror.Init = {\n\
    toString: function() {\n\
      return \"CodeMirror.Init\";\n\
    }\n\
  };\n\
\n\
  // These two are, on init, called from the constructor because they\n\
  // have to be initialized before the editor can start at all.\n\
  option(\"value\", \"\", function(cm, val) {\n\
    cm.setValue(val);\n\
  }, true);\n\
  option(\"mode\", null, function(cm, val) {\n\
    cm.doc.modeOption = val;\n\
    loadMode(cm);\n\
  }, true);\n\
\n\
  option(\"indentUnit\", 2, loadMode, true);\n\
  option(\"indentWithTabs\", false);\n\
  option(\"smartIndent\", true);\n\
  option(\"tabSize\", 4, function(cm) {\n\
    loadMode(cm);\n\
    clearCaches(cm);\n\
    regChange(cm);\n\
  }, true);\n\
  option(\"specialChars\", /[\\t\\u0000-\\u0019\\u00ad\\u200b\\u2028\\u2029\\ufeff]/g,\n\
    function(cm, val) {\n\
      cm.options.specialChars = new RegExp(val.source + (val.test(\"\\t\") ? \"\" :\n\
        \"|\\t\"), \"g\");\n\
      cm.refresh();\n\
    }, true);\n\
  option(\"specialCharPlaceholder\", defaultSpecialCharPlaceholder, function(cm) {\n\
    cm.refresh();\n\
  }, true);\n\
  option(\"electricChars\", true);\n\
  option(\"rtlMoveVisually\", !windows);\n\
  option(\"wholeLineUpdateBefore\", true);\n\
\n\
  option(\"theme\", \"default\", function(cm) {\n\
    themeChanged(cm);\n\
    guttersChanged(cm);\n\
  }, true);\n\
  option(\"keyMap\", \"default\", keyMapChanged);\n\
  option(\"extraKeys\", null);\n\
\n\
  option(\"onKeyEvent\", null);\n\
  option(\"onDragEvent\", null);\n\
\n\
  option(\"lineWrapping\", false, wrappingChanged, true);\n\
  option(\"gutters\", [], function(cm) {\n\
    setGuttersForLineNumbers(cm.options);\n\
    guttersChanged(cm);\n\
  }, true);\n\
  option(\"fixedGutter\", true, function(cm, val) {\n\
    cm.display.gutters.style.left = val ? compensateForHScroll(cm.display) +\n\
      \"px\" : \"0\";\n\
    cm.refresh();\n\
  }, true);\n\
  option(\"coverGutterNextToScrollbar\", false, updateScrollbars, true);\n\
  option(\"lineNumbers\", false, function(cm) {\n\
    setGuttersForLineNumbers(cm.options);\n\
    guttersChanged(cm);\n\
  }, true);\n\
  option(\"firstLineNumber\", 1, guttersChanged, true);\n\
  option(\"lineNumberFormatter\", function(integer) {\n\
    return integer;\n\
  }, guttersChanged, true);\n\
  option(\"showCursorWhenSelecting\", false, updateSelection, true);\n\
\n\
  option(\"resetSelectionOnContextMenu\", true);\n\
\n\
  option(\"readOnly\", false, function(cm, val) {\n\
    if (val == \"nocursor\") {\n\
      onBlur(cm);\n\
      cm.display.input.blur();\n\
      cm.display.disabled = true;\n\
    } else {\n\
      cm.display.disabled = false;\n\
      if (!val) resetInput(cm, true);\n\
    }\n\
  });\n\
  option(\"dragDrop\", true);\n\
\n\
  option(\"cursorBlinkRate\", 530);\n\
  option(\"cursorScrollMargin\", 0);\n\
  option(\"cursorHeight\", 1);\n\
  option(\"workTime\", 100);\n\
  option(\"workDelay\", 100);\n\
  option(\"flattenSpans\", true);\n\
  option(\"pollInterval\", 100);\n\
  option(\"undoDepth\", 40, function(cm, val) {\n\
    cm.doc.history.undoDepth = val;\n\
  });\n\
  option(\"historyEventDelay\", 500);\n\
  option(\"viewportMargin\", 10, function(cm) {\n\
    cm.refresh();\n\
  }, true);\n\
  option(\"maxHighlightLength\", 10000, function(cm) {\n\
    loadMode(cm);\n\
    cm.refresh();\n\
  }, true);\n\
  option(\"crudeMeasuringFrom\", 10000);\n\
  option(\"moveInputWithCursor\", true, function(cm, val) {\n\
    if (!val) cm.display.inputDiv.style.top = cm.display.inputDiv.style.left =\n\
      0;\n\
  });\n\
\n\
  option(\"tabindex\", null, function(cm, val) {\n\
    cm.display.input.tabIndex = val || \"\";\n\
  });\n\
  option(\"autofocus\", null);\n\
\n\
  // MODE DEFINITION AND QUERYING\n\
\n\
  // Known modes, by name and by MIME\n\
  var modes = CodeMirror.modes = {}, mimeModes = CodeMirror.mimeModes = {};\n\
\n\
  CodeMirror.defineMode = function(name, mode) {\n\
    if (!CodeMirror.defaults.mode && name != \"null\") CodeMirror.defaults.mode =\n\
      name;\n\
    if (arguments.length > 2) {\n\
      mode.dependencies = [];\n\
      for (var i = 2; i < arguments.length; ++i) mode.dependencies.push(\n\
        arguments[i]);\n\
    }\n\
    modes[name] = mode;\n\
  };\n\
\n\
  CodeMirror.defineMIME = function(mime, spec) {\n\
    mimeModes[mime] = spec;\n\
  };\n\
\n\
  CodeMirror.resolveMode = function(spec) {\n\
    if (typeof spec == \"string\" && mimeModes.hasOwnProperty(spec)) {\n\
      spec = mimeModes[spec];\n\
    } else if (spec && typeof spec.name == \"string\" && mimeModes.hasOwnProperty(\n\
      spec.name)) {\n\
      var found = mimeModes[spec.name];\n\
      spec = createObj(found, spec);\n\
      spec.name = found.name;\n\
    } else if (typeof spec == \"string\" && /^[\\w\\-]+\\/[\\w\\-]+\\+xml$/.test(spec)) {\n\
      return CodeMirror.resolveMode(\"application/xml\");\n\
    }\n\
    if (typeof spec == \"string\") return {\n\
      name: spec\n\
    };\n\
    else return spec || {\n\
      name: \"null\"\n\
    };\n\
  };\n\
\n\
  CodeMirror.getMode = function(options, spec) {\n\
    var spec = CodeMirror.resolveMode(spec);\n\
    var mfactory = modes[spec.name];\n\
    if (!mfactory) return CodeMirror.getMode(options, \"text/plain\");\n\
    var modeObj = mfactory(options, spec);\n\
    if (modeExtensions.hasOwnProperty(spec.name)) {\n\
      var exts = modeExtensions[spec.name];\n\
      for (var prop in exts) {\n\
        if (!exts.hasOwnProperty(prop)) continue;\n\
        if (modeObj.hasOwnProperty(prop)) modeObj[\"_\" + prop] = modeObj[prop];\n\
        modeObj[prop] = exts[prop];\n\
      }\n\
    }\n\
    modeObj.name = spec.name;\n\
\n\
    return modeObj;\n\
  };\n\
\n\
  CodeMirror.defineMode(\"null\", function() {\n\
    return {\n\
      token: function(stream) {\n\
        stream.skipToEnd();\n\
      }\n\
    };\n\
  });\n\
  CodeMirror.defineMIME(\"text/plain\", \"null\");\n\
\n\
  var modeExtensions = CodeMirror.modeExtensions = {};\n\
  CodeMirror.extendMode = function(mode, properties) {\n\
    var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : (\n\
      modeExtensions[mode] = {});\n\
    copyObj(properties, exts);\n\
  };\n\
\n\
  // EXTENSIONS\n\
\n\
  CodeMirror.defineExtension = function(name, func) {\n\
    CodeMirror.prototype[name] = func;\n\
  };\n\
  CodeMirror.defineDocExtension = function(name, func) {\n\
    Doc.prototype[name] = func;\n\
  };\n\
  CodeMirror.defineOption = option;\n\
\n\
  var initHooks = [];\n\
  CodeMirror.defineInitHook = function(f) {\n\
    initHooks.push(f);\n\
  };\n\
\n\
  var helpers = CodeMirror.helpers = {};\n\
  CodeMirror.registerHelper = function(type, name, value) {\n\
    if (!helpers.hasOwnProperty(type)) helpers[type] = CodeMirror[type] = {};\n\
    helpers[type][name] = value;\n\
  };\n\
\n\
  // UTILITIES\n\
\n\
  CodeMirror.isWordChar = isWordChar;\n\
\n\
  // MODE STATE HANDLING\n\
\n\
  // Utility functions for working with state. Exported because modes\n\
  // sometimes need to do this.\n\
  function copyState(mode, state) {\n\
    if (state === true) return state;\n\
    if (mode.copyState) return mode.copyState(state);\n\
    var nstate = {};\n\
    for (var n in state) {\n\
      var val = state[n];\n\
      if (val instanceof Array) val = val.concat([]);\n\
      nstate[n] = val;\n\
    }\n\
    return nstate;\n\
  }\n\
  CodeMirror.copyState = copyState;\n\
\n\
  function startState(mode, a1, a2) {\n\
    return mode.startState ? mode.startState(a1, a2) : true;\n\
  }\n\
  CodeMirror.startState = startState;\n\
\n\
  CodeMirror.innerMode = function(mode, state) {\n\
    while (mode.innerMode) {\n\
      var info = mode.innerMode(state);\n\
      if (!info || info.mode == mode) break;\n\
      state = info.state;\n\
      mode = info.mode;\n\
    }\n\
    return info || {\n\
      mode: mode,\n\
      state: state\n\
    };\n\
  };\n\
\n\
  // STANDARD COMMANDS\n\
\n\
  var commands = CodeMirror.commands = {\n\
    selectAll: function(cm) {\n\
      cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()));\n\
    },\n\
    killLine: function(cm) {\n\
      var from = cm.getCursor(true),\n\
        to = cm.getCursor(false),\n\
        sel = !posEq(from, to);\n\
      if (!sel && cm.getLine(from.line)\n\
        .length == from.ch)\n\
        cm.replaceRange(\"\", from, Pos(from.line + 1, 0), \"+delete\");\n\
      else cm.replaceRange(\"\", from, sel ? to : Pos(from.line), \"+delete\");\n\
    },\n\
    deleteLine: function(cm) {\n\
      var l = cm.getCursor()\n\
        .line;\n\
      cm.replaceRange(\"\", Pos(l, 0), Pos(l), \"+delete\");\n\
    },\n\
    delLineLeft: function(cm) {\n\
      var cur = cm.getCursor();\n\
      cm.replaceRange(\"\", Pos(cur.line, 0), cur, \"+delete\");\n\
    },\n\
    undo: function(cm) {\n\
      cm.undo();\n\
    },\n\
    redo: function(cm) {\n\
      cm.redo();\n\
    },\n\
    goDocStart: function(cm) {\n\
      cm.extendSelection(Pos(cm.firstLine(), 0));\n\
    },\n\
    goDocEnd: function(cm) {\n\
      cm.extendSelection(Pos(cm.lastLine()));\n\
    },\n\
    goLineStart: function(cm) {\n\
      cm.extendSelection(lineStart(cm, cm.getCursor()\n\
        .line));\n\
    },\n\
    goLineStartSmart: function(cm) {\n\
      var cur = cm.getCursor(),\n\
        start = lineStart(cm, cur.line);\n\
      var line = cm.getLineHandle(start.line);\n\
      var order = getOrder(line);\n\
      if (!order || order[0].level == 0) {\n\
        var firstNonWS = Math.max(0, line.text.search(/\\S/));\n\
        var inWS = cur.line == start.line && cur.ch <= firstNonWS && cur.ch;\n\
        cm.extendSelection(Pos(start.line, inWS ? 0 : firstNonWS));\n\
      } else cm.extendSelection(start);\n\
    },\n\
    goLineEnd: function(cm) {\n\
      cm.extendSelection(lineEnd(cm, cm.getCursor()\n\
        .line));\n\
    },\n\
    goLineRight: function(cm) {\n\
      var top = cm.charCoords(cm.getCursor(), \"div\")\n\
        .top + 5;\n\
      cm.extendSelection(cm.coordsChar({\n\
        left: cm.display.lineDiv.offsetWidth + 100,\n\
        top: top\n\
      }, \"div\"));\n\
    },\n\
    goLineLeft: function(cm) {\n\
      var top = cm.charCoords(cm.getCursor(), \"div\")\n\
        .top + 5;\n\
      cm.extendSelection(cm.coordsChar({\n\
        left: 0,\n\
        top: top\n\
      }, \"div\"));\n\
    },\n\
    goLineUp: function(cm) {\n\
      cm.moveV(-1, \"line\");\n\
    },\n\
    goLineDown: function(cm) {\n\
      cm.moveV(1, \"line\");\n\
    },\n\
    goPageUp: function(cm) {\n\
      cm.moveV(-1, \"page\");\n\
    },\n\
    goPageDown: function(cm) {\n\
      cm.moveV(1, \"page\");\n\
    },\n\
    goCharLeft: function(cm) {\n\
      cm.moveH(-1, \"char\");\n\
    },\n\
    goCharRight: function(cm) {\n\
      cm.moveH(1, \"char\");\n\
    },\n\
    goColumnLeft: function(cm) {\n\
      cm.moveH(-1, \"column\");\n\
    },\n\
    goColumnRight: function(cm) {\n\
      cm.moveH(1, \"column\");\n\
    },\n\
    goWordLeft: function(cm) {\n\
      cm.moveH(-1, \"word\");\n\
    },\n\
    goGroupRight: function(cm) {\n\
      cm.moveH(1, \"group\");\n\
    },\n\
    goGroupLeft: function(cm) {\n\
      cm.moveH(-1, \"group\");\n\
    },\n\
    goWordRight: function(cm) {\n\
      cm.moveH(1, \"word\");\n\
    },\n\
    delCharBefore: function(cm) {\n\
      cm.deleteH(-1, \"char\");\n\
    },\n\
    delCharAfter: function(cm) {\n\
      cm.deleteH(1, \"char\");\n\
    },\n\
    delWordBefore: function(cm) {\n\
      cm.deleteH(-1, \"word\");\n\
    },\n\
    delWordAfter: function(cm) {\n\
      cm.deleteH(1, \"word\");\n\
    },\n\
    delGroupBefore: function(cm) {\n\
      cm.deleteH(-1, \"group\");\n\
    },\n\
    delGroupAfter: function(cm) {\n\
      cm.deleteH(1, \"group\");\n\
    },\n\
    indentAuto: function(cm) {\n\
      cm.indentSelection(\"smart\");\n\
    },\n\
    indentMore: function(cm) {\n\
      cm.indentSelection(\"add\");\n\
    },\n\
    indentLess: function(cm) {\n\
      cm.indentSelection(\"subtract\");\n\
    },\n\
    insertTab: function(cm) {\n\
      cm.replaceSelection(\"\\t\", \"end\", \"+input\");\n\
    },\n\
    defaultTab: function(cm) {\n\
      if (cm.somethingSelected()) cm.indentSelection(\"add\");\n\
      else cm.replaceSelection(\"\\t\", \"end\", \"+input\");\n\
    },\n\
    transposeChars: function(cm) {\n\
      var cur = cm.getCursor(),\n\
        line = cm.getLine(cur.line);\n\
      if (cur.ch > 0 && cur.ch < line.length - 1)\n\
        cm.replaceRange(line.charAt(cur.ch) + line.charAt(cur.ch - 1),\n\
          Pos(cur.line, cur.ch - 1), Pos(cur.line, cur.ch + 1));\n\
    },\n\
    newlineAndIndent: function(cm) {\n\
      operation(cm, function() {\n\
        cm.replaceSelection(\"\\n\
\", \"end\", \"+input\");\n\
        cm.indentLine(cm.getCursor()\n\
          .line, null, true);\n\
      })();\n\
    },\n\
    toggleOverwrite: function(cm) {\n\
      cm.toggleOverwrite();\n\
    }\n\
  };\n\
\n\
  // STANDARD KEYMAPS\n\
\n\
  var keyMap = CodeMirror.keyMap = {};\n\
  keyMap.basic = {\n\
    \"Left\": \"goCharLeft\",\n\
    \"Right\": \"goCharRight\",\n\
    \"Up\": \"goLineUp\",\n\
    \"Down\": \"goLineDown\",\n\
    \"End\": \"goLineEnd\",\n\
    \"Home\": \"goLineStartSmart\",\n\
    \"PageUp\": \"goPageUp\",\n\
    \"PageDown\": \"goPageDown\",\n\
    \"Delete\": \"delCharAfter\",\n\
    \"Backspace\": \"delCharBefore\",\n\
    \"Shift-Backspace\": \"delCharBefore\",\n\
    \"Tab\": \"defaultTab\",\n\
    \"Shift-Tab\": \"indentAuto\",\n\
    \"Enter\": \"newlineAndIndent\",\n\
    \"Insert\": \"toggleOverwrite\"\n\
  };\n\
  // Note that the save and find-related commands aren't defined by\n\
  // default. Unknown commands are simply ignored.\n\
  keyMap.pcDefault = {\n\
    \"Ctrl-A\": \"selectAll\",\n\
    \"Ctrl-D\": \"deleteLine\",\n\
    \"Ctrl-Z\": \"undo\",\n\
    \"Shift-Ctrl-Z\": \"redo\",\n\
    \"Ctrl-Y\": \"redo\",\n\
    \"Ctrl-Home\": \"goDocStart\",\n\
    \"Alt-Up\": \"goDocStart\",\n\
    \"Ctrl-End\": \"goDocEnd\",\n\
    \"Ctrl-Down\": \"goDocEnd\",\n\
    \"Ctrl-Left\": \"goGroupLeft\",\n\
    \"Ctrl-Right\": \"goGroupRight\",\n\
    \"Alt-Left\": \"goLineStart\",\n\
    \"Alt-Right\": \"goLineEnd\",\n\
    \"Ctrl-Backspace\": \"delGroupBefore\",\n\
    \"Ctrl-Delete\": \"delGroupAfter\",\n\
    \"Ctrl-S\": \"save\",\n\
    \"Ctrl-F\": \"find\",\n\
    \"Ctrl-G\": \"findNext\",\n\
    \"Shift-Ctrl-G\": \"findPrev\",\n\
    \"Shift-Ctrl-F\": \"replace\",\n\
    \"Shift-Ctrl-R\": \"replaceAll\",\n\
    \"Ctrl-[\": \"indentLess\",\n\
    \"Ctrl-]\": \"indentMore\",\n\
    fallthrough: \"basic\"\n\
  };\n\
  keyMap.macDefault = {\n\
    \"Cmd-A\": \"selectAll\",\n\
    \"Cmd-D\": \"deleteLine\",\n\
    \"Cmd-Z\": \"undo\",\n\
    \"Shift-Cmd-Z\": \"redo\",\n\
    \"Cmd-Y\": \"redo\",\n\
    \"Cmd-Up\": \"goDocStart\",\n\
    \"Cmd-End\": \"goDocEnd\",\n\
    \"Cmd-Down\": \"goDocEnd\",\n\
    \"Alt-Left\": \"goGroupLeft\",\n\
    \"Alt-Right\": \"goGroupRight\",\n\
    \"Cmd-Left\": \"goLineStart\",\n\
    \"Cmd-Right\": \"goLineEnd\",\n\
    \"Alt-Backspace\": \"delGroupBefore\",\n\
    \"Ctrl-Alt-Backspace\": \"delGroupAfter\",\n\
    \"Alt-Delete\": \"delGroupAfter\",\n\
    \"Cmd-S\": \"save\",\n\
    \"Cmd-F\": \"find\",\n\
    \"Cmd-G\": \"findNext\",\n\
    \"Shift-Cmd-G\": \"findPrev\",\n\
    \"Cmd-Alt-F\": \"replace\",\n\
    \"Shift-Cmd-Alt-F\": \"replaceAll\",\n\
    \"Cmd-[\": \"indentLess\",\n\
    \"Cmd-]\": \"indentMore\",\n\
    \"Cmd-Backspace\": \"delLineLeft\",\n\
    fallthrough: [\"basic\", \"emacsy\"]\n\
  };\n\
  keyMap[\"default\"] = mac ? keyMap.macDefault : keyMap.pcDefault;\n\
  keyMap.emacsy = {\n\
    \"Ctrl-F\": \"goCharRight\",\n\
    \"Ctrl-B\": \"goCharLeft\",\n\
    \"Ctrl-P\": \"goLineUp\",\n\
    \"Ctrl-N\": \"goLineDown\",\n\
    \"Alt-F\": \"goWordRight\",\n\
    \"Alt-B\": \"goWordLeft\",\n\
    \"Ctrl-A\": \"goLineStart\",\n\
    \"Ctrl-E\": \"goLineEnd\",\n\
    \"Ctrl-V\": \"goPageDown\",\n\
    \"Shift-Ctrl-V\": \"goPageUp\",\n\
    \"Ctrl-D\": \"delCharAfter\",\n\
    \"Ctrl-H\": \"delCharBefore\",\n\
    \"Alt-D\": \"delWordAfter\",\n\
    \"Alt-Backspace\": \"delWordBefore\",\n\
    \"Ctrl-K\": \"killLine\",\n\
    \"Ctrl-T\": \"transposeChars\"\n\
  };\n\
\n\
  // KEYMAP DISPATCH\n\
\n\
  function getKeyMap(val) {\n\
    if (typeof val == \"string\") return keyMap[val];\n\
    else return val;\n\
  }\n\
\n\
  function lookupKey(name, maps, handle) {\n\
    function lookup(map) {\n\
      map = getKeyMap(map);\n\
      var found = map[name];\n\
      if (found === false) return \"stop\";\n\
      if (found != null && handle(found)) return true;\n\
      if (map.nofallthrough) return \"stop\";\n\
\n\
      var fallthrough = map.fallthrough;\n\
      if (fallthrough == null) return false;\n\
      if (Object.prototype.toString.call(fallthrough) != \"[object Array]\")\n\
        return lookup(fallthrough);\n\
      for (var i = 0, e = fallthrough.length; i < e; ++i) {\n\
        var done = lookup(fallthrough[i]);\n\
        if (done) return done;\n\
      }\n\
      return false;\n\
    }\n\
\n\
    for (var i = 0; i < maps.length; ++i) {\n\
      var done = lookup(maps[i]);\n\
      if (done) return done != \"stop\";\n\
    }\n\
  }\n\
\n\
  function isModifierKey(event) {\n\
    var name = keyNames[event.keyCode];\n\
    return name == \"Ctrl\" || name == \"Alt\" || name == \"Shift\" || name ==\n\
      \"Mod\";\n\
  }\n\
\n\
  function keyName(event, noShift) {\n\
    if (opera && event.keyCode == 34 && event[\"char\"]) return false;\n\
    var name = keyNames[event.keyCode];\n\
    if (name == null || event.altGraphKey) return false;\n\
    if (event.altKey) name = \"Alt-\" + name;\n\
    if (flipCtrlCmd ? event.metaKey : event.ctrlKey) name = \"Ctrl-\" + name;\n\
    if (flipCtrlCmd ? event.ctrlKey : event.metaKey) name = \"Cmd-\" + name;\n\
    if (!noShift && event.shiftKey) name = \"Shift-\" + name;\n\
    return name;\n\
  }\n\
  CodeMirror.lookupKey = lookupKey;\n\
  CodeMirror.isModifierKey = isModifierKey;\n\
  CodeMirror.keyName = keyName;\n\
\n\
  // FROMTEXTAREA\n\
\n\
  CodeMirror.fromTextArea = function(textarea, options) {\n\
    if (!options) options = {};\n\
    options.value = textarea.value;\n\
    if (!options.tabindex && textarea.tabindex)\n\
      options.tabindex = textarea.tabindex;\n\
    if (!options.placeholder && textarea.placeholder)\n\
      options.placeholder = textarea.placeholder;\n\
    // Set autofocus to true if this textarea is focused, or if it has\n\
    // autofocus and no other element is focused.\n\
    if (options.autofocus == null) {\n\
      var hasFocus = document.body;\n\
      // doc.activeElement occasionally throws on IE\n\
      try {\n\
        hasFocus = document.activeElement;\n\
      } catch (e) {}\n\
      options.autofocus = hasFocus == textarea ||\n\
        textarea.getAttribute(\"autofocus\") != null && hasFocus == document.body;\n\
    }\n\
\n\
    function save() {\n\
      textarea.value = cm.getValue();\n\
    }\n\
    if (textarea.form) {\n\
      on(textarea.form, \"submit\", save);\n\
      // Deplorable hack to make the submit method do the right thing.\n\
      if (!options.leaveSubmitMethodAlone) {\n\
        var form = textarea.form,\n\
          realSubmit = form.submit;\n\
        try {\n\
          var wrappedSubmit = form.submit = function() {\n\
            save();\n\
            form.submit = realSubmit;\n\
            form.submit();\n\
            form.submit = wrappedSubmit;\n\
          };\n\
        } catch (e) {}\n\
      }\n\
    }\n\
\n\
    textarea.style.display = \"none\";\n\
    var cm = CodeMirror(function(node) {\n\
      textarea.parentNode.insertBefore(node, textarea.nextSibling);\n\
    }, options);\n\
    cm.save = save;\n\
    cm.getTextArea = function() {\n\
      return textarea;\n\
    };\n\
    cm.toTextArea = function() {\n\
      save();\n\
      textarea.parentNode.removeChild(cm.getWrapperElement());\n\
      textarea.style.display = \"\";\n\
      if (textarea.form) {\n\
        off(textarea.form, \"submit\", save);\n\
        if (typeof textarea.form.submit == \"function\")\n\
          textarea.form.submit = realSubmit;\n\
      }\n\
    };\n\
    return cm;\n\
  };\n\
\n\
  // STRING STREAM\n\
\n\
  // Fed to the mode parsers, provides helper functions to make\n\
  // parsers more succinct.\n\
\n\
  // The character stream used by a mode's parser.\n\
  function StringStream(string, tabSize) {\n\
    this.pos = this.start = 0;\n\
    this.string = string;\n\
    this.tabSize = tabSize || 8;\n\
    this.lastColumnPos = this.lastColumnValue = 0;\n\
    this.lineStart = 0;\n\
  }\n\
\n\
  StringStream.prototype = {\n\
    eol: function() {\n\
      return this.pos >= this.string.length;\n\
    },\n\
    sol: function() {\n\
      return this.pos == this.lineStart;\n\
    },\n\
    peek: function() {\n\
      return this.string.charAt(this.pos) || undefined;\n\
    },\n\
    next: function() {\n\
      if (this.pos < this.string.length)\n\
        return this.string.charAt(this.pos++);\n\
    },\n\
    eat: function(match) {\n\
      var ch = this.string.charAt(this.pos);\n\
      if (typeof match == \"string\") var ok = ch == match;\n\
      else var ok = ch && (match.test ? match.test(ch) : match(ch));\n\
      if (ok) {\n\
        ++this.pos;\n\
        return ch;\n\
      }\n\
    },\n\
    eatWhile: function(match) {\n\
      var start = this.pos;\n\
      while (this.eat(match)) {}\n\
      return this.pos > start;\n\
    },\n\
    eatSpace: function() {\n\
      var start = this.pos;\n\
      while (/[\\s\\u00a0]/.test(this.string.charAt(this.pos)))++this.pos;\n\
      return this.pos > start;\n\
    },\n\
    skipToEnd: function() {\n\
      this.pos = this.string.length;\n\
    },\n\
    skipTo: function(ch) {\n\
      var found = this.string.indexOf(ch, this.pos);\n\
      if (found > -1) {\n\
        this.pos = found;\n\
        return true;\n\
      }\n\
    },\n\
    backUp: function(n) {\n\
      this.pos -= n;\n\
    },\n\
    column: function() {\n\
      if (this.lastColumnPos < this.start) {\n\
        this.lastColumnValue = countColumn(this.string, this.start, this.tabSize,\n\
          this.lastColumnPos, this.lastColumnValue);\n\
        this.lastColumnPos = this.start;\n\
      }\n\
      return this.lastColumnValue - (this.lineStart ? countColumn(this.string,\n\
        this.lineStart, this.tabSize) : 0);\n\
    },\n\
    indentation: function() {\n\
      return countColumn(this.string, null, this.tabSize) -\n\
        (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) :\n\
        0);\n\
    },\n\
    match: function(pattern, consume, caseInsensitive) {\n\
      if (typeof pattern == \"string\") {\n\
        var cased = function(str) {\n\
          return caseInsensitive ? str.toLowerCase() : str;\n\
        };\n\
        var substr = this.string.substr(this.pos, pattern.length);\n\
        if (cased(substr) == cased(pattern)) {\n\
          if (consume !== false) this.pos += pattern.length;\n\
          return true;\n\
        }\n\
      } else {\n\
        var match = this.string.slice(this.pos)\n\
          .match(pattern);\n\
        if (match && match.index > 0) return null;\n\
        if (match && consume !== false) this.pos += match[0].length;\n\
        return match;\n\
      }\n\
    },\n\
    current: function() {\n\
      return this.string.slice(this.start, this.pos);\n\
    },\n\
    hideFirstChars: function(n, inner) {\n\
      this.lineStart += n;\n\
      try {\n\
        return inner();\n\
      } finally {\n\
        this.lineStart -= n;\n\
      }\n\
    }\n\
  };\n\
  CodeMirror.StringStream = StringStream;\n\
\n\
  // TEXTMARKERS\n\
\n\
  function TextMarker(doc, type) {\n\
    this.lines = [];\n\
    this.type = type;\n\
    this.doc = doc;\n\
  }\n\
  CodeMirror.TextMarker = TextMarker;\n\
  eventMixin(TextMarker);\n\
\n\
  TextMarker.prototype.clear = function() {\n\
    if (this.explicitlyCleared) return;\n\
    var cm = this.doc.cm,\n\
      withOp = cm && !cm.curOp;\n\
    if (withOp) startOperation(cm);\n\
    if (hasHandler(this, \"clear\")) {\n\
      var found = this.find();\n\
      if (found) signalLater(this, \"clear\", found.from, found.to);\n\
    }\n\
    var min = null,\n\
      max = null;\n\
    for (var i = 0; i < this.lines.length; ++i) {\n\
      var line = this.lines[i];\n\
      var span = getMarkedSpanFor(line.markedSpans, this);\n\
      if (span.to != null) max = lineNo(line);\n\
      line.markedSpans = removeMarkedSpan(line.markedSpans, span);\n\
      if (span.from != null)\n\
        min = lineNo(line);\n\
      else if (this.collapsed && !lineIsHidden(this.doc, line) && cm)\n\
        updateLineHeight(line, textHeight(cm.display));\n\
    }\n\
    if (cm && this.collapsed && !cm.options.lineWrapping)\n\
      for (var i = 0; i < this.lines.length; ++i) {\n\
        var visual = visualLine(cm.doc, this.lines[i]),\n\
          len = lineLength(cm.doc, visual);\n\
        if (len > cm.display.maxLineLength) {\n\
          cm.display.maxLine = visual;\n\
          cm.display.maxLineLength = len;\n\
          cm.display.maxLineChanged = true;\n\
        }\n\
      }\n\
\n\
    if (min != null && cm) regChange(cm, min, max + 1);\n\
    this.lines.length = 0;\n\
    this.explicitlyCleared = true;\n\
    if (this.atomic && this.doc.cantEdit) {\n\
      this.doc.cantEdit = false;\n\
      if (cm) reCheckSelection(cm);\n\
    }\n\
    if (withOp) endOperation(cm);\n\
  };\n\
\n\
  TextMarker.prototype.find = function() {\n\
    var from, to;\n\
    for (var i = 0; i < this.lines.length; ++i) {\n\
      var line = this.lines[i];\n\
      var span = getMarkedSpanFor(line.markedSpans, this);\n\
      if (span.from != null || span.to != null) {\n\
        var found = lineNo(line);\n\
        if (span.from != null) from = Pos(found, span.from);\n\
        if (span.to != null) to = Pos(found, span.to);\n\
      }\n\
    }\n\
    if (this.type == \"bookmark\") return from;\n\
    return from && {\n\
      from: from,\n\
      to: to\n\
    };\n\
  };\n\
\n\
  TextMarker.prototype.changed = function() {\n\
    var pos = this.find(),\n\
      cm = this.doc.cm;\n\
    if (!pos || !cm) return;\n\
    if (this.type != \"bookmark\") pos = pos.from;\n\
    var line = getLine(this.doc, pos.line);\n\
    clearCachedMeasurement(cm, line);\n\
    if (pos.line >= cm.display.showingFrom && pos.line < cm.display.showingTo) {\n\
      for (var node = cm.display.lineDiv.firstChild; node; node = node.nextSibling)\n\
        if (node.lineObj == line) {\n\
          if (node.offsetHeight != line.height) updateLineHeight(line, node.offsetHeight);\n\
          break;\n\
        }\n\
      runInOp(cm, function() {\n\
        cm.curOp.selectionChanged = cm.curOp.forceUpdate = cm.curOp.updateMaxLine =\n\
          true;\n\
      });\n\
    }\n\
  };\n\
\n\
  TextMarker.prototype.attachLine = function(line) {\n\
    if (!this.lines.length && this.doc.cm) {\n\
      var op = this.doc.cm.curOp;\n\
      if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -\n\
        1)\n\
        (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = []))\n\
          .push(this);\n\
    }\n\
    this.lines.push(line);\n\
  };\n\
  TextMarker.prototype.detachLine = function(line) {\n\
    this.lines.splice(indexOf(this.lines, line), 1);\n\
    if (!this.lines.length && this.doc.cm) {\n\
      var op = this.doc.cm.curOp;\n\
      (op.maybeHiddenMarkers || (op.maybeHiddenMarkers = []))\n\
        .push(this);\n\
    }\n\
  };\n\
\n\
  function markText(doc, from, to, options, type) {\n\
    if (options && options.shared) return markTextShared(doc, from, to,\n\
      options, type);\n\
    if (doc.cm && !doc.cm.curOp) return operation(doc.cm, markText)(doc, from,\n\
      to, options, type);\n\
\n\
    var marker = new TextMarker(doc, type);\n\
    if (options) copyObj(options, marker);\n\
    if (posLess(to, from) || posEq(from, to) && marker.clearWhenEmpty !==\n\
      false)\n\
      return marker;\n\
    if (marker.replacedWith) {\n\
      marker.collapsed = true;\n\
      marker.replacedWith = elt(\"span\", [marker.replacedWith],\n\
        \"CodeMirror-widget\");\n\
      if (!options.handleMouseEvents) marker.replacedWith.ignoreEvents = true;\n\
    }\n\
    if (marker.collapsed) sawCollapsedSpans = true;\n\
\n\
    if (marker.addToHistory)\n\
      addToHistory(doc, {\n\
        from: from,\n\
        to: to,\n\
        origin: \"markText\"\n\
      }, {\n\
        head: doc.sel.head,\n\
        anchor: doc.sel.anchor\n\
      }, NaN);\n\
\n\
    var curLine = from.line,\n\
      size = 0,\n\
      collapsedAtStart, collapsedAtEnd, cm = doc.cm,\n\
      updateMaxLine;\n\
    doc.iter(curLine, to.line + 1, function(line) {\n\
      if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(\n\
        doc, line) == cm.display.maxLine)\n\
        updateMaxLine = true;\n\
      var span = {\n\
        from: null,\n\
        to: null,\n\
        marker: marker\n\
      };\n\
      size += line.text.length;\n\
      if (curLine == from.line) {\n\
        span.from = from.ch;\n\
        size -= from.ch;\n\
      }\n\
      if (curLine == to.line) {\n\
        span.to = to.ch;\n\
        size -= line.text.length - to.ch;\n\
      }\n\
      if (marker.collapsed) {\n\
        if (curLine == to.line) collapsedAtEnd = collapsedSpanAt(line, to.ch);\n\
        if (curLine == from.line) collapsedAtStart = collapsedSpanAt(line,\n\
          from.ch);\n\
        else updateLineHeight(line, 0);\n\
      }\n\
      addMarkedSpan(line, span);\n\
      ++curLine;\n\
    });\n\
    if (marker.collapsed) doc.iter(from.line, to.line + 1, function(line) {\n\
      if (lineIsHidden(doc, line)) updateLineHeight(line, 0);\n\
    });\n\
\n\
    if (marker.clearOnEnter) on(marker, \"beforeCursorEnter\", function() {\n\
      marker.clear();\n\
    });\n\
\n\
    if (marker.readOnly) {\n\
      sawReadOnlySpans = true;\n\
      if (doc.history.done.length || doc.history.undone.length)\n\
        doc.clearHistory();\n\
    }\n\
    if (marker.collapsed) {\n\
      if (collapsedAtStart != collapsedAtEnd)\n\
        throw new Error(\n\
          \"Inserting collapsed marker overlapping an existing one\");\n\
      marker.size = size;\n\
      marker.atomic = true;\n\
    }\n\
    if (cm) {\n\
      if (updateMaxLine) cm.curOp.updateMaxLine = true;\n\
      if (marker.className || marker.title || marker.startStyle || marker.endStyle ||\n\
        marker.collapsed)\n\
        regChange(cm, from.line, to.line + 1);\n\
      if (marker.atomic) reCheckSelection(cm);\n\
    }\n\
    return marker;\n\
  }\n\
\n\
  // SHARED TEXTMARKERS\n\
\n\
  function SharedTextMarker(markers, primary) {\n\
    this.markers = markers;\n\
    this.primary = primary;\n\
    for (var i = 0, me = this; i < markers.length; ++i) {\n\
      markers[i].parent = this;\n\
      on(markers[i], \"clear\", function() {\n\
        me.clear();\n\
      });\n\
    }\n\
  }\n\
  CodeMirror.SharedTextMarker = SharedTextMarker;\n\
  eventMixin(SharedTextMarker);\n\
\n\
  SharedTextMarker.prototype.clear = function() {\n\
    if (this.explicitlyCleared) return;\n\
    this.explicitlyCleared = true;\n\
    for (var i = 0; i < this.markers.length; ++i)\n\
      this.markers[i].clear();\n\
    signalLater(this, \"clear\");\n\
  };\n\
  SharedTextMarker.prototype.find = function() {\n\
    return this.primary.find();\n\
  };\n\
\n\
  function markTextShared(doc, from, to, options, type) {\n\
    options = copyObj(options);\n\
    options.shared = false;\n\
    var markers = [markText(doc, from, to, options, type)],\n\
      primary = markers[0];\n\
    var widget = options.replacedWith;\n\
    linkedDocs(doc, function(doc) {\n\
      if (widget) options.replacedWith = widget.cloneNode(true);\n\
      markers.push(markText(doc, clipPos(doc, from), clipPos(doc, to),\n\
        options, type));\n\
      for (var i = 0; i < doc.linked.length; ++i)\n\
        if (doc.linked[i].isParent) return;\n\
      primary = lst(markers);\n\
    });\n\
    return new SharedTextMarker(markers, primary);\n\
  }\n\
\n\
  // TEXTMARKER SPANS\n\
\n\
  function getMarkedSpanFor(spans, marker) {\n\
    if (spans)\n\
      for (var i = 0; i < spans.length; ++i) {\n\
        var span = spans[i];\n\
        if (span.marker == marker) return span;\n\
      }\n\
  }\n\
\n\
  function removeMarkedSpan(spans, span) {\n\
    for (var r, i = 0; i < spans.length; ++i)\n\
      if (spans[i] != span)(r || (r = []))\n\
        .push(spans[i]);\n\
    return r;\n\
  }\n\
\n\
  function addMarkedSpan(line, span) {\n\
    line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [\n\
      span\n\
    ];\n\
    span.marker.attachLine(line);\n\
  }\n\
\n\
  function markedSpansBefore(old, startCh, isInsert) {\n\
    if (old)\n\
      for (var i = 0, nw; i < old.length; ++i) {\n\
        var span = old[i],\n\
          marker = span.marker;\n\
        var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <=\n\
          startCh : span.from < startCh);\n\
        if (startsBefore || span.from == startCh && marker.type == \"bookmark\" &&\n\
          (!isInsert || !span.marker.insertLeft)) {\n\
          var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >=\n\
            startCh : span.to > startCh);\n\
          (nw || (nw = []))\n\
            .push({\n\
              from: span.from,\n\
              to: endsAfter ? null : span.to,\n\
              marker: marker\n\
            });\n\
        }\n\
      }\n\
    return nw;\n\
  }\n\
\n\
  function markedSpansAfter(old, endCh, isInsert) {\n\
    if (old)\n\
      for (var i = 0, nw; i < old.length; ++i) {\n\
        var span = old[i],\n\
          marker = span.marker;\n\
        var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >=\n\
          endCh : span.to > endCh);\n\
        if (endsAfter || span.from == endCh && marker.type == \"bookmark\" && (!\n\
          isInsert || span.marker.insertLeft)) {\n\
          var startsBefore = span.from == null || (marker.inclusiveLeft ?\n\
            span.from <= endCh : span.from < endCh);\n\
          (nw || (nw = []))\n\
            .push({\n\
              from: startsBefore ? null : span.from - endCh,\n\
              to: span.to == null ? null : span.to - endCh,\n\
              marker: marker\n\
            });\n\
        }\n\
      }\n\
    return nw;\n\
  }\n\
\n\
  function stretchSpansOverChange(doc, change) {\n\
    var oldFirst = isLine(doc, change.from.line) && getLine(doc, change.from.line)\n\
      .markedSpans;\n\
    var oldLast = isLine(doc, change.to.line) && getLine(doc, change.to.line)\n\
      .markedSpans;\n\
    if (!oldFirst && !oldLast) return null;\n\
\n\
    var startCh = change.from.ch,\n\
      endCh = change.to.ch,\n\
      isInsert = posEq(change.from, change.to);\n\
    // Get the spans that 'stick out' on both sides\n\
    var first = markedSpansBefore(oldFirst, startCh, isInsert);\n\
    var last = markedSpansAfter(oldLast, endCh, isInsert);\n\
\n\
    // Next, merge those two ends\n\
    var sameLine = change.text.length == 1,\n\
      offset = lst(change.text)\n\
        .length + (sameLine ? startCh : 0);\n\
    if (first) {\n\
      // Fix up .to properties of first\n\
      for (var i = 0; i < first.length; ++i) {\n\
        var span = first[i];\n\
        if (span.to == null) {\n\
          var found = getMarkedSpanFor(last, span.marker);\n\
          if (!found) span.to = startCh;\n\
          else if (sameLine) span.to = found.to == null ? null : found.to +\n\
            offset;\n\
        }\n\
      }\n\
    }\n\
    if (last) {\n\
      // Fix up .from in last (or move them into first in case of sameLine)\n\
      for (var i = 0; i < last.length; ++i) {\n\
        var span = last[i];\n\
        if (span.to != null) span.to += offset;\n\
        if (span.from == null) {\n\
          var found = getMarkedSpanFor(first, span.marker);\n\
          if (!found) {\n\
            span.from = offset;\n\
            if (sameLine)(first || (first = []))\n\
              .push(span);\n\
          }\n\
        } else {\n\
          span.from += offset;\n\
          if (sameLine)(first || (first = []))\n\
            .push(span);\n\
        }\n\
      }\n\
    }\n\
    // Make sure we didn't create any zero-length spans\n\
    if (first) first = clearEmptySpans(first);\n\
    if (last && last != first) last = clearEmptySpans(last);\n\
\n\
    var newMarkers = [first];\n\
    if (!sameLine) {\n\
      // Fill gap with whole-line-spans\n\
      var gap = change.text.length - 2,\n\
        gapMarkers;\n\
      if (gap > 0 && first)\n\
        for (var i = 0; i < first.length; ++i)\n\
          if (first[i].to == null)\n\
            (gapMarkers || (gapMarkers = []))\n\
              .push({\n\
                from: null,\n\
                to: null,\n\
                marker: first[i].marker\n\
              });\n\
      for (var i = 0; i < gap; ++i)\n\
        newMarkers.push(gapMarkers);\n\
      newMarkers.push(last);\n\
    }\n\
    return newMarkers;\n\
  }\n\
\n\
  function clearEmptySpans(spans) {\n\
    for (var i = 0; i < spans.length; ++i) {\n\
      var span = spans[i];\n\
      if (span.from != null && span.from == span.to && span.marker.clearWhenEmpty !==\n\
        false)\n\
        spans.splice(i--, 1);\n\
    }\n\
    if (!spans.length) return null;\n\
    return spans;\n\
  }\n\
\n\
  function mergeOldSpans(doc, change) {\n\
    var old = getOldSpans(doc, change);\n\
    var stretched = stretchSpansOverChange(doc, change);\n\
    if (!old) return stretched;\n\
    if (!stretched) return old;\n\
\n\
    for (var i = 0; i < old.length; ++i) {\n\
      var oldCur = old[i],\n\
        stretchCur = stretched[i];\n\
      if (oldCur && stretchCur) {\n\
        spans: for (var j = 0; j < stretchCur.length; ++j) {\n\
          var span = stretchCur[j];\n\
          for (var k = 0; k < oldCur.length; ++k)\n\
            if (oldCur[k].marker == span.marker) continue spans;\n\
          oldCur.push(span);\n\
        }\n\
      } else if (stretchCur) {\n\
        old[i] = stretchCur;\n\
      }\n\
    }\n\
    return old;\n\
  }\n\
\n\
  function removeReadOnlyRanges(doc, from, to) {\n\
    var markers = null;\n\
    doc.iter(from.line, to.line + 1, function(line) {\n\
      if (line.markedSpans)\n\
        for (var i = 0; i < line.markedSpans.length; ++i) {\n\
          var mark = line.markedSpans[i].marker;\n\
          if (mark.readOnly && (!markers || indexOf(markers, mark) == -1))\n\
            (markers || (markers = []))\n\
              .push(mark);\n\
        }\n\
    });\n\
    if (!markers) return null;\n\
    var parts = [{\n\
      from: from,\n\
      to: to\n\
    }];\n\
    for (var i = 0; i < markers.length; ++i) {\n\
      var mk = markers[i],\n\
        m = mk.find();\n\
      for (var j = 0; j < parts.length; ++j) {\n\
        var p = parts[j];\n\
        if (posLess(p.to, m.from) || posLess(m.to, p.from)) continue;\n\
        var newParts = [j, 1];\n\
        if (posLess(p.from, m.from) || !mk.inclusiveLeft && posEq(p.from, m.from))\n\
          newParts.push({\n\
            from: p.from,\n\
            to: m.from\n\
          });\n\
        if (posLess(m.to, p.to) || !mk.inclusiveRight && posEq(p.to, m.to))\n\
          newParts.push({\n\
            from: m.to,\n\
            to: p.to\n\
          });\n\
        parts.splice.apply(parts, newParts);\n\
        j += newParts.length - 1;\n\
      }\n\
    }\n\
    return parts;\n\
  }\n\
\n\
  function collapsedSpanAt(line, ch) {\n\
    var sps = sawCollapsedSpans && line.markedSpans,\n\
      found;\n\
    if (sps)\n\
      for (var sp, i = 0; i < sps.length; ++i) {\n\
        sp = sps[i];\n\
        if (!sp.marker.collapsed) continue;\n\
        if ((sp.from == null || sp.from < ch) &&\n\
          (sp.to == null || sp.to > ch) &&\n\
          (!found || found.width < sp.marker.width))\n\
          found = sp.marker;\n\
      }\n\
    return found;\n\
  }\n\
\n\
  function collapsedSpanAtStart(line) {\n\
    return collapsedSpanAt(line, -1);\n\
  }\n\
\n\
  function collapsedSpanAtEnd(line) {\n\
    return collapsedSpanAt(line, line.text.length + 1);\n\
  }\n\
\n\
  function visualLine(doc, line) {\n\
    var merged;\n\
    while (merged = collapsedSpanAtStart(line))\n\
      line = getLine(doc, merged.find()\n\
        .from.line);\n\
    return line;\n\
  }\n\
\n\
  function lineIsHidden(doc, line) {\n\
    var sps = sawCollapsedSpans && line.markedSpans;\n\
    if (sps)\n\
      for (var sp, i = 0; i < sps.length; ++i) {\n\
        sp = sps[i];\n\
        if (!sp.marker.collapsed) continue;\n\
        if (sp.from == null) return true;\n\
        if (sp.marker.replacedWith) continue;\n\
        if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc,\n\
          line, sp))\n\
          return true;\n\
      }\n\
  }\n\
\n\
  function lineIsHiddenInner(doc, line, span) {\n\
    if (span.to == null) {\n\
      var end = span.marker.find()\n\
        .to,\n\
        endLine = getLine(doc, end.line);\n\
      return lineIsHiddenInner(doc, endLine, getMarkedSpanFor(endLine.markedSpans,\n\
        span.marker));\n\
    }\n\
    if (span.marker.inclusiveRight && span.to == line.text.length)\n\
      return true;\n\
    for (var sp, i = 0; i < line.markedSpans.length; ++i) {\n\
      sp = line.markedSpans[i];\n\
      if (sp.marker.collapsed && !sp.marker.replacedWith && sp.from == span.to &&\n\
        (sp.to == null || sp.to != span.from) &&\n\
        (sp.marker.inclusiveLeft || span.marker.inclusiveRight) &&\n\
        lineIsHiddenInner(doc, line, sp)) return true;\n\
    }\n\
  }\n\
\n\
  function detachMarkedSpans(line) {\n\
    var spans = line.markedSpans;\n\
    if (!spans) return;\n\
    for (var i = 0; i < spans.length; ++i)\n\
      spans[i].marker.detachLine(line);\n\
    line.markedSpans = null;\n\
  }\n\
\n\
  function attachMarkedSpans(line, spans) {\n\
    if (!spans) return;\n\
    for (var i = 0; i < spans.length; ++i)\n\
      spans[i].marker.attachLine(line);\n\
    line.markedSpans = spans;\n\
  }\n\
\n\
  // LINE WIDGETS\n\
\n\
  var LineWidget = CodeMirror.LineWidget = function(cm, node, options) {\n\
    if (options)\n\
      for (var opt in options)\n\
        if (options.hasOwnProperty(opt))\n\
          this[opt] = options[opt];\n\
    this.cm = cm;\n\
    this.node = node;\n\
  };\n\
  eventMixin(LineWidget);\n\
\n\
  function widgetOperation(f) {\n\
    return function() {\n\
      var withOp = !this.cm.curOp;\n\
      if (withOp) startOperation(this.cm);\n\
      try {\n\
        var result = f.apply(this, arguments);\n\
      } finally {\n\
        if (withOp) endOperation(this.cm);\n\
      }\n\
      return result;\n\
    };\n\
  }\n\
  LineWidget.prototype.clear = widgetOperation(function() {\n\
    var ws = this.line.widgets,\n\
      no = lineNo(this.line);\n\
    if (no == null || !ws) return;\n\
    for (var i = 0; i < ws.length; ++i)\n\
      if (ws[i] == this) ws.splice(i--, 1);\n\
    if (!ws.length) this.line.widgets = null;\n\
    var aboveVisible = heightAtLine(this.cm, this.line) < this.cm.doc.scrollTop;\n\
    updateLineHeight(this.line, Math.max(0, this.line.height - widgetHeight(\n\
      this)));\n\
    if (aboveVisible) addToScrollPos(this.cm, 0, -this.height);\n\
    regChange(this.cm, no, no + 1);\n\
  });\n\
  LineWidget.prototype.changed = widgetOperation(function() {\n\
    var oldH = this.height;\n\
    this.height = null;\n\
    var diff = widgetHeight(this) - oldH;\n\
    if (!diff) return;\n\
    updateLineHeight(this.line, this.line.height + diff);\n\
    var no = lineNo(this.line);\n\
    regChange(this.cm, no, no + 1);\n\
  });\n\
\n\
  function widgetHeight(widget) {\n\
    if (widget.height != null) return widget.height;\n\
    if (!widget.node.parentNode || widget.node.parentNode.nodeType != 1)\n\
      removeChildrenAndAdd(widget.cm.display.measure, elt(\"div\", [widget.node],\n\
        null, \"position: relative\"));\n\
    return widget.height = widget.node.offsetHeight;\n\
  }\n\
\n\
  function addLineWidget(cm, handle, node, options) {\n\
    var widget = new LineWidget(cm, node, options);\n\
    if (widget.noHScroll) cm.display.alignWidgets = true;\n\
    changeLine(cm, handle, function(line) {\n\
      var widgets = line.widgets || (line.widgets = []);\n\
      if (widget.insertAt == null) widgets.push(widget);\n\
      else widgets.splice(Math.min(widgets.length - 1, Math.max(0, widget.insertAt)),\n\
        0, widget);\n\
      widget.line = line;\n\
      if (!lineIsHidden(cm.doc, line) || widget.showIfHidden) {\n\
        var aboveVisible = heightAtLine(cm, line) < cm.doc.scrollTop;\n\
        updateLineHeight(line, line.height + widgetHeight(widget));\n\
        if (aboveVisible) addToScrollPos(cm, 0, widget.height);\n\
      }\n\
      return true;\n\
    });\n\
    return widget;\n\
  }\n\
\n\
  // LINE DATA STRUCTURE\n\
\n\
  // Line objects. These hold state related to a line, including\n\
  // highlighting info (the styles array).\n\
  var Line = CodeMirror.Line = function(text, markedSpans, estimateHeight) {\n\
    this.text = text;\n\
    attachMarkedSpans(this, markedSpans);\n\
    this.height = estimateHeight ? estimateHeight(this) : 1;\n\
  };\n\
  eventMixin(Line);\n\
  Line.prototype.lineNo = function() {\n\
    return lineNo(this);\n\
  };\n\
\n\
  function updateLine(line, text, markedSpans, estimateHeight) {\n\
    line.text = text;\n\
    if (line.stateAfter) line.stateAfter = null;\n\
    if (line.styles) line.styles = null;\n\
    if (line.order != null) line.order = null;\n\
    detachMarkedSpans(line);\n\
    attachMarkedSpans(line, markedSpans);\n\
    var estHeight = estimateHeight ? estimateHeight(line) : 1;\n\
    if (estHeight != line.height) updateLineHeight(line, estHeight);\n\
  }\n\
\n\
  function cleanUpLine(line) {\n\
    line.parent = null;\n\
    detachMarkedSpans(line);\n\
  }\n\
\n\
  // Run the given mode's parser over a line, update the styles\n\
  // array, which contains alternating fragments of text and CSS\n\
  // classes.\n\
  function runMode(cm, text, mode, state, f, forceToEnd) {\n\
    var flattenSpans = mode.flattenSpans;\n\
    if (flattenSpans == null) flattenSpans = cm.options.flattenSpans;\n\
    var curStart = 0,\n\
      curStyle = null;\n\
    var stream = new StringStream(text, cm.options.tabSize),\n\
      style;\n\
    if (text == \"\" && mode.blankLine) mode.blankLine(state);\n\
    while (!stream.eol()) {\n\
      if (stream.pos > cm.options.maxHighlightLength) {\n\
        flattenSpans = false;\n\
        if (forceToEnd) processLine(cm, text, state, stream.pos);\n\
        stream.pos = text.length;\n\
        style = null;\n\
      } else {\n\
        style = mode.token(stream, state);\n\
      }\n\
      if (!flattenSpans || curStyle != style) {\n\
        if (curStart < stream.start) f(stream.start, curStyle);\n\
        curStart = stream.start;\n\
        curStyle = style;\n\
      }\n\
      stream.start = stream.pos;\n\
    }\n\
    while (curStart < stream.pos) {\n\
      // Webkit seems to refuse to render text nodes longer than 57444 characters\n\
      var pos = Math.min(stream.pos, curStart + 50000);\n\
      f(pos, curStyle);\n\
      curStart = pos;\n\
    }\n\
  }\n\
\n\
  function highlightLine(cm, line, state, forceToEnd) {\n\
    // A styles array always starts with a number identifying the\n\
    // mode/overlays that it is based on (for easy invalidation).\n\
    var st = [cm.state.modeGen];\n\
    // Compute the base array of styles\n\
    runMode(cm, line.text, cm.doc.mode, state, function(end, style) {\n\
      st.push(end, style);\n\
    }, forceToEnd);\n\
\n\
    // Run overlays, adjust style array.\n\
    for (var o = 0; o < cm.state.overlays.length; ++o) {\n\
      var overlay = cm.state.overlays[o],\n\
        i = 1,\n\
        at = 0;\n\
      runMode(cm, line.text, overlay.mode, true, function(end, style) {\n\
        var start = i;\n\
        // Ensure there's a token end at the current position, and that i points at it\n\
        while (at < end) {\n\
          var i_end = st[i];\n\
          if (i_end > end)\n\
            st.splice(i, 1, end, st[i + 1], i_end);\n\
          i += 2;\n\
          at = Math.min(end, i_end);\n\
        }\n\
        if (!style) return;\n\
        if (overlay.opaque) {\n\
          st.splice(start, i - start, end, style);\n\
          i = start + 2;\n\
        } else {\n\
          for (; start < i; start += 2) {\n\
            var cur = st[start + 1];\n\
            st[start + 1] = cur ? cur + \" \" + style : style;\n\
          }\n\
        }\n\
      });\n\
    }\n\
\n\
    return st;\n\
  }\n\
\n\
  function getLineStyles(cm, line) {\n\
    if (!line.styles || line.styles[0] != cm.state.modeGen)\n\
      line.styles = highlightLine(cm, line, line.stateAfter = getStateBefore(\n\
        cm, lineNo(line)));\n\
    return line.styles;\n\
  }\n\
\n\
  // Lightweight form of highlight -- proceed over this line and\n\
  // update state, but don't save a style array.\n\
  function processLine(cm, text, state, startAt) {\n\
    var mode = cm.doc.mode;\n\
    var stream = new StringStream(text, cm.options.tabSize);\n\
    stream.start = stream.pos = startAt || 0;\n\
    if (text == \"\" && mode.blankLine) mode.blankLine(state);\n\
    while (!stream.eol() && stream.pos <= cm.options.maxHighlightLength) {\n\
      mode.token(stream, state);\n\
      stream.start = stream.pos;\n\
    }\n\
  }\n\
\n\
  var styleToClassCache = {};\n\
\n\
  function interpretTokenStyle(style, builder) {\n\
    if (!style) return null;\n\
    for (;;) {\n\
      var lineClass = style.match(/(?:^|\\s)line-(background-)?(\\S+)/);\n\
      if (!lineClass) break;\n\
      style = style.slice(0, lineClass.index) + style.slice(lineClass.index +\n\
        lineClass[0].length);\n\
      var prop = lineClass[1] ? \"bgClass\" : \"textClass\";\n\
      if (builder[prop] == null)\n\
        builder[prop] = lineClass[2];\n\
      else if (!(new RegExp(\"(?:^|\\s)\" + lineClass[2] + \"(?:$|\\s)\"))\n\
        .test(builder[prop]))\n\
        builder[prop] += \" \" + lineClass[2];\n\
    }\n\
    return styleToClassCache[style] ||\n\
      (styleToClassCache[style] = \"cm-\" + style.replace(/ +/g, \" cm-\"));\n\
  }\n\
\n\
  function buildLineContent(cm, realLine, measure, copyWidgets) {\n\
    var merged, line = realLine,\n\
      empty = true;\n\
    while (merged = collapsedSpanAtStart(line))\n\
      line = getLine(cm.doc, merged.find()\n\
        .from.line);\n\
\n\
    var builder = {\n\
      pre: elt(\"pre\"),\n\
      col: 0,\n\
      pos: 0,\n\
      measure: null,\n\
      measuredSomething: false,\n\
      cm: cm,\n\
      copyWidgets: copyWidgets\n\
    };\n\
\n\
    do {\n\
      if (line.text) empty = false;\n\
      builder.measure = line == realLine && measure;\n\
      builder.pos = 0;\n\
      builder.addToken = builder.measure ? buildTokenMeasure : buildToken;\n\
      if ((ie || webkit) && cm.getOption(\"lineWrapping\"))\n\
        builder.addToken = buildTokenSplitSpaces(builder.addToken);\n\
      var next = insertLineContent(line, builder, getLineStyles(cm, line));\n\
      if (measure && line == realLine && !builder.measuredSomething) {\n\
        measure[0] = builder.pre.appendChild(zeroWidthElement(cm.display.measure));\n\
        builder.measuredSomething = true;\n\
      }\n\
      if (next) line = getLine(cm.doc, next.to.line);\n\
    } while (next);\n\
\n\
    if (measure && !builder.measuredSomething && !measure[0])\n\
      measure[0] = builder.pre.appendChild(empty ? elt(\"span\", \"\\u00a0\") :\n\
        zeroWidthElement(cm.display.measure));\n\
    if (!builder.pre.firstChild && !lineIsHidden(cm.doc, realLine))\n\
      builder.pre.appendChild(document.createTextNode(\"\\u00a0\"));\n\
\n\
    var order;\n\
    // Work around problem with the reported dimensions of single-char\n\
    // direction spans on IE (issue #1129). See also the comment in\n\
    // cursorCoords.\n\
    if (measure && (ie || ie_gt10) && (order = getOrder(line))) {\n\
      var l = order.length - 1;\n\
      if (order[l].from == order[l].to)--l;\n\
      var last = order[l],\n\
        prev = order[l - 1];\n\
      if (last.from + 1 == last.to && prev && last.level < prev.level) {\n\
        var span = measure[builder.pos - 1];\n\
        if (span) span.parentNode.insertBefore(span.measureRight =\n\
          zeroWidthElement(cm.display.measure),\n\
          span.nextSibling);\n\
      }\n\
    }\n\
\n\
    var textClass = builder.textClass ? builder.textClass + \" \" + (realLine.textClass ||\n\
      \"\") : realLine.textClass;\n\
    if (textClass) builder.pre.className = textClass;\n\
\n\
    signal(cm, \"renderLine\", cm, realLine, builder.pre);\n\
    return builder;\n\
  }\n\
\n\
  function defaultSpecialCharPlaceholder(ch) {\n\
    var token = elt(\"span\", \"\\u2022\", \"cm-invalidchar\");\n\
    token.title = \"\\\\u\" + ch.charCodeAt(0)\n\
      .toString(16);\n\
    return token;\n\
  }\n\
\n\
  function buildToken(builder, text, style, startStyle, endStyle, title) {\n\
    if (!text) return;\n\
    var special = builder.cm.options.specialChars;\n\
    if (!special.test(text)) {\n\
      builder.col += text.length;\n\
      var content = document.createTextNode(text);\n\
    } else {\n\
      var content = document.createDocumentFragment(),\n\
        pos = 0;\n\
      while (true) {\n\
        special.lastIndex = pos;\n\
        var m = special.exec(text);\n\
        var skipped = m ? m.index - pos : text.length - pos;\n\
        if (skipped) {\n\
          content.appendChild(document.createTextNode(text.slice(pos, pos +\n\
            skipped)));\n\
          builder.col += skipped;\n\
        }\n\
        if (!m) break;\n\
        pos += skipped + 1;\n\
        if (m[0] == \"\\t\") {\n\
          var tabSize = builder.cm.options.tabSize,\n\
            tabWidth = tabSize - builder.col % tabSize;\n\
          content.appendChild(elt(\"span\", spaceStr(tabWidth), \"cm-tab\"));\n\
          builder.col += tabWidth;\n\
        } else {\n\
          var token = builder.cm.options.specialCharPlaceholder(m[0]);\n\
          content.appendChild(token);\n\
          builder.col += 1;\n\
        }\n\
      }\n\
    }\n\
    if (style || startStyle || endStyle || builder.measure) {\n\
      var fullStyle = style || \"\";\n\
      if (startStyle) fullStyle += startStyle;\n\
      if (endStyle) fullStyle += endStyle;\n\
      var token = elt(\"span\", [content], fullStyle);\n\
      if (title) token.title = title;\n\
      return builder.pre.appendChild(token);\n\
    }\n\
    builder.pre.appendChild(content);\n\
  }\n\
\n\
  function buildTokenMeasure(builder, text, style, startStyle, endStyle) {\n\
    var wrapping = builder.cm.options.lineWrapping;\n\
    for (var i = 0; i < text.length; ++i) {\n\
      var ch = text.charAt(i),\n\
        start = i == 0;\n\
      if (ch >= \"\\ud800\" && ch < \"\\udbff\" && i < text.length - 1) {\n\
        ch = text.slice(i, i + 2);\n\
        ++i;\n\
      } else if (i && wrapping && spanAffectsWrapping(text, i)) {\n\
        builder.pre.appendChild(elt(\"wbr\"));\n\
      }\n\
      var old = builder.measure[builder.pos];\n\
      var span = builder.measure[builder.pos] =\n\
        buildToken(builder, ch, style,\n\
          start && startStyle, i == text.length - 1 && endStyle);\n\
      if (old) span.leftSide = old.leftSide || old;\n\
      // In IE single-space nodes wrap differently than spaces\n\
      // embedded in larger text nodes, except when set to\n\
      // white-space: normal (issue #1268).\n\
      if (ie && wrapping && ch == \" \" && i && !/\\s/.test(text.charAt(i - 1)) &&\n\
        i < text.length - 1 && !/\\s/.test(text.charAt(i + 1)))\n\
        span.style.whiteSpace = \"normal\";\n\
      builder.pos += ch.length;\n\
    }\n\
    if (text.length) builder.measuredSomething = true;\n\
  }\n\
\n\
  function buildTokenSplitSpaces(inner) {\n\
    function split(old) {\n\
      var out = \" \";\n\
      for (var i = 0; i < old.length - 2; ++i) out += i % 2 ? \" \" : \"\\u00a0\";\n\
      out += \" \";\n\
      return out;\n\
    }\n\
    return function(builder, text, style, startStyle, endStyle, title) {\n\
      return inner(builder, text.replace(/ {3,}/g, split), style, startStyle,\n\
        endStyle, title);\n\
    };\n\
  }\n\
\n\
  function buildCollapsedSpan(builder, size, marker, ignoreWidget) {\n\
    var widget = !ignoreWidget && marker.replacedWith;\n\
    if (widget) {\n\
      if (builder.copyWidgets) widget = widget.cloneNode(true);\n\
      builder.pre.appendChild(widget);\n\
      if (builder.measure) {\n\
        if (size) {\n\
          builder.measure[builder.pos] = widget;\n\
        } else {\n\
          var elt = zeroWidthElement(builder.cm.display.measure);\n\
          if (marker.type == \"bookmark\" && !marker.insertLeft)\n\
            builder.measure[builder.pos] = builder.pre.appendChild(elt);\n\
          else if (builder.measure[builder.pos])\n\
            return;\n\
          else\n\
            builder.measure[builder.pos] = builder.pre.insertBefore(elt,\n\
              widget);\n\
        }\n\
        builder.measuredSomething = true;\n\
      }\n\
    }\n\
    builder.pos += size;\n\
  }\n\
\n\
  // Outputs a number of spans to make up a line, taking highlighting\n\
  // and marked text into account.\n\
  function insertLineContent(line, builder, styles) {\n\
    var spans = line.markedSpans,\n\
      allText = line.text,\n\
      at = 0;\n\
    if (!spans) {\n\
      for (var i = 1; i < styles.length; i += 2)\n\
        builder.addToken(builder, allText.slice(at, at = styles[i]),\n\
          interpretTokenStyle(styles[i + 1], builder));\n\
      return;\n\
    }\n\
\n\
    var len = allText.length,\n\
      pos = 0,\n\
      i = 1,\n\
      text = \"\",\n\
      style;\n\
    var nextChange = 0,\n\
      spanStyle, spanEndStyle, spanStartStyle, title, collapsed;\n\
    for (;;) {\n\
      if (nextChange == pos) { // Update current marker set\n\
        spanStyle = spanEndStyle = spanStartStyle = title = \"\";\n\
        collapsed = null;\n\
        nextChange = Infinity;\n\
        var foundBookmarks = [];\n\
        for (var j = 0; j < spans.length; ++j) {\n\
          var sp = spans[j],\n\
            m = sp.marker;\n\
          if (sp.from <= pos && (sp.to == null || sp.to > pos)) {\n\
            if (sp.to != null && nextChange > sp.to) {\n\
              nextChange = sp.to;\n\
              spanEndStyle = \"\";\n\
            }\n\
            if (m.className) spanStyle += \" \" + m.className;\n\
            if (m.startStyle && sp.from == pos) spanStartStyle += \" \" + m.startStyle;\n\
            if (m.endStyle && sp.to == nextChange) spanEndStyle += \" \" + m.endStyle;\n\
            if (m.title && !title) title = m.title;\n\
            if (m.collapsed && (!collapsed || collapsed.marker.size < m.size))\n\
              collapsed = sp;\n\
          } else if (sp.from > pos && nextChange > sp.from) {\n\
            nextChange = sp.from;\n\
          }\n\
          if (m.type == \"bookmark\" && sp.from == pos && m.replacedWith)\n\
            foundBookmarks.push(m);\n\
        }\n\
        if (collapsed && (collapsed.from || 0) == pos) {\n\
          buildCollapsedSpan(builder, (collapsed.to == null ? len : collapsed\n\
              .to) - pos,\n\
            collapsed.marker, collapsed.from == null);\n\
          if (collapsed.to == null) return collapsed.marker.find();\n\
        }\n\
        if (!collapsed && foundBookmarks.length)\n\
          for (var j = 0; j < foundBookmarks.length; ++j)\n\
            buildCollapsedSpan(builder, 0, foundBookmarks[j]);\n\
      }\n\
      if (pos >= len) break;\n\
\n\
      var upto = Math.min(len, nextChange);\n\
      while (true) {\n\
        if (text) {\n\
          var end = pos + text.length;\n\
          if (!collapsed) {\n\
            var tokenText = end > upto ? text.slice(0, upto - pos) : text;\n\
            builder.addToken(builder, tokenText, style ? style + spanStyle :\n\
              spanStyle,\n\
              spanStartStyle, pos + tokenText.length == nextChange ?\n\
              spanEndStyle : \"\", title);\n\
          }\n\
          if (end >= upto) {\n\
            text = text.slice(upto - pos);\n\
            pos = upto;\n\
            break;\n\
          }\n\
          pos = end;\n\
          spanStartStyle = \"\";\n\
        }\n\
        text = allText.slice(at, at = styles[i++]);\n\
        style = interpretTokenStyle(styles[i++], builder);\n\
      }\n\
    }\n\
  }\n\
\n\
  // DOCUMENT DATA STRUCTURE\n\
\n\
  function updateDoc(doc, change, markedSpans, selAfter, estimateHeight) {\n\
    function spansFor(n) {\n\
      return markedSpans ? markedSpans[n] : null;\n\
    }\n\
\n\
    function update(line, text, spans) {\n\
      updateLine(line, text, spans, estimateHeight);\n\
      signalLater(line, \"change\", line, change);\n\
    }\n\
\n\
    var from = change.from,\n\
      to = change.to,\n\
      text = change.text;\n\
    var firstLine = getLine(doc, from.line),\n\
      lastLine = getLine(doc, to.line);\n\
    var lastText = lst(text),\n\
      lastSpans = spansFor(text.length - 1),\n\
      nlines = to.line - from.line;\n\
\n\
    // First adjust the line structure\n\
    if (from.ch == 0 && to.ch == 0 && lastText == \"\" &&\n\
      (!doc.cm || doc.cm.options.wholeLineUpdateBefore)) {\n\
      // This is a whole-line replace. Treated specially to make\n\
      // sure line objects move the way they are supposed to.\n\
      for (var i = 0, e = text.length - 1, added = []; i < e; ++i)\n\
        added.push(new Line(text[i], spansFor(i), estimateHeight));\n\
      update(lastLine, lastLine.text, lastSpans);\n\
      if (nlines) doc.remove(from.line, nlines);\n\
      if (added.length) doc.insert(from.line, added);\n\
    } else if (firstLine == lastLine) {\n\
      if (text.length == 1) {\n\
        update(firstLine, firstLine.text.slice(0, from.ch) + lastText +\n\
          firstLine.text.slice(to.ch), lastSpans);\n\
      } else {\n\
        for (var added = [], i = 1, e = text.length - 1; i < e; ++i)\n\
          added.push(new Line(text[i], spansFor(i), estimateHeight));\n\
        added.push(new Line(lastText + firstLine.text.slice(to.ch), lastSpans,\n\
          estimateHeight));\n\
        update(firstLine, firstLine.text.slice(0, from.ch) + text[0],\n\
          spansFor(0));\n\
        doc.insert(from.line + 1, added);\n\
      }\n\
    } else if (text.length == 1) {\n\
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine\n\
        .text.slice(to.ch), spansFor(0));\n\
      doc.remove(from.line + 1, nlines);\n\
    } else {\n\
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(\n\
        0));\n\
      update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans);\n\
      for (var i = 1, e = text.length - 1, added = []; i < e; ++i)\n\
        added.push(new Line(text[i], spansFor(i), estimateHeight));\n\
      if (nlines > 1) doc.remove(from.line + 1, nlines - 1);\n\
      doc.insert(from.line + 1, added);\n\
    }\n\
\n\
    signalLater(doc, \"change\", doc, change);\n\
    setSelection(doc, selAfter.anchor, selAfter.head, null, true);\n\
  }\n\
\n\
  function LeafChunk(lines) {\n\
    this.lines = lines;\n\
    this.parent = null;\n\
    for (var i = 0, e = lines.length, height = 0; i < e; ++i) {\n\
      lines[i].parent = this;\n\
      height += lines[i].height;\n\
    }\n\
    this.height = height;\n\
  }\n\
\n\
  LeafChunk.prototype = {\n\
    chunkSize: function() {\n\
      return this.lines.length;\n\
    },\n\
    removeInner: function(at, n) {\n\
      for (var i = at, e = at + n; i < e; ++i) {\n\
        var line = this.lines[i];\n\
        this.height -= line.height;\n\
        cleanUpLine(line);\n\
        signalLater(line, \"delete\");\n\
      }\n\
      this.lines.splice(at, n);\n\
    },\n\
    collapse: function(lines) {\n\
      lines.splice.apply(lines, [lines.length, 0].concat(this.lines));\n\
    },\n\
    insertInner: function(at, lines, height) {\n\
      this.height += height;\n\
      this.lines = this.lines.slice(0, at)\n\
        .concat(lines)\n\
        .concat(this.lines.slice(at));\n\
      for (var i = 0, e = lines.length; i < e; ++i) lines[i].parent = this;\n\
    },\n\
    iterN: function(at, n, op) {\n\
      for (var e = at + n; at < e; ++at)\n\
        if (op(this.lines[at])) return true;\n\
    }\n\
  };\n\
\n\
  function BranchChunk(children) {\n\
    this.children = children;\n\
    var size = 0,\n\
      height = 0;\n\
    for (var i = 0, e = children.length; i < e; ++i) {\n\
      var ch = children[i];\n\
      size += ch.chunkSize();\n\
      height += ch.height;\n\
      ch.parent = this;\n\
    }\n\
    this.size = size;\n\
    this.height = height;\n\
    this.parent = null;\n\
  }\n\
\n\
  BranchChunk.prototype = {\n\
    chunkSize: function() {\n\
      return this.size;\n\
    },\n\
    removeInner: function(at, n) {\n\
      this.size -= n;\n\
      for (var i = 0; i < this.children.length; ++i) {\n\
        var child = this.children[i],\n\
          sz = child.chunkSize();\n\
        if (at < sz) {\n\
          var rm = Math.min(n, sz - at),\n\
            oldHeight = child.height;\n\
          child.removeInner(at, rm);\n\
          this.height -= oldHeight - child.height;\n\
          if (sz == rm) {\n\
            this.children.splice(i--, 1);\n\
            child.parent = null;\n\
          }\n\
          if ((n -= rm) == 0) break;\n\
          at = 0;\n\
        } else at -= sz;\n\
      }\n\
      if (this.size - n < 25) {\n\
        var lines = [];\n\
        this.collapse(lines);\n\
        this.children = [new LeafChunk(lines)];\n\
        this.children[0].parent = this;\n\
      }\n\
    },\n\
    collapse: function(lines) {\n\
      for (var i = 0, e = this.children.length; i < e; ++i) this.children[i].collapse(\n\
        lines);\n\
    },\n\
    insertInner: function(at, lines, height) {\n\
      this.size += lines.length;\n\
      this.height += height;\n\
      for (var i = 0, e = this.children.length; i < e; ++i) {\n\
        var child = this.children[i],\n\
          sz = child.chunkSize();\n\
        if (at <= sz) {\n\
          child.insertInner(at, lines, height);\n\
          if (child.lines && child.lines.length > 50) {\n\
            while (child.lines.length > 50) {\n\
              var spilled = child.lines.splice(child.lines.length - 25, 25);\n\
              var newleaf = new LeafChunk(spilled);\n\
              child.height -= newleaf.height;\n\
              this.children.splice(i + 1, 0, newleaf);\n\
              newleaf.parent = this;\n\
            }\n\
            this.maybeSpill();\n\
          }\n\
          break;\n\
        }\n\
        at -= sz;\n\
      }\n\
    },\n\
    maybeSpill: function() {\n\
      if (this.children.length <= 10) return;\n\
      var me = this;\n\
      do {\n\
        var spilled = me.children.splice(me.children.length - 5, 5);\n\
        var sibling = new BranchChunk(spilled);\n\
        if (!me.parent) { // Become the parent node\n\
          var copy = new BranchChunk(me.children);\n\
          copy.parent = me;\n\
          me.children = [copy, sibling];\n\
          me = copy;\n\
        } else {\n\
          me.size -= sibling.size;\n\
          me.height -= sibling.height;\n\
          var myIndex = indexOf(me.parent.children, me);\n\
          me.parent.children.splice(myIndex + 1, 0, sibling);\n\
        }\n\
        sibling.parent = me.parent;\n\
      } while (me.children.length > 10);\n\
      me.parent.maybeSpill();\n\
    },\n\
    iterN: function(at, n, op) {\n\
      for (var i = 0, e = this.children.length; i < e; ++i) {\n\
        var child = this.children[i],\n\
          sz = child.chunkSize();\n\
        if (at < sz) {\n\
          var used = Math.min(n, sz - at);\n\
          if (child.iterN(at, used, op)) return true;\n\
          if ((n -= used) == 0) break;\n\
          at = 0;\n\
        } else at -= sz;\n\
      }\n\
    }\n\
  };\n\
\n\
  var nextDocId = 0;\n\
  var Doc = CodeMirror.Doc = function(text, mode, firstLine) {\n\
    if (!(this instanceof Doc)) return new Doc(text, mode, firstLine);\n\
    if (firstLine == null) firstLine = 0;\n\
\n\
    BranchChunk.call(this, [new LeafChunk([new Line(\"\", null)])]);\n\
    this.first = firstLine;\n\
    this.scrollTop = this.scrollLeft = 0;\n\
    this.cantEdit = false;\n\
    this.history = makeHistory();\n\
    this.cleanGeneration = 1;\n\
    this.frontier = firstLine;\n\
    var start = Pos(firstLine, 0);\n\
    this.sel = {\n\
      from: start,\n\
      to: start,\n\
      head: start,\n\
      anchor: start,\n\
      shift: false,\n\
      extend: false,\n\
      goalColumn: null\n\
    };\n\
    this.id = ++nextDocId;\n\
    this.modeOption = mode;\n\
\n\
    if (typeof text == \"string\") text = splitLines(text);\n\
    updateDoc(this, {\n\
      from: start,\n\
      to: start,\n\
      text: text\n\
    }, null, {\n\
      head: start,\n\
      anchor: start\n\
    });\n\
  };\n\
\n\
  Doc.prototype = createObj(BranchChunk.prototype, {\n\
    constructor: Doc,\n\
    iter: function(from, to, op) {\n\
      if (op) this.iterN(from - this.first, to - from, op);\n\
      else this.iterN(this.first, this.first + this.size, from);\n\
    },\n\
\n\
    insert: function(at, lines) {\n\
      var height = 0;\n\
      for (var i = 0, e = lines.length; i < e; ++i) height += lines[i].height;\n\
      this.insertInner(at - this.first, lines, height);\n\
    },\n\
    remove: function(at, n) {\n\
      this.removeInner(at - this.first, n);\n\
    },\n\
\n\
    getValue: function(lineSep) {\n\
      var lines = getLines(this, this.first, this.first + this.size);\n\
      if (lineSep === false) return lines;\n\
      return lines.join(lineSep || \"\\n\
\");\n\
    },\n\
    setValue: function(code) {\n\
      var top = Pos(this.first, 0),\n\
        last = this.first + this.size - 1;\n\
      makeChange(this, {\n\
        from: top,\n\
        to: Pos(last, getLine(this, last)\n\
          .text.length),\n\
        text: splitLines(code),\n\
        origin: \"setValue\"\n\
      }, {\n\
        head: top,\n\
        anchor: top\n\
      }, true);\n\
    },\n\
    replaceRange: function(code, from, to, origin) {\n\
      from = clipPos(this, from);\n\
      to = to ? clipPos(this, to) : from;\n\
      replaceRange(this, code, from, to, origin);\n\
    },\n\
    getRange: function(from, to, lineSep) {\n\
      var lines = getBetween(this, clipPos(this, from), clipPos(this, to));\n\
      if (lineSep === false) return lines;\n\
      return lines.join(lineSep || \"\\n\
\");\n\
    },\n\
\n\
    getLine: function(line) {\n\
      var l = this.getLineHandle(line);\n\
      return l && l.text;\n\
    },\n\
    setLine: function(line, text) {\n\
      if (isLine(this, line))\n\
        replaceRange(this, text, Pos(line, 0), clipPos(this, Pos(line)));\n\
    },\n\
    removeLine: function(line) {\n\
      if (line) replaceRange(this, \"\", clipPos(this, Pos(line - 1)),\n\
        clipPos(this, Pos(line)));\n\
      else replaceRange(this, \"\", Pos(0, 0), clipPos(this, Pos(1, 0)));\n\
    },\n\
\n\
    getLineHandle: function(line) {\n\
      if (isLine(this, line)) return getLine(this, line);\n\
    },\n\
    getLineNumber: function(line) {\n\
      return lineNo(line);\n\
    },\n\
\n\
    getLineHandleVisualStart: function(line) {\n\
      if (typeof line == \"number\") line = getLine(this, line);\n\
      return visualLine(this, line);\n\
    },\n\
\n\
    lineCount: function() {\n\
      return this.size;\n\
    },\n\
    firstLine: function() {\n\
      return this.first;\n\
    },\n\
    lastLine: function() {\n\
      return this.first + this.size - 1;\n\
    },\n\
\n\
    clipPos: function(pos) {\n\
      return clipPos(this, pos);\n\
    },\n\
\n\
    getCursor: function(start) {\n\
      var sel = this.sel,\n\
        pos;\n\
      if (start == null || start == \"head\") pos = sel.head;\n\
      else if (start == \"anchor\") pos = sel.anchor;\n\
      else if (start == \"end\" || start === false) pos = sel.to;\n\
      else pos = sel.from;\n\
      return copyPos(pos);\n\
    },\n\
    somethingSelected: function() {\n\
      return !posEq(this.sel.head, this.sel.anchor);\n\
    },\n\
\n\
    setCursor: docOperation(function(line, ch, extend) {\n\
      var pos = clipPos(this, typeof line == \"number\" ? Pos(line, ch || 0) :\n\
        line);\n\
      if (extend) extendSelection(this, pos);\n\
      else setSelection(this, pos, pos);\n\
    }),\n\
    setSelection: docOperation(function(anchor, head, bias) {\n\
      setSelection(this, clipPos(this, anchor), clipPos(this, head ||\n\
        anchor), bias);\n\
    }),\n\
    extendSelection: docOperation(function(from, to, bias) {\n\
      extendSelection(this, clipPos(this, from), to && clipPos(this, to),\n\
        bias);\n\
    }),\n\
\n\
    getSelection: function(lineSep) {\n\
      return this.getRange(this.sel.from, this.sel.to, lineSep);\n\
    },\n\
    replaceSelection: function(code, collapse, origin) {\n\
      makeChange(this, {\n\
        from: this.sel.from,\n\
        to: this.sel.to,\n\
        text: splitLines(code),\n\
        origin: origin\n\
      }, collapse || \"around\");\n\
    },\n\
    undo: docOperation(function() {\n\
      makeChangeFromHistory(this, \"undo\");\n\
    }),\n\
    redo: docOperation(function() {\n\
      makeChangeFromHistory(this, \"redo\");\n\
    }),\n\
\n\
    setExtending: function(val) {\n\
      this.sel.extend = val;\n\
    },\n\
\n\
    historySize: function() {\n\
      var hist = this.history;\n\
      return {\n\
        undo: hist.done.length,\n\
        redo: hist.undone.length\n\
      };\n\
    },\n\
    clearHistory: function() {\n\
      this.history = makeHistory(this.history.maxGeneration);\n\
    },\n\
\n\
    markClean: function() {\n\
      this.cleanGeneration = this.changeGeneration();\n\
    },\n\
    changeGeneration: function() {\n\
      this.history.lastOp = this.history.lastOrigin = null;\n\
      return this.history.generation;\n\
    },\n\
    isClean: function(gen) {\n\
      return this.history.generation == (gen || this.cleanGeneration);\n\
    },\n\
\n\
    getHistory: function() {\n\
      return {\n\
        done: copyHistoryArray(this.history.done),\n\
        undone: copyHistoryArray(this.history.undone)\n\
      };\n\
    },\n\
    setHistory: function(histData) {\n\
      var hist = this.history = makeHistory(this.history.maxGeneration);\n\
      hist.done = histData.done.slice(0);\n\
      hist.undone = histData.undone.slice(0);\n\
    },\n\
\n\
    markText: function(from, to, options) {\n\
      return markText(this, clipPos(this, from), clipPos(this, to), options,\n\
        \"range\");\n\
    },\n\
    setBookmark: function(pos, options) {\n\
      var realOpts = {\n\
        replacedWith: options && (options.nodeType == null ? options.widget :\n\
          options),\n\
        insertLeft: options && options.insertLeft,\n\
        clearWhenEmpty: false\n\
      };\n\
      pos = clipPos(this, pos);\n\
      return markText(this, pos, pos, realOpts, \"bookmark\");\n\
    },\n\
    findMarksAt: function(pos) {\n\
      pos = clipPos(this, pos);\n\
      var markers = [],\n\
        spans = getLine(this, pos.line)\n\
          .markedSpans;\n\
      if (spans)\n\
        for (var i = 0; i < spans.length; ++i) {\n\
          var span = spans[i];\n\
          if ((span.from == null || span.from <= pos.ch) &&\n\
            (span.to == null || span.to >= pos.ch))\n\
            markers.push(span.marker.parent || span.marker);\n\
        }\n\
      return markers;\n\
    },\n\
    getAllMarks: function() {\n\
      var markers = [];\n\
      this.iter(function(line) {\n\
        var sps = line.markedSpans;\n\
        if (sps)\n\
          for (var i = 0; i < sps.length; ++i)\n\
            if (sps[i].from != null) markers.push(sps[i].marker);\n\
      });\n\
      return markers;\n\
    },\n\
\n\
    posFromIndex: function(off) {\n\
      var ch, lineNo = this.first;\n\
      this.iter(function(line) {\n\
        var sz = line.text.length + 1;\n\
        if (sz > off) {\n\
          ch = off;\n\
          return true;\n\
        }\n\
        off -= sz;\n\
        ++lineNo;\n\
      });\n\
      return clipPos(this, Pos(lineNo, ch));\n\
    },\n\
    indexFromPos: function(coords) {\n\
      coords = clipPos(this, coords);\n\
      var index = coords.ch;\n\
      if (coords.line < this.first || coords.ch < 0) return 0;\n\
      this.iter(this.first, coords.line, function(line) {\n\
        index += line.text.length + 1;\n\
      });\n\
      return index;\n\
    },\n\
\n\
    copy: function(copyHistory) {\n\
      var doc = new Doc(getLines(this, this.first, this.first + this.size),\n\
        this.modeOption, this.first);\n\
      doc.scrollTop = this.scrollTop;\n\
      doc.scrollLeft = this.scrollLeft;\n\
      doc.sel = {\n\
        from: this.sel.from,\n\
        to: this.sel.to,\n\
        head: this.sel.head,\n\
        anchor: this.sel.anchor,\n\
        shift: this.sel.shift,\n\
        extend: false,\n\
        goalColumn: this.sel.goalColumn\n\
      };\n\
      if (copyHistory) {\n\
        doc.history.undoDepth = this.history.undoDepth;\n\
        doc.setHistory(this.getHistory());\n\
      }\n\
      return doc;\n\
    },\n\
\n\
    linkedDoc: function(options) {\n\
      if (!options) options = {};\n\
      var from = this.first,\n\
        to = this.first + this.size;\n\
      if (options.from != null && options.from > from) from = options.from;\n\
      if (options.to != null && options.to < to) to = options.to;\n\
      var copy = new Doc(getLines(this, from, to), options.mode || this.modeOption,\n\
        from);\n\
      if (options.sharedHist) copy.history = this.history;\n\
      (this.linked || (this.linked = []))\n\
        .push({\n\
          doc: copy,\n\
          sharedHist: options.sharedHist\n\
        });\n\
      copy.linked = [{\n\
        doc: this,\n\
        isParent: true,\n\
        sharedHist: options.sharedHist\n\
      }];\n\
      return copy;\n\
    },\n\
    unlinkDoc: function(other) {\n\
      if (other instanceof CodeMirror) other = other.doc;\n\
      if (this.linked)\n\
        for (var i = 0; i < this.linked.length; ++i) {\n\
          var link = this.linked[i];\n\
          if (link.doc != other) continue;\n\
          this.linked.splice(i, 1);\n\
          other.unlinkDoc(this);\n\
          break;\n\
        }\n\
        // If the histories were shared, split them again\n\
      if (other.history == this.history) {\n\
        var splitIds = [other.id];\n\
        linkedDocs(other, function(doc) {\n\
          splitIds.push(doc.id);\n\
        }, true);\n\
        other.history = makeHistory();\n\
        other.history.done = copyHistoryArray(this.history.done, splitIds);\n\
        other.history.undone = copyHistoryArray(this.history.undone,\n\
          splitIds);\n\
      }\n\
    },\n\
    iterLinkedDocs: function(f) {\n\
      linkedDocs(this, f);\n\
    },\n\
\n\
    getMode: function() {\n\
      return this.mode;\n\
    },\n\
    getEditor: function() {\n\
      return this.cm;\n\
    }\n\
  });\n\
\n\
  Doc.prototype.eachLine = Doc.prototype.iter;\n\
\n\
  // The Doc methods that should be available on CodeMirror instances\n\
  var dontDelegate = \"iter insert remove copy getEditor\".split(\" \");\n\
  for (var prop in Doc.prototype)\n\
    if (Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0)\n\
      CodeMirror.prototype[prop] = (function(method) {\n\
        return function() {\n\
          return method.apply(this.doc, arguments);\n\
        };\n\
      })(Doc.prototype[prop]);\n\
\n\
  eventMixin(Doc);\n\
\n\
  function linkedDocs(doc, f, sharedHistOnly) {\n\
    function propagate(doc, skip, sharedHist) {\n\
      if (doc.linked)\n\
        for (var i = 0; i < doc.linked.length; ++i) {\n\
          var rel = doc.linked[i];\n\
          if (rel.doc == skip) continue;\n\
          var shared = sharedHist && rel.sharedHist;\n\
          if (sharedHistOnly && !shared) continue;\n\
          f(rel.doc, shared);\n\
          propagate(rel.doc, doc, shared);\n\
        }\n\
    }\n\
    propagate(doc, null, true);\n\
  }\n\
\n\
  function attachDoc(cm, doc) {\n\
    if (doc.cm) throw new Error(\"This document is already in use.\");\n\
    cm.doc = doc;\n\
    doc.cm = cm;\n\
    estimateLineHeights(cm);\n\
    loadMode(cm);\n\
    if (!cm.options.lineWrapping) computeMaxLength(cm);\n\
    cm.options.mode = doc.modeOption;\n\
    regChange(cm);\n\
  }\n\
\n\
  // LINE UTILITIES\n\
\n\
  function getLine(chunk, n) {\n\
    n -= chunk.first;\n\
    while (!chunk.lines) {\n\
      for (var i = 0;; ++i) {\n\
        var child = chunk.children[i],\n\
          sz = child.chunkSize();\n\
        if (n < sz) {\n\
          chunk = child;\n\
          break;\n\
        }\n\
        n -= sz;\n\
      }\n\
    }\n\
    return chunk.lines[n];\n\
  }\n\
\n\
  function getBetween(doc, start, end) {\n\
    var out = [],\n\
      n = start.line;\n\
    doc.iter(start.line, end.line + 1, function(line) {\n\
      var text = line.text;\n\
      if (n == end.line) text = text.slice(0, end.ch);\n\
      if (n == start.line) text = text.slice(start.ch);\n\
      out.push(text);\n\
      ++n;\n\
    });\n\
    return out;\n\
  }\n\
\n\
  function getLines(doc, from, to) {\n\
    var out = [];\n\
    doc.iter(from, to, function(line) {\n\
      out.push(line.text);\n\
    });\n\
    return out;\n\
  }\n\
\n\
  function updateLineHeight(line, height) {\n\
    var diff = height - line.height;\n\
    for (var n = line; n; n = n.parent) n.height += diff;\n\
  }\n\
\n\
  function lineNo(line) {\n\
    if (line.parent == null) return null;\n\
    var cur = line.parent,\n\
      no = indexOf(cur.lines, line);\n\
    for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {\n\
      for (var i = 0;; ++i) {\n\
        if (chunk.children[i] == cur) break;\n\
        no += chunk.children[i].chunkSize();\n\
      }\n\
    }\n\
    return no + cur.first;\n\
  }\n\
\n\
  function lineAtHeight(chunk, h) {\n\
    var n = chunk.first;\n\
    outer: do {\n\
      for (var i = 0, e = chunk.children.length; i < e; ++i) {\n\
        var child = chunk.children[i],\n\
          ch = child.height;\n\
        if (h < ch) {\n\
          chunk = child;\n\
          continue outer;\n\
        }\n\
        h -= ch;\n\
        n += child.chunkSize();\n\
      }\n\
      return n;\n\
    } while (!chunk.lines);\n\
    for (var i = 0, e = chunk.lines.length; i < e; ++i) {\n\
      var line = chunk.lines[i],\n\
        lh = line.height;\n\
      if (h < lh) break;\n\
      h -= lh;\n\
    }\n\
    return n + i;\n\
  }\n\
\n\
  function heightAtLine(cm, lineObj) {\n\
    lineObj = visualLine(cm.doc, lineObj);\n\
\n\
    var h = 0,\n\
      chunk = lineObj.parent;\n\
    for (var i = 0; i < chunk.lines.length; ++i) {\n\
      var line = chunk.lines[i];\n\
      if (line == lineObj) break;\n\
      else h += line.height;\n\
    }\n\
    for (var p = chunk.parent; p; chunk = p, p = chunk.parent) {\n\
      for (var i = 0; i < p.children.length; ++i) {\n\
        var cur = p.children[i];\n\
        if (cur == chunk) break;\n\
        else h += cur.height;\n\
      }\n\
    }\n\
    return h;\n\
  }\n\
\n\
  function getOrder(line) {\n\
    var order = line.order;\n\
    if (order == null) order = line.order = bidiOrdering(line.text);\n\
    return order;\n\
  }\n\
\n\
  // HISTORY\n\
\n\
  function makeHistory(startGen) {\n\
    return {\n\
      // Arrays of history events. Doing something adds an event to\n\
      // done and clears undo. Undoing moves events from done to\n\
      // undone, redoing moves them in the other direction.\n\
      done: [],\n\
      undone: [],\n\
      undoDepth: Infinity,\n\
      // Used to track when changes can be merged into a single undo\n\
      // event\n\
      lastTime: 0,\n\
      lastOp: null,\n\
      lastOrigin: null,\n\
      // Used by the isClean() method\n\
      generation: startGen || 1,\n\
      maxGeneration: startGen || 1\n\
    };\n\
  }\n\
\n\
  function attachLocalSpans(doc, change, from, to) {\n\
    var existing = change[\"spans_\" + doc.id],\n\
      n = 0;\n\
    doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to),\n\
      function(line) {\n\
        if (line.markedSpans)\n\
          (existing || (existing = change[\"spans_\" + doc.id] = {}))[n] = line\n\
            .markedSpans;\n\
        ++n;\n\
      });\n\
  }\n\
\n\
  function historyChangeFromChange(doc, change) {\n\
    var from = {\n\
      line: change.from.line,\n\
      ch: change.from.ch\n\
    };\n\
    var histChange = {\n\
      from: from,\n\
      to: changeEnd(change),\n\
      text: getBetween(doc, change.from, change.to)\n\
    };\n\
    attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);\n\
    linkedDocs(doc, function(doc) {\n\
      attachLocalSpans(doc, histChange, change.from.line, change.to.line +\n\
        1);\n\
    }, true);\n\
    return histChange;\n\
  }\n\
\n\
  function addToHistory(doc, change, selAfter, opId) {\n\
    var hist = doc.history;\n\
    hist.undone.length = 0;\n\
    var time = +new Date,\n\
      cur = lst(hist.done);\n\
\n\
    if (cur &&\n\
      (hist.lastOp == opId ||\n\
        hist.lastOrigin == change.origin && change.origin &&\n\
        ((change.origin.charAt(0) == \"+\" && doc.cm && hist.lastTime > time -\n\
            doc.cm.options.historyEventDelay) ||\n\
          change.origin.charAt(0) == \"*\"))) {\n\
      // Merge this change into the last event\n\
      var last = lst(cur.changes);\n\
      if (posEq(change.from, change.to) && posEq(change.from, last.to)) {\n\
        // Optimized case for simple insertion -- don't want to add\n\
        // new changesets for every character typed\n\
        last.to = changeEnd(change);\n\
      } else {\n\
        // Add new sub-event\n\
        cur.changes.push(historyChangeFromChange(doc, change));\n\
      }\n\
      cur.anchorAfter = selAfter.anchor;\n\
      cur.headAfter = selAfter.head;\n\
    } else {\n\
      // Can not be merged, start a new event.\n\
      cur = {\n\
        changes: [historyChangeFromChange(doc, change)],\n\
        generation: hist.generation,\n\
        anchorBefore: doc.sel.anchor,\n\
        headBefore: doc.sel.head,\n\
        anchorAfter: selAfter.anchor,\n\
        headAfter: selAfter.head\n\
      };\n\
      hist.done.push(cur);\n\
      hist.generation = ++hist.maxGeneration;\n\
      while (hist.done.length > hist.undoDepth)\n\
        hist.done.shift();\n\
    }\n\
    hist.lastTime = time;\n\
    hist.lastOp = opId;\n\
    hist.lastOrigin = change.origin;\n\
  }\n\
\n\
  function removeClearedSpans(spans) {\n\
    if (!spans) return null;\n\
    for (var i = 0, out; i < spans.length; ++i) {\n\
      if (spans[i].marker.explicitlyCleared) {\n\
        if (!out) out = spans.slice(0, i);\n\
      } else if (out) out.push(spans[i]);\n\
    }\n\
    return !out ? spans : out.length ? out : null;\n\
  }\n\
\n\
  function getOldSpans(doc, change) {\n\
    var found = change[\"spans_\" + doc.id];\n\
    if (!found) return null;\n\
    for (var i = 0, nw = []; i < change.text.length; ++i)\n\
      nw.push(removeClearedSpans(found[i]));\n\
    return nw;\n\
  }\n\
\n\
  // Used both to provide a JSON-safe object in .getHistory, and, when\n\
  // detaching a document, to split the history in two\n\
  function copyHistoryArray(events, newGroup) {\n\
    for (var i = 0, copy = []; i < events.length; ++i) {\n\
      var event = events[i],\n\
        changes = event.changes,\n\
        newChanges = [];\n\
      copy.push({\n\
        changes: newChanges,\n\
        anchorBefore: event.anchorBefore,\n\
        headBefore: event.headBefore,\n\
        anchorAfter: event.anchorAfter,\n\
        headAfter: event.headAfter\n\
      });\n\
      for (var j = 0; j < changes.length; ++j) {\n\
        var change = changes[j],\n\
          m;\n\
        newChanges.push({\n\
          from: change.from,\n\
          to: change.to,\n\
          text: change.text\n\
        });\n\
        if (newGroup)\n\
          for (var prop in change)\n\
            if (m = prop.match(/^spans_(\\d+)$/)) {\n\
              if (indexOf(newGroup, Number(m[1])) > -1) {\n\
                lst(newChanges)[prop] = change[prop];\n\
                delete change[prop];\n\
              }\n\
            }\n\
      }\n\
    }\n\
    return copy;\n\
  }\n\
\n\
  // Rebasing/resetting history to deal with externally-sourced changes\n\
\n\
  function rebaseHistSel(pos, from, to, diff) {\n\
    if (to < pos.line) {\n\
      pos.line += diff;\n\
    } else if (from < pos.line) {\n\
      pos.line = from;\n\
      pos.ch = 0;\n\
    }\n\
  }\n\
\n\
  // Tries to rebase an array of history events given a change in the\n\
  // document. If the change touches the same lines as the event, the\n\
  // event, and everything 'behind' it, is discarded. If the change is\n\
  // before the event, the event's positions are updated. Uses a\n\
  // copy-on-write scheme for the positions, to avoid having to\n\
  // reallocate them all on every rebase, but also avoid problems with\n\
  // shared position objects being unsafely updated.\n\
  function rebaseHistArray(array, from, to, diff) {\n\
    for (var i = 0; i < array.length; ++i) {\n\
      var sub = array[i],\n\
        ok = true;\n\
      for (var j = 0; j < sub.changes.length; ++j) {\n\
        var cur = sub.changes[j];\n\
        if (!sub.copied) {\n\
          cur.from = copyPos(cur.from);\n\
          cur.to = copyPos(cur.to);\n\
        }\n\
        if (to < cur.from.line) {\n\
          cur.from.line += diff;\n\
          cur.to.line += diff;\n\
        } else if (from <= cur.to.line) {\n\
          ok = false;\n\
          break;\n\
        }\n\
      }\n\
      if (!sub.copied) {\n\
        sub.anchorBefore = copyPos(sub.anchorBefore);\n\
        sub.headBefore = copyPos(sub.headBefore);\n\
        sub.anchorAfter = copyPos(sub.anchorAfter);\n\
        sub.readAfter = copyPos(sub.headAfter);\n\
        sub.copied = true;\n\
      }\n\
      if (!ok) {\n\
        array.splice(0, i + 1);\n\
        i = 0;\n\
      } else {\n\
        rebaseHistSel(sub.anchorBefore);\n\
        rebaseHistSel(sub.headBefore);\n\
        rebaseHistSel(sub.anchorAfter);\n\
        rebaseHistSel(sub.headAfter);\n\
      }\n\
    }\n\
  }\n\
\n\
  function rebaseHist(hist, change) {\n\
    var from = change.from.line,\n\
      to = change.to.line,\n\
      diff = change.text.length - (to - from) - 1;\n\
    rebaseHistArray(hist.done, from, to, diff);\n\
    rebaseHistArray(hist.undone, from, to, diff);\n\
  }\n\
\n\
  // EVENT OPERATORS\n\
\n\
  function stopMethod() {\n\
    e_stop(this);\n\
  }\n\
  // Ensure an event has a stop method.\n\
  function addStop(event) {\n\
    if (!event.stop) event.stop = stopMethod;\n\
    return event;\n\
  }\n\
\n\
  function e_preventDefault(e) {\n\
    if (e.preventDefault) e.preventDefault();\n\
    else e.returnValue = false;\n\
  }\n\
\n\
  function e_stopPropagation(e) {\n\
    if (e.stopPropagation) e.stopPropagation();\n\
    else e.cancelBubble = true;\n\
  }\n\
\n\
  function e_defaultPrevented(e) {\n\
    return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue ==\n\
      false;\n\
  }\n\
\n\
  function e_stop(e) {\n\
    e_preventDefault(e);\n\
    e_stopPropagation(e);\n\
  }\n\
  CodeMirror.e_stop = e_stop;\n\
  CodeMirror.e_preventDefault = e_preventDefault;\n\
  CodeMirror.e_stopPropagation = e_stopPropagation;\n\
\n\
  function e_target(e) {\n\
    return e.target || e.srcElement;\n\
  }\n\
\n\
  function e_button(e) {\n\
    var b = e.which;\n\
    if (b == null) {\n\
      if (e.button & 1) b = 1;\n\
      else if (e.button & 2) b = 3;\n\
      else if (e.button & 4) b = 2;\n\
    }\n\
    if (mac && e.ctrlKey && b == 1) b = 3;\n\
    return b;\n\
  }\n\
\n\
  // EVENT HANDLING\n\
\n\
  function on(emitter, type, f) {\n\
    if (emitter.addEventListener)\n\
      emitter.addEventListener(type, f, false);\n\
    else if (emitter.attachEvent)\n\
      emitter.attachEvent(\"on\" + type, f);\n\
    else {\n\
      var map = emitter._handlers || (emitter._handlers = {});\n\
      var arr = map[type] || (map[type] = []);\n\
      arr.push(f);\n\
    }\n\
  }\n\
\n\
  function off(emitter, type, f) {\n\
    if (emitter.removeEventListener)\n\
      emitter.removeEventListener(type, f, false);\n\
    else if (emitter.detachEvent)\n\
      emitter.detachEvent(\"on\" + type, f);\n\
    else {\n\
      var arr = emitter._handlers && emitter._handlers[type];\n\
      if (!arr) return;\n\
      for (var i = 0; i < arr.length; ++i)\n\
        if (arr[i] == f) {\n\
          arr.splice(i, 1);\n\
          break;\n\
        }\n\
    }\n\
  }\n\
\n\
  function signal(emitter, type /*, values...*/ ) {\n\
    var arr = emitter._handlers && emitter._handlers[type];\n\
    if (!arr) return;\n\
    var args = Array.prototype.slice.call(arguments, 2);\n\
    for (var i = 0; i < arr.length; ++i) arr[i].apply(null, args);\n\
  }\n\
\n\
  var delayedCallbacks, delayedCallbackDepth = 0;\n\
\n\
  function signalLater(emitter, type /*, values...*/ ) {\n\
    var arr = emitter._handlers && emitter._handlers[type];\n\
    if (!arr) return;\n\
    var args = Array.prototype.slice.call(arguments, 2);\n\
    if (!delayedCallbacks) {\n\
      ++delayedCallbackDepth;\n\
      delayedCallbacks = [];\n\
      setTimeout(fireDelayed, 0);\n\
    }\n\
\n\
    function bnd(f) {\n\
      return function() {\n\
        f.apply(null, args);\n\
      };\n\
    };\n\
    for (var i = 0; i < arr.length; ++i)\n\
      delayedCallbacks.push(bnd(arr[i]));\n\
  }\n\
\n\
  function signalDOMEvent(cm, e, override) {\n\
    signal(cm, override || e.type, cm, e);\n\
    return e_defaultPrevented(e) || e.codemirrorIgnore;\n\
  }\n\
\n\
  function fireDelayed() {\n\
    --delayedCallbackDepth;\n\
    var delayed = delayedCallbacks;\n\
    delayedCallbacks = null;\n\
    for (var i = 0; i < delayed.length; ++i) delayed[i]();\n\
  }\n\
\n\
  function hasHandler(emitter, type) {\n\
    var arr = emitter._handlers && emitter._handlers[type];\n\
    return arr && arr.length > 0;\n\
  }\n\
\n\
  CodeMirror.on = on;\n\
  CodeMirror.off = off;\n\
  CodeMirror.signal = signal;\n\
\n\
  function eventMixin(ctor) {\n\
    ctor.prototype.on = function(type, f) {\n\
      on(this, type, f);\n\
    };\n\
    ctor.prototype.off = function(type, f) {\n\
      off(this, type, f);\n\
    };\n\
  }\n\
\n\
  // MISC UTILITIES\n\
\n\
  // Number of pixels added to scroller and sizer to hide scrollbar\n\
  var scrollerCutOff = 30;\n\
\n\
  // Returned or thrown by various protocols to signal 'I'm not\n\
  // handling this'.\n\
  var Pass = CodeMirror.Pass = {\n\
    toString: function() {\n\
      return \"CodeMirror.Pass\";\n\
    }\n\
  };\n\
\n\
  function Delayed() {\n\
    this.id = null;\n\
  }\n\
  Delayed.prototype = {\n\
    set: function(ms, f) {\n\
      clearTimeout(this.id);\n\
      this.id = setTimeout(f, ms);\n\
    }\n\
  };\n\
\n\
  // Counts the column offset in a string, taking tabs into account.\n\
  // Used mostly to find indentation.\n\
  function countColumn(string, end, tabSize, startIndex, startValue) {\n\
    if (end == null) {\n\
      end = string.search(/[^\\s\\u00a0]/);\n\
      if (end == -1) end = string.length;\n\
    }\n\
    for (var i = startIndex || 0, n = startValue || 0; i < end; ++i) {\n\
      if (string.charAt(i) == \"\\t\") n += tabSize - (n % tabSize);\n\
      else ++n;\n\
    }\n\
    return n;\n\
  }\n\
  CodeMirror.countColumn = countColumn;\n\
\n\
  var spaceStrs = [\"\"];\n\
\n\
  function spaceStr(n) {\n\
    while (spaceStrs.length <= n)\n\
      spaceStrs.push(lst(spaceStrs) + \" \");\n\
    return spaceStrs[n];\n\
  }\n\
\n\
  function lst(arr) {\n\
    return arr[arr.length - 1];\n\
  }\n\
\n\
  function selectInput(node) {\n\
    if (ios) { // Mobile Safari apparently has a bug where select() is broken.\n\
      node.selectionStart = 0;\n\
      node.selectionEnd = node.value.length;\n\
    } else {\n\
      // Suppress mysterious IE10 errors\n\
      try {\n\
        node.select();\n\
      } catch (_e) {}\n\
    }\n\
  }\n\
\n\
  function indexOf(collection, elt) {\n\
    if (collection.indexOf) return collection.indexOf(elt);\n\
    for (var i = 0, e = collection.length; i < e; ++i)\n\
      if (collection[i] == elt) return i;\n\
    return -1;\n\
  }\n\
\n\
  function createObj(base, props) {\n\
    function Obj() {}\n\
    Obj.prototype = base;\n\
    var inst = new Obj();\n\
    if (props) copyObj(props, inst);\n\
    return inst;\n\
  }\n\
\n\
  function copyObj(obj, target) {\n\
    if (!target) target = {};\n\
    for (var prop in obj)\n\
      if (obj.hasOwnProperty(prop)) target[prop] = obj[prop];\n\
    return target;\n\
  }\n\
\n\
  function emptyArray(size) {\n\
    for (var a = [], i = 0; i < size; ++i) a.push(undefined);\n\
    return a;\n\
  }\n\
\n\
  function bind(f) {\n\
    var args = Array.prototype.slice.call(arguments, 1);\n\
    return function() {\n\
      return f.apply(null, args);\n\
    };\n\
  }\n\
\n\
  var nonASCIISingleCaseWordChar =\n\
    /[\\u3040-\\u309f\\u30a0-\\u30ff\\u3400-\\u4db5\\u4e00-\\u9fcc\\uac00-\\ud7af]/;\n\
\n\
  function isWordChar(ch) {\n\
    return /\\w/.test(ch) || ch > \"\\x80\" &&\n\
      (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(\n\
      ch));\n\
  }\n\
\n\
  function isEmpty(obj) {\n\
    for (var n in obj)\n\
      if (obj.hasOwnProperty(n) && obj[n]) return false;\n\
    return true;\n\
  }\n\
\n\
  var isExtendingChar =\n\
    /[\\u0300-\\u036F\\u0483-\\u0487\\u0488-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1-\\u05C2\\u05C4-\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7-\\u06E8\\u06EA-\\u06ED\\uA66F\\u1DC0-\\u1DFF\\u20D0-\\u20FF\\uA670-\\uA672\\uA674-\\uA67D\\uA69F\\udc00-\\udfff\\uFE20-\\uFE2F]/;\n\
\n\
  // DOM UTILITIES\n\
\n\
  function elt(tag, content, className, style) {\n\
    var e = document.createElement(tag);\n\
    if (className) e.className = className;\n\
    if (style) e.style.cssText = style;\n\
    if (typeof content == \"string\") setTextContent(e, content);\n\
    else if (content)\n\
      for (var i = 0; i < content.length; ++i) e.appendChild(content[i]);\n\
    return e;\n\
  }\n\
\n\
  function removeChildren(e) {\n\
    for (var count = e.childNodes.length; count > 0; --count)\n\
      e.removeChild(e.firstChild);\n\
    return e;\n\
  }\n\
\n\
  function removeChildrenAndAdd(parent, e) {\n\
    return removeChildren(parent)\n\
      .appendChild(e);\n\
  }\n\
\n\
  function setTextContent(e, str) {\n\
    if (ie_lt9) {\n\
      e.innerHTML = \"\";\n\
      e.appendChild(document.createTextNode(str));\n\
    } else e.textContent = str;\n\
  }\n\
\n\
  function getRect(node) {\n\
    return node.getBoundingClientRect();\n\
  }\n\
  CodeMirror.replaceGetRect = function(f) {\n\
    getRect = f;\n\
  };\n\
\n\
  // FEATURE DETECTION\n\
\n\
  // Detect drag-and-drop\n\
  var dragAndDrop = function() {\n\
    // There is *some* kind of drag-and-drop support in IE6-8, but I\n\
    // couldn't get it to work yet.\n\
    if (ie_lt9) return false;\n\
    var div = elt('div');\n\
    return \"draggable\" in div || \"dragDrop\" in div;\n\
  }();\n\
\n\
  // For a reason I have yet to figure out, some browsers disallow\n\
  // word wrapping between certain characters *only* if a new inline\n\
  // element is started between them. This makes it hard to reliably\n\
  // measure the position of things, since that requires inserting an\n\
  // extra span. This terribly fragile set of tests matches the\n\
  // character combinations that suffer from this phenomenon on the\n\
  // various browsers.\n\
  function spanAffectsWrapping() {\n\
    return false;\n\
  }\n\
  if (gecko) // Only for \"$'\"\n\
    spanAffectsWrapping = function(str, i) {\n\
      return str.charCodeAt(i - 1) == 36 && str.charCodeAt(i) == 39;\n\
    };\n\
  else if (safari && !/Version\\/([6-9]|\\d\\d)\\b/.test(navigator.userAgent))\n\
    spanAffectsWrapping = function(str, i) {\n\
      return /\\-[^ \\-?]|\\?[^ !\\'\\\"\\),.\\-\\/:;\\?\\]\\}]/.test(str.slice(i - 1, i +\n\
        1));\n\
    };\n\
  else if (webkit && /Chrome\\/(?:29|[3-9]\\d|\\d\\d\\d)\\./.test(navigator.userAgent))\n\
    spanAffectsWrapping = function(str, i) {\n\
      var code = str.charCodeAt(i - 1);\n\
      return code >= 8208 && code <= 8212;\n\
    };\n\
  else if (webkit)\n\
    spanAffectsWrapping = function(str, i) {\n\
      if (i > 1 && str.charCodeAt(i - 1) == 45) {\n\
        if (/\\w/.test(str.charAt(i - 2)) && /[^\\-?\\.]/.test(str.charAt(i)))\n\
          return true;\n\
        if (i > 2 && /[\\d\\.,]/.test(str.charAt(i - 2)) && /[\\d\\.,]/.test(str.charAt(\n\
          i))) return false;\n\
      }\n\
      return /[~!#%&*)=+}\\]\\\\|\\\"\\.>,:;][({[<]|-[^\\-?\\.\\u2010-\\u201f\\u2026]|\\?[\\w~`@#$%\\^&*(_=+{[|><]|\\u2026[\\w~`@#$%\\^&*(_=+{[><]/\n\
        .test(str.slice(i - 1, i + 1));\n\
    };\n\
\n\
  var knownScrollbarWidth;\n\
\n\
  function scrollbarWidth(measure) {\n\
    if (knownScrollbarWidth != null) return knownScrollbarWidth;\n\
    var test = elt(\"div\", null, null,\n\
      \"width: 50px; height: 50px; overflow-x: scroll\");\n\
    removeChildrenAndAdd(measure, test);\n\
    if (test.offsetWidth)\n\
      knownScrollbarWidth = test.offsetHeight - test.clientHeight;\n\
    return knownScrollbarWidth || 0;\n\
  }\n\
\n\
  var zwspSupported;\n\
\n\
  function zeroWidthElement(measure) {\n\
    if (zwspSupported == null) {\n\
      var test = elt(\"span\", \"\\u200b\");\n\
      removeChildrenAndAdd(measure, elt(\"span\", [test, document.createTextNode(\n\
        \"x\")]));\n\
      if (measure.firstChild.offsetHeight != 0)\n\
        zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !\n\
          ie_lt8;\n\
    }\n\
    if (zwspSupported) return elt(\"span\", \"\\u200b\");\n\
    else return elt(\"span\", \"\\u00a0\", null,\n\
      \"display: inline-block; width: 1px; margin-right: -1px\");\n\
  }\n\
\n\
  // See if \"\".split is the broken IE version, if so, provide an\n\
  // alternative way to split lines.\n\
  var splitLines = \"\\n\
\\n\
b\".split(/\\n\
/)\n\
    .length != 3 ? function(string) {\n\
      var pos = 0,\n\
        result = [],\n\
        l = string.length;\n\
      while (pos <= l) {\n\
        var nl = string.indexOf(\"\\n\
\", pos);\n\
        if (nl == -1) nl = string.length;\n\
        var line = string.slice(pos, string.charAt(nl - 1) == \"\\r\" ? nl - 1 :\n\
          nl);\n\
        var rt = line.indexOf(\"\\r\");\n\
        if (rt != -1) {\n\
          result.push(line.slice(0, rt));\n\
          pos += rt + 1;\n\
        } else {\n\
          result.push(line);\n\
          pos = nl + 1;\n\
        }\n\
      }\n\
      return result;\n\
    } : function(string) {\n\
      return string.split(/\\r\\n\
?|\\n\
/);\n\
    };\n\
  CodeMirror.splitLines = splitLines;\n\
\n\
  var hasSelection = window.getSelection ? function(te) {\n\
      try {\n\
        return te.selectionStart != te.selectionEnd;\n\
      } catch (e) {\n\
        return false;\n\
      }\n\
    } : function(te) {\n\
      try {\n\
        var range = te.ownerDocument.selection.createRange();\n\
      } catch (e) {}\n\
      if (!range || range.parentElement() != te) return false;\n\
      return range.compareEndPoints(\"StartToEnd\", range) != 0;\n\
    };\n\
\n\
  var hasCopyEvent = (function() {\n\
    var e = elt(\"div\");\n\
    if (\"oncopy\" in e) return true;\n\
    e.setAttribute(\"oncopy\", \"return;\");\n\
    return typeof e.oncopy == 'function';\n\
  })();\n\
\n\
  // KEY NAMING\n\
\n\
  var keyNames = {\n\
    3: \"Enter\",\n\
    8: \"Backspace\",\n\
    9: \"Tab\",\n\
    13: \"Enter\",\n\
    16: \"Shift\",\n\
    17: \"Ctrl\",\n\
    18: \"Alt\",\n\
    19: \"Pause\",\n\
    20: \"CapsLock\",\n\
    27: \"Esc\",\n\
    32: \"Space\",\n\
    33: \"PageUp\",\n\
    34: \"PageDown\",\n\
    35: \"End\",\n\
    36: \"Home\",\n\
    37: \"Left\",\n\
    38: \"Up\",\n\
    39: \"Right\",\n\
    40: \"Down\",\n\
    44: \"PrintScrn\",\n\
    45: \"Insert\",\n\
    46: \"Delete\",\n\
    59: \";\",\n\
    91: \"Mod\",\n\
    92: \"Mod\",\n\
    93: \"Mod\",\n\
    109: \"-\",\n\
    107: \"=\",\n\
    127: \"Delete\",\n\
    186: \";\",\n\
    187: \"=\",\n\
    188: \",\",\n\
    189: \"-\",\n\
    190: \".\",\n\
    191: \"/\",\n\
    192: \"`\",\n\
    219: \"[\",\n\
    220: \"\\\\\",\n\
    221: \"]\",\n\
    222: \"'\",\n\
    63276: \"PageUp\",\n\
    63277: \"PageDown\",\n\
    63275: \"End\",\n\
    63273: \"Home\",\n\
    63234: \"Left\",\n\
    63232: \"Up\",\n\
    63235: \"Right\",\n\
    63233: \"Down\",\n\
    63302: \"Insert\",\n\
    63272: \"Delete\"\n\
  };\n\
  CodeMirror.keyNames = keyNames;\n\
  (function() {\n\
    // Number keys\n\
    for (var i = 0; i < 10; i++) keyNames[i + 48] = String(i);\n\
    // Alphabetic keys\n\
    for (var i = 65; i <= 90; i++) keyNames[i] = String.fromCharCode(i);\n\
    // Function keys\n\
    for (var i = 1; i <= 12; i++) keyNames[i + 111] = keyNames[i + 63235] =\n\
      \"F\" + i;\n\
  })();\n\
\n\
  // BIDI HELPERS\n\
\n\
  function iterateBidiSections(order, from, to, f) {\n\
    if (!order) return f(from, to, \"ltr\");\n\
    var found = false;\n\
    for (var i = 0; i < order.length; ++i) {\n\
      var part = order[i];\n\
      if (part.from < to && part.to > from || from == to && part.to == from) {\n\
        f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ?\n\
          \"rtl\" : \"ltr\");\n\
        found = true;\n\
      }\n\
    }\n\
    if (!found) f(from, to, \"ltr\");\n\
  }\n\
\n\
  function bidiLeft(part) {\n\
    return part.level % 2 ? part.to : part.from;\n\
  }\n\
\n\
  function bidiRight(part) {\n\
    return part.level % 2 ? part.from : part.to;\n\
  }\n\
\n\
  function lineLeft(line) {\n\
    var order = getOrder(line);\n\
    return order ? bidiLeft(order[0]) : 0;\n\
  }\n\
\n\
  function lineRight(line) {\n\
    var order = getOrder(line);\n\
    if (!order) return line.text.length;\n\
    return bidiRight(lst(order));\n\
  }\n\
\n\
  function lineStart(cm, lineN) {\n\
    var line = getLine(cm.doc, lineN);\n\
    var visual = visualLine(cm.doc, line);\n\
    if (visual != line) lineN = lineNo(visual);\n\
    var order = getOrder(visual);\n\
    var ch = !order ? 0 : order[0].level % 2 ? lineRight(visual) : lineLeft(\n\
      visual);\n\
    return Pos(lineN, ch);\n\
  }\n\
\n\
  function lineEnd(cm, lineN) {\n\
    var merged, line;\n\
    while (merged = collapsedSpanAtEnd(line = getLine(cm.doc, lineN)))\n\
      lineN = merged.find()\n\
        .to.line;\n\
    var order = getOrder(line);\n\
    var ch = !order ? line.text.length : order[0].level % 2 ? lineLeft(line) :\n\
      lineRight(line);\n\
    return Pos(lineN, ch);\n\
  }\n\
\n\
  function compareBidiLevel(order, a, b) {\n\
    var linedir = order[0].level;\n\
    if (a == linedir) return true;\n\
    if (b == linedir) return false;\n\
    return a < b;\n\
  }\n\
  var bidiOther;\n\
\n\
  function getBidiPartAt(order, pos) {\n\
    bidiOther = null;\n\
    for (var i = 0, found; i < order.length; ++i) {\n\
      var cur = order[i];\n\
      if (cur.from < pos && cur.to > pos) return i;\n\
      if ((cur.from == pos || cur.to == pos)) {\n\
        if (found == null) {\n\
          found = i;\n\
        } else if (compareBidiLevel(order, cur.level, order[found].level)) {\n\
          if (cur.from != cur.to) bidiOther = found;\n\
          return i;\n\
        } else {\n\
          if (cur.from != cur.to) bidiOther = i;\n\
          return found;\n\
        }\n\
      }\n\
    }\n\
    return found;\n\
  }\n\
\n\
  function moveInLine(line, pos, dir, byUnit) {\n\
    if (!byUnit) return pos + dir;\n\
    do pos += dir;\n\
    while (pos > 0 && isExtendingChar.test(line.text.charAt(pos)));\n\
    return pos;\n\
  }\n\
\n\
  // This is somewhat involved. It is needed in order to move\n\
  // 'visually' through bi-directional text -- i.e., pressing left\n\
  // should make the cursor go left, even when in RTL text. The\n\
  // tricky part is the 'jumps', where RTL and LTR text touch each\n\
  // other. This often requires the cursor offset to move more than\n\
  // one unit, in order to visually move one unit.\n\
  function moveVisually(line, start, dir, byUnit) {\n\
    var bidi = getOrder(line);\n\
    if (!bidi) return moveLogically(line, start, dir, byUnit);\n\
    var pos = getBidiPartAt(bidi, start),\n\
      part = bidi[pos];\n\
    var target = moveInLine(line, start, part.level % 2 ? -dir : dir, byUnit);\n\
\n\
    for (;;) {\n\
      if (target > part.from && target < part.to) return target;\n\
      if (target == part.from || target == part.to) {\n\
        if (getBidiPartAt(bidi, target) == pos) return target;\n\
        part = bidi[pos += dir];\n\
        return (dir > 0) == part.level % 2 ? part.to : part.from;\n\
      } else {\n\
        part = bidi[pos += dir];\n\
        if (!part) return null;\n\
        if ((dir > 0) == part.level % 2)\n\
          target = moveInLine(line, part.to, -1, byUnit);\n\
        else\n\
          target = moveInLine(line, part.from, 1, byUnit);\n\
      }\n\
    }\n\
  }\n\
\n\
  function moveLogically(line, start, dir, byUnit) {\n\
    var target = start + dir;\n\
    if (byUnit)\n\
      while (target > 0 && isExtendingChar.test(line.text.charAt(target)))\n\
        target += dir;\n\
    return target < 0 || target > line.text.length ? null : target;\n\
  }\n\
\n\
  // Bidirectional ordering algorithm\n\
  // See http://unicode.org/reports/tr9/tr9-13.html for the algorithm\n\
  // that this (partially) implements.\n\
\n\
  // One-char codes used for character types:\n\
  // L (L):   Left-to-Right\n\
  // R (R):   Right-to-Left\n\
  // r (AL):  Right-to-Left Arabic\n\
  // 1 (EN):  European Number\n\
  // + (ES):  European Number Separator\n\
  // % (ET):  European Number Terminator\n\
  // n (AN):  Arabic Number\n\
  // , (CS):  Common Number Separator\n\
  // m (NSM): Non-Spacing Mark\n\
  // b (BN):  Boundary Neutral\n\
  // s (B):   Paragraph Separator\n\
  // t (S):   Segment Separator\n\
  // w (WS):  Whitespace\n\
  // N (ON):  Other Neutrals\n\
\n\
  // Returns null if characters are ordered as they appear\n\
  // (left-to-right), or an array of sections ({from, to, level}\n\
  // objects) in the order in which they occur visually.\n\
  var bidiOrdering = (function() {\n\
    // Character types for codepoints 0 to 0xff\n\
    var lowTypes =\n\
      \"bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLL\";\n\
    // Character types for codepoints 0x600 to 0x6ff\n\
    var arabicTypes =\n\
      \"rrrrrrrrrrrr,rNNmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmrrrrrrrnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmNmmmmrrrrrrrrrrrrrrrrrr\";\n\
\n\
    function charType(code) {\n\
      if (code <= 0xff) return lowTypes.charAt(code);\n\
      else if (0x590 <= code && code <= 0x5f4) return \"R\";\n\
      else if (0x600 <= code && code <= 0x6ff) return arabicTypes.charAt(\n\
        code - 0x600);\n\
      else if (0x700 <= code && code <= 0x8ac) return \"r\";\n\
      else return \"L\";\n\
    }\n\
\n\
    var bidiRE = /[\\u0590-\\u05f4\\u0600-\\u06ff\\u0700-\\u08ac]/;\n\
    var isNeutral = /[stwN]/,\n\
      isStrong = /[LRr]/,\n\
      countsAsLeft = /[Lb1n]/,\n\
      countsAsNum = /[1n]/;\n\
    // Browsers seem to always treat the boundaries of block elements as being L.\n\
    var outerType = \"L\";\n\
\n\
    return function(str) {\n\
      if (!bidiRE.test(str)) return false;\n\
      var len = str.length,\n\
        types = [];\n\
      for (var i = 0, type; i < len; ++i)\n\
        types.push(type = charType(str.charCodeAt(i)));\n\
\n\
      // W1. Examine each non-spacing mark (NSM) in the level run, and\n\
      // change the type of the NSM to the type of the previous\n\
      // character. If the NSM is at the start of the level run, it will\n\
      // get the type of sor.\n\
      for (var i = 0, prev = outerType; i < len; ++i) {\n\
        var type = types[i];\n\
        if (type == \"m\") types[i] = prev;\n\
        else prev = type;\n\
      }\n\
\n\
      // W2. Search backwards from each instance of a European number\n\
      // until the first strong type (R, L, AL, or sor) is found. If an\n\
      // AL is found, change the type of the European number to Arabic\n\
      // number.\n\
      // W3. Change all ALs to R.\n\
      for (var i = 0, cur = outerType; i < len; ++i) {\n\
        var type = types[i];\n\
        if (type == \"1\" && cur == \"r\") types[i] = \"n\";\n\
        else if (isStrong.test(type)) {\n\
          cur = type;\n\
          if (type == \"r\") types[i] = \"R\";\n\
        }\n\
      }\n\
\n\
      // W4. A single European separator between two European numbers\n\
      // changes to a European number. A single common separator between\n\
      // two numbers of the same type changes to that type.\n\
      for (var i = 1, prev = types[0]; i < len - 1; ++i) {\n\
        var type = types[i];\n\
        if (type == \"+\" && prev == \"1\" && types[i + 1] == \"1\") types[i] =\n\
          \"1\";\n\
        else if (type == \",\" && prev == types[i + 1] &&\n\
          (prev == \"1\" || prev == \"n\")) types[i] = prev;\n\
        prev = type;\n\
      }\n\
\n\
      // W5. A sequence of European terminators adjacent to European\n\
      // numbers changes to all European numbers.\n\
      // W6. Otherwise, separators and terminators change to Other\n\
      // Neutral.\n\
      for (var i = 0; i < len; ++i) {\n\
        var type = types[i];\n\
        if (type == \",\") types[i] = \"N\";\n\
        else if (type == \"%\") {\n\
          for (var end = i + 1; end < len && types[end] == \"%\"; ++end) {}\n\
          var replace = (i && types[i - 1] == \"!\") || (end < len && types[\n\
            end] == \"1\") ? \"1\" : \"N\";\n\
          for (var j = i; j < end; ++j) types[j] = replace;\n\
          i = end - 1;\n\
        }\n\
      }\n\
\n\
      // W7. Search backwards from each instance of a European number\n\
      // until the first strong type (R, L, or sor) is found. If an L is\n\
      // found, then change the type of the European number to L.\n\
      for (var i = 0, cur = outerType; i < len; ++i) {\n\
        var type = types[i];\n\
        if (cur == \"L\" && type == \"1\") types[i] = \"L\";\n\
        else if (isStrong.test(type)) cur = type;\n\
      }\n\
\n\
      // N1. A sequence of neutrals takes the direction of the\n\
      // surrounding strong text if the text on both sides has the same\n\
      // direction. European and Arabic numbers act as if they were R in\n\
      // terms of their influence on neutrals. Start-of-level-run (sor)\n\
      // and end-of-level-run (eor) are used at level run boundaries.\n\
      // N2. Any remaining neutrals take the embedding direction.\n\
      for (var i = 0; i < len; ++i) {\n\
        if (isNeutral.test(types[i])) {\n\
          for (var end = i + 1; end < len && isNeutral.test(types[end]); ++\n\
            end) {}\n\
          var before = (i ? types[i - 1] : outerType) == \"L\";\n\
          var after = (end < len ? types[end] : outerType) == \"L\";\n\
          var replace = before || after ? \"L\" : \"R\";\n\
          for (var j = i; j < end; ++j) types[j] = replace;\n\
          i = end - 1;\n\
        }\n\
      }\n\
\n\
      // Here we depart from the documented algorithm, in order to avoid\n\
      // building up an actual levels array. Since there are only three\n\
      // levels (0, 1, 2) in an implementation that doesn't take\n\
      // explicit embedding into account, we can build up the order on\n\
      // the fly, without following the level-based algorithm.\n\
      var order = [],\n\
        m;\n\
      for (var i = 0; i < len;) {\n\
        if (countsAsLeft.test(types[i])) {\n\
          var start = i;\n\
          for (++i; i < len && countsAsLeft.test(types[i]); ++i) {}\n\
          order.push({\n\
            from: start,\n\
            to: i,\n\
            level: 0\n\
          });\n\
        } else {\n\
          var pos = i,\n\
            at = order.length;\n\
          for (++i; i < len && types[i] != \"L\"; ++i) {}\n\
          for (var j = pos; j < i;) {\n\
            if (countsAsNum.test(types[j])) {\n\
              if (pos < j) order.splice(at, 0, {\n\
                from: pos,\n\
                to: j,\n\
                level: 1\n\
              });\n\
              var nstart = j;\n\
              for (++j; j < i && countsAsNum.test(types[j]); ++j) {}\n\
              order.splice(at, 0, {\n\
                from: nstart,\n\
                to: j,\n\
                level: 2\n\
              });\n\
              pos = j;\n\
            } else ++j;\n\
          }\n\
          if (pos < i) order.splice(at, 0, {\n\
            from: pos,\n\
            to: i,\n\
            level: 1\n\
          });\n\
        }\n\
      }\n\
      if (order[0].level == 1 && (m = str.match(/^\\s+/))) {\n\
        order[0].from = m[0].length;\n\
        order.unshift({\n\
          from: 0,\n\
          to: m[0].length,\n\
          level: 0\n\
        });\n\
      }\n\
      if (lst(order)\n\
        .level == 1 && (m = str.match(/\\s+$/))) {\n\
        lst(order)\n\
          .to -= m[0].length;\n\
        order.push({\n\
          from: len - m[0].length,\n\
          to: len,\n\
          level: 0\n\
        });\n\
      }\n\
      if (order[0].level != lst(order)\n\
        .level)\n\
        order.push({\n\
          from: len,\n\
          to: len,\n\
          level: order[0].level\n\
        });\n\
\n\
      return order;\n\
    };\n\
  })();\n\
\n\
  // THE END\n\
\n\
  CodeMirror.version = \"3.20.1\";\n\
\n\
  return CodeMirror;\n\
})();\n\
//@ sourceURL=codemirror/index.js"
));
require.register("boot/index.js", Function("exports, require, module",
"/**\n\
 * Dependencies\n\
 */\n\
\n\
var CodeMirror = require('codemirror');\n\
var each = require('each');\n\
var select = require('select');\n\
var Sett = require('set');\n\
var Transitive = require('transitive');\n\
\n\
/**\n\
 * Load the data\n\
 */\n\
\n\
get_data(function(Index) {\n\
  var DIRECTION = '0';\n\
  var ROUTE = null;\n\
  var STOPS = new Sett();\n\
\n\
  // handle selects\n\
  var Routes = select()\n\
    .label('Routes');\n\
  var Patterns = select()\n\
    .multiple()\n\
    .label('Patterns');\n\
\n\
  document.getElementById('select-route')\n\
    .appendChild(Routes.el);\n\
  document.getElementById('select-pattern')\n\
    .appendChild(Patterns.el);\n\
\n\
  // transitive instance\n\
  var transitive = new Transitive(document.getElementById('canvas'), Index);\n\
\n\
  // Set up filters\n\
  transitive\n\
    .filter('stops', function(stop) {\n\
      return STOPS.has(stop.stop_id);\n\
    })\n\
    .filter('routes', function(route) {\n\
      return ROUTE.route_id === route.route_id;\n\
    })\n\
    .filter('patterns', function(pattern) {\n\
      return Patterns.values()\n\
        .indexOf(pattern.pattern_id) !== -1;\n\
    });\n\
\n\
  // Direction check box\n\
  var $reverse = document.getElementById('reverse-direction');\n\
\n\
  // on direction change\n\
  $reverse.addEventListener('change', function(event) {\n\
    DIRECTION = event.target.checked ? '1' : '0';\n\
\n\
    // only show appropriate patterns\n\
    updatePatterns(transitive, Patterns, ROUTE, DIRECTION);\n\
    transitive.render();\n\
  });\n\
\n\
  // On route selection change\n\
  Routes.on('select', function(option) {\n\
    localStorage.setItem('selected-route', option.name);\n\
\n\
    ROUTE = getRoute(option.name, Index.routes);\n\
    STOPS = getStopIds(ROUTE);\n\
\n\
    // only show appropriate patterns\n\
    updatePatterns(transitive, Patterns, ROUTE, DIRECTION);\n\
    transitive.render();\n\
  });\n\
\n\
  // add routes\n\
  for (var i in Index.routes) {\n\
    var route = Index.routes[i];\n\
    Routes.add(route.route_id);\n\
  }\n\
\n\
  // Select the first route\n\
  Routes.select(localStorage.getItem('selected-route') || Index.routes[0].route_id\n\
    .toLowerCase());\n\
\n\
  $('form').on('submit', function (event) {\n\
    event.preventDefault();\n\
    var color = $('input[name=\"pattern-stroke\"]').val();\n\
    var width = $('input[name=\"pattern-stroke-width\"]').val();\n\
    transitive.style.load({\n\
      'patterns': {\n\
        'stroke-width': function (display) {\n\
          return width;\n\
        },\n\
        'stroke': function (display) {\n\
          return color;\n\
        }\n\
      }\n\
    });\n\
    transitive.render();\n\
  });\n\
});\n\
\n\
/**\n\
 * Update patterns\n\
 */\n\
\n\
function updatePatterns(transitive, patterns, route, direction) {\n\
  // unbind all events\n\
  patterns.off('change');\n\
  patterns.empty();\n\
\n\
  for (var i in route.patterns) {\n\
    var pattern = route.patterns[i];\n\
    if (pattern.direction_id === direction) {\n\
      patterns.add(pattern.pattern_name + ' ' + pattern.pattern_id, pattern.pattern_id);\n\
      patterns.select(pattern.pattern_name.toLowerCase() + ' ' + pattern.pattern_id);\n\
    }\n\
  }\n\
\n\
  patterns.on('change', function() {\n\
    transitive.render();\n\
  });\n\
}\n\
\n\
// get a route\n\
\n\
function getRoute(id, routes) {\n\
  for (var i in routes) {\n\
    var route = routes[i];\n\
    if (route.route_id.toLowerCase() === id) {\n\
      return route;\n\
    }\n\
  }\n\
}\n\
\n\
// get the stops for a route\n\
\n\
function getStopIds(route) {\n\
  var stop_ids = new Sett();\n\
  for (var i in route.patterns) {\n\
    var pattern = route.patterns[i];\n\
    for (var j in pattern.stops) {\n\
      stop_ids.add(pattern.stops[j].stop_id);\n\
    }\n\
  }\n\
\n\
  return stop_ids;\n\
}\n\
\n\
function get_data(cb) {\n\
  Transitive.d3.json('/styler/data.json', function(err, data) {\n\
    if (err) return window.alert(err);\n\
    else cb(data);\n\
  });\n\
}\n\
//@ sourceURL=boot/index.js"
));







































require.register("yields-select/template.html", Function("exports, require, module",
"module.exports = '<div class=\\'select select-single\\'>\\n\
  <div class=\\'select-box\\'>\\n\
    <input type=\\'text\\' class=\\'select-input\\'>\\n\
  </div>\\n\
  <div class=\\'select-dropdown\\' hidden>\\n\
    <ul class=\\'select-options\\'></ul>\\n\
  </div>\\n\
</div>\\n\
';//@ sourceURL=yields-select/template.html"
));

require.alias("boot/index.js", "undefined/deps/boot/index.js");
require.alias("boot/index.js", "boot/index.js");
require.alias("component-each/index.js", "boot/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-set/index.js", "boot/deps/set/index.js");

require.alias("conveyal-transitive.js/lib/graph/edge.js", "boot/deps/transitive/lib/graph/edge.js");
require.alias("conveyal-transitive.js/lib/graph/index.js", "boot/deps/transitive/lib/graph/index.js");
require.alias("conveyal-transitive.js/lib/graph/vertex.js", "boot/deps/transitive/lib/graph/vertex.js");
require.alias("conveyal-transitive.js/lib/styler/index.js", "boot/deps/transitive/lib/styler/index.js");
require.alias("conveyal-transitive.js/lib/styler/styles.js", "boot/deps/transitive/lib/styler/styles.js");
require.alias("conveyal-transitive.js/lib/display.js", "boot/deps/transitive/lib/display.js");
require.alias("conveyal-transitive.js/lib/pattern.js", "boot/deps/transitive/lib/pattern.js");
require.alias("conveyal-transitive.js/lib/route.js", "boot/deps/transitive/lib/route.js");
require.alias("conveyal-transitive.js/lib/stop.js", "boot/deps/transitive/lib/stop.js");
require.alias("conveyal-transitive.js/lib/transitive.js", "boot/deps/transitive/lib/transitive.js");
require.alias("conveyal-transitive.js/lib/transitive.js", "boot/deps/transitive/index.js");
require.alias("component-emitter/index.js", "conveyal-transitive.js/deps/emitter/index.js");

require.alias("component-to-function/index.js", "conveyal-transitive.js/deps/to-function/index.js");

require.alias("cristiandouce-merge-util/index.js", "conveyal-transitive.js/deps/merge-util/index.js");
require.alias("cristiandouce-merge-util/index.js", "conveyal-transitive.js/deps/merge-util/index.js");
require.alias("component-type/index.js", "cristiandouce-merge-util/deps/type/index.js");

require.alias("cristiandouce-merge-util/index.js", "cristiandouce-merge-util/index.js");
require.alias("mbostock-d3/d3.js", "conveyal-transitive.js/deps/d3/d3.js");
require.alias("mbostock-d3/index-browserify.js", "conveyal-transitive.js/deps/d3/index-browserify.js");
require.alias("mbostock-d3/index-browserify.js", "conveyal-transitive.js/deps/d3/index.js");
require.alias("mbostock-d3/index-browserify.js", "mbostock-d3/index.js");
require.alias("trevorgerhardt-stylesheet/index.js", "conveyal-transitive.js/deps/stylesheet/index.js");
require.alias("trevorgerhardt-stylesheet/index.js", "conveyal-transitive.js/deps/stylesheet/index.js");
require.alias("cristiandouce-merge-util/index.js", "trevorgerhardt-stylesheet/deps/merge-util/index.js");
require.alias("cristiandouce-merge-util/index.js", "trevorgerhardt-stylesheet/deps/merge-util/index.js");
require.alias("component-type/index.js", "cristiandouce-merge-util/deps/type/index.js");

require.alias("cristiandouce-merge-util/index.js", "cristiandouce-merge-util/index.js");
require.alias("trevorgerhardt-stylesheet/index.js", "trevorgerhardt-stylesheet/index.js");
require.alias("visionmedia-debug/index.js", "conveyal-transitive.js/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "conveyal-transitive.js/deps/debug/debug.js");

require.alias("yields-svg-attributes/index.js", "conveyal-transitive.js/deps/svg-attributes/index.js");
require.alias("yields-svg-attributes/index.js", "conveyal-transitive.js/deps/svg-attributes/index.js");
require.alias("yields-svg-attributes/index.js", "yields-svg-attributes/index.js");
require.alias("conveyal-transitive.js/lib/transitive.js", "conveyal-transitive.js/index.js");
require.alias("yields-select/index.js", "boot/deps/select/index.js");
require.alias("yields-select/index.js", "boot/deps/select/index.js");
require.alias("ianstormtaylor-previous-sibling/index.js", "yields-select/deps/previous-sibling/index.js");
require.alias("yields-traverse/index.js", "ianstormtaylor-previous-sibling/deps/traverse/index.js");
require.alias("yields-traverse/index.js", "ianstormtaylor-previous-sibling/deps/traverse/index.js");
require.alias("component-matches-selector/index.js", "yields-traverse/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("yields-traverse/index.js", "yields-traverse/index.js");
require.alias("ianstormtaylor-next-sibling/index.js", "yields-select/deps/next-sibling/index.js");
require.alias("yields-traverse/index.js", "ianstormtaylor-next-sibling/deps/traverse/index.js");
require.alias("yields-traverse/index.js", "ianstormtaylor-next-sibling/deps/traverse/index.js");
require.alias("component-matches-selector/index.js", "yields-traverse/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("yields-traverse/index.js", "yields-traverse/index.js");
require.alias("component-debounce/index.js", "yields-select/deps/debounce/index.js");
require.alias("component-debounce/index.js", "yields-select/deps/debounce/index.js");
require.alias("component-debounce/index.js", "component-debounce/index.js");
require.alias("component-pillbox/index.js", "yields-select/deps/pillbox/index.js");
require.alias("component-events/index.js", "component-pillbox/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-delegate/index.js", "component-events/deps/delegate/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "discore-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("discore-closest/index.js", "discore-closest/index.js");
require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("component-keyname/index.js", "component-pillbox/deps/keyname/index.js");

require.alias("component-emitter/index.js", "component-pillbox/deps/emitter/index.js");

require.alias("component-each/index.js", "component-pillbox/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-set/index.js", "component-pillbox/deps/set/index.js");

require.alias("component-emitter/index.js", "yields-select/deps/emitter/index.js");

require.alias("component-keyname/index.js", "yields-select/deps/keyname/index.js");

require.alias("component-classes/index.js", "yields-select/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-events/index.js", "yields-select/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-delegate/index.js", "component-events/deps/delegate/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "discore-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("discore-closest/index.js", "discore-closest/index.js");
require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("component-domify/index.js", "yields-select/deps/domify/index.js");

require.alias("component-query/index.js", "yields-select/deps/query/index.js");

require.alias("component-each/index.js", "yields-select/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("yields-select/index.js", "yields-select/index.js");
require.alias("codemirror/index.js", "boot/deps/codemirror/index.js");
