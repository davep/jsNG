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
