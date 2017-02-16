function DEBUG( s ) {
    console.log( s );
}

function NortonGuide( path ) {
    "use strict";

    // Use filesystem functions.
    const fs = require( "fs" );

    // Remember who we are.
    const self = this;

    // Handy constants.
    const MAGIC_EH = "EH";
    const MAGIC_NG = "NG";
    const ENCODING = "ascii";

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
        if ( decrypt ) {
            for ( const char of str.entries() ) {
                str[ char[ 0 ] ] = decryptByte( char[ 1 ] );
            }
        }
        return str.toString( ENCODING );
    }

    // Helps us keep track of the sizes of the parts of the header. More of a
    // useful nod back to the old C structure than anything else.
    const headerStruct = {
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
                        hMagic     = buffer.toString( ENCODING, 0, 2 );
                        hMenuCount = readWord( buffer, 6, false );
                        hTitle     = readString( buffer, 8, 40, false );
                        hCredits   = [ readString( buffer,  48, 66, false ) ];
                        hCredits.push( readString( buffer, 114, 66, false ) );
                        hCredits.push( readString( buffer, 180, 66, false ) );
                        hCredits.push( readString( buffer, 246, 66, false ) );
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
        return ( hMagic === MAGIC_NG ) || ( hMagic === MAGIC_EH );
    };

    this.type = function type() {
        if ( hMagic === MAGIC_NG ) {
            return "Norton Guide";
        } else if ( hMagic === MAGIC_EH ) {
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

    this.credits = function credits() {
        return hCredits;
    }
}

var ng = new NortonGuide( "/Users/davep/Google Drive/Norton Guides/cars.ng" );

ng.open( () => {
    if ( ng.isNG() ) {
        DEBUG( "That looks like a Norton Guide" );
        DEBUG( "It was likely built with " + ng.type() );
        DEBUG( "Menu count: " + ng.menuCount() );
        DEBUG( "Title: " + ng.title() );
        DEBUG( "Credits: " + ng.credits() );
    } else {
        DEBUG( "I don't think that's a Norton Guide" );
    }
} );
