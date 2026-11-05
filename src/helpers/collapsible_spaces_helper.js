import { $isElementNode, $isLineBreakNode, $isTextNode } from "lexical"
import { $isCodeNode } from "@lexical/code"

const NON_BREAKING_SPACE = "\u00a0"

// HTML collapses runs of spaces and a space that starts a line, and so does
// Lexical's HTML importer, so a document that kept them as plain spaces lost
// them on every re-save. Like Trix, the export writes such spaces as
// non-breaking spaces, alternating with plain ones so lines can still wrap.
// The import turns them back into plain spaces, so they edit like the spaces
// the person typed. A lone non-breaking space between words is left alone.

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
  let decoded = text.replace(/[ \u00a0]{2,}/g, (run) => " ".repeat(run.length))

  if ($collapsesLeadingSpace(textNode)) {
    decoded = decoded.replace(/^\u00a0/, " ")
  }

  if (decoded !== text) {
    textNode.setTextContent(decoded)
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

function $isInlineElement(node) {
  return $isElementNode(node) && node.isInline()
}
