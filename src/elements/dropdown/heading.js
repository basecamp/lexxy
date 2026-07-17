import ToolbarIcons from "../toolbar_icons"
import { ListenerBin, registerEventListener } from "../../helpers/listener_helper"

const HEADING_BUTTON_SELECTOR = "button.lexxy-heading-button"

const HEADING_PRESETS = [
  { label: "Large Heading", name: "heading-large", command: "setFormatHeadingLarge" },
  { label: "Medium Heading", name: "heading-medium", command: "setFormatHeadingMedium" },
  { label: "Small Heading", name: "heading-small", command: "setFormatHeadingSmall" }
]

export class HeadingDropdown extends HTMLElement {
  static labelFor(tag, index) {
    if (index < HEADING_PRESETS.length) {
      return HEADING_PRESETS[index].label
    } else {
      const level = tag.match(/^h(\d+)$/)?.[1]
      if (level) {
        return `Heading ${level}`
      } else {
        return tag.toUpperCase()
      }
    }
  }

  static nameFor(tag, index) {
    if (index < HEADING_PRESETS.length) {
      return HEADING_PRESETS[index].name
    } else {
      const level = tag.match(/^h(\d+)$/)?.[1]
      if (level) {
        return `heading-${level}`
      } else {
        return `heading-${tag}`
      }
    }
  }

  // The first heading options keep their original, dedicated commands, which the
  // native apps invoke by name. Extra options use the generic tag-based command.
  static commandFor(index) {
    if (index < HEADING_PRESETS.length) {
      return HEADING_PRESETS[index].command
    } else {
      return "applyHeadingFormat"
    }
  }

  #listeners = new ListenerBin()

  connectedCallback() {
    this.style.display = "contents"

    this.#onToolbarEditor(() => {
      this.#buttonContainer.style.display = "contents"
      this.#setUpButtons()
      this.#registerButtonHandlers()
      this.#syncActiveHeading()
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
    button.dataset.command = HeadingDropdown.commandFor(index)
    button.classList.add("lexxy-heading-button")
    button.name = name
    button.title = label
    button.setAttribute("role", "menuitem")
    button.innerHTML = `${icon} <span>${label}</span>`
    return button
  }

  #registerButtonHandlers() {
    this.#headingButtons.forEach(button => {
      this.#listeners.track(registerEventListener(button, "click", (event) => {
        if (!this.#editor) return

        event.preventDefault()
        this.#editor.dispatchCommand(button.dataset.command, button.dataset.heading)
        this.#editor.focus()
      }))
    })
  }

  #syncActiveHeading() {
    const { headingTag } = this.#editor.read(() => this.#editorElement.selection.getFormat())
    this.updateActiveHeading(headingTag ?? null)
  }

  get #configuredHeadings() {
    return this.#editorElement.config.get("headings")
  }

  get #buttonContainer() {
    return this.querySelector(".lexxy-heading-options")
  }

  get #headingButtons() {
    return Array.from(this.querySelectorAll(HEADING_BUTTON_SELECTOR))
  }
}

export default HeadingDropdown
