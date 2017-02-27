tests:
	npm test

dump:
	bin/ngdump test/guides/gt_libng.ng

dir:
	bin/ngdir test/guides/*.ng

about:
	bin/ngabout test/guides/gt_libng.ng

clean:
	rm -f *~ lib/*~ bin/*~ npm-debug.log

publish:
	npm publish
