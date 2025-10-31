import { $getSelection, $isRangeSelection } from "lexical"
import { $isLinkNode } from "@lexical/link"

export class LinkDialog extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector("dialog")
    this.input = this.querySelector("input")

    this.addEventListener("submit", this.#handleSubmit.bind(this))
    this.querySelector("[value='unlink']").addEventListener("click", this.#handleUnlink.bind(this))
    this.addEventListener("keydown", this.#handleKeyDown.bind(this))
  }

  show(editor) {
    this.input.value = this.#selectedLinkUrl
    this.dialog.show()
  }

  close() {
    this.dialog.close()
  }

  #handleSubmit(event) {
    const command = event.submitter?.value
    this.#editor.dispatchCommand(command, this.input.value)
  }

  #handleUnlink(event) {
    this.#editor.dispatchCommand("unlink")
    this.close()
  }

  #handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation()
      this.close()
    }
  }

  get #selectedLinkUrl() {
    let url = ""

    this.#editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      let node = selection.getNodes()[0]
      while (node && node.getParent()) {
        if ($isLinkNode(node)) {
          url = node.getURL()
          break
        }
        node = node.getParent()
      }
    })

    return url
  }

  get #editor() {
    return this.closest("lexxy-toolbar").editor
  }
}

// We should extend the native dialog and avoid the intermediary <dialog> but not
// supported by Safari yet: customElements.define("lexxy-link-dialog", LinkDialog, { extends: "dialog" })
customElements.define("lexxy-link-dialog", LinkDialog)
