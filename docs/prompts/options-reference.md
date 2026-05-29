---
title: Options reference
layout: default
parent: Prompts
grand_parent: Configuration
nav_order: 6
---

# Prompt Options reference

## `<lexxy-prompt>`

- `trigger`: The string that activates the prompt (e.g., "@", "#", "by:").
- `src`: Path or URL to load items remotely.
- `name`: Identifier for the prompt type (determines attachment content type, e.g., `name= "mention"` creates `application/vnd.actiontext.mention`). Mandatory unless using `insert-editable-text`.
- `empty-results`: Message shown when no matches found. By default it is "Nothing found".
- `remote-filtering`: Enable server-side filtering instead of loading all options at once.
- `insert-editable-text`: Insert prompt item HTML directly as editable text instead of Action Text attachments.
- `supports-space-in-searches`: Allow spaces in search queries (useful with remote filtering for full name searches).
- `only-at`: Regular expression controlling where the trigger can open the prompt. The pattern is matched against the document text immediately before the trigger and the prompt opens only when it matches. Defaults to `^|[ \n]`, meaning the trigger fires at the very start of the document or right after a space or paragraph break. See [Restricting where the prompt opens](#restricting-where-the-prompt-opens-with-only-at).
- `vertical-direction`: Can be set to `top` or `bottom`. Forces the prompt menu to open either upward or downward. By default, Lexxy uses the window viewport to calculate the best direction. Useful when there are floating elements that might cover up the prompt.

## `<lexxy-prompt-item>`

- `search`: The text to match against when filtering (can include multiple fields for better search).
- `sgid`: The default signed GlobalID for Action Text attachments (use `attachable_sgid` helper). Can be overridden per-template. Mandatory unless using `insert-editable-text` or specified on the `template` items (see below).

#### `<template type="editor">`

Each `<lexxy-prompt-item>` can contain one or more `<template type="editor">` elements. When multiple templates are present, selecting the prompt item will insert them as separate attachments.

- `sgid`: The prompt item's sgid to reference a different attachable record.
- `content-type` (optional): Override the default content type for this specific attachment. If not specified, uses `application/vnd.{namespace}.{prompt-name}`.

## Restricting where the prompt opens with `only-at`

By default the prompt opens when its `trigger` appears at the start of the document or right after a space or paragraph break. This is what you usually want for `@mentions` and similar features, where you don't want a stray `@` inside an email address to pop the prompt open.

The `only-at` attribute lets you change this rule by providing a regular expression. The pattern is matched against the document text immediately before the trigger, and the prompt opens only when the pattern matches.

The text passed to the regex is the full editor text up to the trigger, with paragraph breaks rendered as `\n\n`. The pattern is anchored at the end automatically, so you only need to describe what should precede the trigger.

Some useful patterns:

```html
<!-- Default. Trigger fires at the start of the document or after whitespace/paragraph break. -->
<lexxy-prompt trigger="@" name="mention">…</lexxy-prompt>

<!-- Trigger fires only when it is the very first character of the document. -->
<lexxy-prompt trigger="!" name="bot" only-at="^">…</lexxy-prompt>

<!-- Trigger fires anywhere, including at the start of the document and in the middle of a word. -->
<lexxy-prompt trigger="#" name="tag" only-at=".*">…</lexxy-prompt>
```
