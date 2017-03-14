# jsNG

[![npm](https://img.shields.io/npm/v/jsng.svg?style=flat-square)](https://www.npmjs.com/package/jsng)
[![Build Status](https://travis-ci.org/davep/jsNG.svg?branch=master)](https://travis-ci.org/davep/jsNG)

## Introduction

jsNG is a package that contains a library for reading Norton Guide database
files, plus some command line tools for working with them, the most notable
of which
is [`ngserve`](https://github.com/davep/jsNG/blob/develop/bin/ngserve) -- a
simple web server for serving up NG files as web pages.

You can always get the latest version of jsNG
from [GitHub](https://github.com/davep/jsNG) as well as
from [npmjs](https://www.npmjs.com/package/jsng).

Please see the [ChangeLog](ChangeLog.md) for a history of the development
jsNG.

jsNG is developed by [Dave Pearson](http://www.davep.org/).

## The library

At the heart of jsNG is a library that contains the following packages:

### jsNG

This module exports the following:

#### `Guide`

This is the main Norton Guide object. Use this to open and read the content
of a Norton Guide. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );
```

Once an object has been created for a guide, the following methods can be
used to work with it:

##### `open( fatalNonNG )`

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

##### `isNG()`

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

##### `type()`

Returns the type of the open guide as a two-character string. Either `NG` if
it's a guide that was built with Norton Guide, or `EH` if it's a guide that
was built with Expert Help.

See [`Constants`](#constants) below for the `MAGIC` values that relate to
this.

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

##### `typeDesc()`

Returns a description of the type of the open guide. Either `Norton Guide`
if the guide with built with Norton Guide, or `Expert Help` if the guide was
built with `Expert Help`.

See [`Constants`](#constants) below for the `MAGIC` values that relate to
this.

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

##### `menuCount()`

Returns a count of the top-level menus for the guide. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {
  guide.open();
  console.log( `Menu count: ${guide.menuCount()}.` );
} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `hasMenus()`

Function to check if the guide has any top-level menus. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {
  guide.open();
  if ( guide.hasMenus() ) {
    console.log( `Menu count: ${guide.menuCount()}.` );
  } else {
    console.log( "There are no menus for this guide." );
  }
} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `menus()`

Returns the array of menus for the guide. Each item in the array is an
instance of `NGMenu`.

For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {
  guide.open();
  if ( guide.hasMenus() ) {
    for ( let menu of guide.menus() ) {
      console.log( `Menu: ${menu.title()}` );
    }
  }
} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `title()`

Returns the title of the guide. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {
  guide.open();
  console.log( `Title: ${guide.title()}.` );
} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `filename()`

Returns the filename for the guide. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {
  guide.open();
  console.log( `We opened: ${guide.filename()}.` );
} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `credits()`

Returns an array of the lines of text that are the credits for the guide.
For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {
  guide.open().credits().forEach( ( line ) => console.log( line ) );
} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `firstEntry()`

Returns the location of the first entry in the guide.

##### `pos()`

Returns our current position in the guide.

##### `size()`

Returns the size of the guide in bytes.

##### `goFirst()`

Move the current read position (as reported by `pos()`) to the first entry
in the guide.

##### `gotoEntry( pos )`

Move the current read position (as reported by `pos()`) to the given
position in the guide.

##### `loadEntry( pos )`

Loads and returns an `NGEntry` from the guide. If `pos` is given the entry
is loaded from that position; if `pos` isn't given the entry is loaded from
the current position. Note that `pos()` remains unchanged after calling
`loadEntry()`.

For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {

  guide.open();

  const entry = guide.goFirst().loadEntry();

  console.log( `The first entry is of type ${entry.type()}.` );

} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `nextEntry()`

Moves the guide's `pos()` to the start of the next entry in the guide. For
example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {

  guide.open();

  const entry = guide.goFirst().nextEntry().loadEntry();

  console.log( `The second entry is of type ${entry.type()}.` );

} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `currentEntryType()`

Returns the type of the entry at the current position. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {

  guide.open().goFirst();

  console.log( `The first entry is of type ${guide.currentEntryType()}.` );

} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `lookingAtShort()`

Checks if the current `pos()` is looking at a short type entry. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {

  guide.open().goFirst();

  if ( guide.lookingAtShort() ) {
    console.log( "We're looking at a short entry." );
  } else {
    console.log( "We're looking at a long entry." );
  }

} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `lookingAtLong()`

Checks if the current `pos()` is looking at a long type entry. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {

  guide.open().goFirst();

  if ( guide.lookingAtLong() ) {
    console.log( "We're looking at a long entry." );
  } else {
    console.log( "We're looking at a short entry." );
  }

} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `isEntryAt( pos )`

Checks if `pos` is a valid location in the guide and if there is a valid
entry at that location. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {

  guide.open();

  if ( guide.isEntryAt( 1234 ) ) {
    console.log( "By some odd coincidence, there is an entry there!" );
  } else {
    console.log( "No surprises: there's not a valid entry at that location." );
  }

} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `eof()`

Checks if we appear to be at the end of the guide. For example:

```js
const NG    = require( "jsNG" );
const guide = new NG.Guide( "test.ng" );

try {

    guide.open().goFirst();

    let count = 0;

    while ( !guide.eof() ) {
        const entry = guide.loadEntry();
        count++;
        guide.nextEntry();
    }

    console.log( `Entry count: ${count}` );

} catch ( e ) {
  console.log( "Error" + e.message );
}
```

#### `version`

Provides the version number of jsNG.

#### `Constants`

