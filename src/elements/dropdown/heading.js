import ToolbarIcons from "../toolbar_icons"
import { registerEventListener } from "../../helpers/listener_helper"
import { ListenerBin } from "../../helpers/listener_helper"

const HEADING_BUTTON_SELECTOR = "button.lexxy-heading-button"

const HEADING_LABELS = {
  h1: "Heading 1",
  h2: "Large Heading",
  h3: "Medium Heading",
  h4: "Small Heading",
  h5: "Heading 5",
  h6: "Heading 6"
}

const HEADING_NAMES = {
  h2: "heading-large",
  h3: "heading-medium",
  h4: "heading-small"
}

export class HeadingDropdown extends HTMLElement {
  #listeners = new ListenerBin()

  connectedCallback() {
    this.#onToolbarEditor(() => {
      this.#setUpButtons()
      this.#registerButtonHandlers()
    })
  }

  disconnectedCallback() {
    this.#listeners.dispose()
  }

  updateActiveHeading(tag) {
    this.#headingButtons.forEach(button => {
      const next = (button.dataset.heading === tag).toString()
      if (button.getAttribute("aria-pressed") !== next) {
        button.setAttribute("aria-pressed", next)
      }
    })
  }

  get #toolbar() {
    return this.closest("lexxy-toolbar")
  }

  get #editorElement() {
    return this.#toolbar?.editorElement
  }

  get #editor() {
    return this.#toolbar?.editor
  }

  async #onToolbarEditor(callback) {
    const toolbar = this.#toolbar
    if (!toolbar) return

    await toolbar.getEditorElement()
    if (this.isConnected && this.#toolbar) callback()
  }

  #setUpButtons() {
    this.#configuredHeadings.forEach((tag) => {
      this.#buttonContainer.appendChild(this.#createButton(tag))
    })
  }

  #createButton(tag) {
    const label = HEADING_LABELS[tag] || tag.toUpperCase()
    const name = HEADING_NAMES[tag] || `heading-${tag}`
    const icon = ToolbarIcons[tag] || ""

    const button = document.createElement("button")
    button.type = "button"
    button.dataset.heading = tag
    button.classList.add("lexxy-editor__toolbar-button", "lexxy-heading-button")
    button.name = name
    button.setAttribute("role", "menuitem")
    button.innerHTML = `${icon} <span>${label}</span>`
    return button
  }

  #registerButtonHandlers() {
    this.#headingButtons.forEach(button => {
      this.#listeners.track(registerEventListener(button, "click", this.#handleHeadingClick))
    })
  }

  #handleHeadingClick = (event) => {
    event.preventDefault()

    const button = event.target.closest(HEADING_BUTTON_SELECTOR)
    if (!button) return

    this.#editor.dispatchCommand("applyHeadingFormat", button.dataset.heading)
  }

  get #configuredHeadings() {
    const configured = this.#editorElement.config.get("headings")
    const headings = Array.isArray(configured) ? configured : [ "h2", "h3", "h4" ]
    return headings.filter((heading) => /^h[1-6]$/.test(heading))
  }

  get #buttonContainer() {
    return this.querySelector(".lexxy-heading-options")
  }

  get #headingButtons() {
    return Array.from(this.querySelectorAll(HEADING_BUTTON_SELECTOR))
  }
}

export default HeadingDropdown
