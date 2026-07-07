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

## Allowing additional HTML elements

Lexxy sanitizes HTML when loading and pasting content, stripping any element it doesn't recognize. If your extension introduces new elements, declare them with an `allowedElements` getter so they survive sanitization. Each entry is either a tag name, or an object pairing a `tag` with the extra `attributes` to preserve on it:

```js
get allowedElements() {
  return [ "figure", { tag: "iframe", attributes: [ "src", "loading", "allow" ] } ]
}
```

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
