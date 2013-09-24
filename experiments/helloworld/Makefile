UGLIFY = node_modules/.bin/uglifyjs
BROWSERIFY = node_modules/.bin/browserify

# make library
all: \
	dist/d3app.js \
	dist/d3app.uncompressed.js

node_modules/.install: package.json
	npm install && touch node_modules/.install

dist:
	mkdir -p dist

dist/d3app.uncompressed.js: node_modules/.install dist $(shell $(BROWSERIFY) --list index.js)
	$(BROWSERIFY) --debug index.js > $@

dist/d3app.js: dist/d3app.uncompressed.js
	$(UGLIFY) $< -c -m -o $@

clean:
	rm -rf dist/*
