---
title: Toolbar
layout: default
parent: Configuration
nav_order: 2
---

# Toolbar Customization

The toolbar layout is fully configurable through the `toolbar.items` array. Each entry defines a button, dropdown group, separator, or spacer.

## Item types

| Entry | Description |
|-------|-------------|
| `"bold"` | A button name from the built-in registry (see below) |
| `{ name, icon, label, items }` | A dropdown group containing child items |
| `"|"` | A visual group separator — adds a border after the preceding item |
| `"~"` | A flexible spacer — pushes subsequent items to the right edge |

## Default items

This is the default toolbar configuration:

```js
toolbar: {
  items: [
    "image",
    "file",
    "|",
    "bold",
    "italic",
    { name: "format", icon: "heading", label: "Text formatting", items: [
        "paragraph",
        "heading-large",
        "heading-medium",
        "heading-small",
        "|",
        "strikethrough",
        "underline",
      ]
    },
    { name: "lists", icon: "ul", label: "Lists", items: [
        "unordered-list",
        "ordered-list",
      ]
    },
    "highlight",
    "link",
    "quote",
    "code",
    "|",
    "table",
    "divider",
    "~",
    "undo",
    "redo",
  ]
}
```

## Available items

| Name | Icon | Description |
|------|------|-------------|
| `image` | image | Upload images |
| `file` | attachment | Upload files |
| `bold` | bold | Bold formatting |
| `italic` | italic | Italic formatting |
| `paragraph` | paragraph | Normal text (typically inside a format dropdown) |
| `heading-large` | h2 | Large heading |
| `heading-medium` | h3 | Medium heading |
| `heading-small` | h4 | Small heading |
| `strikethrough` | strikethrough | Strikethrough text |
| `underline` | underline | Underline text |
| `unordered-list` | ul | Bullet list |
| `ordered-list` | ol | Numbered list |
| `highlight` | highlight | Color highlight picker |
| `link` | link | Insert/edit link |
| `quote` | quote | Block quote |
| `code` | code | Code block |
| `table` | table | Insert table |
| `divider` | hr | Horizontal divider |
| `undo` | undo | Undo |
| `redo` | redo | Redo |

## Examples

### Minimal toolbar

```js
Lexxy.configure({
  compact: {
    toolbar: {
      items: ["bold", "italic", "link", "|", "undo", "redo"]
    }
  }
})
```

```html
<lexxy-editor preset="compact"></lexxy-editor>
```

### Without attachments

Omit `image` and `file` to remove upload buttons:

```js
toolbar: {
  items: [
    "bold",
    "italic",
    { name: "format", icon: "heading", label: "Text formatting", items: [
        "paragraph", "heading-large", "heading-medium", "heading-small",
        "|", "strikethrough", "underline",
      ]
    },
    "link",
    "quote",
    "code",
    "~",
    "undo",
    "redo",
  ]
}
```

### Custom dropdown groups

Create your own dropdown groupings:

```js
toolbar: {
  items: [
    "bold",
    "italic",
    { name: "insert", icon: "table", label: "Insert", items: [
        "table",
        "divider",
        "code",
        "quote",
      ]
    },
    "link",
    "~",
    "undo",
    "redo",
  ]
}
```

### Per-editor override

Override the toolbar for a specific editor using the HTML attribute:

```html
<lexxy-editor toolbar='{"items":["bold","italic","link"]}'></lexxy-editor>
```

### Disabling the toolbar

Pass `false` to hide the toolbar entirely:

```html
<lexxy-editor toolbar="false"></lexxy-editor>
```

## Separators and spacers

Use `"|"` between items to create visual groups. The separator renders as a thin vertical line (top-level) or a horizontal line (inside dropdowns).

Use `"~"` to insert a flexible spacer that pushes all following items to the right edge of the toolbar. This is typically used before undo/redo.
