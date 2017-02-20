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

    // Now load each of the prompts.
    for ( let i = 0; i < promptCount; i++ ) {
        prompts[ i ].prompt = ng.expand( ng.readStringZ( MAX_PROMPT_LEN, true ) );
    }

    // Skip an unknown byte. Can't remember what it's for.
    ng.skip();

    // Access to the menu's title.
    self.title = () => {
        return title;
    };

    // Access to the menu's prompt count.
    self.promptCount = () => {
        return promptCount;
    };

    // Access to the menu prompt titles.
    self.prompt = ( i ) => {
        return prompts[ i ].prompt;
    };

    // Access to the menu prompt offsets.
    self.offset = ( i ) => {
        return prompts[ i ].offset;
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

    // Holds the content of the guide.
    let ng;

    // Header values.
    let hMagic;
    let hMenuCount;
    let hTitle;
    let hCredits;

    // General values for tracking what we're doing.
    let firstEntry;

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

            // Size of the strings in the header.
            const TITLE_LEN  = 40;
            const CREDIT_LEN = 66;

            // Get the title of the guide.
            hTitle = ng.readString( TITLE_LEN, false );

            // Load up the credits.
            hCredits   = [ ng.readString( CREDIT_LEN, false ) ];
            hCredits.push( ng.readString( CREDIT_LEN, false ) );
            hCredits.push( ng.readString( CREDIT_LEN, false ) );
            hCredits.push( ng.readString( CREDIT_LEN, false ) );
            hCredits.push( ng.readString( CREDIT_LEN, false ) );
        }
    }

    function skipEntry() {
        ng.skip( 22 + ng.readWord( true ) );
    }

    // Holds the menus.
    const menus = [];

    function readMenus() {

        let i = 0;

        do {
            switch ( ng.readWord( true ) ) {
                case ENTRY.SHORT:
                case ENTRY.LONG:
                    skipEntry();
                    break;
                case ENTRY.MENU:
                    menus.push( new NGMenu( ng ) );
                    ++i;
                    break;
                default:
                    // Found something we don't understand. Probably a good
                    // idea to give up at this point.
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

                // At this point, we should be sat on the first entry.
                firstEntry = ng.pos();

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
    };

    this.menuCount = function menuCount() {
        return hMenuCount;
    };

    this.hasMenus = function hasMenus() {
        return self.menuCount() > 0;
    };

    this.menu = function menu( i ) {
        return menus[ i ];
    };

    this.title = function title() {
        return hTitle;
    };

    this.credits = function credits() {
        return hCredits;
    };

    this.firstEntry = function firstEntry() {
        return firstEntry;
    };

    this.goFirst = function goFirst() {
        ng.go( self.firstEntry() );
    };
};
