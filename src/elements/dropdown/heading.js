import { $getSelection, $isRangeSelection } from "lexical"
import { $isHeadingNode } from "@lexical/rich-text"
import { ToolbarDropdown } from "../toolbar_dropdown"

export class HeadingDropdown extends ToolbarDropdown {
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
    this.#headingButtons.forEach(button => button.addEventListener("click", this.#handleHeadingClick.bind(this)))
    this.querySelector(".lexxy-heading-remove")?.addEventListener("click", this.#handleRemoveHeadingClick.bind(this))
  }

  #setUpButtons() {
    const headings = this.#configuredHeadings

    headings.forEach((tag) => {
      this.#buttonContainer.appendChild(this.#createButton(tag))
    })
  }

  #createButton(tag) {
    const button = document.createElement("button")
    button.dataset.heading = tag
    button.classList.add("lexxy-editor__toolbar-button", "lexxy-heading-button")
    button.name = tag
    button.textContent = tag.toUpperCase()
    button.type = "button"
    return button
  }

  #handleToggle({ newState }) {
    if (newState === "open") {
      this.editor.getEditorState().read(() => {
        this.#updateHeadingButtonStates($getSelection())
      })
    }
  }

  #handleHeadingClick(event) {
    event.preventDefault()

    const button = event.target.closest(".lexxy-heading-button")
    if (!button) return

    const tag = button.dataset.heading
    this.editor.dispatchCommand("applyHeadingFormat", tag)
    this.close()
  }

  #handleRemoveHeadingClick(event) {
    event.preventDefault()

    this.editor.dispatchCommand("applyHeadingFormat", null)
    this.close()
  }

  #updateHeadingButtonStates(selection) {
    if (!$isRangeSelection(selection)) return

    const anchorNode = selection.anchor.getNode()
    const topLevelElement = anchorNode.getTopLevelElementOrThrow()
    const currentTag = $isHeadingNode(topLevelElement) ? topLevelElement.getTag() : null

    this.#headingButtons.forEach(button => {
      button.setAttribute("aria-pressed", button.dataset.heading === currentTag)
    })

    const removeButton = this.querySelector(".lexxy-heading-remove")
    if (removeButton) {
      removeButton.disabled = currentTag === null
    }
  }

  get #configuredHeadings() {
    const configured = this.editorElement.config.get("headings")
    const headings = Array.isArray(configured) ? configured : [ "h2", "h3", "h4" ]
    return headings.filter((heading) => /^h[1-6]$/.test(heading))
  }

  get #buttonContainer() {
    return this.querySelector(".lexxy-heading-options")
  }

  get #headingButtons() {
    return Array.from(this.querySelectorAll(".lexxy-heading-button"))
  }
}

export default HeadingDropdown
