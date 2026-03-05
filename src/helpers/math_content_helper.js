import { renderMath } from "./math_helper"

export function renderContentMath(container = document) {
  container.querySelectorAll(".math-inline[data-math], .math-block[data-math]").forEach(element => {
    const latex = element.getAttribute("data-math")
    if (!latex) return

    const displayMode = element.classList.contains("math-block")
    element.innerHTML = renderMath(latex, { displayMode })
  })
}
