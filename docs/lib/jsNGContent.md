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

### `parent()`

### `parentPrompt()`

### `previous()`

### `next()`

### `hasParent()`

### `hasParentMenu()`

### `hasParentPrompt()`

### `hasPrevious()`

### `hasNext()`

### `lines()`

### `offsets()`

### `isShort()`

### `isLong()`

### `seeAlso()`
