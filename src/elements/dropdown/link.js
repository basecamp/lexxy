import { LinkNode } from "@lexical/link"
import { ToolbarDropdown } from "../toolbar_dropdown"
import { registerEventListener } from "../../helpers/listener_helper"

export class LinkDropdown extends ToolbarDropdown {
  connectedCallback() {
    super.connectedCallback()

    this.input = this.querySelector("input")

    this.track(
      registerEventListener(this.container, "toggle", this.#handleToggle),
      registerEventListener(this.input, "keydown", this.#handleEnter),
      registerEventListener(this.linkButton, "click", this.#handleLink),
      registerEventListener(this.unlinkButton, "click", this.#handleUnlink)
    )
  }

  get linkButton() {
    return this.querySelector("[value='link']")
  }

  get unlinkButton() {
    return this.querySelector("[value='unlink']")
  }

  #handleToggle = ({ newState }) => {
    this.input.value = this.#selectedLinkUrl
    this.input.required = newState === "open"
  }

  #handleEnter = (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      this.#handleLink(event)
    }
  }

  #handleLink = () => {
    if (!this.input.checkValidity()) {
      this.input.reportValidity()
      return
    }

    this.editor.dispatchCommand("link", this.input.value)
    this.close()
  }

  #handleUnlink = () => {
    this.editor.dispatchCommand("unlink")
    this.close()
  }

  get #selectedLinkUrl() {
    return this.editor.getEditorState().read(() => {
      const linkNode = this.editorElement.selection.nearestNodeOfType(LinkNode)
      return linkNode?.getURL() ?? null
    })
  }
}

export default LinkDropdown
