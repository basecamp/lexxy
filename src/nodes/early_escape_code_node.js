import { CodeNode } from "@lexical/code"
import { $getNearestNodeOfType } from "@lexical/utils"
import { $insertNewParagraphAfter, $isCursorOnLastLine, $trimTrailingBlankNodes } from "../helpers/lexical_helper"

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

    if (this.#isCursorOnEmptyLastLine(selection)) {
      $trimTrailingBlankNodes(this)
      return $insertNewParagraphAfter(this)
    }

    return super.insertNewAfter(selection, restoreSelection)
  }

  #isCursorOnEmptyLastLine(selection) {
    if (!$isCursorOnLastLine(selection)) return false

    const textContent = this.getTextContent()
    return textContent === "" || textContent.endsWith("\n")
  }

}
