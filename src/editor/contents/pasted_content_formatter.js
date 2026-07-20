export default class PastedContentFormatter {
  constructor(doc) {
    this.doc = doc
  }

  format() {
    this.#stripStyleElements()
    this.#unwrapPlaceholderAnchors()
    this.#stripTableCellColorStyles()
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

  // Only <li> is a valid child of a list; drop stray <br>/whitespace so the
  // import doesn't wrap them into an empty leading item.
  #stripStrayListChildren() {
    for (const list of this.doc.querySelectorAll("ol, ul")) {
      for (const child of Array.from(list.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "LI") continue
        list.removeChild(child)
      }
    }
  }
}
