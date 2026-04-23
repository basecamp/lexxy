import { $cloneWithProperties, $getEditor, $getNodeByKey, COMMAND_PRIORITY_EDITOR, HISTORY_MERGE_TAG, SKIP_DOM_SELECTION_TAG, SKIP_SCROLL_INTO_VIEW_TAG, createCommand, defineExtension } from "lexical"
import { HistoryExtension } from "@lexical/history"

import LexxyExtension from "./lexxy_extension"
import { isEditorFocused } from "../helpers/lexical_helper"

// Payload: Record<nodeKey, { patch?, replace? }>
//   - patch: plain object, shallow-merged into the existing node's properties
//   - replace: a LexicalNode instance that replaces the node
export const REWRITE_HISTORY_COMMAND = createCommand("REWRITE_HISTORY_COMMAND")

export class RewritableHistoryExtension extends LexxyExtension {
  #historyState = null

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/rewritable-history",
      dependencies: [ HistoryExtension ],
      register: (editor, _config, state) => {
        const historyOutput = state.getDependency(HistoryExtension).output
        this.#historyState = historyOutput.historyState.value

        return editor.registerCommand(
          REWRITE_HISTORY_COMMAND,
          (rewrites) => this.#rewriteHistory(rewrites),
          COMMAND_PRIORITY_EDITOR
        )
      }
    })
  }

  get historyState() {
    return this.#historyState
  }

  get #allHistoryEntries() {
    const entries = Array.from(this.#historyState.undoStack)
    if (this.#historyState.current) entries.push(this.#historyState.current)
    return entries.concat(this.#historyState.redoStack)
  }

  #rewriteHistory(rewrites) {
    this.#applyRewritesImmediatelyToCurrentState(rewrites)
    this.#applyRewritesToHistory(rewrites)

    return true
  }

  #applyRewritesImmediatelyToCurrentState(rewrites) {
    $getEditor().update(() => {
      for (const [ nodeKey, { patch, replace } ] of Object.entries(rewrites)) {
        const node = $getNodeByKey(nodeKey)
        if (!node) continue

        if (patch) Object.assign(node.getWritable(), patch)
        if (replace) node.replace(replace)
      }
    }, { discrete: true, tag: this.#getBackgroundUpdateTags() })
  }

  #applyRewritesToHistory(rewrites) {
    const nodeKeys = Object.keys(rewrites)

    for (const entry of this.#allHistoryEntries) {
      if (!this.#entryHasSomeKeys(entry, nodeKeys)) continue

      const editorState = entry.editorState = safeCloneEditorState(entry.editorState)

      for (const [ nodeKey, { patch, replace } ] of Object.entries(rewrites)) {
        const node = editorState._nodeMap.get(nodeKey)
        if (!node) continue

        if (patch) {
          this.#patchNodeInEditorState(editorState, node, patch)
        } else if (replace) {
          this.#replaceNodeInEditorState(editorState, node, replace)
        }
      }
    }
  }

  #entryHasSomeKeys(entry, nodeKeys) {
    return nodeKeys.some(key => entry.editorState._nodeMap.has(key))
  }

  #getBackgroundUpdateTags() {
    const tags = [ HISTORY_MERGE_TAG, SKIP_SCROLL_INTO_VIEW_TAG ]
    if (!isEditorFocused(this.editorElement.editor)) { tags.push(SKIP_DOM_SELECTION_TAG) }
    return tags
  }

  #patchNodeInEditorState(editorState, node, patch) {
    editorState._nodeMap.set(node.__key, $cloneNodeWithPatch(node, patch))
  }

  #replaceNodeInEditorState(editorState, node, replaceWith) {
    editorState._nodeMap.set(node.__key, $cloneNodeAdoptingKeys(replaceWith, node))
  }
}

function $cloneNodeWithPatch(node, patch) {
  const clone = $cloneWithProperties(node)
  Object.assign(clone, patch)
  return clone
}

function $cloneNodeAdoptingKeys(node, previousNode) {
  const clone = $cloneWithProperties(node)
  clone.__key = previousNode.__key
  clone.__parent = previousNode.__parent
  clone.__prev = previousNode.__prev
  clone.__next = previousNode.__next
  return clone
}

// EditorState#clone() keeps the same map reference.
// A new Map is needed to prevent editing Lexical's internal map
// Warning: this bypasses DEV's safety map freezing
function safeCloneEditorState(editorState) {
  const clone = editorState.clone()
  clone._nodeMap = new Map(editorState._nodeMap)
  return clone
}
