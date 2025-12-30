// Prism config must happen first
import "./config/prism.js"

import "./config/dom_purify"

import "./elements/toolbar"

import "./elements/editor"
import "./elements/dropdown/link"
import "./elements/dropdown/highlight"
import "./elements/prompt"
import "./elements/code_language_picker"

export { highlightAll } from "./helpers/code_highlighting_helper"
