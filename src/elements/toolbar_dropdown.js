import { nextFrame } from "../helpers/timing_helpers"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"
import { dropdownContents } from "./dropdown/registry"

export class ToolbarDropdown extends HTMLElement {
  #listeners = new ListenerBin()
  content = null

  connectedCallback() {
    if (!this.trigger || !this.panel) return

    this.#listeners.track(
      registerEventListener(this, "keydown", this.#handleKeyDown),
      registerEventListener(this.trigger, "click", this.#handleTriggerClick)
    )

    this.#onToolbarEditor(() => this.#connectContent())
  }

  disconnectedCallback() {
    this.#listeners.dispose()
    this.content = null
  }

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
    return this.getAttribute("aria-expanded") === "true"
  }

  track(...listeners) {
    this.#listeners.track(...listeners)
  }

  open() {
    if (!this.trigger || this.isOpen) return
    this.setAttribute("aria-expanded", "true")
    this.panel.hidden = false
    this.content?.onOpen?.()
    this.#focusFirstInteractive()
  }

  close({ focusEditor = true } = {}) {
    if (focusEditor) this.editor?.focus()
    if (!this.trigger || !this.isOpen) return
    this.setAttribute("aria-expanded", "false")
    this.panel.hidden = true
    this.content?.onClose?.()
  }

  #connectContent() {
    const name = this.dataset.content
    const ContentClass = name ? dropdownContents[name] : null
    if (!ContentClass) return

    this.content = new ContentClass(this)
    this.content.connect?.()
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
