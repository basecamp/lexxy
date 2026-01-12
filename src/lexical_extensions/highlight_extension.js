import { $getState, $hasUpdateTag, $setState, COMMAND_PRIORITY_NORMAL, PASTE_TAG, TextNode, createCommand, createState, defineExtension } from "lexical"
import { $getSelection, $isRangeSelection } from "lexical"
import { $getSelectionStyleValueForProperty, $patchStyleText, getCSSFromStyleObject } from "@lexical/selection"
import { extendTextNodeConversion } from "../helpers/lexical_helper"
import { StyleCanonicalizer } from "../helpers/format_helper"
import { hasHighlightStyles } from "../helpers/format_helper"
import { RichTextExtension } from "@lexical/rich-text"

export const TOGGLE_HIGHLIGHT_COMMAND = createCommand()

const hasPastedStylesState = createState("hasPastedStyles", {
  parse: (value) => value || false
})

export const HighlightLexicalExtension = defineExtension({
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

    editor.registerCommand(TOGGLE_HIGHLIGHT_COMMAND, $toggleSelectionStyles, COMMAND_PRIORITY_NORMAL)
    editor.registerNodeTransform(TextNode, $syncHighlightWithStyle)
    editor.registerNodeTransform(TextNode, (textNode) => $canonicalizePastedStyles(textNode, canonicalizers))
  }
})

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

function $toggleSelectionStyles(styles) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return

  const patch = {}
  for (const property in styles) {
    const oldValue = $getSelectionStyleValueForProperty(selection, property)
    patch[property] = toggleOrReplace(oldValue, styles[property])
  }

  $patchStyleText(selection, patch)
}

function toggleOrReplace(oldValue, newValue) {
  return oldValue === newValue ? null : newValue
}

function $syncHighlightWithStyle(textNode) {
  if (hasHighlightStyles(textNode.getStyle()) !== textNode.hasFormat("highlight")) {
    textNode.toggleFormat("highlight")
  }
}

function $canonicalizePastedStyles(textNode, canonicalizers = []) {
  if ($hasPastedStyles(textNode)) {
    $setPastedStyles(textNode, false)

    const canonicalizedCSS = canonicalizers.reduce((css, canonicalizer) => {
      return canonicalizer.applyCanonicalization(css)
    }, textNode.getStyle())

    textNode.setStyle(canonicalizedCSS)
  }
}

function $setPastedStyles(textNode, value = true) {
  $setState(textNode, hasPastedStylesState, value)
}

function $hasPastedStyles(textNode) {
  return $getState(textNode, hasPastedStylesState)
}
