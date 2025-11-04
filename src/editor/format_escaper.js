import { $createParagraphNode, $getSelection, $isRangeSelection, $isParagraphNode, KEY_ENTER_COMMAND, COMMAND_PRIORITY_HIGH } from "lexical"
import { $isListItemNode, $isListNode } from "@lexical/list"
import { $isQuoteNode } from "@lexical/rich-text"

export class FormatEscaper {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
  }

  monitor() {
    this.editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => this.#handleEnterKey(event),
      COMMAND_PRIORITY_HIGH
    )
  }

  #handleEnterKey(event) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false

    const anchorNode = selection.anchor.getNode()

    if (this.#shouldEscapeFromEmptyListItem(anchorNode)) {
      event.preventDefault()
      this.#escapeFromList(anchorNode)
      return true
    }

    if (this.#shouldEscapeFromEmptyParagraphInBlockquote(anchorNode)) {
      event.preventDefault()
      this.#escapeFromBlockquote(anchorNode)
      return true
    }

    return false
  }

  #shouldEscapeFromEmptyListItem(node) {
    const listItem = this.#getListItemNode(node)
    if (!listItem) return false

    return listItem.getTextContent().trim() === ""
  }

  #getListItemNode(node) {
    let currentNode = node

    while (currentNode) {
      if ($isListItemNode(currentNode)) {
        return currentNode
      }
      currentNode = currentNode.getParent()
    }

    return null
  }

  #escapeFromList(anchorNode) {
    const listItem = this.#getListItemNode(anchorNode)
    if (!listItem) return

    const parentList = listItem.getParent()
    if (!parentList || !$isListNode(parentList)) return

    const paragraph = $createParagraphNode()
    parentList.insertAfter(paragraph)

    listItem.remove()
    paragraph.selectStart()
  }

  #shouldEscapeFromEmptyParagraphInBlockquote(node) {
    const paragraph = this.#getParagraphNode(node)
    if (!paragraph) return false

    if (paragraph.getTextContent().trim() !== "") return false

    const parent = paragraph.getParent()
    return parent && $isQuoteNode(parent)
  }

  #getParagraphNode(node) {
    let currentNode = node

    while (currentNode) {
      if ($isParagraphNode(currentNode)) {
        return currentNode
      }
      currentNode = currentNode.getParent()
    }

    return null
  }

  #escapeFromBlockquote(anchorNode) {
    const paragraph = this.#getParagraphNode(anchorNode)
    if (!paragraph) return

    const blockquote = paragraph.getParent()
    if (!blockquote || !$isQuoteNode(blockquote)) return

    const newParagraph = $createParagraphNode()
    blockquote.insertAfter(newParagraph)
    paragraph.remove()
    newParagraph.selectStart()
  }
}
