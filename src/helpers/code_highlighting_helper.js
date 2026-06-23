import Prism from "../config/prism"

export function highlightCode(root = document) {
  const elements = root.querySelectorAll("pre[data-language]:not([data-highlighted])")

  elements.forEach(preElement => {
    highlightElement(preElement)
  })
}

export function highlightElement(preElement) {
  if (preElement.dataset.highlighted === "true") return

  const language = preElement.getAttribute("data-language")

  const grammar = Prism.languages?.[language]
  if (!grammar) return

  // Extract highlight ranges before Prism destroys <mark> elements
  const highlights = extractHighlightRanges(preElement)

  // Build the code string by walking the same nodes extractHighlightRanges
  // counts, so character offsets line up and leading whitespace survives.
  // Reading textContent through DOMParser would collapse leading whitespace
  // and shift every highlight range, re-indenting the rendered block.
  const code = extractCode(preElement)

  const highlightedHtml = Prism.highlight(code, grammar, language)
  preElement.innerHTML = highlightedHtml

  if (highlights.length > 0) {
    applyHighlightRanges(preElement, highlights)
  }

  preElement.dataset.highlighted = "true"
}

// Build the plain-text source for Prism by walking the same nodes
// extractHighlightRanges counts: text node contents verbatim and a newline
// per <br>. This keeps the offsets in both walks identical and avoids the
// whitespace normalization that HTML parsing applies to a document body.
function extractCode(preElement) {
  const root = preElement.querySelector("code") || preElement

  let code = ""

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      code += node.textContent
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === "BR") {
        code += "\n"
      } else {
        for (const child of node.childNodes) {
          walk(child)
        }
      }
    }
  }

  for (const child of root.childNodes) {
    walk(child)
  }

  return code
}

// Walk the DOM tree inside a <pre> element and build a list of
// { start, end, style } ranges for every <mark> element found.
function extractHighlightRanges(preElement) {
  const ranges = []
  const root = preElement.querySelector("code") || preElement

  let offset = 0

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      offset += node.textContent.length
    } else if (node.nodeType === Node.ELEMENT_NODE) {
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
        const style = extractStyle(node)
        if (style) {
          ranges.push({ start, end: offset, style })
        }
      }
    }
  }

  for (const child of root.childNodes) {
    walk(child)
  }

  return ranges
}

function extractStyle(element) {
  const parts = []
  if (element.style?.color) parts.push(`color: ${element.style.color};`)
  if (element.style?.backgroundColor) parts.push(`background-color: ${element.style.backgroundColor};`)
  return parts.length > 0 ? parts.join(" ") : null
}

// Wrap character ranges in <mark> elements within a Prism-highlighted DOM tree.
// Each range is applied independently, re-collecting text nodes each time to
// account for splits from previous ranges.
function applyHighlightRanges(element, highlights) {
  for (const { start, end, style } of highlights) {
    wrapRange(element, start, end, style)
  }
}

function wrapRange(container, rangeStart, rangeEnd, style) {
  const textNodes = collectTextNodes(container)

  // Process in reverse so DOM mutations don't shift earlier text node offsets
  for (let i = textNodes.length - 1; i >= 0; i--) {
    const { node, start: nodeStart, end: nodeEnd } = textNodes[i]
    const overlapStart = Math.max(rangeStart, nodeStart)
    const overlapEnd = Math.min(rangeEnd, nodeEnd)
    if (overlapStart >= overlapEnd) continue

    const relStart = overlapStart - nodeStart
    const relEnd = overlapEnd - nodeStart
    const text = node.textContent
    const parent = node.parentNode

    const mark = document.createElement("mark")
    mark.setAttribute("style", style)
    mark.textContent = text.slice(relStart, relEnd)

    if (relEnd < text.length) {
      parent.insertBefore(document.createTextNode(text.slice(relEnd)), node.nextSibling)
    }
    parent.insertBefore(mark, node.nextSibling)

    if (relStart > 0) {
      node.textContent = text.slice(0, relStart)
    } else {
      parent.removeChild(node)
    }
  }
}

function collectTextNodes(root) {
  const nodes = []
  let offset = 0
  const walker = document.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */)

  let node
  while ((node = walker.nextNode())) {
    const length = node.textContent.length
    nodes.push({ node, start: offset, end: offset + length })
    offset += length
  }

  return nodes
}
