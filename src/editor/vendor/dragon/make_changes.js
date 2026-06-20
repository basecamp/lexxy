import { $getRoot, $getSelection, $isElementNode, $isRangeSelection } from "lexical"

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

// Dragon addresses positions by their offset in the whole field, counting a
// newline between blocks, not relative to the node at the caret. A text of -1
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
    this.#selectAddressedRange()
    this.#insertText()
    this.#selectFinalRange()
    this.#applyFormatCommand()
  }

  #selectAddressedRange() {
    if (this.elementStart >= 0 && this.elementLength >= 0) {
      this.#select(this.elementStart, this.elementStart + this.elementLength)
    }
  }

  #insertText() {
    if (typeof this.text === "string" && (this.text !== "" || this.elementLength > 0)) {
      this.selection.insertRawText(this.text)
    }
  }

  // Negative offsets collapse the selection instead of leaving a backward range
  // that the next input would replace
  #selectFinalRange() {
    if (this.selStart >= 0 && this.selLength >= 0) {
      this.#select(this.selStart, this.selStart + this.selLength)
    } else {
      this.#select(this.selStart, this.selStart)
    }
  }

  #select(from, to) {
    const start = $pointAtGlobalOffset(from)
    const end = $pointAtGlobalOffset(to)
    if (start && end) {
      this.selection.setTextNodeRange(start.node, start.offset, end.node, end.offset)
    }
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

// Walk the text nodes in document order, counting a newline between top-level
// blocks the way Dragon does, and return the text node and local offset that the
// global offset lands in. Offsets past the end clamp to the last text node.
function $pointAtGlobalOffset(offset) {
  let consumed = 0
  let lastNode = null

  for (const [ index, block ] of $getRoot().getChildren().entries()) {
    if (index > 0) consumed += 1

    if ($isElementNode(block)) {
      for (const node of block.getAllTextNodes()) {
        const size = node.getTextContentSize()
        if (offset <= consumed + size) {
          return { node, offset: Math.max(offset - consumed, 0) }
        }
        consumed += size
        lastNode = node
      }
    }
  }

  if (lastNode) {
    return { node: lastNode, offset: lastNode.getTextContentSize() }
  }
  return null
}
