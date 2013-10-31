COMPONENT := ./node_modules/.bin/component
JSHINT := ./node_modules/.bin/jshint
SERVE := ./node_modules/.bin/serve

JS := $(shell find lib -name '*.js' -print)

PORT = 3000

build: transitive.js

clean:
	rm -rf build components node_modules

components: component.json
	$(COMPONENT) install --dev --verbose

install: node_modules

lint: $(JS)
	$(JSHINT) --verbose $(JS)

node_modules: package.json
	npm install

release: transitive.min.js

server:
	$(SERVE) --port $(PORT)

transitive.js: components $(JS)
	$(MAKE) lint
	$(COMPONENT) build --dev --verbose --out example/build
	$(COMPONENT) build --verbose --standalone Transitive --out . --name transitive

transitive.min.js: transitive.js
	$(COMPONENT) build --verbose --use component-uglifyjs --standalone Transitive --out . --name transitive.min

watch:
	watch $(MAKE) build

.PHONY: build clean install lint release server watch
