import Prism from "../config/prism"

// Highlighting a whole document of code blocks in one synchronous pass blocks
// the main thread for the entire run, freezing input on heavy threads. We
// process blocks in time-budgeted chunks and yield to the event loop between
// them so the browser can paint and handle input while highlighting continues.
const CHUNK_TIME_BUDGET_MS = 8

export async function highlightCode(root = document) {
  const elements = root.querySelectorAll("pre[data-language]:not([data-highlighted])")

  let chunkStart = performance.now()
  for (const preElement of elements) {
    highlightElement(preElement)

    if (performance.now() - chunkStart >= CHUNK_TIME_BUDGET_MS) {
      await yieldToEventLoop()
      chunkStart = performance.now()
    }
  }
}

// MessageChannel posts a clean macrotask without setTimeout's 4ms clamp,
// letting the browser process input and paint a frame between chunks. We avoid
// scheduler.yield() here: it resumes the continuation ahead of rendering, so it
// keeps highlighting fast but barely lets frames through. A plain macrotask
// keeps input and scrolling responsive on heavy threads, which is the point.
function yieldToEventLoop() {
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => resolve()
    channel.port2.postMessage(undefined)
  })
}

export function highlightElement(preElement) {
  if (preElement.dataset.highlighted === "true") return

  const language = preElement.getAttribute("data-language")

  const grammar = Prism.languages?.[language]
  if (!grammar) return

  // Read the source text and <mark> ranges in a single walk, before Prism
  // rewrites the element. Sharing one traversal keeps the highlight offsets
  // aligned with the code string and preserves leading whitespace — deriving
  // either of them separately (e.g. textContent through DOMParser) collapses
  // leading whitespace and shifts every range, re-indenting the rendered block.
  const { code, highlights } = extractCodeAndHighlights(preElement)

  const highlightedHtml = Prism.highlight(code, grammar, language)
  preElement.innerHTML = highlightedHtml

  if (highlights.length > 0) {
    applyHighlightRanges(preElement, highlights)
  }

  preElement.dataset.highlighted = "true"
}

// Walk the <pre> once, building Prism's source text and the <mark> ranges
// together: a text node contributes its text verbatim, a <br> contributes a
// newline, and a <mark> records the slice of code it covers. Because both
// outputs come from the same walk, every range offset is just a position in
// `code` — so the highlights can't drift out of sync with the source, and the
// block's leading whitespace survives (HTML parsing would collapse it).
function extractCodeAndHighlights(preElement) {
  const root = preElement.querySelector("code") || preElement
  const highlights = []
  let code = ""

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      code += node.textContent
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === "BR") {
        code += "\n"
      } else if (node.tagName === "MARK") {
        const start = code.length
        for (const child of node.childNodes) {
          walk(child)
        }
        const style = extractStyle(node)
        if (style) {
          highlights.push({ start, end: code.length, style })
        }
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

  return { code, highlights }
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
