import { $getSelection, $isRangeSelection } from "lexical"
import { $isLinkNode } from "@lexical/link"
import { ToolbarDialog } from "./toolbar_dialog"

export class LinkDialog extends ToolbarDialog {
  connectedCallback() {
    super.connectedCallback()
    this.input = this.querySelector("input")

    this.#registerHandlers()
  }

  updateStateCallback() {
    this.input.value = this.#selectedLinkUrl
  }

  #registerHandlers() {
    this.dialog.addEventListener("beforetoggle", this.#handleBeforeToggle.bind(this))
    this.dialog.addEventListener("submit", this.#handleSubmit.bind(this))
    this.querySelector("[value='unlink']").addEventListener("click", this.#handleUnlink.bind(this))
  }

  #handleBeforeToggle({ newState }) {
    this.input.required = newState === "open"
  }

  #handleSubmit(event) {
    const command = event.submitter?.value
    this.editor.dispatchCommand(command, this.input.value)
  }

  #handleUnlink() {
    this.editor.dispatchCommand("unlink")
    this.close()
  }

  get #selectedLinkUrl() {
    let url = ""

    this.editor.getEditorState().read(() => {
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
}

// We should extend the native dialog and avoid the intermediary <dialog> but not
// supported by Safari yet: customElements.define("lexxy-link-dialog", LinkDialog, { extends: "dialog" })
customElements.define("lexxy-link-dialog", LinkDialog)
