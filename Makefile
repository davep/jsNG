tests:
	npm test

dump:
	bin/ngdump /Users/davep/Google\ Drive/Norton\ Guides/ACEBASE.ng

dir:
	bin/ngdir /Users/davep/Google\ Drive/Norton\ Guides/*.{NG,ng}

about:
	bin/ngabout /Users/davep/Google\ Drive/Norton\ Guides/ACEBASE.ng

clean:
	rm -f *~ lib/*~ bin/*~ npm-debug.log

publish:
	npm publish
