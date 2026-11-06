import OfficeFormatter from "./pasted_content_formatter/office_formatter"

// Properties worth rescuing from a foreign style sheet before #stripStyleElements
// drops it, keyed by the elements that carry them. Word and Outlook declare
// paragraph spacing in the sheet (p.MsoNormal { margin: 0cm }) and never inline,
// so once the sheet goes there is nothing left to say how tightly the author's
// paragraphs sat, and hosts that turn pasted paragraph margins into explicit
// blank lines read tight Office paragraphs as spaced ones and multiply every
// line break.
const PRESERVABLE_STYLES = {
  p: [ "margin-top", "margin-bottom" ]
}

// Elements that show nothing once they hold no text, as in the spacer cells
// email layouts pad themselves with.
const SPACER_ELEMENTS = new Set([ "BR", "DIV", "P", "SPAN", "FONT", "CENTER", "A", "B", "STRONG", "I", "EM", "U" ])

export default class PastedContentFormatter {
  constructor(doc) {
    this.doc = doc
  }

  format() {
    this.#inlinePreservableStyles()
    this.#stripStyleElements()
    this.#stripInterchangeNewlines()
    this.#unwrapPlaceholderAnchors()
    this.#unwrapLayoutTables()
    this.#stripTableCellColorStyles()
    new OfficeFormatter(this.doc).format()
    this.#unwrapWrappedListChildren()
    this.#nestStrayListChildren()
    this.#stripStrayListChildren()
    this.#replaceGmailEmojiImgTags()
    return this.doc
  }

  // Runs before #stripStyleElements, to inline anything we still need
  // from an external style before we remove it
  #inlinePreservableStyles() {
    const rules = this.#styleRules()
    if (rules.length === 0) return

    for (const [ selector, properties ] of Object.entries(PRESERVABLE_STYLES)) {
      for (const element of this.doc.querySelectorAll(selector)) {
        this.#inlineDeclaredStyles(element, properties, rules)
      }
    }
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

  // Chrome and Safari append <br class="Apple-interchange-newline"> when the
  // copied selection ends at a line end (Google Docs does this on every copy).
  // It marks the end of the selection, not a line the author wrote, so left in
  // place it pastes as an extra empty paragraph. Only the trailing marker goes:
  // one at the start of the fragment is a real line boundary.
  #stripInterchangeNewlines() {
    for (const br of this.doc.querySelectorAll("br.Apple-interchange-newline")) {
      if (this.#isAtEndOfBody(br)) {
        br.remove()
      }
    }
  }

  #isAtEndOfBody(node) {
    for (let current = node; current && current !== this.doc.body; current = current.parentNode) {
      for (let sibling = current.nextSibling; sibling; sibling = sibling.nextSibling) {
        if (!this.#isIgnorableTrailingNode(sibling)) return false
      }
    }
    return true
  }

  #isIgnorableTrailingNode(node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      return true
    }
    return node.nodeType === Node.TEXT_NODE && node.textContent.trim() === ""
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

  // Email clients (Gmail, Apple Mail) and newsletters lay out messages with
  // tables: a full-width wrapper, a fixed-width body, single-cell rows, often
  // nested several deep. They hold the message, not tabular data, and imported
  // as real tables they paste as a table inside a table that the author never
  // wrote. Dissolve each layout table into its cells' content, outermost first,
  // so a data table inside one is still judged on its own and survives.
  #unwrapLayoutTables() {
    const nestedInLayout = new WeakSet()

    let table = this.#firstLayoutTable(nestedInLayout)
    while (table) {
      for (const nested of table.querySelectorAll("table")) {
        nestedInLayout.add(nested)
      }
      this.#unwrapTable(table)
      table = this.#firstLayoutTable(nestedInLayout)
    }
  }

  #firstLayoutTable(nestedInLayout) {
    for (const table of this.doc.querySelectorAll("table")) {
      if (this.#isLayoutTable(table, nestedInLayout.has(table))) return table
    }
    return null
  }

  // A layout table often says so with its role, and rarely holds data, so one
  // holding another table is layout too, unless it declares itself tabular with
  // header cells or a table role. Inside a layout table, a single-column table
  // is one more layout row; pasted on its own it may be a column copied from a
  // spreadsheet, so it stays a table.
  #isLayoutTable(table, nestedInLayout) {
    const role = table.getAttribute("role")
    if (role === "presentation" || role === "none") return true
    if (this.#isExplicitlyTabular(table)) return false

    return table.querySelector("table") !== null || (nestedInLayout && this.#isSingleColumn(table))
  }

  #isExplicitlyTabular(table) {
    const role = table.getAttribute("role")
    return role === "table" || role === "grid" || role === "treegrid" ||
      this.#ownCells(table).some((cell) => cell.tagName === "TH")
  }

  #isSingleColumn(table) {
    return Array.from(table.rows).every((row) => row.cells.length <= 1)
  }

  // The caption and each cell become a block of their own, so the text of
  // neighbouring cells doesn't run together. Cells with nothing to show are
  // spacers and go.
  #unwrapTable(table) {
    const blocks = []
    for (const part of [ ...this.#ownCaptions(table), ...this.#ownCells(table) ]) {
      if (this.#hasVisibleContent(part)) {
        const block = this.doc.createElement("div")
        block.append(...part.childNodes)
        blocks.push(block)
      }
    }
    table.replaceWith(...blocks)
  }

  #ownCaptions(table) {
    return Array.from(table.children).filter((child) => child.tagName === "CAPTION")
  }

  // Only this table's cells, not those of the tables nested inside them.
  #ownCells(table) {
    return Array.from(table.querySelectorAll("td, th")).filter((cell) => cell.closest("table") === table)
  }

  // Spacer cells hold at most whitespace, line breaks and empty wrappers. Any
  // other element, such as an image, a video or an attachment that renders from
  // its attributes, is content.
  #hasVisibleContent(cell) {
    return cell.textContent.trim() !== "" ||
      Array.from(cell.querySelectorAll("*")).some((element) => !SPACER_ELEMENTS.has(element.tagName))
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

  // Read the rules from a sheet we build rather than from this.doc.styleSheets: the
  // document came from DOMParser, so it has no browsing context, and WebKit leaves
  // its styleSheets empty. Parsing the text ourselves still expands the shorthands
  // Word writes (margin: 0cm) into the longhands we ask for.
  #styleRules() {
    const css = Array.from(this.doc.querySelectorAll("style"), (style) => style.textContent).join("\n")
    if (css.trim() === "") return []

    const sheet = new CSSStyleSheet()
    sheet.replaceSync(css)

    const rules = []
    for (const rule of sheet.cssRules) {
      if (rule instanceof CSSStyleRule) {
        rules.push(rule)
      }
    }
    return rules
  }

  // A declaration the element already carries inline is the author's own and wins.
  #inlineDeclaredStyles(element, properties, rules) {
    for (const property of properties) {
      if (element.style.getPropertyValue(property) === "") {
        const value = this.#declaredValue(rules, element, property)
        if (value) {
          this.#appendStyleProperty(element, property, value)
        }
      }
    }
  }

  // Source order alone doesn't decide the cascade, so when the matching rules
  // disagree we can't say which value wins without resolving specificity. Skip
  // the property rather than guess: guessing is permanent, since the sheet is
  // about to go, and skipping only leaves the host on its own default.
  #declaredValue(rules, element, property) {
    const declared = new Set()
    for (const rule of rules) {
      const value = rule.style.getPropertyValue(property)
      if (value !== "" && element.matches(rule.selectorText)) {
        declared.add(value)
      }
    }

    if (declared.size === 1) {
      return declared.values().next().value
    } else {
      return null
    }
  }

  // Assigning through element.style would reserialize the style attribute and
  // drop the mso-* declarations Word leaves inline (they aren't valid CSS),
  // and OfficeFormatter still needs to read mso-list from them. Append to the
  // attribute instead so the original declarations survive untouched.
  #appendStyleProperty(element, property, value) {
    const style = element.getAttribute("style")
    const declaration = `${property}:${value}`
    if (style === null || style.trim() === "") {
      element.setAttribute("style", declaration)
    } else {
      element.setAttribute("style", `${style.replace(/;\s*$/, "")};${declaration}`)
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

  // Emoji in gmail: <img data-emoji="😂" class="an1" alt="😂" aria-label="😂" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/17.0/1f602/32.png" loading="lazy" style="height: 1.2em; width: 1.2em; vertical-align: middle;">
  #replaceGmailEmojiImgTags() {
    for (const emojiImg of this.doc.querySelectorAll("img[data-emoji]")) {
      const emoji = emojiImg.dataset.emoji
      if (emoji === emojiImg.alt) {
        emojiImg.replaceWith(emoji)
      }
    }
  }
}
