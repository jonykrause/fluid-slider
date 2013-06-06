
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
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
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
  var index = path + '/index.js';

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
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
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
require.register("component-event/index.js", Function("exports, require, module",
"\n/**\n * Bind `el` event `type` to `fn`.\n *\n * @param {Element} el\n * @param {String} type\n * @param {Function} fn\n * @param {Boolean} capture\n * @return {Function}\n * @api public\n */\n\nexports.bind = function(el, type, fn, capture){\n  if (el.addEventListener) {\n    el.addEventListener(type, fn, capture || false);\n  } else {\n    el.attachEvent('on' + type, fn);\n  }\n  return fn;\n};\n\n/**\n * Unbind `el` event `type`'s callback `fn`.\n *\n * @param {Element} el\n * @param {String} type\n * @param {Function} fn\n * @param {Boolean} capture\n * @return {Function}\n * @api public\n */\n\nexports.unbind = function(el, type, fn, capture){\n  if (el.removeEventListener) {\n    el.removeEventListener(type, fn, capture || false);\n  } else {\n    el.detachEvent('on' + type, fn);\n  }\n  return fn;\n};\n//@ sourceURL=component-event/index.js"
));
require.register("component-event-manager/index.js", Function("exports, require, module",
"\n\n/**\n * Expose `EventManager`.\n */\n\nmodule.exports = EventManager;\n\n/**\n * Initialize an `EventManager` with the given\n * `target` object which events will be bound to,\n * and the `obj` which will receive method calls.\n *\n * @param {Object} target\n * @param {Object} obj\n * @api public\n */\n\nfunction EventManager(target, obj) {\n  this.target = target;\n  this.obj = obj;\n  this._bindings = {};\n}\n\n/**\n * Register bind function.\n *\n * @param {Function} fn\n * @return {EventManager} self\n * @api public\n */\n\nEventManager.prototype.onbind = function(fn){\n  this._bind = fn;\n  return this;\n};\n\n/**\n * Register unbind function.\n *\n * @param {Function} fn\n * @return {EventManager} self\n * @api public\n */\n\nEventManager.prototype.onunbind = function(fn){\n  this._unbind = fn;\n  return this;\n};\n\n/**\n * Bind to `event` with optional `method` name.\n * When `method` is undefined it becomes `event`\n * with the \"on\" prefix.\n *\n *    events.bind('login') // implies \"onlogin\"\n *    events.bind('login', 'onLogin')\n *\n * @param {String} event\n * @param {String} [method]\n * @return {Function} callback\n * @api public\n */\n\nEventManager.prototype.bind = function(event, method){\n  var fn = this.addBinding.apply(this, arguments);\n  if (this._onbind) this._onbind(event, method, fn);\n  this._bind(event, fn);\n  return fn;\n};\n\n/**\n * Add event binding.\n *\n * @param {String} event\n * @param {String} method\n * @return {Function} callback\n * @api private\n */\n\nEventManager.prototype.addBinding = function(event, method){\n  var obj = this.obj;\n  var method = method || 'on' + event;\n  var args = [].slice.call(arguments, 2);\n\n  // callback\n  function callback() {\n    var a = [].slice.call(arguments).concat(args);\n    obj[method].apply(obj, a);\n  }\n\n  // subscription\n  this._bindings[event] = this._bindings[event] || {};\n  this._bindings[event][method] = callback;\n\n  return callback;\n};\n\n/**\n * Unbind a single binding, all bindings for `event`,\n * or all bindings within the manager.\n *\n *     evennts.unbind('login', 'onLogin')\n *     evennts.unbind('login')\n *     evennts.unbind()\n *\n * @param {String} [event]\n * @param {String} [method]\n * @return {Function} callback\n * @api public\n */\n\nEventManager.prototype.unbind = function(event, method){\n  if (0 == arguments.length) return this.unbindAll();\n  if (1 == arguments.length) return this.unbindAllOf(event);\n  var fn = this._bindings[event][method];\n  if (this._onunbind) this._onunbind(event, method, fn);\n  this._unbind(event, fn);\n  return fn;\n};\n\n/**\n * Unbind all events.\n *\n * @api private\n */\n\nEventManager.prototype.unbindAll = function(){\n  for (var event in this._bindings) {\n    this.unbindAllOf(event);\n  }\n};\n\n/**\n * Unbind all events for `event`.\n *\n * @param {String} event\n * @api private\n */\n\nEventManager.prototype.unbindAllOf = function(event){\n  var bindings = this._bindings[event];\n  if (!bindings) return;\n  for (var method in bindings) {\n    this.unbind(event, method);\n  }\n};\n//@ sourceURL=component-event-manager/index.js"
));
require.register("component-events/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar Manager = require('event-manager')\n  , event = require('event');\n\n/**\n * Return a new event manager.\n */\n\nmodule.exports = function(target, obj){\n  var manager = new Manager(target, obj);\n\n  manager.onbind(function(name, fn){\n    event.bind(target, name, fn);\n  });\n\n  manager.onunbind(function(name, fn){\n    event.unbind(target, name, fn);\n  });\n\n  return manager;\n};\n//@ sourceURL=component-events/index.js"
));
require.register("component-has-translate3d/index.js", Function("exports, require, module",
"\nvar prop = require('transform-property');\n// IE8<= doesn't have `getComputedStyle`\nif (!prop || !window.getComputedStyle) return module.exports = false;\n\nvar map = {\n  webkitTransform: '-webkit-transform',\n  OTransform: '-o-transform',\n  msTransform: '-ms-transform',\n  MozTransform: '-moz-transform',\n  transform: 'transform'\n};\n\n// from: https://gist.github.com/lorenzopolidori/3794226\nvar el = document.createElement('div');\nel.style[prop] = 'translate3d(1px,1px,1px)';\ndocument.body.insertBefore(el, null);\nvar val = getComputedStyle(el).getPropertyValue(map[prop]);\ndocument.body.removeChild(el);\nmodule.exports = null != val && val.length && 'none' != val;\n//@ sourceURL=component-has-translate3d/index.js"
));
require.register("component-transform-property/index.js", Function("exports, require, module",
"\nvar styles = [\n  'webkitTransform',\n  'MozTransform',\n  'msTransform',\n  'OTransform',\n  'transform'\n];\n\nvar el = document.createElement('p');\nvar style;\n\nfor (var i = 0; i < styles.length; i++) {\n  style = styles[i];\n  if (null != el.style[style]) {\n    module.exports = style;\n    break;\n  }\n}\n//@ sourceURL=component-transform-property/index.js"
));
require.register("jonykrause-translate/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar transform = require('transform-property');\nvar has3d = require('has-translate3d');\n\n/**\n * Expose `translate`.\n */\n\nmodule.exports = translate;\n\n/**\n * Translate `el` by `(x, y) units`.\n *\n * @param {Element} el\n * @param {Number} x\n * @param {Number} y\n * @param {String} unit\n * @api public\n */\n\nfunction translate(el, x, y, unit) {\n  unit || (unit = 'px');\n  if (typeof transform === 'string') {\n    if (has3d) {\n      el.style[transform] = 'translate3d(' + x + unit + ',' + y + unit + ', 0)';\n    } else {\n      el.style[transform] = 'translate(' + x + unit + ',' + y + unit + ')';\n    }\n  } else {\n    el.style.left = x;\n    el.style.top = y;\n  }\n};\n\n//@ sourceURL=jonykrause-translate/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n/**\n * Expose `Emitter`.\n */\n\nmodule.exports = Emitter;\n\n/**\n * Initialize a new `Emitter`.\n *\n * @api public\n */\n\nfunction Emitter(obj) {\n  if (obj) return mixin(obj);\n};\n\n/**\n * Mixin the emitter properties.\n *\n * @param {Object} obj\n * @return {Object}\n * @api private\n */\n\nfunction mixin(obj) {\n  for (var key in Emitter.prototype) {\n    obj[key] = Emitter.prototype[key];\n  }\n  return obj;\n}\n\n/**\n * Listen on the given `event` with `fn`.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.on = function(event, fn){\n  this._callbacks = this._callbacks || {};\n  (this._callbacks[event] = this._callbacks[event] || [])\n    .push(fn);\n  return this;\n};\n\n/**\n * Adds an `event` listener that will be invoked a single\n * time then automatically removed.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.once = function(event, fn){\n  var self = this;\n  this._callbacks = this._callbacks || {};\n\n  function on() {\n    self.off(event, on);\n    fn.apply(this, arguments);\n  }\n\n  fn._off = on;\n  this.on(event, on);\n  return this;\n};\n\n/**\n * Remove the given callback for `event` or all\n * registered callbacks.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.off =\nEmitter.prototype.removeListener =\nEmitter.prototype.removeAllListeners = function(event, fn){\n  this._callbacks = this._callbacks || {};\n\n  // all\n  if (0 == arguments.length) {\n    this._callbacks = {};\n    return this;\n  }\n\n  // specific event\n  var callbacks = this._callbacks[event];\n  if (!callbacks) return this;\n\n  // remove all handlers\n  if (1 == arguments.length) {\n    delete this._callbacks[event];\n    return this;\n  }\n\n  // remove specific handler\n  var i = callbacks.indexOf(fn._off || fn);\n  if (~i) callbacks.splice(i, 1);\n  return this;\n};\n\n/**\n * Emit `event` with the given args.\n *\n * @param {String} event\n * @param {Mixed} ...\n * @return {Emitter}\n */\n\nEmitter.prototype.emit = function(event){\n  this._callbacks = this._callbacks || {};\n  var args = [].slice.call(arguments, 1)\n    , callbacks = this._callbacks[event];\n\n  if (callbacks) {\n    callbacks = callbacks.slice(0);\n    for (var i = 0, len = callbacks.length; i < len; ++i) {\n      callbacks[i].apply(this, args);\n    }\n  }\n\n  return this;\n};\n\n/**\n * Return array of callbacks for `event`.\n *\n * @param {String} event\n * @return {Array}\n * @api public\n */\n\nEmitter.prototype.listeners = function(event){\n  this._callbacks = this._callbacks || {};\n  return this._callbacks[event] || [];\n};\n\n/**\n * Check if this emitter has `event` handlers.\n *\n * @param {String} event\n * @return {Boolean}\n * @api public\n */\n\nEmitter.prototype.hasListeners = function(event){\n  return !! this.listeners(event).length;\n};\n//@ sourceURL=component-emitter/index.js"
));
require.register("jkroso-computed-style/index.js", Function("exports, require, module",
"\n/**\n * Get the computed style of a DOM element\n * \n *   style(document.body) // => {width:'500px', ...}\n * \n * @param {Element} element\n * @return {Object}\n */\n\n// Accessing via window for jsDOM support\nmodule.exports = window.getComputedStyle\n\n// Fallback to elem.currentStyle for IE < 9\nif (!module.exports) {\n\tmodule.exports = function (elem) {\n\t\treturn elem.currentStyle\n\t}\n}\n//@ sourceURL=jkroso-computed-style/index.js"
));
require.register("jonykrause-swipe/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar translate = require('translate');\nvar style = require('computed-style');\nvar Emitter = require('emitter');\nvar events = require('events');\nvar min = Math.min;\nvar max = Math.max;\n\n/**\n * Expose `Swipe`.\n */\n\nmodule.exports = Swipe;\n\n/**\n * Turn `el` into a swipeable list.\n *\n * @param {Element} el\n * @api public\n */\n\nfunction Swipe(el) {\n  if (!(this instanceof Swipe)) return new Swipe(el);\n  if (!el) throw new TypeError('Swipe() requires an element');\n  this.child = el.children[0];\n  this.currentEl = this.children().visible[0];\n  this.currentVisible = 0;\n  this.itemsToSwipe = 1;\n  this.sensitivity = 1;\n  this.current = 0;\n  this.el = el;\n  this.interval(5000);\n  this.duration(300);\n  this.show(0, 0, { silent: true });\n  this.bind();\n}\n\n/**\n * Mixin `Emitter`.\n */\n\nEmitter(Swipe.prototype);\n\n/**\n * Refresh sizing data.\n *\n * @api public\n */\n\nSwipe.prototype.refresh = function(){\n  var children = this.children();\n  var visible = children.visible.length;\n  var prev = this.visible || visible;\n\n  var i = indexOf(children.visible, this.currentEl);\n\n  // we removed/added item(s), update current\n  if (visible < prev && i <= this.currentVisible && i >= 0) {\n    this.currentVisible -= this.currentVisible - i;\n  } else if (visible > prev && i > this.currentVisible) {\n    this.currentVisible += i - this.currentVisible;\n  }\n\n  this.visible = visible;\n  this.childWidth = this.el.getBoundingClientRect().width;\n  this.width = Math.ceil(this.childWidth * visible);\n  this.child.style.width = this.width + 'px';\n  this.child.style.height = this.height + 'px';\n  this.show(this.currentVisible, 0, { silent: true });\n};\n\n/**\n * Bind event handlers.\n *\n * @api public\n */\n\nSwipe.prototype.bind = function(){\n  this.events = events(this.child, this);\n  this.events.bind('mousedown', 'ontouchstart');\n  this.events.bind('mousemove', 'ontouchmove');\n  this.events.bind('touchstart');\n  this.events.bind('touchmove');\n\n  this.docEvents = events(document, this);\n  this.docEvents.bind('mouseup', 'ontouchend');\n  this.docEvents.bind('touchend');\n};\n\n/**\n * Unbind event handlers.\n *\n * @api public\n */\n\nSwipe.prototype.unbind = function(){\n  this.events.unbind();\n  this.docEvents.unbind();\n};\n\n/**\n * Handle touchstart.\n *\n * @api private\n */\n\nSwipe.prototype.ontouchstart = function(e){\n  e.preventDefault();\n  e.stopPropagation();  \n  if (e.touches) e = e.touches[0];\n\n  this.transitionDuration(0);\n  this.dx = 0;\n  this.lock = false;\n  this.ignore = false;\n\n  this.down = {\n    x: e.pageX,\n    y: e.pageY,\n    at: new Date\n  };\n};\n\n/**\n * Handle touchmove.\n *\n * For the first and last slides\n * we apply some resistence to help\n * indicate that you're at the edges.\n *\n * @api private\n */\n\nSwipe.prototype.ontouchmove = function(e){\n  if (!this.down || this.ignore) return;\n  if (e.touches && e.touches.length > 1) return;\n  if (e.touches) {\n    var ev = e;\n    e = e.touches[0];\n  }\n  var s = this.down;\n  var x = e.pageX;\n  var w = this.childWidth;\n  var i = this.currentVisible;\n  this.dx = x - s.x;\n\n  // determine dy and the slope\n  if (!this.lock) {\n    this.lock = true;\n    var y = e.pageY;\n    var dy = y - s.y;\n    var slope = dy / this.dx;\n\n    // if is greater than 1 or -1, we're swiping up/down\n    if (slope > 1 || slope < -1) {\n      this.ignore = true;\n      return;\n    }\n  }\n\n  // when we overwrite touch event with e.touches[0], it doesn't\n  // have the preventDefault method. e.preventDefault() prevents\n  // multiaxis scrolling when moving from left to right\n  (ev || e).preventDefault();\n\n  var dir = this.dx < 0 ? 1 : 0;\n  if (this.isFirst() && 0 == dir) this.dx /= 2;\n  if (this.isLast() && 1 == dir) this.dx /= 2;\n  translate(this.child, -((i * w) + -this.dx / this.sensitivity), 0, '%');\n};\n\n/**\n * Handle touchend.\n *\n * @api private\n */\n\nSwipe.prototype.ontouchend = function(e){\n  if (!this.down) return;\n  e.stopPropagation();\n\n  // touches\n  if (e.changedTouches) e = e.changedTouches[0];\n\n  // setup\n  var dx = this.dx;\n  var x = e.pageX;\n  var w = this.childWidth;\n\n  // < 200ms swipe\n  var ms = new Date - this.down.at;\n  var threshold = ms < 200 ? w / 10 : w / 2;\n  var dir = dx < 0 ? 1 : 0;\n  var half = Math.abs(dx) >= threshold;\n\n  // clear\n  this.down = null;\n\n  // first -> next\n  if (this.isFirst() && 1 == dir && half) return this.next();\n\n  // first -> first\n  if (this.isFirst()) return this.prev();\n\n  // last -> last\n  if (this.isLast() && 1 == dir) return this.next();\n\n  // N -> N + 1\n  if (1 == dir && half) return this.next();\n\n  // N -> N - 1\n  if (0 == dir && half) return this.prev();\n\n  // N -> N\n  this.show(this.currentVisible);\n};\n\n/**\n * Set transition duration to `ms`.\n *\n * @param {Number} ms\n * @return {Swipe} self\n * @api public\n */\n\nSwipe.prototype.duration = function(ms){\n  this._duration = ms;\n  return this;\n};\n\n/**\n * Set cycle interval to `ms`.\n *\n * @param {Number} ms\n * @return {Swipe} self\n * @api public\n */\n\nSwipe.prototype.interval = function(ms){\n  this._interval = ms;\n  return this;\n};\n\n/**\n * Play through all the elements.\n *\n * @return {Swipe} self\n * @api public\n */\n\nSwipe.prototype.play = function(){\n  if (this.timer) return;\n  this.timer = setInterval(this.cycle.bind(this), this._interval);\n  return this;\n};\n\n/**\n * Stop playing.\n *\n * @return {Swipe} self\n * @api public\n */\n\nSwipe.prototype.stop = function(){\n  clearInterval(this.timer);\n  this.timer = null;\n  return this;\n};\n\n/**\n * Show the next slide, when the end\n * is reached start from the beginning.\n *\n * @api public\n */\n\nSwipe.prototype.cycle = function(){\n  if (this.isLast()) {\n    this.currentVisible = -1;\n    this.next();\n  } else {\n    this.next();\n  }\n};\n\n/**\n * Check if we're on the first visible slide.\n *\n * @return {Boolean}\n * @api public\n */\n\nSwipe.prototype.isFirst = function(){\n  return this.currentVisible == 0;\n};\n\n/**\n * Check if we're on the last visible slide.\n *\n * @return {Boolean}\n * @api public\n */\n\nSwipe.prototype.isLast = function(){\n  return this.currentVisible == this.visible - this.itemsToSwipe;\n};\n\n/**\n * Show the previous slide, if any.\n *\n * @return {Swipe} self\n * @api public\n */\n\nSwipe.prototype.prev = function(){\n  this.show(this.currentVisible - this.itemsToSwipe);\n  return this;\n};\n\n/**\n * Show the next slide, if any.\n *\n * @return {Swipe} self\n * @api public\n */\n\nSwipe.prototype.next = function(){\n  this.show(this.currentVisible + this.itemsToSwipe);\n  return this;\n};\n\n/**\n * Show slide `i`.\n *\n * Emits `show `event\n *\n * @param {Number} i\n * @return {Swipe} self\n * @api public\n */\n\nSwipe.prototype.show = function(i, ms, options){\n  options = options || {};\n  if (null == ms) ms = this._duration;\n  var children = this.children();\n  i = max(0, min(i, children.visible.length - 1));\n  this.currentVisible = i;\n  this.currentEl = children.visible[i];\n  this.current = indexOf(children.all, this.currentEl);\n  this.transitionDuration(ms);\n  translate(this.child, -this.childWidth * i, 0, '%');\n  if (!options.silent) this.emit('show', this.current, this.currentEl);\n  return this;\n};\n\n/**\n * Return children categorized by visibility.\n *\n * @return {Object}\n * @api private\n */\n\nSwipe.prototype.children = function(){\n  var els = this.child.children;\n\n  var ret = {\n    all: els,\n    visible: [],\n    hidden: []\n  };\n\n  for (var i = 0; i < els.length; i++) {\n    var el = els[i];\n    if (visible(el)) {\n      ret.visible.push(el);\n    } else {\n      ret.hidden.push(el);\n    }\n  }\n\n  return ret;\n};\n\n/**\n * Set transition duration.\n *\n * @api private\n */\n\nSwipe.prototype.transitionDuration = function(ms){\n  var s = this.child.style;\n  s.webkitTransition = ms + 'ms -webkit-transform';\n  s.MozTransition = ms + 'ms -moz-transform';\n  s.msTransition = ms + 'ms -ms-transform';\n  s.OTransition = ms + 'ms -o-transform';\n  s.transition = ms + 'ms transform';\n};\n\n/**\n * Return index of `el` in `els`.\n *\n * @param {Array} els\n * @param {Element} el\n * @return {Number}\n * @api private\n */\n\nfunction indexOf(els, el) {\n  for (var i = 0; i < els.length; i++) {\n    if (els[i] == el) return i;\n  }\n  return -1;\n}\n\n/**\n * Check if `el` is visible.\n *\n * @param {Element} el\n * @return {Boolean}\n * @api private\n */\n\nfunction visible(el) {\n  return style(el).display != 'none';\n}\n//@ sourceURL=jonykrause-swipe/index.js"
));
require.register("fluid-slider/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar swipe = require('swipe');\nvar events = require('events');\n/**\n * Expose `FluidSlider`.\n */\n\nmodule.exports = FluidSlider;\n\n\n/**\n * Turn `el` into a slideable list.\n *\n * @param {Element} el\n * @param {Object} options\n * @api public\n *\n *  * Options:\n *  - `breakpointItems`: {Object} store viewport width/px(key) and amount(val) of visible items f.e. {0: 1, 500: 2}\n *  - `sensitivity`: {Number} Sensitivity while touchmoving\n *  - `itemsToSlide`: {Number} amount of items to slide\n */\n\nfunction FluidSlider(el, options) {\n  if (!(this instanceof FluidSlider)) return new FluidSlider(el, options);\n  if (!el) throw new TypeError('FluidSlider() requires an element');\n  this.el = el;\n  this.parent = this.el.parentNode;\n  this.options = options || {};\n  this.children = this.el.children;\n  this.total = this.children.length;\n  this.swiper = swipe(el.parentNode).duration(500);\n  this.swiper.sensitivity = this.options.sensitvity || 50;\n  this.breakpointItems = this.options.breakpointItems || { 0: 1 };\n  this.bind();\n  this.update();\n}\n\n/**\n * Bind event handlers.\n *\n * @api public\n */\n\nFluidSlider.prototype.bind = function() {\n  this.winEvents = events(window, this);\n  this.winEvents.bind('resize', 'update');\n};\n\n/**\n * Set amount of visible items according to breakpoints/viewport\n *\n * @param {Object} breakpoints\n *\n * @api private\n */\n\nFluidSlider.prototype.setVisibleItems = function(breakpoints) {\n  var currentWidth = this.parent.offsetWidth;\n  for (breakpoint in breakpoints) {\n    if (currentWidth >= parseInt(breakpoint, 10)) {\n      this.visibleItems = breakpoints[breakpoint];\n    }\n  }\n  this.setitemsToSlide();\n};\n\n/**\n * Set amount of items to slide\n *\n * @api private\n */\n\nFluidSlider.prototype.setitemsToSlide = function() {\n  return this.swiper.itemsToSwipe = this.options.itemsToSlide || Math.ceil(this.visibleItems/2);\n};\n\n/**\n * Set Element/List width according to visible Items\n *\n * @api private\n */\n\nFluidSlider.prototype.setElWidth = function() {\n  var width = this.total * 100 / this.visibleItems;\n  return this.el.style.width = width + '%';\n};\n\n/**\n * Calc item width in percent\n *\n * @api private\n */\n\nFluidSlider.prototype.getItemWidth = function() {\n  var fullWidth = parseInt(this.el.style.width, 10);\n  this.swiper.childWidth = fullWidth / this.total / (fullWidth / 100);\n  return parseFloat(this.swiper.childWidth.toFixed(3));\n};\n\n/**\n * Set item width\n *\n * @api private\n */\n\nFluidSlider.prototype.setItemWidth = function() {\n  var width = this.getItemWidth();\n  for (var i = 0, len = this.total; i < len; i++) {\n    this.children[i].style.width = width + '%';\n  }\n};\n\n/**\n * Update sizing data.\n *\n * @api public\n */\n\nFluidSlider.prototype.update = function() {\n  this.setVisibleItems(this.breakpointItems);\n  this.setElWidth();\n  this.setItemWidth();\n  return this;\n};\n\n//@ sourceURL=fluid-slider/index.js"
));
require.alias("component-events/index.js", "fluid-slider/deps/events/index.js");
require.alias("component-events/index.js", "events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-event-manager/index.js", "component-events/deps/event-manager/index.js");

require.alias("jonykrause-translate/index.js", "fluid-slider/deps/translate/index.js");
require.alias("jonykrause-translate/index.js", "fluid-slider/deps/translate/index.js");
require.alias("jonykrause-translate/index.js", "translate/index.js");
require.alias("component-has-translate3d/index.js", "jonykrause-translate/deps/has-translate3d/index.js");
require.alias("component-transform-property/index.js", "component-has-translate3d/deps/transform-property/index.js");

require.alias("component-transform-property/index.js", "jonykrause-translate/deps/transform-property/index.js");

require.alias("jonykrause-translate/index.js", "jonykrause-translate/index.js");

require.alias("jonykrause-swipe/index.js", "fluid-slider/deps/swipe/index.js");
require.alias("jonykrause-swipe/index.js", "swipe/index.js");
require.alias("component-emitter/index.js", "jonykrause-swipe/deps/emitter/index.js");

require.alias("component-events/index.js", "jonykrause-swipe/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-event-manager/index.js", "component-events/deps/event-manager/index.js");

require.alias("jonykrause-translate/index.js", "jonykrause-swipe/deps/translate/index.js");
require.alias("jonykrause-translate/index.js", "jonykrause-swipe/deps/translate/index.js");
require.alias("component-has-translate3d/index.js", "jonykrause-translate/deps/has-translate3d/index.js");
require.alias("component-transform-property/index.js", "component-has-translate3d/deps/transform-property/index.js");

require.alias("component-transform-property/index.js", "jonykrause-translate/deps/transform-property/index.js");

require.alias("jonykrause-translate/index.js", "jonykrause-translate/index.js");

require.alias("jkroso-computed-style/index.js", "jonykrause-swipe/deps/computed-style/index.js");

require.alias("fluid-slider/index.js", "fluid-slider/index.js");

