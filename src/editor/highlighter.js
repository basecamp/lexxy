import { HighlightExtension, TOGGLE_HIGHLIGHT_COMMAND } from "../extensions/highlight_extension.js"

export default class Highlighter {

  constructor(editorElement) {
    this.editorElement = editorElement
  }

  get editor() {
    return this.editorElement.editor
  }

  get lexicalExtension() {
    return [ HighlightExtension, this.editorElement.config.get("highlight") ]
  }

  toggle(styles) {
    this.editor.dispatchCommand(TOGGLE_HIGHLIGHT_COMMAND, styles)
  }

  remove() {
    this.toggle({ "color": null, "background-color": null })
  }
}

