import { LinkExtension } from "@lexical/link"
import LexxyExtension from "./lexxy_extension"

// Lexical's link extension merges adjacent links that share a URL, so linking a
// selection that contains a link produces one link instead of fragments.
export class LinkMergingExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return LinkExtension
  }
}
