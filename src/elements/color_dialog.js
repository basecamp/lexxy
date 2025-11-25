import { $getSelectionStyleValueForProperty } from "@lexical/selection"
import { ToolbarDialog } from "./dialog"

const APPLY_HIGHLIGHT_SELECTOR = "button.lexxy-color-button"
const REMOVE_HIGHLIGHT_SELECTOR = "[data-command='removeHighlight']"

export class ColorDialog extends ToolbarDialog {
  connectedCallback() {
    super.connectedCallback()

    this.#setUpButtons()
    this.#registerHandlers()
  }

  #registerHandlers() {
    this.querySelector(REMOVE_HIGHLIGHT_SELECTOR).addEventListener("click", this.#handleRemoveHighlightClick.bind(this))
    this.#colorButtons.forEach(button => button.addEventListener("click", this.#handleColorButtonClick.bind(this)))

    this.toolbar?.registerUpdateButtonStatesCallback(this.#updateColorButtonStates.bind(this))
  }

  #setUpButtons() {
    this.#buttonGroups.forEach(buttonGroup => {
      this.#populateButtonGroup(buttonGroup)
    })
  }

  #populateButtonGroup(buttonGroup) {
    const values = buttonGroup.dataset.values?.split("; ") || []
    const attribute = buttonGroup.dataset.buttonGroup
    values.forEach((value, index) => {
      buttonGroup.appendChild(this.#createButton(attribute, value, index))
    })
  }

  #createButton(attribute, value, index) {
    const button = document.createElement("button")
    button.dataset.style = attribute
    button.style.setProperty(attribute, value)
    button.dataset.value = value
    button.classList.add("lexxy-color-button")
    button.name = attribute + "-" + index
    return button
  }

  #handleColorButtonClick(event) {
    event.preventDefault()

    const button = event.target.closest(APPLY_HIGHLIGHT_SELECTOR)
    if (!button) return

    const attribute = button.dataset.style
    const value = button.dataset.value

    this.editor?.dispatchCommand("toggleHighlight", { [attribute]: value })
    this.close()
  }

  #handleRemoveHighlightClick(event) {
    event.preventDefault()

    this.editor?.dispatchCommand("removeHighlight")
    this.close()
  }

  #updateColorButtonStates(selection) {
    // Use null default, so "" indicates mixed highlighting
    const textColor = $getSelectionStyleValueForProperty(selection, "color", null)
    const backgroundColor = $getSelectionStyleValueForProperty(selection, "background-color", null)

    this.#colorButtons.forEach(button => {
      const matchesSelection = button.dataset.value === textColor || button.dataset.value === backgroundColor
      button.setAttribute("aria-pressed", matchesSelection)
    })

    const hasHighlight = textColor !== null || backgroundColor !== null
    this.querySelector(REMOVE_HIGHLIGHT_SELECTOR).disabled = !hasHighlight
  }

  get #buttonGroups() {
    return this.querySelectorAll("[data-button-group]")
  }

  get #colorButtons() {
    return Array.from(this.querySelectorAll(APPLY_HIGHLIGHT_SELECTOR))
  }
}

// We should extend the native dialog and avoid the intermediary <dialog> but not
// supported by Safari yet: customElements.define("lexxy-color-dialog", ColorDialog, { extends: "dialog" })
customElements.define("lexxy-color-dialog", ColorDialog)
