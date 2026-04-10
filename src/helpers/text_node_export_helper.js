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

export function exportTextNodeDOM(editor, textNode) {
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

  return { element: unwrapSpans(result) }
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
