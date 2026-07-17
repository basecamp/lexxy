import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor, selectFirstText, setContent, tick } from "../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

async function applyCommandToFirstLine(command, payload) {
  await setContent(editorElement, "<p>Hello</p>")
  selectFirstText(editorElement, "Hello".length)

  editorElement.editor.dispatchCommand(command, payload)
  await tick()
}

describe("heading format commands", () => {
  test("dedicated commands apply the default headings", async () => {
    editorElement = await createTestEditor()

    await applyCommandToFirstLine("setFormatHeadingLarge")
    expect(editorElement.value).toContain("<h2>Hello</h2>")

    await applyCommandToFirstLine("setFormatHeadingMedium")
    expect(editorElement.value).toContain("<h3>Hello</h3>")

    await applyCommandToFirstLine("setFormatHeadingSmall")
    expect(editorElement.value).toContain("<h4>Hello</h4>")
  })

  test("dedicated commands map to the first configured headings", async () => {
    editorElement = await createTestEditor({ attributes: { headings: '["h1", "h5"]' } })

    await applyCommandToFirstLine("setFormatHeadingLarge")
    expect(editorElement.value).toContain("<h1>Hello</h1>")

    await applyCommandToFirstLine("setFormatHeadingMedium")
    expect(editorElement.value).toContain("<h5>Hello</h5>")
  })

  test("dedicated commands without a configured heading do nothing", async () => {
    editorElement = await createTestEditor({ attributes: { headings: '["h1", "h5"]' } })

    await applyCommandToFirstLine("setFormatHeadingSmall")
    expect(editorElement.value).toContain("<p>Hello</p>")
  })

  test("applyHeadingFormat applies the given tag", async () => {
    editorElement = await createTestEditor()

    await applyCommandToFirstLine("applyHeadingFormat", "h3")
    expect(editorElement.value).toContain("<h3>Hello</h3>")
  })
})
