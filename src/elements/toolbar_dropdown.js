import { nextFrame } from "../helpers/timing_helpers"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"

export class ToolbarDropdown extends HTMLElement {
  #listeners = new ListenerBin()

  connectedCallback() {
    this.#onToolbarEditor(this.initialize.bind(this))

    this.container = this.closest(".lexxy-editor__toolbar-dropdown")
    this.trigger = this.container?.querySelector("button")

    if (!this.container || !this.trigger) return

    this.#listeners.track(
      registerEventListener(this.container, "lexxy:toolbar-dropdown-toggle", this.#handleToggle),
      registerEventListener(this.container, "keydown", this.#handleKeyDown),
      registerEventListener(this.trigger, "click", this.#handleTriggerClick)
    )
  }

  disconnectedCallback() {
    this.#listeners.dispose()
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
    return this.trigger?.getAttribute("aria-expanded") === "true"
  }

  track(...listeners) {
    this.#listeners.track(...listeners)
  }

  initialize() {
    // Any post-editor initialization
  }

  open() {
    if (!this.trigger || this.isOpen) return
    this.trigger.setAttribute("aria-expanded", "true")
    this.hidden = false
    this.#dispatchToggle("open")
  }

  close({ focusEditor = true } = {}) {
    if (focusEditor) this.editor?.focus()
    if (!this.trigger || !this.isOpen) return
    this.trigger.setAttribute("aria-expanded", "false")
    this.hidden = true
    this.#dispatchToggle("closed")
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
    const toolbar = this.toolbar
    if (!toolbar) return

    await toolbar.getEditorElement()
    if (this.isConnected && this.toolbar === toolbar) callback()
  }

  #handleToggle = (event) => {
    if (event.detail?.newState === "open") {
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

  #dispatchToggle(newState) {
    this.container.dispatchEvent(new CustomEvent("lexxy:toolbar-dropdown-toggle", {
      bubbles: true,
      detail: { newState }
    }))
  }

  get #interactiveElements() {
    return Array.from(this.querySelectorAll("button, input"))
  }

  get #buttons() {
    return Array.from(this.querySelectorAll("button"))
  }
}

export default ToolbarDropdown
