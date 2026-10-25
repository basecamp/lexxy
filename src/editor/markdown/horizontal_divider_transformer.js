import { $createParagraphNode } from "lexical"
import { HorizontalDividerNode } from "../../nodes/horizontal_divider_node"

export const HORIZONTAL_DIVIDER = {
  dependencies: [ HorizontalDividerNode ],
  export: (node) => {
    return node instanceof HorizontalDividerNode ? "---" : null
  },
  regExpStart: /^-{3,}\s?$/,
  replace: (parentNode, children, match, endMatch, linesInBetween, isImport) => {
    const hrNode = new HorizontalDividerNode()
    parentNode.replace(hrNode)

    if (!isImport) {
      const paragraph = $createParagraphNode()
      hrNode.insertAfter(paragraph)
      paragraph.select()
    }
  },
  type: "multiline-element"
}
