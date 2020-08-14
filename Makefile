.PHONY: tests
tests:
	npm test

.PHONY: dump
dump:
	bin/ngdump test/guides/gt_libng.ng

.PHONY: dir
dir:
	bin/ngdir test/guides/*.ng

.PHONY: about
about:
	bin/ngabout test/guides/gt_libng.ng

.PHONY: serve
serve:
	bin/ngserve test/guides/*.ng

.PHONY: clean
clean:
	rm -f *~ lib/*~ bin/*~ npm-debug.log

.PHONY: publish
publish:
	npm publish

### Makefile ends here
