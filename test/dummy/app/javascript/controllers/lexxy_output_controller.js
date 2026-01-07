import { Controller } from "@hotwired/stimulus"
import Prism from "prismjs"
import prettier from "prettier"
import htmlParser from "prettier/parser-html"

export default class extends Controller {
  static targets = [ "editor", "outputHtml", "outputText" ]

  connect() {
    this.refresh()
  }

  async loadContent(event) {
    const partial = event.currentTarget.dataset.partial
    if (!partial) return

    try {
      const response = await fetch(`/sandbox/load_content/${partial}`)
      const html = await response.text()
      this.editorTarget.value = html.trim()
      // Wait for the editor's async update to complete
      // Use requestAnimationFrame to ensure the DOM has updated
      await new Promise(resolve => requestAnimationFrame(resolve))
      this.refresh()
    } catch (error) {
      console.error("Error loading content:", error)
    }
  }

  async refresh(event) {
    const code = this.editorTarget.value.trim()
    let formattedCode = await prettier.format(code, {
      parser: "html",
      plugins: [ htmlParser ],
      printWidth: 80,
      tabWidth: 2,
      useTabs: false
    })

    const escaped = document.createElement("textarea")
    escaped.innerText = this.editorTarget.toString().trim()
    this.outputTextTarget.innerHTML = escaped.innerHTML
    escaped.remove()

    formattedCode = formattedCode.replace(/<br\s*\/>/g, '<br/>') // Remove space before self-closing slash for br tags
    const highlightedCode = Prism.highlight(formattedCode, Prism.languages.html, 'html')

    this.outputHtmlTarget.innerHTML = `<code class="language-html">${highlightedCode}</code>`
  }
}
