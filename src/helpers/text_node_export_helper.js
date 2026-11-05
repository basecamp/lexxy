import { $isElementNode, $isLineBreakNode } from "lexical"
import { $getCodeLink } from "./code_link_helper"

const NON_BREAKING_SPACE = "\u00a0"

// Custom TextNode exportDOM that avoids redundant wrapping.
//
// Lexical's built-in TextNode.exportDOM() calls createDOM() which produces semantic tags
// like <strong> for bold and <em> for italic, then unconditionally wraps the result
// with presentational tags (<b>, <i>) for the same formats. This produces redundant markup
// like <b><strong>text</strong></b>.
//
// This custom export skips <b> when <strong> is already present and <i> when <em> is
// already present, while preserving <s> and <u> wrappers which have no semantic equivalents
// in createDOM's output.
//
// Any <span> elements produced by createDOM() are unwrapped, since they only carry
// editor classes that aren't meaningful in exported HTML.
//
// Spaces that HTML would collapse are exported as non-breaking spaces, as Trix did:
// runs of spaces alternate non-breaking and regular spaces so lines can still wrap,
// and a space that starts a line, or follows another space, becomes non-breaking.
// Otherwise both the rendered HTML and Lexical's importer collapse them, and every
// re-save loses them.

// A CodeHighlightNode exports like any other text node, plus an <a> wrapper
// when it carries link state — that's how a link survives inside a code
// block, whose retokenizer would destroy an actual LinkNode child.
export function exportCodeHighlightNodeDOM(editor, codeHighlightNode) {
  const element = exportFormattedTextDOM(editor, codeHighlightNode)
  const link = $getCodeLink(codeHighlightNode)

  if (link) {
    return { element: wrapWithAnchor(element, link) }
  } else {
    return { element }
  }
}

function wrapWithAnchor(element, link) {
  const anchor = document.createElement("a")
  anchor.setAttribute("href", link.url)
  if (link.target) anchor.setAttribute("target", link.target)
  if (link.rel) anchor.setAttribute("rel", link.rel)
  if (link.title) anchor.setAttribute("title", link.title)
  anchor.appendChild(element)
  return anchor
}

export function exportTextNodeDOM(editor, textNode) {
  const element = exportFormattedTextDOM(editor, textNode)
  $preserveSpaces(element, textNode)
  return { element }
}

function exportFormattedTextDOM(editor, textNode) {
  const element = textNode.createDOM(editor._config, editor)
  element.style.whiteSpace = "pre-wrap"

  if (textNode.hasFormat("lowercase")) {
    element.style.textTransform = "lowercase"
  } else if (textNode.hasFormat("uppercase")) {
    element.style.textTransform = "uppercase"
  } else if (textNode.hasFormat("capitalize")) {
    element.style.textTransform = "capitalize"
  }

  let result = element

  if (textNode.hasFormat("bold") && !containsTag(element, "strong")) {
    result = wrapWith(result, "b")
  }
  if (textNode.hasFormat("italic") && !containsTag(element, "em")) {
    result = wrapWith(result, "i")
  }
  if (textNode.hasFormat("strikethrough")) {
    result = wrapWith(result, "s")
  }
  if (textNode.hasFormat("underline")) {
    result = wrapWith(result, "u")
  }

  return unwrapSpans(result)
}

function containsTag(element, tagName) {
  const upperTag = tagName.toUpperCase()
  if (element.tagName === upperTag) return true

  return element.querySelector(tagName) !== null
}

function wrapWith(element, tag) {
  const wrapper = document.createElement(tag)
  wrapper.appendChild(element)
  return wrapper
}

function unwrapSpans(element) {
  if (element.tagName === "SPAN") return element.firstChild

  for (const span of element.querySelectorAll("span")) {
    span.replaceWith(...span.childNodes)
  }

  return element
}

function $preserveSpaces(element, textNode) {
  const domText = findTextNode(element)

  if (domText) {
    domText.data = encodeSpaces(domText.data, { collapsesLeadingSpace: $collapsesLeadingSpace(textNode) })
  }
}

function findTextNode(element) {
  if (element.nodeType === Node.TEXT_NODE) {
    return element
  } else {
    return document.createTreeWalker(element, NodeFilter.SHOW_TEXT).nextNode()
  }
}

function encodeSpaces(text, { collapsesLeadingSpace }) {
  let encoded = text.replace(/ {2,}/g, (run) => alternatingSpaces(run.length))

  if (collapsesLeadingSpace) {
    encoded = encoded.replace(/^ /, NON_BREAKING_SPACE)
  }

  return encoded
}

function alternatingSpaces(length) {
  return `${NON_BREAKING_SPACE} `.repeat(Math.ceil(length / 2)).slice(0, length)
}

function $collapsesLeadingSpace(node) {
  const previous = $previousInLine(node)
  return previous === null || $isLineBreakNode(previous) || /[ \t\n]$/.test(previous.getTextContent())
}

function $previousInLine(node) {
  let current = node

  while (current.getPreviousSibling() === null && $isInlineElement(current.getParent())) {
    current = current.getParent()
  }

  return current.getPreviousSibling()
}

function $isInlineElement(node) {
  return $isElementNode(node) && node.isInline()
}
