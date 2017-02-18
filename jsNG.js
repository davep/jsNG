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

        // Return the current position.
        pos: () => {
            return offset;
        },

        // Go to a given position.
        go: ( n ) => {
            return offset = n;
        },

        // Skip bytes in the buffer.
        skip: ( n ) => {
            offset += ( n || 1 );
        },

        // Read a single byte.
        readByte: ( decrypt ) => {
            const byte = buffer[ offset ];
            self.skip();
            return decrypt ? decryptByte( byte ) : byte;
        },

        // Read a (2 byte) word.
        readWord: ( decrypt ) => {
            const lo = self.readByte( decrypt );
            const hi = self.readByte( decrypt );
            return ( hi << 8 ) + lo;
        },

        // Read a (4 byte) long.
        readLong: ( decrypt ) => {
            const lo = self.readWord( decrypt );
            const hi = self.readWord( decrypt );
            return ( hi << 16 ) + lo;
        },

        // Read a string.
        readString: ( length, decrypt ) => {

            // Pull out the substring we want.
            const substr = buffer.slice( offset, offset + length );

            // Make a buffer to hold it.
            const str = new Buffer( length );

            // Copy it over (so we don't destroy the original).
            substr.copy( str );

            // If we're decrypting...
            if ( decrypt ) {
                for ( const char of str.entries() ) {
                    str[ char[ 0 ] ] = decryptByte( char[ 1 ] );
                }
            }

            // Skip past what we read.
            self.skip( length );

            // Return what we got.
            return nulTrim( str ).toString( ENCODING );
        },

        // Read a nul-terminated string.
        readStringZ: ( maxlen, decrypt ) => {

            // Remember where we are.
            const sav = self.pos();

            // Read a string up to the max length.
            const str = self.readString( maxlen, decrypt );

            // Now skip to the legnth of it.
            self.go( sav + str.length + 1 );

            // Return the string.
            return str;
        },

        // Un-RLE a string.
        expand: ( str ) => {
            // TODO
            return str;
        }

    };

    return self;
}

function NGMenu( ng ) {
    "use strict";

    // Handy constants.
    const MAX_PROMPT_LEN = 128;

    // Remember who we are.
    const self = this;

    // Skip the byte size of the menu section.
    ng.readWord();

    // Read the number of prompts.
    const promptCount = ng.readWord( true ) - 1;

    console.log( "Prompt count: " + promptCount );

    // Skip 20 bytes.
    ng.skip( 20 );

    // This will hold the prompts.
    const prompts = [];

    // Set up the array of prompts, while also loading the offsets.
    for ( let i = 0; i < promptCount; i++ ) {
        prompts.push( {
            prompt: "",
            offset: ng.readLong( true )
        } );
    }

    // Skip a number of unknown values.
    ng.skip( ( promptCount + 1 ) * 8 );

    // Get the title of the menu.
    const title = ng.expand( ng.readStringZ( MAX_PROMPT_LEN, true ) );
    console.log( "Title: [" + title + "]" );

    // Now load each of the prompts.
    for ( let i = 0; i < promptCount; i++ ) {
        prompts[ i ].prompt = ng.expand( ng.readStringZ( MAX_PROMPT_LEN, true ) );
        console.log( "SubPrompt: [" + prompts[ i ].prompt + "]" );
    }

    // Skip an unknown byte. Can't remember what it's for.
    ng.skip();
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

    function skipEntry() {
        ng.skip( 22 + ng.readWord( true ) );
    }

    function loadMenu() {
        // TODO:
        console.log( "Found a menu!" );
        new NGMenu( ng );
    }

    function readMenus() {

        let i = 0;

        do {
            switch ( ng.readWord( true ) ) {
                case ENTRY.SHORT:
                    console.log( "Skipping short" );
                case ENTRY.LONG:
                    console.log( "Skipping long" );
                    skipEntry();
                    break;
                case ENTRY.MENU:
                    loadMenu();
                    ++i;
                    break;
                default:
                    // TODO: Oops.
                    console.log( "Not a valid entry type. Crapping out." );
                    return;
            }
        }
        while ( i < self.menuCount() );
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
