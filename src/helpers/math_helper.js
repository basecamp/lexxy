import katex from "katex"

export function renderMath(latex, { displayMode = false } = {}) {
  try {
    return katex.renderToString(latex, { displayMode, throwOnError: false })
  } catch {
    return `<span class="lexxy-math-error">${escapeHtml(latex)}</span>`
  }
}

function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
  return String(text).replace(/[&<>"']/g, (ch) => map[ch])
}
