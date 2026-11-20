import { afterEach, describe, expect, test } from "vitest"
import { $getRoot } from "lexical"
import { $isTableNode } from "@lexical/table"
import { TableController } from "../../../../../src/elements/table/table_controller"
import { createTestEditor, destroyTestEditor, setContent } from "../../helpers/editor_helper"

let editorElement
let tableController

afterEach(async () => {
  tableController?.destroy()
  await destroyTestEditor(editorElement)
})

describe("TableController with merged cells", () => {
  test("currentColumnCells skips rows that have no cell at the column", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, `
      <table>
        <tr><td>a</td><td>b</td></tr>
        <tr><td colspan="2">merged</td></tr>
        <tr><td>c</td><td>d</td></tr>
      </table>
    `)

    tableController = new TableController(editorElement)
    editorElement.editor.getEditorState().read(() => {
      const table = $getRoot().getChildren().find($isTableNode)
      tableController.currentTableNodeKey = table.getKey()
      tableController.currentCellKey = table.getChildren()[0].getChildren()[1].getKey()
    })

    const cells = tableController.currentColumnCells

    expect(cells).not.toContain(null)
    expect(cells.map(cell => editorElement.editor.getEditorState().read(() => cell.getTextContent()))).toEqual([ "b", "d" ])
  })
})
