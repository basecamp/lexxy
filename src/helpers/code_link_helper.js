import { $getState, $isElementNode, $isTextNode, $setState, createState } from "lexical"
import { $createCodeHighlightNode, $isCodeHighlightNode } from "@lexical/code"
import { $isLinkNode } from "@lexical/link"
import { segmentTextByRanges } from "./text_range_helper"

// The code retokenizer only knows CodeHighlightNode, LineBreakNode and
// TabNode, so a LinkNode inside a code block — Trix-authored documents allow
// links in code — is destroyed on the first retokenization. Links survive as
// state on the tokens instead: this state records the link attributes on each
// CodeHighlightNode the link covers, the extraction below reads it (or a
// still-untokenized LinkNode) back into ranges before every retokenization,
// and the tokenizer reapplies it to the fresh tokens.
const codeLinkState = createState("codeLink", {
  parse: (value) => (value && typeof value.url === "string" ? value : null)
})

export function $getCodeLink(node) {
  return $getState(node, codeLinkState)
}

export function $setCodeLink(node, link) {
  $setState(node, codeLinkState, link)
}

// Build the list of { start, end, link } ranges covering every link in a code
// block, with offsets into the block's text content. Links appear either as
// LinkNode descendants (imported or just created, before their first
// retokenization) or as link state on tokens (after it). The walk recurses
// through nested elements because `<pre><code>` imports of multi-line content
// briefly produce a CodeNode nested inside another before the outer one's
// retokenization flattens them.
export function $extractLinkRangesFromCodeNode(codeNode) {
  const ranges = []
  let offset = 0

  function walk(node) {
    for (const child of node.getChildren()) {
      if ($isLinkNode(child)) {
        const size = child.getTextContent().length
        appendRange(ranges, { start: offset, end: offset + size, link: linkAttributesFrom(child) })
        offset += size
      } else if ($isElementNode(child)) {
        walk(child)
      } else {
        const size = child.getTextContent().length
        if ($isTextNode(child)) {
          const link = $getCodeLink(child)
          if (link) {
            appendRange(ranges, { start: offset, end: offset + size, link })
          }
        }
        offset += size
      }
    }
  }

  walk(codeNode)

  return ranges
}

export function $applyLinkRangesToTokens(tokens, ranges) {
  if (ranges.length === 0) return tokens

  const linkedTokens = []
  let offset = 0

  for (const token of tokens) {
    if ($isCodeHighlightNode(token)) {
      linkedTokens.push(...$splitTokenAtLinkBoundaries(token, offset, ranges))
    } else {
      linkedTokens.push(token)
    }
    offset += token.getTextContentSize()
  }

  return linkedTokens
}

function $splitTokenAtLinkBoundaries(token, tokenStart, ranges) {
  const text = token.getTextContent()
  const segments = segmentTextByRanges(text, tokenStart, ranges)

  if (segments.length === 1) {
    const [ segment ] = segments
    if (segment.range) {
      $setCodeLink(token, segment.range.link)
    }
    return [ token ]
  } else {
    return segments.map((segment) => {
      const segmentToken = $cloneTokenSlice(token, text.slice(segment.start, segment.end))
      if (segment.range) {
        $setCodeLink(segmentToken, segment.range.link)
      }
      return segmentToken
    })
  }
}

function $cloneTokenSlice(token, text) {
  const segmentToken = $createCodeHighlightNode(text, token.getHighlightType())
  segmentToken.setStyle(token.getStyle())
  // CodeHighlightNode.setFormat is a no-op, so carry the format over directly
  segmentToken.getWritable().__format = token.getFormat()
  return segmentToken
}

// Consecutive children carrying the same link merge into a single range, so a
// link split across tokens by an earlier retokenization keeps covering fresh
// tokens as one contiguous stretch however they retokenize.
function appendRange(ranges, range) {
  const previous = ranges[ranges.length - 1]

  if (previous && previous.end === range.start && sameLink(previous.link, range.link)) {
    previous.end = range.end
  } else {
    ranges.push(range)
  }
}

function sameLink(a, b) {
  return a.url === b.url && a.target === b.target && a.rel === b.rel && a.title === b.title
}

function linkAttributesFrom(linkNode) {
  const link = { url: linkNode.getURL() }
  if (linkNode.getTarget()) link.target = linkNode.getTarget()
  if (linkNode.getRel()) link.rel = linkNode.getRel()
  if (linkNode.getTitle()) link.title = linkNode.getTitle()
  return link
}
