import "./config/prism"
import "./config/dom_purify"

import { defineElements } from "./elements"

import Lexxy from "./config/lexxy"

export * from "./nodes"
export { highlightCode } from "./helpers/code_highlighting_helper"

export const configure = Lexxy.configure
export { default as Extension } from "./extensions/lexxy_extension"

// legacy export for <=v0.7
export { highlightCode as highlightAll } from "./helpers/code_highlighting_helper"

setTimeout(defineElements, 0)
