import { $getSelection, $isRangeSelection, $isTextNode } from "lexical"

const TEXT_FORMAT_BY_EXEC_COMMAND = new Map([
  [ "bold", "bold" ],
  [ "italic", "italic" ],
  [ "strikeThrough", "strikethrough" ],
  [ "subscript", "subscript" ],
  [ "superscript", "superscript" ],
  [ "underline", "underline" ]
])

document.addEventListener("lexxy:dragon-make-changes", (event) => {
  const editor = document.activeElement?.closest("lexxy-editor")?.editor
  if (editor) applyMakeChanges(editor, event.detail)
})

function applyMakeChanges(editor, args) {
  if (isWellFormed(args)) {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        new MakeChangesMessage(args).applyTo(selection)
      }
    })
  }
}

function isWellFormed(args) {
  if (!Array.isArray(args)) return false

  const [ elementStart, elementLength, text, selStart, selLength ] = args
  return [ elementStart, elementLength, selStart, selLength ].every(Number.isFinite) &&
    (typeof text === "string" || text === -1)
}

// Offsets are relative to the text node at the selection anchor. A text of -1
// (a number, not a string) means "change the selection without touching the text".
class MakeChangesMessage {
  constructor([ elementStart, elementLength, text, selStart, selLength, formatCommand ]) {
    this.elementStart = elementStart
    this.elementLength = elementLength
    this.text = text
    this.selStart = selStart
    this.selLength = selLength
    this.formatCommand = formatCommand
  }

  applyTo(selection) {
    this.selection = selection
    this.#setAddressedRange()
    this.#insertText()
    this.#setFinalSelection()
    this.#applyFormatCommand()
  }

  #setAddressedRange() {
    if ($isTextNode(this.#anchorNode) && this.elementStart >= 0 && this.elementLength >= 0) {
      const end = this.elementStart + this.elementLength
      this.selection.setTextNodeRange(this.#anchorNode, this.elementStart, this.#anchorNode, end)
    }
  }

  get #anchorNode() {
    return this.selection.anchor.getNode()
  }

  #insertText() {
    if (typeof this.text === "string" && (this.text !== "" || this.#hasTextToReplace)) {
      this.selection.insertRawText(this.text)
    }
  }

  get #hasTextToReplace() {
    return $isTextNode(this.#anchorNode) && this.elementStart >= 0 && this.elementLength > 0
  }

  #setFinalSelection() {
    if ($isTextNode(this.#anchorNode)) {
      this.selection.setTextNodeRange(this.#anchorNode, this.#finalStart, this.#anchorNode, this.#finalEnd)
    }
  }

  get #finalStart() {
    return Math.min(Math.max(this.selStart, 0), this.#anchorNode.getTextContentSize())
  }

  // Negative offsets collapse the selection instead of leaving a backward range
  // that the next input would replace
  get #finalEnd() {
    return this.#hasFinalRange ? Math.min(this.selStart + this.selLength, this.#anchorNode.getTextContentSize()) : this.#finalStart
  }

  get #hasFinalRange() {
    return this.selStart >= 0 && this.selLength >= 0
  }

  // Voice commands like "bold that" arrive as execCommand names. A collapsed
  // selection would toggle the pending format instead of formatting a range.
  #applyFormatCommand() {
    if (this.#format && this.selLength > 0 && !this.selection.isCollapsed()) {
      this.selection.formatText(this.#format)
    }
  }

  get #format() {
    return TEXT_FORMAT_BY_EXEC_COMMAND.get(this.formatCommand)
  }
}
