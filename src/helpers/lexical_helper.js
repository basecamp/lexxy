import { $isTextNode, TextNode } from "lexical"
import { $isListItemNode, $isListNode } from "@lexical/list"

export function getNearestListItemNode(node) {
  let current = node
  while (current !== null) {
    if ($isListItemNode(current)) return current
    current = current.getParent()
  }
  return null
}

export function getListType(node) {
  let current = node
  while (current) {
    if ($isListNode(current)) {
      return current.getListType()
    }
    current = current.getParent()
  }
  return null
}

export function isPrintableCharacter(event) {
  // Ignore if modifier keys are pressed (except Shift for uppercase)
  if (event.ctrlKey || event.metaKey || event.altKey) return false

  // Ignore special keys
  if (event.key.length > 1 && event.key !== "Enter" && event.key !== "Space") return false

  // Accept single character keys (letters, numbers, punctuation)
  return event.key.length === 1
}

export function extendTextNodeConversion(conversionName, callback = (textNode => textNode)) {
  return (element) => {
    const textConverter = TextNode.importDOM()?.[conversionName]?.(element)
    if (!textConverter) return null

    const conversionOutput = textConverter.conversion(element)
    if (!conversionOutput) return conversionOutput

    return {
      ...conversionOutput,
      forChild: (lexicalNode, parentNode) => {
        const originalForChild = conversionOutput?.forChild ?? (x => x)
        let childNode = originalForChild(lexicalNode, parentNode)

        if ($isTextNode(childNode)) childNode = callback(childNode, element) ?? childNode
        return childNode
      }
    }
  }
}
