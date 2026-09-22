import { $getNodeByKey, HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG } from "lexical"
import { $isActionTextAttachmentNode } from "../../nodes/action_text_attachment_node"
import { createElement } from "../../helpers/html_helper"
import { ListenerBin, registerEventListener } from "../../helpers/listener_helper"

export default class AlternativeTextDialog {
  #editor
  #editorElement
  #dialog
  #input
  #nodeKey
  #elementToRefocus
  #listeners = new ListenerBin()

  constructor(editorElement) {
    this.#editor = editorElement.editor
    this.#editorElement = editorElement
    this.#dialog = createElement("dialog", { className: "lexxy-alternative-text-dialog", ariaLabel: "Alternative text" })
    this.#input = createElement("textarea", { rows: 1, autofocus: true, ariaLabel: "Description", placeholder: "Keep it short, but enough to convey the context…" })

    const title = createElement("h2", { textContent: "Describe the image for people who can't see it:" })

    const actions = createElement("div", { className: "lexxy-alternative-text-dialog__actions" })
    const cancel = createElement("button", { type: "button", textContent: "Cancel" })
    const save = createElement("button", { type: "button", className: "lexxy-alternative-text-dialog__save", textContent: "Save" })
    actions.append(cancel, save)

    const controls = createElement("div", { className: "lexxy-alternative-text-dialog__controls" })
    controls.append(this.#input, actions)
    this.#dialog.append(title, controls)
    editorElement.appendChild(this.#dialog)

    this.#listeners.track(
      registerEventListener(cancel, "click", () => this.#close()),
      registerEventListener(save, "click", () => this.#save()),
      registerEventListener(this.#dialog, "keydown", this.#closeOnEscape),
      registerEventListener(document, "pointerdown", this.#closeOnClickOutside)
    )
  }

  dispose() {
    this.#dialog.remove()
    this.#listeners.dispose()
  }

  open(nodeKey) {
    const description = this.#editor.read(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isActionTextAttachmentNode(node)) {
        return node.altText
      }
    })

    if (description !== undefined) {
      this.#nodeKey = nodeKey
      this.#input.value = description
      this.#anchorBelowAttachment(nodeKey)
      this.#elementToRefocus = document.activeElement
      this.#editorElement.querySelector("lexxy-toolbar")?.closeDropdowns()
      this.#dialog.show()
      this.#input.focus()
    }
  }

  #anchorBelowAttachment(nodeKey) {
    const figureElement = this.#editor.getElementByKey(nodeKey)
    if (figureElement) {
      const rect = figureElement.getBoundingClientRect()
      const editorRect = this.#editorElement.getBoundingClientRect()
      const bottom = rect.bottom - editorRect.top - this.#editorElement.clientTop + this.#editorElement.scrollTop
      this.#dialog.style.setProperty("--lexxy-anchor-bottom", `${bottom}px`)
    }
  }

  #save() {
    const description = this.#input.value.trim()
    this.#editor.update(() => {
      const node = $getNodeByKey(this.#nodeKey)
      if ($isActionTextAttachmentNode(node) && node.altText !== description) {
        node.getWritable().altText = description
      }
    }, { tag: [ HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG ] })
    this.#close()
  }

  #closeOnEscape = (event) => {
    event.stopPropagation()
    if (event.key === "Escape") {
      this.#close()
    }
  }

  // Dismissing by clicking elsewhere must leave focus where the click landed.
  #closeOnClickOutside = (event) => {
    if (this.#dialog.open && !this.#dialog.contains(event.target)) {
      this.#close({ refocus: false })
    }
  }

  #close({ refocus = true } = {}) {
    this.#dialog.close()
    if (refocus && this.#elementToRefocus?.isConnected) {
      this.#elementToRefocus.focus()
    }
    this.#elementToRefocus = null
  }
}
