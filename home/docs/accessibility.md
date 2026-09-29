---
title: Accessibility
layout: default
nav_order: 7
---

# Accessibility

Lexxy is designed with accessibility in mind, from formatting text to working with attachments, tables, and prompts.

## Forms and validation

### Labels

Use a visible `<label>` to name the editor:

```html
<label for="message">Message</label>
<lexxy-editor id="message" name="message"></lexxy-editor>
```

The label can also wrap the editor, without a `for` attribute:

```html
<label>
  Message
  <lexxy-editor name="message"></lexxy-editor>
</label>
```

<details markdown="1">
<summary>Rails examples</summary>

Use `form.label` with `form.rich_text_area` inside your `form_with` block:

```erb
<%= form.label :content, "Message" %>
<%= form.rich_text_area :content %>
```

For a wrapping label:

```erb
<label>
  Message
  <%= form.rich_text_area :content %>
</label>
```

</details>

If the editor's name comes from existing text elsewhere on the page, use `aria-labelledby`:

```html
<h2 id="reply-heading">Your reply</h2>
<lexxy-editor name="reply" aria-labelledby="reply-heading"></lexxy-editor>
```

When there is no visible label, supply the name directly with `aria-label`:

```html
<lexxy-editor name="comment" aria-label="Comment"></lexxy-editor>
```

### Descriptions and help text

A description is optional and supplements the editor's name. Choose one source for it:

- `aria-describedby` references help text in another element on the page.
- `aria-description` supplies the text directly when there is no help text element.

If both are set, `aria-describedby` takes precedence; their text is not combined.

Keep instructions everyone needs visible and associate that text with `aria-describedby`:

```html
<label for="message-with-help">Message</label>
<p id="message-help">Include the details your team needs.</p>
<lexxy-editor id="message-with-help" name="message"
  aria-describedby="message-help"></lexxy-editor>
```

<details markdown="1">
<summary>Rails example</summary>

Pass ARIA attributes through the form helper using the `aria` option:

```erb
<%= form.label :content, "Message" %>
<p id="content-help">Include the details your team needs.</p>
<%= form.rich_text_area :content, aria: { describedby: "content-help" } %>
```

</details>

To supply the description directly without displaying help text, use `aria-description`:

```html
<label for="reply">Reply</label>
<lexxy-editor id="reply" name="reply"
  aria-description="Add details or ask a question about this discussion."></lexxy-editor>
```

<details markdown="1">
<summary>Rails example</summary>

```erb
<%= form.label :content, "Reply" %>
<%= form.rich_text_area :content, aria: { description: "Add details or ask a question about this discussion." } %>
```

</details>

### Required fields

Use `required` to require a value on submission. Lexxy sets `aria-required` automatically:

```html
<label for="required-message">Message (required)</label>
<lexxy-editor id="required-message" name="message" required></lexxy-editor>
```

<details markdown="1">
<summary>Rails example</summary>

```erb
<%= form.label :content, "Message (required)" %>
<%= form.rich_text_area :content, required: true %>
```

</details>

`aria-required` alone describes the field as required but does not enable form validation.

### Validation errors

When submission, `checkValidity()`, or `reportValidity()` finds an invalid value, Lexxy sets `aria-invalid="true"` and updates it as content changes. An untouched required editor is not marked invalid. Resetting the form clears this automatic validation feedback.

For custom validation rules, use [`setCustomValidity()`](usage.html#form-validation). Lexxy updates `aria-invalid` when validation is attempted.

To display an error in the page, set `aria-invalid="true"` and link the visible message with `aria-errormessage`:

```html
<label for="message-with-error">Message</label>
<p id="message-error">Please include a message.</p>
<lexxy-editor id="message-with-error" name="message"
  required aria-invalid="true"
  aria-errormessage="message-error"></lexxy-editor>
```

<details markdown="1">
<summary>Rails example</summary>

```erb
<%= form.label :content, "Message" %>
<p id="content-error">Please include a message.</p>
<%= form.rich_text_area :content, required: true,
  aria: { invalid: true, errormessage: "content-error" } %>
```

</details>

These ARIA attributes communicate the error; they do not block form submission. General help text can remain associated through `aria-describedby`.

An explicit `aria-invalid` takes precedence over Lexxy's automatic state. When your application clears the error, update or remove `aria-invalid`, and hide the error message or remove its `aria-errormessage` association.

### ARIA attributes and defaults

Lexxy forwards `aria-*` attributes from `<lexxy-editor>` to its editable textbox, including later changes and removals.

Explicit attributes override the defaults Lexxy derives from the editor. Removing an override restores the default, such as the associated `<label>` for `aria-label` or the `required` state for `aria-required`.

Lexxy sets `aria-multiline` to match the configured editing mode, including `multiLine: false` and the `single-line` attribute.

Lexxy also manages some attributes during editing: prompts set and clear `aria-controls`, `aria-activedescendant`, and `aria-haspopup` as suggestions open and close.

## Navigation and focus

You can use the keyboard to format text, edit captions, move attachments, arrange galleries, manage table rows and columns, and select prompt suggestions.

Visible focus indicators help you follow your position among controls. Menus support arrow-key navigation. See [Hotkeys](hotkeys.html) for shortcuts and focus behavior.

## Formatting and content structure

Formatting controls have descriptive names and indicate which options are active. Colors are named and grouped by text or background color, with support for [custom color labels](highlighting.html#custom-color-labels).

Headings, lists, and table headers use semantic HTML, making the content's structure available to assistive technology. The table tools let you designate header rows and columns.

## Attachments and galleries

Attachments are described using their captions, alternative text, or filenames. Caption fields are labelled so screen readers can identify what you are editing.

When an attachment moves, Lexxy keeps it selected and in view, and announces the move to screen readers.

## Prompts and suggestions

Selected suggestions are exposed to screen readers and scroll into view while focus stays in the editor. Prompts also work inside table cells.

After inserting a mention, its name remains available to screen readers as you move through the text.
