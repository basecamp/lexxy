import { $createParagraphNode, $isLineBreakNode, $isTextNode } from "lexical"
import { CodeNode } from "@lexical/code"
import { $getNearestNodeOfType } from "@lexical/utils"

export class EarlyEscapeCodeNode extends CodeNode {
  $config() {
    return this.config("early_escape_code", { extends: CodeNode })
  }

  static $fromSelection(selection) {
    const anchorNode = selection.anchor.getNode()
    return $getNearestNodeOfType(anchorNode, EarlyEscapeCodeNode)
      || (anchorNode instanceof EarlyEscapeCodeNode ? anchorNode : null)
  }

  $isCursorOnLastLine(selection) {
    const anchorNode = selection.anchor.getNode()
    const children = this.getChildren()
    if (children.length === 0) return true

    const lastChild = children[children.length - 1]

    if (anchorNode === this.getLatest() && selection.anchor.offset === children.length) return true
    if (anchorNode === lastChild) return true

    const lastLineBreakIndex = children.findLastIndex(child => $isLineBreakNode(child))
    if (lastLineBreakIndex === -1) return true

    const anchorIndex = children.indexOf(anchorNode)
    return anchorIndex > lastLineBreakIndex
  }

  insertNewAfter(selection, restoreSelection) {
    if (!selection.isCollapsed()) return super.insertNewAfter(selection, restoreSelection)

    if (this.#isCursorOnEmptyLastLine(selection)) {
      this.#removeTrailingEmptyLine()

      const paragraph = $createParagraphNode()
      this.insertAfter(paragraph)
      return paragraph
    }

    return super.insertNewAfter(selection, restoreSelection)
  }

  #isCursorOnEmptyLastLine(selection) {
    const children = this.getChildren()
    if (children.length === 0) return true

    const anchorNode = selection.anchor.getNode()
    const anchorOffset = selection.anchor.offset

    // Chromium: cursor on the CodeNode element after the last child (a line break)
    if (anchorNode === this.getLatest() && anchorOffset === children.length) {
      return $isLineBreakNode(children[children.length - 1])
    }

    // Firefox: cursor on an empty text node that follows a line break at the end
    if ($isTextNode(anchorNode) && anchorNode.getTextContentSize() === 0 && anchorOffset === 0) {
      const previousSibling = anchorNode.getPreviousSibling()
      return $isLineBreakNode(previousSibling) && anchorNode.getNextSibling() === null
    }

    return false
  }

  #removeTrailingEmptyLine() {
    const children = this.getChildren()
    const lastChild = children[children.length - 1]

    if ($isTextNode(lastChild) && lastChild.getTextContentSize() === 0) {
      const previousSibling = lastChild.getPreviousSibling()
      lastChild.remove()
      if ($isLineBreakNode(previousSibling)) previousSibling.remove()
    } else if ($isLineBreakNode(lastChild)) {
      lastChild.remove()
    }
  }
}
