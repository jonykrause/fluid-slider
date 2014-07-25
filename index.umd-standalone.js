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
require.register("component-event/index.js", function(exports, require, module){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (el.addEventListener) {
    el.addEventListener(type, fn, capture);
  } else {
    el.attachEvent('on' + type, fn);
  }
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

});
require.register("component-event-manager/index.js", function(exports, require, module){


/**
 * Expose `EventManager`.
 */

module.exports = EventManager;

/**
 * Initialize an `EventManager` with the given
 * `target` object which events will be bound to,
 * and the `obj` which will receive method calls.
 *
 * @param {Object} target
 * @param {Object} obj
 * @api public
 */

function EventManager(target, obj) {
  this.target = target;
  this.obj = obj;
  this._bindings = {};
}

/**
 * Register bind function.
 *
 * @param {Function} fn
 * @return {EventManager} self
 * @api public
 */

EventManager.prototype.onbind = function(fn){
  this._bind = fn;
  return this;
};

/**
 * Register unbind function.
 *
 * @param {Function} fn
 * @return {EventManager} self
 * @api public
 */

EventManager.prototype.onunbind = function(fn){
  this._unbind = fn;
  return this;
};

/**
 * Bind to `event` with optional `method` name.
 * When `method` is undefined it becomes `event`
 * with the "on" prefix.
 *
 *    events.bind('login') // implies "onlogin"
 *    events.bind('login', 'onLogin')
 *
 * @param {String} event
 * @param {String} [method]
 * @return {Function} callback
 * @api public
 */

EventManager.prototype.bind = function(event, method){
  var fn = this.addBinding.apply(this, arguments);
  if (this._onbind) this._onbind(event, method, fn);
  this._bind(event, fn);
  return fn;
};

/**
 * Add event binding.
 *
 * @param {String} event
 * @param {String} method
 * @return {Function} callback
 * @api private
 */

EventManager.prototype.addBinding = function(event, method){
  var obj = this.obj;
  var method = method || 'on' + event;
  var args = [].slice.call(arguments, 2);

  // callback
  function callback() {
    var a = [].slice.call(arguments).concat(args);
    obj[method].apply(obj, a);
  }

  // subscription
  this._bindings[event] = this._bindings[event] || {};
  this._bindings[event][method] = callback;

  return callback;
};

/**
 * Unbind a single binding, all bindings for `event`,
 * or all bindings within the manager.
 *
 *     evennts.unbind('login', 'onLogin')
 *     evennts.unbind('login')
 *     evennts.unbind()
 *
 * @param {String} [event]
 * @param {String} [method]
 * @return {Function} callback
 * @api public
 */

EventManager.prototype.unbind = function(event, method){
  if (0 == arguments.length) return this.unbindAll();
  if (1 == arguments.length) return this.unbindAllOf(event);
  var fn = this._bindings[event][method];
  if (this._onunbind) this._onunbind(event, method, fn);
  this._unbind(event, fn);
  return fn;
};

/**
 * Unbind all events.
 *
 * @api private
 */

EventManager.prototype.unbindAll = function(){
  for (var event in this._bindings) {
    this.unbindAllOf(event);
  }
};

/**
 * Unbind all events for `event`.
 *
 * @param {String} event
 * @api private
 */

EventManager.prototype.unbindAllOf = function(event){
  var bindings = this._bindings[event];
  if (!bindings) return;
  for (var method in bindings) {
    this.unbind(event, method);
  }
};

});
require.register("component-events/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Manager = require('event-manager')
  , event = require('event');

/**
 * Return a new event manager.
 */

module.exports = function(target, obj){
  var manager = new Manager(target, obj);

  manager.onbind(function(name, fn){
    event.bind(target, name, fn);
  });

  manager.onunbind(function(name, fn){
    event.unbind(target, name, fn);
  });

  return manager;
};

});
require.register("component-has-translate3d/index.js", function(exports, require, module){

var prop = require('transform-property');
if (!prop) return module.exports = false;

var map = {
  webkitTransform: '-webkit-transform',
  OTransform: '-o-transform',
  msTransform: '-ms-transform',
  MozTransform: '-moz-transform',
  transform: 'transform'
};

// from: https://gist.github.com/lorenzopolidori/3794226
var el = document.createElement('div');
el.style[prop] = 'translate3d(1px,1px,1px)';
document.body.insertBefore(el, null);
var val = window.getComputedStyle(el).getPropertyValue(map[prop]);
document.body.removeChild(el);
module.exports = null != val && val.length && 'none' != val;

});
require.register("component-transform-property/index.js", function(exports, require, module){

var styles = [
  'webkitTransform',
  'MozTransform',
  'msTransform',
  'OTransform',
  'transform'
];

var el = document.createElement('p');
var style;

for (var i = 0; i < styles.length; i++) {
  style = styles[i];
  if (null != el.style[style]) {
    module.exports = style;
    break;
  }
}

});
require.register("jonykrause-translate/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var transform = require('transform-property');
var has3d = require('has-translate3d');

/**
 * Expose `translate`.
 */

module.exports = translate;

/**
 * Translate `el` by `(x, y) units`.
 *
 * @param {Element} el
 * @param {Number} x
 * @param {Number} y
 * @param {String} unit
 * @api public
 */

function translate(el, x, y, unit) {
  unit || (unit = 'px');
  if (typeof transform === 'string') {
    if (has3d) {
      el.style[transform] = 'translate3d(' + x + unit + ',' + y + unit + ', 0)';
    } else {
      el.style[transform] = 'translate(' + x + unit + ',' + y + unit + ')';
    }
  } else {
    el.style.left = x;
    el.style.top = y;
  }
};


});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = callbacks.indexOf(fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-touchaction-property/index.js", function(exports, require, module){

/**
 * Module exports.
 */

module.exports = touchActionProperty();

/**
 * Returns "touchAction", "msTouchAction", or null.
 */

function touchActionProperty(doc) {
  if (!doc) doc = document;
  var div = doc.createElement('div');
  var prop = null;
  if ('touchAction' in div.style) prop = 'touchAction';
  else if ('msTouchAction' in div.style) prop = 'msTouchAction';
  div = null;
  return prop;
}

});
require.register("component-transitionend-property/index.js", function(exports, require, module){
/**
 * Transition-end mapping
 */

var map = {
  'WebkitTransition' : 'webkitTransitionEnd',
  'MozTransition' : 'transitionend',
  'OTransition' : 'oTransitionEnd',
  'msTransition' : 'MSTransitionEnd',
  'transition' : 'transitionend'
};

/**
 * Expose `transitionend`
 */

var el = document.createElement('p');

for (var transition in map) {
  if (null != el.style[transition]) {
    module.exports = map[transition];
    break;
  }
}

});
require.register("jkroso-computed-style/index.js", function(exports, require, module){

/**
 * Get the computed style of a DOM element
 * 
 *   style(document.body) // => {width:'500px', ...}
 * 
 * @param {Element} element
 * @return {Object}
 */

// Accessing via window for jsDOM support
module.exports = window.getComputedStyle

// Fallback to elem.currentStyle for IE < 9
if (!module.exports) {
  module.exports = function (elem) {
    return elem.currentStyle
  }
}

});
require.register("jonykrause-swipe/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var translate = require('translate');
var transitionend = require('transitionend-property');
var transform = require('transform-property');
var touchAction = require('touchaction-property');
var has3d = require('has-translate3d');
var style = require('computed-style');
var Emitter = require('emitter');
var events = require('events');
var min = Math.min;
var max = Math.max;

/**
 * Expose `Swipe`.
 */

module.exports = Swipe;

/**
 * Turn `el` into a swipeable list.
 *
 * @param {Element} el
 * @api public
 */

function Swipe(el) {
  if (!(this instanceof Swipe)) return new Swipe(el);
  if (!el) throw new TypeError('Swipe() requires an element');
  this.child = el.children[0];
  this.touchAction('none');
  this.currentEl = this.children().visible[0];
  this.visible = this.children().visible.length;
  this.unit = '%';
  this.currentVisible = 0;
  this.itemsToSwipe = 1;
  this.sensitivity = 1;
  this.current = 0;
  this.el = el;
  this.interval(5000);
  this.duration(300);
  this.fastThreshold(200);
  this.threshold(0.5);
  this.show(0, 0, { silent: true });
  this.bind();
}

/**
 * Mixin `Emitter`.
 */

Emitter(Swipe.prototype);

/**
 * Set the swipe threshold to `n`.
 *
 * This is the factor required for swipe
 * to detect when a slide has passed the
 * given threshold, and may display the next
 * or previous slide. For example the default
 * of `.5` means that the user must swipe _beyond_
 * half of the side width.
 *
 * @param {Number} n
 * @api public
 */

Swipe.prototype.threshold = function(n){
  this._threshold = n;
};

/**
 * Set the "fast" swipe threshold to `ms`.
 *
 * This is the amount of time in milliseconds
 * which determines if a swipe was "fast" or not. When
 * the swipe's duration is less than `ms` only 1/10th of
 * the slide's width must be exceeded to display the previous
 * or next slide.
 *
 * @param {Number} n
 * @api public
 */

Swipe.prototype.fastThreshold = function(ms){
  this._fastThreshold = ms;
};

/**
 * Refresh sizing data.
 *
 * @api public
 */

Swipe.prototype.refresh = function(){
  var children = this.children();
  var visible = children.visible.length;
  var prev = this.visible || visible;

  var i = indexOf(children.visible, this.currentEl);

  // we removed/added item(s), update current
  if (visible < prev && i <= this.currentVisible && i >= 0) {
    this.currentVisible -= this.currentVisible - i;
  } else if (visible > prev && i > this.currentVisible) {
    this.currentVisible += i - this.currentVisible;
  }

  this.visible = visible;
  this.childWidth = this.el.getBoundingClientRect().width;
  this.width = Math.ceil(this.childWidth * visible);
  this.child.style.width = this.width + 'px';
  this.child.style.height = this.height + 'px';
  this.show(this.currentVisible, 0, { silent: true });
};

/**
 * Bind event handlers.
 *
 * @api public
 */

Swipe.prototype.bind = function(){
  this.events = events(this.child, this);
  this.docEvents = events(document, this);

  // standard mouse click events
  this.events.bind('mousedown', 'ontouchstart');
  this.events.bind('mousemove', 'ontouchmove');
  this.docEvents.bind('mouseup', 'ontouchend');

  // W3C touch events
  this.events.bind('touchstart');
  this.events.bind('touchmove');
  this.docEvents.bind('touchend');

  // MS IE touch events
  this.events.bind('PointerDown', 'ontouchstart');
  this.events.bind('PointerMove', 'ontouchmove');
  this.docEvents.bind('PointerUp', 'ontouchstart');
};

/**
 * Unbind event handlers.
 *
 * @api public
 */

Swipe.prototype.unbind = function(){
  this.events.unbind();
  this.docEvents.unbind();
};

/**
 * Handle touchstart.
 *
 * @api private
 */

Swipe.prototype.ontouchstart = function(e){
  this.transitionDuration(0);
  this.dx = 0;
  this.updown = null;

  var touch = this.getTouch(e);
  this.down = {
    x: touch.pageX,
    y: touch.pageY,
    at: new Date()
  };
};

/**
 * Handle touchmove.
 *
 * For the first and last slides
 * we apply some resistence to help
 * indicate that you're at the edges.
 *
 * @api private
 */

Swipe.prototype.ontouchmove = function(e){
  if (!this.down || this.updown) return;
  var touch = this.getTouch(e);

  // TODO: ignore more than one finger
  if (!touch) return;

  var down = this.down;
  var x = touch.pageX;
  var w = this.childWidth;
  var i = this.currentVisible;
  this.dx = x - down.x;

  // determine dy and the slope
  if (null == this.updown) {
    var y = touch.pageY;
    var dy = y - down.y;
    var slope = dy / this.dx;

    // if is greater than 1 or -1, we're swiping up/down
    if (slope > 1 || slope < -1) {
      this.updown = true;
      return;
    } else {
      this.updown = false;
    }
  }

  e.preventDefault();

  if (!this.el.classList.contains('is-touchmoving')) {
    this.el.classList.add('is-touchmoving');
  }


  var dir = this.dx < 0 ? 1 : 0;
  if (this.isFirst() && 0 == dir) this.dx /= 2;
  if (this.isLast() && 1 == dir) this.dx /= 2;
  translate(this.child, -((i * w) + -this.dx / this.sensitivity), 0, this.unit);
};

/**
 * Handle touchend.
 *
 * @api private
 */

Swipe.prototype.ontouchend = function(e){
  e.stopPropagation();
  this.el.classList.remove('touchmoving');
  // touches
  if (e.changedTouches) e = e.changedTouches[0];
  if (!this.down) return;
  var touch = this.getTouch(e);

  // setup
  var dx = this.dx;
  var x = touch.pageX;
  var w = this.childWidth;

  // < 200ms swipe
  var ms = new Date() - this.down.at;
  var threshold = ms < this._fastThreshold ? w / 10 : w * this._threshold;
  var dir = dx < 0 ? 1 : 0;
  var half = Math.abs(dx) >= threshold;

  // clear
  this.down = null;

  this.el.classList.remove('is-touchmoving');

  // first -> next
  if (this.isFirst() && 1 == dir && half) return this.next();

  // first -> first
  if (this.isFirst()) return this.prev();

  // last -> last
  if (this.isLast() && 1 == dir) return this.next();

  // N -> N + 1
  if (1 == dir && half) return this.next();

  // N -> N - 1
  if (0 == dir && half) return this.prev();

  // N -> N
  this.show(this.currentVisible);
};

/**
 * Set transition duration to `ms`.
 *
 * @param {Number} ms
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.duration = function(ms){
  this._duration = ms;
  return this;
};

/**
 * Set cycle interval to `ms`.
 *
 * @param {Number} ms
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.interval = function(ms){
  this._interval = ms;
  return this;
};

/**
 * Play through all the elements.
 *
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.play = function(){
  if (this.timer) return;
  this.timer = setInterval(this.cycle.bind(this), this._interval);
  return this;
};

/**
 * Stop playing.
 *
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.stop = function(){
  clearInterval(this.timer);
  this.timer = null;
  return this;
};

/**
 * Show the next slide, when the end
 * is reached start from the beginning.
 *
 * @api public
 */

Swipe.prototype.cycle = function(){
  if (this.isLast()) {
    this.currentVisible = -this.itemsToSwipe;
    this.next();
  } else {
    this.next();
  }
};

/**
 * Check if we're on the first visible slide.
 *
 * @return {Boolean}
 * @api public
 */

Swipe.prototype.isFirst = function(){
  return this.currentVisible == 0;
};

/**
 * Check if we're on the last visible slide.
 *
 * @return {Boolean}
 * @api public
 */

Swipe.prototype.isLast = function(){
  return this.currentVisible == this.visible - this.itemsToSwipe;
};

/**
 * Show the previous slide, if any.
 *
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.prev = function(){
  this.show(this.currentVisible - this.itemsToSwipe);
  return this;
};

/**
 * Show the next slide, if any.
 *
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.next = function(){
  this.show(this.currentVisible + this.itemsToSwipe);
  return this;
};

/**
 * Show slide `i`.
 *
 * Emits `show `event
 *
 * @param {Number} i
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.show = function(i, ms, options){
  options = options || {};
  if (null == ms) ms = this._duration;
  var self = this;
  var children = this.children();
  i = max(0, min(i, children.visible.length - this.itemsToSwipe));
  this.currentVisible = i;
  this.currentEl = children.visible[i];
  this.current = indexOf(children.all, this.currentEl);
  this.transitionDuration(ms);
  translate(this.child, -this.childWidth * i, 0, this.unit);
  if (!options.silent) this.emit('show', this.current, this.currentEl);
  return this;
};

/**
 * Return children categorized by visibility.
 *
 * @return {Object}
 * @api private
 */

Swipe.prototype.children = function(){
  var els = this.child.children;

  var ret = {
    all: els,
    visible: [],
    hidden: []
  };

  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (visible(el)) {
      ret.visible.push(el);
    } else {
      ret.hidden.push(el);
    }
  }

  return ret;
};

/**
 * Set transition duration.
 *
 * @api private
 */

Swipe.prototype.transitionDuration = function(ms){
  var s = this.child.style;
  s.webkitTransition = ms + 'ms -webkit-transform';
  s.MozTransition = ms + 'ms -moz-transform';
  s.msTransition = ms + 'ms -ms-transform';
  s.OTransition = ms + 'ms -o-transform';
  s.transition = ms + 'ms transform';
};

/**
 * Sets the "touchAction" CSS style property to `value`.
 *
 * @api private
 */

Swipe.prototype.touchAction = function(value){
  var s = this.child.style;
  if (touchAction) {
    s[touchAction] = value;
  }
};

/**
 * Gets the appropriate "touch" object for the `e` event. The event may be from
 * a "mouse", "touch", or "Pointer" event, so the normalization happens here.
 *
 * @api private
 */

Swipe.prototype.getTouch = function(e){
  // "mouse" and "Pointer" events just use the event object itself
  var touch = e;
  if (e.changedTouches && e.changedTouches.length > 0) {
    // W3C "touch" events use the `changedTouches` array
    touch = e.changedTouches[0];
  }
  return touch;
};

/**
 * Return index of `el` in `els`.
 *
 * @param {Array} els
 * @param {Element} el
 * @return {Number}
 * @api private
 */

function indexOf(els, el) {
  for (var i = 0; i < els.length; i++) {
    if (els[i] == el) return i;
  }
  return -1;
}

/**
 * Check if `el` is visible.
 *
 * @param {Element} el
 * @return {Boolean}
 * @api private
 */

function visible(el) {
  return style(el).display != 'none';
}

});
require.register("fluid-slider/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var swipe = require('swipe');
var events = require('events');
/**
 * Expose `FluidSlider`.
 */

module.exports = FluidSlider;


/**
 * Turn `el` into a slideable list.
 *
 * @param {Element} el
 * @param {Object} options
 * @api public
 *
 *  * Options:
 *  - `breakpointItems`: {Object} store viewport width/px(key) and amount(val) of visible items f.e. {0: 1, 500: 2}
 *  - `sensitivity`: {Number} Sensitivity while touchmoving
 *  - `itemsToSlide`: {Number} amount of items to slide, defaults to visible items
 */

function FluidSlider(el, options) {
  if (!(this instanceof FluidSlider)) return new FluidSlider(el, options);
  if (!el) throw new TypeError('FluidSlider() requires an element');
  this.el = el;
  this.parent = this.el.parentNode;
  this.options = options || {};
  this.children = this.el.children;
  this.total = this.children.length;
  this.swiper = swipe(this.parent).duration(500);
  this.swiper.sensitivity = this.options.sensitvity || 50;
  this.breakpointItems = this.options.breakpointItems || { 0: 1 };
  this.bind();
  this.update();
}

/**
 * Bind event handlers.
 *
 * @api public
 */

FluidSlider.prototype.bind = function() {
  this.winEvents = events(window, this);
  this.winEvents.bind('resize', 'update');
};

/**
 * Set amount of visible items according to breakpoints/viewport
 *
 * @param {Object} breakpoints
 *
 * @api private
 */

FluidSlider.prototype.setVisibleItems = function(breakpoints) {
  var currentWidth = this.parent.offsetWidth;
  for (breakpoint in breakpoints) {
    if (currentWidth >= parseInt(breakpoint, 10)) {
      this.visibleItems = breakpoints[breakpoint];
    }
  }
  this.setitemsToSlide();
};

/**
 * Set amount of items to slide
 *
 * @api private
 */

FluidSlider.prototype.setitemsToSlide = function() {
  return this.swiper.itemsToSwipe = this.options.itemsToSlide || this.visibleItems;
};

/**
 * Set Element/List width according to visible Items
 *
 * @api private
 */

FluidSlider.prototype.setElWidth = function() {
  var width = this.total * 100 / this.visibleItems;
  return this.el.style.width = width + '%';
};

/**
 * Calc item width in percent
 *
 * @api private
 */

FluidSlider.prototype.getItemWidth = function() {
  var fullWidth = parseInt(this.el.style.width, 10);
  this.swiper.childWidth = fullWidth / this.total / (fullWidth / 100);
  return parseFloat(this.swiper.childWidth.toFixed(4) - 0.0001);
};

/**
 * Set item width
 *
 * @api private
 */

FluidSlider.prototype.setItemWidth = function() {
  var width = this.getItemWidth();
  for (var i = 0, len = this.total; i < len; i++) {
    this.children[i].style.width = width + '%';
  }
};

/**
 * Update sizing data.
 *
 * @api public
 */

FluidSlider.prototype.update = function() {
  this.setVisibleItems(this.breakpointItems);
  this.setElWidth();
  this.setItemWidth();
  return this;
};


});
















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

require.alias("component-event/index.js", "jonykrause-swipe/deps/event/index.js");

require.alias("component-events/index.js", "jonykrause-swipe/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-event-manager/index.js", "component-events/deps/event-manager/index.js");

require.alias("jonykrause-translate/index.js", "jonykrause-swipe/deps/translate/index.js");
require.alias("jonykrause-translate/index.js", "jonykrause-swipe/deps/translate/index.js");
require.alias("component-has-translate3d/index.js", "jonykrause-translate/deps/has-translate3d/index.js");
require.alias("component-transform-property/index.js", "component-has-translate3d/deps/transform-property/index.js");

require.alias("component-transform-property/index.js", "jonykrause-translate/deps/transform-property/index.js");

require.alias("jonykrause-translate/index.js", "jonykrause-translate/index.js");
require.alias("component-has-translate3d/index.js", "jonykrause-swipe/deps/has-translate3d/index.js");
require.alias("component-transform-property/index.js", "component-has-translate3d/deps/transform-property/index.js");

require.alias("component-touchaction-property/index.js", "jonykrause-swipe/deps/touchaction-property/index.js");
require.alias("component-touchaction-property/index.js", "jonykrause-swipe/deps/touchaction-property/index.js");
require.alias("component-touchaction-property/index.js", "component-touchaction-property/index.js");
require.alias("component-transform-property/index.js", "jonykrause-swipe/deps/transform-property/index.js");

require.alias("component-transitionend-property/index.js", "jonykrause-swipe/deps/transitionend-property/index.js");
require.alias("component-transitionend-property/index.js", "jonykrause-swipe/deps/transitionend-property/index.js");
require.alias("component-transitionend-property/index.js", "component-transitionend-property/index.js");
require.alias("jkroso-computed-style/index.js", "jonykrause-swipe/deps/computed-style/index.js");

require.alias("fluid-slider/index.js", "fluid-slider/index.js");if (typeof exports == "object") {
  module.exports = require("fluid-slider");
} else if (typeof define == "function" && define.amd) {
  define([], function(){ return require("fluid-slider"); });
} else {
  this["FluidSlider"] = require("fluid-slider");
}})();