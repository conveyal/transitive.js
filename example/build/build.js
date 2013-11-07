
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
require.register("component-indexof/index.js", Function("exports, require, module",
"module.exports = function(arr, obj){\n\
  if (arr.indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var index = require('indexof');\n\
\n\
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
  fn._off = on;\n\
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
  var i = index(callbacks, fn._off || fn);\n\
  if (~i) callbacks.splice(i, 1);\n\
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
    version: \"3.3.9\"\n\
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
        if ((node = group[i]) && filter.call(node, node.__data__, i)) {\n\
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
      var xhr = d3.xhr(url, mimeType, callback);\n\
      xhr.row = function(_) {\n\
        return arguments.length ? xhr.response((row = _) == null ? response : typedResponse(_)) : row;\n\
      };\n\
      return xhr.row(row);\n\
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
        var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = Math.sqrt(a * a + b * b + c * c), φ2 = Math.asin(c /= m), λ2 = abs(abs(c) - 1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a), p = project(λ2, φ2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;\n\
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
        if ((node = group[i]) && filter.call(node, node.__data__, i)) {\n\
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
          var dx = scale1.rangeBand() / 2, x = function(d) {\n\
            return scale1(d) + dx;\n\
          };\n\
          tickEnter.call(tickTransform, x);\n\
          tickUpdate.call(tickTransform, x);\n\
        } else {\n\
          tickEnter.call(tickTransform, scale0);\n\
          tickUpdate.call(tickTransform, scale1);\n\
          tickExit.call(tickTransform, scale1);\n\
        }\n\
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
"\n\
/**\n\
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
  var self = this\n\
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
  element = checkYoSelf ? element : element.parentNode\n\
  root = root || document\n\
\n\
  do {\n\
    if (matches(element, selector))\n\
      return element\n\
    // After `matches` on the edge case that\n\
    // the selector matches the root\n\
    // (when the root is not the document)\n\
    if (element === root)\n\
      return\n\
    // Make sure `element !== document`\n\
    // otherwise we get an illegal invocation\n\
  } while ((element = element.parentNode) && element !== document)\n\
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
  if (!m) throw new Error('No elements were generated.');\n\
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
  var els = el.children;\n\
  if (1 == els.length) {\n\
    return el.removeChild(els[0]);\n\
  }\n\
\n\
  var fragment = document.createDocumentFragment();\n\
  while (els.length) {\n\
    fragment.appendChild(el.removeChild(els[0]));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("component-query/index.js", Function("exports, require, module",
"\n\
function one(selector, el) {\n\
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
};\n\
//@ sourceURL=component-query/index.js"
));
require.register("yields-select/index.js", Function("exports, require, module",
"\n\
/**\n\
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
  var multi = this._multiple\n\
    , visible = this.visible()\n\
    , active = this.active\n\
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
  obj.value = obj.value || obj.name;\n\
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
require.register("transitive/lib/graph/edge.js", Function("exports, require, module",
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
\n\
/**\n\
 *  Add a pattern to the edge\n\
 */\n\
\n\
Edge.prototype.addPattern = function(pattern) {\n\
  if(this.patterns.indexOf(pattern) === -1) this.patterns.push(pattern);\n\
};\n\
\n\
\n\
/**\n\
 *  Gets the vertex opposite another vertex on an edge\n\
 */\n\
\n\
Edge.prototype.oppositeVertex = function(vertex) {\n\
  if(vertex === this.toVertex) return this.fromVertex;\n\
  if(vertex === this.fromVertex) return this.toVertex;\n\
  return null;\n\
};\n\
\n\
\n\
/**\n\
 *  \n\
 */\n\
\n\
Edge.prototype.setStopLabelPosition = function(pos, skip) {\n\
  if(this.fromVertex.stop !== skip) this.fromVertex.stop.labelPosition = pos;\n\
  if(this.toVertex.stop !== skip) this.toVertex.stop.labelPosition = pos;\n\
\n\
  this.stopArray.forEach(function(stop) {\n\
    if(stop !== skip) stop.labelPosition = pos;\n\
  });\n\
};\n\
\n\
\n\
/**\n\
 *\n\
 */\n\
\n\
Edge.prototype.toString = function() {\n\
  return this.fromVertex.stop.getId() + '_' + this.toVertex.stop.getId();\n\
};\n\
//@ sourceURL=transitive/lib/graph/edge.js"
));
require.register("transitive/lib/graph/index.js", Function("exports, require, module",
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
//@ sourceURL=transitive/lib/graph/index.js"
));
require.register("transitive/lib/graph/vertex.js", Function("exports, require, module",
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
 * @param {}\n\
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
};//@ sourceURL=transitive/lib/graph/vertex.js"
));
require.register("transitive/lib/styler/index.js", Function("exports, require, module",
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
  if (styles) this.load(styles);\n\
}\n\
\n\
/**\n\
 * Add the predefined styles\n\
 */\n\
\n\
types.forEach(function (type) {\n\
  Styler.prototype[type] = styles[type];\n\
});\n\
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
  });\n\
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
    pattern.selectAll('.transitive-line'),\n\
    this.patterns\n\
  );\n\
};\n\
\n\
/**\n\
 * Render elements against these rules\n\
 *\n\
 * @param {Display} a D3 list of elements\n\
 * @param {Pattern} the transitive object\n\
 */\n\
\n\
Styler.prototype.renderStop = function(display, pattern) {\n\
  applyAttrAndStyle(\n\
    display,\n\
    pattern.selectAll('.transitive-stop-circle'),\n\
    this.stops\n\
  );\n\
\n\
  applyAttrAndStyle(\n\
    display,\n\
    pattern.selectAll('.transitive-stop-label'),\n\
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
//@ sourceURL=transitive/lib/styler/index.js"
));
require.register("transitive/lib/styler/styles.js", Function("exports, require, module",
"\n\
//\n\
\n\
var zoom_min = 0.25, zoom_max = 4, zoom_mid = 1;\n\
function pixels(current_z, min, normal, max) {\n\
  if (current_z === zoom_mid) return normal;\n\
  if (current_z < zoom_mid) return min + (current_z - zoom_min) / (zoom_mid - zoom_min) * (normal - min);\n\
  return normal + (current_z - zoom_mid) / (zoom_max - zoom_mid) * (max - normal);\n\
}\n\
\n\
/**\n\
 * Default stop rules\n\
 */\n\
\n\
exports.stops = {\n\
  cx: 0,\n\
  cy: 0,\n\
  fill: 'white',\n\
  r: function (display) {\n\
    return pixels(display.zoom.scale(), 2, 4, 6.5);\n\
  },\n\
  stroke: '#333',\n\
  'stroke-width': function (display, data) {\n\
    return pixels(display.zoom.scale(), 0.0416, 0.0833, 0.125) + 'em';\n\
  }\n\
};\n\
\n\
/**\n\
 * Default label rules\n\
 */\n\
\n\
exports.labels = {\n\
  color: '#333',\n\
  'font-family': '\\'Lato\\', sans-serif',\n\
  'font-size': function(display) {\n\
    return pixels(display.zoom.scale(), 1, 1.2, 1.4) + 'em';\n\
  },\n\
  /*transform: function (display) {\n\
    return 'rotate(-45,' + this.x + ',' + this.y(display).substr(0, 2) + ')';\n\
  },*/\n\
  visibility: function (display, data) {\n\
    if (display.zoom.scale() < 0.75) return 'hidden';\n\
    return 'visible';\n\
  },\n\
  /*x: 0,\n\
  y: function (display) {\n\
    return -pixels(display.zoom.scale(), 1, 1.2, 1.4) + 'em';\n\
  }*/\n\
};\n\
\n\
/**\n\
 * All patterns\n\
 */\n\
\n\
exports.patterns = {\n\
  stroke: function (display, data) {\n\
    if (data.route.route_color) {\n\
      return '#' + data.route.route_color;\n\
    } else {\n\
      return 'grey';\n\
    }\n\
  },\n\
  'stroke-dasharray': function (display, data) {\n\
    if (data.frequency.average > 12) return false;\n\
    if (data.frequency.average > 6) return '1em, 1em';\n\
    return '1em, 0.166em';\n\
  },\n\
  'stroke-width': function (display) {\n\
    return pixels(display.zoom.scale(), 0.416, 1, 1.45) + 'em';\n\
  },\n\
  fill: function (display, data, index) {\n\
    return 'none';\n\
  }\n\
};\n\
//@ sourceURL=transitive/lib/styler/styles.js"
));
require.register("transitive/lib/display.js", Function("exports, require, module",
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
  this.svg.selectAll('g').remove();\n\
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
}//@ sourceURL=transitive/lib/display.js"
));
require.register("transitive/lib/pattern.js", Function("exports, require, module",
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
 *  A Route Pattern -- a unique sequence of stops\n\
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
  this.lineWidth = 15;\n\
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
  // create the pattern as an empty svg group\n\
  this.svgGroup = display.svg.append('g');\n\
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
  this.lineGraph = this.svgGroup.append('path')\n\
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
  this.lineWidth = parseFloat(lw.substring(0, lw.length - 2), 10) * 16;\n\
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
      if(edgeInfo.offset) {\n\
        stopInfo.offsetX = edge.rightVector.x * this.lineWidth * edgeInfo.offset;\n\
        stopInfo.offsetY = edge.rightVector.y * this.lineWidth * edgeInfo.offset;\n\
      }\n\
      else {\n\
        stopInfo.offsetX = stopInfo.offsetY = 0;\n\
      }\n\
      if(edgeInfo.bundleIndex === 0) stopInfo.showLabel = true;\n\
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
\n\
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
};//@ sourceURL=transitive/lib/pattern.js"
));
require.register("transitive/lib/route.js", Function("exports, require, module",
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
//@ sourceURL=transitive/lib/route.js"
));
require.register("transitive/lib/stop.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Stop`\n\
 */\n\
\n\
module.exports = Stop;\n\
\n\
/**\n\
 * A transit Stop, as defined in the input data.\n\
 * Stops are shared between Patterns.\n\
 *\n\
 * @param {Object}\n\
 */\n\
\n\
function Stop(data) {\n\
  for (var key in data) {\n\
    if (key === 'patterns') continue;\n\
    this[key] = data[key];\n\
  }\n\
\n\
  this.patterns = [];\n\
\n\
  this.renderData = [];\n\
\n\
  this.labelAnchor = null;\n\
  this.labelAngle = -45;\n\
  this.labelOffsetX = function() { return  0; };\n\
  this.labelOffsetY = function() { return  0; };\n\
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
Stop.prototype.addRenderData = function(stopInfo) {\n\
  this.renderData.push(stopInfo);\n\
\n\
  // check if this is the 'topmost' stopInfo item received (based on offsets) for labeling purposes\n\
  if(!this.topAnchor) this.topAnchor = stopInfo;\n\
  else {\n\
    if(stopInfo.offsetY > this.topAnchor.offsetY) {\n\
      this.topAnchor = stopInfo;\n\
    }\n\
  }\n\
\n\
  // check if this is the 'bottommost' stopInfo iterm received\n\
  if(!this.bottomAnchor) this.bottomAnchor = stopInfo;\n\
  else {\n\
    if(stopInfo.offsetY < this.bottomAnchor.offsetY) {\n\
      this.bottomAnchor = stopInfo;\n\
    }\n\
  }\n\
\n\
  //console.log(stopInfo);\n\
};\n\
\n\
\n\
Stop.prototype.draw = function(display) {\n\
  if(this.renderData.length === 0) return;\n\
\n\
  // set up the main svg group for this stop\n\
  this.svgGroup = display.svg.append('g');\n\
\n\
  // set up the pattern-level markers\n\
  this.patternMarkers = this.svgGroup.selectAll('.transitive-stop')\n\
    .data(this.renderData)\n\
    .enter()\n\
    .append('g');\n\
\n\
  this.patternMarkers.append('circle')\n\
    .attr('class', 'transitive-stop-circle');\n\
\n\
\n\
  // set up a group for the stop-level labels\n\
  this.labels = this.svgGroup.append('g');\n\
\n\
  // create the main stop label\n\
  this.mainLabel = this.labels.append('text')\n\
    .attr('id', 'transitive-stop-label-' + this.getId())\n\
    .text(this.stop_name)\n\
    .attr('class', 'transitive-stop-label');\n\
\n\
  if(this.labelPosition > 0) { // the 'above' position\n\
    this.mainLabel.attr('text-anchor', 'start');\n\
    this.labelAnchor = this.topAnchor;\n\
    this.labelOffsetY = function(lineWidth) { return 0.7 * lineWidth; };\n\
  }\n\
  else { // the 'below' position\n\
    this.mainLabel.attr('text-anchor', 'end');\n\
    this.labelAnchor = this.bottomAnchor;\n\
    this.labelOffsetX = function(lineWidth) { return 0.4 * lineWidth; };\n\
    this.labelOffsetY = function(lineWidth) { return -lineWidth; };\n\
  }\n\
\n\
};\n\
\n\
\n\
Stop.prototype.refresh = function(display) {\n\
  if(this.renderData.length === 0) return;\n\
\n\
  // refresh the pattern-level markers\n\
  this.patternMarkers.data(this.renderData);\n\
  this.patternMarkers.attr('transform', function (d, i) {\n\
    var x = display.xScale(d.x) + d.offsetX;\n\
    var y = display.yScale(d.y) - d.offsetY ;\n\
    return 'translate(' + x +', ' + y +')';\n\
  });\n\
\n\
  // refresh the stop-level labels\n\
  this.labels.attr('transform', (function (d, i) {\n\
    var la = this.labelAnchor;\n\
    var x = display.xScale(la.x) + la.offsetX + this.labelOffsetX(la.pattern.lineWidth);\n\
    var y = display.yScale(la.y) - la.offsetY - this.labelOffsetY(la.pattern.lineWidth);\n\
    return 'translate(' + x +', ' + y +')';\n\
  }).bind(this));\n\
\n\
  this.mainLabel.attr('transform', (function (d, i) {\n\
    return 'rotate(' + this.labelAngle + ',0,0)';\n\
  }).bind(this));\n\
\n\
};\n\
//@ sourceURL=transitive/lib/stop.js"
));
require.register("transitive/lib/transitive.js", Function("exports, require, module",
"\n\
/**\n\
 * Dependencies\n\
 */\n\
\n\
var d3 = require('d3');\n\
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
 * Main object\n\
 */\n\
\n\
function Transitive(el, data, styles) {\n\
  if (!(this instanceof Transitive)) {\n\
    return new Transitive(el, data, styles);\n\
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
 * Add a filter\n\
 *\n\
 * @param {String|Object|Function} filter\n\
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
 * Clear all filters\n\
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
  return this;\n\
};\n\
\n\
/**\n\
 * Load\n\
 */\n\
\n\
Transitive.prototype.load = function(data) {\n\
  this.graph = new Graph();\n\
\n\
  this.stops = generateStops(applyFilters(data.stops, this._filter.stops));\n\
\n\
  this.routes = {};\n\
  this.patterns = {};\n\
\n\
  // A list of stops that will become vertices in the network graph.\n\
  // This includes all stops that serve as a pattern endpoint and/or\n\
  // a convergence/divergence point between patterns\n\
  var vertexStops = {};\n\
\n\
  // object maps stop ids to arrays of unique stop_ids reachable from that stop\n\
  var adjacentStops = {};\n\
\n\
  applyFilters(data.routes, this._filter.routes).forEach(function (routeData) {\n\
    // set up the Route object\n\
    var route = new Route(routeData);\n\
    this.routes[route.route_id] = route;\n\
\n\
    // iterate through the Route's constituent Patterns\n\
    applyFilters(routeData.patterns, this._filter.patterns).forEach(function (patternData, i) {\n\
      // set up the Pattern object\n\
      var pattern = new Pattern(patternData);\n\
      this.patterns[patternData.pattern_id] = pattern;\n\
      route.addPattern(pattern);\n\
\n\
      // iterate through this pattern's stops, associating stops/patterns with each other\n\
      // and initializing the adjacentStops table\n\
      var previousStop = null;\n\
      patternData.stops.forEach(function (stopInfo) {\n\
        var stop = this.stops[stopInfo.stop_id];\n\
        //console.log(' - '+stop.getId()+' / ' + stop.stop_name);\n\
\n\
        pattern.stops.push(stop);\n\
        stop.patterns.push(pattern);\n\
\n\
        if(previousStop) { // this block called for each pair of adjacent stops in pattern\n\
          addStopAdjacency(adjacentStops, stop, previousStop);\n\
          addStopAdjacency(adjacentStops, previousStop, stop);\n\
        }\n\
        previousStop = stop;\n\
      }, this);\n\
\n\
      // add the start and end stops to the vertexStops collection\n\
      var firstStop = pattern.stops[0];\n\
      if(!(firstStop.getId() in vertexStops)) {\n\
        vertexStops[firstStop.getId()] = firstStop;\n\
      }\n\
\n\
      var lastStop = pattern.stops[pattern.stops.length-1];\n\
      if(!(lastStop.getId() in vertexStops)) {\n\
        vertexStops[lastStop.getId()] = lastStop;\n\
      }\n\
    }, this);\n\
  }, this);\n\
\n\
  //console.log('adj stops:');\n\
  //console.log(adjacentStops);\n\
\n\
  // determine the convergence/divergence vertex stops by looking for stops w/ >2 adjacent stops\n\
  for(var stopId in adjacentStops) {\n\
    if(adjacentStops[stopId].length > 2) {\n\
      vertexStops[stopId] = this.stops[stopId];\n\
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
  this.emit('loaded', this);\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Helper function for stopAjacency table\n\
 */\n\
\n\
function addStopAdjacency(adjacentStops, stopA, stopB) {\n\
  if (!adjacentStops[stopA.getId()]) {\n\
    adjacentStops[stopA.getId()] = [];\n\
  }\n\
\n\
  if (adjacentStops[stopA.getId()].indexOf(stopB.getId()) === -1) {\n\
    adjacentStops[stopA.getId()].push(stopB.getId());\n\
  }\n\
}\n\
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
  // initialize the stop svg elements\n\
  for (key in this.stops) {\n\
    this.stops[key].draw(this.display);\n\
  }\n\
\n\
  this.refresh();\n\
\n\
  this.emit('rendered', this);\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Render to\n\
 */\n\
\n\
Transitive.prototype.renderTo = function(el) {\n\
  this.setElement(el);\n\
  this.render();\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Refresh\n\
 */\n\
\n\
Transitive.prototype.refresh = function() {\n\
  // clear the stop render data\n\
  for (var key in this.stops) {\n\
    this.stops[key].renderData = [];\n\
  }\n\
\n\
  // refresh the patterns\n\
  for (key in this.patterns) {\n\
    var pattern = this.patterns[key];\n\
    pattern.refreshRenderData(); // also updates the stop-level renderData\n\
\n\
    this.style.renderPattern(this.display, pattern.svgGroup);\n\
    pattern.refresh(this.display, this.style);\n\
  }\n\
\n\
  // refresh the stops\n\
  for (key in this.stops) {\n\
    var stop = this.stops[key];\n\
    if(!stop.svgGroup) continue; // check if this stop is not currently rendered\n\
\n\
    this.style.renderStop(this.display, stop.svgGroup);\n\
    stop.refresh(this.display);\n\
  }\n\
\n\
  this.emit('refreshed', this);\n\
\n\
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
};\n\
\n\
\n\
/**\n\
 * Place the stop text labels, minimizing overlap\n\
 */\n\
\n\
Transitive.prototype.placeStopLabels = function() {\n\
\n\
\n\
  // determine the y-range of each pattern\n\
  // refresh the patterns\n\
\n\
  for (var key in this.patterns) {\n\
    var minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;\n\
    var pattern = this.patterns[key];\n\
    var vertices = pattern.vertexArray();\n\
    console.log(vertices);\n\
    //vertices.forEach(function(vertex) {\n\
    for(var i = 0; i < vertices.length; i++) {\n\
      var vertex = vertices[i];\n\
      minY = Math.min(minY, vertex.y);\n\
      maxY = Math.max(maxY, vertex.y);\n\
    }\n\
\n\
    console.log('p yr: '+minY + ' to '+maxY);\n\
  }\n\
\n\
  //\n\
  for (key in this.stops) {\n\
    var stop = this.stops[key];\n\
    if(stop.patterns.length === 0) continue; // check if this stop is not currently displayed\n\
\n\
  }\n\
\n\
};\n\
\n\
\n\
/**\n\
 * Generate Stops\n\
 */\n\
\n\
function generateStops(data) {\n\
  var stops = {};\n\
\n\
  data.forEach(function (stop) {\n\
    stops[stop.stop_id] = new Stop(stop);\n\
  });\n\
\n\
  return stops;\n\
}\n\
\n\
/**\n\
 * Populate the graph edges\n\
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
//@ sourceURL=transitive/lib/transitive.js"
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
require.alias("component-emitter/index.js", "transitive/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-to-function/index.js", "transitive/deps/to-function/index.js");
require.alias("component-to-function/index.js", "to-function/index.js");

require.alias("cristiandouce-merge-util/index.js", "transitive/deps/merge-util/index.js");
require.alias("cristiandouce-merge-util/index.js", "transitive/deps/merge-util/index.js");
require.alias("cristiandouce-merge-util/index.js", "merge-util/index.js");
require.alias("component-type/index.js", "cristiandouce-merge-util/deps/type/index.js");

require.alias("cristiandouce-merge-util/index.js", "cristiandouce-merge-util/index.js");
require.alias("mbostock-d3/d3.js", "transitive/deps/d3/d3.js");
require.alias("mbostock-d3/index-browserify.js", "transitive/deps/d3/index-browserify.js");
require.alias("mbostock-d3/index-browserify.js", "transitive/deps/d3/index.js");
require.alias("mbostock-d3/index-browserify.js", "d3/index.js");
require.alias("mbostock-d3/index-browserify.js", "mbostock-d3/index.js");
require.alias("trevorgerhardt-stylesheet/index.js", "transitive/deps/stylesheet/index.js");
require.alias("trevorgerhardt-stylesheet/index.js", "transitive/deps/stylesheet/index.js");
require.alias("trevorgerhardt-stylesheet/index.js", "stylesheet/index.js");
require.alias("cristiandouce-merge-util/index.js", "trevorgerhardt-stylesheet/deps/merge-util/index.js");
require.alias("cristiandouce-merge-util/index.js", "trevorgerhardt-stylesheet/deps/merge-util/index.js");
require.alias("component-type/index.js", "cristiandouce-merge-util/deps/type/index.js");

require.alias("cristiandouce-merge-util/index.js", "cristiandouce-merge-util/index.js");
require.alias("trevorgerhardt-stylesheet/index.js", "trevorgerhardt-stylesheet/index.js");
require.alias("yields-svg-attributes/index.js", "transitive/deps/svg-attributes/index.js");
require.alias("yields-svg-attributes/index.js", "transitive/deps/svg-attributes/index.js");
require.alias("yields-svg-attributes/index.js", "svg-attributes/index.js");
require.alias("yields-svg-attributes/index.js", "yields-svg-attributes/index.js");
require.alias("component-each/index.js", "transitive/deps/each/index.js");
require.alias("component-each/index.js", "each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-set/index.js", "transitive/deps/set/index.js");
require.alias("component-set/index.js", "set/index.js");

require.alias("yields-select/index.js", "transitive/deps/select/index.js");
require.alias("yields-select/index.js", "transitive/deps/select/index.js");
require.alias("yields-select/index.js", "select/index.js");
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
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-each/index.js", "component-pillbox/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-set/index.js", "component-pillbox/deps/set/index.js");

require.alias("component-emitter/index.js", "yields-select/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

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
require.alias("transitive/lib/transitive.js", "transitive/index.js");