import { $isRangeSelection } from "lexical"
import { getStyleObjectFromCSS } from "@lexical/selection"

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
