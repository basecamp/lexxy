import { $getSelection, $isRangeSelection } from "lexical"
import { $isLinkNode } from "@lexical/link"
import { ToolbarDropdown } from "../toolbar_dropdown"
import { registerEventListener } from "../../helpers/listener_helper"

export class LinkDropdown extends ToolbarDropdown {
  connectedCallback() {
    super.connectedCallback()
    this.input = this.querySelector("input")

    this.track(
      registerEventListener(this.container, "toggle", this.#handleToggle),
      registerEventListener(this.input, "keydown", this.#handleEnter),
      registerEventListener(this.querySelector("[value='link']"), "click", this.#handleLink),
      registerEventListener(this.querySelector("[value='unlink']"), "click", this.#handleUnlink)
    )
  }

  #handleToggle = ({ newState }) => {
    this.input.value = this.#selectedLinkUrl
  }

  #handleEnter = (event) => {
    if (event.key == "Enter") {
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

export default LinkDropdown
