import "./config/prism"
import "./config/dom_purify"

import "./elements/toolbar"

import "./elements/editor"
import "./elements/dropdown/link"
import "./elements/dropdown/highlight"
import "./elements/table/table_tools.js"
import "./elements/table/table_controller.js"
import "./elements/prompt"
import "./elements/code_language_picker"

import Lexxy from "./config/lexxy"

export * from "./nodes"
export { highlightCode } from "./helpers/code_highlighting_helper"

export const configure = Lexxy.configure
export { default as Extension } from "./extensions/lexxy_extension"
export { default as VoiceNoteExtension } from "./extensions/voice_note_extension"

// legacy export for <=v0.7
export { highlightCode as highlightAll } from "./helpers/code_highlighting_helper"
