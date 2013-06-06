
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

