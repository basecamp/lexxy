---
title: Usage
layout: default
nav_order: 2
---

# Usage

## Rails

You can add a Lexxy instance using the regular Action Text form helper:

```erb
<%= form_with model: @post do |form| %>
  <%= form.rich_text_area :content %>
<% end %>
```

## Vanilla HTML

Insert a `<lexxy-editor>` tag, that will be a first-class form control:

```html
<lexxy-editor name="post[body]"...>...</lexxy-editor>
```

## Form validation

Lexxy participates in native form validation. For custom rules, set an error with `setCustomValidity()` and use `reportValidity()` to report it:

```js
const editor = document.querySelector("lexxy-editor")
editor.setCustomValidity("Please include more detail.")
editor.reportValidity()
```

A nonempty message blocks submission. When your application resolves the error, clear it with an empty string:

```js
editor.setCustomValidity("")
```

Custom errors persist until cleared, including after editing or resetting the form. Clearing one leaves other constraints, such as `required` and pending uploads, in place.

Read the current message through `editor.validationMessage` and the validation state through `editor.validity`. `editor.checkValidity()` checks validity without displaying the browser's validation message.

See [Configuration](configuration.html) for details on customizing editors.

See [Hotkeys](hotkeys.html) for keyboard shortcuts and [Accessibility](accessibility.html) for accessibility features and form integration examples.
