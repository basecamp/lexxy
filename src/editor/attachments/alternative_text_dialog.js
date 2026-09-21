import { $getNodeByKey, HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG } from "lexical"
import { $isActionTextAttachmentNode } from "../../nodes/action_text_attachment_node"
import { createElement } from "../../helpers/html_helper"
import { ListenerBin, registerEventListener } from "../../helpers/listener_helper"

export default class AlternativeTextDialog {
  #editor
  #dialog
  #input
  #nodeKey
  #listeners = new ListenerBin()

  constructor(editorElement) {
    this.#editor = editorElement.editor
    this.#dialog = createElement("dialog", { className: "lexxy-alternative-text-dialog", ariaLabel: "Alternative text" })
    this.#input = createElement("textarea", { rows: 4, autofocus: true })

    const title = createElement("h2", { textContent: "Alternative text" })
    const hint = createElement("p", { textContent: "Describe the image for people who cannot see it. This description is separate from the caption." })
    const label = createElement("label", { textContent: "Description" })
    label.appendChild(this.#input)

    const actions = createElement("div", { className: "lexxy-alternative-text-dialog__actions" })
    const cancel = createElement("button", { type: "button", textContent: "Cancel" })
    const save = createElement("button", { type: "button", textContent: "Save" })
    actions.append(cancel, save)
    this.#dialog.append(title, hint, label, actions)
    editorElement.appendChild(this.#dialog)

    this.#listeners.track(
      registerEventListener(cancel, "click", () => this.#dialog.close()),
      registerEventListener(save, "click", () => this.#save()),
      registerEventListener(this.#dialog, "keydown", event => event.stopPropagation())
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
      this.#dialog.showModal()
      this.#input.focus()
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
    this.#dialog.close()
  }
}
