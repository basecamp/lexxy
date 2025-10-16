// Manual highlighting mode to prevent invocation on every page. See https://prismjs.com/docs/prism
// This must happen before importing any Prism components
window.Prism = window.Prism || {}
Prism.manual = true

import "./config/dom_purify"

import "./elements/toolbar"
import "./elements/editor"
import "./elements/link_dialog"
import "./elements/color_dialog"
import "./elements/prompt"
import "./elements/code_language_picker"

import "prismjs/components/prism-ruby"

export { highlightAll } from "./helpers/code_highlighting_helper"
