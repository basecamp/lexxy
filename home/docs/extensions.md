---
title: Extensions
layout: default
parent: Configuration
nav_order: 3
---

# Extending Lexxy

While Lexxy can be [configured](configuration.html) to provide the functionality needed, for advanced use cases you can define Lexxy extension. Please contribute your feature if others would find it useful.

{: .important }
This API is experimental and may evolve with no deprecation period.

## Extending Lexical behavior

Lexxy Extensions are a wrapper around [Lexical Extensions](https://lexical.dev/docs/extensions/intro) which give access to the Lexxy element (mainly for `lexxy.config.get()`) and the toolbar once initialized.

An instance of the extension will be initialized per editor: `new MyLexxyExtension(lexxyElement)`. There is no need to supply a constructor as the base class provides `this.editorElement` to access Lexxy. If you specify a custom constructor you must pass the `lexxyElement` to `super`. If the return of `lexicalExtension` is truthy, it will be loaded at the time of Lexical editor creation. You can optionally provide an `enabled` getter which will be checked to see if your extension should be loaded by Lexxy.

Build the return value of `lexicalExtension` with `this.defineExtension(...)`, which the base class provides. It wraps Lexical's own `defineExtension`, so you don't need to install `lexical` yourself — a separately installed copy could be a different version than the one Lexxy bundles. Should you need anything else from Lexical, Lexxy re-exports the whole package:

```javascript
import { Lexical } from "@37signals/lexxy"
```

## Lifecycle

- `initializeToolbar(lexxyToolbar)` is called when the editor toolbar is initialized. Use it to add toolbar buttons or attach listeners to existing toolbar DOM.
- `dispose()` is called when the editor disconnects or reconnects. Use it to release anything that would otherwise leak across editor lifecycles: DOM listeners, global listeners, observers, timers, inserted DOM, or pending async state.

A new extension instance is created on every editor `connectedCallback`, so any state that survives in the surrounding DOM (for example, listeners attached to the toolbar in `initializeToolbar`) must be cleaned up in `dispose()` to avoid duplication after reconnects.

Should you need to extend any of Lexxy's nodes, they are exported at the top-level module:

```javascript
import { ActionTextAttachmentNode } from "@37signals/lexxy"
```

## Attachment controls

An extension can provide interactive controls for its attachment nodes through
`attachmentControls`. Lexxy mounts these controls outside the contenteditable,
positioned over an anchor inside the attachment. The node retains its in-flow
presentation and remains responsible for its serialized content.

```js
get attachmentControls() {
  return [ {
    node: AudioNode,
    create({ node, attachmentElement }) {
      return new AudioControls({ node, attachmentElement })
    }
  } ]
}
```

The node class must already be registered with the editor. The factory runs
after its attachment DOM exists and returns an object with:

- `element`: the DOM containing the controls.
- `anchor`: an element inside the attachment whose bounds determine the
  controls' position and size. Defaults to the whole attachment.
- `label`: an accessible name for this attachment's controls.
- `role`: defaults to `"toolbar"`. Use `"group"` for a group of fields that
  should retain ordinary Tab and arrow-key behavior.
- `update({ node, attachmentElement })`: an optional callback receiving the
  current node after it changes. Update the view and its accessible name here.
- `dispose()`: an optional callback to release media, listeners and timers.

The factory may return `null` for nodes that need no custom controls. Lexxy
disposes the controls when their node disappears or its DOM is rebuilt, and
recreates them if the node returns through Undo. It does not persist controls
in the editor's value. Avoid retaining the node passed to `create`: later edits
may replace it with a new node instance.

Custom controls stay visible when their attachment is unselected. When selected,
the same external toolbar also contains Lexxy's contextual actions, such as
Remove. Alt+F10 focuses its first available button; Left/Right and Home/End move
between buttons; Escape returns to the selected attachment; Tab opens its
caption when one is available. Buttons stay outside the normal Tab sequence
when the toolbar loses focus. Fields keep the Tab index set by the extension.
The same interactions work when the editor is read-only.

Style the supplied controls in your application. Lexxy's floating-button styles
apply to its own actions, leaving the supplied controls' appearance intact.
`editorElement.attachmentControls.elementFor(nodeKey)` returns the mounted
control element, or `null` if none is mounted.

## Allowing additional HTML elements

Lexxy sanitizes HTML when loading and pasting content, stripping any element it doesn't recognize. If your extension introduces new elements, declare them with an `allowedElements` getter so they survive sanitization. Each entry is either a tag name, or an object pairing a `tag` with the extra `attributes` to preserve on it:

```js
get allowedElements() {
  return [ "figure", { tag: "iframe", attributes: [ "src", "loading", "allow" ] } ]
}
```

Declared attributes apply only to editors where your extension is enabled. Some can't be declared at all, because they run script or load markup whatever their value: event handlers (`onclick` and every other `on…` attribute), `srcdoc`, `patchsrc`, and `for` on anything but a `<label>` or `<output>`. Neither can the elements `script`, `style`, `link`, `meta` and `base`. URL attributes such as `href`, `src` or `formaction` can be declared, and DOMPurify still checks their values, so a value starting with `javascript:` is dropped.

This governs Lexxy's sanitizing in the browser. When the content is rendered, Action Text sanitizes it again on the server, with your application's allowlist, and drops any attribute that isn't on it. If your elements need attributes that the server drops, add them in an initializer:

```ruby
# config/initializers/action_text.rb
ActiveSupport.on_load(:action_text_content) do
  allowed_attributes = Class.new.include(ActionText::ContentHelper).new.sanitizer_allowed_attributes
  ActionText::ContentHelper.allowed_attributes = allowed_attributes + %w[ data-id ]
end
```

The server's allowlist is app-wide: it applies to every element in all rich text, whichever editor wrote it. Lexxy's limits don't apply there, so never add event handlers or other attributes from the list above to it.

### URI-safe schemes

Allowing an attribute lets it survive by name, but Lexxy still runs DOMPurify's URL scheme check on its value and drops anything whose scheme it doesn't recognize. If your element carries an identifier that uses a custom scheme — a mention's `gid="gid://…"`, say — declare that scheme in `uriSafeSchemes` so values using it are kept:

```js
get allowedElements() {
  return [ { tag: "bc-mention", attributes: [ "gid" ], uriSafeSchemes: [ "gid" ] } ]
}
```

This widens the editor's recognized-safe scheme set; it does **not** exempt any attribute from validation. The executable schemes — `javascript:`, `data:`, `vbscript:` and the rest of the `…script:` family — can't be declared this way: they're dropped from the list, so they stay refused on every attribute, including `href` and `object[data]`, and a declared scheme can't smuggle an executable URL through a link or resource attribute. Declare it on the element that needs it for locality, though the scheme is recognized editor-wide once allowed — so use it only for schemes that are inert in the browser, like an identifier scheme (`gid:`).

## Allowing additional inline styles

Lexxy also filters the `style` attribute, keeping only `color` and `background-color`. If your extension produces other inline styles, declare each property with an `allowedStyles` getter, together with the values it accepts: either a fixed list of `values`, or a `validate` function that returns `true` for a value to keep.

```js
get allowedStyles() {
  return [
    { property: "text-align", values: [ "left", "center", "right", "justify" ] },
    { property: "line-height", validate: value => /^\d(\.\d+)?$/.test(value) }
  ]
}
```

A property without values or a validator is ignored: allowing a property by name would let stored content give it any value, and the value is where CSS attacks live. A validator must return `true` exactly, and must be pure: it runs during sanitizing. Some protections apply whatever you declare:

- Values that load a resource or run script are always dropped (`url()`, `image-set()`, `expression()` and the like), as are values with backslash escapes, comments, unbalanced quotes or brackets, `!important`, or `var()`/`env()`.
- Properties that load images or other resources (`background`, anything with `image`, `mask` or `filter` in its name, `content`, `cursor`, `list-style`, …), `position`, and `behavior`/`-moz-binding` can't be declared at all. Neither can custom properties (`--x`), or `color` and `background-color`, which Lexxy manages itself.

That isn't a guarantee about layout: properties such as `transform`, margins or `z-index` can move content over the rest of the page, so only open layout properties with values you have checked.

Declared styles apply only to editors where your extension is enabled; other editors on the page keep filtering them out.

They govern Lexxy's sanitizing in the browser. When the content is rendered, Action Text sanitizes it again on the server, with your application's sanitizer: by default that keeps only the CSS properties Loofah allows (`text-align`, `line-height` and `font-family` are among them), so check that the styles you declare survive rendering, and widen the server's list if they need to.

## Example

```js
import * as Lexxy from "@37signals/lexxy"

Lexxy.configure({
  global: {
    extensions: [ MyLexxyExtension ]
  },
  default: {
    my_extension: {
      enableCoolFeature: true
    }
  }
})

class MyLexxyExtension extends Lexxy.Extension {
  // optional: defaults to true
  get enabled() {
    // depend on an editor config
    return this.editorElement.supportsRichText

    // ... or a custom configuration
    return this.#config.enableCoolFeature
  }

  // optional: allow additional elements
  get allowedElements() {
    return [ { tag: "iframe", attributes: [ "src", "loading", "allow" ] } ]
  }

  get lexicalExtension() {
    return this.defineExtension({
      name: "lexxy/my_lexical_extension",
      config: this.#config,
      ///...
      register(editor, config) {
        // ... custom Lexical behavior
      }
    })
  }

  initializeToolbar(lexxyToolbar) {
    // ...Toolbar initialization code

    lexxyToolbar.querySelector("button[name=bold]").insertAdjacentElement(myToolbarElement)
  }

  get #config() {
    return this.editorConfig.get("my_extension")
  }
}
```
