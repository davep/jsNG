# jsNG

[![npm](https://img.shields.io/npm/v/jsng.svg?style=flat-square)](https://www.npmjs.com/package/jsng)
[![Build Status](https://travis-ci.org/davep/jsNG.svg?branch=master)](https://travis-ci.org/davep/jsNG)

## Introduction

jsNG is a package that contains a library for reading Norton Guide database
files, plus some command line tools for working with them, the most notable
of which is `ngserve` -- a simple web server for serving up NG files as web
pages.

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
const guide = NG.Guide( "test.ng" );
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
const guide = NG.Guide( "test.ng" );

try {
  guide.open();
} catch ( e ) {
  console.log( "Error" + e.message );
}
```

##### `isNG()`

##### `type()`

##### `typeDesc()`

##### `menuCount()`

##### `hasMenus()`

##### `menus()`

##### `title()`

##### `filename()`

##### `credits()`

##### `firstEntry()`

##### `pos()`

##### `size()`

##### `goFirst()`

##### `gotoEntry( pos )`

##### `loadEntry( pos )`

##### `nextEntry()`

##### `currentEntryType()`

##### `lookingAtShort()`

##### `lookingAtLong()`

##### `isEntryAt()`

##### `eof()`

#### `version`

Provides the version number of jsNG.

#### `Constants`

