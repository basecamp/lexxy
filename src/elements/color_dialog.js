export class ColorDialog extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector("dialog")
    //this.addEventListener("click", this.#handleColorButtonClick.bind(this))
    this.addEventListener("keydown", this.#handleKeyDown.bind(this))
    this.querySelector("[data-command='removeHighlight']").addEventListener("click", this.#handleRemoveHighlight.bind(this))

    this.#buildButtons()
  }

  show() {
    this.dialog.show()
  }

  close() {
    this.dialog.close()
  }

  #buildButtons() {
    const buttonGroups = this.querySelectorAll("[data-button-group]")
    if (!buttonGroups) return

    buttonGroups.forEach(buttonGroup => {
      const values = buttonGroup.dataset.values?.split(";") || []
      values.forEach(value => {
        const button = document.createElement("button")
        button.classList.add("lexxy-color-button")
        button.dataset.value = value
        button.dataset.style = buttonGroup.dataset.buttonGroup
        button.style.setProperty(buttonGroup.dataset.buttonGroup, value)
        button.addEventListener("click", this.#handleColorButtonClick.bind(this))
        buttonGroup.appendChild(button)
      })
    })
  }

  #handleRemoveHighlight() {
    this.#editor.dispatchCommand("removeHighlight")
    this.close()
  }

  #handleColorButtonClick(event) {
    event.preventDefault()

    let color = {}

    const button = event.target.closest("button")
    if (!button) return

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

    const attribute = button.dataset.style
    const value = buttonGroup.querySelector("[aria-pressed='true']")?.dataset.value

    color = { [attribute]: value }

    this.#editor.dispatchCommand("highlight", color)
    this.close()
  }

  #handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation()
      this.close()
    }
  }

  get #editor() {
    return this.closest("lexxy-toolbar").editor
  }
}

// We should extend the native dialog and avoid the intermediary <dialog> but not
// supported by Safari yet: customElements.define("lexxy-color-dialog", ColorDialog, { extends: "dialog" })
customElements.define("lexxy-color-dialog", ColorDialog)
