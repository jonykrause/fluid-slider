
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
  return parseFloat(this.swiper.childWidth.toFixed(3));
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

