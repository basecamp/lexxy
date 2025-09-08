import { createElement } from "./html_helper"

export function highlightAll() {
  const elements = document.querySelectorAll("code[data-language]")

  elements.forEach(preElement => {
    highlightElement(preElement)
  })
}

function highlightElement(preElement) {
  const language = preElement.getAttribute("data-language")

  let code = preElement.innerHTML.replace(/<br\s*\/?>/gi, "\n")

  const grammar = Prism.languages[language]
  if (!grammar) return

  // unescape HTML entities in the code block
  code = new DOMParser().parseFromString(code, "text/html").body.textContent || ""

  const highlightedHtml = Prism.highlight(code, grammar, language)

  const codeElement = createElement("code", { "data-language": language, innerHTML: highlightedHtml })
  preElement.replaceWith(codeElement)
}
