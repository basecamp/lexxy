import { $getSelection, $isRangeSelection, $isRootNode, BEFORE_INPUT_COMMAND, COMMAND_PRIORITY_HIGH, defineExtension } from "lexical"
import LexxyExtension from "./lexxy_extension"

const REVISION_INPUT_TYPES = new Set([ "insertText", "insertReplacementText" ])

// macOS and iOS dictation, autocorrect and spellcheck "Replace" revise text already in the editor
// with an insertText or insertReplacementText beforeinput whose target range names the text to
// replace. Dictation does it whenever it changes its mind about a word, and again for the whole
// phrase when the microphone turns off.
//
// Lexical only moves its selection to the target range when the selection is collapsed. Dictation
// can leave a different, non-collapsed selection behind, so the revision replaced that selection
// instead and the misheard words disappeared (facebook/lexical#6940). The target range is the
// browser's statement of what to replace, so this applies it first and lets Lexical's own
// handler insert the text.
//
// A collapsed selection is left to Lexical, which already applies the target range to it. Lexical
// also relies on the caret staying put when it rejects a replacement macOS Chrome sends after a
// handled Backspace.
export class DictationRevisionExtension extends LexxyExtension {
  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/dictation-revision",
      register: (editor) => editor.registerCommand(BEFORE_INPUT_COMMAND, $selectRevisionTargetRange, COMMAND_PRIORITY_HIGH)
    })
  }
}

function $selectRevisionTargetRange(event) {
  if (!REVISION_INPUT_TYPES.has(event.inputType)) return false

  const targetRange = event.getTargetRanges?.()[0]
  const selection = $getSelection()

  if (targetRange && !targetRange.collapsed && $isStaleRangeSelection(selection)) {
    selection.applyDOMRange(targetRange)
  }

  return false
}

function $isStaleRangeSelection(selection) {
  return $isRangeSelection(selection) && !selection.isCollapsed() && !$isRootNode(selection.anchor.getNode())
}
