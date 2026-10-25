import Prism from "../config/prism"

// Highlighting a whole document of code blocks in one synchronous pass blocks
// the main thread for the entire run, freezing input on heavy threads. We
// process blocks in time-budgeted chunks and yield to the event loop between
// them so the browser can paint and handle input while highlighting continues.
const CHUNK_TIME_BUDGET_MS = 8

// Every call feeds one shared queue drained by a single loop, and the budget
// covers the whole task rather than one call. Host apps typically call
// highlightCode() from a Stimulus controller on each rendered rich text body,
// and many of those connect in the same task: if each call got its own budget,
// they would add up to the long task we are avoiding.
const queue = new Map()
let draining = false
let drained = Promise.resolve()
let slice = null

export function highlightCode(root = document) {
  // The latest call's root wins: a block moved to a new root mid-run must be
  // judged against that root, not the one it was first queued under.
  for (const preElement of root.querySelectorAll("pre[data-language]:not([data-highlighted])")) {
    if (queue.get(preElement)?.root !== root) {
      queue.set(preElement, { root, rootWasConnected: root.isConnected })
    }
  }

  // A running loop picks up the new entries: Map iteration visits entries
  // added while it is underway.
  if (!draining) drained = drainQueue()
  return drained
}

async function drainQueue() {
  draining = true
  try {
    for (const preElement of queue.keys()) {
      if (sliceExhausted()) {
        await yieldToEventLoop()
        startSlice()
      }

      // Read the entry after yielding: a call made meanwhile may have replaced it.
      const entry = queue.get(preElement)
      queue.delete(preElement)
      if (hasLeftRoot(preElement, entry)) continue

      // One bad block must not strand the rest of the page: every caller
      // shares this loop.
      try {
        highlightElement(preElement)
      } catch (error) {
        reportError(error)
      }
    }
  } finally {
    draining = false
  }
}

// The first block highlighted in a task opens a slice that lasts until the
// task ends, so a small thread still highlights before the first paint.
function sliceExhausted() {
  if (!slice) {
    startSlice()
    return false
  }
  return performance.now() - slice.start >= CHUNK_TIME_BUDGET_MS
}

function startSlice() {
  const current = { start: performance.now() }
  slice = current
  afterCurrentTask(() => {
    if (slice === current) slice = null
  })
}

// A block can leave the page between chunks, e.g. when Turbo swaps the body
// mid-run. Skip it rather than spend main-thread time on a page that is gone.
// A block still in the document is highlighted wherever it moved, and one
// queued from a root that was never connected (a fragment highlighted before
// insertion) is highlighted while that root still holds it.
function hasLeftRoot(preElement, { root, rootWasConnected }) {
  return !preElement.isConnected && (rootWasConnected || !root.contains(preElement))
}

// MessageChannel posts a clean macrotask without setTimeout's 4ms clamp,
// letting the browser process input and paint a frame between chunks. We avoid
// scheduler.yield() here: it resumes the continuation ahead of rendering, so it
// keeps highlighting fast but barely lets frames through. A plain macrotask
// keeps input and scrolling responsive on heavy threads, which is the point.
function yieldToEventLoop() {
  return new Promise(afterCurrentTask)
}

function afterCurrentTask(callback) {
  const channel = new MessageChannel()
  channel.port1.onmessage = () => {
    channel.port1.close()
    callback()
  }
  channel.port2.postMessage(undefined)
}

export function highlightElement(preElement) {
  if (preElement.dataset.highlighted === "true") return

  const language = preElement.getAttribute("data-language")

  const grammar = Prism.languages?.[language]
  if (!grammar) return

  // Read the source text and the <mark> and <a> ranges in a single walk,
  // before Prism rewrites the element. Sharing one traversal keeps the range
  // offsets aligned with the code string and preserves leading whitespace —
  // deriving either of them separately (e.g. textContent through DOMParser)
  // collapses leading whitespace and shifts every range, re-indenting the
  // rendered block.
  const { code, highlights, links } = extractCodeAndMarkup(preElement)

  const highlightedHtml = Prism.highlight(code, grammar, language)
  preElement.innerHTML = highlightedHtml

  if (highlights.length > 0) {
    applyHighlightRanges(preElement, highlights)
  }

  if (links.length > 0) {
    applyLinkRanges(preElement, links)
  }

  preElement.dataset.highlighted = "true"
}

// Walk the <pre> once, building Prism's source text and the <mark> and <a>
// ranges together: a text node contributes its text verbatim, a <br>
// contributes a newline, and a <mark> or <a> records the slice of code it
// covers. Because all outputs come from the same walk, every range offset is
// just a position in `code` — so the markup can't drift out of sync with the
// source, and the block's leading whitespace survives (HTML parsing would
// collapse it).
function extractCodeAndMarkup(preElement) {
  const root = preElement.querySelector("code") || preElement
  const highlights = []
  const links = []
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
      } else if (node.tagName === "A" && node.getAttribute("href")) {
        const start = code.length
        for (const child of node.childNodes) {
          walk(child)
        }
        links.push({ start, end: code.length, attributes: linkAttributes(node) })
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

  return { code, highlights, links }
}

function linkAttributes(element) {
  const attributes = { href: element.getAttribute("href") }
  for (const name of [ "target", "rel", "title" ]) {
    if (element.getAttribute(name)) {
      attributes[name] = element.getAttribute(name)
    }
  }
  return attributes
}

function extractStyle(element) {
  const parts = []
  if (element.style?.color) parts.push(`color: ${element.style.color};`)
  if (element.style?.backgroundColor) parts.push(`background-color: ${element.style.backgroundColor};`)
  return parts.length > 0 ? parts.join(" ") : null
}

// Wrap character ranges in <mark> or <a> elements within a Prism-highlighted
// DOM tree. Each range is applied independently, re-collecting text nodes
// each time to account for splits from previous ranges.
function applyHighlightRanges(element, highlights) {
  for (const { start, end, style } of highlights) {
    wrapRange(element, start, end, () => {
      const mark = document.createElement("mark")
      mark.setAttribute("style", style)
      return mark
    })
  }
}

function applyLinkRanges(element, links) {
  for (const { start, end, attributes } of links) {
    wrapRange(element, start, end, () => {
      const anchor = document.createElement("a")
      for (const [ name, value ] of Object.entries(attributes)) {
        anchor.setAttribute(name, value)
      }
      return anchor
    })
  }
}

function wrapRange(container, rangeStart, rangeEnd, createWrapper) {
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

    const wrapper = createWrapper()
    wrapper.textContent = text.slice(relStart, relEnd)

    if (relEnd < text.length) {
      parent.insertBefore(document.createTextNode(text.slice(relEnd)), node.nextSibling)
    }
    parent.insertBefore(wrapper, node.nextSibling)

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
