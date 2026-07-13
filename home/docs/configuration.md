---
title: Configuration
layout: default
nav_order: 3
has_children: true
---

# Configuration

You configure editors with `Lexxy.configure` and with attributes on the editor element. Options resolve from least to most specific: the **default** options apply to every editor, a named **preset** extends the default, and **HTML attributes** override both on an individual editor.

```js
import * as Lexxy from "lexxy"
```

{: .important }
Call `Lexxy.configure` immediately after your import statement. Editor elements are registered after the import's call stack completes, so configuration must happen synchronously to take effect.

## Ways to configure

### Default options

Override the `default` preset to change the behavior of every editor in your app:

```js
Lexxy.configure({
  default: {
    toolbar: false
  }
})
```

```html
<lexxy-editor></lexxy-editor>
```

### Presets

Define named presets, which extend the `default` preset, and opt in to them per editor with the `preset` attribute:

```js
Lexxy.configure({
  simple: {
    richText: false
  }
})
```

```html
<lexxy-editor preset="simple"></lexxy-editor>
```

### HTML attributes

Override individual options on a single editor with element attributes. These take precedence over both the preset and the default:

```html
<lexxy-editor preset="simple" rich-text="true"></lexxy-editor>
```

## Editor options

Editors support the following options, configurable using presets and element attributes:

- `toolbar`: Pass `false` to disable the toolbar entirely, pass the ID of a `<lexxy-toolbar>` element to use as an external toolbar, or pass an object to configure individual toolbar buttons. By default, the toolbar is bootstrapped and displayed above the editor.
  - `toolbar.upload`: Control which upload button(s) appear in the toolbar. Accepts `"file"`, `"image"`, or `"both"` (default). The image button restricts the file picker to images and videos (`accept="image/*,video/*"`), which triggers the native photo/video picker on iOS and Android. The file button opens an unrestricted file picker.
- `attachments`: Pass `false` to disable attachments completely. By default, attachments are supported, including paste and drag & drop support. For finer-grained control — keeping attachments enabled while restricting which content types are accepted — use `permittedAttachmentTypes`.
- `markdown`: Pass `false` to disable Markdown support.
- `multiLine`: Pass `false` to force single line editing.
- `permittedAttachmentTypes`: Restrict the editor to a specific allowlist of attachment content types. Unset (the default) permits any content type. Example: `<lexxy-editor permitted-attachment-types="application/vnd.basecamp.mention application/vnd.basecamp.opengraph-embed"></lexxy-editor>`.
- `richText`: Pass `false` to disable rich text editing.
- `headings`: Pass an array of heading tags to configure which heading levels are available in the toolbar dropdown. Defaults to `["h2", "h3", "h4"]`. Pass an empty array to remove all heading options; the formatting dropdown still offers "Normal" and "Clear formatting".

  ```js
  // Via preset
  Lexxy.configure({
    default: { headings: ["h1", "h2", "h3"] }
  })
  ```

  ```html
  <!-- Via element attribute -->
  <lexxy-editor headings='["h2", "h3"]'></lexxy-editor>
  ```

The toolbar is considered part of the editor for `lexxy:focus` and `lexxy:blur` events. If the toolbar registers event or lexical handlers, it should expose a `dispose()` function which will be called on editor disconnect.

Lexxy also supports standard HTML attributes:
  - `placeholder`: Text displayed when the editor is empty.
  - Form attributes: `name`, `value`, `required`, `disabled`, `autofocus` etc.

## Global options

Global options apply to all editors in your app and are configured using `Lexxy.configure({ global: ... })`:

- `attachmentTagName`: The tag name used for [Action Text custom attachments](https://guides.rubyonrails.org/action_text_overview.html#signed-globalid). By default, they will be rendered as `action-text-attachment` tags.
- `attachmentContentTypeNamespace`: The default content_type namespace for prompts. The default is `actiontext` which will result in `application/vnd.actiontext.[type]`.
- `authenticatedUploads`: will set `withCredentials: true` for ActiveStorage upload requests if you are using authenticated upload contollers. Be sure to set cookie domain and server CORS/CSRF options accordingly.

Some options, like `attachmentTagName`, can only be set globally:

```js
Lexxy.configure({
  global: {
    attachmentTagName: "bc-attachment"
  }
})
```
