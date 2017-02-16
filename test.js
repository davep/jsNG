function DEBUG( s ) {
    console.log( s );
}

var NortonGuide = require( "./jsNG.js" );

var ng = new NortonGuide( "/Users/davep/Google Drive/Norton Guides/cars.ng" );

ng.open( () => {
    if ( ng.isNG() ) {
        DEBUG( "Reading " + ng.filename() );
        DEBUG( "That looks like a Norton Guide" );
        DEBUG( "It was likely built with " + ng.type() );
        DEBUG( "Menu count: " + ng.menuCount() );
        DEBUG( "Title: " + ng.title() );
        DEBUG( "Credits: " + ng.credits() );
    } else {
        DEBUG( "I don't think that's a Norton Guide" );
    }
} );
