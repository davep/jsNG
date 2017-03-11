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

// Things we require.
const NGBuffer  = require( "./jsNGBuffer" );
const NGContent = require( "./jsNGContent" );
const NGError   = require( "./jsNGError" );
const NGMenu    = NGContent.NGMenu;
const NGSeeAlso = NGContent.NGSeeAlso;
const NGEntry   = NGContent.NGEntry;

// Handy constants.
const TITLE_LEN  = 40;
const CREDIT_LEN = 66;

// Magic number constants.
const MAGIC = {
    EH: { Code: "EH", Name: "Expert Help"  },
    NG: { Code: "NG", Name: "Norton Guide" }
};

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
                case NGContent.ENTRY.SHORT:
                case NGContent.ENTRY.LONG:
                    skipEntry( ng );
                    break;
                case NGContent.ENTRY.MENU:
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
    this.lookingAtShort = () => this.currentEntryType() === NGContent.ENTRY.SHORT;

    // Are we currentEntryType looking at a long?
    this.lookingAtLong = () => this.currentEntryType() === NGContent.ENTRY.LONG;

    // Does the given pointer look like a valid entry?
    this.isEntryAt = ( pos ) => unmoved( () => {
        if ( pos > 0 ) {
            ng.go( pos );
            return !this.eof();
        }
        return false;
    } );

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

// Export some general things.
module.exports.Guide     = NortonGuide;
module.exports.version   = "0.0.9";
module.exports.Constants = { "MAGIC": MAGIC, "ENTRY": NGContent.ENTRY };
