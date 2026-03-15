import { $getNodeByKey, $getState, $hasUpdateTag, $setState, COMMAND_PRIORITY_NORMAL, PASTE_TAG, TextNode, createCommand, createState, defineExtension } from "lexical"
import { $getSelection, $isRangeSelection } from "lexical"
import { $getSelectionStyleValueForProperty, $patchStyleText, getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"
import { $isCodeHighlightNode, $isCodeNode, CodeHighlightNode } from "@lexical/code"
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
        // keep the ref to the canonicalizers for optimized css conversion
        const canonicalizers = buildCanonicalizers(config)

        return mergeRegister(
          editor.registerCommand(TOGGLE_HIGHLIGHT_COMMAND, (styles) => $toggleSelectionStyles(editor, styles), COMMAND_PRIORITY_NORMAL),
          editor.registerCommand(REMOVE_HIGHLIGHT_COMMAND, () => $toggleSelectionStyles(editor, BLANK_STYLES), COMMAND_PRIORITY_NORMAL),
          editor.registerNodeTransform(TextNode, $syncHighlightWithStyle),
          editor.registerNodeTransform(CodeHighlightNode, $syncHighlightWithCodeHighlightNode),
          editor.registerNodeTransform(TextNode, (textNode) => $canonicalizePastedStyles(textNode, canonicalizers))
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

function $toggleSelectionStyles(editor, styles) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return

  const patch = {}
  for (const property in styles) {
    const oldValue = $getSelectionStyleValueForProperty(selection, property)
    patch[property] = toggleOrReplace(oldValue, styles[property])
  }

  if ($selectionIsInCodeBlock(selection)) {
    $patchCodeHighlightStyles(editor, selection, patch)
  } else {
    $patchStyleText(selection, patch)
  }
}

function $selectionIsInCodeBlock(selection) {
  const nodes = selection.getNodes()
  return nodes.some((node) => {
    const parent = $isCodeHighlightNode(node) ? node.getParent() : node
    return $isCodeNode(parent)
  })
}

function $patchCodeHighlightStyles(editor, selection, patch) {
  // Capture selection state and node keys before the nested update
  const nodeKeys = selection.getNodes()
    .filter((node) => $isCodeHighlightNode(node))
    .map((node) => ({
      key: node.getKey(),
      startOffset: $getNodeSelectionOffsets(node, selection)[0],
      endOffset: $getNodeSelectionOffsets(node, selection)[1],
      textSize: node.getTextContentSize()
    }))

  // Use skipTransforms to prevent the code highlighting system from
  // re-tokenizing and wiping out the style changes we apply.
  // Use discrete to force a synchronous commit, ensuring the changes
  // are committed before editor.focus() triggers a second update cycle
  // that would re-run transforms and wipe out the styles.
  editor.update(() => {
    for (const { key, startOffset, endOffset, textSize } of nodeKeys) {
      const node = $getNodeByKey(key)
      if (!node || !$isCodeHighlightNode(node)) continue

      const parent = node.getParent()
      if (!$isCodeNode(parent)) continue
      if (startOffset === endOffset) continue

      if (startOffset === 0 && endOffset === textSize) {
        $applyStylePatchToNode(node, patch)
      } else {
        const splitNodes = node.splitText(startOffset, endOffset)
        const targetNode = splitNodes[startOffset === 0 ? 0 : 1]
        $applyStylePatchToNode(targetNode, patch)
      }
    }
  }, { skipTransforms: true, discrete: true })
}

function $getNodeSelectionOffsets(node, selection) {
  const nodeKey = node.getKey()
  const anchorKey = selection.anchor.key
  const focusKey = selection.focus.key
  const textSize = node.getTextContentSize()

  const isAnchor = nodeKey === anchorKey
  const isFocus = nodeKey === focusKey

  // Determine if selection is forward or backward
  const isForward = selection.isBackward() === false

  let start = 0
  let end = textSize

  if (isForward) {
    if (isAnchor) start = selection.anchor.offset
    if (isFocus) end = selection.focus.offset
  } else {
    if (isFocus) start = selection.focus.offset
    if (isAnchor) end = selection.anchor.offset
  }

  return [ start, end ]
}

function $applyStylePatchToNode(node, patch) {
  const prevStyles = getStyleObjectFromCSS(node.getStyle())
  const newStyles = { ...prevStyles }

  for (const [ key, value ] of Object.entries(patch)) {
    if (value === null) {
      delete newStyles[key]
    } else {
      newStyles[key] = value
    }
  }

  const newCSSText = getCSSFromStyleObject(newStyles)
  node.setStyle(newCSSText)

  // Sync the highlight format using TextNode's setFormat to bypass
  // CodeHighlightNode's no-op override
  const shouldHaveHighlight = hasHighlightStyles(newCSSText)
  const hasHighlight = node.hasFormat("highlight")

  if (shouldHaveHighlight !== hasHighlight) {
    $setCodeHighlightFormat(node, shouldHaveHighlight)
  }
}

function $setCodeHighlightFormat(node, shouldHaveHighlight) {
  const writable = node.getWritable()
  const IS_HIGHLIGHT = 1 << 7

  if (shouldHaveHighlight) {
    writable.__format |= IS_HIGHLIGHT
  } else {
    writable.__format &= ~IS_HIGHLIGHT
  }
}

function toggleOrReplace(oldValue, newValue) {
  return oldValue === newValue ? null : newValue
}

function $syncHighlightWithStyle(textNode) {
  if (hasHighlightStyles(textNode.getStyle()) !== textNode.hasFormat("highlight")) {
    textNode.toggleFormat("highlight")
  }
}

function $syncHighlightWithCodeHighlightNode(node) {
  const parent = node.getParent()
  if (!$isCodeNode(parent)) return

  const shouldHaveHighlight = hasHighlightStyles(node.getStyle())
  const hasHighlight = node.hasFormat("highlight")

  if (shouldHaveHighlight !== hasHighlight) {
    $setCodeHighlightFormat(node, shouldHaveHighlight)
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
