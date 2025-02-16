.PHONY: clean build prepublish

clean:
	# ...existing clean commands...
	rm -rf dist

build: clean
	# Compile TypeScript files
	npx tsc
	# Prepare a trimmed package.json in dist/
	node prepare-release.js

publish: build
	# Publish only the content in dist/
	cd dist && npm publish
