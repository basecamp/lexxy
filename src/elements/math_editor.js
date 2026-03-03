import { createElement } from "../helpers/html_helper"
import { renderMath } from "../helpers/math_helper"

export default class MathEditor extends HTMLElement {
  #callback = null
  #displayMode = false
  #handleOutsideClick = null

  connectedCallback() {
    if (!this.#input) this.#buildUI()
    this.hidden = true
  }

  disconnectedCallback() {
    this.hide()
  }

  show(latex, targetElement, { displayMode = false, callback }) {
    this.#callback = callback
    this.#displayMode = displayMode
    this.hidden = false

    this.#input.value = latex || ""
    this.#renderPreview()
    this.#positionNear(targetElement)

    requestAnimationFrame(() => this.#input.focus())

    if (this.#handleOutsideClick) {
      document.removeEventListener("mousedown", this.#handleOutsideClick, true)
    }
    this.#handleOutsideClick = (event) => {
      if (!this.contains(event.target)) {
        this.#confirm()
      }
    }
    document.addEventListener("mousedown", this.#handleOutsideClick, true)
  }

  hide() {
    this.hidden = true
    document.removeEventListener("mousedown", this.#handleOutsideClick, true)
    this.#handleOutsideClick = null
  }

  get #input() {
    return this.querySelector(".lexxy-math-editor__input")
  }

  get #preview() {
    return this.querySelector(".lexxy-math-editor__preview")
  }

  #buildUI() {
    const input = createElement("textarea", {
      className: "lexxy-math-editor__input",
      placeholder: "Type LaTeX...",
      rows: 2
    })
    input.addEventListener("input", () => this.#renderPreview())
    input.addEventListener("keydown", (event) => this.#handleKeydown(event))

    const preview = createElement("div", { className: "lexxy-math-editor__preview" })

    this.appendChild(input)
    this.appendChild(preview)
  }

  #renderPreview() {
    const latex = this.#input.value.trim()
    if (latex) {
      this.#preview.innerHTML = renderMath(latex, { displayMode: this.#displayMode })
    } else {
      this.#preview.textContent = ""
    }
  }

  #handleKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      this.#confirm()
    } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      event.stopPropagation()
      this.#confirm()
    }
  }

  #confirm() {
    const latex = this.#input.value.trim()
    this.hide()
    if (this.#callback) {
      this.#callback(latex)
      this.#callback = null
    }
  }

  #positionNear(targetElement) {
    if (!targetElement) return

    const rect = targetElement.getBoundingClientRect()
    const editorRect = this.closest("lexxy-editor")?.getBoundingClientRect()

    if (editorRect) {
      this.style.top = `${rect.bottom - editorRect.top + 4}px`
      this.style.left = `${rect.left - editorRect.left}px`
    }
  }
}
