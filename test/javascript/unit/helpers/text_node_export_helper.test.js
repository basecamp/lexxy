import { afterEach, describe, expect, test, vi } from "vitest"
import { $createTextNode, TextNode } from "lexical"
import { exportTextNodeDOM } from "../../../../src/helpers/text_node_export_helper"
import { createTestEditor, destroyTestEditor } from "./editor_helper"

let editorElement

afterEach(async () => {
  vi.restoreAllMocks()
  await destroyTestEditor(editorElement)
})

function exportText(text) {
  const editor = editorElement.editor
  let exported
  editor.update(() => {
    exported = exportTextNodeDOM(editor, $createTextNode(text))
  }, { discrete: true })
  return exported
}

describe("exportTextNodeDOM", () => {
  test("keeps consecutive spaces in a plain text node", async () => {
    editorElement = await createTestEditor()

    const { element } = exportText("a  b")

    expect(element.textContent).not.toBe("a  b")
    expect(element.textContent.replace(/ /g, " ")).toBe("a  b")
  })

  test("exports a text node whose DOM is an empty span without an element", async () => {
    editorElement = await createTestEditor()
    vi.spyOn(TextNode.prototype, "createDOM").mockImplementation(() => document.createElement("span"))

    const { element } = exportText("")

    expect(element).toBeNull()
  })
})
