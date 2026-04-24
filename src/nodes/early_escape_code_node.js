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

    // Clamp element-type selection offsets that may have been invalidated
    // by the code retokenizer. The retokenizer's $updateAndRetainSelection
    // restores the element offset verbatim after re-tokenizing, but when
    // highlight splits changed the child count before retokenization, the
    // restored offset can exceed the current child count. Without clamping,
    // CodeNode.insertNewAfter passes the stale offset to splice(), which
    // throws "start + deleteCount > oldSize".
    this.#clampSelectionOffset(selection)

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

  #clampSelectionOffset(selection) {
    const childrenSize = this.getChildrenSize()
    for (const point of [ selection.anchor, selection.focus ]) {
      if (point.type === "element" && point.key === this.__key && point.offset > childrenSize) {
        point.set(this.__key, childrenSize, "element")
      }
    }
  }

  #isCursorAtStart(selection) {
    const { anchor } = selection
    if (!$isAtNodeStart(anchor)) return false

    const anchorNode = anchor.getNode()
    return this.is(anchorNode) || this.getFirstChild()?.is(anchorNode)
  }

  #isCursorOnEmptyLastLine(selection) {
    if (!$isCursorOnLastLine(selection)) return false

    const textContent = this.getTextContent()
    return textContent === "" || textContent.endsWith("\n")
  }

}
