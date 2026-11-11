import { $isElementNode, $isLineBreakNode, $isTextNode } from "lexical"
import { $isCodeNode } from "@lexical/code"

const NON_BREAKING_SPACE = "\u00a0"

// HTML collapses runs of spaces and a space that starts a line, and so does
// Lexical's HTML importer, so a document that kept them as plain spaces lost
// them on every re-save. Like Trix, the export writes such spaces as
// non-breaking spaces, alternating with plain ones so lines can still wrap.
// The import turns that encoding back into plain spaces, so they edit like the
// spaces the person typed: runs mixing both kinds of space, and a non-breaking
// space that starts a line or follows a space. Runs made only of non-breaking
// spaces, and a lone one between words, are left alone. A pasted fragment's
// top-level nodes have no line around them yet, so their leading space is too.

export function $encodeCollapsibleSpaces(text, textNode) {
  if ($isInCodeBlock(textNode)) return text

  let encoded = text.replace(/ {2,}/g, (run) => alternatingSpaces(run.length))

  if ($collapsesLeadingSpace(textNode)) {
    encoded = encoded.replace(/^ /, NON_BREAKING_SPACE)
  }

  return encoded
}

export function $decodeCollapsibleSpaces(nodes) {
  for (const node of nodes) {
    if ($isTextNode(node) && !$isInCodeBlock(node)) {
      $decodeTextNode(node)
    } else if ($isElementNode(node) && !$isCodeNode(node)) {
      $decodeCollapsibleSpaces(node.getChildren())
    }
  }
}

function $decodeTextNode(textNode) {
  const text = textNode.getTextContent()
  let decoded = text.replace(/[ \u00a0]{2,}/g, (run) => decodeRun(run))

  if ($isAttachedToLine(textNode) && $collapsesLeadingSpace(textNode)) {
    decoded = decoded.replace(/^\u00a0/, " ")
  }

  if (decoded !== text) {
    textNode.setTextContent(decoded)
  }
}

function decodeRun(run) {
  if (run.includes(" ")) {
    return " ".repeat(run.length)
  } else {
    return run
  }
}

function alternatingSpaces(length) {
  return `${NON_BREAKING_SPACE} `.repeat(Math.ceil(length / 2)).slice(0, length)
}

function $isInCodeBlock(textNode) {
  return $isCodeNode(textNode.getParent())
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

function $isAttachedToLine(node) {
  let current = node

  while ($isInlineElement(current.getParent())) {
    current = current.getParent()
  }

  return current.getParent() !== null
}

function $isInlineElement(node) {
  return $isElementNode(node) && node.isInline()
}
