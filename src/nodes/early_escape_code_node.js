import { $createParagraphNode } from "lexical"
import { CodeNode } from "@lexical/code"
import { $getNearestNodeOfType } from "@lexical/utils"
import { $isAtNodeStart, $isCursorOnLastLine, $trimTrailingBlankNodes } from "../helpers/lexical_helper"

export class EarlyEscapeCodeNode extends CodeNode {
  $config() {
    return this.config("early_escape_code", { extends: CodeNode })
  }

  static $fromSelection(selection) {
    const anchorNode = selection.anchor.getNode()
    return $getNearestNodeOfType(anchorNode, EarlyEscapeCodeNode)
      || (anchorNode instanceof EarlyEscapeCodeNode ? anchorNode : null)
  }

  insertNewAfter(selection, restoreSelection) {
    if (!selection.isCollapsed()) return super.insertNewAfter(selection, restoreSelection)

    if (this.#isCursorAtStart(selection)) {
      this.insertBefore($createParagraphNode())
      return null
    }

    if (this.#isCursorOnEmptyLastLine(selection)) {
      $trimTrailingBlankNodes(this)

      const paragraph = $createParagraphNode()
      this.insertAfter(paragraph)
      return paragraph
    }

    return super.insertNewAfter(selection, restoreSelection)
  }

  #isCursorAtStart(selection) {
    const { anchor } = selection
    if (!$isAtNodeStart(anchor)) return false

    const anchorNode = anchor.getNode()
    if (anchorNode === this) return true

    const firstChild = this.getFirstChild()
    return firstChild !== null && anchorNode === firstChild
  }

  #isCursorOnEmptyLastLine(selection) {
    if (!$isCursorOnLastLine(selection)) return false

    const textContent = this.getTextContent()
    return textContent === "" || textContent.endsWith("\n")
  }

}
