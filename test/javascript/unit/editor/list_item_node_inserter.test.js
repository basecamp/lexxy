import { afterEach, describe, expect, test } from "vitest"
import { $createRangeSelection, $getRoot, $setSelection } from "lexical"
import { createTestEditor, destroyTestEditor, setContent } from "../helpers/editor_helper"
import NodeInserter from "src/editor/contents/node_inserter"
import ListItemNodeInserter from "src/editor/contents/node_inserter/list_item_node_inserter"
import { ActionTextAttachmentNode } from "src/nodes/action_text_attachment_node"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

// The inserter is chosen while the selection anchor sits inside a list item,
// but #insertAroundList calls removeText() before reading the anchor back —
// and the removal can relocate it onto the list node itself, or clean out of
// the list. That used to crash in $isBlankNode(undefined) (Sentry BC3-JS-N8G0).
describe("ListItemNodeInserter with a relocated anchor", () => {
  function insertAttachment(selectionFor) {
    editorElement.editor.update(() => {
      const selection = selectionFor()
      $setSelection(selection)
      const attachment = new ActionTextAttachmentNode({ contentType: "image/png", fileName: "photo.png" })
      NodeInserter.for(selection).insertNodes([ attachment ])
    }, { discrete: true })
  }

  test("splits at the anchor offset when removeText() collapses onto the list node", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<ul><li>One</li><li>Two</li><li>Three</li></ul>")

    // Anchoring inside the second item with the focus at the list's element
    // point selects ListItemNodeInserter, then removeText() collapses the
    // selection onto the list node itself — no top-level item resolves.
    const insert = () => insertAttachment(() => {
      const list = $getRoot().getFirstChild()
      const secondItemText = list.getChildAtIndex(1).getFirstChild()
      const selection = $createRangeSelection()
      selection.anchor.set(secondItemText.getKey(), 0, "text")
      selection.focus.set(list.getKey(), 1, "element")
      return selection
    })

    expect(insert).not.toThrow()
    expect(editorElement.value).toMatch(
      /^<ul><li[^>]*>One<\/li><\/ul><action-text-attachment[^>]*><\/action-text-attachment><ul><li[^>]*>Two<\/li><li[^>]*>Three<\/li><\/ul>$/
    )
  })

  test("falls back to default insertion when the anchor left the list entirely", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<ul><li>One</li></ul><p>After</p>")

    // Constructed directly: this is the post-removeText() shape where the
    // inserter was already chosen but the anchor no longer sits in any list,
    // which NodeInserter.for would no longer route here.
    editorElement.editor.update(() => {
      const paragraph = $getRoot().getLastChild()
      const selection = $createRangeSelection()
      selection.anchor.set(paragraph.getKey(), 0, "element")
      selection.focus.set(paragraph.getKey(), 0, "element")

      const attachment = new ActionTextAttachmentNode({ contentType: "image/png", fileName: "photo.png" })
      new ListItemNodeInserter(selection).insertNodes([ attachment ])
    }, { discrete: true })

    expect(editorElement.value).toMatch(
      /^<ul><li[^>]*>One<\/li><\/ul><p[^>]*>After<\/p><action-text-attachment[^>]*><\/action-text-attachment><p[^>]*>(<br>)?<\/p>$/
    )
  })
})
