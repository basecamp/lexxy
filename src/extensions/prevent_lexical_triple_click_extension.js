import { defineExtension } from "lexical"
import { registerEventListener } from "../helpers/listener_helper"
import LexxyExtension from "./lexxy_extension"

export class PreventLexicalTripleClickExtension extends LexxyExtension {
  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/prevent-lexical-triple-click",
      register: (editor) => editor.registerRootListener((rootElement) => {
        if (rootElement) {
          return registerEventListener(
            rootElement,
            "click",
            this.#handleTripleClick.bind(this),
            { capture: true }
          )
        }
      })
    })
  }

  // Stop propagation of the triple-click to prevent Lexical's handler from running.
  //
  // Lexical's onClick handler implements a triple-click handler that is trivial/anemic/naïve. The
  // intention of the change, made in facebook/lexical#4512, seems to be to deal with browsers'
  // "overselection" behavior, where a triple-click selection might end at offset 0 of the following
  // block, which can cause issues when transforming the selection. But the implementation breaks
  // many common real-world use cases and Lexxy does not demonstrate the behavior it's intended to
  // work around (in headers or tables).
  #handleTripleClick(event) {
    if (event.detail === 3) {
      event.stopPropagation()
    }
  }
}
