# jsNGContent

This module exports the following:

## `NGMenu`

This object holds the details of a Norton Guide menu. It is the type of
object you'll find in the list returned from [`menus()`](sNG.md#menus) in
[`jsNG.Guide`](jsNG.md#guide).

The following methods are available:

### `title()`

Returns the title of the menu.

### `promptCount()`

Returns the count of prompts within the menu.

### `prompts()`

Returns an array of menu prompts. Each is a string.

### `offsets()`

Returns an array of guide entry offsets that relate to the prompts. Each is
an integer.

### `options()`

Returns a list of objects that contain the prompt and the offset for each
menu option. They are in the format:

```json
{
  "prompt": <prompt-string>,
  "offset": <prompt-offset>
}
```

## `NGSeeAlso`

This object holds the details of a Norton Guide see-also. It is the type of
object you'll find returned from `seeAlso()` in `NGEntry`.

The following methods are available:

### `seeAlsoCount()`

Returns the count of prompts within the see-also.

### `prompts()`

Returns an array of see-also prompts. Each is a string.

### `offsets()`

Returns an array of guide entry offsets that relate to the prompts. Each is
an integer.

### `options()`

Returns a list of objects that contain the prompt and the offset for each
see-also. They are in the format:

```json
{
  "prompt": <prompt-string>,
  "offset": <prompt-offset>
}
```

## `NGEntry`

This object holds the details of a Norton Guide entry. Available methods
are:

### `offset()`

Returns the position in the guide that this entry lives at.

### `type()`

Returns the type ID of the entry. See [`ENTRY`](jsNG.md#entry) for the
possible values.

### `lineCount()`

Returns the count of lines in the entry.

### `hasSeeAlso()`

Query if the entry has any see-alsos.

### `parentLine()`

Get the parent line number for this guide entry. This only makes sense if
the current entry is a long -- it says which line in the parent short links
to it.

### `hasParent()`

Queries if there is a parent entry.

### `parent()`

Get the location of the parent entry in the guide.

### `hasParentMenu()`

Queries if there is a parent menu for the entry.

### `parentMenu()`

The parent menu for this entry. The return value form this relates to the
position of the menu in the array returned from [`menus()`](jsNG.md#menus).

### `hasParentPrompt()`

Queries if there is a parent prompt for the entry.

### `parentPrompt()`

The prompt on the menu that is the parent for this entry. The return value
from this relates to the position of the prompt in menu pointed at by
`parentMenu()`.

### `hasPrevious()`

Queries if there is a previous entry.

### `previous()`

Returns the position of the previous entry in the guide, if there is one
(otherwise returns `0`).

### `hasNext()`

Queries if there is a next entry.

### `next()`

Returns the position of the next entry in the guide, if there is one
(otherwise returns `0`).

### `lines()`

Returns an array of strings that are the lines of text in the entry.

### `offsets()`

Returns an array of integers that are the locations of entries in the guide
that should be linked to be the corresponding line of text in `lines()`.
Note that this is only the case if `isShort()` is `true`. If a guide is a
long there are no offsets.

### `isShort()`

Query if the entry is a short style entry.

### `isLong()`

Query if the entry is a long style entry.

### `seeAlso()`

Returns an instance of [`NGSeeAlso`](#ngseealso) if the entry has see also links.
