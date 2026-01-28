import { Controller } from "@hotwired/stimulus"
import Prism from "prismjs"
import prettier from "prettier"
import htmlParser from "prettier/parser-html"

export default class extends Controller {
  static targets = [ "editor", "outputHtml", "outputText" ]
  static values = { template: String }

  connect() {
    // Load template from URL if specified (and different from initial content)
    const templateFromUrl = this.getTemplateFromUrl()
    if (templateFromUrl && templateFromUrl !== this.templateValue) {
      this.loadContentByName(templateFromUrl)
    } else {
      this.refresh()
    }
  }

  getTemplateFromUrl() {
    // Check for /sandbox/:template path format
    const pathMatch = window.location.pathname.match(/^\/sandbox\/([^\/]+)$/)
    if (pathMatch) {
      return pathMatch[1]
    }
    return null
  }

  updateUrl(template) {
    const newPath = template === "default" ? "/sandbox" : `/sandbox/${template}`
    window.history.replaceState({}, "", newPath)
  }

  async loadContent({ params: { partial } }) {
    await this.loadContentByName(partial)
  }

  async loadContentByName(partial) {
    const response = await fetch(`/demo_contents/${partial}`)
    const html = await response.text()
    this.editorTarget.value = html.trim()
    this.updateUrl(partial)
    await new Promise(resolve => requestAnimationFrame(resolve))
    this.refresh()
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
