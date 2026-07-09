import ToolbarIcons from "../toolbar_icons"
import { ListenerBin, registerEventListener } from "../../helpers/listener_helper"

const HEADING_BUTTON_SELECTOR = "button.lexxy-heading-button"

export const DEFAULT_HEADINGS = [ "h2", "h3", "h4" ]

const HEADING_PRESETS = [
  { label: "Large Heading", name: "heading-large" },
  { label: "Medium Heading", name: "heading-medium" },
  { label: "Small Heading", name: "heading-small" }
]

export function resolveHeadings(config) {
  const configured = config.get("headings")
  return Array.isArray(configured) ? configured : DEFAULT_HEADINGS
}

export class HeadingDropdown extends HTMLElement {
  static labelFor(tag, index) {
    if (index < HEADING_PRESETS.length) return HEADING_PRESETS[index].label

    const level = tag.match(/^h(\d+)$/)?.[1]
    return level ? `Heading ${level}` : tag.toUpperCase()
  }

  static nameFor(tag, index) {
    if (index < HEADING_PRESETS.length) return HEADING_PRESETS[index].name

    const level = tag.match(/^h(\d+)$/)?.[1]
    return level ? `heading-${level}` : `heading-${tag}`
  }

  #listeners = new ListenerBin()

  connectedCallback() {
    this.style.display = "contents"

    this.#onToolbarEditor(() => {
      this.#buttonContainer.style.display = "contents"
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
    this.#buttonContainer.innerHTML = ""

    this.#configuredHeadings.forEach((tag, index) => {
      this.#buttonContainer.appendChild(this.#createButton(tag, index))
    })
  }

  #createButton(tag, index) {
    const label = HeadingDropdown.labelFor(tag, index)
    const name = HeadingDropdown.nameFor(tag, index)
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
      this.#listeners.track(registerEventListener(button, "click", (event) => {
        if (!this.#editor) return

        event.preventDefault()
        this.#editor.dispatchCommand("applyHeadingFormat", button.dataset.heading)
        this.#editor.focus()
      }))
    })
  }

  get #configuredHeadings() {
    return resolveHeadings(this.#editorElement.config)
  }

  get #buttonContainer() {
    return this.querySelector(".lexxy-heading-options")
  }

  get #headingButtons() {
    return Array.from(this.querySelectorAll(HEADING_BUTTON_SELECTOR))
  }
}

export default HeadingDropdown
