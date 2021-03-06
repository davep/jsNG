# jsNG

This module exports the following:

## `Guide`

This is the main Norton Guide object. Use this to open and read the content
of a Norton Guide. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );
```

Once an object has been created for a guide, the following methods can be
used to work with it:

### `open( fatalNonNG )`

This opens the guide. If the file does not exist, or other file opening
errors happen, the normal file IO exception will be thrown. If the file
exists but, upon opening, it doesn't look like a valid Norton Guide or
Expert Help file, an `NGError` will be thrown. Passing `fatalNonNG` as
`false` will disable the latter behaviour.

Example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {
  guide.open();
} catch ( e ) {
  console.log( "Error" + e.message );
}
```

### `isNG()`

Lets you check if the file actually is a Norton Guide or Expert Help file.
This, of course, only makes sense if you've used `open` in its non-fatal
mode.

Example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {

  guide.open( false );

  if ( guide.isNG() ) {
    console.log( "Yay! It's a NG/EH file!" );
  } else {
    console.log( "That doesn't look like a NG/EH file." );
  }

} catch ( e ) {
  console.log( "Error" + e.message );
}
```

### `type()`

Returns the type of the open guide as a two-character string. Either `NG` if
it's a guide that was built with Norton Guide, or `EH` if it's a guide that
was built with Expert Help.

See [`Constants`](#constants) below for the [`MAGIC`](#magic) values that
relate to this.

Example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {

  guide.open( false );

  if ( guide.isNG() ) {
    console.log( `Yay! It's a ${guide.type()} file!` );
  } else {
    console.log( "That doesn't look like a NG/EH file." );
  }

} catch ( e ) {
  console.log( "Error" + e.message );
}
```

### `typeDesc()`

Returns a description of the type of the open guide. Either `Norton Guide`
if the guide with built with Norton Guide, or `Expert Help` if the guide was
built with `Expert Help`.

See [`Constants`](#constants) below for the [`MAGIC`](#magic) values that
relate to this.

Example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {

  guide.open( false );

  if ( guide.isNG() ) {
    console.log( `Yay! It's a ${guide.typeDesc()} file!` );
  } else {
    console.log( "That doesn't look like a NG/EH file." );
  }

} catch ( e ) {
  console.log( "Error" + e.message );
}
```

### `menuCount()`

Returns a count of the top-level menus for the guide. For example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open();

console.log( `Menu count: ${guide.menuCount()}.` );
```

### `hasMenus()`

Function to check if the guide has any top-level menus. For example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open();

if ( guide.hasMenus() ) {
  console.log( `Menu count: ${guide.menuCount()}.` );
} else {
  console.log( "There are no menus for this guide." );
}
```

### `menus()`

Returns the array of menus for the guide. Each item in the array is an
instance of `NGMenu`.

For example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open();

if ( guide.hasMenus() ) {
  for ( let menu of guide.menus() ) {
    console.log( `Menu: ${menu.title()}` );
  }
}
```

### `title()`

Returns the title of the guide. For example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open();

console.log( `Title: ${guide.title()}.` );
```

### `filename()`

Returns the filename for the guide. For example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open();

console.log( `We opened: ${guide.filename()}.` );
```

### `credits()`

Returns an array of the lines of text that are the credits for the guide.
For example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open();

guide.credits().forEach( ( line ) => console.log( line ) );
```

### `firstEntry()`

Returns the location of the first entry in the guide.

### `pos()`

Returns our current position in the guide.

### `size()`

Returns the size of the guide in bytes.

### `goFirst()`

Move the current read position (as reported by `pos()`) to the first entry
in the guide.

### `gotoEntry( pos )`

Move the current read position (as reported by `pos()`) to the given
position in the guide.

### `loadEntry( pos )`

Loads and returns an `NGEntry` from the guide. If `pos` is given the entry
is loaded from that position; if `pos` isn't given the entry is loaded from
the current position. Note that `pos()` remains unchanged after calling
`loadEntry()`.

For example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open();

const entry = guide.goFirst().loadEntry();

console.log( `The first entry is of type ${entry.type()}.` );
```

### `nextEntry()`

Moves the guide's `pos()` to the start of the next entry in the guide. For
example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open();
const entry = guide.goFirst().nextEntry().loadEntry();

console.log( `The second entry is of type ${entry.type()}.` );
```

### `currentEntryType()`

Returns the type of the entry at the current position. For example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open().goFirst();

console.log( `The first entry is of type ${guide.currentEntryType()}.` );
```

### `lookingAtShort()`

Checks if the current `pos()` is looking at a short type entry. For example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open().goFirst();

if ( guide.lookingAtShort() ) {
  console.log( "We're looking at a short entry." );
} else {
  console.log( "We're looking at a long entry." );
}
```

### `lookingAtLong()`

Checks if the current `pos()` is looking at a long type entry. For example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open().goFirst();

if ( guide.lookingAtLong() ) {
  console.log( "We're looking at a long entry." );
} else {
  console.log( "We're looking at a short entry." );
}
```

### `isEntryAt( pos )`

Checks if `pos` is a valid location in the guide and if there is a valid
entry at that location. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

guide.open();

if ( guide.isEntryAt( 1234 ) ) {
  console.log( "By some odd coincidence, there is an entry there!" );
} else {
  console.log( "No surprises: there's not a valid entry at that location." );
}
```

### `eof()`

Checks if we appear to be at the end of the guide. For example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open().goFirst();

let count = 0;

while ( !guide.eof() ) {
  const entry = guide.loadEntry();
  count++;
  guide.nextEntry();
}

console.log( `Entry count: ${count}` );
```

### `Symbol.iterator`

Provides a handy iterator for working through the entries in the guide. For
example:

```js
const NG    = require( "jsNG" );
const guide = ( new NG.Guide( "test.ng" ) ).open().goFirst();

let count = 0;
for ( let entry of guide ) {
  count++;
}

console.log( `Entry count: ${count}` );
```

## `version`

Provides the version number of jsNG.

## `Constants`

### `MAGIC`

Object that contains the constants for the guide type "magic numbers". Looks
like this:

```js
const MAGIC = {
    EH: { Code: "EH", Name: "Expert Help"  },
    NG: { Code: "NG", Name: "Norton Guide" }
};
```

### `ENTRY`

Object that contains the values for the different types of guide entry.
Looks like this:

```js
const ENTRY = {
    SHORT: 0,
    LONG:  1,
    MENU:  2
};
```
