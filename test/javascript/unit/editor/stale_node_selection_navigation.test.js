import { afterEach, describe, expect, test } from "vitest"
import {
  $createNodeSelection, $createParagraphNode, $getNodeByKey, $getRoot, $setSelection,
  KEY_ARROW_DOWN_COMMAND, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_RIGHT_COMMAND, KEY_ARROW_UP_COMMAND
} from "lexical"
import { createTestEditor, destroyTestEditor, setContent } from "../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

const ARROWS = [
  [ "ArrowRight", KEY_ARROW_RIGHT_COMMAND ],
  [ "ArrowLeft", KEY_ARROW_LEFT_COMMAND ],
  [ "ArrowUp", KEY_ARROW_UP_COMMAND ],
  [ "ArrowDown", KEY_ARROW_DOWN_COMMAND ]
]

function pressArrow(command, key) {
  editorElement.editor.dispatchCommand(command, new KeyboardEvent("keydown", { key, cancelable: true }))
}

// A committed NodeSelection can outlive the node it references (empty editor,
// just-deleted node, decorator boundary): hasNodeSelection reads the committed
// state while $getSelection() resolves against the pending one, so the pending
// selection's getNodes() can come back empty. The arrow-key handlers used to
// receive that unresolved node (undefined) and crash on selectPrevious /
// selectNext / getTopLevelElement (Sentry BC3-JS-N8HQ / N8HR / N8HS).
describe("arrow navigation with a stale node selection", () => {
  describe.each(ARROWS)("%s", (key, command) => {
    test("does not crash when the pending selection no longer resolves the node", async () => {
      editorElement = await createTestEditor()
      await setContent(editorElement, "<p>Hello</p><p>World</p>")

      // Commit a valid NodeSelection…
      let selectedKey
      editorElement.editor.update(() => {
        selectedKey = $getRoot().getLastChild().getKey()
        const selection = $createNodeSelection()
        selection.add(selectedKey)
        $setSelection(selection)
      }, { discrete: true })

      // …then schedule (non-discrete) a replacement, so the committed state
      // still resolves the node while the pending NodeSelection does not.
      editorElement.editor.update(() => {
        $getNodeByKey(selectedKey).replace($createParagraphNode())
      })

      expect(() => pressArrow(command, key)).not.toThrow()
    })

    test("does not crash when the committed selection references a node that never resolves", async () => {
      editorElement = await createTestEditor()
      await setContent(editorElement, "<p>Hello</p><p>World</p>")

      editorElement.editor.update(() => {
        const selection = $createNodeSelection()
        selection.add("9999")
        $setSelection(selection)
      }, { discrete: true })

      expect(() => pressArrow(command, key)).not.toThrow()
    })
  })
})
