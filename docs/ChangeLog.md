# jsNG ChangeLog

## 0.0.10
- Added `hasParentMenu` and `hasParentPrompt` to `NGEntry`.
- `ngserve` now sets the page title to something a little more informative (sets it to the guide title plus the menu options you're navigating through -- this is how `WEG` works).
- Updated `ngserve` so that it can optionally serve a local file as the stylesheet.

## 0.0.9
Minor release to add `ngserve` to the list of files to install into `bin`. Also finally made this into a package that has a preference for global installation given that it's as much command line tools as anything else.

## 0.0.8
Tweaked the output of `ngserve` to be more mobile-firnedly. From now on guides should look nicer and be easier to read on smaller screens.

## 0.0.7
New URL scheme for `ngserve` (which aids in vastly reducing the chance of guide clashes) and also moved a lot of code around in the library (mostly splitting things up to make the main jsNG file less monolithic).

## 0.0.6
Made a number of improvements to the core library code and also added `ngserve` -- a simple web server for Norton Guide files.

## 0.0.5
More code tweaks plus initial work on the "line parser", which will allow other code to easily render the content of a guide.

## 0.0.4
Mostly code tidying and the addition of testing.

## 0.0.3
Lots more code tweaking and various improvements to the `bin`-based utilities.

## 0.0.2
- Lots of code tweaks (mostly tidying up the code).
- Added `ngabout` to the `bin` directory.

## 0.0.1
Very early take on the code. Got to the point where it can load and dump a whole guide. Not really that useful for anything else, but a good starting point for other things.