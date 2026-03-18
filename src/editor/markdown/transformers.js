import { HEADING, TRANSFORMERS as LEXICAL_TRANSFORMERS } from "@lexical/markdown"
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text"

// Lexxy's toolbar heading cycle is h2 → h3 → h4, so markdown shortcuts
// should create headings in the same range: # → h2, ## → h3, ### → h4.
const LEXXY_HEADING = {
  ...HEADING,
  regExp: /^(#{1,3})\s/,
  replace: (parentNode, children, match, isImport) => {
    const level = match[1].length + 1
    const node = $createHeadingNode(`h${level}`)
    node.append(...children)
    parentNode.replace(node)
    if (!isImport) {
      node.select(0, 0)
    }
  },
  export: (node, exportChildren) => {
    if (!$isHeadingNode(node)) return null
    const level = Number(node.getTag().slice(1))
    if (level < 2) return null
    return "#".repeat(level - 1) + " " + exportChildren(node)
  }
}

export const TRANSFORMERS = LEXICAL_TRANSFORMERS.map(t => t === HEADING ? LEXXY_HEADING : t)
