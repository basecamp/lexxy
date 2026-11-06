import { isCodeLanguageLoaded, normalizeCodeLanguage } from "@lexical/code-prism"

const TRIX_LANGUAGE_ATTR = "language"

// Lexical reads a code block's language from data-language alone. Trix writes it
// as `language` on <pre>, and markdown renderers as `lang` on <pre> or as a
// `language-*` class on its <code>.
export function importedCodeLanguage(preElement) {
  if (preElement.hasAttribute("data-language")) {
    return preElement.getAttribute("data-language")
  } else if (preElement.hasAttribute(TRIX_LANGUAGE_ATTR)) {
    return normalizeCodeLanguage(preElement.getAttribute(TRIX_LANGUAGE_ATTR))
  } else {
    return markdownCodeLanguage(preElement)
  }
}

function markdownCodeLanguage(preElement) {
  const language = normalizeCodeLanguage(preElement.getAttribute("lang") || codeLanguageClass(preElement) || "")

  if (isCodeLanguageLoaded(language)) {
    return language
  } else {
    return null
  }
}

function codeLanguageClass(preElement) {
  const code = preElement.querySelector(":scope > code")
  const languageClass = Array.from(code?.classList ?? []).find(name => name.startsWith("language-"))
  return languageClass?.replace("language-", "")
}
