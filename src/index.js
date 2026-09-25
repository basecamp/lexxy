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

export const configure = Lexxy.configure
export { default as Extension } from "./extensions/lexxy_extension"
export * as Lexical from "lexical"

// Pushing elements definition to after the current call stack to allow global configuration to take place first
setTimeout(defineElements, 0)
