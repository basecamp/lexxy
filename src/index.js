import "./config/prism"
import "./config/dom_purify"

import { defineElements } from "./elements/index"

import Lexxy from "./config/lexxy"

export * from "./nodes"
export { highlightCode } from "./helpers/code_highlighting_helper"

export const configure = Lexxy.configure
export { default as Extension } from "./extensions/lexxy_extension"
export { addBlockSpacers } from "./helpers/html_helper"

// legacy export for <=v0.7
export { highlightCode as highlightAll } from "./helpers/code_highlighting_helper"

// Pushing elements definition to after the current call stack to allow global configuration to take place first
setTimeout(defineElements, 0)
