import { $isTextNode, TextNode } from "lexical"

export class ImportStyledTextNode extends TextNode {
  static importDOM() {
    return {
      mark: () => ({
        conversion: extendTextNodeConversion("mark", applyHighlightStyle),
        priority: 1
      }),
      span: () => ({
        conversion: extendTextNodeConversion("mark", applyHighlightStyle),
        priority: 1
      }),
      del: () => ({
        conversion: extendTextNodeConversion("s", (textNode => textNode.setFormat("strikethrough"))),
        priority: 1
      })
    }
  }
}

function applyHighlightStyle(textNode, element) {
  const textColor = element.style?.color
  const backgroundColor = element.style?.backgroundColor

  let style = ""
  if (textColor && textColor !== "") style += `color: ${textColor};`
  if (backgroundColor && backgroundColor !== "") style += `background-color: ${backgroundColor};`

  if (style.length) return textNode.setFormat("highlight").setStyle(style)
}

export function extendTextNodeConversion(conversionName, styler= (textNode => textNode)) {
  return (element) => {
    const textConverter = TextNode.importDOM()?.[conversionName]?.(element)
    if (!textConverter) return null

    const conversionOutput = textConverter.conversion(element)
    if (!conversionOutput) return conversionOutput

    return {
      ...conversionOutput,
      forChild: (lexicalNode, parentNode) => {
        const originalForChild = conversionOutput?.forChild ?? (x => x)
        const childNode = originalForChild(lexicalNode, parentNode)

        if ($isTextNode(childNode)) {
          return styler(childNode, element)
        } else {
          return childNode
        }
      }
    }
  }
}

