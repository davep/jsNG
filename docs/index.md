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

- [`lib/jsNG.js`](lib/jsNG.md): Core guide object.
- [`lib/jsNGContent.js`](lib/jsNGContent.md): Menu, see-also and entry
  objects.
- [`lib/jsNGParser.js`](lib/jsNGParser.md): Functions for working with the
  formatting codes of a Norton Guide.

## The command line tools

jsNG comes with a handful of command line tools for working with Norton
Guide database files. They include:

- `bin/ngabout` - Display the credits for one or more guides.
- `bin/ngdir` - Display the name and title for one or more guides.
- `bin/ngdump` - Simple tool for dumping the content of a guide as something
  that can be read as a single file.
- `bin/ngserve` - Simple self-contained web server that serves Norton Guide
  files as a website.

