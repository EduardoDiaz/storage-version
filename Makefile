REPORTER=spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha --recursive -R $(REPORTER)

test-watch:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--recursive -R $(REPORTER) \
		--watch

.PHONY: test test-watch
