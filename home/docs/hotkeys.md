---
title: Hotkeys
layout: default
nav_order: 6
---

# Hotkeys

Keyboard shortcuts for the formatting toolbar, attachments, tables, and prompts. On macOS, use `Option` for `Alt` and `Command` for `Ctrl`, except where separate shortcuts are listed.

## Toolbar

From the editor, press `Shift+Tab` to focus the formatting toolbar. Once focus is in the toolbar:

| Shortcut | Action |
|----------|--------|
| `Left Arrow` / `Right Arrow` | Move between toolbar controls. |
| `Home` / `End` | Move to the first or last toolbar control. |
| `Enter` / `Space` | Activate a button or open its menu. |
| Arrow keys, in an open menu | Move between menu items, wrapping at either end. |
| `Escape` | Close the open menu. |

If you opened the menu from the toolbar with the keyboard, `Escape` returns focus to its button. Otherwise, it returns focus to the editor.

### Formatting and history

These shortcuts work while editing text:

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle bold. |
| `Ctrl+I` | Toggle italic. |
| `Ctrl+U` | Toggle underline. |
| `Ctrl+K` | Open the link dialog. |
| `Ctrl+Z` | Undo. |
| `Ctrl+Shift+Z` | Redo. `Ctrl+Y` also works on Windows and Linux. |

## Attachments

Select an attachment with the arrow keys or by clicking it, then use these shortcuts:

| Shortcut | Action |
|----------|--------|
| `Alt+F10` | Focus the attachment toolbar, where you can remove the attachment. |
| `Escape` | Return from the attachment toolbar to the selected attachment. |
| `Tab` | Edit the caption, if the attachment has an editable caption. |
| `Alt+Shift+Up Arrow` | Move the attachment above the previous block. |
| `Alt+Shift+Down Arrow` | Move the attachment below the next block. |
| `Alt+Shift+Left Arrow` | Move the selected image one position earlier in its gallery. |
| `Alt+Shift+Right Arrow` | Move the selected image one position later in its gallery. |

### Editing captions

While editing a caption, press `Escape` or `Shift+Tab` to return to the selected attachment, or `Enter` to continue after it. Your caption changes are kept when you leave the field, including with `Escape`.

### Arranging galleries

Moving an image up or down toward an adjacent image creates a gallery. Moving it toward an existing gallery adds it to that gallery. Within a gallery, `Alt+Shift+Left Arrow` and `Alt+Shift+Right Arrow` change the image order; `Alt+Shift+Up Arrow` and `Alt+Shift+Down Arrow` take the selected image out of the gallery and place it above or below the gallery.

## Tables

With the cursor inside a table:

| Shortcut | Action |
|----------|--------|
| `Tab` / `Shift+Tab` | Move to the next or previous cell. |
| `Enter` | Move to the same column in the next row. |
| `Shift+Enter` | Insert a line break within the cell. |
| `Backspace`, in an empty cell after the first column | Move to the previous cell. |
| `Backspace`, in the first cell of an empty row | Remove the row. |
| `Alt+F10` | Focus the table tools for adding or removing rows and columns. |

In the last row, `Enter` adds a row and moves to its first cell. If the last row is empty, `Enter` removes it and continues below the table. Inside a list or code block, `Enter` keeps its usual editing behavior.

With focus in the table tools:

| Shortcut | Action |
|----------|--------|
| `Left Arrow` / `Right Arrow` | Move between table controls. |
| `Home` / `End` | Move to the first or last table control. |
| `Enter` / `Space` | Activate a button or open its menu. |
| Arrow keys, in an open menu | Move between menu items, wrapping at either end. |
| `Escape` | Close an open menu, or return from the table tools to the current cell. |

## Prompts

Type the configured trigger, such as `@` for mentions, to open a prompt. Keep typing to filter its suggestions. While the prompt is open:

| Shortcut | Action |
|----------|--------|
| `Up Arrow` / `Down Arrow` | Select the previous or next suggestion. |
| `Enter` / `Tab` | Insert the selected suggestion. |
| `Space` | Insert the selected suggestion, unless the prompt allows spaces in searches. |
| `Comma` | Insert the selected suggestion followed by a comma. |
| `Escape` | Close the prompt without inserting a suggestion. |

The [`supports-space-in-searches` option](prompts/options-reference.html) makes `Space` part of the search term; use `Enter` or `Tab` to confirm a suggestion instead.
