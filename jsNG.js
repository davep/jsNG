function NGBuffer( buffer ) {
    "use strict";

    // Encoding to use when reading the buffer.
    const ENCODING = "ascii";

    // NG decryption.
    function decryptByte( byte ) {
        return byte ^ 0x1A;
    }

    // Trim any nuls off the end of a buffer.
    function nulTrim( s ) {
        const n = s.indexOf( 0, ENCODING );
        if ( n != -1 ) {
            return s.slice( 0, n );
        }
        return s;
    }

    // Track the offset that we're working at in the buffer.
    let offset = 0;

    // Main body of functions that work on the buffer.
    let self = {

        // Skip bytes in the buffer.
        skip: ( n ) => {
            offset += ( n || 1 );
        },

        // Read a single byte.
        readByte: ( decrypt ) => {
            const byte = buffer[ offset ];
            if ( decrypt ) {
                return decryptByte( byte );
            }
            self.skip();
            return byte;
        },

        // Read a (2 byte) word.
        readWord: ( decrypt ) => {
            const lo = self.readByte( decrypt );
            const hi = self.readByte( decrypt );
            return ( hi << 8 ) + lo;
        },

        // Read a string.
        readString: ( length, decrypt ) => {
            const str = buffer.slice( offset, offset + length );
            if ( decrypt ) {
                for ( const char of str.entries() ) {
                    str[ char[ 0 ] ] = decryptByte( char[ 1 ] );
                }
            }
            self.skip( length );
            return nulTrim( str ).toString( ENCODING );
        }

    };

    return self;
}

module.exports = function NortonGuide( path ) {
    "use strict";

    // Use filesystem functions.
    const fs = require( "fs" );

    // Remember who we are.
    const self = this;

    // Magic number constants.
    const MAGIC = {
        EH: "Expert Help",
        NG: "Norton Guide"
    };

    // Guide entry magic numbers.
    const ENTRY = {
        SHORT: 0,
        LONG:  1,
        MENU:  2
    };

    // Given a "structure" (in other words an object with key/value pairs
    // that are the size of the structures found inside an NG file) return
    // the total size of it.
    function sizeOf( struct ) {
        return Object.keys( struct ).reduce( ( total, key ) => {
            return total + struct[ key ];
        }, 0 );
    }

    // Helps us keep track of the sizes of the parts of the header. More of a
    // useful nod back to the old C structure than anything else.
    const headerStruct = {
        usMagic     : 2,
        sUnknown    : 2,
        sUnknown2   : 2,
        usMenuCount : 2,
        szTitle     : 40,
        szCredits0  : 66,
        szCredits1  : 66,
        szCredits2  : 66,
        szCredits3  : 66,
        szCredits4  : 66
    };

    // Holds the content of the guide.
    let ng;

    // Header values.
    let hMagic;
    let hMenuCount;
    let hTitle;
    let hCredits;

    function fsize( file ) {
        try {
            return fs.statSync( file ).size;
        } catch ( err ) {
            return -1;
        }
    }

    function readHeader() {

        // Load up the magic number.
        hMagic = ng.readString( 2, false );

        // Check that it looks like a guide. Not much point in going on if
        // it doesn't.
        if ( self.isNG() ) {

            // Skip a couple of unknown values.
            ng.skip( 2 );
            ng.skip( 2 );

            // Get the count of menus.
            hMenuCount = ng.readWord( false );

            // Get the title of the guide.
            hTitle = ng.readString( headerStruct.szTitle, false );

            // Load up the credits.
            hCredits   = [ ng.readString( headerStruct.szCredits0, false ) ];
            hCredits.push( ng.readString( headerStruct.szCredits1, false ) );
            hCredits.push( ng.readString( headerStruct.szCredits2, false ) );
            hCredits.push( ng.readString( headerStruct.szCredits3, false ) );
            hCredits.push( ng.readString( headerStruct.szCredits4, false ) );
        }
    }

    function readMenus() {
        console.log( "Type: " + ng.readWord( true ) );
    }

    this.filename = function filename() {
        return path;
    }

    this.open = function open() {

        let f;

        try {
            // Open the file.
            f = fs.openSync( path, "r" );
        } catch ( e ) {
            console.log( e );
        }

        try {

            // Get the size of the file.
            const size = fsize( path );

            // Make a buffer big enough to hold the content of the file.
            ng = new Buffer( size );

            // Fill the buffer with the content of the file.
            if ( fs.readSync( f, ng, 0, size, 0 ) == size ) {

                // Having got this far, turn it into a NG buffer.
                ng = NGBuffer( ng );

                // Now read the header.
                readHeader();

                // If it looks like we got a valid NG...
                if ( self.isNG() ) {
                    // If it looks like it has menus...
                    if ( self.hasMenus() ) {
                        // ...load them up.
                        readMenus();
                    }
                }

            } else {
                // TODO: Didn't read it all.
            }

        } finally {
            fs.closeSync( f );
        }

        return self;
    };

    this.isNG = function isNG() {
        return hMagic in MAGIC;
    };

    this.type = function type() {
        return MAGIC[ hMagic ] || "Unknown";
    }

    this.menuCount = function menuCount() {
        return hMenuCount;
    }

    this.hasMenus = function hasMenus() {
        return self.menuCount() > 0;
    }

    this.title = function title() {
        return hTitle;
    }

    this.credits = function credits() {
        return hCredits;
    }
};
