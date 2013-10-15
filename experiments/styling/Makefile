
COMPONENT = ./node_modules/.bin/component
JSHINT = ./node_modules/.bin/jshint

CSS := $(shell find lib -name '*.css' -print)
HTML := $(shell find lib -name '*.html' -print)
JS := $(shell find lib -name '*.js' -print)
JSON := $(shell find lib -name '*.json' -print)

build: build/build.js

build/build.js: components $(JS) $(CSS) $(HTML)
	$(MAKE) lint
	$(COMPONENT) build --dev --verbose --copy

clean:
	rm -rf build components

components: $(JSON)
	$(COMPONENT) install --dev --verbose

install:
	npm install
	$(MAKE) build

lint: $(JS)
	$(JSHINT) --verbose $(JS)

watch:
	watch $(MAKE) build

.PHONY: build lint watch
