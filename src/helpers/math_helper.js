import katex from "katex"

export function renderMath(latex, { displayMode = false } = {}) {
  try {
    return katex.renderToString(latex, { displayMode, throwOnError: false, output: "html" })
  } catch {
    return `<span class="lexxy-math-error">${escapeHtml(latex)}</span>`
  }
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
