import { $createLineBreakNode, TextNode } from "lexical"
import LexxyExtension from "./lexxy_extension"

const LINE_SEPARATORS = /\r\n|[\n\r\u2028\u2029]/

// A literal line separator inside a text node renders as a break in the editor, or not at all,
// but never survives serialization to HTML. macOS text replacements deliver U+2028 LINE SEPARATOR,
// and other insertions can carry "\n", so however the text arrives, a transform converts whatever
// lands in a text node into line break nodes.
export class LineSeparatorsExtension extends LexxyExtension {
  get lexicalExtension() {
    return this.defineExtension({
      name: "lexxy/line-separators",
      register(editor) {
        return editor.registerNodeTransform(TextNode, $replaceLineSeparatorWithLineBreak)
      }
    })
  }
}

// Replaces the first separator only: the split leaves dirty text nodes behind, so Lexical re-runs
// the transform until none remain.
function $replaceLineSeparatorWithLineBreak(textNode) {
  const match = textNode.getTextContent().match(LINE_SEPARATORS)

  if (match) {
    let separatorNode
    if (match.index === 0) {
      [ separatorNode ] = textNode.splitText(match[0].length)
    } else {
      [ , separatorNode ] = textNode.splitText(match.index, match.index + match[0].length)
    }
    separatorNode.replace($createLineBreakNode())
  }
}
