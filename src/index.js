import "./config/prism"
import "./config/dom_purify"

import { defineElements } from "./elements/index"
import "./editor/vendor/dragon/support"
import "./editor/vendor/dragon/make_changes"

import Lexxy from "./config/lexxy"

export * from "./nodes"
export * from "./commands"
export { highlightCode, highlightElement } from "./helpers/code_highlighting_helper"
export { NativeAdapter } from "./editor/adapters/native_adapter"
// So a consumer registering the exported attachment nodes in its own Lexical
// editor can declare an allowlist for them, rather than taking the default.
export { default as EditorSanitizer } from "./editor/sanitizer"

let configured = false

export function configure(config) {
  Lexxy.configure(config)
  configured = true
}
export { default as Extension } from "./extensions/lexxy_extension"
export * as Lexical from "lexical"

// Define the elements after the current call stack, so a configure() call right after the import comes first. When
// it did, define them in a microtask: it runs before the browser can paint, so editors already on the page don't show
// up empty for a frame. Otherwise wait for the next task, for a configure() call from a later module script or after
// an await.
queueMicrotask(() => {
  if (configured) {
    defineElements()
  } else {
    setTimeout(defineElements, 0)
  }
})
