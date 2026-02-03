import { $isCodeNode, CODE_LANGUAGE_FRIENDLY_NAME_MAP, normalizeCodeLang } from "@lexical/code"
import { $getSelection, $isRangeSelection } from "lexical"
import { createElement } from "../helpers/html_helper"
import { getNonce } from "../helpers/csp_helper"

export class CodeLanguagePicker extends HTMLElement {
  connectedCallback() {
    this.editorElement = this.closest("lexxy-editor")
    this.editor = this.editorElement.editor

    this.#attachLanguagePicker()
    this.#monitorForCodeBlockSelection()

    this.#hideLanguagePicker()
  }

  disconnectedCallback() {
    this.unregisterUpdateListener?.()
    this.unregisterUpdateListener = null
  }

  #attachLanguagePicker() {
    this.languagePickerElement = this.#createLanguagePicker()

    this.languagePickerElement.addEventListener("change", () => {
      this.#updateCodeBlockLanguage(this.languagePickerElement.value)
    })

    this.languagePickerElement.setAttribute("nonce", getNonce())
    this.appendChild(this.languagePickerElement)
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

    if (!languages.ruby) languages.ruby = "Ruby"
    if (!languages.php) languages.php = "PHP"
    if (!languages.go) languages.go = "Go"
    if (!languages.bash) languages.bash = "Bash"
    if (!languages.json) languages.json = "JSON"
    if (!languages.diff) languages.diff = "Diff"

    const sortedEntries = Object.entries(languages)
      .sort(([ , a ], [ , b ]) => a.localeCompare(b))

    // Place the "plain" entry first, then the rest of language sorted alphabetically
    const plainIndex = sortedEntries.findIndex(([ key ]) => key === "plain")
    const plainEntry = sortedEntries.splice(plainIndex, 1)[0]
    return Object.fromEntries([ plainEntry, ...sortedEntries ])
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
    this.unregisterUpdateListener = this.editor.registerUpdateListener(() => {
      this.editor.getEditorState().read(() => {
        const codeNode = this.#getCurrentCodeNode()

        if (codeNode) {
          this.#codeNodeWasSelected(codeNode)
        } else {
          this.#hideLanguagePicker()
        }
      })
    })
  }

  #getCurrentCodeNode() {
    const selection = $getSelection()

    if (!$isRangeSelection(selection)) {
      return null
    }

    const anchorNode = selection.anchor.getNode()
    const parentNode = anchorNode.getParent()

    if ($isCodeNode(anchorNode)) {
      return anchorNode
    } else if ($isCodeNode(parentNode)) {
      return parentNode
    }

    return null
  }

  #codeNodeWasSelected(codeNode) {
    const language = codeNode.getLanguage()

    this.#updateLanguagePickerWith(language)
    this.#showLanguagePicker()
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

  #showLanguagePicker() {
    this.hidden = false
  }

  #hideLanguagePicker() {
    this.hidden = true
  }
}

export default CodeLanguagePicker
