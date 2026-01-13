import "./config/prism"
import "./config/dom_purify"

import "./elements/toolbar"

import "./elements/editor"
import "./elements/dropdown/link"
import "./elements/dropdown/highlight"
import "./elements/table_handler"
import "./elements/prompt"
import "./elements/code_language_picker"

import Lexxy from "./config/lexxy"
export { highlightAll } from "./helpers/code_highlighting_helper"

export const configure = Lexxy.configure
export { default as Extension } from "./extensions/lexxy_extension.js"
