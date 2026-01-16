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

Should you need to extend any of Lexxy's nodes, they are exported at the top-level module:

```javascript
import { ActionTextAttachmentNode } from "@37signals/lexxy"
```

## Example

```js
import { defineExtension } from "lexical"
import * as Lexxy from "@37signals/lexxy"

Lexxy.configure({
global: {
  extensions: [ MyLexxyExtension ]
},
default: {
  my_extension: {
    enableCoolFeature: true
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

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/my_lexical_extension",
      config: this.#config
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
```
```
