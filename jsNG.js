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

    // Handy constants.
    const MAGIC = {
        EH: "Expert Help",
        NG: "Norton Guide"
    }

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
                        // Wrap up the buffer in an NG buffer.
                        buffer = NGBuffer( buffer );
                        // Pull out the bits of header we need.
                        hMagic     = buffer.readString( 2, false );
                        buffer.skip( 2 );
                        buffer.skip( 2 );
                        hMenuCount = buffer.readWord( false );
                        hTitle     = buffer.readString( headerStruct.szTitle, false );
                        hCredits   = [ buffer.readString( headerStruct.szCredits0, false ) ];
                        hCredits.push( buffer.readString( headerStruct.szCredits1, false ) );
                        hCredits.push( buffer.readString( headerStruct.szCredits2, false ) );
                        hCredits.push( buffer.readString( headerStruct.szCredits3, false ) );
                        hCredits.push( buffer.readString( headerStruct.szCredits4, false ) );
                        callback( self );
                    }
                } );
            }
        } );
    }

    this.filename = function filename() {
        return path;
    }

    this.open = function open( callback ) {
        readHeader( callback );
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

    this.title = function title() {
        return hTitle;
    }

    this.credits = function credits() {
        return hCredits;
    }
};
