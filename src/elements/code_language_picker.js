import { CODE_LANGUAGE_FRIENDLY_NAME_MAP, CodeNode, normalizeCodeLang } from "@lexical/code"
import { createElement, dispatch } from "../helpers/html_helper"
import { getNonce } from "../helpers/csp_helper"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"

export class CodeLanguagePicker extends HTMLElement {
  #abortController = null
  #listeners = new ListenerBin()

  connectedCallback() {
    this.editorElement = this.closest("lexxy-editor")
    this.editor = this.editorElement.editor
    this.classList.add("lexxy-floating-controls")
    this.#abortController = new AbortController()
    this.#listeners.track(() => this.#abortController?.abort())

    this.#attachLanguagePicker()
    this.#hide()
    this.#monitorForCodeBlockSelection()
  }

  disconnectedCallback() {
    this.dispose()
  }

  dispose() {
    this.#listeners.dispose()
  }

  #attachLanguagePicker() {
    this.languagePickerElement = this.#findLanguagePicker() ?? this.#createLanguagePicker()

    const signal = this.#abortController.signal

    this.#listeners.track(registerEventListener(this.languagePickerElement, "change", () => {
      this.#updateCodeBlockLanguage(this.languagePickerElement.value)
    }, { signal }))

    this.#listeners.track(registerEventListener(this.languagePickerElement, "mousedown", (event) => {
      this.#dispatchOpenEvent(event)
    }, { signal }))

    this.languagePickerElement.setAttribute("nonce", getNonce())
    this.appendChild(this.languagePickerElement)
  }

  #findLanguagePicker() {
    return this.querySelector("select")
  }

  #createLanguagePicker() {
    const selectElement = createElement("select", { className: "lexxy-code-language-picker", "aria-label": "Pick a language…", name: "lexxy-code-language" })

    for (const [ value, label ] of Object.entries(this.#languages)) {
      const option = document.createElement("option")
      option.value = value
      option.textContent = label
      selectElement.appendChild(option)
    }

    return selectElement
  }

  get #languages() {
    const languages = { ...CODE_LANGUAGE_FRIENDLY_NAME_MAP }

    languages.ruby ||= "Ruby"
    languages.php ||= "PHP"
    languages.go ||= "Go"
    languages.bash ||= "Bash"
    languages.json ||= "JSON"
    languages.diff ||= "Diff"

    // Place the "plain" entry first, then the rest of language sorted alphabetically
    delete languages.plain
    const sortedEntries = Object.entries(languages)
      .sort((a, b) => a[1].localeCompare(b[1]))
    return { plain: "Plain text", ...Object.fromEntries(sortedEntries) }
  }

  #dispatchOpenEvent(event) {
    const handled = !dispatch(this.editorElement, "lexxy:code-language-picker-open", {
      languages: this.#bridgeLanguages,
      currentLanguage: this.languagePickerElement.value
    }, true)

    if (handled) {
      event.preventDefault()
    }
  }

  get #bridgeLanguages() {
    return Object.entries(this.#languages).map(([ key, name ]) => ({ key, name }))
  }

  #updateCodeBlockLanguage(language) {
    this.editor.update(() => {
      const codeNode = this.#getCurrentCodeNode()

      if (codeNode) {
        codeNode.setLanguage(language)
      }
    })
  }

  #monitorForCodeBlockSelection() {
    this.#listeners.track(this.editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const codeNode = this.#getCurrentCodeNode()

        if (codeNode) {
          this.#codeNodeWasSelected(codeNode)
        } else {
          this.#hide()
        }
      })
    }))
  }

  #getCurrentCodeNode() {
    return this.editorElement.selection.nearestNodeOfType(CodeNode)
  }

  #codeNodeWasSelected(codeNode) {
    const language = codeNode.getLanguage()

    this.#updateLanguagePickerWith(language)
    this.#show()
    this.#positionLanguagePicker(codeNode)
  }

  #updateLanguagePickerWith(language) {
    if (this.languagePickerElement && language) {
      const normalizedLanguage = normalizeCodeLang(language)
      this.languagePickerElement.value = normalizedLanguage
    }
  }

  #positionLanguagePicker(codeNode) {
    const codeElement = this.editor.getElementByKey(codeNode.getKey())
    if (!codeElement) return

    const codeRect = codeElement.getBoundingClientRect()
    const editorRect = this.editorElement.getBoundingClientRect()
    const relativeTop = codeRect.top - editorRect.top
    const relativeRight = editorRect.right - codeRect.right

    this.style.top = `${relativeTop}px`
    this.style.right = `${relativeRight}px`
  }

  #show() {
    this.hidden = false
  }

  #hide() {
    this.hidden = true
  }
}

export default CodeLanguagePicker
