const TEST_GUIDE_DIR = __dirname + "/guides/";
const TEST_GUIDE     = TEST_GUIDE_DIR + "eg.ng";
const NON_GUIDE      = TEST_GUIDE_DIR + "not-an.ng";

assert = require( "assert" );
fs     = require( "fs" );

describe( "NG", () => {

    const NG = require( "../lib/jsNG" );

    it( "Should have a verson number", () => {
        assert.ok( NG.version );
    } );

    it( "Should create an instance", () => {
        const guide = new NG.Guide( TEST_GUIDE );
    } );

    describe( "open", () => {

        it( "Should open " + TEST_GUIDE + " without a problem", () => {
            const guide = new NG.Guide( TEST_GUIDE ).open();
        } );

        it( "Should throw an error when failing to open a non-existing guide", () => {
            assert.throws( () => {
                const guide = new NG.Guide( TEST_GUIDE + "-does-not-exist" ).open();
            } );
        } );

        it( "Should throw an error when opening a non-NG file that exists", () => {
            assert.throws( () => {
                const guide = new NG.Guide( NON_GUIDE ).open();
            } );
        } );

    } );

    describe( "Header", () => {

        const guide = new NG.Guide( TEST_GUIDE ).open();

        it( "Should have a title",
            () => assert.ok( guide.title() ) );
        it( "Should have the correct title",
            () => assert.strictEqual( guide.title(), "Expert Guide" ) );
        it( "Should be of the correct type",
            () => assert.strictEqual( guide.type(), NG.Constants.MAGIC.NG.Code ) );
        it( "Should have the correct menu count",
            () => assert.strictEqual( guide.menuCount(), 1 ) );
        it( "Should believe it has menus",
            () => assert.ok( guide.hasMenus() ) );
        it( "Should have the correct number of menus loaded",
            () => assert.strictEqual( guide.menus().length, guide.menuCount() ) );
        it( "Should have the correct menu",
            () => assert.strictEqual( guide.menus()[ 0 ].title(), "Expert Guide" ) );
        it( "Should have a correct menu prompt under the first menu",
            () => assert.strictEqual( guide.menus()[ 0 ].prompts()[ 0 ], "Welcome To EG" ) );
        it( "Should return the filename",
            () => assert.ok( guide.filename() ) );
        it( "Should return the return the first entry location",
            () => assert.strictEqual( guide.firstEntry(), 452 ) );
        it( "Should return the correct first credit line",
            () => assert.strictEqual( guide.credits()[ 0 ], "Expert Guide" ) );
        it( "Should return the correct second credit line",
            () => assert.strictEqual( guide.credits()[ 1 ], "Copyright (c) 1997-2015 David A. Pearson" ) );
        it( "Should return the correct third credit line",
            () => assert.strictEqual( guide.credits()[ 2 ], "" ) );
        it( "Should return the correct fourth credit line",
            () => assert.strictEqual( guide.credits()[ 3 ], "email: davep@davep.org" ) );
        it( "Should return the correct fifth credit line",
            () => assert.strictEqual( guide.credits()[ 4 ], "  web: http://www.davep.org/" ) );
        it( "Should have the correct size",
            () => assert.strictEqual( guide.size(), fs.statSync( guide.filename() ).size ) );
    } );

    describe( "Entries", () => {

        describe( "First entry", () => {

            const guide = new NG.Guide( TEST_GUIDE ).open().goFirst();

            it( "Should be a short entry type",
                () => assert.ok( guide.lookingAtShort() ) );

            const entry = guide.loadEntry();

            it( "Should read in okay",
                () => assert.ok( entry ) );
            it( "Should have the correct number of lines",
                () => assert.strictEqual( entry.lineCount(), 13 ) );
            it( "Should have no see-alsos",
                () => assert.ok( !entry.hasSeeAlso() ) );
            it( "Should have no parent line",
                () => assert.strictEqual( entry.parentLine(), -1 ) );
            it( "Should have a parent menu",
                () => assert.strictEqual( entry.parentMenu(), 0 ) );
            it( "Should have a parent menu prompt",
                () => assert.strictEqual( entry.parentPrompt(), 0 ) );
            it( "Should not have a previous entry",
                () => assert.strictEqual( entry.previous(), 0 ) );
            it( "Should not have a next entry",
                () => assert.strictEqual( entry.next(), 0 ) );
            it( "Should have a lines array of the correct length",
                () => assert.strictEqual( entry.lines().length, entry.lineCount() ) );
            it( "Should self-identify as a short entry",
                () => assert.ok( entry.isShort() ) );
            it( "Should not self-identify as a long entry",
                () => assert.ok( !entry.isLong() ) );
            it( "Should not have a see-also menu",
                () => assert.ok( entry.seeAlso() === undefined ) );
            it( "Should have read the text of the first line correctly",
                () => assert.strictEqual( entry.lines()[ 0 ], "Welcome to Expert Guide." ) );
        } );

        describe( "Next entry", () => {

            const guide = new NG.Guide( TEST_GUIDE ).open().goFirst().nextEntry();

            it( "Should show as being at EOF",
                () => assert.ok( guide.eof() ) );
            it( "Should not be reporting as being a short",
                () => assert.ok( !guide.lookingAtShort() ) );
            it( "Should not be reporting as being a long",
                () => assert.ok( !guide.lookingAtLong() ) );
        } );
    } );
} );
