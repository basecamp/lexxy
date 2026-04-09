import { $getNodeByKey, $getState, $hasUpdateTag, $isTextNode, $setState, COMMAND_PRIORITY_NORMAL, PASTE_TAG, TextNode, createCommand, createState, defineExtension } from "lexical"
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
// reads this map and re-applies the highlight styles. Scoped per editor instance
// so entries don't leak across editors or outlive a torn-down editor.
const pendingCodeHighlights = new WeakMap()

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
  if (!editor._htmlConversions) return

  let preEntries = editor._htmlConversions.get("pre")
  if (!preEntries) {
    preEntries = []
    editor._htmlConversions.set("pre", preEntries)
  }
  preEntries.push($preConversionWithHighlightsFactory(editor))
}

// Returns a <pre> converter factory scoped to a specific editor instance.
// The factory extracts highlight ranges from <mark> elements before the code
// retokenizer can destroy them. The ranges are stored in pendingCodeHighlights
// and applied after retokenization via a mutation listener.
function $preConversionWithHighlightsFactory(editor) {
  return function $preConversionWithHighlights(domNode) {
    const highlights = extractHighlightRanges(domNode)
    if (highlights.length === 0) return null

    return {
      conversion: (domNode) => {
        const language = domNode.getAttribute("data-language")
        const codeNode = $createCodeNode(language)
        $getPendingHighlights(editor).set(codeNode.getKey(), highlights)
        return { node: codeNode }
      },
      priority: 2
    }
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
      // <br> maps to a LineBreakNode (1 character) in Lexical
      if (node.tagName === "BR") {
        offset += 1
        return
      }

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

function $getPendingHighlights(editor) {
  let map = pendingCodeHighlights.get(editor)
  if (!map) {
    map = new Map()
    pendingCodeHighlights.set(editor, map)
  }
  return map
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
  const pending = $getPendingHighlights(editor)
  const keysToProcess = []

  for (const [ key, type ] of mutations) {
    if (type !== "destroyed" && pending.has(key)) {
      keysToProcess.push(key)
    }
  }

  if (keysToProcess.length === 0) return

  // Use a deferred update so the retokenizer has finished its
  // skipTransforms update before we touch the nodes.
  editor.update(() => {
    for (const key of keysToProcess) {
      const highlights = pending.get(key)
      pending.delete(key)
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

  for (const { start: hlStart, end: hlEnd, style } of highlights) {
    // Rebuild the child-to-offset mapping for each highlight range because
    // earlier ranges may have split nodes, invalidating previous mappings.
    const childRanges = $buildChildRanges(codeNode)

    for (const { node, start: nodeStart, end: nodeEnd } of childRanges) {
      // Skip plain TextNodes: only CodeHighlightNodes can be split into
      // styled replacements here. The retokenizer normally converts any
      // TextNode children back to CodeHighlightNodes before this runs,
      // but the iteration over $buildChildRanges has to keep counting
      // them so character offsets stay aligned with the saved ranges.
      if (!$isCodeHighlightNode(node)) continue

      // Check if this child overlaps with the highlight range
      const overlapStart = Math.max(hlStart, nodeStart)
      const overlapEnd = Math.min(hlEnd, nodeEnd)

      if (overlapStart >= overlapEnd) continue

      // Calculate offsets relative to this node
      const relStart = overlapStart - nodeStart
      const relEnd = overlapEnd - nodeStart
      const nodeLength = nodeEnd - nodeStart

      if (relStart === 0 && relEnd === nodeLength) {
        // Entire node is highlighted - apply style directly
        node.setStyle(style)
        $setCodeHighlightFormat(node, true)
      } else {
        // Need to split: replace the node with 2 or 3 CodeHighlightNodes
        const text = node.getTextContent()
        const highlightType = node.getHighlightType()
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
          node.insertBefore(replacement)
        }
        node.remove()
      }
    }
  }
}

function $buildChildRanges(codeNode) {
  const childRanges = []
  let charOffset = 0

  for (const child of codeNode.getChildren()) {
    if ($isCodeHighlightNode(child) || $isTextNode(child)) {
      const text = child.getTextContent()
      childRanges.push({ node: child, start: charOffset, end: charOffset + text.length })
      charOffset += text.length
    } else {
      // LineBreakNode, TabNode - count as 1 character each (\n, \t)
      charOffset += 1
    }
  }

  return childRanges
}

// Extract highlight ranges from the Lexical node tree of a CodeNode.
// This mirrors extractHighlightRanges (which works on DOM elements during
// HTML import) but reads from live CodeHighlightNode children instead.
function $extractHighlightRangesFromCodeNode(codeNode) {
  const ranges = []
  const childRanges = $buildChildRanges(codeNode)

  for (const { node, start, end } of childRanges) {
    const style = node.getStyle()
    if (style && hasHighlightStyles(style)) {
      ranges.push({ start, end, style })
    }
  }

  return ranges
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
    // A text node inside a code block may be either a CodeHighlightNode
    // (after retokenization) or a plain TextNode (after splitText or before
    // the retokenizer has run). Check the parent in both cases.
    if ($isCodeHighlightNode(node) || $isTextNode(node)) {
      return $isCodeNode(node.getParent())
    }
    return $isCodeNode(node)
  })
}

function $patchCodeHighlightStyles(editor, selection, patch) {
  // Capture selection state and node keys before the nested update.
  // Accept both CodeHighlightNode and TextNode children of a CodeNode
  // because splitText creates TextNode instances and the retokenizer
  // may not have converted them back to CodeHighlightNodes yet.
  const nodeKeys = selection.getNodes()
    .filter((node) => ($isCodeHighlightNode(node) || $isTextNode(node)) && $isCodeNode(node.getParent()))
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
    const affectedCodeNodes = new Set()

    for (const { key, startOffset, endOffset, textSize } of nodeKeys) {
      const node = $getNodeByKey(key)
      if (!node) continue

      const parent = node.getParent()
      if (!$isCodeNode(parent)) continue
      if (startOffset === endOffset) continue

      affectedCodeNodes.add(parent)

      if (startOffset === 0 && endOffset === textSize) {
        $applyStylePatchToNode(node, patch)
      } else {
        const splitNodes = node.splitText(startOffset, endOffset)
        const targetNode = splitNodes[startOffset === 0 ? 0 : 1]
        $applyStylePatchToNode(targetNode, patch)
      }
    }

    // After applying styles, save highlight ranges for each affected CodeNode.
    // The code retokenizer will replace the styled nodes with fresh unstyled
    // tokens when transforms run. The pending highlights are picked up by the
    // CodeNode mutation listener and reapplied after retokenization.
    for (const codeNode of affectedCodeNodes) {
      const ranges = $extractHighlightRangesFromCodeNode(codeNode)
      if (ranges.length > 0) {
        $getPendingHighlights(editor).set(codeNode.getKey(), ranges)
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
