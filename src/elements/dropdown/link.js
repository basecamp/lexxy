import { LinkNode } from "@lexical/link"
import { ToolbarDropdown } from "../toolbar_dropdown"

export class LinkDropdown extends ToolbarDropdown {
  connectedCallback() {
    super.connectedCallback()
    this.input = this.querySelector("input")

    this.#registerHandlers()
  }

  #registerHandlers() {
    this.container.addEventListener("toggle", this.#handleToggle.bind(this))
    this.addEventListener("submit", this.#handleSubmit.bind(this))
    this.querySelector("[value='unlink']").addEventListener("click", this.#handleUnlink.bind(this))
  }

  #handleToggle({ newState }) {
    this.input.value = this.#selectedLinkUrl
    this.input.required = newState === "open"
  }

  #handleSubmit(event) {
    const command = event.submitter?.value
    this.editor.dispatchCommand(command, this.input.value)
    this.close()
  }

  #handleUnlink() {
    this.editor.dispatchCommand("unlink")
    this.close()
  }

  get #selectedLinkUrl() {
    const url = this.editor.getEditorState().read(() => {
      const linkNode = this.editorElement.selection.nearestNodeOfType(LinkNode)
      if (linkNode) return linkNode.getURL()
    })

    return url || ""
  }
}

export default LinkDropdown
