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
