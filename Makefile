all : doc
	-rm ./libs/Shell.min.js
	r.js -o minifyData.js

doc :
	-rm -r docs
	jsdoc ./src -r -d ./docs
