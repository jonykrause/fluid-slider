
build: components index.js fluid-slider.css
	@component build

components: component.json
	@component install

clean:
	rm -fr build components template.js

.PHONY: clean
