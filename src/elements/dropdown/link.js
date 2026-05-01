import { LinkNode } from "@lexical/link"
import { registerEventListener } from "../../helpers/listener_helper"

export class LinkContent {
  constructor(dropdown) {
    this.dropdown = dropdown
  }

  connect() {
    this.input = this.panel.querySelector("input")

    this.dropdown.track(
      registerEventListener(this.input, "keydown", this.#handleEnter),
      registerEventListener(this.linkButton, "click", this.#handleLink),
      registerEventListener(this.unlinkButton, "click", this.#handleUnlink)
    )
  }

  onOpen() {
    this.input.value = this.#selectedLinkUrl
    this.input.required = true
  }

  onClose() {
    this.input.required = false
  }

  get panel() {
    return this.dropdown.panel
  }

  get editor() {
    return this.dropdown.editor
  }

  get editorElement() {
    return this.dropdown.editorElement
  }

  get linkButton() {
    return this.panel.querySelector("[value='link']")
  }

  get unlinkButton() {
    return this.panel.querySelector("[value='unlink']")
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
    this.dropdown.close()
  }

  #handleUnlink = () => {
    this.editor.dispatchCommand("unlink")
    this.dropdown.close()
  }

  get #selectedLinkUrl() {
    return this.editor.getEditorState().read(() => {
      const linkNode = this.editorElement.selection.nearestNodeOfType(LinkNode)
      return linkNode?.getURL() ?? ""
    })
  }
}

export default LinkContent
