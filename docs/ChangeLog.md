# jsNG ChangeLog
Also see [the release history on GitHub](https://github.com/davep/jsNG/releases).

## 1.0.3
- General tidying after being left alone for a couple or so years. Noting
  obviously external-facing should have changed.

## 1.0.2
- Bumped the licence to GPL-3+.

## 1.0.1
- Fix a bug with how source is shown by `ngserve`.

## 1.0.0
- First stable release.

## 0.0.15
- Various internal tweaks.
- Improved the handling of malformed menu prompts.

## 0.0.14
- Various internal tweaks.
- Added generator headers to the output of `ng2html` and `ngserve`.

## 0.0.13
- Ensured ngserve sends a type header for HTML output.
- Modified the HTML of an article so it better works with text browsers.

## 0.0.12
- `ngabout` now ensures that the credits are displayed in "plain" text.
- Added `jsNGHTML.js` as a core library for HTML/NG-based tools
- Added `ng2html` (using `jsNGHTML.js` as the core).
- Re-worked `ngserve` so it's based around `jsNGHTML.js`.

## 0.0.11
- More mobile-friendly tweaks to the output of `ngserve`.
- Made the output of `ngserve` valid HTML5.
- Tweaked default underline style so that it looks more like the old Norton
  Guide way of doing things (a colour rather than an actual underline).
- Started documentation.

## 0.0.10
- Added `hasParentMenu` and `hasParentPrompt` to `NGEntry`.
- `ngserve` now sets the page title to something a little more informative
  (sets it to the guide title plus the menu options you're navigating
  through -- this is how `WEG` works).
- Updated `ngserve` so that it can optionally serve a local file as the
  stylesheet.

## 0.0.9
Minor release to add `ngserve` to the list of files to install into `bin`.
Also finally made this into a package that has a preference for global
installation given that it's as much command line tools as anything else.

## 0.0.8
Tweaked the output of `ngserve` to be more mobile-firnedly. From now on
guides should look nicer and be easier to read on smaller screens.

## 0.0.7
New URL scheme for `ngserve` (which aids in vastly reducing the chance of
guide clashes) and also moved a lot of code around in the library (mostly
splitting things up to make the main jsNG file less monolithic).

## 0.0.6
Made a number of improvements to the core library code and also added
`ngserve` -- a simple web server for Norton Guide files.

## 0.0.5
More code tweaks plus initial work on the "line parser", which will allow
other code to easily render the content of a guide.

## 0.0.4
Mostly code tidying and the addition of testing.

## 0.0.3
Lots more code tweaking and various improvements to the `bin`-based
utilities.

## 0.0.2
- Lots of code tweaks (mostly tidying up the code).
- Added `ngabout` to the `bin` directory.

## 0.0.1
Very early take on the code. Got to the point where it can load and dump a
whole guide. Not really that useful for anything else, but a good starting
point for other things.

[//]: # (ChangeLog.md ends here)
