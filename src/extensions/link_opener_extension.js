import { defineExtension } from "lexical"
import { IS_APPLE, mergeRegister } from "@lexical/utils"
import { registerEventListener } from "../helpers/listener_helper.js"
import LexxyExtension from "./lexxy_extension.js"

export class LinkOpenerExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/link-opener",
      register: () => {
        return mergeRegister(
          registerEventListener(window, "keydown", this.#update.bind(this)),
          registerEventListener(window, "keyup", this.#update.bind(this)),
          registerEventListener(window, "blur", this.#disable.bind(this)),
          registerEventListener(window, "focus", this.#refresh.bind(this))
        )
      }
    })
  }

  #update(event) {
    if (this.#isModified(event)) {
      this.#enable()
    } else {
      this.#disable()
    }
  }

  #refresh() {
    // Chrome dispatches events without modifier keys *for a while* after changing tabs
    setTimeout(() => {
      window.addEventListener("mousemove", this.#update.bind(this), { once: true })
    }, 200)
  }

  #isModified(event) {
    return IS_APPLE ? event.metaKey : event.ctrlKey
  }

  #enable() {
    for (const anchor of this.#anchors) {
      anchor.setAttribute("contenteditable", "false")
      anchor.setAttribute("target", "_blank")
      anchor.setAttribute("rel", "noopener noreferrer")
    }
  }

  #disable() {
    for (const anchor of this.#anchors) {
      anchor.removeAttribute("contenteditable")
      anchor.removeAttribute("target")
      anchor.removeAttribute("rel")
    }
  }

  get #anchors() {
    return this.editorElement.editorContentElement?.querySelectorAll("a") ?? []
  }
}
