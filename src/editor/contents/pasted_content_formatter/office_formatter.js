// Word and Outlook never emit <ul>/<ol>/<li>. They simulate lists with flat
// paragraphs that declare their depth in an inline `mso-list:l0 level2 lfo1`
// and carry the bullet or number glyph in a <span style="mso-list:Ignore">.
// Nothing downstream understands either, so the items land as plain paragraphs
// with the marker baked into the text. Rebuild real lists from the level each
// paragraph declares.
//
// Everything this reads lives in inline attributes, so it stays correct after
// the pasted content formatter has dropped Office's style sheet.
export default class OfficeFormatter {
  constructor(doc) {
    this.doc = doc
  }

  format() {
    for (const run of this.#listRuns()) {
      this.#replaceWithLists(run)
    }
  }

  // A run is a stretch of Office list paragraphs that are siblings with nothing
  // but whitespace and Word's conditional comments between them. Anything else
  // in between (a heading, a plain paragraph) ends one list and starts another.
  #listRuns() {
    const runs = []
    const claimed = new Set()

    for (const paragraph of this.doc.querySelectorAll("p[style*='mso-list']")) {
      if (claimed.has(paragraph) || this.#listLevel(paragraph) === null) continue

      const run = []
      let node = paragraph
      while (node) {
        run.push(node)
        claimed.add(node)
        node = this.#nextListParagraph(node)
      }
      runs.push(run)
    }

    return runs
  }

  #nextListParagraph(paragraph) {
    let sibling = paragraph.nextSibling
    while (sibling && this.#isIgnorableBetweenListParagraphs(sibling)) {
      sibling = sibling.nextSibling
    }

    if (sibling && sibling.nodeType === Node.ELEMENT_NODE && this.#listLevel(sibling) !== null) {
      return sibling
    }

    return null
  }

  #isIgnorableBetweenListParagraphs(node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      return true
    }
    return node.nodeType === Node.TEXT_NODE && node.textContent.trim() === ""
  }

  // Word numbers levels from 1, but a copied selection often starts partway down
  // a list, so every paragraph declares level3 with no level1 above it. Anchoring
  // the run at its own shallowest level is what keeps the result from arriving
  // needlessly deep.
  #replaceWithLists(paragraphs) {
    const levels = paragraphs.map((paragraph) => this.#listLevel(paragraph))
    const baseLevel = Math.min(...levels)
    const roots = []
    const stack = []

    paragraphs.forEach((paragraph, index) => {
      const depth = levels[index] - baseLevel + 1
      const tagName = this.#listTagName(paragraph)

      while (stack.length > depth) {
        stack.pop()
      }
      if (stack.length === depth && stack[depth - 1].tagName !== tagName.toUpperCase()) {
        stack.pop()
      }

      while (stack.length < depth) {
        const list = this.doc.createElement(tagName)
        if (stack.length === 0) {
          roots.push(list)
        } else {
          this.#lastItemOf(stack[stack.length - 1]).appendChild(list)
        }
        stack.push(list)
      }

      stack[stack.length - 1].appendChild(this.#createListItem(paragraph))
    })

    paragraphs[0].replaceWith(...roots)
    for (const paragraph of paragraphs.slice(1)) {
      paragraph.remove()
    }
  }

  #lastItemOf(list) {
    if (!list.lastElementChild) {
      list.appendChild(this.doc.createElement("li"))
    }
    return list.lastElementChild
  }

  // Word writes bullets as the raw glyph of the marker font (Symbol's "·",
  // Wingdings' "§", Courier New's "o") and numbers as the rendered counter
  // ("1.", "a)", "iv)"). A bare letter with no delimiter after it is Courier
  // New's bullet, not a counter, so the delimiter is what tells them apart.
  #listTagName(paragraph) {
    const marker = paragraph.querySelector("[style*='mso-list:Ignore']")
    const text = marker?.textContent || ""

    if (/\d/.test(text) || /^\(?[A-Za-z]+[.)]/.test(text)) {
      return "ol"
    }
    return "ul"
  }

  #createListItem(paragraph) {
    for (const marker of paragraph.querySelectorAll("[style*='mso-list:Ignore']")) {
      marker.remove()
    }

    const item = this.doc.createElement("li")
    item.append(...paragraph.childNodes)
    return item
  }

  #listLevel(element) {
    const match = /mso-list:[^;"']*\blevel(\d+)/.exec(element.getAttribute("style") || "")
    if (match) {
      return parseInt(match[1], 10)
    }
    return null
  }
}
