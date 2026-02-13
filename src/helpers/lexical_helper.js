import { $createNodeSelection, $createParagraphNode, $isTextNode, TextNode } from "lexical"
import { HISTORY_MERGE_TAG, SKIP_DOM_SELECTION_TAG, SKIP_SCROLL_INTO_VIEW_TAG } from "lexical"
import { ListNode } from "@lexical/list"
import { $getNearestNodeOfType } from "@lexical/utils"
import { $wrapNodeInElement } from "@lexical/utils"

export const SILENT_UPDATE_TAGS = [ HISTORY_MERGE_TAG, SKIP_DOM_SELECTION_TAG, SKIP_SCROLL_INTO_VIEW_TAG ]

export function $createNodeSelectionWith(...nodes) {
  const selection = $createNodeSelection()
  nodes.forEach(node => selection.add(node.getKey()))
  return selection
}

export function $makeSafeForRoot(node) {
  if ($isTextNode(node)) {
    return $wrapNodeInElement(node, $createParagraphNode)
  } else if (node.isParentRequired()) {
    const parent = node.createRequiredParent()
    return $wrapNodeInElement(node, parent)
  } else {
    return node
  }
}

export function getListType(node) {
  const list = $getNearestNodeOfType(node, ListNode)
  return list?.getListType() ?? null
}

export function extendTextNodeConversion(conversionName, ...callbacks) {
  return extendConversion(TextNode, conversionName, (conversionOutput, element) => ({
    ...conversionOutput,
    forChild: (lexicalNode, parentNode) => {
      const originalForChild = conversionOutput?.forChild ?? (x => x)
      let childNode = originalForChild(lexicalNode, parentNode)


      if ($isTextNode(childNode)) {
        childNode = callbacks.reduce(
          (childNode, callback) => callback(childNode, element) ?? childNode,
          childNode
        )
        return childNode
      }
    }
  }))
}

export function extendConversion(nodeKlass, conversionName, callback = (output => output)) {
  return (element) => {
    const converter = nodeKlass.importDOM()?.[conversionName]?.(element)
    if (!converter) return null

    const conversionOutput = converter.conversion(element)
    if (!conversionOutput) return conversionOutput

    return callback(conversionOutput, element) ?? conversionOutput
  }
}
