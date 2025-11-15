import { Controller } from "@hotwired/stimulus"
import Prism from "prismjs"
import prettier from "prettier"
import htmlParser from "prettier/parser-html"

export default class extends Controller {
  static targets = [ "editor", "rendered", "output" ]

  connect() {
    this.refresh()
  }

  async refresh(event) {
    const code = this.editorTarget.value.trim()

    // Show rendered HTML
    if (this.hasRenderedTarget) {
      this.renderedTarget.innerHTML = code
    }

    // Show formatted source code
    let formattedCode = await prettier.format(code, {
      parser: "html",
      plugins: [ htmlParser ],
      printWidth: 80,
      tabWidth: 2,
      useTabs: false
    })

    formattedCode = formattedCode.replace(/<br\s*\/>/g, '<br/>') // Remove space before self-closing slash for br tags
    const highlightedCode = Prism.highlight(formattedCode, Prism.languages.html, 'html')
    this.outputTarget.innerHTML = `<pre><code class="language-html">${highlightedCode}</code></pre>`
  }
}
