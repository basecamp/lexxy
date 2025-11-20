import { $forEachSelectedTextNode, getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"

export default class Highlighter {
  constructor(editorElement) {
    this.editor = editorElement.editor
  }

  toggle(style) {
    this.editor.update(() => {
      $forEachSelectedTextNode(node => {
        this.#toggleNodeStyle(node, style)
        this.#syncHighlightWithStyle(node)
      })
    })
  }

  remove() {
    this.toggle({ "color": undefined, "background-color": undefined })
  }

  #toggleNodeStyle(node, styles) {
    // clone the object otherwise we're editing the cached version!
    const nodeStyles = { ...getStyleObjectFromCSS(node.getStyle()) }

    for (const attribute in styles) {
      if (nodeStyles[attribute] === styles[attribute]) {
        delete nodeStyles[attribute]
      } else {
        nodeStyles[attribute] = styles[attribute]
      }
    }

    node.setStyle(getCSSFromStyleObject(nodeStyles))
  }

  #syncHighlightWithStyle(node) {
    if (this.#hasHighlightStyles(node) !== node.hasFormat("highlight")) {
      node.toggleFormat("highlight")
    }
  }

  #hasHighlightStyles(node) {
    const styles = getStyleObjectFromCSS(node.getStyle())
    return !!(styles.color || styles["background-color"])
  }
}
