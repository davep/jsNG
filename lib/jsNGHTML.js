/*

     jsNGHTML - Library of code to suport HTML-based NG tools.
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

const NGParser = require( "./jsNGParser" );

////////////////////////////////////////////////////////////////////////////
// Escape problematic HTML characters.
function unHTML( s ) {
    return s
        .replace( /&/g, "&amp;"  )
        .replace( /</g, "&lt;"   )
        .replace( />/g, "&gt;"   )
        .replace( /"/g, "&quot;" )
        .replace( /'/g, "&#039;" );
}

////////////////////////////////////////////////////////////////////////////
// Emit colour attribute options for the stylesheet.
function colourOptions() {
    const COLOURS = [
        "black",
        "navy",
        "green",
        "teal",
        "maroon",
        "purple",
        "olive",
        "silver",
        "gray",
        "blue",
        "lime",
        "aqua",
        "red",
        "fuchsia",
        "yellow",
        "white"
    ];
    let s = "";

    for ( let i = 0; i < COLOURS.length; i++ ) {
        s += `
span.bg${i} {
  background: ${COLOURS[ i ]}
}

span.fg${i} {
  color: ${COLOURS[ i ]}
}
`
    }

    return s;
}

////////////////////////////////////////////////////////////////////////////
// Return the standard stylesheet.
function css() {
    return `
body {
  font-family: sans-serif;
  background: dimgray;
}

footer {
  clear: both;
  font-size: 70%;
  color: silver;
  padding: 1ex;
}

.box {
  border: solid 1px silver;
  box-shadow: 4px 4px 7px 0px rgba( 0, 0, 0, 0.2 );
  background: navy;
  color: silver;
}

a {
  text-decoration: none;
  color: inherit;
}

nav a:hover, nav a:hover *, article a:hover, article a:hover * {
  background: red;
  color: white;
}

header nav {
  padding: 0;
  margin-bottom: 1ex;
}

header nav ul {
  padding-left: 1ex;
  padding-top: 0;
  padding-bottom: 0;
}

header nav ul li {
  display: inline-block;
  color: dimgray;
}

header nav ul li::after {
  content: " |";
  color: silver;
}

header nav a {
  color: white;
  padding-left: 1em;
  padding-right: 1em;
}

header nav span {
  padding-left: 1em;
  padding-right: 1em;
}

section nav.menu {
  float: left;
  padding-right: 1ex;
  margin-right: 1ex;
  margin-bottom: 1ex;
}

section nav.menu ul {
  list-style: none;
  padding-left: 1ex;
}

section nav.menu > ul > li {
  color: white;
}

section nav.menu > ul > li > ul > li {
  color: silver;
}

section nav.menu a {
  display: block;
}

nav.seeAlso {
  border-top: solid 1px silver;
  white-space: normal;
  margin-top: 1ex;
}

nav.seeAlso ul {
  padding: 0;
  padding-left: 0.5em;
  margin: 0;
  margin-top: 0.5em;
}

nav.seeAlso ul li:first-child {
  color: white;
}

nav.seeAlso ul li {
  display: inline-block;
  margin-right: 1em;
}

section article {
  overflow: scroll;
  font-family: 'Roboto Mono', monospace;
  padding: 0.5em;
  margin-bottom: 1ex;
}

section article pre {
  font-family: inherit;
  margin: 0;
  padding: 0;
}

section article h1 {
  color: white;
  margin-bottom: 0;
}

section article ul {
  list-style: none;
  padding-left: 1ex;
  white-space: normal;
}

section article span.ngb {
  color: white;
}

section article span.ngu {
  color: fuchsia;
}
${colourOptions()}
section article a {
  width: 100%;
  display: inline-block;
}

@media screen and (max-width: 480px) {

  .box {
    box-shadow: none;
  }

  section nav.menu {
    float: none;
    margin: 0;
  }

  section article {
    clear: both;
  }

  header nav {
    padding: 0;
    margin: 0;
    text-align: center;
  }

  header nav ul, header nav ul a, header nav ul span {
    padding: 0;
  }

  header nav ul li {
    padding-left: 0.5em;
    padding-right: 0.5em;
    display: inline;
  }

  header nav ul li::after {
    content: "";
  }

  header nav ul li:nth-child(2):after {
    content: "\\A";
    white-space: pre;
  }

  section nav.menu li {
    display: inline-block;
  }

  section nav.menu a {
    display: inline-block;
    font-size: 80%;
  }

  section nav.menu ul ul li::after {
    content: " |";
    color: white;
  }

  section article {
    font-size: 80%;
  }
}
`;
}

////////////////////////////////////////////////////////////////////////////
// Emit the standad header.
function dumpHeader( f, title, stylesheet, generator = "jsNG", extras = () => undefined ) {
    f.write( "<!DOCTYPE html>\n" );
    f.write( "<html>\n" );
    f.write( "<head>\n" );
    f.write( '<meta name="viewport" content="width=device-width, initial-scale=1">\n' );
    f.write( '<meta charset="utf-8">\n' );
    f.write( `<meta name="generator" content="${generator}">\n` );
    f.write( `<title>${title}</title>\n` );
    f.write( `<link rel="stylesheet" type="text/css" href="${stylesheet}" />\n` );
    extras( f );
    f.write( "</head>\n" );
    f.write( "<body>\n" );
}

////////////////////////////////////////////////////////////////////////////
// Dump the top navigation section.
function dumpTopNav( f, guide, entry = false, about, urlify = s => s, root ) {

    const addJump = ( name, has, url ) => {
        f.write( "<li>" );
        if ( has ) {
            f.write( `<a href="${url()}">${name}</a>`)
        } else {
            f.write( `<span>${name}</span>` );
        }
        f.write( "</li>\n" );
    };

    f.write( '<header>\n<nav class="box">\n<ul>\n' );

    if ( root ) {
        addJump( root, true, () => "/" );
    }

    addJump( "About",    guide,                        () => about );
    addJump( "Previous", entry && entry.hasPrevious(), () => urlify( entry.previous() ) );
    addJump( "Up",       entry && entry.hasParent(),   () => urlify( entry.parent()   ) );
    addJump( "Next",     entry && entry.hasNext(),     () => urlify( entry.next()     ) );

    f.write( "</ul>\n</nav>\n</header>\n" );
}

////////////////////////////////////////////////////////////////////////////
// Dump the menu to the stream.
function dumpMenu( f, guide, urlify ) {

    if ( guide && ( guide.menus().length > 0 ) ) {
        f.write( '<nav class="menu box">\n<ul>\n' );

        for ( let menu of guide.menus() ) {

            f.write( `<li>${menu.title()}\n` );
            f.write( "<ul>\n" );

            for ( let option of menu.options() ) {
                f.write( `<li><a href="${urlify( option.offset )}">${option.prompt}</a></li>\n` );
            }
            f.write( "</ul>\n</li>\n" );
        }

        f.write( "</ul>\n</nav>\n" );
    }

}

////////////////////////////////////////////////////////////////////////////
// Emit the standard footer.
function dumpFooter( f, guide, advert ) {

    if ( advert ) {
        f.write( '<footer class="box">\n' );
        f.write( advert );
        f.write( "</footer>\n" );
    }

    f.write( "</body>\n" );
    f.write( "</html>\n" );
}

////////////////////////////////////////////////////////////////////////////
// Wrap some content in a standard page.
function dumpPage( f, title, guide, header, topNav, menu, footer, content ) {
    header( f, title );
    topNav( f, guide );
    f.write( "<section>\n" );
    menu( f, guide );
    f.write( '<article class="box">' );
    content( f, guide );
    f.write( "</article>\n" );
    f.write( "</section>\n" );
    footer( f, guide );
}

////////////////////////////////////////////////////////////////////////////
// Dump the about page for a guide.
function dumpAbout( f, guide, header, topNav, menu, footer, graphText ) {
    dumpPage( f,
              `About ${unHTML( NGParser.Tool.makeDOSish( guide.title() ) )}`,
              guide, header, topNav, menu, footer,
              () => {
                  f.write( `<h1>About "${unHTML( NGParser.Tool.makeDOSish( guide.title() ) )}".</h1><hr />\n` );
                  for ( let line of guide.credits() ) {
                      f.write( unHTML( unDOSify( line, graphText ) ) + "\n" );
                  }
              } );
}

////////////////////////////////////////////////////////////////////////////
// Dump an entry to the given stream.
function dumpEntry( f, guide, entry, header, topNav, menu, footer, graphText, urlify, converter ) {

    header( f, entryTitle( guide, entry ), () => {
        if ( entry.hasPrevious() ) f.write( `<link rel="prev" href="${urlify( entry.previous() )}" title="Previous entry" />\n` );
        if ( entry.hasNext()     ) f.write( `<link rel="next" href="${urlify( entry.next() )}" title="Next entry" />\n` );
        f.write( `<link rel="home" href="./" title="Home" />\n` );
    } );

    topNav( f, guide, entry );

    f.write( "<section>\n" );

    menu( f, guide );

    f.write( '<article class="box">' );

    f.write( "<pre>" );
    for ( let i = 0; i < entry.lineCount(); i++ ) {
        if ( entry.isShort() && guide.isEntryAt( entry.offsets()[ i ] ) ) {
            f.write( `<a href="${urlify( entry.offsets()[ i ] )}">${converter( entry.lines()[ i ], graphText )}</a>\n` );
        } else {
            f.write( `${converter( entry.lines()[ i ], graphText )}\n`);
        }
    }
    f.write( "</pre>\n" );

    if ( entry.hasSeeAlso() ) {
        f.write( '<nav class="seeAlso">\n' );
        f.write( "<ul>\n<li>See Also:</li>\n" );
        for ( let seeAlso of entry.seeAlso().options() ) {
            f.write( `<li><a href="${urlify( seeAlso.offset )}">${unHTML( seeAlso.prompt )}</a></li>\n` );
        }
        f.write( "</ul>\n" );
        f.write( "</nav>\n" );
    }

    f.write( "</article>\n" );
    f.write( "</section>\n" );

    footer( f, guide );
}

////////////////////////////////////////////////////////////////////////////
// Convert text from DOS to DOS-a-like.
function unDOSify( s, graphText ) {
    return ( graphText ? NGParser.Tool.makeDOSish : NGParser.Tool.makePlain )( s );
}

////////////////////////////////////////////////////////////////////////////
// Convert an NG line to HTML.
function toHTML( line, graphText ) {
    const stack = [];
    let   s     = "";
    ( new NGParser.Line.Parser( {

        text: t => s += unHTML( unDOSify( t, graphText ) ),

        colour: c => {
            s += `<span class="fg${ c & 0xF } bg${ c >> 4 }">`;
            stack.push( "</span>" );
        },

        normal: () => {
            s += stack.reverse().join( "" );
            stack.length = 0;
        },

        bold: () => {
            s += '<span class="ngb">';
            stack.push( "</span>" );
        },

        unbold: () => {
            s += "</span>";
            stack.pop();
        },

        reverse: () => {
            s += '<span class="ngr">';
            stack.push( "</span>" );
        },

        unreverse: () => {
            s += "</span>";
            stack.pop();
        },

        underline: () => {
            s += '<span class="ngu">';
            stack.push( "</span>" );
        },

        ununderline: () => {
            s += "</span>",
            stack.pop();
        },

        charVal: c => s += unHTML( unDOSify( String.fromCharCode( c ) ) )

    } ) ).parse( line );
    return s + stack.reverse().join( "" );
}

////////////////////////////////////////////////////////////////////////////
// Return a title for the entry.
function entryTitle( guide, entry ) {

    const SEP = " » ";

    let title = unHTML( NGParser.Tool.makeDOSish( guide.title() ) );

    if ( entry.hasParentMenu() ) {
        title += SEP + unHTML( guide.menus()[ entry.parentMenu() ].title() );
        if ( entry.hasParentPrompt() ) {
            title += SEP + unHTML( guide.menus()[ entry.parentMenu() ].prompts()[ entry.parentPrompt() ] );
        }
    }

    return title;
}

// Export the tools.
module.exports = {
    unHTML:     unHTML,
    css:        css,
    dumpHeader: dumpHeader,
    dumpTopNav: dumpTopNav,
    dumpMenu:   dumpMenu,
    dumpFooter: dumpFooter,
    dumpPage:   dumpPage,
    dumpAbout:  dumpAbout,
    dumpEntry:  dumpEntry,
    unDOSify:   unDOSify,
    toHTML:     toHTML,
    entryTitle: entryTitle
};
