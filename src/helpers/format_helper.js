import { $isRangeSelection, $isTextNode } from "lexical"
import { getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"
import { createElement } from "./html_helper"

export function isSelectionHighlighted(selection) {
  if (!$isRangeSelection(selection)) return false

  if (selection.isCollapsed()) {
    return hasHighlightStyles(selection.style)
  } else {
    return selection.hasFormat("highlight")
  }
}

export function getHighlightStyles(selection) {
  if (!$isRangeSelection(selection)) return null

  let styles = getStyleObjectFromCSS(selection.style)
  if (!styles.color && !styles["background-color"]) {
    const anchorNode = selection.anchor.getNode()
    if ($isTextNode(anchorNode)) {
      styles = getStyleObjectFromCSS(anchorNode.getStyle())
    }
  }

  const color = styles.color || null
  const backgroundColor = styles["background-color"] || null
  if (!color && !backgroundColor) return null

  return { color, backgroundColor }
}

export function hasHighlightStyles(cssOrStyles) {
  const styles = typeof cssOrStyles === "string" ? getStyleObjectFromCSS(cssOrStyles) : cssOrStyles
  return !!(styles.color || styles["background-color"])
}

export function applyCanonicalizers(styles, canonicalizers = []) {
  return canonicalizers.reduce((css, canonicalizer) => {
    return canonicalizer.applyCanonicalization(css)
  }, styles)
}

export class StyleCanonicalizer {
  constructor(property, allowedValues= []) {
    this._property = property
    this._allowedValues = allowedValues
    this._canonicalValues = this.#allowedValuesIdentityObject
  }

  applyCanonicalization(css) {
    const styles = { ...getStyleObjectFromCSS(css) }

    styles[this._property] = this.getCanonicalAllowedValue(styles[this._property])
    if (!styles[this._property]) {
      delete styles[this._property]
    }

    return getCSSFromStyleObject(styles)
  }

  getCanonicalAllowedValue(value) {
    return this._canonicalValues[value] ||= this.#resolveCannonicalValue(value)
  }

  // Private

  get #allowedValuesIdentityObject() {
    return this._allowedValues.reduce((object, value) => ({ ...object, [value]: value }), {})
  }

  #resolveCannonicalValue(value) {
    let index = this.#computedAllowedValues.indexOf(value)
    index ||= this.#computedAllowedValues.indexOf(getComputedStyleForProperty(this._property, value))
    return index === -1 ? null : this._allowedValues[index]
  }

  get #computedAllowedValues() {
    return this._computedAllowedValues ||= this._allowedValues.map(
      value => getComputedStyleForProperty(this._property, value)
    )
  }
}

function getComputedStyleForProperty(property, value) {
  const style = `${property}: ${value};`

  // the element has to be attached to the DOM have computed styles
  const element = document.body.appendChild(createElement("span", { style: "display: none;" + style }))
  const computedStyle = window.getComputedStyle(element).getPropertyValue(property)
  element.remove()

  return computedStyle
}
