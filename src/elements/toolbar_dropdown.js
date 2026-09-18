import { nextFrame } from "../helpers/timing_helper"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"
import { handleRollingTabIndex, isKeyboardActivation } from "../helpers/accessibility_helper"

export class ToolbarDropdown extends HTMLElement {
  #listeners = new ListenerBin()
  #shouldReturnFocusToTrigger = false

  connectedCallback() {
    this.#onHostEditor(() => {
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

  get host() {
    return this.closest("lexxy-toolbar, lexxy-table-tools")
  }

  get editorElement() {
    return this.host?.editorElement
  }

  get editor() {
    return this.host?.editor
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
    this.trigger.ariaExpanded = true
    this.panel.hidden = false
    this.onOpen()
    this.#focusFirstInteractive()
  }

  close({ focusEditor = true } = {}) {
    if (focusEditor) this.editor?.focus()

    if (this.isClosed) return
    this.trigger.ariaExpanded = false
    this.panel.hidden = true
    this.onClose()
  }

  #registerListeners() {
    this.#listeners.track(
      registerEventListener(this, "keydown", this.#handleKeyDown),
      registerEventListener(this.trigger, "click", this.#handleTriggerClick)
    )
  }

  #handleTriggerClick = (event) => {
    if (this.isOpen) {
      this.close({ focusEditor: false })
    } else {
      this.#shouldReturnFocusToTrigger = this.#isOpenedFromHost(event)
      this.host?.closeDropdowns({ except: this })
      this.open()
    }
  }

  #isOpenedFromHost(event) {
    return isKeyboardActivation(event) && this.host?.contains(document.activeElement)
  }

  async #onHostEditor(callback) {
    if (!this.host) return

    await this.host.getEditorElement()
    if (this.isConnected && this.host) callback()
  }

  #handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation()
      this.close({ focusEditor: !this.#shouldReturnFocusToTrigger })
      if (this.#shouldReturnFocusToTrigger) this.trigger?.focus()
    } else if (this.#isNavigatingMenu(event)) {
      event.stopPropagation()
      handleRollingTabIndex(this.#buttons, event, { orientation: "both", wrap: true })
    }
  }

  #isNavigatingMenu(event) {
    return this.panel.role === "menu" && this.panel.contains(event.target)
  }

  async #focusFirstInteractive() {
    // Ask for the ring explicitly: opening the menu with the mouse otherwise leaves the
    // first item focused without a focus ring, since focus() inherits the mouse modality.
    this.#interactiveElements[0]?.focus({ focusVisible: true })
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
