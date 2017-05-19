/*

     jsNGBuffer - Code that handles buffering Norton Guide files.
     Copyright (C) 2017 David A Pearson

     This program is free software; you can redistribute it and/or modify it
     under the terms of the GNU General Public License as published by the
     Free Software Foundation; either version 2 of the license, or (at your
     option) any later version.

     This program is distributed in the hope that it will be useful, but
     WITHOUT ANY WARRANTY; without even the implied warranty of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
     General Public License for more details.

     You should have received a copy of the GNU General Public License along
     with this program; if not, write to the Free Software Foundation, Inc.,
     675 Mass Ave, Cambridge, MA 02139, USA.

*/

// Wraps a buffer so we can track where we're at in it, move around it, read
// from it and decrypt the content.
module.exports = function NGBuffer( buffer ) {
    "use strict";

    // Encoding to use when reading the buffer.
    const ENCODING = "binary";

    // Track the offset that we're working at in the buffer.
    let offset = 0;

    this.eof = () => offset >= buffer.length; // At or past EOF?
    this.pos = () => offset;                  // Current location.

    // Go to a given position.
    this.go = ( n ) => {
        offset = n;
        return this;
    };

    // Skip bytes in the buffer.
    this.skip = ( n ) => {
        offset += ( n || 1 );
        return this;
    };

    // NG decryption.
    function decryptByte( byte ) {
        return byte ^ 0x1A;
    }

    // Read a single byte.
    this.readByte = ( decrypt = true ) => {
        const byte = buffer[ offset ];
        this.skip();
        return decrypt ? decryptByte( byte ) : byte;
    };

    // Read a (2 byte) word.
    this.readWord = ( decrypt ) => {
        const lo = this.readByte( decrypt );
        const hi = this.readByte( decrypt );
        return ( hi << 8 ) + lo;
    };

    // Read a (4 byte) long.
    this.readLong = ( decrypt ) => {
        const lo = this.readWord( decrypt );
        const hi = this.readWord( decrypt );
        return ( hi << 16 ) + lo;
    };

    // Trim any nuls off the end of a buffer.
    function nulTrim( s ) {
        const n = s.indexOf( 0, ENCODING );
        if ( n != -1 ) {
            return s.slice( 0, n );
        }
        return s;
    }

    // Read a string.
    this.readString = ( length, decrypt = true ) => {

        // Pull out the substring we want.
        const substr = buffer.slice( offset, offset + length );

        // Make a buffer to hold it.
        const str = new Buffer( length );

        // Copy it over (so we don't destroy the original).
        substr.copy( str );

        // If we're decrypting...
        if ( decrypt ) {
            for ( let [ i, b ] of str.entries() ) {
                str[ i ] = decryptByte( b );
            }
        }

        // Skip past what we read.
        this.skip( length );

        // Return what we got.
        return nulTrim( str ).toString( ENCODING );
    };

    // Read a nul-terminated string.
    this.readStringZ = ( maxlen, decrypt = true ) => {

        // Remember where we are.
        const sav = this.pos();

        // Read a string up to the max length.
        const str = this.readString( maxlen, decrypt );

        // Now skip to the legnth of it.
        this.go( sav + str.length + 1 );

        // Return the string.
        return str;
    };

    // Character that says we're about to RLE something.
    const RLE_MARKER = 0xFF;

    // Un-RLE a string.
    this.expand = ( str ) => {

        const len    = str.length;
        let   result = "";
        let   jump;
        let   rle;

        for ( let i = 0; i < len; i++ ) {

            // If the current character is an RLE marker, and we're not
            // at the end of the string.
            if ( ( str.charCodeAt( i ) === RLE_MARKER ) && ( i < ( len - 1 ) ) ) {

                // We'll be jumping the next character.
                jump = true;
                // Because it's a count of characters to unroll.
                rle = str.charCodeAt( i + 1 );

                // If the RLE count is an RLE marker...
                if ( rle === RLE_MARKER ) {
                    // ...just assume this needs to be a space. I'm not
                    // sure if this is correct, but I've seen this crop
                    // up in some guides and it seems to (visually) have
                    // this effect.
                    result += " ";
                } else {
                    result += new Array( rle + 1 ).join( " " );
                }
            } else if ( !jump ) {
                // Not jumping. Add to the result.
                result += str[ i ];
            } else {
                // Jumping. Mark that we won't jump the next.
                jump = false;
            }
        }

        return result;
    }

    // Clean a string of RLE markers, without expanding.
    this.clean = str => str.replace( new RegExp( String.fromCharCode( RLE_MARKER ), "g" ), " " );

    return this;
};
