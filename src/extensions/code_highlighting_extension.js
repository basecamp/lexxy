import { defineExtension } from "lexical"
import { registerCodeHighlighting } from "@lexical/code"
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
        return registerCodeHighlighting(editor)
      }
    })
  }
}
