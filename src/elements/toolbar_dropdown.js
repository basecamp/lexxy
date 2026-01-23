import { nextFrame } from "../helpers/timing_helpers"

export class ToolbarDropdown extends HTMLElement {
  connectedCallback() {
    this.container = this.closest("details")

    this.container.addEventListener("toggle", this.#handleToggle.bind(this))
    this.container.addEventListener("keydown", this.#handleKeyDown.bind(this))

    this.#onToolbarEditor(this.initialize.bind(this))
  }

  disconnectedCallback() {
    this.container.removeEventListener("keydown", this.#handleKeyDown.bind(this))
  }

  get toolbar() {
    return this.closest("lexxy-toolbar")
  }

  get editorElement() {
    return this.toolbar.editorElement
  }

  get editor() {
    return this.toolbar.editor
  }

  initialize() {
    // Any post-editor initialization
  }

  close() {
    this.editor.focus()
    this.container.open = false
  }

  async #onToolbarEditor(callback) {
    await this.toolbar.editorConnected
    callback()
  }

  #handleToggle() {
    if (this.container.open) {
      this.#handleOpen()
    }
  }

  async #handleOpen() {
    this.#interactiveElements[0].focus()
    this.#resetTabIndexValues()
  }

  #handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation()
      this.close()
    }
  }

  async #resetTabIndexValues() {
    await nextFrame()
    this.#buttons.forEach((element, index) => {
      element.setAttribute("tabindex", index === 0 ? 0 : "-1")
    })
  }

  get #interactiveElements() {
    return Array.from(this.querySelectorAll("button, input"))
  }

  get #buttons() {
    return Array.from(this.querySelectorAll("button"))
  }
}

