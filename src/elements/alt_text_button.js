import { $getNearestNodeFromDOMNode } from "lexical"
import { createElement, generateDomId } from "../helpers/html_helper"

export class AltTextButton extends HTMLElement {
  #valueWhenOpened = ""

  #dismiss = (event) => {
    if (!this.contains(event.target)) this.#closePanel()
  }

  connectedCallback() {
    this.editorElement = this.closest("lexxy-editor")
    this.editor = this.editorElement.editor

    if (!this.querySelector(".lexxy-alt-text")) {
      this.#render()
    }

    this.#syncMissingState()
  }

  disconnectedCallback() {
    document.removeEventListener("pointerdown", this.#dismiss, true)
    this.editor = null
    this.editorElement = null
  }

  #render() {
    this.classList.add("lexxy-floating-controls")
    this.appendChild(this.#createBadge())
    this.appendChild(this.#createPanel())
  }

  #createBadge() {
    const group = createElement("div", { className: "lexxy-floating-controls__group" })

    this.toggle = createElement("button", {
      className: "lexxy-alt-text",
      type: "button",
      "aria-haspopup": "true",
      "aria-expanded": "false",
      textContent: "Alt"
    })
    this.toggle.tabIndex = -1
    this.toggle.addEventListener("click", () => this.#togglePanel())

    group.appendChild(this.toggle)

    return group
  }

  #createPanel() {
    this.panel = createElement("div", { className: "lexxy-alt-text__panel", hidden: true })

    const inputId = generateDomId("lexxy-alt-text-input")
    const label = createElement("label", { className: "lexxy-alt-text__label", textContent: "Alternative text", htmlFor: inputId })

    this.input = createElement("textarea", { id: inputId, rows: "3", placeholder: "Describe this image…" })
    this.input.addEventListener("blur", () => this.#commit())
    this.input.addEventListener("keydown", (event) => this.#handleInputKeydown(event))
    this.input.addEventListener("copy", (event) => event.stopPropagation())
    this.input.addEventListener("cut", (event) => event.stopPropagation())
    this.input.addEventListener("paste", (event) => event.stopPropagation())

    this.panel.append(label, this.input)

    return this.panel
  }

  #togglePanel() {
    if (this.panel.hidden) {
      this.#openPanel()
    } else {
      this.#closePanel()
    }
  }

  #openPanel() {
    this.#valueWhenOpened = this.#nodeAltText
    this.input.value = this.#valueWhenOpened
    this.panel.hidden = false
    this.classList.add("lexxy-alt-text--editing")
    this.toggle.setAttribute("aria-expanded", "true")
    this.input.focus()

    // Light dismiss: close when the next interaction lands outside this element.
    document.addEventListener("pointerdown", this.#dismiss, true)
  }

  #closePanel() {
    if (this.panel.hidden) return

    document.removeEventListener("pointerdown", this.#dismiss, true)
    this.#commit()
    this.panel.hidden = true
    this.classList.remove("lexxy-alt-text--editing")
    this.toggle.setAttribute("aria-expanded", "false")
  }

  #handleInputKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault()
      this.#closePanel()
    } else if (event.key === "Escape") {
      event.preventDefault()
      this.#cancel()
    }

    event.stopPropagation()
  }

  #cancel() {
    this.input.value = this.#valueWhenOpened
    this.#closePanel()
  }

  #commit() {
    const value = this.input.value
    this.editor.update(() => {
      const node = $getNearestNodeFromDOMNode(this)
      if (node && node.altText !== value) node.getWritable().altText = value
    })
    this.#syncMissingState(value)
  }

  #syncMissingState(value = this.#nodeAltText) {
    const missing = value.trim().length === 0
    this.toggle?.classList.toggle("lexxy-alt-text--missing", missing)
    this.toggle?.setAttribute("aria-label", missing ? "Add alt text" : "Edit alt text")
  }

  get #nodeAltText() {
    return this.editor.read(() => {
      const node = $getNearestNodeFromDOMNode(this)
      return node?.altText ?? ""
    })
  }
}

export default AltTextButton
