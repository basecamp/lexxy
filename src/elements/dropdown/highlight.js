import { $getSelection, $isRangeSelection } from "lexical"
import { $getSelectionStyleValueForProperty } from "@lexical/selection"
import { ToolbarDropdown } from "../toolbar_dropdown"

const APPLY_HIGHLIGHT_SELECTOR = "button.lexxy-highlight-button"
const REMOVE_HIGHLIGHT_SELECTOR = "[data-command='removeHighlight']"

// Use Symbol instead of null since $getSelectionStyleValueForProperty
// responds differently for backward selections if null is the default
// see https://github.com/facebook/lexical/issues/8013
const NO_STYLE = Symbol("no_style")

export class HighlightDropdown extends ToolbarDropdown {
  connectedCallback() {
    super.connectedCallback()
    this.#registerToggleHandler()
  }

  initialize() {
    this.#setUpButtons()
    this.#registerButtonHandlers()
  }

  #registerToggleHandler() {
    this.container.addEventListener("toggle", this.#handleToggle.bind(this))
  }

  #registerButtonHandlers() {
    this.#colorButtons.forEach(button => button.addEventListener("click", this.#handleColorButtonClick.bind(this)))
    this.querySelector(REMOVE_HIGHLIGHT_SELECTOR).addEventListener("click", this.#handleRemoveHighlightClick.bind(this))
  }

  #setUpButtons() {
    const colorGroups = this.editorElement.config.get("highlight.buttons")

    this.#populateButtonGroup("color", colorGroups.color)
    this.#populateButtonGroup("background-color", colorGroups["background-color"])

    const maxNumberOfColors = Math.max(colorGroups.color.length, colorGroups["background-color"].length)
    this.style.setProperty("--max-colors", maxNumberOfColors)
  }

  #populateButtonGroup(attribute, values) {
    values.forEach((value, index) => {
      this.#buttonContainer.appendChild(this.#createButton(attribute, value, index))
    })
  }

  #createButton(attribute, value, index) {
    const button = document.createElement("button")
    button.dataset.style = attribute
    button.style.setProperty(attribute, value)
    button.dataset.value = value
    button.classList.add("lexxy-editor__toolbar-button", "lexxy-highlight-button")
    button.name = attribute + "-" + index
    return button
  }

  #handleToggle({ newState }) {
    if (newState === "open") {
      this.editor.getEditorState().read(() => {
        this.#updateColorButtonStates($getSelection())
      })
    }
  }

  #handleColorButtonClick(event) {
    event.preventDefault()

    const button = event.target.closest(APPLY_HIGHLIGHT_SELECTOR)
    if (!button) return

    const attribute = button.dataset.style
    const value = button.dataset.value

    this.editor.dispatchCommand("toggleHighlight", { [attribute]: value })
    this.close()
  }

  #handleRemoveHighlightClick(event) {
    event.preventDefault()

    this.editor.dispatchCommand("removeHighlight")
    this.close()
  }

  #updateColorButtonStates(selection) {
    if (!$isRangeSelection(selection)) { return }

    // Use non-"" default, so "" indicates mixed highlighting
    const textColor = $getSelectionStyleValueForProperty(selection, "color", NO_STYLE)
    const backgroundColor = $getSelectionStyleValueForProperty(selection, "background-color", NO_STYLE)

    this.#colorButtons.forEach(button => {
      const matchesSelection = button.dataset.value === textColor || button.dataset.value === backgroundColor
      button.setAttribute("aria-pressed", matchesSelection)
    })

    const hasHighlight = textColor !== NO_STYLE || backgroundColor !== NO_STYLE
    this.querySelector(REMOVE_HIGHLIGHT_SELECTOR).disabled = !hasHighlight
  }

  get #buttonContainer() {
    return this.querySelector(".lexxy-highlight-colors")
  }

  get #colorButtons() {
    return Array.from(this.querySelectorAll(APPLY_HIGHLIGHT_SELECTOR))
  }
}

export default HighlightDropdown
