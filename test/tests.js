const TEST_GUIDE_DIR = __dirname + "/guides/";
const TEST_GUIDE     = TEST_GUIDE_DIR + "eg.ng";
const NON_GUIDE      = TEST_GUIDE_DIR + "not-an.ng";

assert = require( "assert" );

describe( "NG", () => {

    const NG = require( "../lib/jsNG" );

    it( "Should have a verson number.", () => {
        assert.ok( NG.version );
    } );

    it( "Should create an instance.", () => {
        const guide = new NG.Guide( TEST_GUIDE );
    } );

    describe( "open", () => {

        it( "Should open " + TEST_GUIDE + " without a problem.", () => {
            const guide = new NG.Guide( TEST_GUIDE ).open();
        } );

        it( "Should throw an error when failing to open a non-existing guide.", () => {
            assert.throws( () => {
                const guide = new NG.Guide( TEST_GUIDE + "-does-not-exist" ).open();
            } );
        } );

        it( "Should throw an error when opening a non-NG file that exists.", () => {
            assert.throws( () => {
                const guide = new NG.Guide( NON_GUIDE ).open();
            } );
        } );

    } );

    describe( "Header", () => {

        const guide = new NG.Guide( TEST_GUIDE ).open();

        it( "Should have a title.",
            () => assert.ok( guide.title() ) );
        it( "Should have the correct title.",
            () => assert.strictEqual( guide.title(), "Expert Guide" ) );
        it( "Should be of the correct type.",
            () => assert.strictEqual( guide.type(), "NG" ) );
        it( "Should have the correct menu count.",
            () => assert.strictEqual( guide.menuCount(), 1 ) );
        it( "Should believe it has menus.",
            () => assert.ok( guide.hasMenus() ) );
        it( "Should return the filename.",
            () => assert.ok( guide.filename() ) );
        it( "Should return the return the first entry location.",
            () => assert.strictEqual( guide.firstEntry(), 452 ) );
        it( "Should return the correct first credit line.",
            () => assert.strictEqual( guide.credits()[ 0 ], "Expert Guide" ) );
        it( "Should return the correct second credit line.",
            () => assert.strictEqual( guide.credits()[ 1 ], "Copyright (c) 1997-2015 David A. Pearson" ) );
        it( "Should return the correct third credit line.",
            () => assert.strictEqual( guide.credits()[ 2 ], "" ) );
        it( "Should return the correct fourth credit line.",
            () => assert.strictEqual( guide.credits()[ 3 ], "email: davep@davep.org" ) );
        it( "Should return the correct fifth credit line.",
            () => assert.strictEqual( guide.credits()[ 4 ], "  web: http://www.davep.org/" ) );
    } );
} );
