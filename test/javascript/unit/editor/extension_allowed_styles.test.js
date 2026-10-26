import { afterAll, afterEach, beforeAll, expect, test } from "vitest"
import { $getRoot } from "lexical"
import Lexxy from "src/config/lexxy"
import LexxyExtension from "src/extensions/lexxy_extension"
import { createTestEditor, destroyTestEditor, tick } from "../helpers/editor_helper"

// An extension's allowedStyles reach the editor that enabled it, and only that
// editor. An editor's `value` is sanitized on read, so this is what decides
// whether a style the extension produces survives into the submitted value.

class AlignmentExtension extends LexxyExtension {
  get enabled() {
    return this.editorConfig.get("alignment") === true
  }

  get allowedStyles() {
    return [ { property: "text-align", values: [ "left", "center", "right", "justify" ] } ]
  }
}

const CENTERED = '<p style="text-align: center;">centered</p>'

let previousExtensions, aligned, plain

beforeAll(() => {
  previousExtensions = Lexxy.global.get("extensions")
  Lexxy.configure({ global: { extensions: [ AlignmentExtension ] }, aligned: { alignment: true } })
})

afterAll(() => {
  Lexxy.configure({ global: { extensions: previousExtensions } })
})

afterEach(async () => {
  await destroyTestEditor(aligned)
  await destroyTestEditor(plain)
  aligned = plain = undefined
})

async function edit(editorElement) {
  editorElement.editor.update(() => {
    $getRoot().getLastDescendant()?.select().insertText("!")
  }, { discrete: true })
  await tick()
}

test("the editor with the extension keeps the declared style in its value", async () => {
  aligned = await createTestEditor({ value: CENTERED, attributes: { preset: "aligned" } })
  await edit(aligned)

  expect(aligned.value).toContain("text-align: center")
})

test("an editor without the extension strips it, even next to one that has it", async () => {
  aligned = await createTestEditor({ value: CENTERED, attributes: { preset: "aligned" } })
  plain = await createTestEditor({ value: CENTERED })
  await edit(aligned)
  await edit(plain)

  expect(aligned.value).toContain("text-align: center")
  expect(plain.value).not.toContain("text-align")
})
