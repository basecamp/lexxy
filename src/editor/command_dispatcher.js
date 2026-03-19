import {
  $createTextNode,
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
import { $createAutoLinkNode, $toggleLink } from "@lexical/link"
import { INSERT_TABLE_COMMAND } from "@lexical/table"

import { createElement } from "../helpers/html_helper"
import { getListType } from "../helpers/lexical_helper"
import { HorizontalDividerNode } from "../nodes/horizontal_divider_node"
import { REMOVE_HIGHLIGHT_COMMAND, TOGGLE_HIGHLIGHT_COMMAND } from "../extensions/highlight_extension"

const COMMANDS = [
  "bold",
  "italic",
  "strikethrough",
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
    this.#toggleLink(null)
  }

  dispatchInsertUnorderedList() {
    const selection = $getSelection()
    if (!selection) return

    const anchorNode = selection.anchor.getNode()

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "bullet") {
      this.contents.setBlockFormat(null)
    } else {
      this.editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    }
  }

  dispatchInsertOrderedList() {
    const selection = $getSelection()
    if (!selection) return

    const anchorNode = selection.anchor.getNode()

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "number") {
      this.contents.setBlockFormat(null)
    } else {
      this.editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }
  }

  dispatchInsertQuoteBlock() {
    this.contents.toggleBlockquote()
  }

  dispatchInsertCodeBlock() {
    if (this.selection.hasSelectedWordsInSingleLine) {
      this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")
    } else {
      this.contents.toggleCodeBlock()
    }
  }

  dispatchInsertHorizontalDivider() {
    this.contents.insertAtCursorEnsuringLineBelow(new HorizontalDividerNode())
    this.editor.focus()
  }

  dispatchSetFormatHeadingLarge() {
    this.contents.setBlockFormat("h2")
  }

  dispatchSetFormatHeadingMedium() {
    this.contents.setBlockFormat("h3")
  }

  dispatchSetFormatHeadingSmall() {
    this.contents.setBlockFormat("h4")
  }

  dispatchSetFormatParagraph() {
    this.contents.setBlockFormat(null)
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

  // Not using TOGGLE_LINK_COMMAND because it's not handled unless you use React/LinkPlugin
  #toggleLink(url) {
    this.editor.update(() => {
      if (url === null) {
        $toggleLink(null)
      } else {
        $toggleLink(url)
      }
    })
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
