---
title: Options reference
layout: default
parent: Prompts
grand_parent: Configuration
nav_order: 6
---

# Prompt Options reference

## `<lexxy-prompt>`

- `trigger`: The character that activates the prompt (e.g., "@", "#", "/").
- `src`: Path or URL to load items remotely.
- `name`: Identifier for the prompt type (determines attachment content type, e.g., `name= "mention"` creates `application/vnd.actiontext.mention`). Mandatory unless using `insert-editable-text`.
- `empty-results`: Message shown when no matches found. By default it is "Nothing found".
- `remote-filtering`: Enable server-side filtering instead of loading all options at once.
- `insert-editable-text`: Insert prompt item HTML directly as editable text instead of Action Text attachments.
- `supports-space-in-searches`: Allow spaces in search queries (useful with remote filtering for full name searches).

## `<lexxy-prompt-item>`

- `search`: The text to match against when filtering (can include multiple fields for better search).
- `sgid`: The default signed GlobalID for Action Text attachments (use `attachable_sgid` helper). Can be overridden per-template. Mandatory unless using `insert-editable-text` or specified on the `template` items (see below).

#### `<template type="editor">`

Each `<lexxy-prompt-item>` can contain one or more `<template type="editor">` elements. When multiple templates are present, selecting the prompt item will insert them as separate attachments.

- `sgid`: The prompt item's sgid to reference a different attachable record.
- `content-type` (optional): Override the default content type for this specific attachment. If not specified, uses `application/vnd.{namespace}.{prompt-name}`.
