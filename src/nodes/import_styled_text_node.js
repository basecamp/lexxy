import { $isTextNode, TextNode } from "lexical"

export class ImportStyledTextNode extends TextNode {
  static importDOM() {
    return {
      mark: () => ({
        conversion: extendTextNodeConversion("mark", applyHighlightStyle),
        priority: 1
      }),
      span: (element) => onlyStyledElements(element, {
        conversion: extendTextNodeConversion("mark", applyHighlightStyle),
        priority: 1
      }),
      del: () => ({
        conversion: extendTextNodeConversion("s", applyStrikethrough),
        priority: 1
      })
    }
  }
}

function onlyStyledElements(element, conversion) {
  const elementHighlighted = element.style.color !== "" || element.style.backgroundColor !== ""
  return elementHighlighted ? conversion : null
}

function applyHighlightStyle(textNode, element) {
  const textColor = element.style?.color
  const backgroundColor = element.style?.backgroundColor

  let highlightStyle = ""
  if (textColor && textColor !== "") highlightStyle += `color: ${textColor};`
  if (backgroundColor && backgroundColor !== "") highlightStyle += `background-color: ${backgroundColor};`

  if (highlightStyle.length) {
    if (!textNode.hasFormat("highlight")) textNode.toggleFormat("highlight")
    return textNode.setStyle(textNode.getStyle() + highlightStyle)
  }
}

function applyStrikethrough(textNode) {
  if (!textNode.hasFormat("strikethrough")) textNode.toggleFormat("strikethrough")
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

