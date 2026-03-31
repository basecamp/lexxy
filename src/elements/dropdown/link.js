import { $getSelection, $isRangeSelection } from "lexical"
import { $isLinkNode } from "@lexical/link"
import { ToolbarDropdown } from "../toolbar_dropdown"

export class LinkDropdown extends ToolbarDropdown {
  connectedCallback() {
    super.connectedCallback()
    this.input = this.querySelector("input")

    this.container.addEventListener("toggle", this.#handleToggle)
    this.addEventListener("submit", this.#handleSubmit)
    this.querySelector("[value='unlink']").addEventListener("click", this.#handleUnlink)
  }

  disconnectedCallback() {
    this.container?.removeEventListener("toggle", this.#handleToggle)
    this.removeEventListener("submit", this.#handleSubmit)
    this.querySelector("[value='unlink']")?.removeEventListener("click", this.#handleUnlink)
    super.disconnectedCallback()
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
