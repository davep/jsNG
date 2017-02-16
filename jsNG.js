function DEBUG( s ) {
    console.log( s );
}

function NortonGuide( path ) {
    "use strict";

    // Use filesystem functions.
    var fs = require( "fs" );

    // Remember who we are.
    var self = this;

    // Helps us keep track of the sizes of the parts of the header. More of a
    // useful nod back to the old C structure than anything else.
    var headerStruct = {
        usMagic     : 2,
        sUnknown    : 2,
        sUnknown2   : 2,
        usMenuCount : 2,
        szTitle     : 40,
        szCredits   : 5 * 66
    };

    // Header values.
    let hMagic;
    let hMenuCount;
    let hTitle;
    let hCredits;

    // Given a "structure" (in other words an object with key/value pairs
    // that are the size of the structures found inside an NG file) return
    // the total size of it.
    function sizeOf( struct ) {
        return Object.keys( struct ).reduce( ( total, key ) => {
            return total + struct[ key ];
        }, 0 );
    }

    function decryptByte( byte ) {
        return byte ^ 0x1A;
    }

    function readByte( buffer, offset, decrypt ) {
        const byte = buffer[ offset ];
        if ( decrypt ) {
            return decryptByte( byte );
        }
        return byte;
    }

    function readWord( buffer, offset, decrypt ) {
        const lo = readByte( buffer, offset,     decrypt );
        const hi = readByte( buffer, offset + 1, decrypt );
        return ( hi << 8 ) + lo;
    }

    function readString( buffer, offset, length, decrypt ) {
        const str = buffer.slice( offset, offset + length );
        // TODO: Decrypt.
        return str.toString( "utf-8" );
    }

    function readHeader( callback ) {
        fs.open( path, "r", ( err, fd ) => {
            if ( err ) {
                callback( self, err );
            } else {
                fs.read( fd, new Buffer( sizeOf( headerStruct ) ), 0, sizeOf( headerStruct ), 0, ( err, bytesRead, buffer ) => {
                    if ( err ) {
                        callback( self, err );
                    } else {
                        // Pull out the bits of header we need.
                        hMagic     = buffer.toString( "utf-8", 0, 2 );
                        hMenuCount = readWord( buffer, 6, false );
                        hTitle     = readString( buffer, 8, 40, false );
                        callback( self );
                    }
                } );
            }
        } );
    }

    this.open = function open( callback ) {
        readHeader( callback );
    };

    this.isNG = function isNG() {
        return ( hMagic === "NG" ) || ( hMagic === "EH" );
    };

    this.type = function type() {
        if ( hMagic === "NG" ) {
            return "Norton Guide";
        } else if ( hMagic === "EH" ) {
            return "Expert Help";
        }
        return "Unknown";
    }

    this.menuCount = function menuCount() {
        return hMenuCount;
    }

    this.title = function title() {
        return hTitle;
    }
}

var ng = new NortonGuide( "/Users/davep/Google Drive/Norton Guides/cars.ng" );

ng.open( () => {
    if ( ng.isNG() ) {
        DEBUG( "That looks like a Norton Guide" );
        DEBUG( "It was likely built with " + ng.type() );
        DEBUG( "Menu count: " + ng.menuCount() );
        DEBUG( "Title: " + ng.title() );
    } else {
        DEBUG( "I don't think that's a Norton Guide" );
    }
} );
