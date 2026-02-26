import { $getNodeByKey } from "lexical"
import { createElement } from "../helpers/html_helper"

const DELETE_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M18.2129 19.2305C18.0925 20.7933 16.7892 22 15.2217 22H7.77832C6.21084 22 4.90753 20.7933 4.78711 19.2305L4 9H19L18.2129 19.2305Z"/><path d="M13 2C14.1046 2 15 2.89543 15 4H19C19.5523 4 20 4.44772 20 5V6C20 6.55228 19.5523 7 19 7H4C3.44772 7 3 6.55228 3 6V5C3 4.44772 3.44772 4 4 4H8C8 2.89543 8.89543 2 10 2H13Z"/>
  </svg>`

export class AttachmentDeleteButton extends HTMLElement {
  register(nodeKey) {
    this.nodeKey = nodeKey
  }

  connectedCallback() {
    this.editorElement = this.closest("lexxy-editor")
    this.editor = this.editorElement.editor
    this.classList.add("lexxy-floating-controls")
    this.nodeKey = this.nodeKey || this.getAttribute("nodeKey")

    if (!this.deleteButton) {
      this.#attachDeleteButton()
    }
  }

  #attachDeleteButton() {
    const container = createElement("div", { className: "lexxy-floating-controls__group" })

    this.deleteButton = createElement("button", {
      className: "lexxy-attachment-delete",
      type: "button",
      "aria-label": "Delete attachment"
    })
    this.deleteButton.tabIndex = -1
    this.deleteButton.innerHTML = DELETE_ICON

    this.handleDeleteClick = () => this.#deleteAttachmentByKey()
    this.deleteButton.addEventListener("click", this.handleDeleteClick)
    container.appendChild(this.deleteButton)

    this.appendChild(container)
  }

  #deleteAttachmentByKey() {
    if (!this.nodeKey) return

    this.editor.update(() => {
      const node = $getNodeByKey(this.nodeKey)
      node?.remove()
    })
  }
}

export default AttachmentDeleteButton
