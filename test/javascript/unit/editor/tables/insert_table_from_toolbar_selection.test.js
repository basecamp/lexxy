import { afterEach, expect, test, vi } from "vitest"
import { $getRoot, $getSelection, $isRangeSelection, SKIP_DOM_SELECTION_TAG } from "lexical"
import { $isTableCellNode } from "@lexical/table"
import { $findMatchingParent } from "@lexical/utils"
import { createTestEditor, destroyTestEditor, setContent, tick } from "../../helpers/editor_helper"

// jsdom has no layout: give Lexical's caret and edge checks a one-line box.
const RECT = { top: 0, bottom: 20, left: 0, right: 100, height: 20, width: 100, x: 0, y: 0 }
Range.prototype.getBoundingClientRect ??= () => RECT
Range.prototype.getClientRects ??= () => [ RECT ]

let editorElement, tableButton

afterEach(async () => {
  vi.restoreAllMocks()
  tableButton?.remove()
  await destroyTestEditor(editorElement)
})

// Browsers keep window.event set through the microtasks a listener queues, so
// Lexical's commit, and the updates its listeners start, still see the click and
// keep the selection the command set. jsdom clears it first, and Lexical then
// re-reads the page caret, which hides the bug. Restore browser behavior.
function asBrowserEventDispatch(event, callback) {
  const windowEvent = vi.spyOn(window, "event", "get").mockReturnValue(event)
  callback()
  queueMicrotask(() => windowEvent.mockRestore())
}

function caretPosition() {
  return editorElement.editor.getEditorState().read(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return null

    const cell = $findMatchingParent(selection.anchor.getNode(), $isTableCellNode)
    if (!cell) return { paragraph: selection.anchor.getNode().getTopLevelElement().getTextContent() }

    return { row: cell.getParent().getIndexWithinParent(), column: cell.getIndexWithinParent() }
  })
}

// Keyboard flow: type above, Shift+Tab to the toolbar, Enter on "Insert a table"
// (the button keeps focus), Tab back, ArrowDown. With focus outside the editor
// the page caret stays on the line above, so the editor's selection must stay
// there too rather than move into the first header cell; otherwise Lexical
// reads ArrowDown as "leave the header cell downward" and the caret lands in
// row 2.
test("inserting a table from the keyboard keeps the selection on the caret above it", async () => {
  editorElement = await createTestEditor()
  await setContent(editorElement, "<p>Before the table</p>")

  const root = editorElement.editor.getRootElement()
  root.focus()
  editorElement.editor.update(() => { $getRoot().getFirstChild().selectEnd() }, { discrete: true })

  // Stands in for the toolbar's "Insert a table" button, dispatching the way
  // LexxyToolbar#dispatchButtonCommand does for a keyboard activation.
  tableButton = document.createElement("button")
  tableButton.addEventListener("click", (event) => {
    asBrowserEventDispatch(event, () => {
      editorElement.editor.update(() => {
        editorElement.editor.dispatchCommand("insertTable")
      }, { tag: SKIP_DOM_SELECTION_TAG })
    })
  })
  document.body.appendChild(tableButton)
  tableButton.focus()
  // Browsers leave the page caret in the editor when a toolbar button takes
  // focus; jsdom moves it to the button. Put it back where Chrome keeps it.
  const text = document.createTreeWalker(root.querySelector("p"), NodeFilter.SHOW_TEXT).nextNode()
  document.getSelection().collapse(text, text.length)
  await tick()
  expect(caretPosition()).toEqual({ paragraph: "Before the table" })

  // Enter on a focused button fires a click
  tableButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 0 }))
  await tick()

  expect(root.querySelector("table")).not.toBeNull()
  expect(document.activeElement).toBe(tableButton)
  expect(document.getSelection().anchorNode).toBe(text)
  expect(document.getSelection().anchorOffset).toBe(text.length)

  // Tab back into the editor. Chrome and current WebKit move focus without
  // touching the page caret, so no selectionchange fires. jsdom's focus() and
  // blur() move or clear the caret, so move focus by hand.
  vi.spyOn(document, "activeElement", "get").mockReturnValue(root)
  root.dispatchEvent(new FocusEvent("focus"))
  await tick()

  expect(caretPosition()).toEqual({ paragraph: "Before the table" })

  // ArrowDown must not be consumed as "exit the header cell downward"
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(RECT)
  root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }))
  await tick()

  expect(caretPosition()).not.toEqual({ row: 1, column: 0 })
})
