export function caretRect(node, offset) {
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)

  const rect = range.getBoundingClientRect()
  if (rect.height > 0) {
    return rect
  } else {
    return null
  }
}

export function caretFromPoint(clientX, clientY) {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(clientX, clientY)
    if (position) return { node: position.offsetNode, offset: position.offset }
  } else if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(clientX, clientY)
    if (range) return { node: range.startContainer, offset: range.startOffset }
  }

  return null
}
