
# Fluid Slider

Percentage-based Slider component built on top of [Swipe](https://github.com/component/swipe). Useful for responsive projects because of configurable breakpoints/slides. Be sure to check out the [example](http://jonykrause.github.io/fluid-slider/).


## Installation

    $ component install jonykrause/fluid-slider


## API

### FluidSlider(el, options)

Create a fluid slider object for `el`. This should be a container element that wraps a list of several items. View ./example/index.html for a working example.

Supports the options:
 
 - sensitivity: ```{Number}``` Sensitivity while touchmoving, defaults to 50
 - itemsToSlide: ```{Number}``` Amount of items to slide, defaults to visibleItems/2
 - breakpointItems: ```{Object}``` Store viewport width/px(key) and amount(val) of visible items f.e. {0: 1, 500: 2}


### FluidSlider#update

This method should be invoked when the swipe element has been resized, or an item has been added or removed


#### Also inherits [Swipe](https://github.com/component/swipe) functionality!

## License

  MIT
