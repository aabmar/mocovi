.PHONY: clean build prepublish

ts: 
	npx tsc -p tsconfig.json

clean:
	# ...existing clean commands...
	rm -rf dist

build: clean ts
	# Compile TypeScript files

	# Prepare a trimmed package.json in dist/
	node prepare-release.js

publish: build
	# Publish only the content in dist/
	cd dist
	npm publish
