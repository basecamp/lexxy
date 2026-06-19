import { $createLineBreakNode, $createParagraphNode, $isElementNode, $isLineBreakNode, $isParagraphNode } from "lexical"
import { $isListNode } from "@lexical/list"

// Balances the line breaks Lexical leaves around a pasted list. The DOM→node
// conversion keeps the breaks before a list but drops the ones after it, so a
// pasted list ends up with two blank lines before and none after. This runs on the
// generated nodes (after PastedContentFormatter has cleaned the source DOM) and
// trims a preceding paragraph's trailing breaks to one while guaranteeing a single
// blank line after the list.
export default class PastedNodesNormalizer {
  constructor(nodes) {
    this.nodes = nodes
  }

  normalize() {
    const result = []

    for (let index = 0; index < this.nodes.length; index++) {
      const node = this.nodes[index]

      if ($isListNode(node)) {
        this.#trimTrailingLineBreaks(result.at(-1))
        result.push(node)
        index = this.#appendNormalizedTrailingSpacing(index, result)
      } else {
        result.push(node)
      }
    }

    return result
  }

  #trimTrailingLineBreaks(node) {
    if (!$isParagraphNode(node)) return

    let trailing = node.getLastChild()
    while ($isLineBreakNode(trailing) && $isLineBreakNode(trailing.getPreviousSibling())) {
      const previous = trailing.getPreviousSibling()
      trailing.remove()
      trailing = previous
    }
  }

  #appendNormalizedTrailingSpacing(listIndex, result) {
    const following = this.nodes[listIndex + 1]

    if ($isParagraphNode(following)) {
      this.#trimLeadingLineBreaks(following)
      result.push(following)
      return listIndex + 1
    }

    let nextIndex = listIndex + 1
    while ($isLineBreakNode(this.nodes[nextIndex])) {
      nextIndex++
    }

    const inlineNodes = []
    while (nextIndex < this.nodes.length && !this.#isBlockNode(this.nodes[nextIndex])) {
      inlineNodes.push(this.nodes[nextIndex])
      nextIndex++
    }

    if (inlineNodes.length > 0) {
      const paragraph = $createParagraphNode()
      paragraph.append($createLineBreakNode(), ...inlineNodes)
      result.push(paragraph)
    }

    return nextIndex - 1
  }

  #trimLeadingLineBreaks(node) {
    let leading = node.getFirstChild()
    while ($isLineBreakNode(leading) && $isLineBreakNode(leading.getNextSibling())) {
      leading.remove()
      leading = node.getFirstChild()
    }
  }

  #isBlockNode(node) {
    return node && $isElementNode(node) && !node.isInline()
  }
}
