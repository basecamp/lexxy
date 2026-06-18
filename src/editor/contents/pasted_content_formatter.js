export default class PastedContentFormatter {
  constructor(doc) {
    this.doc = doc
  }

  format() {
    this.#unwrapPlaceholderAnchors()
    this.#stripTableCellColorStyles()
    this.#stripStrayListChildren()
    this.#stripLeadingEmptyListItems()
    return this.doc
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

  // Editors such as HelpScout prefix a copied list with an empty first <li>,
  // which renders as a spurious leading number (and line break) once imported.
  // Drop empty items at the front while keeping intentional empty items further down.
  #stripLeadingEmptyListItems() {
    for (const list of this.doc.querySelectorAll("ol, ul")) {
      let firstItem = list.querySelector(":scope > li")
      while (firstItem && this.#isEmptyListItem(firstItem)) {
        firstItem.remove()
        firstItem = list.querySelector(":scope > li")
      }
    }
  }

  #isEmptyListItem(item) {
    return item.querySelector("ol, ul") === null && item.textContent.trim() === ""
  }
}
