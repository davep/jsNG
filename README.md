# jsNG

[![npm](https://img.shields.io/npm/v/jsng.svg?style=flat-square)](https://www.npmjs.com/package/jsng)
[![Build Status](https://travis-ci.org/davep/jsNG.svg?branch=master)](https://travis-ci.org/davep/jsNG)

# Introduction

jsNG is a small JavaScript library for reading Norton GUide database files.
It also contains a handful of command line utility tools for looking inside
guides, including `ngserve`, a simple Norton Guide web server.

This is still a bit of a work-in-progress. It is, in part, my "Hello, World"
for getting to know ES6-ish ways of coding, and also seeing what's possible
with node (which I've never used before to write CLI tools).

The code itself is mostly based on what I wrote for
the [`WEGLib`](https://github.com/davep/weg/tree/master/WEGLib) library that
forms part of [`weg`](https://github.com/davep/weg).

I don't offer this as good ES6 code. I don't offer this as good code at all.
At the moment I'm also not really considering taking contributions to the
code as this is still a pet project.

Anyone looking for background documentation for the format of Norton Guide
files might
find
[my page of documentation about it](http://davep.org/norton-guides/file-format/) useful.

# Contents

`lib/jsNG*.js` - The main jsNG library code.
See [the docs](http://blog.davep.org/jsNG/) for details on how to use it.

`bin/ngabout` -- Tool to get the credits for one or more Norton Guide files.

`bin/ngdir` -- Simple tool to show a directory of Norton Guide files. Shows
the name, the type and the title of each guide.

`bin/ngserve` -- Simple Norton Guide database server. By default it serves
all of the guides named on the command line
on [localhost:8080](http://localhost:8080/).

`bin/ng2html` -- Simple tool for turning a Norton Guide file into a
collection of HTML files.

# Make targets

The top level directory contains a `Makefile`. The most useful targets are:

`make tests` -- Runs a simple test (found in `test/`) to ensure some of the
core functions of jsNG are working fine.

`make dump` -- Runs `bin/ngdump` on a test guide.

`make dir` -- Runs `bin/ngdir` on the test guides.

`make about` -- Runs `bin/ngabout` on a test guide.

`make serve` -- Runs `bin/ngserve` on the test guides.
