import { $hasUpdateTag, $isLineBreakNode, $isTabNode, COLLABORATION_TAG, defineExtension } from "lexical"
import { $isCodeHighlightNode, PrismTokenizer, registerCodeHighlighting } from "@lexical/code"
import { $applyHighlightRangesToTokens, $takeHighlightRanges } from "./highlight_extension"
import { $applyLinkRangesToTokens, $extractLinkRangesFromCodeNode } from "../helpers/code_link_helper"
import LexxyExtension from "./lexxy_extension"

// Registers code highlighting through the extension system so its node
// transforms exist before the initial editor state is applied. Registering
// after editor creation misses code blocks loaded from the initial value:
// their transform pass has already run, and Lexical's catch-up dirtying
// only sees the committed (still empty) state.
export class CodeHighlightingExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/code-highlighting",
      register(editor) {
        return registerCodeHighlighting(editor, buildMarkupPreservingTokenizer(editor))
      }
    })
  }
}

// The code retokenizer replaces a code block's children with freshly created
// tokens that carry no styles or links, which would drop color highlights and
// hyperlinks on every edit. This tokenizer wraps the stock Prism tokenizer to
// restore both: it recovers the block's highlight and link ranges — staged
// during HTML import, or read from the children the fresh tokens are about to
// replace — and reapplies them to the fresh tokens before the retokenizer
// splices them in.
//
// The retokenizer runs whenever the block is dirty, which an edit anywhere in
// the block or a change the block merely contains can cause, and it splices in
// every token Lexical's diff sees as changed. A pass over text that has not
// changed since the last one is answered with the block's current tokens, so
// it never replaces a node.
function buildMarkupPreservingTokenizer(editor) {
  const tokenizedBlocks = new Map()

  return {
    defaultLanguage: PrismTokenizer.defaultLanguage,
    tokenize(code, language) {
      return PrismTokenizer.tokenize(code, language)
    },
    $tokenize(codeNode, language) {
      const tokenized = tokenizedBlocks.get(codeNode.getKey())
      const text = codeNode.getTextContent()
      const tokens = codeNode.getChildren()

      if ($hasUpdateTag(COLLABORATION_TAG) || tokenized?.language === language && tokenized?.text === text && tokens.every($isToken)) {
        tokenizedBlocks.set(codeNode.getKey(), { language, text })
        return tokens
      } else {
        const linkRanges = $extractLinkRangesFromCodeNode(codeNode)
        const highlightRanges = $takeHighlightRanges(editor, codeNode)
        const freshTokens = PrismTokenizer.$tokenize(codeNode, language)
        tokenizedBlocks.set(codeNode.getKey(), { language, text })
        return $applyLinkRangesToTokens($applyHighlightRangesToTokens(freshTokens, highlightRanges), linkRanges)
      }
    }
  }
}

function $isToken(node) {
  return $isCodeHighlightNode(node) || $isLineBreakNode(node) || $isTabNode(node)
}
