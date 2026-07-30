import { describe, expect, test } from "vitest"
import { $getRoot, $setSelection, CONTROLLED_TEXT_INSERTION_COMMAND } from "lexical"
import { createTestEditor, destroyTestEditor, selectFirstText, setContent, tick } from "../helpers/editor_helper"

// macOS "Keyboard > Text Replacements" (and autocorrect) reach the editor as a beforeinput event
// with inputType "insertReplacementText", which Lexical forwards to CONTROLLED_TEXT_INSERTION_COMMAND
// carrying the event itself. jsdom's InputEvent has no getTargetRanges, so Lexical's beforeinput
// handling is inert here and we dispatch the command directly instead.
async function insertReplacementText(editorElement, text) {
  const event = new InputEvent("beforeinput", { inputType: "insertReplacementText", data: text })
  editorElement.editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, event)
  await tick()
}

function nodeTypes(editorElement) {
  return editorElement.editor.read(() => $getRoot().getFirstChild().getChildren().map((node) => node.getType()))
}

function insertTextWithLineBreaks(editorElement, text) {
  let result
  editorElement.editor.update(() => {
    result = editorElement.contents.insertTextWithLineBreaks(text)
  }, { discrete: true })

  return result
}

describe("insertReplacementText", () => {
  test("turns a newline into a line break instead of a literal newline", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>Hello</p>")
    selectFirstText(editorElement, "Hello".length)

    await insertReplacementText(editorElement, " Thanks,\nKyle")

    expect(nodeTypes(editorElement)).toEqual([ "text", "linebreak", "text" ])
    expect(editorElement.value).toBe("<p>Hello Thanks,<br>Kyle</p>")
    expect(editorElement.value).not.toContain("\n")

    await destroyTestEditor(editorElement)
  })

  test("keeps every line break of a multi-line replacement", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>Hi</p>")
    selectFirstText(editorElement, "Hi".length)

    await insertReplacementText(editorElement, "\nline two\nline three")

    expect(nodeTypes(editorElement)).toEqual([ "text", "linebreak", "text", "linebreak", "text" ])

    await destroyTestEditor(editorElement)
  })

  test("normalizes CRLF line endings", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>Hello</p>")
    selectFirstText(editorElement, "Hello".length)

    await insertReplacementText(editorElement, " Thanks,\r\nKyle")

    expect(editorElement.value).toBe("<p>Hello Thanks,<br>Kyle</p>")
    expect(editorElement.value).not.toContain("\r")

    await destroyTestEditor(editorElement)
  })

  // The return value is the command handler's: true stops Lexical, anything falsy lets it insert
  // the text normally, so every path that does not convert line breaks has to stay falsy.
  test("reports whether it converted line breaks", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>Hello</p>")
    selectFirstText(editorElement, "Hello".length)

    expect(insertTextWithLineBreaks(editorElement, " Thanks,\nKyle")).toBe(true)
    expect(insertTextWithLineBreaks(editorElement, " there")).toBe(false)
    expect(insertTextWithLineBreaks(editorElement, null)).toBe(false)

    await destroyTestEditor(editorElement)
  })

  test("reports false without a range selection", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>Hello</p>")

    let result
    editorElement.editor.update(() => {
      $setSelection(null)
      result = editorElement.contents.insertTextWithLineBreaks(" Thanks,\nKyle")
    }, { discrete: true })

    expect(result).toBe(false)
    expect(editorElement.value).toBe("<p>Hello</p>")

    await destroyTestEditor(editorElement)
  })

  // Plain typing and composition start dispatch the same command with a bare string, which is
  // never a replacement, so it must fall through to Lexical's own handler.
  test("leaves string payloads to Lexical", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>Hello</p>")
    selectFirstText(editorElement, "Hello".length)

    editorElement.editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, " there")
    await tick()

    expect(editorElement.value).toBe("<p>Hello there</p>")

    await destroyTestEditor(editorElement)
  })

  test("inserts single-line replacements unchanged", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>Hello</p>")
    selectFirstText(editorElement, "Hello".length)

    await insertReplacementText(editorElement, " there")

    expect(nodeTypes(editorElement)).toEqual([ "text" ])
    expect(editorElement.value).toBe("<p>Hello there</p>")

    await destroyTestEditor(editorElement)
  })
})
