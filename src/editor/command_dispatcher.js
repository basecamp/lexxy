import {
  $getSelection,
  $isRangeSelection,
  PASTE_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND
} from "lexical"

import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list"
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"
import { CodeNode, $isCodeNode } from "@lexical/code"
import { $toggleLink } from "@lexical/link"
import { createElement } from "../helpers/html_helper"
import { getListType } from "../helpers/lexical_helper";

const COMMANDS = [
  "bold",
  "rotateHeadingFormat",
  "italic",
  "link",
  "unlink",
  "insertUnorderedList",
  "insertOrderedList",
  "insertQuoteBlock",
  "insertCodeBlock",
  "uploadAttachments"
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

  dispatchLink(url) {
    this.#toggleLink(url)
  }

  dispatchUnlink() {
    this.#toggleLink(null)
  }

  dispatchInsertUnorderedList() {
    const selection = $getSelection()
    if (!selection) return;

    const anchorNode = selection.anchor.getNode()

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "bullet") {
      this.contents.unwrapSelectedListItems()
    } else {
      this.editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    }
  }

  dispatchInsertOrderedList() {
    const selection = $getSelection()
    if (!selection) return;

    const anchorNode = selection.anchor.getNode()

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "number") {
      this.contents.unwrapSelectedListItems()
    } else {
      this.editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }
  }

  dispatchInsertQuoteBlock() {
    this.contents.toggleNodeWrappingAllSelectedLines((node) => $isQuoteNode(node), () => $createQuoteNode())
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

  dispatchRotateHeadingFormat() {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

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
      onchange: ({ target }) => {
        const files = Array.from(target.files)
        if (!files.length) return

        for (const file of files) {
          this.contents.uploadFile(file)
        }
      }
    })

    document.body.appendChild(input) // Append and remove just for the sake of making it testeable
    input.click()
    setTimeout(() => input.remove(), 1000)
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

    for (const file of files) {
      this.contents.uploadFile(file)
    }

    this.editor.focus()
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
