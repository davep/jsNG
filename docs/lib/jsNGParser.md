# jsNGParser

This module contains tools for handling the formatting of the content of
Norton Guide files. It exports the following:

## `Line.Parser( params )`

This is a function that lets you turn Norton Guide formatted text into
something useful for your application. It is done by passing an object that
contains functions that will react to specific formatting events. Those
events are:

### `text`

Called any time processed text should be added to your output.

### `colour( attr )`

Called any time a colour should be set. `attr` is the colour value that
should be set. Please consult any old DOS programmer's manual
for
[the colour values this represents](https://en.wikipedia.org/wiki/BIOS_color_attributes).

### `normal`

Called any time the text attributes should be set back to normal. A call to
set to normal generally means that *all* other active attributes should be
disabled.

### `bold`

Called any time the following text should be bold. Bold should be stopped if
`unbold` or `normal` are called.

### `unbold`

Called if `bold` should be stopped. Defaults to calling `normal` if not
provided.

### `reverse`

Called any time the following text should be set to reverse. Reverse should
be stopped if `unreverse` or `normal` are called.

### `unreverse`

Called if `reverse` should be stopped. Defaults to calling `normal` if not
provided.

### `underline`

Called any time the following text should be set to underline. Underline
should be stopped if `ununderline` or `normal` are called.

### `ununderline`

Called if `underline` should be stopped. Defaults to calling `normal` if not
provided.

### `charval( char )`

Called when a specific character should be added to the output. The value
given will generally be one that
represents
[a character in code page 447](https://en.wikipedia.org/wiki/Code_page_437).

Using the above, it should be possible to create any form of output based on
the text in a guide entry. Here's an example where `Line.Parser` is used to
strip all markup from the text:

```js
const NGParser = require( "jsNGParser" );
let   s        = "";

// Assume line has come from a guide.

( new NGParser.Line.Parser( {
  text:    t => s += t,
  charVal: c => s += String.fromCharCode( c )
} ) ).parse( line );

console.log( s );
}
```

As a slightly more involved example,
here's
[the code of `toTerminalText`](https://github.com/davep/jsNG/blob/v0.0.10/lib/jsNGParser.js#L417-L444):

```js
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

    const esc = ( s ) => "\u001b[" + s;
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
```

## `Line.toPlainText( line )`

Utility function that takes a line of NG marked-up text and converts it to
plain text. All attributes are dropped and all text is, where possible,
turned into "pure ASCII" text. This can be handy if you want to quickly
generate some text from the guide.

For example:

```js
const NG       = require( "jsNG" );
const NGParser = require( "jsNGParser" );
const entry    = ( new NG.Guide( "test.ng" ).open().goFirst().loadEntry();

entry.lines().forEach( ( line ) => console.log( NGParser.Line.toPlainText( line ) ) );
```

## `Line.toTerminalText( line ))`

Utility function that takes a long of NG marked-up text and converts it to
coloured text, complete with CP437 to utf-8 character conversions, such that
it should be suitable for display in an ANSI terminal. This can be handy if
you quickly want to render an entry in a terminal display.

For example:

```js
const NG       = require( "jsNG" );
const NGParser = require( "jsNGParser" );
const entry    = ( new NG.Guide( "test.ng" ).open().goFirst().loadEntry();

entry.lines().forEach( ( line ) => console.log( NGParser.Line.toTerminalText( line ) ) );
```

The `jsNGParser` module also exports a couple of handy utility functions
that should help with converting from CP437 text to something more useful:

## `Tool.makePlain( s )`

Utility function that takes a body CP437 text and turns it into "plain"
text. All lower and most upper characters are turned into a "." and most
box-drawing characters are turned into ASCII-friendly characters that come
close to making sense (things like "|", "-" and "+").

## `Tool.makeDOSish( s )`

Utility function that takes a body of CP437 text and turns it into utf8 text
that should look more or less the same. Handy if you want to try and make
the output of a guide look similar to how it would have in the original
Norton Guide reader on a DOS machine.
