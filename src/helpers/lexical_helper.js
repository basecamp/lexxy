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
