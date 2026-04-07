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
      registerEventListener(this, "submit", this.#handleSubmit),
      registerEventListener(this.querySelector("[value='unlink']"), "click", this.#handleUnlink)
    )
  }

  #handleToggle = ({ newState }) => {
    this.input.value = this.#selectedLinkUrl
    this.input.required = newState === "open"
  }

  #handleSubmit = (event) => {
    const command = event.submitter?.value
    this.editor.dispatchCommand(command, this.input.value)
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
