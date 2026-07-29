export default class PastedContentFormatter {
  constructor(doc) {
    this.doc = doc
  }

  format() {
    this.#stripStyleElements()
    this.#unwrapPlaceholderAnchors()
    this.#stripTableCellColorStyles()
    this.#rebuildOfficeLists()
    this.#unwrapWrappedListChildren()
    this.#nestStrayListChildren()
    this.#stripStrayListChildren()
    return this.doc
  }

  // Spreadsheets (e.g. Excel) copy a <style> block whose rules (td { color:
  // black }, .xlNN { ... }) cascade onto the imported text. That color rides
  // in through the cascade rather than an inline style, so it slips past both
  // the cell-level stripping below and the paste style canonicalizer, leaving
  // pasted tables with foreign text colors that don't adapt to the theme. Drop
  // foreign style sheets so nothing cascades into imported content.
  #stripStyleElements() {
    for (const style of this.doc.querySelectorAll("style")) {
      style.remove()
    }
  }

  // Anchors with non-meaningful hrefs (e.g. "#", "") appear in content copied
  // from rendered views where mentions and interactive elements are wrapped in
  // <a href="#"> tags. Unwrap them so their text content pastes as plain text
  // and real links are preserved.
  #unwrapPlaceholderAnchors() {
    for (const anchor of this.doc.querySelectorAll("a")) {
      const href = anchor.getAttribute("href") || ""
      if (href === "" || href === "#") {
        anchor.replaceWith(...anchor.childNodes)
      }
    }
  }

  // Table cells copied from a page inherit the source theme's inline color
  // styles (e.g. dark-mode backgrounds). Strip them so pasted tables adopt
  // the current theme instead of carrying stale colors.
  #stripTableCellColorStyles() {
    for (const cell of this.doc.querySelectorAll("td, th")) {
      cell.style.removeProperty("background-color")
      cell.style.removeProperty("background")
      cell.style.removeProperty("color")
    }
  }

  // Word and Outlook never emit <ul>/<ol>/<li>. They simulate lists with flat
  // paragraphs that declare their depth in an inline `mso-list:l0 level2 lfo1`
  // and carry the bullet or number glyph in a <span style="mso-list:Ignore">.
  // Nothing downstream understands either, so the items land as plain paragraphs
  // with the marker baked into the text. Rebuild real lists from the level each
  // paragraph declares.
  //
  // Everything this reads lives in inline attributes, so it stays correct after
  // #stripStyleElements has dropped Office's style sheet.
  #rebuildOfficeLists() {
    for (const run of this.#officeListRuns()) {
      this.#replaceWithLists(run)
    }
  }

  // A run is a stretch of Office list paragraphs that are siblings with nothing
  // but whitespace and Word's conditional comments between them. Anything else
  // in between (a heading, a plain paragraph) ends one list and starts another.
  #officeListRuns() {
    const runs = []
    const claimed = new Set()

    for (const paragraph of this.doc.querySelectorAll("p[style*='mso-list']")) {
      if (claimed.has(paragraph) || this.#officeListLevel(paragraph) === null) continue

      const run = []
      let node = paragraph
      while (node) {
        run.push(node)
        claimed.add(node)
        node = this.#nextOfficeListParagraph(node)
      }
      runs.push(run)
    }

    return runs
  }

  #nextOfficeListParagraph(paragraph) {
    let sibling = paragraph.nextSibling
    while (sibling && this.#isIgnorableBetweenOfficeListParagraphs(sibling)) {
      sibling = sibling.nextSibling
    }

    if (sibling && sibling.nodeType === Node.ELEMENT_NODE && this.#officeListLevel(sibling) !== null) {
      return sibling
    }

    return null
  }

  #isIgnorableBetweenOfficeListParagraphs(node) {
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
    const levels = paragraphs.map((paragraph) => this.#officeListLevel(paragraph))
    const baseLevel = Math.min(...levels)
    const roots = []
    const stack = []

    paragraphs.forEach((paragraph, index) => {
      const depth = levels[index] - baseLevel + 1
      const tagName = this.#officeListTagName(paragraph)

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

      stack[stack.length - 1].appendChild(this.#createOfficeListItem(paragraph))
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
  #officeListTagName(paragraph) {
    const marker = paragraph.querySelector("[style*='mso-list:Ignore']")
    const text = marker?.textContent || ""

    if (/\d/.test(text) || /^\(?[A-Za-z]+[.)]/.test(text)) {
      return "ol"
    }
    return "ul"
  }

  #createOfficeListItem(paragraph) {
    for (const marker of paragraph.querySelectorAll("[style*='mso-list:Ignore']")) {
      marker.remove()
    }

    const item = this.doc.createElement("li")
    item.append(...paragraph.childNodes)
    return item
  }

  #officeListLevel(element) {
    const match = /mso-list:[^;"']*\blevel(\d+)/.exec(element.getAttribute("style") || "")
    if (match) {
      return parseInt(match[1], 10)
    }
    return null
  }

  // Some sources wrap runs of <li>s in a stray element (e.g. a <div> directly
  // inside the list). Dissolve such wrappers so their items become direct
  // list children and any nested list they hide becomes visible to
  // #nestStrayListChildren below.
  #unwrapWrappedListChildren() {
    for (const list of this.doc.querySelectorAll("ol, ul")) {
      let wrapper = this.#wrappedListChild(list)
      while (wrapper) {
        wrapper.replaceWith(...wrapper.childNodes)
        wrapper = this.#wrappedListChild(list)
      }
    }
  }

  #wrappedListChild(list) {
    for (const child of list.children) {
      if (child.tagName !== "LI" && !this.#isNestedList(child) && this.#containsListItems(child)) {
        return child
      }
    }
    return null
  }

  // Some sources (e.g. Gmail) nest a sublist as a direct child of the parent
  // <ol>/<ul> instead of inside a <li>. Move each nested list into its
  // preceding <li> so the import preserves the nesting instead of dropping it.
  #nestStrayListChildren() {
    for (const list of this.doc.querySelectorAll("ol, ul")) {
      for (const child of Array.from(list.children)) {
        if (child.tagName !== "OL" && child.tagName !== "UL") continue

        const previousItem = child.previousElementSibling
        if (previousItem && previousItem.tagName === "LI") {
          previousItem.appendChild(child)
        }
      }
    }
  }

  // Only <li> is a valid child of a list. Unwrap remaining stray children
  // that still hold list items (a nested list with no preceding <li> to nest
  // under) so the items survive, and drop stray <br>/whitespace so the import
  // doesn't wrap them into an empty leading item.
  #stripStrayListChildren() {
    for (const list of this.doc.querySelectorAll("ol, ul")) {
      let stray = this.#firstStrayListChild(list)
      while (stray) {
        if (this.#containsListItems(stray)) {
          stray.replaceWith(...stray.childNodes)
        } else {
          stray.remove()
        }

        stray = this.#firstStrayListChild(list)
      }
    }
  }

  #firstStrayListChild(list) {
    for (const child of list.childNodes) {
      if (child.nodeType !== Node.ELEMENT_NODE || child.tagName !== "LI") {
        return child
      }
    }
    return null
  }

  #isNestedList(node) {
    return node.nodeType === Node.ELEMENT_NODE && (node.tagName === "OL" || node.tagName === "UL")
  }

  #containsListItems(node) {
    return node.nodeType === Node.ELEMENT_NODE && node.querySelector("li") !== null
  }
}
