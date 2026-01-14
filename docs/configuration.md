---
title: Configuration
layout: default
nav_order: 4
has_children: true
---

# Configuration

You can configure editors in two ways: using `Lexxy.configure` and element attributes.

```js
import * as Lexxy from "lexxy"

// overriding default options will affect all editors
Lexxy.configure({
  default: {
    toolbar: false
  }
})
<lexxy-editor></lexxy-editor>

// you can also create new presets, which will extend the default preset
Lexxy.configure({
  simple: {
    richText: false
  }
})
<lexxy-editor preset="simple"></lexxy-editor>

// you can override specific options with attributes on editor elements
<lexxy-editor preset="simple" rich-text="true"></lexxy-editor>

// finally, some options can only be configured globally
Lexxy.configure({
  global: {
    attachmentTagName: "bc-attachment"
  }
})
```

## Editor options

Editors support the following options, configurable using presets and element attributes:

- `toolbar`: Pass `false` to disable the toolbar entirely, or pass the ID of a `<lexxy-toolbar>` element to use as an external toolbar. By default, the toolbar is bootstrapped and displayed above the editor.
- `attachments`: Pass `false` to disable attachments completely. By default, attachments are supported, including paste and Drag & Drop support.
- `markdown`: Pass `false` to disable Markdown support.
- `multiLine`: Pass `false` to force single line editing.
- `richText`: Pass `false` to disable rich text editing.

Lexxy also supports standard HTML attributes:
  - `placeholder`: Text displayed when the editor is empty.
  - Form attributes: `name`, `value`, `required`, `disabled`, `autofocus` etc.

## Global options

Global options apply to all editors in your app and are configured using `Lexxy.configure({ global: ... })`:

- `attachmentTagName`: The tag name used for [Action Text custom attachments](https://guides.rubyonrails.org/action_text_overview.html#signed-globalid). By default, they will be rendered as `action-text-attachment` tags.
- `attachmentContentTypeNamespace`: The default content_type namespace for prompts. The default is `actiontext` which will result in `application/vnd.actiontext.[type]`.
- `authenticatedUploads`: will set `withCredentials: true` for ActiveStorage upload requests if you are using authenticated upload contollers. Be sure to set cookie domain and server CORS/CSRF options accordingly.
