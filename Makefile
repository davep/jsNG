test: dump

dump:
	bin/ngdump /Users/davep/Google\ Drive/Norton\ Guides/ACEBASE.ng

dir:
	bin/ngdir /Users/davep/Google\ Drive/Norton\ Guides/*.{NG,ng}

about:
	bin/ngabout /Users/davep/Google\ Drive/Norton\ Guides/ACEBASE.ng

tests: dump dir about

clean:
	rm -f *~ lib/*~ bin/*~ npm-debug.log

