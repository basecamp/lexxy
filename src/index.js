// Manual highlighting mode to prevent invocation on every page. See https://prismjs.com/docs/prism
// This must happen before importing any Prism components
window.Prism = window.Prism || {}
Prism.manual = true

import "./config/dom_purify"

import "./elements/toolbar"

// Additional Prism languages need to be imported before the editor is loaded, otherwise they are not highlighted on inital load
import "prismjs/components/prism-ruby"
import "prismjs/components/prism-php"
import "prismjs/components/prism-go"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-json"
import "prismjs/components/prism-diff"

import "./elements/editor"
import "./elements/link_dropdown"
import "./elements/highlight_dropdown"
import "./elements/prompt"
import "./elements/code_language_picker"

export { highlightAll } from "./helpers/code_highlighting_helper"
