import { $getCodeLink } from "./code_link_helper"
import { $encodeCollapsibleSpaces } from "./collapsible_spaces_helper"

// Custom TextNode exportDOM that avoids redundant wrapping.
//
// Lexical's built-in TextNode.exportDOM() calls createDOM() which produces semantic tags
// like <strong> for bold and <em> for italic, then unconditionally wraps the result
// with presentational tags (<b>, <i>) for the same formats. This produces redundant markup
// like <b><strong>text</strong></b>.
//
// This custom export skips <b> when <strong> is already present and <i> when <em> is
// already present, while preserving <s> and <u> wrappers which have no semantic equivalents
// in createDOM's output. On highlighted text, <s> and <u> go inside the <mark>.
//
// Any <span> elements produced by createDOM() are unwrapped, since they only carry
// editor classes that aren't meaningful in exported HTML.
//
// Spaces that HTML would collapse are exported as non-breaking spaces; see
// collapsible_spaces_helper.js.

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
    result = wrapDecoration(result, element, "s")
  }
  if (textNode.hasFormat("underline")) {
    result = wrapDecoration(result, element, "u")
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

// A text decoration line is drawn in the color of the element that declares it,
// so <s> and <u> go inside a highlight's <mark> to take its color.
function wrapDecoration(result, element, tag) {
  if (element.tagName === "MARK") {
    const wrapper = document.createElement(tag)
    wrapper.append(...element.childNodes)
    element.appendChild(wrapper)
    return result
  } else {
    return wrapWith(result, tag)
  }
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
    domText.data = $encodeCollapsibleSpaces(domText.data, textNode)
  }
}

function findTextNode(element) {
  if (element.nodeType === Node.TEXT_NODE) {
    return element
  } else {
    return document.createTreeWalker(element, NodeFilter.SHOW_TEXT).nextNode()
  }
}
