---
title: Toolbar
layout: default
parent: Configuration
nav_order: 4
---

# Toolbar

The `toolbar.items` option sets which items the default toolbar shows, and in what order. Each entry is a button, a dropdown, a dropdown group, a separator, or a spacer.

Items only arrange the toolbar. Whether a feature is available at all is up to its own option, such as `attachments`, and the toolbar config can't turn it back on: with `attachments: false`, the `image` and `file` buttons stay hidden even when they're listed in `items`.

## Entries

| Entry | What it adds |
|-------|--------------|
| `"bold"` | A button or dropdown from the list below |
| `{ name, icon, label, items }` | A dropdown group: a menu with the given items |
| `"\|"` | A separator: it ends the group of items before it |
| `"~"` | A spacer: it pushes the items after it to the end of the toolbar |

The toolbar always ends with its overflow menu, which holds the buttons that don't fit.

An unknown entry raises an error when the editor builds its toolbar, so a typo shows up right away.

## Default items

```js
toolbar: {
  items: [
    "image",
    "file",
    "|",
    "bold",
    "italic",
    "strikethrough",
    "underline",
    "|",
    { name: "format", icon: "heading", label: "Text formatting", items: [ "paragraph", "headings", "|", "clear-formatting" ] },
    "highlight",
    "link",
    "|",
    "quote",
    "code",
    "unordered-list",
    "ordered-list",
    "|",
    "table",
    "divider",
    "~",
    "undo",
    "redo"
  ]
}
```

## Buttons and dropdowns

| Name | Adds |
|------|------|
| `image` | Upload images and videos |
| `file` | Upload files |
| `bold` | Bold |
| `italic` | Italic |
| `strikethrough` | Strikethrough |
| `underline` | Underline |
| `clear-formatting` | Clear formatting |
| `highlight` | The color highlight dropdown |
| `link` | The link dropdown |
| `quote` | Quote |
| `code` | Code |
| `unordered-list` | Bullet list |
| `ordered-list` | Numbered list |
| `table` | Insert a table |
| `divider` | Insert a divider |
| `undo` | Undo |
| `redo` | Redo |

## Dropdown groups

A dropdown group is an object:

- `name`: the name of its toolbar button.
- `icon`: the icon of its toolbar button. One of `bold`, `italic`, `strikethrough`, `underline`, `heading`, `paragraph`, `clearFormatting`, `highlight`, `link`, `quote`, `code`, `ul`, `ol`, `image`, `attachment`, `table`, `hr`, `undo` and `redo`.
- `label`: its accessible name, shown as the button's tooltip.
- `items`: the items of its menu.

A group's menu takes any button from the list above, plus `"|"` for a separator and two items that only go in a group:

- `paragraph`: turn the block back into a normal paragraph.
- `headings`: one item per heading level in the [`headings` option](configuration.html#editor-options).

The `highlight` and `link` dropdowns, and other groups, can't go inside a group.

The group's button shows as pressed while one of its items is active.

## Examples

### A smaller toolbar for a preset

```js
Lexxy.configure({
  compact: {
    toolbar: {
      items: [ "bold", "italic", "link", "~", "undo", "redo" ]
    }
  }
})
```

```html
<lexxy-editor preset="compact"></lexxy-editor>
```

### Your own dropdown group

```js
toolbar: {
  items: [
    "bold",
    "italic",
    { name: "insert", icon: "table", label: "Insert", items: [ "table", "divider", "|", "quote", "code" ] },
    "link",
    "~",
    "undo",
    "redo"
  ]
}
```

### One editor

The `toolbar` attribute overrides the preset's items on one editor:

```html
<lexxy-editor toolbar='{"items": ["bold", "italic", "link"]}'></lexxy-editor>
```

## Other toolbar options

- `toolbar.upload`: which upload buttons show, out of the ones in `items`. Accepts `"file"`, `"image"`, or `"both"` (default).
- Pass `toolbar: false` to remove the toolbar, or the ID of a `<lexxy-toolbar>` element to use your own toolbar markup instead. `toolbar.items` only applies to the default toolbar.
