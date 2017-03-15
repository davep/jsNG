# jsNGContent

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

Called if `bold` should be stopped.

### `reverse`

Called any time the following text should be set to reverse. Reverse should
be stopped if `unreverse` or `normal` are called.

### `unreverse`

Called if `reverse` should be stopped.

### `underline`

Called any time the following text should be set to underline. Underline
should be stopped if `ununderline` or `normal` are called.

### `ununderline`

Called if `underline` should be stopped.

### `charval( char )`

Called when a specific character should be added to the output. The value
given will generally be one that
represents
[a character in code page 447](https://en.wikipedia.org/wiki/Code_page_437).

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

## `Tool.makePlain`

## `Tool.makeDOSish`
