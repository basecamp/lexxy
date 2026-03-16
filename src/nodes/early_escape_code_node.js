import { $applyNodeReplacement, $createParagraphNode, $isLineBreakNode } from "lexical"
import { $createCodeNode as $originalCreateCodeNode, CodeNode } from "@lexical/code"
import { $lastToFirstIterator } from "@lexical/utils"

export class EarlyEscapeCodeNode extends CodeNode {
  $config() {
    return this.config("early-escape-code", {
      extends: CodeNode
    })
  }

  insertNewAfter(selection, restoreSelection) {
    if (selection.isCollapsed() && this.#isCursorOnEmptyLastLine(selection)) {
      this.#removeTrailingLine()
      this.#trimTrailingLineBreaks()

      const paragraph = $createParagraphNode()
      this.insertAfter(paragraph, restoreSelection)
      return paragraph
    } else {
      return super.insertNewAfter(selection, restoreSelection)
    }
  }

  #isCursorOnEmptyLastLine(selection) {
    if (this.isEmpty()) return true

    return this.#anchorIsWithinLastChild(selection.anchor) && this.#lastChildIsBlank()
  }

  #anchorIsWithinLastChild(anchor) {
    return anchor.offset === this.getChildrenSize() || anchor.getNode().is(this.getLastChild())
  }

  #lastChildIsBlank() {
    return this.getLastChild().getTextContent().trim() === ""
  }

  #removeTrailingLine() {
    const lastChild = this.getLastChild()
    lastChild.remove()
  }

  #trimTrailingLineBreaks() {
    for (const child of $lastToFirstIterator(this)) {
      if ($isLineBreakNode(child)) {
        child.remove()
      } else {
        break
      }
    }
  }
}

export function $createCodeNode(language, theme) {
    return $applyNodeReplacement($originalCreateCodeNode(language, theme))
}
