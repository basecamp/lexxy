import { $getNodeByKey, $getState, $hasUpdateTag, $isTextNode, $setState, COMMAND_PRIORITY_NORMAL, PASTE_TAG, TextNode, createCommand, createState, defineExtension } from "lexical"
import { $getSelection, $isRangeSelection } from "lexical"
import { $getSelectionStyleValueForProperty, $patchStyleText, getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"
import { $createCodeHighlightNode, $createCodeNode, $isCodeHighlightNode, $isCodeNode, CodeHighlightNode, PrismTokenizer } from "@lexical/code"
import { extendTextNodeConversion } from "../helpers/lexical_helper"
import { StyleCanonicalizer, applyCanonicalizers, hasHighlightStyles, normalizeColorButtons } from "../helpers/format_helper"
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
// The highlight-preserving tokenizer consumes this map when the code retokenizer
// first tokenizes the block. Scoped per editor instance so entries don't leak
// across editors or outlive a torn-down editor.
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
// and restored by the highlight-preserving tokenizer during retokenization.
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

// The code retokenizer replaces a code block's children with freshly created
// tokens that carry no styles, which would drop color highlights on every
// edit. This tokenizer wraps the stock Prism tokenizer to restore them: it
// recovers the block's highlight ranges — staged during HTML import, or read
// from the children the fresh tokens are about to replace — and reapplies
// them to the fresh tokens before the retokenizer splices them in.
export function buildHighlightPreservingTokenizer(editor) {
  return {
    defaultLanguage: PrismTokenizer.defaultLanguage,
    tokenize(code, language) {
      return PrismTokenizer.tokenize(code, language)
    },
    $tokenize(codeNode, language) {
      const tokens = PrismTokenizer.$tokenize(codeNode, language)
      const highlights = $takeHighlightRanges(editor, codeNode)
      return $applyHighlightRangesToTokens(tokens, highlights)
    }
  }
}

function $takeHighlightRanges(editor, codeNode) {
  const pending = $getPendingHighlights(editor)
  const key = codeNode.getKey()

  if (pending.has(key)) {
    const highlights = pending.get(key)
    pending.delete(key)
    return highlights
  } else if (codeNode.getChildren().some($isCodeHighlightNode)) {
    return $extractHighlightRangesFromCodeNode(codeNode)
  } else {
    // A block that was never tokenized has only plain text children. Styles
    // on those come from import paths that didn't stage ranges (e.g. colored
    // spans in Trix HTML), and the first tokenization discards them.
    return []
  }
}

function $applyHighlightRangesToTokens(tokens, highlights) {
  if (highlights.length === 0) return tokens

  const styledTokens = []
  let offset = 0

  for (const token of tokens) {
    if ($isCodeHighlightNode(token)) {
      styledTokens.push(...$splitTokenAtHighlightBoundaries(token, offset, highlights))
    } else {
      styledTokens.push(token)
    }
    offset += token.getTextContentSize()
  }

  return styledTokens
}

// Split a token into segments at highlight boundaries, styling the covered
// segments. We can't use TextNode.splitText() because the fresh tokens aren't
// attached to the tree yet, so we create CodeHighlightNode replacements.
function $splitTokenAtHighlightBoundaries(token, tokenStart, highlights) {
  const text = token.getTextContent()
  const segments = segmentTextByHighlights(text, tokenStart, highlights)

  if (segments.length === 1) {
    const [ segment ] = segments
    if (segment.style) {
      $applyHighlightStyleToToken(token, segment.style)
    }
    return [ token ]
  } else {
    return segments.map((segment) => {
      const segmentToken = $createCodeHighlightNode(text.slice(segment.start, segment.end), token.getHighlightType())
      if (segment.style) {
        $applyHighlightStyleToToken(segmentToken, segment.style)
      }
      return segmentToken
    })
  }
}

// Partition a token's text into consecutive { start, end, style } segments,
// where offsets are relative to the token and style is null for the stretches
// no highlight covers.
function segmentTextByHighlights(text, tokenStart, highlights) {
  const segments = []
  let cursor = 0

  for (const { start, end, style } of highlights) {
    const from = Math.max(start - tokenStart, cursor)
    const to = Math.min(end - tokenStart, text.length)

    if (from < to) {
      if (from > cursor) {
        segments.push({ start: cursor, end: from, style: null })
      }
      segments.push({ start: from, end: to, style })
      cursor = to
    }
  }

  if (cursor < text.length) {
    segments.push({ start: cursor, end: text.length, style: null })
  }

  return segments
}

function $applyHighlightStyleToToken(token, style) {
  token.setStyle(style)
  $setCodeHighlightFormat(token, true)
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
    new StyleCanonicalizer("color", [ ...colorValues(config.buttons.color), ...config.permit.color ]),
    new StyleCanonicalizer("background-color", [ ...colorValues(config.buttons["background-color"]), ...config.permit["background-color"] ])
  ]
}

function colorValues(buttons) {
  return normalizeColorButtons(buttons).map((button) => button.value)
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

  // Use skipTransforms so the retokenizer doesn't rebuild the block in the
  // middle of the toggle, and discrete to force a synchronous commit so the
  // styles are in place before editor.focus() triggers a second update cycle.
  editor.update(() => {
    for (const { key, startOffset, endOffset, textSize } of nodeKeys) {
      const node = $getNodeByKey(key)
      if (!node) continue

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
