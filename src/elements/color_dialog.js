const REMOVE_HIGHLIGHT_SELECTOR = "[data-command='removeHighlight']"

export class ColorDialog extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector("dialog")
    this.#registerHandlers()

    this.#setUpButtons()
  }

  show() {
    this.dialog.show()
  }

  close() {
    this.dialog.close()
  }

  #registerHandlers() {
    this.addEventListener("keydown", this.#handleKeyDown.bind(this))
    this.querySelector(REMOVE_HIGHLIGHT_SELECTOR).addEventListener("click", this.#handleRemoveHighlight.bind(this))
  }

  #handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation()
      this.close()
    }
  }

  #setUpButtons() {
    this.#buttonGroups.forEach(buttonGroup => {
      this.#populateButtonGroup(buttonGroup)
    })
  }

  #populateButtonGroup(buttonGroup) {
    const values = buttonGroup.dataset.values?.split(";") || []
    const attribute = buttonGroup.dataset.buttonGroup
    values.forEach((value, index) => {
      buttonGroup.appendChild(this.#button(attribute, value, index))
    })
  }

  #button(attribute, value, index) {
    const button = document.createElement("button")
    button.dataset.style = attribute
    button.style.setProperty(attribute, value)
    button.dataset.value = value
    button.classList.add("lexxy-color-button")
    button.name = attribute + "-" + index
    button.addEventListener("click", this.#handleColorButtonClick.bind(this))
    return button
  }

  #handleColorButtonClick(event) {
    event.preventDefault()

    const button = event.target.closest("button")
    if (!button) return

    this.#toggleButtonState(button)

    const attribute = button.dataset.style
    const value = button.closest("[data-button-group]")?.querySelector("[aria-pressed='true']")?.dataset.value || ""

    this.#editor.dispatchCommand("highlight", { [attribute]: value })
    this.close()
  }

  #toggleButtonState(button) {
    const buttonGroup = button.closest("[data-button-group]")
    if (!buttonGroup) return

    if (button.getAttribute("aria-pressed") !== "true") {
      buttonGroup.querySelectorAll("[aria-pressed]").forEach(button => {
        button.setAttribute("aria-pressed", "false")
      })

      button.setAttribute("aria-pressed", "true")
    } else {
      button.setAttribute("aria-pressed", "false")
    }
  }

  #handleRemoveHighlight(event) {
    event.preventDefault()

    this.#editor.dispatchCommand("removeHighlight")
    this.close()
  }

  get #buttonGroups() {
    return this.querySelectorAll("[data-button-group]")
  }

  get #editor() {
    return this.closest("lexxy-toolbar").editor
  }
}

// We should extend the native dialog and avoid the intermediary <dialog> but not
// supported by Safari yet: customElements.define("lexxy-color-dialog", ColorDialog, { extends: "dialog" })
customElements.define("lexxy-color-dialog", ColorDialog)
