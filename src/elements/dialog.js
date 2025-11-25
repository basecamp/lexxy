export class ToolbarDialog extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector("dialog")
    this.addEventListener("keydown", this.#handleKeyDown.bind(this))
  }

  disconnectedCallback() {
    this.#removeClickOutsideHandler()
  }

  show(triggerButton) {
    this.triggerButton = triggerButton
    this.#positionDialog()
    this.dialog.show()
    this.#setupClickOutsideHandler()
  }

  close() {
    this.dialog.close()
    this.#removeClickOutsideHandler()
    this.triggerButton = null

    this.editor.focus()
  }

  get toolbar() {
    return this.closest("lexxy-toolbar")
  }

  get editor() {
    return this.toolbar.editor
  }

  #positionDialog() {
    const left = this.triggerButton.offsetLeft
    this.dialog.style.insetInlineStart = `${left}px`
  }

  #setupClickOutsideHandler() {
    if (this.clickOutsideHandler) return

    this.clickOutsideHandler = (event) => {
      if (!this.dialog.open) return

      const target = event.target
      const isClickInsideDialog = this.dialog.contains(target)
      const isClickOnTrigger = this.triggerButton.contains(target)

      if (!isClickInsideDialog && !isClickOnTrigger) {
        this.close()
      }
    }

    document.addEventListener("click", this.clickOutsideHandler, true)
  }

  #removeClickOutsideHandler() {
    if (this.clickOutsideHandler) {
      document.removeEventListener("click", this.clickOutsideHandler, true)
      this.clickOutsideHandler = null
    }
  }

  #handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation()
      this.close()
    }
  }
}

