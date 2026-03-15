import { $getState, $hasUpdateTag, $setState, COMMAND_PRIORITY_NORMAL, PASTE_TAG, TextNode, createCommand, createState, defineExtension } from "lexical"
import { $getSelection, $isRangeSelection } from "lexical"
import { $getSelectionStyleValueForProperty, $patchStyleText, getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"
import { $isCodeNode } from "@lexical/code"
import { extendTextNodeConversion } from "../helpers/lexical_helper"
import { StyleCanonicalizer, applyCanonicalizers, hasHighlightStyles } from "../helpers/format_helper"
import { RichTextExtension } from "@lexical/rich-text"
import LexxyExtension from "./lexxy_extension"
import { mergeRegister } from "@lexical/utils"

export const TOGGLE_HIGHLIGHT_COMMAND = createCommand()
export const REMOVE_HIGHLIGHT_COMMAND = createCommand()
export const BLANK_STYLES = { "color": null, "background-color": null }

const hasPastedStylesState = createState("hasPastedStyles", {
  parse: (value) => value || false
})

// Store highlight style ranges for code blocks externally to avoid dirtying
// CodeNode (which would trigger Lexical reconciliation and delete selected text).
const codeHighlightStylesMap = new Map()

export class HighlightExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    const extension = defineExtension({
      dependencies: [ RichTextExtension ],
      name: "lexxy/highlight",
      config: {
        color: { buttons: [], permit: [] },
        "background-color": { buttons: [], permit: [] }
      },
      html: {
        import: {
          mark: $markConversion
        }
      },
      register(editor, config) {
        const canonicalizers = buildCanonicalizers(config)

        return mergeRegister(
          editor.registerCommand(TOGGLE_HIGHLIGHT_COMMAND, (styles) => $toggleSelectionStyles(styles, editor), COMMAND_PRIORITY_NORMAL),
          editor.registerCommand(REMOVE_HIGHLIGHT_COMMAND, () => $toggleSelectionStyles(BLANK_STYLES, editor), COMMAND_PRIORITY_NORMAL),
          editor.registerNodeTransform(TextNode, $syncHighlightWithStyle),
          editor.registerNodeTransform(TextNode, (textNode) => $canonicalizePastedStyles(textNode, canonicalizers)),
          editor.registerMutationListener(TextNode, () => {
            editor.getEditorState().read(() => {
              $renderCodeHighlightStyles(editor)
            })
          })
        )
      }
    })

    return [ extension, this.editorConfig.get("highlight") ]
  }
}

export function $applyHighlightStyle(textNode, element) {
  const elementStyles = {
    color: element.style?.color,
    "background-color": element.style?.backgroundColor
  }

  if ($hasUpdateTag(PASTE_TAG)) { $setPastedStyles(textNode) }
  const highlightStyle = getCSSFromStyleObject(elementStyles)

  if (highlightStyle.length) {
    return textNode.setStyle(textNode.getStyle() + highlightStyle)
  }
}

function $markConversion() {
  return {
    conversion: extendTextNodeConversion("mark", $applyHighlightStyle),
    priority: 1
  }
}

function buildCanonicalizers(config) {
  return [
    new StyleCanonicalizer("color", [ ...config.buttons.color, ...config.permit.color ]),
    new StyleCanonicalizer("background-color", [ ...config.buttons["background-color"], ...config.permit["background-color"] ])
  ]
}

function $toggleSelectionStyles(styles, editor) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return

  const patch = {}
  for (const property in styles) {
    const oldValue = $getSelectionStyleValueForProperty(selection, property)
    patch[property] = toggleOrReplace(oldValue, styles[property])
  }

  if ($isSelectionInCodeBlock(selection)) {
    $patchCodeHighlightStyles(selection, patch, editor)
  } else {
    $patchStyleText(selection, patch)
  }
}

function toggleOrReplace(oldValue, newValue) {
  return oldValue === newValue ? null : newValue
}

function $isSelectionInCodeBlock(selection) {
  const anchorNode = selection.anchor.getNode()
  const codeNode = $isCodeNode(anchorNode) ? anchorNode : anchorNode.getParent()
  return $isCodeNode(codeNode)
}

function $getCodeNodeFromSelection(selection) {
  const anchorNode = selection.anchor.getNode()
  return $isCodeNode(anchorNode) ? anchorNode : anchorNode.getParent()
}

function $patchCodeHighlightStyles(selection, patch, editor) {
  if (selection.isCollapsed()) {
    $patchSelectionStyle(selection, patch)
    return
  }

  const codeNode = $getCodeNodeFromSelection(selection)
  if (!$isCodeNode(codeNode)) return

  const nodeKey = codeNode.getKey()
  const { startOffset, endOffset } = $getSelectionOffsetsInCodeNode(selection, codeNode)
  const existingRanges = codeHighlightStylesMap.get(nodeKey) || []
  const newRanges = $mergeStyleRange(existingRanges, startOffset, endOffset, patch)

  if (newRanges.length > 0) {
    codeHighlightStylesMap.set(nodeKey, newRanges)
  } else {
    codeHighlightStylesMap.delete(nodeKey)
  }

  // Apply DOM highlights after Lexical finishes reconciliation
  // Use queueMicrotask to run after the current update but before paint
  queueMicrotask(() => {
    editor.getEditorState().read(() => {
      $renderCodeHighlightStyles(editor)
    })
  })
}

function $getSelectionOffsetsInCodeNode(selection, codeNode) {
  const children = codeNode.getChildren()
  const isBackward = selection.isBackward()
  const startPoint = isBackward ? selection.focus : selection.anchor
  const endPoint = isBackward ? selection.anchor : selection.focus

  let startOffset = 0
  let endOffset = 0
  let offset = 0

  for (const child of children) {
    const key = child.getKey()
    const textSize = child.getTextContentSize()

    if (key === startPoint.key) {
      startOffset = offset + startPoint.offset
    }
    if (key === endPoint.key) {
      endOffset = offset + endPoint.offset
    }

    offset += textSize
  }

  return { startOffset, endOffset }
}

function $mergeStyleRange(existingRanges, start, end, patch) {
  const cleanPatch = {}
  let hasActiveStyles = false
  for (const key in patch) {
    if (patch[key] !== null) {
      cleanPatch[key] = patch[key]
      hasActiveStyles = true
    }
  }

  const result = []

  for (const range of existingRanges) {
    if (range.end <= start || range.start >= end) {
      result.push(range)
    } else {
      if (range.start < start) {
        result.push({ start: range.start, end: start, style: { ...range.style } })
      }
      if (range.end > end) {
        result.push({ start: end, end: range.end, style: { ...range.style } })
      }
    }
  }

  if (hasActiveStyles) {
    result.push({ start, end, style: cleanPatch })
  }

  result.sort((a, b) => a.start - b.start)
  return result
}

// Apply highlight styles to code block elements in the DOM.
// Uses Lexical's mutation observer disconnect/reconnect pattern to avoid
// triggering Lexical's MutationObserver when modifying the DOM.
function $renderCodeHighlightStyles(editor) {
  const nodeMap = editor.getEditorState()._nodeMap
  const rootElement = editor.getRootElement()
  if (!rootElement) return

  // Temporarily disconnect Lexical's MutationObserver to prevent it from
  // detecting our DOM changes and triggering a reconciliation loop
  const observer = editor._observer
  if (observer) { observer.disconnect() }

  try {
    for (const [ , node ] of nodeMap) {
      if (!$isCodeNode(node)) continue

      const nodeKey = node.getKey()
      const styleRanges = codeHighlightStylesMap.get(nodeKey)
      const codeElement = editor.getElementByKey(nodeKey)
      if (!codeElement) continue

      $clearDOMHighlights(codeElement)

      if (!styleRanges || styleRanges.length === 0) continue

      $applyDOMHighlights(codeElement, styleRanges)
    }
  } finally {
    // Reconnect the MutationObserver
    if (observer) {
      observer.observe(rootElement, {
        childList: true,
        attributes: true,
        characterData: true,
        subtree: true
      })
    }
  }
}

function $clearDOMHighlights(codeElement) {
  const highlights = codeElement.querySelectorAll("span[data-code-highlight]")
  for (const span of highlights) {
    const parent = span.parentNode
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span)
    }
    parent.removeChild(span)
    parent.normalize()
  }
}

function $applyDOMHighlights(codeElement, styleRanges) {
  const walker = document.createTreeWalker(codeElement, NodeFilter.SHOW_TEXT)
  let textOffset = 0
  const textNodes = []

  let textNode
  while ((textNode = walker.nextNode())) {
    textNodes.push({ node: textNode, start: textOffset, end: textOffset + textNode.textContent.length })
    textOffset += textNode.textContent.length
  }

  // Apply ranges in reverse order to avoid offset shifting
  for (let i = styleRanges.length - 1; i >= 0; i--) {
    const range = styleRanges[i]
    const cssText = getCSSFromStyleObject(range.style)

    for (let j = textNodes.length - 1; j >= 0; j--) {
      const { node: tn, start: tnStart, end: tnEnd } = textNodes[j]

      if (range.end <= tnStart || range.start >= tnEnd) continue

      const localStart = Math.max(0, range.start - tnStart)
      const localEnd = Math.min(tn.textContent.length, range.end - tnStart)

      const domRange = document.createRange()
      domRange.setStart(tn, localStart)
      domRange.setEnd(tn, localEnd)

      const span = document.createElement("span")
      span.setAttribute("data-code-highlight", "true")
      span.style.cssText = cssText

      domRange.surroundContents(span)
    }
  }
}

function $patchSelectionStyle(selection, patch) {
  const prevStyles = getStyleObjectFromCSS(selection.style || "")
  const newStyles = { ...prevStyles }
  for (const key in patch) {
    const value = patch[key]
    if (value === null) {
      delete newStyles[key]
    } else {
      newStyles[key] = value
    }
  }
  selection.setStyle(getCSSFromStyleObject(newStyles))
}

function $syncHighlightWithStyle(textNode) {
  if (hasHighlightStyles(textNode.getStyle()) !== textNode.hasFormat("highlight")) {
    textNode.toggleFormat("highlight")
  }
}

function $canonicalizePastedStyles(textNode, canonicalizers = []) {
  if ($hasPastedStyles(textNode)) {
    $setPastedStyles(textNode, false)

    const canonicalizedCSS = applyCanonicalizers(textNode.getStyle(), canonicalizers)
    textNode.setStyle(canonicalizedCSS)

    const selection = $getSelection()
    if (textNode.isSelected(selection)) {
      selection.setStyle(textNode.getStyle())
      selection.setFormat(textNode.getFormat())
    }
  }
}

function $setPastedStyles(textNode, value = true) {
  $setState(textNode, hasPastedStylesState, value)
}

function $hasPastedStyles(textNode) {
  return $getState(textNode, hasPastedStylesState)
}
