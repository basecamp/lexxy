import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  KEY_TAB_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  PASTE_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND
} from "lexical"
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list"
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"
import { $isCodeNode, CodeNode } from "@lexical/code"
import { $createAutoLinkNode, $toggleLink } from "@lexical/link"
import { INSERT_TABLE_COMMAND } from "@lexical/table"

import { createElement } from "../helpers/html_helper"
import { getListType } from "../helpers/lexical_helper"
import { HorizontalDividerNode } from "../nodes/horizontal_divider_node"

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
    this.highlighter = editorElement.highlighter

    this.#registerCommands()
    this.#registerKeyboardCommands()
    this.#registerDragAndDropHandlers()
  }

  destroy() {
    this.#unregisterCommands()
    this.#unregisterDragAndDropHandlers()
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
    this.highlighter.toggle(styles)
  }

  dispatchRemoveHighlight() {
    this.highlighter.remove()
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
    this.editor.update(() => {
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
    })
  }

  dispatchUploadAttachments() {
    const input = createElement("input", {
      type: "file",
      multiple: true,
      style: "display: none;",
      onchange: ({ target }) => {
        const files = Array.from(target.files)
        if (!files.length) return

        for (const file of files) {
          this.contents.uploadFile(file)
        }
      }
    })

    this.editorElement.appendChild(input) // Append and remove just for the sake of making it testable
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
    this.unregisterCommands ||= []
    this.unregisterCommands.push(this.editor.registerCommand(command, handler, priority))
  }

  #registerKeyboardCommands() {
    this.unregisterCommands ||= []
    this.unregisterCommands.push(this.editor.registerCommand(KEY_TAB_COMMAND, this.#handleTabKey.bind(this), COMMAND_PRIORITY_NORMAL))
  }


  #unregisterCommands() {
    this.unregisterCommands?.forEach((unregisterCommand) => {
      unregisterCommand()
    })
    this.unregisterCommands = null
  }

  #registerDragAndDropHandlers() {
    if (this.editorElement.supportsAttachments) {
      this.dragCounter = 0
      this.boundDragHandlers = {
        dragover: this.#handleDragOver.bind(this),
        drop: this.#handleDrop.bind(this),
        dragenter: this.#handleDragEnter.bind(this),
        dragleave: this.#handleDragLeave.bind(this),
      }
      const root = this.editor.getRootElement()
      for (const [ event, handler ] of Object.entries(this.boundDragHandlers)) {
        root.addEventListener(event, handler)
      }
    }
  }

  #unregisterDragAndDropHandlers() {
    if (this.boundDragHandlers) {
      const root = this.editor.getRootElement()
      for (const [ event, handler ] of Object.entries(this.boundDragHandlers)) {
        root.removeEventListener(event, handler)
      }
      this.boundDragHandlers = null
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

    for (const file of files) {
      this.contents.uploadFile(file)
    }

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
