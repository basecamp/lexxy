export default class PastedContentFormatter {
  constructor(doc) {
    this.doc = doc
  }

  format() {
    this.#stripStyleElements()
    this.#unwrapPlaceholderAnchors()
    this.#stripTableCellColorStyles()
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
