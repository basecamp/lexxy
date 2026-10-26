import { $createRangeSelection, $getNodeByKey, $getSelection, $isRangeSelection, $isTextNode, $setSelection } from "lexical"
import { $isCodeNode } from "@lexical/code"

const PUNCTUATION_OR_SPACE = /[^\w]/

// Supplements Lexical's built-in registerMarkdownShortcuts to handle the case
// where a user types a leading tag before text that already ends with a
// trailing tag (e.g. typing ` before `hello`` or ** before **hello**).
//
// Lexical's markdown shortcut handler only triggers format transformations when
// the closing tag is the character just typed. When the opening tag is typed
// instead (e.g. typing ` before `hello`` to form ``hello``), the built-in
// handler doesn't match because it looks backward from the cursor for an
// opening tag, but the cursor is right after it.
//
// This listener detects that scenario for ALL text format transformers
// (backtick, bold, italic, strikethrough, etc.) and applies the appropriate
// format.
export function registerMarkdownLeadingTagHandler(editor, transformers) {
  const textFormatTransformers = transformers
    .filter(t => t.type === "text-format")
    .sort((a, b) => b.tag.length - a.tag.length) // Longer tags first

  return editor.registerUpdateListener(({ tags, dirtyLeaves, editorState, prevEditorState }) => {
    if (tags.has("historic") || tags.has("collaboration")) return
    if (editor.isComposing()) return

    const selection = editorState.read($getSelection)
    const prevSelection = prevEditorState.read($getSelection)

    if (!$isRangeSelection(prevSelection) || !$isRangeSelection(selection) || !selection.isCollapsed()) return

    const anchorKey = selection.anchor.key
    const anchorOffset = selection.anchor.offset

    if (!dirtyLeaves.has(anchorKey)) return

    const anchorNode = editorState.read(() => $getNodeByKey(anchorKey))
    if (!$isTextNode(anchorNode)) return

    // Only trigger when cursor moved forward (typing)
    const prevOffset = prevSelection.anchor.key === anchorKey ? prevSelection.anchor.offset : 0
    if (anchorOffset <= prevOffset) return

    const textContent = editorState.read(() => anchorNode.getTextContent())

    // Try each transformer, longest tags first
    for (const transformer of textFormatTransformers) {
      const tag = transformer.tag
      const tagLen = tag.length

      // The typed characters must end at the cursor position and form the opening tag
      const openTagStart = anchorOffset - tagLen
      if (openTagStart < 0) continue

      const candidateOpenTag = textContent.slice(openTagStart, anchorOffset)
      if (candidateOpenTag !== tag) continue

      // Disambiguate from longer tags: if the character before the opening tag
      // is the same as the tag character, this might be part of a longer tag
      // (e.g. seeing `*` when the user is actually typing `**`)
      const tagChar = tag[0]
      if (openTagStart > 0 && textContent[openTagStart - 1] === tagChar) continue

      // Check intraword constraint: if intraword is false, the character before
      // the opening tag must be a space, punctuation, or the start of the text
      if (transformer.intraword === false && openTagStart > 0) {
        const beforeChar = textContent[openTagStart - 1]
        if (beforeChar && !PUNCTUATION_OR_SPACE.test(beforeChar)) continue
      }

      // Search forward for a closing tag in the same text node
      const searchStart = anchorOffset
      const closeTagIndex = textContent.indexOf(tag, searchStart)
      if (closeTagIndex < 0) continue

      // Disambiguate closing tag from longer tags: if the character right after
      // the closing tag is the same as the tag character, skip
      // (e.g. `*hello**` — the first `*` at index 6 is part of `**`)
      if (textContent[closeTagIndex + tagLen] === tagChar) continue

      // Also check if the character before the closing tag start is the same
      // tag character (e.g. the closing tag might be a suffix of a longer sequence)
      if (closeTagIndex > 0 && textContent[closeTagIndex - 1] === tagChar) continue

      // There must be content between the tags (not just empty or whitespace-adjacent)
      const innerStart = anchorOffset
      const innerEnd = closeTagIndex
      if (innerEnd <= innerStart) continue

      // No space immediately after opening tag
      if (textContent[innerStart] === " ") continue

      // No space immediately before closing tag
      if (textContent[innerEnd - 1] === " ") continue

      // Check intraword constraint for closing tag
      if (transformer.intraword === false) {
        const afterCloseChar = textContent[closeTagIndex + tagLen]
        if (afterCloseChar && !PUNCTUATION_OR_SPACE.test(afterCloseChar)) continue
      }

      editor.update(() => {
        const node = $getNodeByKey(anchorKey)
        if (!node || !$isTextNode(node)) return

        const parent = node.getParent()
        if (parent === null || $isCodeNode(parent)) return

        $applyFormatFromLeadingTag(node, openTagStart, transformer)
      })

      break // Only apply the first (longest) matching transformer
    }
  })
}

function $applyFormatFromLeadingTag(anchorNode, openTagStart, transformer) {
  const tag = transformer.tag
  const tagLen = tag.length
  const textContent = anchorNode.getTextContent()

  const innerStart = openTagStart + tagLen
  const closeTagIndex = textContent.indexOf(tag, innerStart)
  if (closeTagIndex < 0) return

  const inner = textContent.slice(innerStart, closeTagIndex)
  if (inner.length === 0) return

  // Remove both tags and apply format
  const before = textContent.slice(0, openTagStart)
  const after = textContent.slice(closeTagIndex + tagLen)

  anchorNode.setTextContent(before + inner + after)

  const nextSelection = $createRangeSelection()
  $setSelection(nextSelection)

  // Select the inner text to apply formatting
  nextSelection.anchor.set(anchorNode.getKey(), openTagStart, "text")
  nextSelection.focus.set(anchorNode.getKey(), openTagStart + inner.length, "text")

  for (const format of transformer.format) {
    if (!nextSelection.hasFormat(format)) {
      nextSelection.formatText(format)
    }
  }

  // Collapse selection to end of formatted text and clear the format
  // so subsequent typing is plain text
  nextSelection.anchor.set(nextSelection.focus.key, nextSelection.focus.offset, nextSelection.focus.type)

  for (const format of transformer.format) {
    if (nextSelection.hasFormat(format)) {
      nextSelection.toggleFormat(format)
    }
  }
}
