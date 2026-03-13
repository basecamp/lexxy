import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isLineBreakNode,
  $isRangeSelection,
  $isTextNode,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  PASTE_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND
} from "lexical"
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list"
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"
import { $isCodeNode, CodeNode } from "@lexical/code"
import { $getNearestNodeOfType } from "@lexical/utils"
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
  "rotateHeadingFormat",
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
      this.contents.unwrapSelectedListItems()
    } else {
      this.editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    }
  }

  dispatchInsertOrderedList() {
    const selection = $getSelection()
    if (!selection) return

    const anchorNode = selection.anchor.getNode()

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "number") {
      this.contents.unwrapSelectedListItems()
    } else {
      this.editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }
  }

  dispatchInsertQuoteBlock() {
    this.contents.toggleNodeWrappingAllSelectedNodes((node) => $isQuoteNode(node), () => $createQuoteNode())
  }

  dispatchInsertCodeBlock() {
    this.editor.update(() => {
      if (this.selection.hasSelectedWordsInSingleLine) {
        this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")
      } else {
        this.contents.toggleNodeWrappingAllSelectedLines((node) => $isCodeNode(node), () => new CodeNode("plain"))
      }
    })
  }

  dispatchInsertHorizontalDivider() {
    this.contents.insertAtCursorEnsuringLineBelow(new HorizontalDividerNode())
    this.editor.focus()
  }

  dispatchRotateHeadingFormat() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    if ($isRootOrShadowRoot(selection.anchor.getNode())) {
      selection.insertNodes([ $createHeadingNode("h2") ])
      return
    }

    const topLevelElement = selection.anchor.getNode().getTopLevelElementOrThrow()
    let nextTag = "h2"
    if ($isHeadingNode(topLevelElement)) {
      const currentTag = topLevelElement.getTag()
      if (currentTag === "h2") {
        nextTag = "h3"
      } else if (currentTag === "h3") {
        nextTag = "h4"
      } else if (currentTag === "h4") {
        nextTag = null
      } else {
        nextTag = "h2"
      }
    }

    if (nextTag) {
      this.contents.insertNodeWrappingEachSelectedLine(() => $createHeadingNode(nextTag))
    } else {
      this.contents.removeFormattingFromSelectedLines()
    }
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
    this.editor.registerCommand(KEY_TAB_COMMAND, this.#handleTabKey.bind(this), COMMAND_PRIORITY_NORMAL)
    this.editor.registerCommand(KEY_ENTER_COMMAND, this.#handleEnterInCodeBlock.bind(this), COMMAND_PRIORITY_NORMAL)
    this.editor.registerCommand(KEY_ARROW_DOWN_COMMAND, this.#handleArrowDownInCodeBlock.bind(this), COMMAND_PRIORITY_NORMAL)
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
    this.dragCounter++
    if (this.dragCounter === 1) {
      this.editor.getRootElement().classList.add("lexxy-editor--drag-over")
    }
  }

  #handleDragLeave(event) {
    this.dragCounter--
    if (this.dragCounter === 0) {
      this.editor.getRootElement().classList.remove("lexxy-editor--drag-over")
    }
  }

  #handleDragOver(event) {
    event.preventDefault()
  }

  #handleDrop(event) {
    event.preventDefault()

    this.dragCounter = 0
    this.editor.getRootElement().classList.remove("lexxy-editor--drag-over")

    const dataTransfer = event.dataTransfer
    if (!dataTransfer) return

    const files = Array.from(dataTransfer.files)
    if (!files.length) return

    this.contents.uploadFiles(files, { selectLast: true })

    this.editor.focus()
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

  #handleEnterInCodeBlock(event) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

    const codeNode = this.#getCodeNodeFromSelection(selection)
    if (!codeNode) return false

    if (this.#isCursorOnEmptyLastLineOfCodeBlock(selection, codeNode)) {
      event?.preventDefault()
      this.#exitCodeBlock(codeNode)
      return true
    }

    return false
  }

  #handleArrowDownInCodeBlock(event) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

    const codeNode = this.#getCodeNodeFromSelection(selection)
    if (!codeNode) return false

    if (this.#isCursorOnLastLineOfCodeBlock(selection, codeNode) && !codeNode.getNextSibling()) {
      event?.preventDefault()
      const paragraph = $createParagraphNode()
      codeNode.insertAfter(paragraph)
      paragraph.selectStart()
      return true
    }

    return false
  }

  #getCodeNodeFromSelection(selection) {
    const anchorNode = selection.anchor.getNode()
    return $getNearestNodeOfType(anchorNode, CodeNode) || ($isCodeNode(anchorNode) ? anchorNode : null)
  }

  #isCursorOnEmptyLastLineOfCodeBlock(selection, codeNode) {
    const children = codeNode.getChildren()
    if (children.length === 0) return true

    const anchorNode = selection.anchor.getNode()
    const anchorOffset = selection.anchor.offset

    // Chromium: cursor on the CodeNode element after the last child (a line break).
    // After pressing Enter at a line end, the cursor lands on the CodeNode at
    // offset === children.length, right after the trailing LineBreakNode.
    if ($isCodeNode(anchorNode) && anchorOffset === children.length) {
      return $isLineBreakNode(children[children.length - 1])
    }

    // Firefox: cursor on an empty text node that follows a line break at the end.
    // Firefox creates or lands on a zero-length text child after the line break,
    // so we check for an empty text node whose previous sibling is a LineBreakNode.
    if ($isTextNode(anchorNode) && anchorNode.getTextContentSize() === 0 && anchorOffset === 0) {
      const previousSibling = anchorNode.getPreviousSibling()
      return $isLineBreakNode(previousSibling) && anchorNode.getNextSibling() === null
    }

    return false
  }

  #isCursorOnLastLineOfCodeBlock(selection, codeNode) {
    const anchorNode = selection.anchor.getNode()
    const children = codeNode.getChildren()
    if (children.length === 0) return true

    const lastChild = children[children.length - 1]

    // Cursor is on the CodeNode itself at the end
    if ($isCodeNode(anchorNode) && selection.anchor.offset === children.length) {
      return true
    }

    // Cursor is on the last child (text or line break)
    if (anchorNode === lastChild) return true

    // Cursor is on a node that comes after the last line break (i.e., on the last line)
    const lastLineBreakIndex = children.findLastIndex(child => $isLineBreakNode(child))
    if (lastLineBreakIndex === -1) return true // No line breaks means single line

    const anchorIndex = children.indexOf(anchorNode)
    return anchorIndex > lastLineBreakIndex
  }

  #exitCodeBlock(codeNode) {
    // Remove trailing empty content: an empty text node and/or a line break node
    const children = codeNode.getChildren()
    const lastChild = children[children.length - 1]

    if ($isTextNode(lastChild) && lastChild.getTextContentSize() === 0) {
      const previousSibling = lastChild.getPreviousSibling()
      lastChild.remove()
      if ($isLineBreakNode(previousSibling)) previousSibling.remove()
    } else if ($isLineBreakNode(lastChild)) {
      lastChild.remove()
    }

    const paragraph = $createParagraphNode()
    codeNode.insertAfter(paragraph)
    paragraph.selectStart()
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
