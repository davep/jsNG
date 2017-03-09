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
const MAX_PROMPT_LEN = 128;
const MAX_LINE_LEN   = 1024;

// Guide entry magic numbers.
const ENTRY = {
    SHORT: 0,
    LONG:  1,
    MENU:  2
};

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
    const options = [];

    // Read the offsets for each of the entries.
    for ( let i = 0; i < seeAlsoCount; i++ ) {
        offsets.push( ng.readLong() );
    }

    // Now read the seealsos themselves.
    for ( let i = 0; i < seeAlsoCount; i++ ) {
        prompts.push( ng.expand( ng.readStringZ( MAX_PROMPT_LEN ) ) );
    }

    // Now, for ease of access for some applications, make a list that is
    // the prompts and offsets together.
    for ( let i = 0; i < seeAlsoCount; i++ ) {
        options.push( { prompt: prompts[ i ], offset: offsets[ i ] } );
    }

    // Access the see-also info.
    this.seeAlsoCount = () => seeAlsoCount;
    this.prompts      = () => prompts;
    this.offsets      = () => offsets;
    this.options      = () => options;

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
    this.parentMenu   = () => parentMenu   === 0xffff ? -1 : parentMenu;
    this.parentPrompt = () => parentPrompt === 0xffff ? -1 : parentPrompt;
    this.previous     = () => previous     === -1     ? 0  : previous;
    this.next         = () => next         === -1     ? 0  : next;
    this.hasParent    = () => this.parent()   != 0;
    this.hasPrevious  = () => this.previous() != 0;
    this.hasNext      = () => this.next()     != 0;
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

// Export some things.
module.exports = {
    NGMenu:    NGMenu,
    NGSeeAlso: NGSeeAlso,
    NGEntry:   NGEntry,
    ENTRY:     ENTRY
};
