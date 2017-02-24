test: dump

dump:
	bin/ngdump /Users/davep/Google\ Drive/Norton\ Guides/ACEBASE.ng

dir:
	bin/ngdir /Users/davep/Google\ Drive/Norton\ Guides/*.{NG,ng}

clean:
	rm -f *~ lib/*~ bin/*~ npm-debug.log

