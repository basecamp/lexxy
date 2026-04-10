import { nextFrame } from "../helpers/timing_helpers"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"

export class ToolbarDropdown extends HTMLElement {
  #listeners = new ListenerBin()

  connectedCallback() {
    this.container = this.closest("details")

    this.#listeners.track(
      registerEventListener(this.container, "toggle", this.#handleToggle),
      registerEventListener(this.container, "keydown", this.#handleKeyDown)
    )

    this.#onToolbarEditor(this.initialize.bind(this))
  }

  disconnectedCallback() {
    this.#listeners.dispose()
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

  track(...listeners) {
    this.#listeners.track(...listeners)
  }

  initialize() {
    // Any post-editor initialization
  }

  close() {
    this.editor.focus()
    this.container.open = false
  }

  async #onToolbarEditor(callback) {
    await this.toolbar.editorElement
    callback()
  }

  #handleToggle = () => {
    if (this.container.open) {
      this.#handleOpen()
    }
  }

  async #handleOpen() {
    this.#interactiveElements[0].focus()
    this.#resetTabIndexValues()
  }

  #handleKeyDown = (event) => {
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

export default ToolbarDropdown
