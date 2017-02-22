// Handy constants.
const TITLE_LEN      = 40;
const CREDIT_LEN     = 66;
const MAX_PROMPT_LEN = 128;
const MAX_LINE_LEN   = 1024;

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

// Wraps a buffer so we can track where we're at in it, move around it, read
// from it and decrypt the content.
function NGBuffer( buffer ) {
    "use strict";

    // Remember who we are.
    const self = this;

    // Encoding to use when reading the buffer.
    const ENCODING = "binary";

    // Default value wrapper for the decrypt flag.
    function decryptdefault( d ) {
        return d === undefined ? true : d;
    }

    // Track the offset that we're working at in the buffer.
    let offset = 0;

    self.eof = () => offset >= buffer.length; // At or past EOF?
    self.pos = () => offset;                  // Current location.

    // Go to a given position.
    self.go = ( n ) => {
        offset = n;
        return self;
    };

    // Skip bytes in the buffer.
    self.skip = ( n ) => {
        offset += ( n || 1 );
        return self;
    };

    // NG decryption.
    function decryptByte( byte ) {
        return byte ^ 0x1A;
    }

    // Read a single byte.
    self.readByte = ( decrypt ) => {
        const byte = buffer[ offset ];
        self.skip();
        return decryptdefault( decrypt ) ? decryptByte( byte ) : byte;
    };

    // Read a (2 byte) word.
    self.readWord = ( decrypt ) => {
        const lo = self.readByte( decrypt );
        const hi = self.readByte( decrypt );
        return ( hi << 8 ) + lo;
    };

    // Read a (4 byte) long.
    self.readLong = ( decrypt ) => {
        const lo = self.readWord( decrypt );
        const hi = self.readWord( decrypt );
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
    self.readString = ( length, decrypt ) => {

        // Pull out the substring we want.
        const substr = buffer.slice( offset, offset + length );

        // Make a buffer to hold it.
        const str = new Buffer( length );

        // Copy it over (so we don't destroy the original).
        substr.copy( str );

        // If we're decrypting...
        if ( decryptdefault( decrypt ) ) {
            for ( const char of str.entries() ) {
                str[ char[ 0 ] ] = decryptByte( char[ 1 ] );
            }
        }

        // Skip past what we read.
        self.skip( length );

        // Return what we got.
        return nulTrim( str ).toString( ENCODING );
    };

    // Read a nul-terminated string.
    self.readStringZ = ( maxlen, decrypt ) => {

        // Remember where we are.
        const sav = self.pos();

        // Read a string up to the max length.
        const str = self.readString( maxlen, decrypt );

        // Now skip to the legnth of it.
        self.go( sav + str.length + 1 );

        // Return the string.
        return str;
    };

        // Un-RLE a string.
    self.expand = ( str ) => {

        const len    = str.length;
        let   result = "";
        let   jump;
        let   rle;

        for ( let i = 0; i < len; i++ ) {

            // If the current character is an RLE marker, and we're not
            // at the end of the string.
            if ( ( str.charCodeAt( i ) == 0xff ) && ( i < ( len - 1 ) ) ) {

                // We'll be jumping the next character.
                jump = true;
                // Because it's a count of characters to unroll.
                rle = str.charCodeAt( i + 1 );

                // If the RLE count is an RLE marker...
                if ( rle == 0xff ) {
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

    return self;
}

// Loads a menu from the given NGBuffer.
function NGMenu( ng ) {
    "use strict";

    // Remember who we are.
    const self = this;

    // Skip the byte size of the menu section.
    ng.readWord();

    // Read the number of prompts.
    const promptCount = ng.readWord() - 1;

    // Skip 20 bytes.
    ng.skip( 20 );

    // This will hold the prompts.
    const prompts = [];

    // Set up the array of prompts, while also loading the offsets.
    for ( let i = 0; i < promptCount; i++ ) {
        prompts.push( {
            prompt: "",
            offset: ng.readLong()
        } );
    }

    // Skip a number of unknown values.
    ng.skip( ( promptCount + 1 ) * 8 );

    // Get the title of the menu.
    const title = ng.expand( ng.readStringZ( MAX_PROMPT_LEN ) );

    // Now load each of the prompts.
    for ( let i = 0; i < promptCount; i++ ) {
        prompts[ i ].prompt = ng.expand( ng.readStringZ( MAX_PROMPT_LEN ) );
    }

    // Skip an unknown byte. Can't remember what it's for.
    ng.skip();

    // Access to the menu's details.
    self.title       = ()    => title;
    self.promptCount = ()    => promptCount;
    self.prompt      = ( i ) => prompts[ i ].prompt;
    self.offset      = ( i ) => prompts[ i ].offset;

    return self;
}

// Loads a see-also from the given NGBuffer.
function NGSeeAlso( ng ) {
    "use strict";

    // Max number of see also items we'll handle. This is the limit
    // published in the Expert Help Compiler manual and, while this limit
    // isn't really needed in this code, it does help guard against corrupt
    // guides.
    const MAX_SEE_ALSO = 20;

    // Remember who we are.
    const self = this;

    // Get the number of see also entries.
    const seeAlsoCount = Math.min( ng.readWord(), MAX_SEE_ALSO );

    // Holds the seealsos.
    const seeAlsos = [];

    // Read the offsets for each of the entries.
    for ( let i = 0; i < seeAlsoCount; i++ ) {
        seeAlsos.push( {
            prompt: "",
            offset: ng.readLong()
        } );
    }

    // Now read the seealsos themselves.
    for ( let i = 0; i < seeAlsoCount; i++ ) {
        seeAlsos[ i ].prompt = ng.expand( ng.readStringZ( MAX_PROMPT_LEN ) );
    }

    // Access the see-also info.
    self.seeAlsoCount = ()    => seeAlsoCount;
    self.prompts      = ()    => seeAlsos.map( ( seeAlso ) => seeAlso.prompt );
    self.seeAlso      = ( i ) => seeAlsos[ i ].prompt;
    self.offset       = ( i ) => seeAlsos[ i ].offset;

    return self;
}

// Loads a short or long entry from the given NGBuffer.
function NGEntry( ng ) {
    "use strict";

    // Remember who we are.
    const self = this;

    // Load up the main details of the entry.
    const offset       = ng.pos();
    const type         = ng.readWord();
    const size         = ng.readWord();
    const lineCount    = ng.readWord();
    const hasSeeAlso   = ng.readWord();
    const parentLine   = ng.readWord();
    const parent       = ng.readLong();
    const parentMenu   = ng.readWord();
    const parentPrompt = ng.readWord();
    const previous     = ng.readLong();
    const next         = ng.readLong();
    const offsets      = new Array( lineCount );
    const lines        = new Array( lineCount );
    let   seeAlso;

    // Access to the simple values of the entry.
    self.offset       = () => offset;
    self.type         = () => type;
    self.lineCount    = () => lineCount;
    self.hasSeeAlso   = () => hasSeeAlso > 0;
    self.parentLine   = () => parentLine;
    self.parent       = () => parent       == -1     ? 0  : parent;
    self.parentMenu   = () => parentMenu   == 0xffff ? -1 : parentMenu;
    self.parentPrompt = () => parentPrompt == 0xffff ? -1 : parentPrompt;
    self.previous     = () => previous     == -1     ? 0  : previous;
    self.next         = () => next         == -1     ? 0  : next;
    self.lines        = () => lines;
    self.isShort      = () => type == ENTRY.SHORT;
    self.isLong       = () => type == ENTRY.LONG;
    self.seeAlso      = () => seeAlso;

    // Read the text for the entry.
    function readText() {

        for ( let i = 0; i < self.lineCount(); i++ ) {
            lines[ i ] = ng.expand( ng.readStringZ( MAX_LINE_LEN ) );
        }
    }

    function loadShort() {

        // For each of the lines we need to load...
        for ( let i = 0; i < self.lineCount(); i++ ) {

            // Skip a word.
            ng.readWord();

            // Load the offset of the line.
            offsets[ i ] = ng.readLong();
        }

        // Now read the text.
        readText( self, ng );
    }

    function loadLong() {

        // Read the text of the entry.
        readText( self, ng );

        // If the entry has see-also entries...
        if ( self.hasSeeAlso() ) {
            // ...read those too.
            seeAlso = new NGSeeAlso( ng );
        }
    }

    if ( self.isShort() ) {
        loadShort();
    } else if ( self.isLong() ) {
        loadLong();
    } else {
        throw new Error( "Unknown entry type" );
    }

    return self;
}

// Main Norton Guide object.
module.exports = function NortonGuide( path ) {
    "use strict";

    // Use filesystem functions.
    const fs = require( "fs" );

    // Remember who we are.
    const self = this;

    // Holds the content of the guide.
    let ng;

    // Header values.
    let magic;
    let menuCount;
    let title;
    let credits;

    // Holds location of the first entry in the guide.
    let firstEntry;

    // Get the size of the given file.
    function fsize( file ) {
        try {
            return fs.statSync( file ).size;
        } catch ( err ) {
            return -1;
        }
    }

    // Read the header information from the buffer.
    function readHeader() {

        // Load up the magic number.
        magic = ng.readString( 2, false );

        // Check that it looks like a guide. Not much point in going on if
        // it doesn't.
        if ( self.isNG() ) {

            // Skip a couple of unknown values.
            ng.skip( 2 );
            ng.skip( 2 );

            // Get the count of menus.
            menuCount = ng.readWord( false );

            // Get the title of the guide.
            title = ng.readString( TITLE_LEN, false );

            // Load up the credits.
            credits   = [ ng.readString( CREDIT_LEN, false ) ];
            credits.push( ng.readString( CREDIT_LEN, false ) );
            credits.push( ng.readString( CREDIT_LEN, false ) );
            credits.push( ng.readString( CREDIT_LEN, false ) );
            credits.push( ng.readString( CREDIT_LEN, false ) );
        }
    }

    // Skip a guide entry.
    function skipEntry() {
        ng.skip( 22 + ng.readWord() );
    }

    // Holds the menus.
    const menus = [];

    // Read the menus from a guide.
    function readMenus() {

        let i = 0;

        do {
            switch ( ng.readWord() ) {
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

    // Open the guide for reading.
    this.open = function open() {

        let f;

        try {
            // Open the file.
            f = fs.openSync( path, "r" );
        } catch ( e ) {
            // For now, re-throw the error.
            throw e;
        }

        try {

            // Get the size of the file.
            const size = fsize( path );

            // Make a buffer big enough to hold the content of the file.
            ng = new Buffer( size );

            // Fill the buffer with the content of the file.
            if ( fs.readSync( f, ng, 0, size, 0 ) == size ) {

                // Having got this far, turn it into a NG buffer.
                ng = new NGBuffer( ng );

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
                throw new Error( "Could not read the whole file." );
            }

        } finally {
            fs.closeSync( f );
        }

        return self;
    };

    // Access to information about the guide.
    this.isNG       = ()    => magic in MAGIC;
    this.type       = ()    => MAGIC[ magic ] ? magic : "??";
    this.typeDesc   = ()    => MAGIC[ magic ] || "Unknown";
    this.menuCount  = ()    => menuCount;
    this.hasMenus   = ()    => self.menuCount() > 0;
    this.menu       = ( i ) => menus[ i ];
    this.title      = ()    => title;
    this.filename   = ()    => path;
    this.credits    = ()    => credits;
    this.firstEntry = ()    => firstEntry;

    // Perform a function while not changing position.
    function unmoved( f ) {
        const pos    = ng.pos();
        const result = f();
        ng.go( pos );
        return result;
    }

    // Go to the first entry.
    this.goFirst = () => {
        ng.go( self.firstEntry() );
        return self;
    };

    // Go to a given entry.
    this.gotoEntry = ( i ) => {
        ng.go( i );
        return self;
    };

    // Load an entry.
    this.loadEntry = ( pos ) => {
        return unmoved( () => {
            // If we've been given a position to load from...
            if ( pos ) {
                // ...go to that position.
                self.gotoEntry( pos );
            }
            // Load the entry at the current postion.
            return new NGEntry( ng );
        } );
    };

    // Skip to the next entry.
    this.nextEntry = () => {
        // Eat the ID byte.
        ng.skip( 2 );
        // Then skip the entry.
        skipEntry();
        // Allow chaining.
        return self;
    };

    // Peek a the current type.
    this.currentEntryType = () => unmoved( () => ng.readWord() );

    // Are we currently looking at a short?
    this.lookingAtShort = () => self.currentEntryType() == ENTRY.SHORT;

    // Are we currentEntryType looking at a long?
    this.lookingAtLong = () => self.currentEntryType() == ENTRY.LONG;

    // Does it look like we're at the EOF?
    this.eof = () => {

        // If the guide says we're at EOF...
        if ( ng.eof() ) {
            // ...we're at EOF.
            return true;
        }

        // Otherwise, if we don't seem to be looking at a valid entry type,
        // act as if we're at EOF so things don't go badly for a broken
        // guide.
        return !self.lookingAtShort() && !self.lookingAtLong();

    };
};