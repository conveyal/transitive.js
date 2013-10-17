
COMPONENT := ./node_modules/.bin/component
JSHINT := ./node_modules/.bin/jshint
SERVE := ./node_modules/.bin/serve

CSS := $(shell find lib -name '*.css' -print)
JS := $(shell find lib -name '*.js' -print)
JSON := $(shell find lib -name '*.json' -print)

PORT = 3000

build: transitive.js

clean:
	rm -rf build components

components: $(JSON)
	$(COMPONENT) install --dev --verbose

install:
	npm install
	$(MAKE) build

lint: $(JS)
	@$(JSHINT) --verbose $(JS)

server:
	@$(SERVE) --port $(PORT)

transitive.js: components $(JS) $(CSS)
	$(MAKE) lint
	$(COMPONENT) build --standalone transitive --out . --name transitive

transitive.min.js: transitive.js
	$(COMPONENT) build --use component-uglifyjs --standalone transitive --out . --name transitive.min

watch:
	watch $(MAKE) build

.PHONY: lint
