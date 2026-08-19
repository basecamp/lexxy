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

Presets let you keep alternative editor setups organized. For example, you may want a simpler setup without rich text for a command line, alongside the full editor elsewhere.

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

## Content Security Policy

Lexxy sanitizes with its own DOMPurify instance rather than the shared one, so
that configuring the editor cannot change how your app's own sanitizing behaves.

That has one consequence under Trusted Types. Every DOMPurify instance asks for a
policy named `dompurify` the first time it sanitizes, and the browser refuses a
duplicate name — so on a page with two instances, one of them gets no policy at
all. An instance without a policy does not quietly degrade, and it does not throw
either. It **silently returns an empty string and drops everything you gave it**:
DOMPurify parses through `DOMParser.parseFromString`, which is a Trusted Types
sink, but it swallows that error and the one from its `innerHTML` fallback, and
then returns `""` for the document it never got. Nothing reaches your error
tracker. Which sanitizer goes quiet would come down to which one ran first, and it
could just as easily be yours as ours.

So Lexxy asks under its own name, `lexxy`. If you enforce
`require-trusted-types-for 'script'`, add it to your `trusted-types` directive:

```
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types dompurify lexxy
```

```ruby
# config/initializers/content_security_policy.rb
Rails.application.config.content_security_policy do |policy|
  policy.trusted_types "dompurify", "lexxy"
  policy.require_trusted_types_for :script
end
```

The policy names are strings, not symbols: Rails resolves a symbol source through
its own mapping table and raises `ArgumentError` on anything not in it. `:script`
is in that table, so the sink group stays a symbol.

If the directive doesn't allowlist `lexxy`, creating the policy throws, Lexxy
catches it, warns on the console, and falls back to signing nothing — the same
position it was in before. It does not fall back to asking for `dompurify`, so
your own sanitizer keeps the name whatever happens here. Browsers without Trusted
Types take the same path.

If you would rather not change the directive, `allow-duplicates` is a valid
alternative that needs no code change on either side:

```
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types dompurify allow-duplicates
```

It relaxes name uniqueness for every policy on the page, not just ours, and it
does nothing about the sinks below.

Which of Lexxy's DOMPurify copies you get depends on how you load it. Through npm,
`dompurify` stays external and your bundler hands both of you the same module — so
Lexxy creating its own instance from it is what keeps your config and hooks yours.
Through the Rails asset pipeline, `lexxy.js` has its own copy inlined and cannot
reach yours at all. The `trusted-types` directive is page-wide either way, so the
policy name above applies to both.

### Lexxy does not yet work under enforced Trusted Types

Allowlisting `lexxy` is necessary but **not sufficient**. It keeps Lexxy's
sanitizer from breaking your app's; it does not make the editor itself work
under `require-trusted-types-for 'script'`.

Lexxy writes raw HTML through several sinks it does not wrap in a policy:

- `parseHtml` in `helpers/html_helper.js`, the initial-value parse — the first one
  the editor hits, and where it throws while connecting.
- `createElement` in the same file, a second sink in it: the `content` argument is
  written through `innerHTML`. Two callers pass one — the wrapped-table figure in
  `nodes/wrapped_table_node.js` and the row/column count in the table tools.
- `highlightElement` in `helpers/code_highlighting_helper.js`, which writes Prism's
  output through `innerHTML`. This one is not editor-only — `highlightCode` and
  `highlightElement` are part of Lexxy's public API, so calling them yourself to
  highlight already-rendered content throws too, with no editor involved.
- The attachment content `insertAdjacentHTML` in
  `nodes/custom_action_text_attachment_node.js`.
- The `innerHTML` writes that build the toolbar, the dropdowns and the attachment
  delete button, across `elements/`.

Under enforcement the editor throws while connecting, whether or not `lexxy` is
allowlisted. This is long-standing and is not changed either way by the policy
above.

If you enforce Trusted Types today, Lexxy will not run. Please open an issue if
you need it to — knowing there is demand is what will get the remaining sinks
wrapped.
