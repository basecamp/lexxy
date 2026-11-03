import { $hasUpdateTag, $isLineBreakNode, $isTabNode, COLLABORATION_TAG, defineExtension } from "lexical"
import { $isCodeHighlightNode, CodeNode } from "@lexical/code"
import { PrismTokenizer, registerCodeHighlighting } from "@lexical/code-prism"
import { mergeRegister } from "@lexical/utils"
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
        const lastTokenizationByBlock = new Map()

        return mergeRegister(
          registerCodeHighlighting(editor, buildMarkupPreservingTokenizer(editor, lastTokenizationByBlock)),
          editor.registerMutationListener(CodeNode, (mutations) => forgetDestroyedBlocks(mutations, lastTokenizationByBlock))
        )
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
function buildMarkupPreservingTokenizer(editor, lastTokenizationByBlock) {
  return {
    defaultLanguage: PrismTokenizer.defaultLanguage,
    tokenize(code, language) {
      return PrismTokenizer.tokenize(code, language)
    },
    $tokenize(codeNode, language) {
      const lastTokenization = lastTokenizationByBlock.get(codeNode.getKey())
      lastTokenizationByBlock.set(codeNode.getKey(), { language, text: codeNode.getTextContent() })

      if ($keepsCurrentTokens(codeNode, language, lastTokenization)) {
        return codeNode.getChildren()
      } else {
        const linkRanges = $extractLinkRangesFromCodeNode(codeNode)
        const highlightRanges = $takeHighlightRanges(editor, codeNode)
        const freshTokens = PrismTokenizer.$tokenize(codeNode, language)
        return $applyLinkRangesToTokens($applyHighlightRangesToTokens(freshTokens, highlightRanges), linkRanges)
      }
    }
  }
}

function $keepsCurrentTokens(codeNode, language, lastTokenization) {
  if ($hasUpdateTag(COLLABORATION_TAG)) {
    return true
  } else {
    return lastTokenization?.language === language && lastTokenization?.text === codeNode.getTextContent() && codeNode.getChildren().every($isToken)
  }
}

function forgetDestroyedBlocks(mutations, lastTokenizationByBlock) {
  for (const [ key, mutation ] of mutations) {
    if (mutation === "destroyed") {
      lastTokenizationByBlock.delete(key)
    }
  }
}

function $isToken(node) {
  return $isCodeHighlightNode(node) || $isLineBreakNode(node) || $isTabNode(node)
}
