import "./config/prism"
import "./config/dom_purify"

import { defineElements } from "./elements/index"

import Lexxy from "./config/lexxy"

export * from "./nodes"
export * from "./commands"
export { highlightCode, highlightElement } from "./helpers/code_highlighting_helper"
export { NativeAdapter } from "./editor/adapters/native_adapter"
// So a consumer registering the exported attachment nodes in its own Lexical
// editor can declare an allowlist for them, rather than taking the default.
export { default as EditorSanitizer } from "./editor/sanitizer"

export function configure(config) {
  Lexxy.configure(config)
  configured = true
}
export { default as Extension } from "./extensions/lexxy_extension"
export * as Lexical from "lexical"

// Define the elements once the current call stack is done, so a configure() call right after the import still comes
// first. When the app has configured Lexxy by then, as the docs ask, define them in a microtask, which runs before the
// browser can paint, so editors already on the page are drawn upgraded. Otherwise wait for the next task as before,
// for a configure() call from a later module script or after an await.
let configured = false

queueMicrotask(() => {
  if (configured) {
    defineElements()
  } else {
    setTimeout(defineElements, 0)
  }
})
