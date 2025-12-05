import { nextFrame } from "../helpers/timing_helpers"

export class ToolbarDropdown extends HTMLElement {
  connectedCallback() {
    this.container = this.closest("details")

    this.container.addEventListener("toggle", this.#handleToggle.bind(this))
    this.container.addEventListener("keydown", this.#handleKeyDown.bind(this))

    this.#setTabIndexValues()
  }

  disconnectedCallback() {
    this.#removeClickOutsideHandler()
    this.container.removeEventListener("keydown", this.#handleKeyDown.bind(this))
  }

  get toolbar() {
    return this.closest("lexxy-toolbar")
  }

  get editor() {
    return this.toolbar.editor
  }

  close() {
    this.container.removeAttribute("open")
  }

  #handleToggle(event) {
    if (this.container.open) {
      this.#handleOpen(event.target)
    } else {
      this.#handleClose()
    }
  }

  #handleOpen(trigger) {
    this.trigger = trigger
    this.#interactiveElements[0].focus()
    this.#setupClickOutsideHandler()
  }

  #handleClose() {
    this.trigger = null
    this.#removeClickOutsideHandler()
    this.editor.focus()
  }

  #setupClickOutsideHandler() {
    if (this.clickOutsideHandler) return

    this.clickOutsideHandler = this.#handleClickOutside.bind(this)
    document.addEventListener("click", this.clickOutsideHandler, true)
  }

  #removeClickOutsideHandler() {
    if (!this.clickOutsideHandler) return

    document.removeEventListener("click", this.clickOutsideHandler, true)
    this.clickOutsideHandler = null
  }

  #handleClickOutside({ target }) {
    if (this.container.open && !this.container.contains(target)) this.close()
  }

  #handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation()
      this.close()
    }
  }

  async #setTabIndexValues() {
    await nextFrame()
    this.#interactiveElements.forEach((element) => {
      element.setAttribute("tabindex", 0)
    })
  }

  get #interactiveElements() {
    return Array.from(this.querySelectorAll("button, input"))
  }
}

