// Adapted from the makeChanges handler in @lexical/dragon (MIT License,
// Copyright (c) Meta Platforms, Inc. and affiliates), which carries the protocol
// fixes from facebook/lexical#8665 but still resolves offsets against the text
// node at the caret.
import { $createRangeSelectionFromDom, $getSelection, $isRangeSelection, $setSelection } from "lexical"

const TEXT_FORMAT_BY_EXEC_COMMAND = new Map([
  [ "bold", "bold" ],
  [ "italic", "italic" ],
  [ "strikeThrough", "strikethrough" ],
  [ "subscript", "subscript" ],
  [ "superscript", "superscript" ],
  [ "underline", "underline" ]
])

const INSTALLED = Symbol.for("lexxy/dragon/makeChanges")

if (!document[INSTALLED]) {
  document[INSTALLED] = true
  document.addEventListener("lexxy:dragon-make-changes", (event) => {
    const editorElement = document.activeElement?.closest("lexxy-editor")
    const isEditorFocused = editorElement?.editor?.getRootElement() === document.activeElement

    if (isEditorFocused && isWellFormed(event.detail)) {
      new MakeChangesMessage(event.detail).applyTo(editorElement)
    }
  })
}

function isWellFormed(args) {
  if (!Array.isArray(args)) return false

  const [ elementStart, elementLength, text, selStart, selLength ] = args
  return [ elementStart, elementLength, selStart, selLength ].every(Number.isFinite) &&
    (typeof text === "string" || text === -1 || text === null)
}

// A text of -1 (a number, not a string) means "change the selection without
// touching the text", which is how Select-and-Say corrections and cursor moves
// by voice arrive. The extension reads a null text as an empty one.
class MakeChangesMessage {
  constructor([ elementStart, elementLength, text, selStart, selLength, formatCommand ]) {
    this.elementStart = elementStart
    this.elementLength = elementLength
    this.text = text ?? ""
    this.selStart = selStart
    this.selLength = selLength
    this.formatCommand = formatCommand
  }

  // Offsets are resolved against the rendered DOM, so the text change has to be
  // reconciled (discrete) before the final selection, which addresses the new text.
  applyTo(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.editor.update(() => this.#replaceAddressedRange(), { discrete: true })
    this.editor.update(() => this.#selectFinalRange())
  }

  // Like the extension, a range it can't address leaves the selection alone, and
  // then the text goes nowhere rather than replacing whatever is selected
  #replaceAddressedRange() {
    let isAddressed = true
    if (this.elementStart >= 0 && this.elementLength >= 0) {
      isAddressed = this.#select(this.elementStart, this.elementStart + this.elementLength)
    }

    const selection = $getSelection()
    if (isAddressed && this.#changesText && $isRangeSelection(selection)) {
      selection.insertRawText(this.#insertableText)
    }
  }

  get #changesText() {
    return typeof this.text === "string" && (this.text !== "" || this.elementLength > 0)
  }

  get #insertableText() {
    const text = this.text.replace(/\r\n?/g, "\n")
    if (this.editorElement.supportsMultiLine) {
      return text
    } else {
      return text.replace(/\n/g, " ")
    }
  }

  // A negative length collapses the selection instead of leaving a backward
  // range that the next input would replace
  #selectFinalRange() {
    let isSelected
    if (this.selStart >= 0 && this.selLength >= 0) {
      isSelected = this.#select(this.selStart, this.selStart + this.selLength)
    } else {
      isSelected = this.#select(this.selStart, this.selStart)
    }

    if (isSelected) this.#applyFormatCommand()
  }

  #select(from, to) {
    const text = new DragonText(this.editor.getRootElement())
    const anchor = text.pointAt(from)
    const focus = text.pointAt(to)
    if (!anchor || !focus) return false

    const selection = $createRangeSelectionFromDom({
      anchorNode: anchor.node,
      anchorOffset: anchor.offset,
      focusNode: focus.node,
      focusOffset: focus.offset
    }, this.editor)

    if (selection) $setSelection(selection)
    return true
  }

  // Voice commands like "bold that" arrive as execCommand names. A collapsed
  // selection would toggle the pending format instead of formatting a range.
  #applyFormatCommand() {
    const selection = $getSelection()
    if (this.#format && this.editorElement.supportsRichText && this.selLength > 0 && $isRangeSelection(selection) && !selection.isCollapsed()) {
      selection.formatText(this.#format)
    }
  }

  get #format() {
    return TEXT_FORMAT_BY_EXEC_COMMAND.get(this.formatCommand)
  }
}

const BLOCK_ELEMENTS = new Set([ "P", "DIV", "UL", "LI", "OL", "BLOCKQUOTE", "TH", "TR", "TD", "H1", "H2", "H3", "H4", "H5", "H6" ])
const PARSED_ELEMENTS = new Set([ ...BLOCK_ELEMENTS, "BR", "SPAN", "I", "B", "U", "A", "S", "FONT", "EM", "STRONG", "SMALL", "TABLE", "TBODY", "CENTER" ])
const IGNORED_ELEMENTS = new Set([ "SCRIPT", "STYLE" ])
const LUMP = "[~]"

// Dragon addresses positions in the field's text as its web extension flattens
// the contenteditable: a line feed (\r\n, or \r on macOS) around blocks and for
// each <br>, and a "[~]" placeholder for any element it doesn't parse (<mark>,
// <code>, <pre>, <hr>, attachments...), whose contents it skips. This mirrors
// that flattening and returns the DOM point a Dragon offset lands on, or null
// when the offset is outside the field.
class DragonText {
  constructor(root) {
    this.root = root
    this.lineFeed = navigator.appVersion.includes("Mac") ? "\r" : "\r\n"
  }

  pointAt(offset) {
    this.target = offset
    this.length = 0
    this.lastBreak = "start"
    this.point = null
    this.found = false

    this.#visitChildren(this.root)
    if (this.found || this.length >= offset) return this.point
    return null
  }

  #visitChildren(element) {
    for (const [ index, child ] of Array.from(element.childNodes).entries()) {
      if (this.found) break
      this.#visit(child, element, index)
    }
  }

  #visit(node, parent, index) {
    if (node.nodeType === Node.TEXT_NODE) {
      this.#visitText(node)
    } else if (!PARSED_ELEMENTS.has(node.nodeName)) {
      if (!IGNORED_ELEMENTS.has(node.nodeName)) this.#visitLump(parent, index)
    } else if (node.nodeName === "BR") {
      this.#visitLineBreak(parent, index)
    } else {
      this.#visitElement(node)
    }
  }

  // Indexes by UTF-16 code unit, like the extension and DOM offsets do
  #visitText(node) {
    for (let index = 0; index < node.data.length; index++) {
      const flattened = this.#flatten(node.data[index])
      this.#mark(node, index)
      this.length += flattened.length
      if (flattened.length > 0) this.lastBreak = null
      this.#mark(node, index + 1)
    }
  }

  #flatten(character) {
    if (character === " ") {
      return " "
    } else if (character === " " && (this.lastBreak === "block" || this.lastBreak === "br")) {
      return " "
    } else if (character === "​") {
      return ""
    } else if (/\s/.test(character)) {
      return this.lastBreak ? "" : " "
    } else {
      return character
    }
  }

  #visitLump(parent, index) {
    this.#mark(parent, index)
    this.length += LUMP.length
    this.lastBreak = null
    this.#mark(parent, index + 1)
  }

  #visitLineBreak(parent, index) {
    this.#mark(parent, index)
    this.length += this.lineFeed.length
    this.lastBreak = "br"
    this.#mark(parent, index + 1)
  }

  #visitElement(element) {
    const isBlock = BLOCK_ELEMENTS.has(element.nodeName)

    if (isBlock) this.#breakAfterContent()
    this.#visitChildren(element)
    if (isBlock) this.#breakAfterContent()
  }

  #breakAfterContent() {
    if (this.lastBreak === null) {
      this.length += this.lineFeed.length
      this.lastBreak = "block"
    }
  }

  // Points come in document order, so the last one at or before the target is
  // where the offset lands: the start of the next character beats the end of the
  // previous one when both share the offset.
  #mark(node, offset) {
    if (this.target >= 0 && this.length <= this.target) {
      this.point = { node, offset }
    } else {
      this.found = true
    }
  }
}
