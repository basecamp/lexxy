import { $getNearestNodeFromDOMNode } from "lexical"
import { createElement } from "../helpers/html_helper"

const DELETE_ICON = `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
  <path d="M11.2041 1.01074C12.2128 1.113 13 1.96435 13 3V4H15L15.1025 4.00488C15.6067 4.05621 16 4.48232 16 5C16 5.55228 15.5523 6 15 6H14.8457L14.1416 15.1533C14.0614 16.1953 13.1925 17 12.1475 17H5.85254L5.6582 16.9902C4.76514 16.9041 4.03607 16.2296 3.88184 15.3457L3.8584 15.1533L3.1543 6H3C2.44772 6 2 5.55228 2 5C2 4.44772 2.44772 4 3 4H5V3C5 1.89543 5.89543 1 7 1H11L11.2041 1.01074ZM5.85254 15H12.1475L12.8398 6H5.16016L5.85254 15ZM7 4H11V3H7V4Z"/>
</svg>`

export class NodeDeleteButton extends HTMLElement {
  connectedCallback() {
    this.editorElement = this.closest("lexxy-editor")
    this.editor = this.editorElement.editor
    this.classList.add("lexxy-floating-controls")
    this.nodeKey = this.getAttribute("nodeKey")

    if (!this.deleteButton) {
      this.#attachDeleteButton()
    }
  }

  disconnectedCallback() {
    if (this.deleteButton && this.handleDeleteClick) {
      this.deleteButton.removeEventListener("click", this.handleDeleteClick)
    }

    this.handleDeleteClick = null
    this.deleteButton = null
    this.editor = null
    this.editorElement = null
  }
  #attachDeleteButton() {
    const container = createElement("div", { className: "lexxy-floating-controls__group" })

    this.deleteButton = createElement("button", {
      className: "lexxy-node-delete",
      type: "button",
      "aria-label": "Remove"
    })
    this.deleteButton.tabIndex = -1
    this.deleteButton.innerHTML = DELETE_ICON

    this.handleDeleteClick = () => this.#deleteNode()
    this.deleteButton.addEventListener("click", this.handleDeleteClick)
    container.appendChild(this.deleteButton)

    this.appendChild(container)
  }

  #deleteNode() {
    this.editor.update(() => {
      const node = $getNearestNodeFromDOMNode(this)
      node?.remove()
    })
  }
}

export default NodeDeleteButton
