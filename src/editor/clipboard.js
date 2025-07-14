import { marked } from "marked"
import { isUrl } from "../helpers/string_helper";

export default class Clipboard {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.contents = editorElement.contents
  }

  paste(event) {
    const clipboardData = event.clipboardData

    if (!clipboardData) return false

    if (this.#isOnlyPlainTextPasted(clipboardData)) {
      this.#pastePlainText(clipboardData)
      return true
    }

    this.#handlePastedFiles(clipboardData)
  }

  #isOnlyPlainTextPasted(clipboardData) {
    const types = Array.from(clipboardData.types)
    return types.length === 1 && types[0] === "text/plain"
  }

  #pastePlainText(clipboardData) {
    const item = clipboardData.items[0]
    item.getAsString((text) => {
      if (isUrl(text) && this.contents.hasSelectedText()) {
        this.contents.createLinkWithSelectedText(text)
      } else {
        this.#pasteMarkdown(text)
        if (isUrl(text) && this.editorElement.unfurlUrl) {
          this.#fetchUnfurl(this.editorElement.unfurlUrl, text)
            .then(response => response.json())
            .then(data => this.contents.unfurlLink(text, data))
        }
      }
    })
  }

  #fetchUnfurl(unfurlUrl, linkUrl) {
    return fetch(unfurlUrl, {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type":     "application/json",
        "Accept":           "application/json"
      },
      body: JSON.stringify({ url: linkUrl })
    })
  }

  #pasteMarkdown(text) {
    const html = marked(text)
    this.contents.insertHtml(html)
  }

  #handlePastedFiles(clipboardData) {
    if (!this.editorElement.supportsAttachments) return

    for (const item of clipboardData.items) {
      const file = item.getAsFile()
      if (!file) continue

      this.contents.uploadFile(file)
    }
  }
}
