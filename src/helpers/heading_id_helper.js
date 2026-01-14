import { parameterize } from "./string_helper"

export function assignHeadingIds(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html")
  const container = doc.body.firstChild

  const usedIds = new Map()
  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6")

  headings.forEach((heading) => {
    const baseSlug = parameterize(heading.textContent)
    if (!baseSlug) return

    let finalId = baseSlug
    if (usedIds.has(baseSlug)) {
      const count = usedIds.get(baseSlug) + 1
      usedIds.set(baseSlug, count)
      finalId = `${baseSlug}-${count}`
    } else {
      usedIds.set(baseSlug, 0)
    }

    heading.setAttribute("id", finalId)
  })

  return container.innerHTML
}
