import {
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_TAB_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  PASTE_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND
} from "lexical"
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list"
import { CodeNode } from "@lexical/code"
import { $createAutoLinkNode, $isLinkNode, $toggleLink } from "@lexical/link"
import { INSERT_TABLE_COMMAND } from "@lexical/table"

import { createElement } from "../helpers/html_helper"
import { getListType } from "../helpers/lexical_helper"
import { HorizontalDividerNode } from "../nodes/horizontal_divider_node"
import { REMOVE_HIGHLIGHT_COMMAND, TOGGLE_HIGHLIGHT_COMMAND } from "../extensions/highlight_extension"

const COMMANDS = [
  "bold",
  "italic",
  "strikethrough",
  "underline",
  "link",
  "unlink",
  "toggleHighlight",
  "removeHighlight",
  "setFormatHeadingLarge",
  "setFormatHeadingMedium",
  "setFormatHeadingSmall",
  "setFormatParagraph",
  "insertUnorderedList",
  "insertOrderedList",
  "insertQuoteBlock",
  "insertCodeBlock",
  "setCodeLanguage",
  "insertHorizontalDivider",
  "uploadAttachments",

  "insertTable",

  "undo",
  "redo"
]

export class CommandDispatcher {
  #selectionBeforeDrag = null

  static configureFor(editorElement) {
    new CommandDispatcher(editorElement)
  }

  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.selection = editorElement.selection
    this.contents = editorElement.contents
    this.clipboard = editorElement.clipboard

    this.#registerCommands()
    this.#registerKeyboardCommands()
    this.#registerDragAndDropHandlers()
  }

  dispatchPaste(event) {
    return this.clipboard.paste(event)
  }

  dispatchBold() {
    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
  }

  dispatchItalic() {
    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
  }

  dispatchStrikethrough() {
    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
  }

  dispatchUnderline() {
    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
  }

  dispatchToggleHighlight(styles) {
    this.editor.dispatchCommand(TOGGLE_HIGHLIGHT_COMMAND, styles)
  }

  dispatchRemoveHighlight() {
    this.editor.dispatchCommand(REMOVE_HIGHLIGHT_COMMAND)
  }

  dispatchLink(url) {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      if (selection.isCollapsed()) {
        const autoLinkNode = $createAutoLinkNode(url)
        const textNode = $createTextNode(url)
        autoLinkNode.append(textNode)
        selection.insertNodes([ autoLinkNode ])
      } else {
        $toggleLink(url)
      }
    })
  }

  dispatchUnlink() {
    this.editor.update(() => {
      // Prefer the frozen link key saved during the native bridge freeze/thaw
      // cycle. After contentEditable is toggled off and back on, Lexical retains
      // a stale internal selection that $toggleLink cannot act on reliably.
      if (this.editorElement.adapter.frozenLinkKey) {
        this.#unlinkFrozenNode()
        return
      }

      $toggleLink(null)
    })
  }

  dispatchInsertUnorderedList() {
    const selection = $getSelection()
    if (!selection) return

    const anchorNode = selection.anchor.getNode()

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "bullet") {
      this.contents.applyParagraphFormat()
    } else {
      this.editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    }
  }

  dispatchInsertOrderedList() {
    const selection = $getSelection()
    if (!selection) return

    const anchorNode = selection.anchor.getNode()

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "number") {
      this.contents.applyParagraphFormat()
    } else {
      this.editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }
  }

  dispatchInsertQuoteBlock() {
    this.contents.toggleBlockquote()
  }

  dispatchInsertCodeBlock() {
    if (this.selection.hasSelectedWordsInSingleLine) {
      this.#toggleInlineCode()
    } else {
      this.contents.toggleCodeBlock()
    }
  }

  #toggleInlineCode() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    if (!selection.isCollapsed()) {
      const textNodes = selection.getNodes().filter($isTextNode)
      const applyingCode = !textNodes.every((node) => node.hasFormat("code"))

      if (applyingCode) {
        this.#stripInlineFormattingFromSelection(selection, textNodes)
      }
    }

    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")
  }

  // Strip all inline formatting (bold, italic, etc.) from the selected text
  // nodes so that applying code produces a single merged <code> element instead
  // of one per differently-formatted span.
  #stripInlineFormattingFromSelection(selection, textNodes) {
    const isBackward = selection.isBackward()
    const startPoint = isBackward ? selection.focus : selection.anchor
    const endPoint = isBackward ? selection.anchor : selection.focus

    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i]
      if (node.getFormat() === 0) continue

      const isFirst = i === 0
      const isLast = i === textNodes.length - 1
      const startOffset = isFirst && startPoint.type === "text" ? startPoint.offset : 0
      const endOffset = isLast && endPoint.type === "text" ? endPoint.offset : node.getTextContentSize()

      if (startOffset === 0 && endOffset === node.getTextContentSize()) {
        node.setFormat(0)
      } else {
        const splits = node.splitText(startOffset, endOffset)
        const target = startOffset === 0 ? splits[0] : splits[1]
        target.setFormat(0)

        if (isFirst && startPoint.type === "text") {
          startPoint.set(target.getKey(), 0, "text")
        }
        if (isLast && endPoint.type === "text") {
          endPoint.set(target.getKey(), endOffset - startOffset, "text")
        }
      }
    }
  }

  dispatchSetCodeLanguage(language) {
    if (this.selection.isInsideCodeBlock) {
      this.selection.nearestNodeOfType(CodeNode).setLanguage(language)
    }
  }

  dispatchInsertHorizontalDivider() {
    this.contents.insertAtCursorEnsuringLineBelow(new HorizontalDividerNode())
    this.editor.focus()
  }

  dispatchSetFormatHeadingLarge() {
    this.contents.applyHeadingFormat("h2")
  }

  dispatchSetFormatHeadingMedium() {
    this.contents.applyHeadingFormat("h3")
  }

  dispatchSetFormatHeadingSmall() {
    this.contents.applyHeadingFormat("h4")
  }

  dispatchSetFormatParagraph() {
    this.contents.applyParagraphFormat()
  }

  dispatchUploadAttachments() {
    const input = createElement("input", {
      type: "file",
      multiple: true,
      style: "display: none;",
      onchange: ({ target: { files } }) => {
        this.contents.uploadFiles(files, { selectLast: true })
      }
    })

    // Append and remove to make testable
    this.editorElement.appendChild(input)
    input.click()
    setTimeout(() => input.remove(), 1000)
  }

  dispatchInsertTable() {
    this.editor.dispatchCommand(INSERT_TABLE_COMMAND, { "rows": 3, "columns": 3, "includeHeaders": true })
  }

  dispatchUndo() {
    this.editor.dispatchCommand(UNDO_COMMAND, undefined)
  }

  dispatchRedo() {
    this.editor.dispatchCommand(REDO_COMMAND, undefined)
  }

  #registerCommands() {
    for (const command of COMMANDS) {
      const methodName = `dispatch${capitalize(command)}`
      this.#registerCommandHandler(command, 0, this[methodName].bind(this))
    }

    this.#registerCommandHandler(PASTE_COMMAND, COMMAND_PRIORITY_LOW, this.dispatchPaste.bind(this))
  }

  #registerCommandHandler(command, priority, handler) {
    this.editor.registerCommand(command, handler, priority)
  }

  #registerKeyboardCommands() {
    this.editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, this.#handleArrowRightKey.bind(this), COMMAND_PRIORITY_NORMAL)
    this.editor.registerCommand(KEY_TAB_COMMAND, this.#handleTabKey.bind(this), COMMAND_PRIORITY_NORMAL)
  }

  #handleArrowRightKey(event) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false
    if (this.selection.isInsideCodeBlock || !selection.hasFormat("code")) return false

    const anchorNode = selection.anchor.getNode()
    if (!$isTextNode(anchorNode) || selection.anchor.offset !== anchorNode.getTextContentSize()) return false
    if (anchorNode.getNextSibling() !== null) return false

    event.preventDefault()
    selection.toggleFormat("code")
    return true
  }

  #registerDragAndDropHandlers() {
    if (this.editorElement.supportsAttachments) {
      this.dragCounter = 0
      this.editor.getRootElement().addEventListener("dragover", this.#handleDragOver.bind(this))
      this.editor.getRootElement().addEventListener("drop", this.#handleDrop.bind(this))
      this.editor.getRootElement().addEventListener("dragenter", this.#handleDragEnter.bind(this))
      this.editor.getRootElement().addEventListener("dragleave", this.#handleDragLeave.bind(this))
    }
  }

  #handleDragEnter(event) {
    if (this.#isInternalDrag(event)) return

    this.dragCounter++
    if (this.dragCounter === 1) {
      this.#saveSelectionBeforeDrag()
      this.editor.getRootElement().classList.add("lexxy-editor--drag-over")
    }
  }

  #handleDragLeave(event) {
    if (this.#isInternalDrag(event)) return

    this.dragCounter--
    if (this.dragCounter === 0) {
      this.#selectionBeforeDrag = null
      this.editor.getRootElement().classList.remove("lexxy-editor--drag-over")
    }
  }

  #handleDragOver(event) {
    if (this.#isInternalDrag(event)) return

    event.preventDefault()
  }

  #handleDrop(event) {
    if (this.#isInternalDrag(event)) return

    event.preventDefault()

    this.dragCounter = 0
    this.editor.getRootElement().classList.remove("lexxy-editor--drag-over")

    const dataTransfer = event.dataTransfer
    if (!dataTransfer) return

    const files = Array.from(dataTransfer.files)
    if (!files.length) return

    this.#restoreSelectionBeforeDrag()
    this.contents.uploadFiles(files, { selectLast: true })

    this.editor.focus()
  }

  #saveSelectionBeforeDrag() {
    this.editor.getEditorState().read(() => {
      this.#selectionBeforeDrag = $getSelection()?.clone()
    })
  }

  #restoreSelectionBeforeDrag() {
    if (!this.#selectionBeforeDrag) return

    this.editor.update(() => {
      $setSelection(this.#selectionBeforeDrag)
    })

    this.#selectionBeforeDrag = null
  }

  #isInternalDrag(event) {
    return event.dataTransfer?.types.includes("application/x-lexxy-node-key")
  }

  #handleTabKey(event) {
    if (this.selection.isInsideList) {
      return this.#handleTabForList(event)
    } else if (this.selection.isInsideCodeBlock) {
      return this.#handleTabForCode()
    }
    return false
  }

  #handleTabForList(event) {
    if (event.shiftKey && !this.selection.isIndentedList) return false

    event.preventDefault()
    const command = event.shiftKey? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND
    return this.editor.dispatchCommand(command)
  }

  #handleTabForCode() {
    const selection = $getSelection()
    return $isRangeSelection(selection) && selection.isCollapsed()
  }

  #unlinkFrozenNode() {
    const key = this.editorElement.adapter.frozenLinkKey
    if (!key) return

    const linkNode = $getNodeByKey(key)
    if (!$isLinkNode(linkNode)) return

    const children = linkNode.getChildren()
    for (const child of children) {
      linkNode.insertBefore(child)
    }
    linkNode.remove()

    // Select the former link text so a follow-up createLink can re-wrap it
    const first = children.at(0)
    const last = children.at(-1)
    if (first && last) {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.anchor.set(first.getKey(), 0, "text")
        selection.focus.set(last.getKey(), last.getTextContent().length, "text")
      }
    }

    this.editorElement.adapter.frozenLinkKey = null
  }

}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
