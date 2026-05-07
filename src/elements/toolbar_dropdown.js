import { nextFrame } from "../helpers/timing_helpers"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"

export class ToolbarDropdown extends HTMLElement {
  #listeners = new ListenerBin()

  connectedCallback() {
    this.#onToolbarEditor(() => {
      this.#registerListeners()
      this.editorReady()
    })
  }

  disconnectedCallback() {
    this.#listeners.dispose()
  }

  editorReady() {}
  onOpen() {}
  onClose() {}

  get trigger() {
    return this.querySelector(":scope > [data-dropdown-trigger]")
  }

  get panel() {
    return this.querySelector(":scope > [data-dropdown-panel]")
  }

  get toolbar() {
    return this.closest("lexxy-toolbar")
  }

  get editorElement() {
    return this.toolbar?.editorElement
  }

  get editor() {
    return this.toolbar?.editor
  }

  get isOpen() {
    return this.panel.hidden === false
  }

  get isClosed() {
    return !this.isOpen
  }

  track(...listeners) {
    this.#listeners.track(...listeners)
  }

  open() {
    if (this.isOpen) return
    this.trigger.setAttribute("aria-expanded", "true")
    this.panel.hidden = false
    this.onOpen()
    this.#focusFirstInteractive()
  }

  close({ focusEditor = true } = {}) {
    if (focusEditor) this.editor?.focus()

    if (this.isClosed) return
    this.trigger.setAttribute("aria-expanded", "false")
    this.panel.hidden = true
    this.onClose()
  }

  #registerListeners() {
    this.#listeners.track(
      registerEventListener(this, "keydown", this.#handleKeyDown),
      registerEventListener(this.trigger, "click", this.#handleTriggerClick)
    )
  }

  #handleTriggerClick = () => {
    if (this.isOpen) {
      this.close({ focusEditor: false })
    } else {
      this.toolbar?.closeDropdowns({ except: this })
      this.open()
    }
  }

  async #onToolbarEditor(callback) {
    if (!this.toolbar) return

    await this.toolbar.getEditorElement()
    if (this.isConnected && this.toolbar) callback()
  }

  #handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation()
      this.close()
    }
  }

  async #focusFirstInteractive() {
    this.#interactiveElements[0]?.focus()
    await this.#resetTabIndexValues()
  }

  async #resetTabIndexValues() {
    await nextFrame()
    this.#buttons.forEach((element, index) => {
      element.setAttribute("tabindex", index === 0 ? 0 : "-1")
    })
  }

  get #interactiveElements() {
    return Array.from(this.panel.querySelectorAll("button, input"))
  }

  get #buttons() {
    return Array.from(this.panel.querySelectorAll("button"))
  }
}

export default ToolbarDropdown
