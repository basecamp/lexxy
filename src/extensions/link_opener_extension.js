import { $findMatchingParent, $getNearestNodeFromDOMNode, CLICK_COMMAND, COMMAND_PRIORITY_NORMAL, defineExtension, mergeRegister } from "lexical"
import { $isLinkNode } from "@lexical/link"
import { IS_APPLE } from "@lexical/utils"
import { registerEventListener } from "../helpers/listener_helper"
import { delay } from "../helpers/timing_helpers"
import LexxyExtension from "./lexxy_extension"

export class LinkOpenerExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/link-opener",
      register: (editor) => mergeRegister(
        editor.registerCommand(CLICK_COMMAND, this.#handleClick.bind(this), COMMAND_PRIORITY_NORMAL),
        registerEventListener(this.editorElement.editorContentElement, "auxclick", this.#handleAuxClick.bind(this)),
        registerEventListener(window, "keydown", this.#handleKey.bind(this)),
        registerEventListener(window, "keyup", this.#handleKey.bind(this)),
        registerEventListener(window, "focus", this.#handleFocus.bind(this))
      )
    })
  }

  #handleClick(event) {
    if (this.#isModified(event)) {
      return $openLink(event.target)
    } else {
      return false
    }
  }

  #handleAuxClick(event) {
    if (event.button === 1) {
      this.editorElement.editor.read(() => $openLink(event.target))
    }
  }

  #handleKey(event) {
    this.#updateOpenableAttribute(event)
  }

  // Chrome dispatches events without modifier keys *for a while* after changing tabs
  async #handleFocus() {
    await delay(200)
    this.editorElement.addEventListener("mousemove", this.#updateOpenableAttribute.bind(this), { once: true })
  }

  #updateOpenableAttribute(event) {
    this.editorElement.toggleAttribute("data-links-openable", this.#isModified(event))
  }

  #isModified(event) {
    return IS_APPLE ? event.metaKey : event.ctrlKey
  }
}

function $openLink(target) {
  const node = $getNearestNodeFromDOMNode(target)
  const linkNode = $findMatchingParent(node, $isLinkNode)
  if (linkNode) {
    const url = linkNode.sanitizeUrl(linkNode.getURL())
    window.open(url, "_blank", "noopener,noreferrer")
    return true
  } else {
    return false
  }
}
