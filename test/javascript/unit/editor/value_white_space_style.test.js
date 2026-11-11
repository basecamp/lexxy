import { afterAll, afterEach, beforeAll, expect, test } from "vitest"
import { $getRoot, ParagraphNode } from "lexical"
import { $generateHtmlFromNodes } from "@lexical/html"
import Lexxy from "src/config/lexxy"
import LexxyExtension from "src/extensions/lexxy_extension"
import { createTestEditor, destroyTestEditor, tick } from "../helpers/editor_helper"

// Formatted text is exported with white-space: pre-wrap for HTML copied to other
// apps, and the value leaves it out. A white-space style an extension's node
// exports on purpose, with a matching allowlist, stays in the value.

class PreLineParagraphExtension extends LexxyExtension {
  get enabled() {
    return this.editorConfig.get("preLine") === true
  }

  get allowedStyles() {
    return [ { property: "white-space", values: [ "pre-line" ] } ]
  }

  get lexicalExtension() {
    return this.defineExtension({
      name: "test/pre-line-paragraphs",
      html: {
        export: new Map([ [ ParagraphNode, (editor, node) => {
          const output = node.exportDOM(editor)
          output.element.style.whiteSpace = "pre-line"
          return output
        } ] ])
      }
    })
  }
}

let previousExtensions, editorElement

beforeAll(() => {
  previousExtensions = Lexxy.global.get("extensions")
  Lexxy.configure({ global: { extensions: [ PreLineParagraphExtension ] }, preLine: { preLine: true } })
})

afterAll(() => {
  Lexxy.configure({ global: { extensions: previousExtensions } })
})

afterEach(async () => {
  await destroyTestEditor(editorElement)
  editorElement = undefined
})

async function edit(element) {
  element.editor.update(() => {
    $getRoot().getLastDescendant()?.select().insertText("!")
  }, { discrete: true })
  await tick()
}

test("the value leaves out formatted text's white-space style", async () => {
  editorElement = await createTestEditor({ value: "<p><strong>Bold</strong> text</p>" })
  await edit(editorElement)

  expect(editorElement.value).toBe("<p><strong>Bold</strong> text!</p>")
})

test("HTML exported for the clipboard keeps formatted text's white-space style", async () => {
  editorElement = await createTestEditor({ value: "<p><strong>Bold</strong> text</p>" })

  const html = editorElement.editor.read(() => $generateHtmlFromNodes(editorElement.editor, null))

  expect(html).toContain("white-space: pre-wrap")
})

test("the value keeps a white-space style an extension's node exports", async () => {
  editorElement = await createTestEditor({ value: "<p><strong>Bold</strong> text</p>", attributes: { preset: "preLine" } })
  await edit(editorElement)

  expect(editorElement.value).toBe('<p style="white-space: pre-line;"><strong>Bold</strong> text!</p>')
})
