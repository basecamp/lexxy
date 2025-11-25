export class ToolbarDialog extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector("dialog")
    if ("closedBy" in this.dialog.constructor.prototype) {
      this.dialog.closedBy = "any"
    }
    this.#registerHandlers()
  }

  disconnectedCallback() {
    this.#removeClickOutsideHandler()
  }

  updateStateCallback() { }

  show(triggerButton) {
    if (this.preventImmediateReopen) { return }

    this.triggerButton = triggerButton
    this.#positionDialog()
    this.dialog.show()

    this.#setupClickOutsideHandler()
  }

  close() {
    this.dialog.close()
  }

  get toolbar() {
    return this.closest("lexxy-toolbar")
  }

  get editor() {
    return this.toolbar.editor
  }

  get open() { return this.dialog.open }

  #registerHandlers() {
    this.#setupKeydownHandler()
    this.dialog.addEventListener("cancel", this.#handleCancel.bind(this))
    this.dialog.addEventListener("close", this.#handleClose.bind(this))
  }

  #handleClose() {
    this.#removeClickOutsideHandler()
    this.triggerButton = null
    this.editor.focus()
  }

  #handleCancel() {
    this.preventImmediateReopen = true
    requestAnimationFrame(() => this.preventImmediateReopen = undefined)
  }

  #positionDialog() {
    const left = this.triggerButton.offsetLeft
    this.dialog.style.insetInlineStart = `${left}px`
  }

  #setupClickOutsideHandler() {
    if (this.#browserHandlesClose || this.clickOutsideHandler) return

    this.clickOutsideHandler = this.#handleClickOutside.bind(this)
    document.addEventListener("click", this.clickOutsideHandler, true)
  }

  #removeClickOutsideHandler() {
    if (!this.clickOutsideHandler) return

    document.removeEventListener("click", this.clickOutsideHandler, true)
    this.clickOutsideHandler = null
  }

  #handleClickOutside({ target }) {
    if (!this.dialog.open) return

    const isClickInsideDialog = this.dialog.contains(target)
    const isClickOnTrigger = this.triggerButton.contains(target)

    if (!isClickInsideDialog && !isClickOnTrigger) {
      this.close()
    }
  }

  #setupKeydownHandler() {
    if (!this.#browserHandlesClose) { this.addEventListener("keydown", this.#handleKeyDown.bind(this)) }
  }

  get #browserHandlesClose() {
    return this.dialog.closedBy === "any"
  }

  #handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation()
      this.close()
    }
  }
}

