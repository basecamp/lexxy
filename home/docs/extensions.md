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

Use `attachmentControls` to add buttons or fields to attachments. For example,
an audio attachment could have Play and Pause buttons, or a recording could
have a field showing the elapsed time.

The controls appear over the attachment, but Lexxy places their HTML outside
the editable text. This lets a button work as a button without becoming part
of the text being edited.

There are three parts to this:

- The **attachment node** defines the attachment's content and appearance in
  the document, including what gets saved.
- Your **extension** creates the buttons or fields and defines what they do.
- **Lexxy** adds and removes those controls, keeps them aligned with the
  attachment, and provides keyboard navigation alongside actions such as Remove.

### Add a button to existing attachments

This example adds a “Show file name” button to each attachment. Pressing it
opens a browser alert with the file name. It uses `ActionTextAttachmentNode`,
which Lexxy already registers, so it does not need a custom node class.

Load this code as part of your editor setup, before creating editors:

```js
import { ActionTextAttachmentNode, configure, Extension } from "@37signals/lexxy"

class FileNameControls extends Extension {
  get attachmentControls() {
    return [ {
      node: ActionTextAttachmentNode,
      create({ node }) {
        let fileName = node.fileName
        const button = document.createElement("button")
        button.type = "button"
        button.className = "attachment-file-name-button"
        button.textContent = "Show file name"
        button.addEventListener("click", () => window.alert(fileName))

        return {
          element: button,
          update({ node }) {
            fileName = node.fileName
          }
        }
      }
    } ]
  }
}

configure({ global: { extensions: [ FileNameControls ] } })
```

Add the button's styles to your application's stylesheet:

```css
.attachment-file-name-button {
  position: absolute;
  bottom: 0;
  left: 0;
  pointer-events: auto;
}
```

Lexxy provides a container covering the attachment. Here, the CSS places the
button at its bottom-left corner. Set `pointer-events: auto` on interactive
controls: the surrounding container lets pointer clicks pass through to the
attachment underneath.

In the example, `node: ActionTextAttachmentNode` tells Lexxy **which node class**
the controls apply to. The `node` passed to `create` is **one attachment** of
that class. Lexxy calls `create` separately for each attachment, once its HTML
exists. Return `null` if a particular attachment does not need controls.

For your own node class, register it through your extension's
`lexicalExtension` as described above, then use that class in `attachmentControls`.
Declaring it in `attachmentControls` does not register the node itself.

Use one controls definition per node class. Put that attachment's buttons and
fields in the element returned by its `create` function. Lexxy reports a
configuration error if two definitions target the same node class.

### Create and update the controls

Lexxy calls `create({ node, attachmentElement })` with the current node and
the HTML element that renders that attachment inside the editor. Return an
object with these properties:

| Property | Purpose |
| --- | --- |
| `element` | Required. The HTML element containing your controls. It can also be a single button or field, as in the example. |
| `update({ node, attachmentElement })` | Optional. Refresh the controls when the attachment changes, for example when its caption is edited. |
| `dispose()` | Optional. Stop playback, clear timers, or remove listeners attached to other elements when Lexxy removes the controls. |
| `placements` | Optional. Position and size controls to match particular elements inside the attachment. See below. |

Lexxy can replace a node instance when it is edited. Event handlers should
therefore use values refreshed by `update`, rather than keep using the node
originally passed to `create`. The example copies the file name into a variable
and updates that variable when the attachment changes.

Lexxy removes the controls when the attachment is deleted or its HTML is
replaced, and calls `dispose` if provided. Undo creates the controls again.
Disconnecting the editor also cleans them up. The controls themselves are not
included in the editor's saved content.

### Align controls with specific parts of an attachment

CSS is enough when all your controls can share the attachment's overall area,
as in the example above. Use `placements` when a control needs to match the
position and size of a specific part of the attachment.

For example, a custom audio node could render an empty space for its Play button:

```html
<figure>
  <span data-play-button-space style="display: block; width: 32px; height: 32px"></span>
  <figcaption>Voice message</figcaption>
</figure>
```

In that node's controls factory, create your Play button and include this pair
in the returned object:

```js
placements: [ {
  element: playButton,
  anchor: attachmentElement.querySelector("[data-play-button-space]")
} ]
```

Here, `playButton` is the button your factory created. `anchor` is the empty
span rendered by the node. Lexxy makes the button occupy the same rectangle
as that span, while keeping the button outside the editable text. The span
must reserve enough space for the button in the attachment's layout.

Each `element` in `placements` must be the returned `element` or one of its
children. Each `anchor` must exist inside `attachmentElement`. You can provide
more than one pair, for example one for a Play button and another for a
progress bar. Lexxy updates their positions as the editor scrolls or resizes,
and clips them to the same scrolling area as the attachment.

### Keyboard navigation and styling

For selectable attachments, your buttons join Lexxy's existing attachment
toolbar:

- Select the attachment, then press **Alt+F10** to focus the first available button.
- Use **Left/Right**, **Home**, and **End** to move between buttons, including Remove.
- Press **Escape** to return to the selected attachment.
- Press **Tab** to edit the caption, when the attachment has an editable caption.

Lexxy manages the buttons' Tab order so users do not have to Tab through every
attachment's buttons while moving through the editor. Fields retain the Tab
order you give them.

Custom attachment nodes use their existing `label` getter to support selection
and these keyboard commands. A node without a selection label keeps its
controls' normal Tab stops and native keyboard behavior. For example, a field
showing the recording time can be reached with Tab without making the recording
a selectable attachment. This node label is separate from the accessible names
you give individual buttons or fields.

Style your controls in your application. They inherit the editor's font and
text color; Lexxy's built-in button styles apply to its own actions. Give each
button or field an accessible name, such as visible button text or `aria-label`.

If you need to find the controls later, call
`editorElement.attachmentControls.elementFor(nodeKey)`, where `nodeKey` is the
attachment's `node.getKey()`. It returns the element supplied by your factory,
or `null` when that attachment has no controls.

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
