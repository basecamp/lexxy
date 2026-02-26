import { ToolbarDropdown } from "../toolbar_dropdown"

const HEADING_LABELS = {
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
}

export class HeadingDropdown extends ToolbarDropdown {
  connectedCallback() {
    super.connectedCallback()
    this.#registerToggleHandler()
  }

  initialize() {
    this.#populateOptions()
    this.#registerButtonHandlers()
  }

  #registerToggleHandler() {
    this.container.addEventListener("toggle", this.#handleToggle.bind(this))
  }

  #populateOptions() {
    const headings = this.editorElement.config.get("headings") || [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ]
    const container = this.querySelector(".lexxy-heading-options")

    headings.forEach((heading) => {
      const button = document.createElement("button")
      button.type = "button"
      button.classList.add(
        "lexxy-editor__toolbar-button",
        "lexxy-heading-option",
      )
      button.dataset.tag = heading
      button.textContent = HEADING_LABELS[heading] || heading.toUpperCase()
      container.appendChild(button)
    })

    const textButton = document.createElement("button")
    textButton.type = "button"
    textButton.classList.add(
      "lexxy-editor__toolbar-button",
      "lexxy-heading-option",
    )
    textButton.dataset.tag = ""
    textButton.textContent = "Text"
    container.appendChild(textButton)
  }

  #registerButtonHandlers() {
    this.querySelectorAll(".lexxy-heading-option").forEach((button) => {
      button.addEventListener("click", this.#handleOptionClick.bind(this))
    })
  }

  #handleToggle({ newState }) {
    if (newState === "open") {
      this.#updateActiveState()
    }
  }

  #handleOptionClick(event) {
    event.preventDefault()

    const button = event.target.closest(".lexxy-heading-option")
    if (!button) return

    const tag = button.dataset.tag || null
    this.editor.update(() => {
      this.editor.dispatchCommand("setHeading", tag)
    })
    this.close()
  }

  #updateActiveState() {
    this.editor.getEditorState().read(() => {
      const format = this.editorElement.selection.getFormat()
      const currentTag = format.headingTag

      this.querySelectorAll(".lexxy-heading-option").forEach((button) => {
        const isActive = button.dataset.tag === (currentTag || "")
        button.setAttribute("aria-pressed", isActive)
      })
    })
  }
}

export default HeadingDropdown
