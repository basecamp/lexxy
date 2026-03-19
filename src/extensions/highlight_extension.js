import { $getNodeByKey, $getState, $hasUpdateTag, $setState, COMMAND_PRIORITY_NORMAL, PASTE_TAG, TextNode, createCommand, createState, defineExtension } from "lexical"
import { $getSelection, $isRangeSelection } from "lexical"
import { $getSelectionStyleValueForProperty, $patchStyleText, getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"
import { $createCodeHighlightNode, $createCodeNode, $isCodeHighlightNode, $isCodeNode, CodeHighlightNode, CodeNode } from "@lexical/code"
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

// Stores pending highlight ranges extracted during HTML import, keyed by CodeNode key.
// After the code retokenizer creates fresh CodeHighlightNodes, a mutation listener
// reads this map and re-applies the highlight styles.
const pendingCodeHighlights = new Map()

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

        // Register the <pre> converter directly in the conversion cache so it
        // coexists with other extensions' "pre" converters (the extension-level
        // html.import uses Object.assign, which means only one "pre" per key).
        $registerPreConversion(editor)

        return mergeRegister(
          editor.registerCommand(TOGGLE_HIGHLIGHT_COMMAND, (styles) => $toggleSelectionStyles(editor, styles), COMMAND_PRIORITY_NORMAL),
          editor.registerCommand(REMOVE_HIGHLIGHT_COMMAND, () => $toggleSelectionStyles(editor, BLANK_STYLES), COMMAND_PRIORITY_NORMAL),
          editor.registerNodeTransform(TextNode, $syncHighlightWithStyle),
          editor.registerNodeTransform(CodeHighlightNode, $syncHighlightWithCodeHighlightNode),
          editor.registerNodeTransform(TextNode, (textNode) => $canonicalizePastedStyles(textNode, canonicalizers)),
          editor.registerMutationListener(CodeNode, (mutations) => {
            $applyPendingCodeHighlights(editor, mutations)
          }, { skipInitialization: true })
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

// Register a custom <pre> converter directly in the editor's HTML conversion
// cache. We can't use the extension-level html.import because Object.assign
// merges all extensions' converters by tag, and a later extension (e.g.
// TrixContentExtension) would overwrite ours.
function $registerPreConversion(editor) {
  let preEntries = editor._htmlConversions.get("pre")
  if (!preEntries) {
    preEntries = []
    editor._htmlConversions.set("pre", preEntries)
  }
  preEntries.push($preConversionWithHighlights)
}

// Custom <pre> import that extracts highlight ranges from <mark> elements
// before the code retokenizer can destroy them. The ranges are stored in
// pendingCodeHighlights and applied after retokenization via a mutation listener.
function $preConversionWithHighlights(domNode) {
  const highlights = extractHighlightRanges(domNode)
  if (highlights.length === 0) return null

  return {
    conversion: (domNode) => {
      const language = domNode.getAttribute("data-language")
      const codeNode = $createCodeNode(language)
      pendingCodeHighlights.set(codeNode.getKey(), highlights)
      return { node: codeNode }
    },
    priority: 2
  }
}

// Walk the DOM tree inside a <pre> element and build a list of
// { start, end, style } ranges for every <mark> element found.
function extractHighlightRanges(preElement) {
  const ranges = []
  const codeElement = preElement.querySelector("code") || preElement

  let offset = 0

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      offset += node.textContent.length
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const isMark = node.tagName === "MARK"
      const start = offset

      for (const child of node.childNodes) {
        walk(child)
      }

      if (isMark) {
        const style = extractHighlightStyleFromElement(node)
        if (style) {
          ranges.push({ start, end: offset, style })
        }
      }
    }
  }

  for (const child of codeElement.childNodes) {
    walk(child)
  }

  return ranges
}

function extractHighlightStyleFromElement(element) {
  const styles = {}
  if (element.style?.color) styles.color = element.style.color
  if (element.style?.backgroundColor) styles["background-color"] = element.style.backgroundColor
  const css = getCSSFromStyleObject(styles)
  return css.length > 0 ? css : null
}

// Called from the CodeNode mutation listener after the retokenizer has
// replaced TextNodes with fresh CodeHighlightNodes.
function $applyPendingCodeHighlights(editor, mutations) {
  const keysToProcess = []

  for (const [ key, type ] of mutations) {
    if (type !== "destroyed" && pendingCodeHighlights.has(key)) {
      keysToProcess.push(key)
    }
  }

  if (keysToProcess.length === 0) return

  // Use a deferred update so the retokenizer has finished its
  // skipTransforms update before we touch the nodes.
  editor.update(() => {
    for (const key of keysToProcess) {
      const highlights = pendingCodeHighlights.get(key)
      pendingCodeHighlights.delete(key)
      if (!highlights) continue

      const codeNode = $getNodeByKey(key)
      if (!codeNode || !$isCodeNode(codeNode)) continue

      $applyHighlightRangesToCodeNode(codeNode, highlights)
    }
  }, { skipTransforms: true, discrete: true })
}

// Apply saved highlight ranges to the CodeHighlightNode children
// of a CodeNode, splitting nodes at range boundaries as needed.
// We can't use TextNode.splitText() because it creates TextNode
// instances (not CodeHighlightNodes) for the split parts. Instead,
// we manually create CodeHighlightNode replacements.
function $applyHighlightRangesToCodeNode(codeNode, highlights) {
  if (highlights.length === 0) return

  const children = codeNode.getChildren()
  let charOffset = 0

  // Build a map of character offsets to children
  const childRanges = []
  for (const child of children) {
    if ($isCodeHighlightNode(child)) {
      const text = child.getTextContent()
      childRanges.push({ node: child, start: charOffset, end: charOffset + text.length })
      charOffset += text.length
    } else {
      // LineBreakNode, TabNode - count as 1 character each (\n, \t)
      charOffset += 1
    }
  }

  for (const { start: hlStart, end: hlEnd, style } of highlights) {
    for (const { node, start: nodeStart, end: nodeEnd } of childRanges) {
      // Check if this child overlaps with the highlight range
      const overlapStart = Math.max(hlStart, nodeStart)
      const overlapEnd = Math.min(hlEnd, nodeEnd)

      if (overlapStart >= overlapEnd) continue

      // Calculate offsets relative to this node
      const relStart = overlapStart - nodeStart
      const relEnd = overlapEnd - nodeStart
      const nodeLength = nodeEnd - nodeStart

      const latestNode = $getNodeByKey(node.getKey())
      if (!latestNode || !$isCodeHighlightNode(latestNode)) continue

      if (relStart === 0 && relEnd === nodeLength) {
        // Entire node is highlighted - apply style directly
        latestNode.setStyle(style)
        $setCodeHighlightFormat(latestNode, true)
      } else {
        // Need to split: replace the node with 2 or 3 CodeHighlightNodes
        const text = latestNode.getTextContent()
        const highlightType = latestNode.getHighlightType()
        const replacements = []

        if (relStart > 0) {
          replacements.push($createCodeHighlightNode(text.slice(0, relStart), highlightType))
        }

        const styledNode = $createCodeHighlightNode(text.slice(relStart, relEnd), highlightType)
        styledNode.setStyle(style)
        $setCodeHighlightFormat(styledNode, true)
        replacements.push(styledNode)

        if (relEnd < nodeLength) {
          replacements.push($createCodeHighlightNode(text.slice(relEnd), highlightType))
        }

        for (const replacement of replacements) {
          latestNode.insertBefore(replacement)
        }
        latestNode.remove()
      }
    }
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
