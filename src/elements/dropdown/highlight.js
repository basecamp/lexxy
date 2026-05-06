import { $getSelection, $isRangeSelection } from "lexical"
import { $getSelectionStyleValueForProperty } from "@lexical/selection"
import { ToolbarDropdown } from "../toolbar_dropdown"
import { registerEventListener } from "../../helpers/listener_helper"
import { createElement } from "../../helpers/html_helper"

const APPLY_HIGHLIGHT_SELECTOR = "button.lexxy-highlight-button"
const REMOVE_HIGHLIGHT_SELECTOR = "[data-command='removeHighlight']"

// Use Symbol instead of null since $getSelectionStyleValueForProperty
// responds differently for backward selections if null is the default
// see https://github.com/facebook/lexical/issues/8013
const NO_STYLE = Symbol("no_style")

export class HighlightDropdown extends ToolbarDropdown {
  editorReady() {
    this.#setUpButtons()
    this.#registerButtonHandlers()
  }

  onOpen() {
    this.editor.getEditorState().read(() => {
      this.#updateColorButtonStates($getSelection())
    })
  }

  #registerButtonHandlers() {
    this.#colorButtons.forEach(button => {
      this.track(registerEventListener(button, "click", this.#handleColorButtonClick))
    })
  }

  #setUpButtons() {
    this.#buttonContainer.innerHTML = ""

    const colorGroups = this.editorElement.config.get("highlight.buttons")

    this.#populateButtonGroup("color", colorGroups.color)
    this.#populateButtonGroup("background-color", colorGroups["background-color"])

    const maxNumberOfColors = Math.max(colorGroups.color.length, colorGroups["background-color"].length)
    this.panel.style.setProperty("--max-colors", maxNumberOfColors)
  }

  #populateButtonGroup(attribute, values) {
    values.forEach((value, index) => {
      this.#buttonContainer.appendChild(this.#createButton(attribute, value, index))
    })
  }

  #createButton(attribute, value, index) {
    return createElement("button", {
      type: "button",
      dataset: { value, style: attribute },
      style: `${attribute}: ${value}`,
      class: "lexxy-editor__toolbar-button lexxy-highlight-button",
      name: `${attribute}-${index}`,
      role: "menuitem"
    })
  }

  #handleColorButtonClick = (event) => {
    event.preventDefault()

    const button = event.target.closest(APPLY_HIGHLIGHT_SELECTOR)
    if (!button) return

    const { style, value } = button.dataset

    this.editor.dispatchCommand("toggleHighlight", { [style]: value })
    this.close()
  }

  #updateColorButtonStates(selection) {
    if (!$isRangeSelection(selection)) { return }

    // Use non-"" default, so "" indicates mixed highlighting
    const textColor = $getSelectionStyleValueForProperty(selection, "color", NO_STYLE)
    const backgroundColor = $getSelectionStyleValueForProperty(selection, "background-color", NO_STYLE)

    this.#colorButtons.forEach(button => {
      const matchesSelection = button.dataset.value === textColor || button.dataset.value === backgroundColor
      const next = matchesSelection.toString()
      if (button.getAttribute("aria-pressed") !== next) {
        button.setAttribute("aria-pressed", next)
      }
    })

    const hasHighlight = textColor !== NO_STYLE || backgroundColor !== NO_STYLE
    this.panel.querySelector(REMOVE_HIGHLIGHT_SELECTOR).disabled = !hasHighlight
  }

  get #buttonContainer() {
    return this.panel.querySelector(".lexxy-highlight-colors")
  }

  get #colorButtons() {
    return Array.from(this.panel.querySelectorAll(APPLY_HIGHLIGHT_SELECTOR))
  }
}

export default HighlightDropdown
