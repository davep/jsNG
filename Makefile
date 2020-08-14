.DEFAULT_GOAL := help

.PHONY: tests
tests:				# Run all the unit tests.
	npm test

.PHONY: dump
dump:				# Test the dump command on a guide.
	bin/ngdump test/guides/gt_libng.ng

.PHONY: dir
dir:				# Test the dir command on the test guides.
	bin/ngdir test/guides/*.ng

.PHONY: about
about:				# Test the about command on a guide.
	bin/ngabout test/guides/gt_libng.ng

.PHONY: serve
serve:				# Test the serve command on the test builds.
	bin/ngserve test/guides/*.ng

.PHONY: clean
clean:				# Clean up.
	rm -f *~ lib/*~ bin/*~ npm-debug.log

.PHONY: publish
publish:			# Publish to npm.
	npm publish

.PHONY: help
help:				# Display this help
	@grep -Eh "^[a-z]+:.+# " $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.+# "}; {printf "%-20s %s\n", $$1, $$2}'

### Makefile ends here
