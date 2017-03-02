/*

     jsNG - A small JavaScript library for reading Norton Guide files.
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

// Handy constants.
const TITLE_LEN      = 40;
const CREDIT_LEN     = 66;
const MAX_PROMPT_LEN = 128;
const MAX_LINE_LEN   = 1024;
const RLE_MARKER     = 0xFF;

// Magic number constants.
const MAGIC = {
    EH: { Code: "EH", Name: "Expert Help"  },
    NG: { Code: "NG", Name: "Norton Guide" }
};

// Guide entry magic numbers.
const ENTRY = {
    SHORT: 0,
    LONG:  1,
    MENU:  2
};

// Custom error object for NG errors.
function NGError( message ) {
    this.message = message;
    Error.captureStackTrace( this, NGError )
}

// Set NGError up to properly inherit from Error.
NGError.prototype             = Object.create( Error.prototype );
NGError.prototype.name        = "NGError";
NGError.prototype.constructor = NGError;

// Wraps a buffer so we can track where we're at in it, move around it, read
// from it and decrypt the content.
function NGBuffer( buffer ) {
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

    return this;
}

// Loads a menu from the given NGBuffer.
function NGMenu( ng ) {
    "use strict";

    // Skip the byte size of the menu section.
    ng.readWord();

    // Read the number of prompts.
    const promptCount = ng.readWord() - 1;

    // Skip 20 bytes.
    ng.skip( 20 );

    // Holds the prompts and offsets.
    const prompts = [];
    const offsets = [];
    const options = [];

    // Load up the offsets.
    for ( let i = 0; i < promptCount; i++ ) {
        offsets.push( ng.readLong() );
    }

    // Skip a number of unknown values.
    ng.skip( ( promptCount + 1 ) * 8 );

    // Get the title of the menu.
    const title = ng.expand( ng.readStringZ( MAX_PROMPT_LEN ) );

    // Now load each of the prompts.
    for ( let i = 0; i < promptCount; i++ ) {
        prompts.push( ng.expand( ng.readStringZ( MAX_PROMPT_LEN ) ) );
    }

    // Now, for ease of access for some applications, make a list that is
    // the prompts and offsets together.
    for ( let i = 0; i < promptCount; i++ ) {
        options.push( { prompt: prompts[ i ], offset: offsets[ i ] } );
    }

    // Skip an unknown byte. Can't remember what it's for.
    ng.skip();

    // Access to the menu's details.
    this.title       = () => title;
    this.promptCount = () => promptCount;
    this.prompts     = () => prompts;
    this.offsets     = () => offsets;
    this.options     = () => options;

    return this;
}

// Loads a see-also from the given NGBuffer.
function NGSeeAlso( ng ) {
    "use strict";

    // Max number of see also items we'll handle. This is the limit
    // published in the Expert Help Compiler manual and, while this limit
    // isn't really needed in this code, it does help guard against corrupt
    // guides.
    const MAX_SEE_ALSO = 20;

    // Get the number of see also entries.
    const seeAlsoCount = Math.min( ng.readWord(), MAX_SEE_ALSO );

    // Holds the prompts and offsets.
    const prompts = [];
    const offsets = [];

    // Read the offsets for each of the entries.
    for ( let i = 0; i < seeAlsoCount; i++ ) {
        offsets.push( ng.readLong() );
    }

    // Now read the seealsos themselves.
    for ( let i = 0; i < seeAlsoCount; i++ ) {
        prompts.push( ng.expand( ng.readStringZ( MAX_PROMPT_LEN ) ) );
    }

    // Access the see-also info.
    this.seeAlsoCount = () => seeAlsoCount;
    this.prompts      = () => prompts;
    this.offsets      = () => offsets;

    return this;
}

// Loads a short or long entry from the given NGBuffer.
function NGEntry( ng ) {
    "use strict";

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
    this.offset       = () => offset;
    this.type         = () => type;
    this.lineCount    = () => lineCount;
    this.hasSeeAlso   = () => hasSeeAlso > 0;
    this.parentLine   = () => parentLine   === 0xffff ? -1 : parentLine;
    this.parent       = () => parent       === -1     ? 0  : parent;
    this.hasParent    = () => this.parent() != 0;
    this.parentMenu   = () => parentMenu   === 0xffff ? -1 : parentMenu;
    this.parentPrompt = () => parentPrompt === 0xffff ? -1 : parentPrompt;
    this.previous     = () => previous     === -1     ? 0  : previous;
    this.next         = () => next         === -1     ? 0  : next;
    this.lines        = () => lines;
    this.offsets      = () => offsets;
    this.isShort      = () => type === ENTRY.SHORT;
    this.isLong       = () => type === ENTRY.LONG;
    this.seeAlso      = () => seeAlso;

    // Read the text for the entry.
    function readText( entry, ng ) {
        for ( let i = 0; i < entry.lineCount(); i++ ) {
            lines[ i ] = ng.expand( ng.readStringZ( MAX_LINE_LEN ) );
        }
    }

    // Load up a short entry (offsets and lines).
    function loadShort( entry, ng ) {

        // For each of the lines we need to load...
        for ( let i = 0; i < entry.lineCount(); i++ ) {

            // Skip a word.
            ng.skip( 2 );

            // Load the offset of the line.
            offsets[ i ] = ng.readLong();
        }

        // Now read the text.
        readText( entry, ng );
    }

    // Load up a long entry (lines and see also entries, if they exist).
    function loadLong( entry, ng ) {

        // Read the text of the entry.
        readText( entry, ng );

        // If the entry has see-also entries...
        if ( entry.hasSeeAlso() ) {
            // ...read those too.
            seeAlso = new NGSeeAlso( ng );
        }
    }

    if ( this.isShort() ) {
        loadShort( this, ng );
    } else if ( this.isLong() ) {
        loadLong( this, ng );
    } else {
        throw new NGError( "Unknown entry type" );
    }

    return this;
}

// Main Norton Guide object.
function NortonGuide( path ) {
    "use strict";

    // Use filesystem functions.
    const fs = require( "fs" );

    // Holds the content of the guide.
    let ng;

    // Header values.
    let magic;
    let menuCount;
    let title;
    let credits;
    let size;

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
    function readHeader( guide, ng ) {

        // Load up the magic number. I could (and normally should)
        // readWord() this as it's supposed to be a word. But valid guide
        // types always have NG and EH as the words; so save a bit of
        // faffing about...
        magic = ng.readString( 2, false );

        // Check that it looks like a guide. Not much point in going on if
        // it doesn't.
        if ( guide.isNG() ) {

            // Skip unknown values.
            ng.skip( 4 );

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
    function skipEntry( ng ) {
        ng.skip( 22 + ng.readWord() );
    }

    // Holds the menus.
    const menus = [];

    // Read the menus from a guide.
    function readMenus( guide, ng ) {

        let i = 0;

        do {
            switch ( ng.readWord() ) {
                case ENTRY.SHORT:
                case ENTRY.LONG:
                    skipEntry( ng );
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
        } while ( i < guide.menuCount( ng ) );
    }

    // Open the guide for reading.
    this.open = ( fatalNonNG = true ) => {

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
            size = fsize( path );

            // Make a buffer big enough to hold the content of the file.
            ng = new Buffer( size );

            // Fill the buffer with the content of the file.
            if ( fs.readSync( f, ng, 0, size, 0 ) === size ) {

                // Having got this far, turn it into a NG buffer.
                ng = new NGBuffer( ng );

                // Now read the header.
                readHeader( this, ng );

                // If it looks like we got a valid NG...
                if ( this.isNG() ) {
                    // If it looks like it has menus...
                    if ( this.hasMenus() ) {
                        // ...load them up.
                        readMenus( this, ng );
                    }
                } else if ( fatalNonNG ) {
                    // It's not a valid NG. Throw an error.
                    throw new NGError( "File is not a Norton Guide or Expert Help file." );
                }

                // At this point, we should be sat on the first entry.
                firstEntry = ng.pos();

            } else {
                throw new NGError( "Could not read the whole file." );
            }

        } finally {
            fs.closeSync( f );
        }

        return this;
    };

    // Access to information about the guide.
    this.isNG       = () => magic in MAGIC;
    this.type       = () => MAGIC[ magic ] ? magic : "??";
    this.typeDesc   = () => ( MAGIC[ magic ] || { Name: "Unknown" } ).Name;
    this.menuCount  = () => menuCount;
    this.hasMenus   = () => this.menuCount() > 0;
    this.menus      = () => menus;
    this.title      = () => title;
    this.filename   = () => path;
    this.credits    = () => credits;
    this.firstEntry = () => firstEntry;
    this.pos        = () => ng.pos();
    this.size       = () => size;

    // Perform a function while not changing position.
    function unmoved( f ) {
        const pos    = ng.pos();
        const result = f();
        ng.go( pos );
        return result;
    }

    // Go to the first entry.
    this.goFirst = () => {
        ng.go( this.firstEntry() );
        return this;
    };

    // Go to a given entry.
    this.gotoEntry = ( i ) => {
        ng.go( i );
        return this;
    };

    // Load an entry.
    this.loadEntry = ( pos ) => unmoved( () => {
        // If we've been given a position to load from...
        if ( pos ) {
            // ...go to that position.
            this.gotoEntry( pos );
        }
        // Load the entry at the current postion.
        return new NGEntry( ng );
    } );

    // Skip to the next entry.
    this.nextEntry = () => {
        // Eat the ID byte.
        ng.skip( 2 );
        // Then skip the entry.
        skipEntry( ng );
        // Allow chaining.
        return this;
    };

    // Peek a the current type.
    this.currentEntryType = () => unmoved( ng.readWord );

    // Are we currently looking at a short?
    this.lookingAtShort = () => this.currentEntryType() === ENTRY.SHORT;

    // Are we currentEntryType looking at a long?
    this.lookingAtLong = () => this.currentEntryType() === ENTRY.LONG;

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
        return !this.lookingAtShort() && !this.lookingAtLong();

    };

    // Iterator support.
    this[ Symbol.iterator ] = () => {
        let nextpos = this.firstEntry();
        return {
            next: () => unmoved( () => {
                this.gotoEntry( nextpos );
                if ( !this.eof() ) {
                    const val = this.loadEntry();
                    this.nextEntry();
                    nextpos = this.pos();
                    return {
                        value: val,
                        done: false
                    };
                }
                return {
                    done: true
                };
            } )
        };
    };
};

// Line parser for text from a guide.
function NGLineParser( params ) {

    const nop = () => undefined;

    // Format handler functions.
    this.text      = params.text      || nop;
    this.colour    = params.colour    || params.color || nop;
    this.normal    = params.normal    || nop;
    this.bold      = params.bold      || nop;
    this.reverse   = params.reverse   || nop;
    this.underline = params.underline || nop;
    this.charVal   = params.charVal   || nop;

    // Parse the given string.
    this.parse = ( raw ) => {

        const CTRL_CHAR = "^";
        const MODE = {
            NORMAL:    0,
            BOLD:      1,
            UNDERLINE: 2,
            REVERSE:   3,
            ATTR:      4
        };

        let ctrl     = raw.indexOf( CTRL_CHAR );
        let mode     = MODE.NORMAL;
        let lastAttr = -1;

        while ( ( ctrl != -1 ) && ( ctrl < raw.length ) ) {

            // Handle the text.
            this.text( raw.substring( 0, ctrl ) );

            // Handle the control character.
            switch ( raw[ ctrl + 1 ] ) {

                case "A":
                case "a":

                    // Get the colour attribute.
                    const attr = parseInt( "0x" + raw.substring( ctrl + 2, ctrl + 4 ) );

                    // If there's already a colour attribute in effect and
                    // the new colour is the same as the previous colour...
                    if ( ( mode === MODE.ATTR ) && ( attr === lastAttr ) ) {
                        // ...it signals that we return to "normal".
                        this.normal();
                        mode = MODE.NORMAL;
                    } else {
                        // ...otherwise we start a colour attribute.
                        this.colour( lastAttr = attr );
                        mode = MODE.ATTR;
                    }

                    // Skip along the string.
                    ctrl += 4;

                    break;

                case "B":
                case "b":
                    if ( mode === MODE.BOLD ) {
                        this.normal();
                        mode = MODE.NORMAL;
                    } else {
                        this.bold();
                        mode = MODE.BOLD;
                    }
                    ctrl += 2;
                    break;

                case "C":
                case "c":
                    this.charVal( parseInt( "0x" + raw.substring( ctrl + 2, ctrl + 4 ) ) );
                    ctrl += 4;
                    break;

                case "N":
                case "n":
                    this.normal();
                    mode = MODE.NORMAL;
                    ctrl += 2;
                    break;

                case "R":
                case "r":
                    if ( mode === MODE.REVERSE ) {
                        this.normal();
                        mode = MODE.NORMAL;
                    } else {
                        this.reverse();
                        mode = MODE.REVERSE;
                    }
                    ctrl += 2;
                    break;

                case "U":
                case "u":
                    if ( mode === MODE.UNDERLINE ) {
                        this.normal();
                        mode = MODE.NORMAL;
                    } else {
                        this.underline();
                        mode = MODE.UNDERLINE;
                    }
                    ctrl += 2;
                    break;

                case CTRL_CHAR:
                    this.text( CTRL_CHAR );
                    ctrl += 2;
                    break;

                default:
                    ctrl++;
            }

            // Chop the bits we've done off the raw string.
            raw = raw.substring( ctrl );

            // Find the next control character.
            ctrl = raw.indexOf( CTRL_CHAR );
        }

        // Handle any remaining text.
        this.text( raw );
    };
}

// De-DOSify a character.
function SaneChar( c ) {
    switch ( c.charCodeAt( 0 ) ) {
        case 0xB3 :            /* Vertical graphics. */
        case 0xB4 :
        case 0xB5 :
        case 0xB6 :
        case 0xB9 :
        case 0xBA :
        case 0xC3 :
        case 0xCC :
	    return "|";
        case 0xC4 :            /* Horizontal graphics. */
        case 0xC1 :
        case 0xC2 :
        case 0xC6 :
        case 0xC7 :
        case 0xCA :
        case 0xCB :
        case 0xCD :
        case 0xCF :
        case 0xD0 :
        case 0xD1 :
        case 0xD2 :
	    return "-";
        case 0xB7 :            /* Corner graphics. */
        case 0xB8 :
        case 0xBB :
        case 0xBC :
        case 0xBD :
        case 0xBE :
        case 0xBF :
        case 0xC0 :
        case 0xC5 :
        case 0xC8 :
        case 0xC9 :
        case 0xCE :
        case 0xD3 :
        case 0xD4 :
        case 0xD5 :
        case 0xD6 :
        case 0xD7 :
        case 0xD8 :
        case 0xD9 :
        case 0xDA :
	    return "+";
        case 0xDB :            /* Block graphics */
        case 0xDC :
        case 0xDD :
        case 0xDE :
        case 0xDF :
        case 0xB0 :
        case 0xB1 :
        case 0xB2 :
	    return "#";
    }

    return c;
}

// Clean up a string so that it's less DOSy.
function MakeSane( s ) {
    let sane = "";

    for ( let char of s ) {
        sane += SaneChar( char );
    }

    return sane;
}

// Parse a NG line into plain text (in other words strip off control codes).
function NGLine2PlainText( line ) {
    let s = "";
    ( new NGLineParser( {
        text:    t => s += MakeSane( t ),
        charVal: c => s += MakeSane( String.fromCharCode( c ) )
    } ) ).parse( line );
    return s;
}

// Parse a NG line into text that's terminal-friendly.
function NGLine2TerminalText( line ) {

    const FG_MAP = [
        "0;30", "0;34", "0;32", "0;36", "0;31", "0;35", "0;33", "0;37",
        "1;30", "1;34", "1;32", "1;36", "1;31", "1;35", "1;33", "1;37"
    ];
    const BG_MAP = [
        "40", "44", "42", "46", "41", "45", "43", "47",
        "40", "44", "42", "46", "41", "45", "43", "47"
    ];

    const esc = ( s ) => "\u001b[" + s;
    let   s   = "";

    ( new NGLineParser( {
        text:      t  => s += MakeSane( t ),
        colour:    c  => s += esc( FG_MAP[ c & 0xF ] + ";" + BG_MAP[ c >> 4 ] + "m" ),
        normal:    () => s += esc( "0m" ),
        bold:      () => s += esc( "1m" ),
        reverse:   () => s += esc( "7m" ),
        underline: () => s += esc( "4m" ),
        charVal:   c  => s += MakeSane( String.fromCharCode( c ) )
    } ) ).parse( line );

    return s + esc( "0m" );
}

// Export some general things.
module.exports.Guide     = NortonGuide;
module.exports.version   = "0.0.5";
module.exports.Constants = { "MAGIC": MAGIC, "ENTRY": ENTRY };

// Export the parse things.
module.exports.Line = {
    Parser:         NGLineParser,
    toPlainText:    NGLine2PlainText,
    toTerminalText: NGLine2TerminalText
};
