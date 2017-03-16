/*

     ngserve - Tool for serving Norton Guide files as web pages.
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

// Line parser for text from a guide.
function NGLineParser( params ) {
    "use strict";

    const nop = () => undefined;

    // Format handler functions.
    this.text        = params.text        || nop;
    this.colour      = params.colour      || params.color || nop;
    this.normal      = params.normal      || nop;
    this.bold        = params.bold        || nop;
    this.unbold      = params.unbold      || this.normal;
    this.reverse     = params.reverse     || nop;
    this.unreverse   = params.unreverse   || this.normal;
    this.underline   = params.underline   || nop;
    this.ununderline = params.ununderline || this.normal;
    this.charVal     = params.charVal     || nop;

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
                        this.unbold();
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
                        this.unreverse();
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
                        this.ununderline();
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

// Turn a character into a "plain" character.
function PlainChar( c ) {
    "use strict";

    let i = c.charCodeAt( 0 );

    switch ( i ) {
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
        default:
            if ( ( i < 32 ) || ( i > 0x7E ) ) {
                return ".";
            }
    }

    return c;
}

// Clean up a string so it has pretty plain characters.
function MakePlain( s ) {
    "use strict";
    return s.split( "" ).map( PlainChar ).join( "" );
}

// Turn a character into something that'll still look like a DOS character.
function DOSifyChar( c ) {
    "use strict";

    const MAP = {
        1:   "\u263A",
        2:   "\u263B",
        3:   "\u2665",
        4:   "\u2666",
        5:   "\u2663",
        6:   "\u2660",
        7:   "\u2022",
        8:   "\u25DB",
        9:   "\u25CB",
        10:  "\u25D9",
        11:  "\u2642",
        12:  "\u2640",
        13:  "\u266A",
        14:  "\u266B",
        15:  "\u263C",
        16:  "\u25BA",
        17:  "\u25C4",
        18:  "\u2195",
        19:  "\u203C",
        20:  "\u00B6",
        21:  "\u00A7",
        22:  "\u25AC",
        23:  "\u21A8",
        24:  "\u2191",
        25:  "\u2193",
        26:  "\u2192",
        27:  "\u2190",
        28:  "\u221F",
        29:  "\u2194",
        30:  "\u25B2",
        31:  "\u25BC",
        127: "\u2302",
        128: "\u00C7",
        129: "\u00FC",
        130: "\u00E9",
        131: "\u00E2",
        132: "\u00E4",
        133: "\u00E0",
        134: "\u00E5",
        135: "\u00E7",
        136: "\u00EA",
        137: "\u00EB",
        138: "\u00E8",
        139: "\u00EF",
        140: "\u00EE",
        141: "\u00EC",
        142: "\u00C4",
        143: "\u00C5",
        144: "\u00C9",
        145: "\u00E6",
        146: "\u00C6",
        147: "\u00F4",
        148: "\u00F6",
        149: "\u00F2",
        150: "\u00FB",
        151: "\u00F9",
        152: "\u00FF",
        153: "\u00D6",
        154: "\u00DC",
        155: "\u00A2",
        156: "\u00A3",
        157: "\u00A5",
        158: "\u20A7",
        159: "\u0192",
        160: "\u00E1",
        161: "\u00ED",
        162: "\u00F3",
        163: "\u00FA",
        164: "\u00F1",
        165: "\u00D1",
        166: "\u00AA",
        167: "\u00BA",
        168: "\u00BF",
        169: "\u2319",
        170: "\u00AC",
        171: "\u00BD",
        172: "\u00BC",
        173: "\u00A1",
        174: "\u00AB",
        175: "\u00BB",
        176: "\u2591",
        177: "\u2592",
        178: "\u2593",
        179: "\u2502",
        180: "\u2524",
        181: "\u2561",
        182: "\u2562",
        183: "\u2556",
        184: "\u2555",
        185: "\u2563",
        186: "\u2551",
        187: "\u2557",
        188: "\u255D",
        189: "\u255C",
        190: "\u255B",
        191: "\u2510",
        192: "\u2514",
        193: "\u2534",
        194: "\u252C",
        195: "\u251C",
        196: "\u2500",
        197: "\u253C",
        198: "\u255E",
        199: "\u255F",
        200: "\u255A",
        201: "\u2554",
        202: "\u2596",
        203: "\u2566",
        204: "\u2560",
        205: "\u2550",
        206: "\u256C",
        207: "\u2567",
        208: "\u2568",
        209: "\u2564",
        210: "\u2565",
        211: "\u2559",
        212: "\u2558",
        213: "\u2552",
        214: "\u2553",
        215: "\u256B",
        216: "\u256A",
        217: "\u251B",
        218: "\u250C",
        219: "\u2588",
        220: "\u2584",
        221: "\u258C",
        222: "\u2590",
        223: "\u2580",
        224: "\u03B1",
        225: "\u00DF",
        226: "\u0393",
        227: "\u03C0",
        228: "\u03A3",
        229: "\u03C3",
        230: "\u00B5",
        231: "\u03C4",
        232: "\u03A6",
        233: "\u039B",
        234: "\u03A9",
        235: "\u03b4",
        236: "\u221E",
        237: "\u03C6",
        238: "\u03B5",
        239: "\u2229",
        240: "\u2261",
        241: "\u00B1",
        242: "\u2265",
        243: "\u2264",
        244: "\u2320",
        245: "\u2321",
        246: "\u00F7",
        248: "\u00B0",
        249: "\u2219",
        250: "\u00B7",
        251: "\u221A",
        252: "\u207F",
        253: "\u00B2",
        254: "\u25A0",
        255: "\u00A0"
    };

    return MAP[ c.charCodeAt( 0 ) ] || PlainChar( c );
}

// Clean up a string so it has DOS-like characters.
function MakeDOSish( s ) {
    "use strict";
    return s.split( "" ).map( DOSifyChar ).join( "" );
}

// Parse a NG line into plain text (in other words strip off control codes).
function NGLine2PlainText( line ) {
    "use strict";
    let s = "";
    ( new NGLineParser( {
        text:    t => s += MakePlain( t ),
        charVal: c => s += MakePlain( String.fromCharCode( c ) )
    } ) ).parse( line );
    return s;
}

// Parse a NG line into text that's terminal-friendly.
function NGLine2TerminalText( line ) {
    "use strict";

    const FG_MAP = [
        "0;30", "0;34", "0;32", "0;36", "0;31", "0;35", "0;33", "0;37",
        "1;30", "1;34", "1;32", "1;36", "1;31", "1;35", "1;33", "1;37"
    ];
    const BG_MAP = [
        "40", "44", "42", "46", "41", "45", "43", "47",
        "40", "44", "42", "46", "41", "45", "43", "47"
    ];

    const esc = s => "\u001b[" + s;
    let   s   = "";

    ( new NGLineParser( {
        text:      t  => s += MakeDOSish( t ),
        colour:    c  => s += esc( FG_MAP[ c & 0xF ] + ";" + BG_MAP[ c >> 4 ] + "m" ),
        normal:    () => s += esc( "0m" ),
        bold:      () => s += esc( "1m" ),
        reverse:   () => s += esc( "7m" ),
        underline: () => s += esc( "4m" ),
        charVal:   c  => s += MakeDOSish( String.fromCharCode( c ) )
    } ) ).parse( line );

    return s + esc( "0m" );
}

// Export the parse things.
module.exports.Line = {
    Parser:         NGLineParser,
    toPlainText:    NGLine2PlainText,
    toTerminalText: NGLine2TerminalText
};

// Export some support functions.
module.exports.Tool = {
    makePlain:  MakePlain,
    makeDOSish: MakeDOSish
};
