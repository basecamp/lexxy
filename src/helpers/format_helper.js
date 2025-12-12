import { $isRangeSelection } from "lexical"
import { getStyleObjectFromCSS } from "@lexical/selection"
import { createElement } from "./html_helper"

export function isSelectionHighlighted(selection) {
  if (!$isRangeSelection(selection)) return false

  if (selection.isCollapsed()) {
    return hasHighlightStyles(selection.style)
  } else {
    return selection.hasFormat("highlight")
  }
}

export function hasHighlightStyles(cssOrStyles) {
  const styles = typeof cssOrStyles === "string" ? getStyleObjectFromCSS(cssOrStyles) : cssOrStyles
  return !!(styles.color || styles["background-color"])
}

export class StyleCanonicalizer {
  constructor(property, allowedValues= []) {
    this._property = property
    this._allowedValues = allowedValues
    this._canonicalValues = this.#allowedValuesIdentityObject
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
